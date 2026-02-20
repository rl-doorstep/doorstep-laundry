/*
  Warnings:

  - A unique constraint covering the columns `[load_code]` on the table `OrderLoad` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OrderLoad" ADD COLUMN     "load_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OrderLoad_load_code_key" ON "OrderLoad"("load_code");
