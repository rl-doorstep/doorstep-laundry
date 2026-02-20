import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  try {
    const body = await request.json();
    const { name, phone } = body as { name?: string; phone?: string };
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof name === "string" && { name }),
        ...(typeof phone === "string" && { phone }),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Update account error:", e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
