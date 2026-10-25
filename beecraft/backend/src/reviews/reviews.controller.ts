import { Body, Controller, Get, Param, ParseEnumPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewStatus } from '@prisma/client';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findApproved() { return this.reviewsService.findApproved(); }

  @Post()
  @Throttle({ default: { limit: 3, ttl: 60 * 60_000 } })
  create(@Body() dto: CreateReviewDto) { return this.reviewsService.create(dto); }

  @Get('admin/all')
  @UseGuards(AdminApiKeyGuard)
  findAll() { return this.reviewsService.findAll(); }

  @Patch('admin/:id/:status')
  @UseGuards(AdminApiKeyGuard)
  setStatus(@Param('id') id: string, @Param('status', new ParseEnumPipe(ReviewStatus)) status: ReviewStatus) {
    return this.reviewsService.setStatus(id, status);
  }
}
