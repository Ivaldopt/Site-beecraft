import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateEventOrderDto } from './dto/create-event-order.dto';
import { StripeService } from './stripe.service';

const PACKAGES: Record<number, number> = { 1: 400, 3: 700, 6: 1500 };

@Injectable()
export class EventOrdersService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private stripe: StripeService,
  ) {}

  async create(dto: CreateEventOrderDto, files: Express.Multer.File[]) {
    const quantity = Number(dto.quantity);
    const amountCents = PACKAGES[quantity];
    if (!amountCents || files?.length !== quantity) throw new BadRequestException(`Envie exatamente ${quantity} fotografia(s)`);
    if (files.some((file) => !this.uploads.hasValidImageSignature(file.buffer))) throw new BadRequestException('Uma das fotografias não é uma imagem válida');
    const orderNumber = `BC-E-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const order = await this.prisma.eventOrder.create({
      data: {
        orderNumber,
        customerName: dto.customerName.trim(),
        contact: dto.contact.trim(),
        pickup: dto.pickup,
        quantity,
        amountCents,
      },
    });
    const uploaded: {
      orderId: string;
      url: string;
      publicId: string;
      sortOrder: number;
    }[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const image = await this.uploads.uploadBuffer(files[index].buffer, `beecraft/event-orders/${order.orderNumber}`);
      uploaded.push({ orderId: order.id, url: image.secure_url, publicId: image.public_id, sortOrder: index });
    }
    await this.prisma.eventArtwork.createMany({ data: uploaded });
    return {
      orderNumber,
      orderId: order.id,
      quantity,
      amountCents,
      paymentMethod: 'MBWAY',
      paymentStatus: 'PENDING',
    };
  }

  async confirm(sessionId: string) {
    const session = await this.stripe.retrieveCheckout(sessionId);
    const order = await this.prisma.eventOrder.findUnique({ where: { stripeSessionId: session.id } });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    if (session.payment_status === 'paid') await this.markPaid(order.id, session.payment_intent ?? undefined);
    return { orderNumber: order.orderNumber, paid: session.payment_status === 'paid' };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const event = this.stripe.verifyWebhook(rawBody, signature);
    const session = event.data?.object;
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const orderId = session?.metadata?.orderId ?? session?.client_reference_id;
      if (orderId) await this.markPaid(orderId, session.payment_intent ?? undefined);
    }
    if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const orderId = session?.metadata?.orderId ?? session?.client_reference_id;
      if (orderId) await this.prisma.eventOrder.updateMany({ where: { id: orderId, paymentStatus: 'PENDING' }, data: { paymentStatus: event.type.endsWith('expired') ? 'EXPIRED' : 'FAILED' } });
    }
    return { received: true };
  }

  private markPaid(orderId: string, paymentIntent?: string) {
    return this.prisma.eventOrder.update({ where: { id: orderId }, data: { paymentStatus: 'PAID', paidAt: new Date(), stripePaymentIntentId: paymentIntent ?? undefined } });
  }

  list() {
    return this.prisma.eventOrder.findMany({ include: { artworks: { orderBy: { sortOrder: 'asc' } } }, orderBy: { createdAt: 'desc' }, take: 300 });
  }

  async updateStatus(id: string, status: 'WAITING' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | 'CANCELLED') {
    const current = await this.prisma.eventOrder.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Encomenda não encontrada');
    return this.prisma.eventOrder.update({ where: { id }, data: { status } });
  }
}
