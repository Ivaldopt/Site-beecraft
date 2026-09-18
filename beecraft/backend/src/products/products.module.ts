import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';

@Module({
  imports: [PrismaModule],
  providers: [ProductsService, AdminApiKeyGuard],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
