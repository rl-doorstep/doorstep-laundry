/**
 * Phone validation and normalization.
 * Accepts US-style numbers: 10 digits, or 1 followed by 10 digits.
 * Allows common formatting: spaces, dashes, dots, parentheses.
 */

/** Strip to digits only. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Returns true if the value is a valid US phone number (10 digits, or 1 + 10 digits).
 * Empty or whitespace-only string is considered valid (optional phone field).
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  const digits = digitsOnly(trimmed);
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  return false;
}

/**
 * Normalize to 10-digit form (strip leading 1 if present). Returns null if invalid.
 * Empty string returns empty string (allowed for optional phone).
 */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const digits = digitsOnly(trimmed);
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return null;
}

/** Format 10-digit string as +1 (XXX)-XXX-XXXX for display and storage. */
export function formatPhoneForStorage(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length !== 10) return "";
  return `+1 (${d.slice(0, 3)})-${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Convert to E.164 for APIs (e.g. Twilio): +15051234567. Returns empty string if not 10/11 digits. */
export function toE164(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return "";
}

/** Format 10-digit string as +1 (XXX)-XXX-XXXX for display. Backwards compatible: if already in this format or other, returns as-is when not 10 digits. */
export function formatPhoneDisplay(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length === 10) return formatPhoneForStorage(d);
  return phone;
}
