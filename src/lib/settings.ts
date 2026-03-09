import { prisma } from "./db";

const GRT_PERCENT_KEY = "grt_percent";
const DEFAULT_GRT_PERCENT = 8.39;
const PRICE_PER_POUND_KEY = "price_per_pound_cents";
const DEFAULT_PRICE_PER_POUND_CENTS = 150;

const COMPANY_KEYS = {
  name: "company_name",
  address: "company_address",
  phone: "company_phone",
  email: "company_email",
  logoUrl: "company_logo_url",
} as const;

export type CompanyInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
};

/**
 * Server-side only. Returns the base price per pound in cents (e.g. 150 = $1.50).
 */
export async function getPricePerPoundCents(): Promise<number> {
  const row = await prisma.setting.findUnique({
    where: { key: PRICE_PER_POUND_KEY },
  });
  if (!row) return DEFAULT_PRICE_PER_POUND_CENTS;
  const value = parseInt(row.value, 10);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_PRICE_PER_POUND_CENTS;
}

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

/**
 * Server-side only. Returns company info for receipts (name, address, phone, email, logo URL).
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(COMPANY_KEYS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    name: map[COMPANY_KEYS.name]?.trim() || "Doorstep Laundry",
    address: map[COMPANY_KEYS.address]?.trim() || "",
    phone: map[COMPANY_KEYS.phone]?.trim() || "",
    email: map[COMPANY_KEYS.email]?.trim() || "",
    logoUrl: map[COMPANY_KEYS.logoUrl]?.trim() || "",
  };
}
