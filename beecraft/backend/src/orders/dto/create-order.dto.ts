import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsBoolean,
  IsArray,
  IsEmail,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrderCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ]{9,20}$/)
  phone?: string;
}

// O formulário envia '' para campos que o cliente não preencheu: tratamos como "não indicado".
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class CustomizationDetailsDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['Horizontal', 'Vertical'])
  orientation?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['1', '2', '3', '4', '5', '6'])
  columns?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  startMonth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  appointmentHours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  elasticColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  coilColor?: string;
}

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  optionValueIds?: string[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(240)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customizationText?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  customizationTextColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomizationDetailsDto)
  customizationDetails?: CustomizationDetailsDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customizationFileName?: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CreateOrderCustomerDto)
  customer: CreateOrderCustomerDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  /** Tem de ser true: o cliente marcou a caixa dos Termos e da Política de Privacidade. */
  @Equals(true, {
    message: 'Tem de aceitar os Termos e a Política de Privacidade',
  })
  termsAccepted: boolean;

  /** Versão dos termos que o cliente viu; tem de ser a versão em vigor. */
  @IsString()
  @MaxLength(20)
  termsVersion: string;

  /** Opcional. Só true se o cliente marcou a caixa de marketing. */
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
