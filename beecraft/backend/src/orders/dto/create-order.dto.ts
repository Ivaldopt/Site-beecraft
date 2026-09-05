import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
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

export class CustomizationDetailsDto {
  @IsOptional()
  @IsIn(['Horizontal', 'Vertical'])
  orientation?: string;

  @IsOptional()
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
  @Max(100)
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
}
