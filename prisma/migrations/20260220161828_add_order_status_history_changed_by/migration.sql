-- AlterTable
ALTER TABLE "OrderStatusHistory" ADD COLUMN     "changed_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
