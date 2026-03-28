import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  EMAIL_VERIFY_EXPIRY_HOURS,
  buildVerifyEmailUrl,
  verificationEmailContent,
} from "@/lib/email-verification";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    console.error("Signup: DATABASE_URL is not set (check Vercel env vars)");
    return NextResponse.json(
      { error: "Service unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Signup: RESEND_API_KEY is not set; cannot send verification email");
    return NextResponse.json(
      {
        error:
          "Sign up is temporarily unavailable (email verification is not configured). Please try again later or contact support.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email: rawEmail, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: typeof name === "string" ? name : undefined,
        role: "customer",
        authProvider: "credentials",
        emailVerifiedAt: null,
      },
    });

    await prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt },
    });

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
      console.error("Signup verification email error:", e);
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: "We could not send the verification email. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    console.error("Signup error:", err.code ?? err.message ?? e);
    if (
      err.code === "P1001" ||
      err.code === "P1017" ||
      err.code === "P1002" ||
      err.code === "P1018"
    ) {
      return NextResponse.json(
        { error: "Service unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
