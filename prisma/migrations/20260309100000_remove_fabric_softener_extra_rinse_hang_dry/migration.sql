-- Remove load options: fabric softener, extra rinse, hang dry
ALTER TABLE "OrderLoad" DROP COLUMN IF EXISTS "fabric_softener";
ALTER TABLE "OrderLoad" DROP COLUMN IF EXISTS "extra_rinse";
ALTER TABLE "OrderLoad" DROP COLUMN IF EXISTS "hang_dry";
