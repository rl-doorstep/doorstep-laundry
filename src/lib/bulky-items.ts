/**
 * Bulky bedding items: scheduled per load, priced as fixed add-ons (not by pound).
 */

export type BulkyItemKey =
  | "twinSet"
  | "fullSet"
  | "queenSet"
  | "kingSet"
  | "comforter";

export type BulkyItems = Partial<Record<BulkyItemKey, number>>;

export const BULKY_ITEM_KEYS: BulkyItemKey[] = [
  "twinSet",
  "fullSet",
  "queenSet",
  "kingSet",
  "comforter",
];

/** Display labels for UI and receipts. */
export const BULKY_ITEM_LABELS: Record<BulkyItemKey, string> = {
  twinSet: "Twin set",
  fullSet: "Full set",
  queenSet: "Queen set",
  kingSet: "King set",
  comforter: "Comforter",
};

/** Fixed price per unit in cents. */
export const BULKY_ITEM_PRICES_CENTS: Record<BulkyItemKey, number> = {
  twinSet: 1000,
  fullSet: 1500,
  queenSet: 1500,
  kingSet: 3000,
  comforter: 3000,
};

/** What we mean by a "set" (for pricing page copy). */
export const BULKY_SET_DESCRIPTION =
  "A set includes a fitted sheet, a top sheet, and two pillowcases.";

function clampNonNegativeInt(n: unknown): number {
  const x = typeof n === "number" ? n : parseInt(String(n), 10);
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.min(Math.floor(x), 999);
}

/** Normalize API/client input to safe quantities per key. */
export function normalizeBulkyItems(
  input: BulkyItems | null | undefined
): BulkyItems {
  if (!input || typeof input !== "object") return {};
  const out: BulkyItems = {};
  for (const key of BULKY_ITEM_KEYS) {
    const q = clampNonNegativeInt(input[key]);
    if (q > 0) out[key] = q;
  }
  return out;
}

export function computeBulkyItemsCents(items: BulkyItems | null | undefined): number {
  const norm = normalizeBulkyItems(items);
  let sum = 0;
  for (const key of BULKY_ITEM_KEYS) {
    const q = norm[key] ?? 0;
    sum += q * BULKY_ITEM_PRICES_CENTS[key];
  }
  return sum;
}

/** Aggregate quantities across multiple loads (same key summed). */
export function mergeBulkyItemsAcrossLoads(
  loads: Array<{ bulkyItems?: BulkyItems | null }>
): BulkyItems {
  const merged: BulkyItems = {};
  for (const load of loads) {
    const norm = normalizeBulkyItems(load.bulkyItems ?? undefined);
    for (const key of BULKY_ITEM_KEYS) {
      const q = norm[key] ?? 0;
      if (q > 0) merged[key] = (merged[key] ?? 0) + q;
    }
  }
  return merged;
}

export type BulkyLineItem = {
  key: BulkyItemKey;
  name: string;
  qty: number;
  unitCents: number;
  lineCents: number;
};

/** One entry per key with qty > 0 (for Stripe line items, receipts). */
export function getAggregatedBulkyLineItems(
  items: BulkyItems | null | undefined
): BulkyLineItem[] {
  const norm = normalizeBulkyItems(items);
  const lines: BulkyLineItem[] = [];
  for (const key of BULKY_ITEM_KEYS) {
    const qty = norm[key] ?? 0;
    if (qty <= 0) continue;
    const unitCents = BULKY_ITEM_PRICES_CENTS[key];
    lines.push({
      key,
      name: BULKY_ITEM_LABELS[key],
      qty,
      unitCents,
      lineCents: qty * unitCents,
    });
  }
  return lines;
}
