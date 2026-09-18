import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { SaveCategoryDto } from './dto/save-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('admin/all')
  @UseGuards(AdminApiKeyGuard)
  findAllAdmin() { return this.categoriesService.findAllAdmin(); }

  @Post('admin')
  @UseGuards(AdminApiKeyGuard)
  create(@Body() dto: SaveCategoryDto) { return this.categoriesService.create(dto); }

  @Patch('admin/:id')
  @UseGuards(AdminApiKeyGuard)
  update(@Param('id') id: string, @Body() dto: SaveCategoryDto) { return this.categoriesService.update(id, dto); }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
