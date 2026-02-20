import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const RESET_EXPIRY_HOURS = 1;

/**
 * POST: Request a password reset. Body: { email: string }
 * If the user exists (credentials account), creates a token and sends reset link.
 * Always returns the same success message to avoid leaking account existence.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user?.passwordHash) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const baseUrl =
        process.env.NEXTAUTH_URL ??
        (request.url ? new URL(request.url).origin : "");
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL ?? "notifications@example.com";
      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          await resend.emails.send({
            from,
            to: user.email,
            subject: "Reset your password – Doorstep Laundry",
            text: `You requested a password reset. Click the link below to set a new password (valid for ${RESET_EXPIRY_HOURS} hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
          });
        } catch (e) {
          console.error("Forgot password email error:", e);
        }
      }
    }

    return NextResponse.json({
      message: "If an account exists with that email, we've sent a password reset link.",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
