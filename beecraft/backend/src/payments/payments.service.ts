import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrderMailerService } from './order-mailer.service';
import { describeExtras, toPublicItem } from './order-view';

/** Limites do MB WAY na Stripe: 0,50 € a 5.000 €. */
export const MBWAY_MIN_CENTS = 50;
export const MBWAY_MAX_CENTS = 500_000;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripeClient: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mailer: OrderMailerService,
  ) {}

  private get stripe(): Stripe {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException(
        'Pagamento online indisponível de momento',
      );
    }
    this.stripeClient ??= new Stripe(key);
    return this.stripeClient;
  }

  private toCents(total: unknown): number {
    return Math.round(Number(total) * 100);
  }

  /** Cria (ou reaproveita) a página de pagamento MB WAY da Stripe para uma encomenda. */
  async createCheckout(orderId: string): Promise<{ url: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Esta encomenda já foi paga');
    }
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Esta encomenda não aceita pagamento');
    }

    const cents = this.toCents(order.total);
    if (cents < MBWAY_MIN_CENTS || cents > MBWAY_MAX_CENTS) {
      throw new BadRequestException(
        'O MB WAY aceita pedidos entre 0,50 € e 5.000 €. Fale connosco pelo WhatsApp.',
      );
    }

    // Se já existe uma página de pagamento aberta, volta a usá-la.
    if (order.stripeSessionId) {
      try {
        const existing = await this.stripe.checkout.sessions.retrieve(
          order.stripeSessionId,
        );
        if (existing.status === 'open' && existing.url) {
          return { url: existing.url };
        }
      } catch (error) {
        this.logger.warn(`Sessão anterior não recuperada: ${String(error)}`);
      }
    }

    const storeUrl = (
      this.config.get<string>('PUBLIC_STORE_URL') ?? 'https://www.beecraft.pt'
    ).replace(/\/$/, '');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      allowed_payment_method_types: ['mb_way'],
      locale: 'pt',
      client_reference_id: order.id,
      customer_email: order.customer.email,
      line_items: order.items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: this.toCents(item.totalPrice),
          product_data: {
            name: `${item.productName} × ${item.quantity}`.slice(0, 250),
          },
        },
      })),
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      payment_intent_data: {
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      },
      success_url: `${storeUrl}/pedido/${order.id}?pago=1`,
      cancel_url: `${storeUrl}/carrinho?pagamento=cancelado`,
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id, paymentStatus: 'PENDING' },
    });

    if (!session.url) {
      throw new ServiceUnavailableException(
        'A Stripe não devolveu a página de pagamento',
      );
    }
    return { url: session.url };
  }

  /** Estado público do pagamento; os itens só aparecem depois de pago. */
  async getPaymentView(orderId: string) {
    const load = async () => {
      const found = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!found) throw new NotFoundException('Encomenda não encontrada');
      return found;
    };
    let order = await load();

    // Rede de segurança caso o webhook se atrase: pergunta directamente à Stripe.
    if (
      order.paymentStatus === 'PENDING' &&
      order.stripeSessionId &&
      this.config.get<string>('STRIPE_SECRET_KEY')
    ) {
      try {
        const session = await this.stripe.checkout.sessions.retrieve(
          order.stripeSessionId,
        );
        if (session.payment_status === 'paid') {
          await this.markPaid(session);
          order = await load();
        } else if (session.status === 'expired') {
          await this.markUnpaid(session, 'EXPIRED');
          order.paymentStatus = 'EXPIRED';
        }
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.warn(
          `Não foi possível confirmar na Stripe: ${String(error)}`,
        );
      }
    }

    const paid = order.paymentStatus === 'PAID';
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      items: paid ? order.items.map(toPublicItem) : [],
    };
  }

  /** Valida a assinatura e processa o evento recebido da Stripe. */
  async handleWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Webhook não configurado');
    }
    if (!rawBody || !signature) {
      throw new BadRequestException('Pedido de webhook inválido');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Assinatura do webhook inválida');
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (session.payment_status === 'paid') await this.markPaid(session);
        break;
      }
      case 'checkout.session.async_payment_failed':
        await this.markUnpaid(event.data.object, 'FAILED');
        break;
      case 'checkout.session.expired':
        await this.markUnpaid(event.data.object, 'EXPIRED');
        break;
      default:
        break;
    }
    return { received: true };
  }

  /** Marca a encomenda como paga (uma só vez) e avisa a BeeCraft por email. */
  async markPaid(session: Stripe.Checkout.Session) {
    const orderId = session.client_reference_id ?? session.metadata?.orderId;
    if (!orderId) {
      this.logger.error(`Sessão ${session.id} sem encomenda associada`);
      return;
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      this.logger.error(
        `Encomenda ${orderId} não existe (sessão ${session.id})`,
      );
      return;
    }
    if (
      session.currency !== 'eur' ||
      session.amount_total !== this.toCents(order.total)
    ) {
      this.logger.error(
        `Valor pago não corresponde à encomenda ${order.orderNumber}: ${session.amount_total} ${session.currency}`,
      );
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    await this.prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: 'PAID' } },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        ...(order.status === 'PENDING_PAYMENT' ? { status: 'PAID' } : {}),
      },
    });

    await this.notifyPaid(order.id);
  }

  private async markUnpaid(
    session: Stripe.Checkout.Session,
    paymentStatus: 'FAILED' | 'EXPIRED',
  ) {
    const orderId = session.client_reference_id ?? session.metadata?.orderId;
    if (!orderId) return;
    // Só altera se esta for a sessão actual e a encomenda ainda não estiver paga.
    await this.prisma.order.updateMany({
      where: {
        id: orderId,
        stripeSessionId: session.id,
        paymentStatus: 'PENDING',
      },
      data: { paymentStatus },
    });
  }

  /** Envia o email uma única vez; se falhar, a próxima confirmação tenta de novo. */
  private async notifyPaid(orderId: string) {
    const claimed = await this.prisma.order.updateMany({
      where: { id: orderId, paymentStatus: 'PAID', paymentEmailSentAt: null },
      data: { paymentEmailSentAt: new Date() },
    });
    if (claimed.count !== 1) return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true },
    });
    if (!order) return;

    const items = order.items.map(toPublicItem);
    const sent = await this.mailer.sendPaidOrder({
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      total: Number(order.total),
      items: items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        options: item.options.map((option) => option.name),
        quantity: item.quantity,
        total: item.total,
        extras: describeExtras(item),
      })),
    });

    if (!sent) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentEmailSentAt: null },
      });
    }
  }
}
