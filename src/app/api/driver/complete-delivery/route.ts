import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/lib/notify";

/**
 * POST: Complete a delivery run. Transition selected out_for_delivery orders to delivered
 * and cascade all their loads to delivered.
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

  const userId = (session.user as { id: string }).id;

  const orders = await prisma.order.findMany({ where: { id: { in: orderIds } } });
  if (orders.length !== orderIds.length) {
    return NextResponse.json({ error: "Some orders not found" }, { status: 404 });
  }

  for (const order of orders) {
    if (order.status !== "out_for_delivery") {
      return NextResponse.json(
        { error: `Order ${order.orderNumber} must be out for delivery (current: ${order.status}).` },
        { status: 400 }
      );
    }
  }

  for (const orderId of orderIds) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "delivered" },
    });
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "delivered",
        note: "Delivered (driver)",
        changedById: userId,
      },
    });
    await prisma.orderLoad.updateMany({
      where: { orderId },
      data: { status: "delivered" },
    });
    await sendOrderNotification(orderId, "delivered").catch((e) =>
      console.error("Notify delivered:", e)
    );
  }

  return NextResponse.json({ ok: true, orderIds });
}
