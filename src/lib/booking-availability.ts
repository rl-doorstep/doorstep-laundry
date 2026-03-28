/**
 * Per-day, per-window availability for the book page (pickup & delivery).
 * Stored as JSON in Setting (key booking_availability).
 */

export const BOOKING_AVAILABILITY_KEY = "booking_availability";

export type BookingAvailability = {
  /** Morning (8–10 AM) offered on each weekday; index 0 = Sunday … 6 = Saturday */
  morningByDay: boolean[];
  /** Evening (4–7 PM) */
  eveningByDay: boolean[];
};

export const DEFAULT_BOOKING_AVAILABILITY: BookingAvailability = {
  morningByDay: [true, true, true, true, true, true, true],
  eveningByDay: [true, true, true, true, true, true, true],
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sevenBools(arr: unknown): boolean[] | null {
  if (!Array.isArray(arr) || arr.length !== 7) return null;
  return arr.map((x) => Boolean(x));
}

/** At least one time window is enabled on this weekday. */
export function isAnySlotEnabledOnDay(
  dayIndex: number,
  availability: BookingAvailability
): boolean {
  const m = availability.morningByDay[dayIndex];
  const e = availability.eveningByDay[dayIndex];
  return Boolean(m || e);
}

export function isSlotEnabledForDay(
  slotId: string,
  dayIndex: number,
  availability: BookingAvailability
): boolean {
  if (slotId === "morning") return Boolean(availability.morningByDay[dayIndex]);
  if (slotId === "evening") return Boolean(availability.eveningByDay[dayIndex]);
  return true;
}

export function firstAllowedTimeSlotId(
  availability: BookingAvailability,
  slots: { id: string }[],
  dayIndex: number
): string {
  for (const s of slots) {
    if (isSlotEnabledForDay(s.id, dayIndex, availability)) return s.id;
  }
  return slots[0]?.id ?? "morning";
}

/** True if this calendar day cannot be used for pickup (past, no slots that day, or today with no remaining slot). */
export function isPickupDateUnavailable(
  pickupDay: Date,
  now: Date,
  availability: BookingAvailability,
  slots: { id: string; startHour: number }[]
): boolean {
  const d = startOfDay(pickupDay);
  const today = startOfDay(now);
  if (d < today) return true;
  const dow = d.getDay();
  if (!isAnySlotEnabledOnDay(dow, availability)) return true;
  if (d.getTime() === today.getTime()) {
    const hour = now.getHours() + now.getMinutes() / 60;
    const hasSlot = slots.some(
      (slot) =>
        isSlotEnabledForDay(slot.id, dow, availability) &&
        hour < slot.startHour - 1
    );
    if (!hasSlot) return true;
  }
  return false;
}

/** True if this calendar day cannot be used for delivery. */
export function isDeliveryDateUnavailable(
  deliveryDay: Date,
  earliestDelivery: Date,
  now: Date,
  availability: BookingAvailability
): boolean {
  const d = startOfDay(deliveryDay);
  const min = startOfDay(earliestDelivery);
  const today = startOfDay(now);
  if (d < today) return true;
  if (d < min) return true;
  if (!isAnySlotEnabledOnDay(d.getDay(), availability)) return true;
  return false;
}

export function findNextValidPickupDate(
  start: Date,
  now: Date,
  availability: BookingAvailability,
  slots: { id: string; startHour: number }[]
): Date {
  const candidate = startOfDay(start);
  for (let n = 0; n < 370; n++) {
    if (!isPickupDateUnavailable(candidate, now, availability, slots)) {
      return candidate;
    }
    candidate.setDate(candidate.getDate() + 1);
  }
  return startOfDay(start);
}

export function findNextValidDeliveryDate(
  start: Date,
  earliestDelivery: Date,
  now: Date,
  availability: BookingAvailability
): Date {
  const candidate = startOfDay(start);
  const minT = startOfDay(earliestDelivery).getTime();
  if (candidate.getTime() < minT) {
    candidate.setTime(minT);
  }
  for (let n = 0; n < 370; n++) {
    if (!isDeliveryDateUnavailable(candidate, earliestDelivery, now, availability)) {
      return candidate;
    }
    candidate.setDate(candidate.getDate() + 1);
  }
  return startOfDay(start);
}

export function parseBookingAvailabilityJson(
  raw: string | null | undefined
): BookingAvailability {
  const fallback = (): BookingAvailability => ({
    morningByDay: [...DEFAULT_BOOKING_AVAILABILITY.morningByDay],
    eveningByDay: [...DEFAULT_BOOKING_AVAILABILITY.eveningByDay],
  });
  if (!raw?.trim()) return fallback();
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;

    const m = sevenBools(o.morningByDay);
    const e = sevenBools(o.eveningByDay);
    if (m && e) {
      return { morningByDay: m, eveningByDay: e };
    }

    // Legacy: days + global morning/evening
    const daysRaw = Array.isArray(o.days)
      ? o.days
      : Array.isArray(o.daysOpen)
        ? o.daysOpen
        : null;
    let daysOpen = [...DEFAULT_BOOKING_AVAILABILITY.morningByDay];
    if (daysRaw && daysRaw.length === 7) {
      daysOpen = daysRaw.map((x) => Boolean(x));
    }
    const morning =
      typeof o.morningEnabled === "boolean"
        ? o.morningEnabled
        : typeof o.morning === "boolean"
          ? o.morning
          : true;
    const evening =
      typeof o.eveningEnabled === "boolean"
        ? o.eveningEnabled
        : typeof o.evening === "boolean"
          ? o.evening
          : true;
    return {
      morningByDay: daysOpen.map((d) => d && morning),
      eveningByDay: daysOpen.map((d) => d && evening),
    };
  } catch {
    return fallback();
  }
}

export function serializeBookingAvailability(a: BookingAvailability): string {
  return JSON.stringify({
    morningByDay: a.morningByDay,
    eveningByDay: a.eveningByDay,
  });
}

export function isValidBookingAvailability(a: BookingAvailability): {
  ok: boolean;
  error?: string;
} {
  for (let i = 0; i < 7; i++) {
    if (a.morningByDay[i] || a.eveningByDay[i]) {
      return { ok: true };
    }
  }
  return {
    ok: false,
    error: "Enable at least one checkbox (a day and time combination).",
  };
}
