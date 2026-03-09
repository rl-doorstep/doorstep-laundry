/**
 * Order totals: base price per pound (order override > customer override > global) + NMGRT unless exempt.
 * subtotalCents = totalLbs × pricePerPoundCents (base)
 * taxCents = exempt ? 0 : round(subtotalCents × grtPercent / 100)
 * totalCents = subtotalCents + taxCents
 */

export type LoadWithWeight = { weightLbs?: number | null };

export type OrderPricingSource = {
  orderPricePerPoundCents?: number | null;
  nmgrtExempt?: boolean | null;
};

export type CustomerPricingSource = {
  customPricePerPoundCents?: number | null;
  nmgrtExempt?: boolean;
} | null;

/**
 * Resolve effective price per pound and NMGRT exempt from order > customer > defaults.
 */
export function getEffectivePricing(
  order: OrderPricingSource,
  customer: CustomerPricingSource,
  defaultPricePerPoundCents: number
): { pricePerPoundCents: number; nmgrtExempt: boolean } {
  const pricePerPoundCents =
    order.orderPricePerPoundCents ??
    customer?.customPricePerPoundCents ??
    defaultPricePerPoundCents;
  const nmgrtExempt =
    order.nmgrtExempt ?? customer?.nmgrtExempt ?? false;
  return { pricePerPoundCents, nmgrtExempt };
}

/**
 * Compute subtotal (base), tax (NMGRT unless exempt), and total from load weights and price per pound.
 * Use this when setting order.totalCents (weigh-in, checkout, resend payment).
 */
export function computeOrderTotalWithTax(
  loads: LoadWithWeight[],
  pricePerPoundCents: number,
  grtPercent: number,
  nmgrtExempt = false
): { subtotalCents: number; taxCents: number; totalCents: number } {
  const totalLbs = loads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  const subtotalCents = Math.round(totalLbs * pricePerPoundCents);
  const taxCents = nmgrtExempt
    ? 0
    : Math.round(subtotalCents * (grtPercent / 100));
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}

/**
 * Given stored totalCents (subtotal + tax), split back into subtotal and tax for receipt display.
 * When nmgrtExempt, totalCents is subtotal only (taxCents = 0).
 */
export function computeSubtotalAndTaxCents(
  totalCents: number,
  grtPercent: number,
  nmgrtExempt = false
): { subtotalCents: number; taxCents: number } {
  if (nmgrtExempt) {
    return { subtotalCents: totalCents, taxCents: 0 };
  }
  const subtotalCents = Math.round(totalCents / (1 + grtPercent / 100));
  const taxCents = totalCents - subtotalCents;
  return { subtotalCents, taxCents };
}
