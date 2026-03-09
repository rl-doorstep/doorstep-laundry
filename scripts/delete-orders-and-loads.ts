/**
 * Delete all orders and their loads (and related status history, staff assignments).
 * Run from project root:
 *   npx tsx scripts/delete-orders-and-loads.ts
 *
 * Uses DATABASE_URL from .env (or environment).
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const deletedAssignments = await prisma.staffAssignment.deleteMany({});
  const deletedHistory = await prisma.orderStatusHistory.deleteMany({});
  const deletedLoads = await prisma.orderLoad.deleteMany({});
  const deletedOrders = await prisma.order.deleteMany({});

  console.log("Deleted:", {
    staffAssignments: deletedAssignments.count,
    orderStatusHistory: deletedHistory.count,
    orderLoads: deletedLoads.count,
    orders: deletedOrders.count,
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
