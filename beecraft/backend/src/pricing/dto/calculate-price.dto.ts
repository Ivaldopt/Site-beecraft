export class CalculatePriceDto {
  productId: string;
  variantId?: string;
  optionValueIds?: string[];
  quantity?: number;
}
