import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveProductDto } from './dto/save-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(categorySlug?: string) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: categorySlug ? { slug: categorySlug } : undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDesc: true,
        basePrice: true,
        saleType: true,
        images: {
          select: { url: true, alt: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAdmin() {
    return this.prisma.product.findMany({ include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: { orderBy: { createdAt: 'asc' } }, options: { orderBy: { sortOrder: 'asc' }, include: { values: { orderBy: { sortOrder: 'asc' } } } } }, orderBy: { updatedAt: 'desc' } });
  }

  create(dto: SaveProductDto) { return this.save(undefined, dto); }
  update(id: string, dto: SaveProductDto) { return this.save(id, dto); }

  private async save(id: string | undefined, dto: SaveProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const data = { name: dto.name, slug: dto.slug, shortDesc: dto.shortDesc, description: dto.description, basePrice: dto.basePrice, categoryId: dto.categoryId, status: dto.status, saleType: dto.saleType };
      const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
      if (dto.variants) {
        await tx.productVariant.updateMany({ where: { productId: product.id }, data: { active: false } });
        for (const variant of dto.variants) await tx.productVariant.upsert({ where: { sku: variant.sku }, update: { name: variant.name, price: variant.price, width: variant.width, height: variant.height, pages: variant.pages, active: variant.active ?? true }, create: { productId: product.id, name: variant.name, sku: variant.sku, price: variant.price, width: variant.width, height: variant.height, pages: variant.pages, active: variant.active ?? true } });
      }
      if (dto.options) {
        for (let index = 0; index < dto.options.length; index++) {
          const option = dto.options[index];
          const savedOption = await tx.productOption.upsert({ where: { productId_slug: { productId: product.id, slug: option.slug } }, update: { name: option.name, type: option.type, required: option.required ?? false, sortOrder: index }, create: { productId: product.id, name: option.name, slug: option.slug, type: option.type, required: option.required ?? false, sortOrder: index } });
          await tx.optionValue.updateMany({ where: { optionId: savedOption.id }, data: { active: false } });
          for (let valueIndex = 0; valueIndex < option.values.length; valueIndex++) { const value = option.values[valueIndex]; if (value.id) await tx.optionValue.update({ where: { id: value.id }, data: { name: value.name, value: value.value, priceDelta: value.priceDelta ?? 0, active: value.active ?? true, sortOrder: valueIndex } }); else await tx.optionValue.create({ data: { optionId: savedOption.id, name: value.name, value: value.value, priceDelta: value.priceDelta ?? 0, active: value.active ?? true, sortOrder: valueIndex } }); }
        }
      }
      return tx.product.findUnique({ where: { id: product.id }, include: { category: true, images: true, variants: true, options: { include: { values: true } } } });
    });
  }

  archive(id: string) { return this.prisma.product.update({ where: { id }, data: { status: 'INACTIVE' } }); }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { active: true },
        },
        options: {
          orderBy: { sortOrder: 'asc' },
          include: {
            values: {
              where: { active: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }
}
