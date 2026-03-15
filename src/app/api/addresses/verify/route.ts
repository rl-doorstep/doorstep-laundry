import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseAddressComponents, type AddressComponent } from "@/lib/address-parse";

type GeocodeResult = {
  results?: Array<{
    address_components?: AddressComponent[];
    formatted_address?: string;
  }>;
  status?: string;
};

/**
 * POST: Verify an address using Google Geocoding API.
 * Body: { street, city, state, zip }
 * Returns: { valid: boolean, suggested?: { street, city, state, zip }, message?: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { valid: false, message: "Address verification is not configured." },
      { status: 200 }
    );
  }

  let body: { street?: string; city?: string; state?: string; zip?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const street = typeof body.street === "string" ? body.street.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const zip = typeof body.zip === "string" ? body.zip.trim() : "";

  const fullAddress = [street, city, state, zip].filter(Boolean).join(", ");
  if (!fullAddress) {
    return NextResponse.json(
      { valid: false, message: "Address is required." },
      { status: 400 }
    );
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${encodeURIComponent(key)}`;
  let data: GeocodeResult;
  try {
    const res = await fetch(url);
    data = (await res.json()) as GeocodeResult;
  } catch (e) {
    console.error("Geocoding request failed:", e);
    return NextResponse.json(
      { valid: false, message: "Verification request failed." },
      { status: 500 }
    );
  }

  if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
    return NextResponse.json({
      valid: false,
      message: data.status === "ZERO_RESULTS" ? "Address not found." : "Could not verify address.",
    });
  }

  const first = data.results[0];
  const components = first?.address_components;
  if (!Array.isArray(components) || components.length === 0) {
    return NextResponse.json({
      valid: true,
      suggested: { street, city, state, zip },
    });
  }

  const suggested = parseAddressComponents(components);
  return NextResponse.json({
    valid: true,
    suggested,
  });
}
