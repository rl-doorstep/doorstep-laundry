import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PRICE_PER_POUND_KEY = "price_per_pound_cents";
const DEFAULT_PRICE_PER_POUND_CENTS = 150;
const GRT_PERCENT_KEY = "grt_percent";
const DEFAULT_GRT_PERCENT = 8.39;

/**
 * GET: Return global settings (admin only). Includes pricePerPoundCents and grtPercent.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [priceRow, grtRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: PRICE_PER_POUND_KEY } }),
    prisma.setting.findUnique({ where: { key: GRT_PERCENT_KEY } }),
  ]);
  const pricePerPoundCents = priceRow
    ? parseInt(priceRow.value, 10) || DEFAULT_PRICE_PER_POUND_CENTS
    : DEFAULT_PRICE_PER_POUND_CENTS;
  const grtPercent = grtRow
    ? parseFloat(grtRow.value) || DEFAULT_GRT_PERCENT
    : DEFAULT_GRT_PERCENT;
  return NextResponse.json({ pricePerPoundCents, grtPercent });
}

/**
 * PATCH: Update settings (admin only). Body: { pricePerPoundCents?: number; grtPercent?: number }
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { pricePerPoundCents?: number; grtPercent?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result: { pricePerPoundCents?: number; grtPercent?: number } = {};

  if (typeof body.pricePerPoundCents === "number" && body.pricePerPoundCents >= 0) {
    const cents = Math.round(body.pricePerPoundCents);
    await prisma.setting.upsert({
      where: { key: PRICE_PER_POUND_KEY },
      create: {
        id: "setting-price-per-pound",
        key: PRICE_PER_POUND_KEY,
        value: String(cents),
      },
      update: { value: String(cents) },
    });
    result.pricePerPoundCents = cents;
  }

  if (typeof body.grtPercent === "number" && body.grtPercent >= 0 && body.grtPercent <= 100) {
    const value = Math.round(body.grtPercent * 100) / 100;
    await prisma.setting.upsert({
      where: { key: GRT_PERCENT_KEY },
      create: {
        id: "setting-grt-percent",
        key: GRT_PERCENT_KEY,
        value: String(value),
      },
      update: { value: String(value) },
    });
    result.grtPercent = value;
  }

  if (Object.keys(result).length === 0) {
    return NextResponse.json(
      { error: "Provide pricePerPoundCents and/or grtPercent (0–100)" },
      { status: 400 }
    );
  }
  return NextResponse.json(result);
}
