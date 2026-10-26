import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateEventOrderDto } from './dto/create-event-order.dto';

const PACKAGES: Record<number, number> = { 1: 400, 3: 700, 6: 1500 };

@Injectable()
export class EventOrdersService {
  constructor(private prisma: PrismaService, private uploads: UploadsService) {}

  async create(dto: CreateEventOrderDto, files: Express.Multer.File[]) {
    const quantity = Number(dto.quantity);
    const amountCents = PACKAGES[quantity];
    if (!amountCents || files?.length !== quantity) {
      throw new BadRequestException(`Envie exatamente ${quantity} fotografia(s)`);
    }
    if (files.some((file) => !this.uploads.hasValidImageSignature(file.buffer))) {
      throw new BadRequestException('Uma das fotografias não é uma imagem válida');
    }

    const orderNumber = `BC-E-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const uploaded: { url: string; publicId: string; sortOrder: number }[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const image = await this.uploads.uploadBuffer(files[index].buffer, `beecraft/event-orders/${orderNumber}`, true);
        uploaded.push({ url: image.secure_url, publicId: image.public_id, sortOrder: index });
      }

      const order = await this.prisma.eventOrder.create({
        data: {
          orderNumber,
          customerName: dto.customerName.trim(),
          contact: dto.contact.trim(),
          pickup: dto.pickup,
          quantity,
          amountCents,
          artworks: { create: uploaded },
        },
      });

      return { orderNumber, orderId: order.id, quantity, amountCents, paymentMethod: 'MBWAY', paymentStatus: 'PENDING' };
    } catch (error) {
      await Promise.allSettled(uploaded.map((image) => this.uploads.deleteAsset(image.publicId, true)));
      throw error;
    }
  }

  async list() {
    const orders = await this.prisma.eventOrder.findMany({
      include: { artworks: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return orders.map((order) => ({
      ...order,
      artworks: order.artworks.map((artwork) => ({
        ...artwork,
        url: artwork.url.includes('/authenticated/') ? this.uploads.privateUrl(artwork.publicId) : artwork.url,
      })),
    }));
  }

  async updateStatus(id: string, status: 'WAITING' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | 'CANCELLED') {
    const current = await this.prisma.eventOrder.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Encomenda não encontrada');
    return this.prisma.eventOrder.update({ where: { id }, data: { status } });
  }

  async updatePayment(id: string, paymentStatus: 'PENDING' | 'PAID') {
    const current = await this.prisma.eventOrder.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Encomenda não encontrada');
    return this.prisma.eventOrder.update({
      where: { id },
      data: { paymentStatus, paidAt: paymentStatus === 'PAID' ? (current.paidAt ?? new Date()) : null },
    });
  }
}
