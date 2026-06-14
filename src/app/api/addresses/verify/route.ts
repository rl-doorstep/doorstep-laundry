import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { smartyVerifyAddress } from "@/lib/smarty";

/**
 * POST: Verify a US address using Smarty Street Address API.
 * Body: { street, city, state, zip }
 * Returns: { valid: boolean, suggested?: { street, city, state, zip }, message?: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { street?: string; city?: string; state?: string; zip?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const street = typeof body.street === "string" ? body.street.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const zip = typeof body.zip === "string" ? body.zip.trim() : "";

  if (!street) {
    return NextResponse.json({ valid: false, message: "Address is required." }, { status: 400 });
  }

  const result = await smartyVerifyAddress({ street, city, state, zip });

  if (!result.valid) {
    return NextResponse.json({ valid: false, message: result.message });
  }

  const suggested = { street: result.street, city: result.city, state: result.state, zip: result.zip };
  return NextResponse.json({ valid: true, suggested });
}
