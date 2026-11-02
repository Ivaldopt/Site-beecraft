/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';

const SECRET = 'whsec_test_secret';

function setup(overrides: { orderTotal?: number; mailOk?: boolean } = {}) {
  const order = {
    id: 'order-1',
    orderNumber: 'BC-20261102-ABCD1234',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    total: overrides.orderTotal ?? 54,
    stripeSessionId: 'cs_test_1',
    paymentEmailSentAt: null as Date | null,
    customer: { name: 'Maria', email: 'maria@example.com', phone: '912345678' },
    items: [
      {
        productName: 'Agenda A5',
        quantity: 2,
        unitPrice: 27,
        totalPrice: 54,
        configuration: {
          variantName: 'Wire-O',
          options: [{ name: 'Semanal' }],
        },
      },
    ],
  };
  const prisma = {
    order: {
      findUnique: jest.fn().mockImplementation(() => ({ ...order })),
      update: jest.fn().mockImplementation(({ data }) => {
        Object.assign(order, data);
        return order;
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        if (
          where.paymentStatus?.not === 'PAID' &&
          order.paymentStatus !== 'PAID'
        ) {
          Object.assign(order, data);
          return { count: 1 };
        }
        if (
          where.paymentEmailSentAt === null &&
          order.paymentStatus === 'PAID' &&
          !order.paymentEmailSentAt
        ) {
          Object.assign(order, data);
          return { count: 1 };
        }
        if (
          where.paymentStatus === 'PENDING' &&
          order.paymentStatus === 'PENDING' &&
          where.stripeSessionId === order.stripeSessionId
        ) {
          Object.assign(order, data);
          return { count: 1 };
        }
        return { count: 0 };
      }),
    },
  };
  const mailer = {
    sendPaidOrder: jest.fn().mockResolvedValue(overrides.mailOk ?? true),
  };
  const config = new ConfigService({
    STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_WEBHOOK_SECRET: SECRET,
  });
  const service = new PaymentsService(prisma as never, config, mailer as never);
  return { service, order, prisma, mailer };
}

function signedEvent(type: string, session: Record<string, unknown>) {
  const payload = JSON.stringify({
    id: `evt_${type}`,
    object: 'event',
    type,
    data: { object: session },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: SECRET,
  });
  return { body: Buffer.from(payload), signature };
}

const paidSession = {
  id: 'cs_test_1',
  object: 'checkout.session',
  client_reference_id: 'order-1',
  payment_status: 'paid',
  amount_total: 5400,
  currency: 'eur',
  payment_intent: 'pi_1',
};

describe('PaymentsService webhook', () => {
  it('rejects a bad signature', async () => {
    const { service } = setup();
    await expect(
      service.handleWebhook(Buffer.from('{}'), 't=1,v1=bad'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks the order paid and emails BeeCraft once, even if Stripe repeats the event', async () => {
    const { service, order, mailer } = setup();
    const event = signedEvent('checkout.session.completed', paidSession);
    await service.handleWebhook(event.body, event.signature);
    await service.handleWebhook(event.body, event.signature);
    expect(order.paymentStatus).toBe('PAID');
    expect(order.status).toBe('PAID');
    expect(mailer.sendPaidOrder).toHaveBeenCalledTimes(1);
    expect(mailer.sendPaidOrder.mock.calls[0][0]).toMatchObject({
      orderNumber: order.orderNumber,
      total: 54,
    });
  });

  it('ignores a payment whose amount does not match the order', async () => {
    const { service, order, mailer } = setup();
    const event = signedEvent('checkout.session.completed', {
      ...paidSession,
      amount_total: 100,
    });
    await service.handleWebhook(event.body, event.signature);
    expect(order.paymentStatus).toBe('PENDING');
    expect(mailer.sendPaidOrder).not.toHaveBeenCalled();
  });

  it('does not mark paid while the MB WAY approval is still pending', async () => {
    const { service, order } = setup();
    const event = signedEvent('checkout.session.completed', {
      ...paidSession,
      payment_status: 'unpaid',
    });
    await service.handleWebhook(event.body, event.signature);
    expect(order.paymentStatus).toBe('PENDING');
  });

  it('retries the email later when sending fails', async () => {
    const { service, order, mailer } = setup({ mailOk: false });
    const event = signedEvent('checkout.session.completed', paidSession);
    await service.handleWebhook(event.body, event.signature);
    expect(order.paymentStatus).toBe('PAID');
    expect(order.paymentEmailSentAt).toBeNull();
    mailer.sendPaidOrder.mockResolvedValue(true);
    await service.handleWebhook(event.body, event.signature);
    expect(order.paymentEmailSentAt).not.toBeNull();
    expect(mailer.sendPaidOrder).toHaveBeenCalledTimes(2);
  });

  it('records expired and failed sessions without touching paid orders', async () => {
    const { service, order } = setup();
    const expired = signedEvent('checkout.session.expired', {
      ...paidSession,
      payment_status: 'unpaid',
    });
    await service.handleWebhook(expired.body, expired.signature);
    expect(order.paymentStatus).toBe('EXPIRED');
  });
});
