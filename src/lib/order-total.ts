/**
 * Compute order total in cents from load weights and price per pound.
 * Total = sum(weightLbs) × pricePerPoundCents, rounded to nearest cent.
 * The stored rate is the inclusive rate (customer pays this per lb; includes GRT).
 */

export type LoadWithWeight = { weightLbs?: number | null };

export function computeOrderTotalCents(
  loads: LoadWithWeight[],
  pricePerPoundCents: number
): number {
  const totalLbs = loads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  return Math.round(totalLbs * pricePerPoundCents);
}

/**
 * Split inclusive total into subtotal (pre-tax) and tax using GRT percentage.
 * totalCents = what the customer pays (inclusive of NMGRT).
 * subtotalCents = totalCents / (1 + grtPercent/100), taxCents = totalCents - subtotalCents.
 */
export function computeSubtotalAndTaxCents(
  totalCents: number,
  grtPercent: number
): { subtotalCents: number; taxCents: number } {
  const subtotalCents = Math.round(totalCents / (1 + grtPercent / 100));
  const taxCents = totalCents - subtotalCents;
  return { subtotalCents, taxCents };
}
