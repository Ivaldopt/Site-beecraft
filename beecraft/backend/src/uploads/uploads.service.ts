import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  private uploadBuffer(buffer: Buffer): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'beecraft' },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { secure_url: string });
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async uploadProductImages(
    productId: string,
    files: Express.Multer.File[],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const existingCount = await this.prisma.productImage.count({
      where: { productId },
    });

    const uploaded: { url: string; alt: string | null; sortOrder: number }[] =
      [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadBuffer(files[i].buffer);

      uploaded.push({
        url: result.secure_url,
        alt: product.name,
        sortOrder: existingCount + i,
      });
    }

    await this.prisma.productImage.createMany({
      data: uploaded.map((img) => ({
        productId,
        url: img.url,
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
      throw new Error('Imagem não encontrada');
    }

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    return { deleted: true };
  }
}
