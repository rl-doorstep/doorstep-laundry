import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
const keyStatus = key
  ? `set (${key.startsWith("sk_live_") ? "LIVE" : key.startsWith("sk_test_") ? "test" : "unknown prefix"}, ...${key.slice(-4)})`
  : "NOT SET";
console.log(`[stripe] STRIPE_SECRET_KEY: ${keyStatus}`);
console.log(`[stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "set" : "NOT SET"}`);
console.log(`[stripe] STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? "set" : "NOT SET"}`);

export const stripe = key ? new Stripe(key, {}) : null;

export function getStripe(): Stripe {
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");
  return stripe;
}
