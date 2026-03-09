import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LoadStatus } from "@prisma/client";

const VALID_LOAD_STATUSES: LoadStatus[] = [
  "ready_for_pickup",
  "incoming",
  "ready_for_wash",
  "washing",
  "drying",
  "folding",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ loadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { loadId } = await params;
  let body: { status?: string; location?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const load = await prisma.orderLoad.findUnique({
    where: { id: loadId },
    include: { order: true },
  });
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  const data: { status?: LoadStatus; location?: string | null } = {};
  if (body.status != null) {
    const s = body.status as LoadStatus;
    if (!VALID_LOAD_STATUSES.includes(s)) {
      return NextResponse.json({ error: "Invalid load status" }, { status: 400 });
    }
    data.status = s;
  }
  if (body.location !== undefined) {
    data.location = body.location === "" || body.location == null ? null : String(body.location);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(load);
  }

  const updated = await prisma.orderLoad.update({
    where: { id: loadId },
    data,
    include: { order: true },
  });

  // Sync order status from load statuses:
  // - ready_for_delivery when all loads are ready_for_delivery
  // - picked_up when order is in_progress and all loads are out of washing
  // - in_progress when any load is incoming/ready_for_wash/washing/drying/folding
  const orderId = load.orderId;
  const allLoads = await prisma.orderLoad.findMany({
    where: { orderId },
    select: { status: true },
  });
  type LoadRow = { status: string };
  const anyInProgress = allLoads.some((l: LoadRow) =>
    ["incoming", "ready_for_wash", "washing", "drying", "folding"].includes(l.status)
  );
  const allReady = allLoads.length > 0 && allLoads.every((l: LoadRow) => l.status === "ready_for_delivery");
  const noLoadInWashing =
    allLoads.length > 0 && !allLoads.some((l: LoadRow) => l.status === "washing");

  const currentOrderStatus = updated.order.status;
  type OrderStatus = import("@prisma/client").OrderStatus;
  const canSetStatus =
    currentOrderStatus !== "out_for_delivery" &&
    currentOrderStatus !== "delivered" &&
    currentOrderStatus !== "cancelled";
  let newOrderStatus: OrderStatus | null = null;
  if (allReady && canSetStatus) {
    newOrderStatus = "ready_for_delivery";
  } else if (
    currentOrderStatus === "in_progress" &&
    noLoadInWashing &&
    canSetStatus
  ) {
    newOrderStatus = "picked_up";
  } else if (anyInProgress && canSetStatus) {
    newOrderStatus = "in_progress";
  }

  if (newOrderStatus) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newOrderStatus },
    });
    const note =
      newOrderStatus === "ready_for_delivery"
        ? "All loads folded (ready for delivery)"
        : newOrderStatus === "picked_up"
          ? "All loads moved out of washing"
          : "Wash started (load status updated)";
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: newOrderStatus,
        note,
        changedById: (session.user as { id: string }).id,
      },
    });
  }

  return NextResponse.json(updated);
}
