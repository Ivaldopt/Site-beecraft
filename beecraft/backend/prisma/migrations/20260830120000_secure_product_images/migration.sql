ALTER TABLE "ProductImage" ADD COLUMN "publicId" TEXT;

CREATE UNIQUE INDEX "ProductImage_publicId_key" ON "ProductImage"("publicId");
