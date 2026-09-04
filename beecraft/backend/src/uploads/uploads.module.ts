import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminApiKeyGuard } from './admin-api-key.guard';

@Module({
  imports: [PrismaModule],
  providers: [UploadsService, CloudinaryProvider, AdminApiKeyGuard],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
