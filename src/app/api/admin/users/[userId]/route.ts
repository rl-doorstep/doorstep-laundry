import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["customer", "staff", "admin"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newRole = body.role as Role | undefined;
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    return NextResponse.json(
      { error: "role must be one of: customer, staff, admin" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json(updated);
}
