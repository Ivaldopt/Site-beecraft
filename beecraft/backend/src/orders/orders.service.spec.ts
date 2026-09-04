/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('persists prices recalculated by the server', async () => {
    const pricing = {
      calculate: jest.fn().mockResolvedValue({
        productId: 'product-1',
        productName: 'Agenda A5',
        variantId: 'variant-1',
        variantName: 'Wire-O',
        options: [{ id: 'option-1', name: 'Semanal', priceDelta: 2 }],
        quantity: 2,
        unitPrice: 27,
        total: 54,
      }),
    };
    const transaction = {
      customer: {
        upsert: jest.fn().mockResolvedValue({ id: 'customer-1' }),
      },
      order: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'order-1',
          orderNumber: data.orderNumber,
          status: 'PENDING_PAYMENT',
          total: data.total,
        })),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: PricingService, useValue: pricing },
      ],
    }).compile();
    const service = module.get(OrdersService);

    const result = await service.create({
      customer: { name: 'Maria Silva', email: 'MARIA@example.com' },
      items: [
        {
          productId: 'product-1',
          variantId: 'variant-1',
          optionValueIds: ['option-1'],
          quantity: 2,
        },
      ],
    });

    expect(result.total).toBe(54);
    expect(transaction.customer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'maria@example.com' } }),
    );
    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subtotal: 54, total: 54 }),
      }),
    );
  });
});
