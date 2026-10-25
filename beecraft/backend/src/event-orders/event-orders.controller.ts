import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AdminApiKeyGuard } from '../uploads/admin-api-key.guard';
import { CreateEventOrderDto } from './dto/create-event-order.dto';
import { UpdateEventOrderDto } from './dto/update-event-order.dto';
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

  @Post('checkout/:sessionId/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  confirm(@Param('sessionId') sessionId: string) {
    return this.service.confirm(sessionId);
  }

  @Post('stripe/webhook')
  webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!request.rawBody) throw new BadRequestException('Corpo original indisponível');
    return this.service.handleWebhook(request.rawBody, signature);
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
}
