import Stripe from "stripe";

export const stripe =
  process.env.STRIPE_SECRET_KEY ?
    new Stripe(process.env.STRIPE_SECRET_KEY, {})
  : null;

export function getStripe(): Stripe {
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");
  return stripe;
}
