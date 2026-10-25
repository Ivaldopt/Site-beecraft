CREATE TYPE "EventPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
CREATE TYPE "EventOrderStatus" AS ENUM ('WAITING', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED');

CREATE TABLE "EventOrder" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "contact" TEXT NOT NULL,
  "pickup" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "paymentStatus" "EventPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "status" "EventOrderStatus" NOT NULL DEFAULT 'WAITING',
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventArtwork" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventArtwork_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventOrder_orderNumber_key" ON "EventOrder"("orderNumber");
CREATE UNIQUE INDEX "EventOrder_stripeSessionId_key" ON "EventOrder"("stripeSessionId");
CREATE UNIQUE INDEX "EventOrder_stripePaymentIntentId_key" ON "EventOrder"("stripePaymentIntentId");
CREATE INDEX "EventOrder_paymentStatus_createdAt_idx" ON "EventOrder"("paymentStatus", "createdAt");
CREATE INDEX "EventOrder_status_createdAt_idx" ON "EventOrder"("status", "createdAt");
CREATE UNIQUE INDEX "EventArtwork_publicId_key" ON "EventArtwork"("publicId");
CREATE INDEX "EventArtwork_orderId_sortOrder_idx" ON "EventArtwork"("orderId", "sortOrder");
ALTER TABLE "EventArtwork" ADD CONSTRAINT "EventArtwork_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EventOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
