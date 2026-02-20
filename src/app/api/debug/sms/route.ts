import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Twilio from "twilio";

/**
 * POST: Send a test SMS via Twilio. Admin only.
 * Body: { to: string, message: string }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    return NextResponse.json(
      { error: "Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)" },
      { status: 503 }
    );
  }

  let body: { to?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "Test from Doorstep Debug";
  if (!to) {
    return NextResponse.json({ error: "to (phone number) is required" }, { status: 400 });
  }

  try {
    const client = Twilio(sid, token);
    const result = await client.messages.create({
      body: message,
      from,
      to,
    });
    return NextResponse.json({ ok: true, sid: result.sid });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: number; status?: number; moreInfo?: string };
    console.error("Debug Twilio error:", e);
    const status = err.status === 400 ? 400 : 500;
    let message = err.message ?? "Twilio send failed";
    if (err.code === 21660) {
      message =
        "The 'From' number in TWILIO_PHONE_NUMBER isn't on this Twilio account. Use a number from your Twilio console (Phone Numbers) or a verified caller ID.";
      if (err.moreInfo) message += ` See: ${err.moreInfo}`;
    } else if (err.moreInfo) {
      message += ` See: ${err.moreInfo}`;
    }
    return NextResponse.json({ error: message }, { status });
  }
}
