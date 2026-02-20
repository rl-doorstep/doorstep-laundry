import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  try {
    const body = await request.json();
    const { label, street, city, state, zip, isDefault } = body as {
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      isDefault?: boolean;
    };
    if (!label || !street || !city || !state || !zip) {
      return NextResponse.json(
        { error: "label, street, city, state, zip required" },
        { status: 400 }
      );
    }
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: {
        userId,
        label,
        street,
        city,
        state,
        zip,
        isDefault: Boolean(isDefault),
      },
    });
    return NextResponse.json(address);
  } catch (e) {
    console.error("Create address error:", e);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
