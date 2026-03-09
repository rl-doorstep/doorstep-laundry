import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LoadStatus } from "@prisma/client";
import { getOrderStatusFromLoads } from "@/lib/order-transitions";

const VALID_LOAD_STATUSES: LoadStatus[] = [
  "ready_for_pickup",
  "incoming",
  "ready_for_wash",
  "washing",
  "drying",
  "folding",
  "cleaned",
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
  let body: { status?: string; location?: string; weightLbs?: number };
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

  const data: { status?: LoadStatus; location?: string | null; weightLbs?: number | null } = {};
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
  if (body.weightLbs !== undefined) {
    const w = typeof body.weightLbs === "number" && body.weightLbs >= 0 ? body.weightLbs : null;
    data.weightLbs = w;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(load);
  }

  const updated = await prisma.orderLoad.update({
    where: { id: loadId },
    data,
    include: { order: true },
  });

  const orderId = load.orderId;
  const allLoads = await prisma.orderLoad.findMany({
    where: { orderId },
    select: { status: true, location: true, weightLbs: true },
  });
  const currentOrderStatus = updated.order.status as import("@/lib/order-transitions").OrderStatus;
  const newOrderStatus = getOrderStatusFromLoads(currentOrderStatus, allLoads);

  if (newOrderStatus) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newOrderStatus },
    });
    const note = getNoteForOrderStatusChange(newOrderStatus);
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: newOrderStatus,
        note,
        changedById: (session.user as { id: string }).id,
      },
    });

    if (newOrderStatus === "waiting_for_payment") {
      await handleWaitingForPayment(orderId, session.user as { id: string }).catch((e) =>
        console.error("handleWaitingForPayment:", e)
      );
    }
  }

  return NextResponse.json(updated);
}

function getNoteForOrderStatusChange(status: string): string {
  const notes: Record<string, string> = {
    ready_for_delivery: "All loads folded (ready for delivery)",
    waiting_for_payment: "All loads cleaned and weighed; payment link sent",
    ready_for_wash: "All loads have shelf location",
    in_progress: "Wash started (load status updated)",
  };
  return notes[status] ?? "Order status updated";
}

async function handleWaitingForPayment(
  orderId: string,
  _user: { id: string }
): Promise<void> {
  const { prisma } = await import("@/lib/db");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderLoads: true, customer: { select: { email: true, phone: true } } },
  });
  if (!order || order.status !== "waiting_for_payment") return;
  const loads = order.orderLoads;
  const totalLbs = loads.reduce((sum: number, l: { weightLbs?: number | null }) => sum + (l.weightLbs ?? 0), 0);
  if (totalLbs <= 0) return;
  const setting = await prisma.setting.findUnique({
    where: { key: "price_per_pound_cents" },
  });
  const pricePerPoundCents = setting ? parseInt(setting.value, 10) || 150 : 150;
  const totalCents = Math.round(totalLbs * pricePerPoundCents);
  await prisma.order.update({
    where: { id: orderId },
    data: { totalCents },
  });
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  let paymentUrl = `${baseUrl}/orders/${orderId}`;
  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Laundry order ${order.orderNumber}`,
              description: `Pickup ${new Date(order.pickupDate).toLocaleDateString()}, delivery ${new Date(order.deliveryDate).toLocaleDateString()}`,
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/orders/${orderId}?paid=1`,
      cancel_url: `${baseUrl}/orders/${orderId}`,
      metadata: { orderId, order_number: order.orderNumber },
    });
    if (session.url) paymentUrl = session.url;
  } catch (e) {
    console.error("Stripe checkout session for notification:", e);
  }
  const { sendOrderNotification } = await import("@/lib/notify");
  await sendOrderNotification(orderId, "ready_for_payment", {
    orderNumber: order.orderNumber,
    totalCents,
    totalLbs,
    perLoadLbs: loads.map((l: { weightLbs?: number | null }) => l.weightLbs ?? 0),
    paymentUrl,
  });
}
