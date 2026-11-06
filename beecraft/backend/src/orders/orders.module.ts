import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, PricingModule],
  controllers: [OrdersController],
  providers: [OrdersService, AdminApiKeyGuard],
})
export class OrdersModule {}
