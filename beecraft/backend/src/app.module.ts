import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsModule } from './uploads/uploads.module';

import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    CategoriesModule,
    ProductsModule,
    PricingModule,
    UploadsModule,
  ],
})
export class AppModule {}
