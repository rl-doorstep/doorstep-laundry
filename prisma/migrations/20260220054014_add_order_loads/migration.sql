-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('washing', 'drying', 'folding', 'ready_for_delivery');

-- CreateTable
CREATE TABLE "OrderLoad" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "load_number" INTEGER NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'washing',
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLoad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderLoad_order_id_idx" ON "OrderLoad"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLoad_order_id_load_number_key" ON "OrderLoad"("order_id", "load_number");

-- AddForeignKey
ALTER TABLE "OrderLoad" ADD CONSTRAINT "OrderLoad_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
