import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

/**
 * POST: Send a test email via Resend. Admin only.
 * Body: { to: string, subject: string, body: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "notifications@example.com";
  if (!apiKey) {
    return NextResponse.json(
      { error: "Resend not configured (RESEND_API_KEY)" },
      { status: 503 }
    );
  }

  let body: { to?: string; subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "Test from Doorstep Debug";
  const text = typeof body.body === "string" ? body.body.trim() : "This is a test email.";
  if (!to) {
    return NextResponse.json({ error: "to (email) is required" }, { status: 400 });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject,
      text,
    });
    if (result.error) {
      const msg =
        typeof result.error === "object" && result.error !== null && "message" in result.error
          ? String((result.error as { message: unknown }).message)
          : String(result.error);
      console.error("Debug Resend error:", result.error);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("Debug Resend error:", e);
    return NextResponse.json(
      { error: err.message ?? "Resend send failed" },
      { status: 500 }
    );
  }
}
