import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH: Update a load location (admin only).
 * Body: { name?: string, sortOrder?: number }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { locationId } = await params;
  let body: { name?: string; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { name?: string; sortOrder?: number } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  if (Object.keys(data).length === 0) {
    const location = await prisma.loadLocation.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    return NextResponse.json(location);
  }

  try {
    const location = await prisma.loadLocation.update({
      where: { id: locationId },
      data,
    });
    return NextResponse.json(location);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A location with this name already exists" },
        { status: 409 }
      );
    }
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    throw e;
  }
}

/**
 * DELETE: Remove a load location (admin only).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { locationId } = await params;

  try {
    await prisma.loadLocation.delete({
      where: { id: locationId },
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    throw e;
  }
}
