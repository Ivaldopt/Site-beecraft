import { IsIn } from 'class-validator';

export class UpdateEventOrderDto {
  @IsIn(['WAITING', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED'])
  status: 'WAITING' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | 'CANCELLED';
}
