-- Add ready_for_pickup to LoadStatus enum (default set in next migration to avoid same-transaction use)
ALTER TYPE "LoadStatus" ADD VALUE 'ready_for_pickup';
