import { prisma } from "./db";

const GRT_PERCENT_KEY = "grt_percent";
const DEFAULT_GRT_PERCENT = 8.39;

/**
 * Server-side only. Returns the configured NMGRT percentage (e.g. 8.39).
 */
export async function getGrtPercent(): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { key: GRT_PERCENT_KEY },
  });
  if (!row) return DEFAULT_GRT_PERCENT;
  const value = parseFloat(row.value);
  return Number.isFinite(value) ? value : DEFAULT_GRT_PERCENT;
}
