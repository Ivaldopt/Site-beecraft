import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveCategoryDto } from './dto/save-category.dto';

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
        sortOrder: true,
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findAllAdmin() { return this.prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }); }
  create(dto: SaveCategoryDto) { return this.prisma.category.create({ data: { ...dto, active: dto.active ?? true } }); }
  update(id: string, dto: SaveCategoryDto) { return this.prisma.category.update({ where: { id }, data: dto }); }

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
