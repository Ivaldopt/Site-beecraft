import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findApproved() {
    return this.prisma.storeReview.findMany({
      where: { status: ReviewStatus.APPROVED },
      select: { id: true, name: true, city: true, rating: true, comment: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }

  create(dto: CreateReviewDto) {
    return this.prisma.storeReview.create({
      data: {
        name: dto.name.trim(),
        city: dto.city?.trim() || null,
        rating: dto.rating,
        comment: dto.comment.trim(),
      },
      select: { id: true, status: true },
    });
  }

  findAll() {
    return this.prisma.storeReview.findMany({ orderBy: { createdAt: 'desc' } });
  }

  setStatus(id: string, status: ReviewStatus) {
    return this.prisma.storeReview.update({ where: { id }, data: { status } });
  }
}
