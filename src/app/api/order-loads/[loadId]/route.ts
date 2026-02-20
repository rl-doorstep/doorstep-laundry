import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { LoadStatus } from "@prisma/client";

const VALID_LOAD_STATUSES: LoadStatus[] = [
  "washing",
  "drying",
  "folding",
  "ready_for_delivery",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ loadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { loadId } = await params;
  let body: { status?: string; location?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const load = await prisma.orderLoad.findUnique({
    where: { id: loadId },
    include: { order: true },
  });
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  const data: { status?: LoadStatus; location?: string | null } = {};
  if (body.status != null) {
    const s = body.status as LoadStatus;
    if (!VALID_LOAD_STATUSES.includes(s)) {
      return NextResponse.json({ error: "Invalid load status" }, { status: 400 });
    }
    data.status = s;
  }
  if (body.location !== undefined) {
    data.location = body.location === "" || body.location == null ? null : String(body.location);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(load);
  }

  const updated = await prisma.orderLoad.update({
    where: { id: loadId },
    data,
  });
  return NextResponse.json(updated);
}
