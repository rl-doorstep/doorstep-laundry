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
