import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SaveCategoryDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
