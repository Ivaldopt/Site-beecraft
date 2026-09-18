import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { SaveProductDto } from './dto/save-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  @Get('admin/all')
  @UseGuards(AdminApiKeyGuard)
  findAllAdmin() { return this.productsService.findAllAdmin(); }

  @Post('admin')
  @UseGuards(AdminApiKeyGuard)
  create(@Body() dto: SaveProductDto) { return this.productsService.create(dto); }

  @Patch('admin/:id')
  @UseGuards(AdminApiKeyGuard)
  update(@Param('id') id: string, @Body() dto: SaveProductDto) { return this.productsService.update(id, dto); }

  @Delete('admin/:id')
  @UseGuards(AdminApiKeyGuard)
  archive(@Param('id') id: string) { return this.productsService.archive(id); }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
