import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('orders/:id/checkout')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkout(@Param('id') id: string) {
    return this.payments.createCheckout(id);
  }

  @Get('orders/:id/payment')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  payment(@Param('id') id: string) {
    return this.payments.getPaymentView(id);
  }

  @Post('payments/stripe/webhook')
  @HttpCode(200)
  @SkipThrottle()
  webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.payments.handleWebhook(request.rawBody, signature);
  }
}
