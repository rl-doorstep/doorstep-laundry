import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PRICE_PER_POUND_KEY = "price_per_pound_cents";
const DEFAULT_PRICE_PER_POUND_CENTS = 150;

/**
 * GET: Return global settings (admin only). Includes pricePerPoundCents.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.setting.findUnique({
    where: { key: PRICE_PER_POUND_KEY },
  });
  const pricePerPoundCents = row
    ? parseInt(row.value, 10) || DEFAULT_PRICE_PER_POUND_CENTS
    : DEFAULT_PRICE_PER_POUND_CENTS;
  return NextResponse.json({ pricePerPoundCents });
}

/**
 * PATCH: Update price per pound (admin only). Body: { pricePerPoundCents: number }
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { pricePerPoundCents?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cents =
    typeof body.pricePerPoundCents === "number" && body.pricePerPoundCents >= 0
      ? Math.round(body.pricePerPoundCents)
      : null;
  if (cents === null) {
    return NextResponse.json(
      { error: "pricePerPoundCents must be a non-negative number" },
      { status: 400 }
    );
  }

  await prisma.setting.upsert({
    where: { key: PRICE_PER_POUND_KEY },
    create: {
      id: "setting-price-per-pound",
      key: PRICE_PER_POUND_KEY,
      value: String(cents),
    },
    update: { value: String(cents) },
  });
  return NextResponse.json({ pricePerPoundCents: cents });
}
