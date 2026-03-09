import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** PATCH: Admin-only. Set order-level pricing override (orderPricePerPoundCents, nmgrtExempt). */
export async function PATCH(
  request: Request,
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
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json(
      { error: "Cannot update pricing for cancelled order" },
      { status: 400 }
    );
  }

  let body: { orderPricePerPoundCents?: number | null; nmgrtExempt?: boolean | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    orderPricePerPoundCents?: number | null;
    nmgrtExempt?: boolean | null;
  } = {};
  if (body.orderPricePerPoundCents !== undefined) {
    data.orderPricePerPoundCents =
      body.orderPricePerPoundCents === null
        ? null
        : typeof body.orderPricePerPoundCents === "number" &&
            body.orderPricePerPoundCents >= 0
          ? Math.round(body.orderPricePerPoundCents)
          : undefined;
    if (data.orderPricePerPoundCents === undefined) delete data.orderPricePerPoundCents;
  }
  if (body.nmgrtExempt !== undefined) {
    data.nmgrtExempt =
      body.nmgrtExempt === null ? null : Boolean(body.nmgrtExempt);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(order);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
  });
  return NextResponse.json(updated);
}
