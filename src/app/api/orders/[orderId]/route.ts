import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orderId } = await params;
  const role = (session.user as { role: string }).role;
  const userId = (session.user as { id: string }).id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: role !== "customer" ? { select: { id: true, name: true, email: true, phone: true } } : false,
      pickupAddress: true,
      deliveryAddress: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (role === "customer" && order.customerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (role === "customer" && order.customerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft orders can be deleted" },
      { status: 400 }
    );
  }

  try {
    await prisma.order.delete({ where: { id: orderId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("Delete order error:", e);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
