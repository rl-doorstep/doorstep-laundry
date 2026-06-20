export async function register() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripeKeyStatus = stripeKey
    ? `set (${stripeKey.startsWith("sk_live_") ? "LIVE" : stripeKey.startsWith("sk_test_") ? "test" : "unknown prefix"}, ...${stripeKey.slice(-4)})`
    : "NOT SET";

  const vars: [string, string][] = [
    ["DATABASE_URL", process.env.DATABASE_URL ? "set" : "NOT SET"],
    ["NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET ? "set" : "NOT SET"],
    ["NEXTAUTH_URL", process.env.NEXTAUTH_URL ?? "NOT SET"],
    ["GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID ? "set" : "NOT SET"],
    ["GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET ? "set" : "NOT SET"],
    ["NEXT_PUBLIC_GOOGLE_ENABLED", process.env.NEXT_PUBLIC_GOOGLE_ENABLED ?? "NOT SET"],
    ["GOOGLE_MAPS_API_KEY", process.env.GOOGLE_MAPS_API_KEY ? "set" : "NOT SET"],
    ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "set" : "NOT SET"],
    ["STRIPE_SECRET_KEY", stripeKeyStatus],
    ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "set" : "NOT SET"],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET ? "set" : "NOT SET"],
    ["RESEND_API_KEY", process.env.RESEND_API_KEY ? "set" : "NOT SET"],
    ["RESEND_FROM_EMAIL", process.env.RESEND_FROM_EMAIL ?? "NOT SET"],
    ["TWILIO_ACCOUNT_SID", process.env.TWILIO_ACCOUNT_SID ? "set" : "NOT SET"],
    ["TWILIO_AUTH_TOKEN", process.env.TWILIO_AUTH_TOKEN ? "set" : "NOT SET"],
    ["TWILIO_MESSAGING_SERVICE_SID", process.env.TWILIO_MESSAGING_SERVICE_SID ? "set" : "NOT SET"],
    ["LABEL_PRINTER_URL", process.env.LABEL_PRINTER_URL ?? "NOT SET"],
  ];

  for (const [name, status] of vars) {
    console.log(`[startup] ${name}: ${status}`);
  }
}
