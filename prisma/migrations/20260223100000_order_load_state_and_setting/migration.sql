-- Add new OrderStatus values (before replacing enum)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ready_for_wash';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'waiting_for_payment';

-- Add cleaned to LoadStatus
ALTER TYPE "LoadStatus" ADD VALUE IF NOT EXISTS 'cleaned';

-- OrderLoad.weightLbs
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "weight_lbs" DOUBLE PRECISION;

-- Setting table for global config
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");

-- Seed default price per pound ($1.50 = 150 cents)
INSERT INTO "Setting" ("id", "key", "value", "updated_at")
SELECT 'clxx0000000000000000000001', 'price_per_pound_cents', '150', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key" = 'price_per_pound_cents');

-- Replace OrderStatus enum: remove draft, add ready_for_wash and waiting_for_payment
-- Create new enum without draft
CREATE TYPE "OrderStatus_new" AS ENUM (
  'scheduled',
  'picked_up',
  'ready_for_wash',
  'in_progress',
  'waiting_for_payment',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Migrate Order table
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING (CASE WHEN status::text = 'draft' THEN 'scheduled'::"OrderStatus_new" ELSE status::text::"OrderStatus_new" END);
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"OrderStatus_new";

-- Migrate OrderStatusHistory table
ALTER TABLE "OrderStatusHistory" ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING (CASE WHEN status::text = 'draft' THEN 'scheduled'::"OrderStatus_new" ELSE status::text::"OrderStatus_new" END);

-- Drop old enum and rename new
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
