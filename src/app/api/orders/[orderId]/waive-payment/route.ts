import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentWaived) {
    return NextResponse.json({ error: "Payment already waived" }, { status: 400 });
  }
  if (order.stripePaymentId) {
    return NextResponse.json({ error: "Order has already been paid" }, { status: 400 });
  }

  const adminId = (session.user as { id: string }).id;

  // Mirror what the Stripe webhook does: advance waiting_for_payment → ready_for_delivery,
  // or just set the flag if delivery is already in progress.
  if (order.status === "waiting_for_payment") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentWaived: true, status: "ready_for_delivery" },
    });
    await prisma.orderLoad.updateMany({
      where: { orderId },
      data: { status: "ready_for_delivery" },
    });
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "ready_for_delivery",
        note: "Payment waived by admin",
        changedById: adminId,
      },
    });
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentWaived: true },
    });
  }

  return NextResponse.json({ ok: true });
}
