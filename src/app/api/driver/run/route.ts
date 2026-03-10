import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/lib/notify";

/**
 * GET: Current driver's active run (latest run with at least one order not delivered), or null.
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

  const driverId = (session.user as { id: string }).id;
  const runs = await prisma.driverRun.findMany({
    where: { driverId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  for (const run of runs) {
    const orderIds = run.orderIds as string[];
    const delivered = await prisma.order.count({
      where: { id: { in: orderIds }, status: "delivered" },
    });
    if (delivered < orderIds.length) {
      return NextResponse.json({
        runId: run.id,
        orderIds,
        startedAt: run.startedAt,
      });
    }
  }

  return NextResponse.json({ run: null });
}

/**
 * POST: Start a delivery run. Create DriverRun and set each order to out_for_delivery.
 * Body: { orderIds: string[] }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { orderIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderIds = body.orderIds;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: "orderIds array required" }, { status: 400 });
  }

  const driverId = (session.user as { id: string }).id;

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { orderLoads: true },
  });

  if (orders.length !== orderIds.length) {
    return NextResponse.json({ error: "Some orders not found" }, { status: 404 });
  }

  for (const order of orders) {
    if (order.status !== "ready_for_delivery") {
      return NextResponse.json(
        { error: `Order ${order.orderNumber} must be ready for delivery (current: ${order.status}). Only orders with all loads ready can be picked up.` },
        { status: 400 }
      );
    }
    const loads = order.orderLoads ?? [];
    if (loads.length === 0) {
      return NextResponse.json(
        { error: `Order ${order.orderNumber} has no loads` },
        { status: 400 }
      );
    }
    const allReady = loads.every((l) => l.status === "ready_for_delivery");
    if (!allReady) {
      return NextResponse.json(
        { error: `Order ${order.orderNumber} has loads not ready for delivery. All loads must be folded before pick up.` },
        { status: 400 }
      );
    }
  }

  const run = await prisma.driverRun.create({
    data: {
      driverId,
      orderIds,
    },
  });

  for (const orderId of orderIds) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "out_for_delivery" },
    });
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "out_for_delivery",
        note: "Out for delivery (run started)",
        changedById: driverId,
      },
    });
    await prisma.orderLoad.updateMany({
      where: { orderId },
      data: { status: "out_for_delivery", location: "Out for delivery" },
    });
    await sendOrderNotification(orderId, "out_for_delivery").catch((e) =>
      console.error("Notify out_for_delivery:", e)
    );
  }

  return NextResponse.json({
    runId: run.id,
    orderIds,
    startedAt: run.startedAt,
  });
}
