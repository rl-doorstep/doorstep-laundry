const ORDER_PREFIX = "ORDER-";

/** Strip `ORDER-` for display on physical tags (full value stays in DB and barcode). */
export function displayOrderNumber(orderNumber: string): string {
  if (orderNumber.startsWith(ORDER_PREFIX)) {
    return orderNumber.slice(ORDER_PREFIX.length);
  }
  return orderNumber;
}

/** Machine payload (QR): full stored order number + load index + total loads at print time. */
export function tagQrPayload(
  orderNumber: string,
  loadNumber: number,
  numberOfLoads: number
): string {
  return `${orderNumber}|${loadNumber}|${numberOfLoads}`;
}

/**
 * Split display order (e.g. `20260315-0001` after stripping `ORDER-`) for the tag:
 * - Line 1: `YYYYMMDD-`
 * - Line 2: `{seq} L{load} / {total}` e.g. `0001 L1 / 4`
 * If the pattern does not match, line 1 is the full display string and line 2 is `L{load} / {total}` only.
 */
const TAG_DISPLAY_SPLIT = /^(\d{8}-)(.+)$/;

export function tagPrintLines(
  orderNumber: string,
  loadNumber: number,
  numberOfLoads: number
): { line1: string; line2: string } {
  const display = displayOrderNumber(orderNumber);
  const loadPart = `L${loadNumber} / ${numberOfLoads}`;
  const m = display.match(TAG_DISPLAY_SPLIT);
  if (m) {
    return { line1: m[1], line2: `${m[2]} ${loadPart}` };
  }
  return { line1: display, line2: loadPart };
}
