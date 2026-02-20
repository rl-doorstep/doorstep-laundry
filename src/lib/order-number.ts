import { prisma } from "./db";

const PREFIX = "LOAD";

/**
 * Generate next order number for today: LOAD-YYYYMMDD-XXXX.
 * Uses OrderSequence table in a transaction to avoid collisions.
 */
export async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const datePrefix = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  return await prisma.$transaction(async (tx) => {
    const seq = await tx.orderSequence.upsert({
      where: { datePrefix },
      create: { datePrefix, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const num = seq.lastNumber;
    return `${PREFIX}-${datePrefix}-${String(num).padStart(4, "0")}`;
  });
}
