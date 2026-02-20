import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DELIVERABLE_STATUSES = ["ready_for_delivery", "out_for_delivery"] as const;

/**
 * POST: Assign a driver to an order. Staff or admin.
 * Body: { staffId: string }
 */
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
  let body: { staffId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const staffId = body.staffId;
  if (!staffId || typeof staffId !== "string") {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!DELIVERABLE_STATUSES.includes(order.status as typeof DELIVERABLE_STATUSES[number])) {
    return NextResponse.json(
      { error: "Order must be ready_for_delivery or out_for_delivery to assign driver" },
      { status: 400 }
    );
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });
  if (!staff || (staff.role !== "staff" && staff.role !== "admin")) {
    return NextResponse.json({ error: "Invalid staff user" }, { status: 400 });
  }

  await prisma.staffAssignment.upsert({
    where: {
      orderId_staffId_role: {
        orderId,
        staffId,
        role: "driver",
      },
    },
    create: {
      orderId,
      staffId,
      role: "driver",
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
