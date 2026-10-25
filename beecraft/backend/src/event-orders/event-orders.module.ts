import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { EventOrdersController } from './event-orders.controller';
import { EventOrdersService } from './event-orders.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [PrismaModule, UploadsModule],
  controllers: [EventOrdersController],
  providers: [EventOrdersService, StripeService, AdminApiKeyGuard],
})
export class EventOrdersModule {}
