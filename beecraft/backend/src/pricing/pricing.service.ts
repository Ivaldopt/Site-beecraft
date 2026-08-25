import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculate(dto: CalculatePriceDto) {
    const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;
    const optionValueIds = dto.optionValueIds ?? [];

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        variants: true,
        options: {
          include: { values: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Base: preço da variante (se informada) ou preço base do produto
    let base = Number(product.basePrice);
    let variant: (typeof product.variants)[number] | null = null;

    if (dto.variantId) {
      variant = product.variants.find((v) => v.id === dto.variantId) ?? null;

      if (!variant) {
        throw new BadRequestException(
          'Variante não pertence a este produto',
        );
      }

      if (variant.price !== null) {
        base = Number(variant.price);
      }
    }

    // Junta todos os valores de opção existentes deste produto, pra validar
    const allValues = product.options.flatMap((opt) => opt.values);

    const selectedValues = allValues.filter((v) =>
      optionValueIds.includes(v.id),
    );

    // Verifica se algum optionValueId enviado não pertence a este produto
    const invalidIds = optionValueIds.filter(
      (id) => !allValues.some((v) => v.id === id),
    );

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Opções inválidas para este produto: ${invalidIds.join(', ')}`,
      );
    }

    // Verifica se toda opção obrigatória tem um valor selecionado
    const missingRequired = product.options.filter((opt) => {
      if (!opt.required) return false;
      return !opt.values.some((v) => optionValueIds.includes(v.id));
    });

    if (missingRequired.length > 0) {
      throw new BadRequestException(
        `Opções obrigatórias não preenchidas: ${missingRequired
          .map((o) => o.name)
          .join(', ')}`,
      );
    }

    // Soma os adicionais de preço das opções escolhidas
    const optionsBreakdown = selectedValues.map((v) => ({
      id: v.id,
      name: v.name,
      priceDelta: Number(v.priceDelta),
    }));

    const optionsTotal = optionsBreakdown.reduce(
      (sum, v) => sum + v.priceDelta,
      0,
    );

    const unitPrice = base + optionsTotal;
    const total = unitPrice * quantity;

    return {
      productId: product.id,
      productName: product.name,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      basePrice: base,
      options: optionsBreakdown,
      optionsTotal,
      unitPrice,
      quantity,
      total,
    };
  }
}
