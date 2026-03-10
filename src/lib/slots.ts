/**
 * Time slot scheduling (pickup/delivery windows).
 * Default: morning 8–10 AM, evening 4–7 PM.
 * Slots are identified by id; label is for display.
 */

export type TimeSlot = {
  id: string;
  label: string;
  startHour: number; // 0–23
  endHour: number;   // 0–23, exclusive
  description?: string;
};

/** Default time slots offered for pickup and delivery */
export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  {
    id: "morning",
    label: "8–10 AM",
    startHour: 8,
    endHour: 10,
    description: "Morning window",
  },
  {
    id: "evening",
    label: "4–7 PM",
    startHour: 16,
    endHour: 19,
    description: "Evening window",
  },
];

/** Get available time slots (for now returns default; later could load from DB) */
export function getTimeSlots(): TimeSlot[] {
  return DEFAULT_TIME_SLOTS;
}

export function getTimeSlotById(id: string): TimeSlot | undefined {
  return DEFAULT_TIME_SLOTS.find((s) => s.id === id);
}

/**
 * True if `now` falls within the order's date and time slot (for driver "now" filter).
 * Uses local calendar day and slot start/end hours. If no time slot, treat as eligible.
 */
export function isInTimeWindow(
  orderDate: Date,
  timeSlotId: string | null,
  now: Date
): boolean {
  const orderDay = new Date(orderDate);
  const nowDay = new Date(now);
  if (
    orderDay.getFullYear() !== nowDay.getFullYear() ||
    orderDay.getMonth() !== nowDay.getMonth() ||
    orderDay.getDate() !== nowDay.getDate()
  ) {
    return false;
  }
  if (!timeSlotId || timeSlotId.trim() === "") return true;
  const slot = getTimeSlotById(timeSlotId);
  if (!slot) return true;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  return currentHour >= slot.startHour && currentHour < slot.endHour;
}
