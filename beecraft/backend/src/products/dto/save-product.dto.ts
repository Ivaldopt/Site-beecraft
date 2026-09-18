import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { OptionType, ProductSaleType, ProductStatus } from '@prisma/client';

class VariantInput {
  @IsOptional() @IsString() id?: string;
  @IsString() name: string;
  @IsString() sku: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) width?: number;
  @IsOptional() @IsNumber() @Min(0) height?: number;
  @IsOptional() @IsNumber() @Min(0) pages?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

class OptionValueInput {
  @IsOptional() @IsString() id?: string;
  @IsString() name: string;
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsNumber() priceDelta?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

class OptionInput {
  @IsOptional() @IsString() id?: string;
  @IsString() name: string;
  @IsString() slug: string;
  @IsEnum(OptionType) type: OptionType;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OptionValueInput) values: OptionValueInput[];
}

export class SaveProductDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsOptional() @IsString() shortDesc?: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) basePrice: number;
  @IsString() categoryId: string;
  @IsEnum(ProductStatus) status: ProductStatus;
  @IsEnum(ProductSaleType) saleType: ProductSaleType;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantInput) variants?: VariantInput[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInput) options?: OptionInput[];
}
