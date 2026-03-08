import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST: Test route optimization with raw addresses. Admin only.
 * Uses Google Routes API (Compute Routes) with optimizeWaypointOrder for an organized stop order.
 * Body: { addresses: string[] }
 * Returns { addresses: string[] } in optimized order.
 * @see https://developers.google.com/maps/documentation/routes/opt-way
 * @see https://developers.google.com/maps/documentation/routes/compute_route_directions
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

  // Format addresses for geocoding (city, state USA). Routes API accepts address strings.
  function formatAddress(addr: string): string {
    const s = addr.trim();
    if (!s) return s;
    if (s.includes(", ")) return s.endsWith("USA") ? s : s + " USA";
    const parts = s.split(/\s+/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (last.length === 2 && /^[A-Za-z]{2}$/.test(last)) {
        const state = parts.pop()!;
        const city = parts.join(" ");
        return city + ", " + state + " USA";
      }
    }
    return s + " USA";
  }

  const formatted = addresses.map(formatAddress);
  const origin = formatted[0];
  const destination = formatted[formatted.length - 1];
  const intermediates = formatted.length > 2 ? formatted.slice(1, -1) : [];

  const requestBody = {
    origin: { address: origin },
    destination: { address: destination },
    ...(intermediates.length > 0
      ? {
          intermediates: intermediates.map((address) => ({ address })),
          optimizeWaypointOrder: true,
        }
      : {}),
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
  };

  let res: Response;
  try {
    console.log("[debug/optimize-route] Calling Google Routes API (computeRoutes with optimizeWaypointOrder)");
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
    return NextResponse.json({ error: "Routes request failed" }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  const order = data.routes?.[0]?.optimizedIntermediateWaypointIndex;
  console.log("[debug/optimize-route] Routes API response:", order != null ? `optimizedIntermediateWaypointIndex=${JSON.stringify(order)}` : "error or no route");

  if (addresses.length <= 2) {
    return NextResponse.json({ addresses, optimized: true });
  }

  if (!Array.isArray(order) || order.length !== intermediates.length) {
    const msg = data.error?.message ?? data.error_message ?? "No optimized order returned";
    return NextResponse.json({
      addresses,
      optimized: false,
      note: `Routes API did not return an optimized order. ${msg} Ensure Routes API is enabled and GOOGLE_MAPS_API_KEY has access.`,
    });
  }

  const optimized = [
    addresses[0],
    ...order.map((i: number) => addresses[i + 1]),
    addresses[addresses.length - 1],
  ];

  return NextResponse.json({ addresses: optimized, optimized: true });
}
