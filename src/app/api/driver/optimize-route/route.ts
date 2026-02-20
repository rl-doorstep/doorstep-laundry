import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

function formatAddress(a: { street: string; city: string; state: string; zip: string }) {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`.trim();
}

/**
 * POST: Return order IDs in optimized route order using Google Directions API.
 * Body: { orderIds: string[] }
 * If GOOGLE_MAPS_API_KEY is missing, returns orderIds unchanged.
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
    orders.map((o) => [o.id, formatAddress(o.deliveryAddress)])
  );

  const addresses = orderIds.map((id) => idToAddress.get(id)!).filter(Boolean);
  if (addresses.length === 0) {
    return NextResponse.json({ orderIds });
  }

  const origin = encodeURIComponent(addresses[0]);
  const destination = encodeURIComponent(addresses[addresses.length - 1]);
  const waypoints =
    addresses.length <= 2
      ? ""
      : "optimize:true|" + addresses.slice(1, -1).map((a) => encodeURIComponent(a)).join("|");

  const url =
    "https://maps.googleapis.com/maps/api/directions/json?" +
    `origin=${origin}&destination=${destination}&key=${key}` +
    (waypoints ? `&waypoints=${waypoints}` : "");

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error("Directions API error:", e);
    return NextResponse.json({ orderIds, optimized: false, note: "Directions request failed." });
  }

  const data = await res.json().catch(() => ({}));
  if (data.status !== "OK" || !data.routes?.[0]) {
    return NextResponse.json({
      orderIds,
      optimized: false,
      note: data.error_message || "No route returned.",
    });
  }

  const route = data.routes[0];
  const waypointOrder: number[] = route.waypoint_order ?? [];
  if (orderIds.length <= 2) {
    return NextResponse.json({ orderIds, optimized: true });
  }

  const optimized: string[] = [
    orderIds[0],
    ...waypointOrder.map((i) => orderIds[i + 1]),
    orderIds[orderIds.length - 1],
  ];

  return NextResponse.json({ orderIds: optimized, optimized: true });
}
