import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { UploadsService } from './uploads.service';
import { AdminApiKeyGuard } from './admin-api-key.guard';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('uploads')
@UseGuards(AdminApiKeyGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('products/:productId')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 8 * 1024 * 1024, files: 5 },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return callback(
            new BadRequestException('Formato de imagem não permitido'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadProductImages(
    @Param('productId') productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadsService.uploadProductImages(productId, files);
  }

  @Delete(':imageId')
  deleteImage(@Param('imageId') imageId: string) {
    return this.uploadsService.deleteImage(imageId);
  }
}
