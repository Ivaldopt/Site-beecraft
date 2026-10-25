import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEventOrderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(90)
  customerName: string;

  @IsString()
  @MinLength(5)
  @MaxLength(120)
  contact: string;

  @IsIn(['1', '3', '6'])
  quantity: string;

  @IsIn(['Retirada no evento', 'Retirada na loja'])
  pickup: string;
}
