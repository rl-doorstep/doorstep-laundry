"use client";

import { useState, useEffect } from "react";
import type { BookingAvailability } from "@/lib/booking-availability";
import { DEFAULT_BOOKING_AVAILABILITY } from "@/lib/booking-availability";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cloneDefault(): BookingAvailability {
  return {
    morningByDay: [...DEFAULT_BOOKING_AVAILABILITY.morningByDay],
    eveningByDay: [...DEFAULT_BOOKING_AVAILABILITY.eveningByDay],
  };
}

function isMatrixResponse(a: unknown): a is BookingAvailability {
  if (!a || typeof a !== "object") return false;
  const x = a as BookingAvailability;
  return (
    Array.isArray(x.morningByDay) &&
    x.morningByDay.length === 7 &&
    Array.isArray(x.eveningByDay) &&
    x.eveningByDay.length === 7
  );
}

export function AdminBookingAvailability() {
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error ?? `Could not load settings (${res.status}).`);
          setAvailability(cloneDefault());
          return;
        }
        if (isMatrixResponse(data.bookingAvailability)) {
          setAvailability({
            morningByDay: [...data.bookingAvailability.morningByDay],
            eveningByDay: [...data.bookingAvailability.eveningByDay],
          });
        } else {
          setAvailability(cloneDefault());
        }
      })
      .catch(() => {
        setMessage("Could not load settings.");
        setAvailability(cloneDefault());
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!availability) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingAvailability: availability }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to save");
        return;
      }
      if (isMatrixResponse(data.bookingAvailability)) {
        setAvailability({
          morningByDay: [...data.bookingAvailability.morningByDay],
          eveningByDay: [...data.bookingAvailability.eveningByDay],
        });
      }
      setMessage("Saved.");
    } catch {
      setMessage("Request failed.");
    } finally {
      setSaving(false);
    }
  }

  function setMorning(dayIndex: number, checked: boolean) {
    setAvailability((prev) => {
      if (!prev) return prev;
      const next = [...prev.morningByDay];
      next[dayIndex] = checked;
      return { ...prev, morningByDay: next };
    });
  }

  function setEvening(dayIndex: number, checked: boolean) {
    setAvailability((prev) => {
      if (!prev) return prev;
      const next = [...prev.eveningByDay];
      next[dayIndex] = checked;
      return { ...prev, eveningByDay: next };
    });
  }

  if (!availability) {
    return <p className="text-sm text-fern-500">Loading…</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <p className="text-xs text-fern-500">
        Columns are days of the week; rows are time windows for both pickup and delivery. Morning 8–10 AM · Evening 4–7 PM.
      </p>

      <div className="overflow-x-auto rounded-xl border border-fern-200 bg-white">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-fern-200 bg-fern-50/80">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-fern-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-fern-500 w-36 border-r border-fern-100"
              >
                Time
              </th>
              {DAY_LABELS.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className="px-2 py-3 text-center font-semibold text-fern-800 min-w-[3.25rem]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-fern-100">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-3 py-3 text-left align-middle border-r border-fern-100"
              >
                <span className="font-medium text-fern-800">Morning</span>
                <span className="block text-xs font-normal text-fern-500 mt-0.5">8–10 AM</span>
              </th>
              {DAY_LABELS.map((_, dayIndex) => (
                <td key={`m-${dayIndex}`} className="p-2 text-center align-middle">
                  <label className="inline-flex items-center justify-center cursor-pointer min-h-[44px] w-full">
                    <input
                      type="checkbox"
                      checked={availability.morningByDay[dayIndex]}
                      onChange={(e) => setMorning(dayIndex, e.target.checked)}
                      className="h-4 w-4 rounded border-fern-300 text-fern-600 focus:ring-fern-500"
                      aria-label={`Morning on ${DAY_LABELS[dayIndex]}`}
                    />
                  </label>
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-3 py-3 text-left align-middle border-r border-fern-100"
              >
                <span className="font-medium text-fern-800">Evening</span>
                <span className="block text-xs font-normal text-fern-500 mt-0.5">4–7 PM</span>
              </th>
              {DAY_LABELS.map((_, dayIndex) => (
                <td key={`e-${dayIndex}`} className="p-2 text-center align-middle">
                  <label className="inline-flex items-center justify-center cursor-pointer min-h-[44px] w-full">
                    <input
                      type="checkbox"
                      checked={availability.eveningByDay[dayIndex]}
                      onChange={(e) => setEvening(dayIndex, e.target.checked)}
                      className="h-4 w-4 rounded border-fern-300 text-fern-600 focus:ring-fern-500"
                      aria-label={`Evening on ${DAY_LABELS[dayIndex]}`}
                    />
                  </label>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-fern-600 text-white px-4 py-2 text-sm font-medium hover:bg-fern-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save scheduling"}
        </button>
        {message && <span className="text-sm text-fern-600">{message}</span>}
      </div>
    </form>
  );
}
