ALTER TABLE "Customer"
  ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "marketingOptInAt" TIMESTAMP(3),
  ADD COLUMN "marketingOptInVersion" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "termsVersion" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

ALTER TABLE "EventOrder"
  ADD COLUMN "termsVersion" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
