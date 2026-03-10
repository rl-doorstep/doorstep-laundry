-- AlterTable
ALTER TABLE "DriverRun" ADD COLUMN IF NOT EXISTS "pickup_order_ids" JSONB;
