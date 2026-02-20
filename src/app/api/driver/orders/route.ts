import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET: Orders available to any driver:
 * - ready_for_delivery with ALL loads ready_for_delivery (available to pick up)
 * - out_for_delivery that are in the current user's active run (my run)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as { id: string }).id;

  const include = {
    customer: { select: { id: true, name: true, email: true, phone: true } },
    deliveryAddress: true,
    orderLoads: { orderBy: { loadNumber: "asc" } },
  } as const;

  const readyOrders = await prisma.order.findMany({
    where: { status: "ready_for_delivery" },
    include,
    orderBy: { deliveryDate: "asc" },
  });

  const runs = await prisma.driverRun.findMany({
    where: { driverId: userId },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  let runOrderIds: string[] = [];
  for (const run of runs) {
    const ids = run.orderIds as string[];
    const delivered = await prisma.order.count({
      where: { id: { in: ids }, status: "delivered" },
    });
    if (delivered < ids.length) {
      runOrderIds = ids;
      break;
    }
  }

  const runOrders =
    runOrderIds.length > 0
      ? await prisma.order.findMany({
          where: { id: { in: runOrderIds }, status: "out_for_delivery" },
          include,
        })
      : [];

  const readyWithAllLoads = readyOrders.filter((order) => {
    const loads = order.orderLoads ?? [];
    if (loads.length === 0) return false;
    return loads.every((l) => l.status === "ready_for_delivery");
  });

  const byId = new Map<string, (typeof readyOrders)[number]>();
  for (const o of readyWithAllLoads) byId.set(o.id, o);
  for (const o of runOrders) byId.set(o.id, o);

  const runIdSet = new Set(runOrderIds);
  const ordered = runOrderIds.length
    ? [
        ...runOrderIds.map((id) => byId.get(id)).filter(Boolean),
        ...Array.from(byId.values()).filter((o) => !runIdSet.has(o.id)),
      ]
    : Array.from(byId.values());

  return NextResponse.json(ordered);
}
