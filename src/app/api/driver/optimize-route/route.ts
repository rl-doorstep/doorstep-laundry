import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

function formatAddress(a: { street: string; city: string; state: string; zip: string }) {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`.trim();
}

/**
 * POST: Return order IDs in optimized route order using Google Routes API (Compute Routes).
 * Body: { orderIds: string[] }
 * If GOOGLE_MAPS_API_KEY is missing, returns orderIds unchanged.
 * @see https://developers.google.com/maps/documentation/routes/opt-way
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

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({
      orderIds,
      optimized: false,
      note: "Route optimization skipped (no API key).",
    });
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { deliveryAddress: true },
  });

  if (orders.length !== orderIds.length) {
    return NextResponse.json({ error: "Some orders not found" }, { status: 404 });
  }

  const idToAddress = new Map(
    orders.map((o: (typeof orders)[0]) => [o.id, formatAddress(o.deliveryAddress)])
  );

  const addresses = orderIds
    .map((id) => idToAddress.get(id))
    .filter((a): a is string => Boolean(a));
  if (addresses.length === 0) {
    return NextResponse.json({ orderIds });
  }

  if (orderIds.length <= 2) {
    return NextResponse.json({ orderIds, optimized: true });
  }

  const withRegion = (a: string) => (a.trim().endsWith("USA") ? a : a.trim() + " USA");
  const origin = withRegion(addresses[0]!);
  const destination = withRegion(addresses[addresses.length - 1]!);
  const intermediates = addresses.slice(1, -1).map(withRegion);

  const requestBody = {
    origin: { address: origin },
    destination: { address: destination },
    intermediates: intermediates.map((address) => ({ address })),
    optimizeWaypointOrder: true,
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
  };

  let res: Response;
  try {
    res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.optimizedIntermediateWaypointIndex",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (e) {
    console.error("Routes API error:", e);
    return NextResponse.json({ orderIds, optimized: false, note: "Routes request failed." });
  }

  const data = await res.json().catch(() => ({}));
  const order = data.routes?.[0]?.optimizedIntermediateWaypointIndex;
  if (!Array.isArray(order) || order.length !== intermediates.length) {
    return NextResponse.json({
      orderIds,
      optimized: false,
      note: data.error?.message ?? data.error_message ?? "No optimized order returned.",
    });
  }

  const optimized: string[] = [
    orderIds[0],
    ...order.map((i: number) => orderIds[i + 1]),
    orderIds[orderIds.length - 1],
  ];

  return NextResponse.json({ orderIds: optimized, optimized: true });
}
