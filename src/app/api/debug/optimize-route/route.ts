import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST: Test route optimization with raw addresses. Admin only.
 * Body: { addresses: string[] } - e.g. ["123 Main St, City, ST 12345", ...]
 * Returns { addresses: string[] } in optimized order, or error if no API key.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY not set" },
      { status: 503 }
    );
  }

  let body: { addresses?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const addresses = Array.isArray(body.addresses)
    ? body.addresses.map((a) => (typeof a === "string" ? a.trim() : "")).filter(Boolean)
    : [];
  if (addresses.length < 2) {
    return NextResponse.json(
      { error: "At least 2 addresses required" },
      { status: 400 }
    );
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
    return NextResponse.json({ error: "Directions request failed" }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (data.status !== "OK" || !data.routes?.[0]) {
    return NextResponse.json(
      { error: data.error_message ?? "No route returned" },
      { status: 502 }
    );
  }

  const route = data.routes[0];
  const waypointOrder: number[] = route.waypoint_order ?? [];
  if (addresses.length <= 2) {
    return NextResponse.json({ addresses, optimized: true });
  }

  const optimized = [
    addresses[0],
    ...waypointOrder.map((i: number) => addresses[i + 1]),
    addresses[addresses.length - 1],
  ];

  return NextResponse.json({ addresses: optimized, optimized: true });
}
