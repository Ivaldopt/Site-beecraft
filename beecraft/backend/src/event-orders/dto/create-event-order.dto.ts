import { Equals, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

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

  /** multipart/form-data envia texto: 'true' quando a caixa dos Termos foi marcada. */
  @Equals('true', { message: 'Tem de aceitar os Termos e a Política de Privacidade' })
  termsAccepted: string;

  @IsString()
  @MaxLength(20)
  termsVersion: string;
}
