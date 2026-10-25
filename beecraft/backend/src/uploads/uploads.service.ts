import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  uploadBuffer(
    buffer: Buffer,
    folder = 'beecraft',
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) {
            return reject(
              new Error(error?.message ?? 'Falha no upload da imagem'),
            );
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async uploadProductImages(productId: string, files: Express.Multer.File[]) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (!files?.length) {
      throw new BadRequestException('Envie pelo menos uma imagem');
    }

    for (const file of files) {
      if (!this.hasValidImageSignature(file.buffer)) {
        throw new BadRequestException(
          `O ficheiro ${file.originalname} não é uma imagem válida`,
        );
      }
    }

    const existingCount = await this.prisma.productImage.count({
      where: { productId },
    });

    const uploaded: {
      url: string;
      publicId: string;
      alt: string | null;
      sortOrder: number;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadBuffer(files[i].buffer);

      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
        alt: product.name,
        sortOrder: existingCount + i,
      });
    }

    await this.prisma.productImage.createMany({
      data: uploaded.map((img) => ({
        productId,
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        sortOrder: img.sortOrder,
      })),
    });

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId, {
        resource_type: 'image',
      });
    }

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    return { deleted: true };
  }

  hasValidImageSignature(buffer: Buffer): boolean {
    const isJpeg =
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;
    const isPng =
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
    return isJpeg || isPng || isWebp;
  }
}
