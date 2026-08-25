import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        active: true,
        products: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            shortDesc: true,
            basePrice: true,
            images: {
              select: { url: true, alt: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category || !category.active) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }
}
