import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { TERMS_VERSION } from '../legal/terms-version';
import { toPublicItem } from '../payments/order-view';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async create(dto: CreateOrderDto) {
    if (dto.termsVersion !== TERMS_VERSION) {
      throw new BadRequestException(
        'Os Termos foram atualizados. Recarregue a página e tente novamente.',
      );
    }
    const pricedItems = await Promise.all(
      dto.items.map(async (item) => ({
        request: item,
        price: await this.pricing.calculate({
          productId: item.productId,
          variantId: item.variantId,
          optionValueIds: item.optionValueIds,
          quantity: item.quantity,
        }),
      })),
    );

    const subtotal = pricedItems.reduce(
      (sum, item) => sum + item.price.total,
      0,
    );
    const orderNumber = this.createOrderNumber();
    const acceptedAt = new Date();
    const normalizedEmail = dto.customer.email.trim().toLowerCase();
    const normalizedName = dto.customer.name.trim();
    const normalizedPhone = dto.customer.phone?.replace(/\s+/g, '') || null;

    const order = await this.prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.upsert({
        where: { email: normalizedEmail },
        update: {
          name: normalizedName,
          phone: normalizedPhone,
          // Só regista o consentimento; nunca o retira em silêncio.
          ...(dto.marketingOptIn
            ? {
                marketingOptIn: true,
                marketingOptInAt: acceptedAt,
                marketingOptInVersion: TERMS_VERSION,
              }
            : {}),
        },
        create: {
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          ...(dto.marketingOptIn
            ? {
                marketingOptIn: true,
                marketingOptInAt: acceptedAt,
                marketingOptInVersion: TERMS_VERSION,
              }
            : {}),
        },
      });

      return transaction.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          termsVersion: TERMS_VERSION,
          termsAcceptedAt: acceptedAt,
          subtotal,
          total: subtotal,
          items: {
            create: pricedItems.map(({ request, price }) => ({
              productId: price.productId,
              productName: price.productName,
              quantity: price.quantity,
              unitPrice: price.unitPrice,
              totalPrice: price.total,
              configuration: {
                variantId: price.variantId,
                variantName: price.variantName,
                options: price.options,
                customizationText: request.customizationText?.trim() || null,
                customizationTextColor: request.customizationTextColor || null,
                customizationDetails: request.customizationDetails
                  ? { ...request.customizationDetails }
                  : null,
                customizationFileName: request.customizationFileName || null,
              } satisfies Prisma.InputJsonValue,
            })),
          },
        },
      });
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      items: pricedItems.map(({ request, price }) => ({
        productName: price.productName,
        variantName: price.variantName,
        options: price.options,
        quantity: price.quantity,
        unitPrice: price.unitPrice,
        total: price.total,
        customizationText: request.customizationText?.trim() || null,
        customizationTextColor: request.customizationTextColor || null,
        customizationDetails: request.customizationDetails || null,
        customizationFileName: request.customizationFileName || null,
      })),
    };
  }

  async listForAdmin() {
    const orders = await this.prisma.order.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      items: order.items.map(toPublicItem),
    }));
  }

  private createOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return `BC-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
