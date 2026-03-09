-- Add ready_for_wash to LoadStatus enum (between incoming and washing)
ALTER TYPE "LoadStatus" ADD VALUE 'ready_for_wash';
