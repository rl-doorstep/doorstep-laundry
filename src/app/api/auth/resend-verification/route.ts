import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  EMAIL_VERIFY_EXPIRY_HOURS,
  buildVerifyEmailUrl,
  verificationEmailContent,
} from "@/lib/email-verification";

const PUBLIC_MESSAGE =
  "If an account exists and still needs verification, we've sent a verification link.";

/**
 * POST: Body { email: string }. Same response whether user exists (privacy).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user?.passwordHash && user.emailVerifiedAt == null) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(
          Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000
        );

        await prisma.$transaction([
          prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id },
          }),
          prisma.emailVerificationToken.create({
            data: { token, userId: user.id, expiresAt },
          }),
        ]);

        const baseUrl =
          process.env.NEXTAUTH_URL ??
          (request.url ? new URL(request.url).origin : "");
        const verifyUrl = buildVerifyEmailUrl(baseUrl, token);
        const { subject, text } = verificationEmailContent(verifyUrl);
        const from = process.env.RESEND_FROM_EMAIL ?? "notifications@example.com";

        try {
          const resend = new Resend(apiKey);
          await resend.emails.send({
            from,
            to: user.email,
            subject,
            text,
          });
        } catch (e) {
          console.error("Resend verification email error:", e);
        }
      }
    }

    return NextResponse.json({ message: PUBLIC_MESSAGE });
  } catch (e) {
    console.error("Resend verification error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
