import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/lib/notify";
import type { OrderStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["picked_up", "cancelled"],
  picked_up: ["in_progress"],
  in_progress: ["ready_for_delivery", "out_for_delivery"],
  ready_for_delivery: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { status, note } = body;
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }
  const newStatus = status as OrderStatus;
  if (!VALID_TRANSITIONS.hasOwnProperty(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed?.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      status: newStatus,
      note: typeof note === "string" ? note : undefined,
      changedById: (session.user as { id: string }).id,
    },
  });

  if (newStatus === "scheduled" || newStatus === "picked_up") {
    const orderWithNumber = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });
    const existingLoads = await prisma.orderLoad.count({
      where: { orderId },
    });
    if (
      orderWithNumber &&
      existingLoads < order.numberOfLoads
    ) {
      for (let n = existingLoads + 1; n <= order.numberOfLoads; n++) {
        await prisma.orderLoad.create({
          data: {
            orderId,
            loadNumber: n,
            loadCode: `${orderWithNumber.orderNumber}-L${n}`,
            status: "ready_for_pickup",
          },
        });
      }
    }
  }

  const eventMap: Partial<Record<OrderStatus, import("@/lib/notify").NotifyEvent>> = {
    scheduled: "pickup_scheduled",
    picked_up: "picked_up",
    in_progress: "in_progress",
    ready_for_delivery: "out_for_delivery",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
  };
  const event = eventMap[newStatus];
  if (event) {
    await sendOrderNotification(orderId, event).catch((e) =>
      console.error("Notify status:", e)
    );
  }

  if (newStatus === "delivered") {
    const driverId = (session.user as { id: string }).id;
    const runs = await prisma.driverRun.findMany({
      where: { driverId },
      orderBy: { startedAt: "desc" },
      take: 5,
    });
    const MINUTES_PER_STOP = 10;
    for (const run of runs) {
      const orderIds = run.orderIds as string[];
      const idx = orderIds.indexOf(orderId);
      if (idx === -1) continue;
      const deliveredOrders = await prisma.order.findMany({
        where: { id: { in: orderIds }, status: "delivered" },
        select: { id: true },
      });
      const deliveredSet = new Set(deliveredOrders.map((o) => o.id));
      for (let i = idx + 1; i < orderIds.length; i++) {
        const oid = orderIds[i];
        if (deliveredSet.has(oid)) continue;
        const stopsAway = orderIds.slice(idx + 1, i).filter((id) => !deliveredSet.has(id)).length;
        const etaMinutes = (stopsAway + 1) * MINUTES_PER_STOP;
        await sendOrderNotification(oid, "delivery_update", {
          stopsAway,
          etaMinutes,
        }).catch((e) => console.error("Notify delivery_update:", e));
      }
      break;
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
