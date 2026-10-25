import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type StripeSession = {
  id: string;
  url?: string;
  payment_status?: string;
  payment_intent?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
};

@Injectable()
export class StripeService {
  private secret(): string {
    const value = process.env.STRIPE_SECRET_KEY;
    if (!value) throw new ServiceUnavailableException('Pagamento temporariamente indisponível');
    return value;
  }

  private async request(path: string, init?: RequestInit): Promise<StripeSession> {
    const response = await fetch(`https://api.stripe.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(init?.headers ?? {}),
      },
    });
    const payload = (await response.json()) as StripeSession & { error?: { message?: string } };
    if (!response.ok) throw new BadGatewayException(payload.error?.message ?? 'Não foi possível iniciar o pagamento');
    return payload;
  }

  createCheckout(input: {
    orderId: string;
    orderNumber: string;
    quantity: number;
    amountCents: number;
    contact: string;
  }) {
    const storeUrl = (process.env.PUBLIC_STORE_URL ?? '').replace(/\/$/, '');
    if (!storeUrl) throw new ServiceUnavailableException('PUBLIC_STORE_URL não configurado');
    const body = new URLSearchParams({
      mode: 'payment',
      locale: 'pt',
      'automatic_payment_methods[enabled]': 'true',
      client_reference_id: input.orderId,
      'metadata[orderId]': input.orderId,
      'payment_intent_data[metadata][orderId]': input.orderId,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(input.amountCents),
      'line_items[0][price_data][product_data][name]': `BeeCraft · ${input.quantity} íman${input.quantity === 1 ? '' : 'es'} personalizado${input.quantity === 1 ? '' : 's'}`,
      'line_items[0][price_data][product_data][description]': `Encomenda ${input.orderNumber} · produção artesanal`,
      success_url: `${storeUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${storeUrl}/?payment=cancelled`,
    });
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact)) body.set('customer_email', input.contact);
    return this.request('/v1/checkout/sessions', { method: 'POST', body });
  }

  retrieveCheckout(sessionId: string) {
    return this.request(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  }

  verifyWebhook(rawBody: Buffer, signature: string | undefined): Record<string, any> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature) throw new UnauthorizedException('Assinatura Stripe ausente');
    const fields = Object.fromEntries(signature.split(',').map((part) => part.split('=', 2)));
    const timestamp = Number(fields.t);
    const received = fields.v1;
    if (!timestamp || !received || Math.abs(Date.now() / 1000 - timestamp) > 300) throw new UnauthorizedException('Assinatura Stripe inválida');
    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) throw new UnauthorizedException('Assinatura Stripe inválida');
    return JSON.parse(rawBody.toString('utf8')) as Record<string, any>;
  }
}
