export async function register() {
  const key = process.env.STRIPE_SECRET_KEY;
  const keyStatus = key
    ? `set (${key.startsWith("sk_live_") ? "LIVE" : key.startsWith("sk_test_") ? "test" : "unknown prefix"}, ...${key.slice(-4)})`
    : "NOT SET";
  console.log(`[startup] STRIPE_SECRET_KEY: ${keyStatus}`);
  console.log(`[startup] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "set" : "NOT SET"}`);
  console.log(`[startup] STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? "set" : "NOT SET"}`);
  console.log(`[startup] GOOGLE_MAPS_API_KEY: ${process.env.GOOGLE_MAPS_API_KEY ? "set" : "NOT SET"}`);
}
