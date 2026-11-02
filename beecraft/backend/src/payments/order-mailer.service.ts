import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaidOrderEmail {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  total: number;
  items: {
    productName: string;
    variantName?: string | null;
    options: string[];
    quantity: number;
    total: number;
    extras: string[];
  }[];
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
    value,
  );

@Injectable()
export class OrderMailerService {
  private readonly logger = new Logger(OrderMailerService.name);

  constructor(private readonly config: ConfigService) {}

  /** Devolve true se o email foi aceite pelo Resend. Nunca lança erro. */
  async sendPaidOrder(order: PaidOrderEmail): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('MAIL_FROM');
    const to = (this.config.get<string>('ORDER_NOTIFY_EMAIL') ?? '')
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean);

    if (!apiKey || !from || !to.length) {
      this.logger.warn(
        'Email de pedido pago não enviado: defina RESEND_API_KEY, MAIL_FROM e ORDER_NOTIFY_EMAIL.',
      );
      return false;
    }

    const lines = order.items.map((item) => {
      const detail = [
        item.variantName ?? '',
        ...item.options,
        ...item.extras,
      ].filter(Boolean);
      return {
        title: `${item.quantity}× ${item.productName}`,
        detail,
        total: item.total,
      };
    });

    const text = [
      `Pagamento MB WAY recebido — pedido ${order.orderNumber}`,
      `Total: ${money(order.total)}`,
      '',
      `Cliente: ${order.customerName}`,
      `Email: ${order.customerEmail}`,
      `Telemóvel: ${order.customerPhone ?? 'não indicado'}`,
      '',
      ...lines.flatMap((line) => [
        `${line.title} — ${money(line.total)}`,
        ...line.detail.map((entry) => `   • ${entry}`),
      ]),
      '',
      'Veja o pedido no painel: /adm → Pedidos da loja',
    ].join('\n');

    const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
<h2 style="margin:0 0 8px">Pagamento MB WAY recebido ✅</h2>
<p style="margin:0 0 16px">Pedido <b>${escapeHtml(order.orderNumber)}</b> · Total <b>${escapeHtml(money(order.total))}</b></p>
<p style="margin:0 0 16px"><b>${escapeHtml(order.customerName)}</b><br>${escapeHtml(order.customerEmail)}<br>${escapeHtml(order.customerPhone ?? 'Telemóvel não indicado')}</p>
<ul style="padding-left:18px">${lines
      .map(
        (line) =>
          `<li style="margin-bottom:8px"><b>${escapeHtml(line.title)}</b> — ${escapeHtml(money(line.total))}${line.detail
            .map(
              (entry) =>
                `<br><span style="color:#555">${escapeHtml(entry)}</span>`,
            )
            .join('')}</li>`,
      )
      .join('')}</ul>
<p style="color:#555">Veja o pedido no painel: /adm → Pedidos da loja</p></div>`;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `order-paid-${order.orderNumber}`,
        },
        body: JSON.stringify({
          from,
          to,
          reply_to: order.customerEmail,
          subject: `Pagamento recebido · ${order.orderNumber} · ${money(order.total)}`,
          html,
          text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        this.logger.error(
          `Resend recusou o email (${response.status}): ${(await response.text()).slice(0, 300)}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Falha ao contactar o Resend: ${String(error)}`);
      return false;
    }
  }
}
