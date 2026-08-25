import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('products/:productId')
  @UseInterceptors(FilesInterceptor('files', 10))
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
