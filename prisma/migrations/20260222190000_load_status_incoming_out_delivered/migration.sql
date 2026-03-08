-- Add incoming, out_for_delivery, delivered to LoadStatus enum
ALTER TYPE "LoadStatus" ADD VALUE 'incoming';
ALTER TYPE "LoadStatus" ADD VALUE 'out_for_delivery';
ALTER TYPE "LoadStatus" ADD VALUE 'delivered';

-- Set default for new loads (ready_for_pickup added in previous migration)
ALTER TABLE "OrderLoad" ALTER COLUMN "status" SET DEFAULT 'ready_for_pickup';
