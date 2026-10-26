import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { CreateEventOrderDto } from './dto/create-event-order.dto';
import { UpdateEventOrderDto } from './dto/update-event-order.dto';
import { UpdateEventPaymentDto } from './dto/update-event-payment.dto';
import { EventOrdersService } from './event-orders.service';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('event-orders')
export class EventOrdersController {
  constructor(private service: EventOrdersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FilesInterceptor('files', 6, {
    limits: { files: 6, fileSize: 8 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => IMAGE_TYPES.has(file.mimetype)
      ? callback(null, true)
      : callback(new BadRequestException('Use apenas JPG, PNG ou WebP'), false),
  }))
  create(@Body() dto: CreateEventOrderDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.service.create(dto, files ?? []);
  }

  @Get('admin/all')
  @UseGuards(AdminApiKeyGuard)
  list() {
    return this.service.list();
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminApiKeyGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEventOrderDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Patch('admin/:id/payment')
  @UseGuards(AdminApiKeyGuard)
  updatePayment(@Param('id') id: string, @Body() dto: UpdateEventPaymentDto) {
    return this.service.updatePayment(id, dto.paymentStatus);
  }
}
