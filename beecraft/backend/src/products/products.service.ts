import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
