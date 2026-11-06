CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "stripeSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "paymentEmailSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");
