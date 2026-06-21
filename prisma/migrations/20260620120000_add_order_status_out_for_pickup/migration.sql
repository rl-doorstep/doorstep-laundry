-- Add out_for_pickup to OrderStatus enum (already applied via db push)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'out_for_pickup' AFTER 'scheduled';
