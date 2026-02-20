import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role !== "customer" && role !== "staff" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { orderId } = body;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.customerId !== userId && role === "customer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.stripePaymentId) {
    return NextResponse.json(
      { error: "Order already paid" },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
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
            unit_amount: order.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/orders/${orderId}?paid=1`,
      cancel_url: `${baseUrl}/book?cancelled=1`,
      metadata: {
        orderId,
        order_number: order.orderNumber,
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
