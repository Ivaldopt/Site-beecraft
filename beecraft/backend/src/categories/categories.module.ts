import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';

@Module({
  imports: [PrismaModule],
  providers: [CategoriesService, AdminApiKeyGuard],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
