-- User: custom pricing and default load options
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "custom_price_per_pound_cents" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nmgrt_exempt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "default_load_options" JSONB;

-- Order: per-order pricing overrides
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "order_price_per_pound_cents" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "nmgrt_exempt" BOOLEAN;

-- OrderLoad: per-load wash options
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "hot_water" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "bleach" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "hypoallergenic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "fabric_softener" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "delicate_cycle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "extra_rinse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "scent_free" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "cold_water_only" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderLoad" ADD COLUMN IF NOT EXISTS "hang_dry" BOOLEAN NOT NULL DEFAULT false;
