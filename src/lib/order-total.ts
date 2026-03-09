/**
 * Order totals: base price per pound (admin setting) + NMGRT added on top.
 * subtotalCents = totalLbs × pricePerPoundCents (base)
 * taxCents = round(subtotalCents × grtPercent / 100)
 * totalCents = subtotalCents + taxCents
 */

export type LoadWithWeight = { weightLbs?: number | null };

/**
 * Compute subtotal (base), tax (NMGRT), and total from load weights and base price per pound.
 * Use this when setting order.totalCents (weigh-in, checkout, resend payment).
 */
export function computeOrderTotalWithTax(
  loads: LoadWithWeight[],
  pricePerPoundCents: number,
  grtPercent: number
): { subtotalCents: number; taxCents: number; totalCents: number } {
  const totalLbs = loads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  const subtotalCents = Math.round(totalLbs * pricePerPoundCents);
  const taxCents = Math.round(subtotalCents * (grtPercent / 100));
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}

/**
 * Given stored totalCents (subtotal + tax), split back into subtotal and tax for receipt display.
 * Used when we only have order.totalCents and need to show the breakdown.
 */
export function computeSubtotalAndTaxCents(
  totalCents: number,
  grtPercent: number
): { subtotalCents: number; taxCents: number } {
  const subtotalCents = Math.round(totalCents / (1 + grtPercent / 100));
  const taxCents = totalCents - subtotalCents;
  return { subtotalCents, taxCents };
}
