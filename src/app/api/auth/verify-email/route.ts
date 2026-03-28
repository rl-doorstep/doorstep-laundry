import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST: Body { token: string }. Marks email verified and removes verification tokens.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json(
        { error: "Verification link is invalid or expired." },
        { status: 400 }
      );
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Verification link is invalid or expired." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Verify email error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
