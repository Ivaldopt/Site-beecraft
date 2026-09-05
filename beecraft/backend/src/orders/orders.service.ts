import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async create(dto: CreateOrderDto) {
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
    const normalizedEmail = dto.customer.email.trim().toLowerCase();
    const normalizedName = dto.customer.name.trim();
    const normalizedPhone = dto.customer.phone?.replace(/\s+/g, '') || null;

    const order = await this.prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.upsert({
        where: { email: normalizedEmail },
        update: { name: normalizedName, phone: normalizedPhone },
        create: {
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
        },
      });

      return transaction.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
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

  private createOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return `BC-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
