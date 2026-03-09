/**
 * Compute order total in cents from load weights and price per pound.
 * Total = sum(weightLbs) × pricePerPoundCents, rounded to nearest cent.
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
