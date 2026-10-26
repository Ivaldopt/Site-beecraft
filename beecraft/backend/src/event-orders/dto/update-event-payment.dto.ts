import { IsIn } from 'class-validator';

export class UpdateEventPaymentDto {
  @IsIn(['PENDING', 'PAID'])
  paymentStatus: 'PENDING' | 'PAID';
}
