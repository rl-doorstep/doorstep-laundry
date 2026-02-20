import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/order-number";
import { sendOrderNotification } from "@/lib/notify";
import type { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;

  const { searchParams } = new URL(request.url);
  const pickupDate = searchParams.get("pickupDate");
  const status = searchParams.get("status");

  if (role === "staff" || role === "admin") {
    const where: { pickupDate?: { gte: Date; lte: Date }; status?: OrderStatus } = {};
    if (pickupDate) {
      const d = new Date(pickupDate);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      where.pickupDate = { gte: start, lte: end };
    }
    if (status) where.status = status as OrderStatus;
    const orders = await prisma.order.findMany({
      where,
      orderBy: { pickupDate: "asc" },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupAddress: true,
        deliveryAddress: true,
      },
    });
    return NextResponse.json(orders);
  }

  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
    },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (role !== "customer" && role !== "staff" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const customerId = (session.user as { id: string }).id;
  if (role === "customer") {
    const orders = await prisma.order.findMany({ where: { customerId } });
    if (orders.length >= 100) {
      return NextResponse.json(
        { error: "Order limit reached" },
        { status: 400 }
      );
    }
  }

  try {
    const body = await request.json();
    const {
      pickupAddressId,
      deliveryAddressId,
      pickupDate,
      deliveryDate,
      notes,
      totalCents,
    } = body as {
      pickupAddressId?: string;
      deliveryAddressId?: string;
      pickupDate?: string;
      deliveryDate?: string;
      notes?: string;
      totalCents?: number;
    };
    if (
      !pickupAddressId ||
      !deliveryAddressId ||
      !pickupDate ||
      !deliveryDate ||
      typeof totalCents !== "number" ||
      totalCents < 0
    ) {
      return NextResponse.json(
        { error: "pickupAddressId, deliveryAddressId, pickupDate, deliveryDate, totalCents required" },
        { status: 400 }
      );
    }

    const orderCustomerId = (body as { customerId?: string }).customerId;
    const effectiveCustomerId = role === "customer" ? customerId : orderCustomerId ?? customerId;
    if (!effectiveCustomerId) {
      return NextResponse.json({ error: "customerId required for staff" }, { status: 400 });
    }

    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);
    if (isNaN(pickup.getTime()) || isNaN(delivery.getTime())) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    const orderNumber = await generateOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: effectiveCustomerId,
        pickupAddressId,
        deliveryAddressId,
        pickupDate: pickup,
        deliveryDate: delivery,
        notes: notes ?? null,
        totalCents,
        status: "draft",
      },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
      },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "draft", note: "Order created" },
    });
    await sendOrderNotification(order.id, "order_created").catch((e) =>
      console.error("Notify order_created:", e)
    );
    return NextResponse.json(order);
  } catch (e) {
    console.error("Create order error:", e);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
