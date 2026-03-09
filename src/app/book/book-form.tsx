"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@prisma/client";
import { getTimeSlots, type TimeSlot } from "@/lib/slots";

const PRICE_PER_LOAD_CENTS = 2500;
const DAYS_AHEAD = 14;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type BookFormInitialOrder = {
  numberOfLoads: number;
  pickupDate: Date | string;
  deliveryDate: Date | string;
  pickupTimeSlot: string;
  deliveryTimeSlot: string;
  pickupAddressId: string;
  deliveryAddressId: string;
  notes: string;
};

export function BookForm({
  addresses,
  editOrderId,
  initialOrder,
}: {
  addresses: Address[];
  defaultTotalCents?: number;
  editOrderId?: string;
  initialOrder?: BookFormInitialOrder;
}) {
  const router = useRouter();
  const timeSlots = getTimeSlots();
  const isEdit = Boolean(editOrderId && initialOrder);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [numberOfLoads, setNumberOfLoads] = useState(initialOrder?.numberOfLoads ?? 1);
  const [pickupDate, setPickupDate] = useState<Date>(() => {
    if (initialOrder?.pickupDate) {
      const d = new Date(initialOrder.pickupDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [deliveryDate, setDeliveryDate] = useState<Date>(() => {
    if (initialOrder?.deliveryDate) {
      const d = new Date(initialOrder.deliveryDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [pickupTimeSlot, setPickupTimeSlot] = useState(initialOrder?.pickupTimeSlot ?? timeSlots[0]?.id ?? "morning");
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(initialOrder?.deliveryTimeSlot ?? timeSlots[0]?.id ?? "morning");
  const [dayPickerStart, setDayPickerStart] = useState(0);

  // Step 2 state
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [useNewPickup, setUseNewPickup] = useState(!isEdit && addresses.length === 0);
  const [useNewDelivery, setUseNewDelivery] = useState(!isEdit && addresses.length === 0);
  const [pickupAddressId, setPickupAddressId] = useState(initialOrder?.pickupAddressId ?? addresses[0]?.id ?? "");
  const [deliveryAddressId, setDeliveryAddressId] = useState(initialOrder?.deliveryAddressId ?? addresses[0]?.id ?? "");
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDateStr = pickupDate.toISOString().slice(0, 10);
  const deliveryDateStr = deliveryDate.toISOString().slice(0, 10);

  // Earliest delivery: at least 24 hrs after pickup (next day or later)
  const earliestDeliveryDate = new Date(pickupDate);
  earliestDeliveryDate.setDate(earliestDeliveryDate.getDate() + 1);
  earliestDeliveryDate.setHours(0, 0, 0, 0);

  const now = new Date();
  const isPickupToday =
    pickupDate.getFullYear() === now.getFullYear() &&
    pickupDate.getMonth() === now.getMonth() &&
    pickupDate.getDate() === now.getDate();
  const currentHourLocal = now.getHours() + now.getMinutes() / 60;

  function isPickupSlotDisabled(slot: TimeSlot): boolean {
    if (!isPickupToday) return false;
    const cutoffHour = slot.startHour - 1;
    return currentHourLocal >= cutoffHour;
  }

  const hasValidSlotForToday = timeSlots.some((slot) => currentHourLocal < slot.startHour - 1);

  // Keep delivery at least 24h after pickup (e.g. when pickup date changes)
  useEffect(() => {
    if (deliveryDate < earliestDeliveryDate) {
      setDeliveryDate(new Date(earliestDeliveryDate));
    }
  }, [pickupDateStr]);

  // If today has no valid pickup slots, bump pickup to tomorrow
  useEffect(() => {
    const isPickupToday =
      pickupDate.getFullYear() === today.getFullYear() &&
      pickupDate.getMonth() === today.getMonth() &&
      pickupDate.getDate() === today.getDate();
    if (isPickupToday && !hasValidSlotForToday) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPickupDate(tomorrow);
    }
  }, [hasValidSlotForToday, pickupDateStr]);

  const dayPickerDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayPickerStart + i);
    return d;
  });

  function goPrevDays() {
    setDayPickerStart((s) => Math.max(-1, s - 7));
  }
  function goNextDays() {
    setDayPickerStart((s) => s + 7);
  }

  function handleStep1Continue() {
    if (deliveryDate < earliestDeliveryDate) {
      setError("Delivery must be at least 24 hours after pickup (next day or later).");
      return;
    }
    const selectedPickupSlot = timeSlots.find((s) => s.id === pickupTimeSlot);
    if (selectedPickupSlot && isPickupSlotDisabled(selectedPickupSlot)) {
      setError("This pickup time has passed or is within 1 hour. Please choose another.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleAddAddress() {
    if (
      !newAddress.label ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.zip
    ) {
      setError("Fill all address fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAddress,
          isDefault: addresses.length === 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add address");
        setLoading(false);
        return;
      }
      router.refresh();
      setNewAddress({ label: "", street: "", city: "", state: "", zip: "" });
      setUseNewPickup(false);
      setUseNewDelivery(false);
      setPickupAddressId(data.id);
      setDeliveryAddressId(data.id);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    let finalPickupId = pickupAddressId;
    let finalDeliveryId = deliveryAddressId;

    if (useNewPickup && newAddress.label && newAddress.street) {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add pickup address");
        return;
      }
      finalPickupId = data.id;
      if (useNewDelivery && useNewPickup) {
        finalDeliveryId = data.id;
      }
    }
    if (
      useNewDelivery &&
      newAddress.label &&
      newAddress.street &&
      !(useNewPickup && finalPickupId)
    ) {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add delivery address");
        return;
      }
      finalDeliveryId = data.id;
    }

    if (!finalPickupId || !finalDeliveryId) {
      setError("Please select or add pickup and delivery addresses.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pickupAddressId: finalPickupId,
        deliveryAddressId: finalDeliveryId,
        pickupDate: pickupDateStr,
        deliveryDate: deliveryDateStr,
        pickupTimeSlot,
        deliveryTimeSlot,
        notes: notes || undefined,
        numberOfLoads,
      };
      const url = editOrderId ? `/api/orders/${editOrderId}` : "/api/orders";
      const method = editOrderId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? (editOrderId ? "Failed to update order" : "Failed to create order"));
        setLoading(false);
        return;
      }
      router.push(editOrderId ? `/orders/${editOrderId}` : `/orders/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "block w-full rounded-lg border border-fern-200 bg-white px-3 py-2.5 text-fern-900 placeholder-fern-400 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";
  const labelClass = "block text-sm font-medium text-fern-700";

  // ——— Step 1: Date & time (screenshot-style) ———
  if (step === 1) {
    return (
      <div className="rounded-2xl border border-fern-200/80 bg-white p-6 sm:p-8 shadow-sm max-w-2xl">
        <h2 className="text-2xl font-bold text-fern-900 mb-6">
          {isEdit ? "Edit pickup & delivery" : "Book your pickup"}
        </h2>

        {/* Service card */}
        <div className="rounded-xl border border-fern-200 bg-fern-50/50 p-4 mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-fern-200 text-fern-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-fern-900">Laundry Service</h3>
            <p className="text-sm text-fern-600 mt-0.5">
              We pick up your laundry, wash and fold, then deliver it back to your door.
            </p>
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-fern-700">
                <span>Number of loads</span>
                <select
                  value={numberOfLoads}
                  onChange={(e) => setNumberOfLoads(Number(e.target.value))}
                  className="rounded-lg border border-fern-200 bg-white px-2 py-1 text-fern-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <span className="text-sm text-fern-500">
                ${((numberOfLoads * PRICE_PER_LOAD_CENTS) / 100).toFixed(0)} total
              </span>
            </div>
          </div>
        </div>

        {/* Pickup date */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-fern-900">Pickup date</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrevDays}
                className="p-1.5 rounded-lg text-fern-600 hover:bg-fern-100 hover:text-fern-900"
                aria-label="Previous days"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={goNextDays}
                className="p-1.5 rounded-lg text-fern-600 hover:bg-fern-100 hover:text-fern-900"
                aria-label="Next days"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-fern-500 mb-2">
            {pickupDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {dayPickerDates.map((d) => {
              const isSelected = d.getTime() === pickupDate.getTime();
              const isPast = d < today;
              const isToday = d.getTime() === today.getTime();
              const todayUnavailable = isToday && !hasValidSlotForToday;
              const disabled = isPast || todayUnavailable;
              return (
                <button
                  key={d.toISOString().slice(0, 10)}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    const newPickup = new Date(d);
                    setPickupDate(newPickup);
                    const minDelivery = new Date(newPickup);
                    minDelivery.setDate(minDelivery.getDate() + 1);
                    minDelivery.setHours(0, 0, 0, 0);
                    if (deliveryDate < minDelivery) setDeliveryDate(minDelivery);
                  }}
                  disabled={disabled}
                  className={`min-w-[4rem] rounded-lg border-2 py-2 px-3 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-fern-500 bg-fern-500 text-white"
                      : disabled
                        ? "border-fern-100 bg-fern-50 text-fern-400 cursor-not-allowed"
                        : "border-fern-200 bg-white text-fern-800 hover:border-fern-300"
                  }`}
                >
                  {DAY_LABELS[d.getDay()]} {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pickup time */}
        <div className="mb-6">
          <p className="font-semibold text-fern-900 mb-2">Pickup time</p>
          <p className="text-sm text-fern-500 mb-2">
            Slots within 1 hour of their start are disabled for today.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => {
              const disabled = isPickupSlotDisabled(slot);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => !disabled && setPickupTimeSlot(slot.id)}
                  disabled={disabled}
                  className={`rounded-xl border-2 py-2.5 px-3 text-sm font-medium transition-colors ${
                    disabled
                      ? "border-fern-100 bg-fern-50 text-fern-400 cursor-not-allowed"
                      : pickupTimeSlot === slot.id
                        ? "border-fern-500 bg-fern-50 text-fern-800"
                        : "border-fern-200 bg-white text-fern-700 hover:border-fern-300"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery date */}
        <div className="mb-6">
          <p className="font-semibold text-fern-900 mb-2">Delivery date</p>
          <p className="text-sm text-fern-500 mb-2">
            At least 24 hours after pickup (next day or later). {deliveryDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {dayPickerDates.map((d) => {
              const isSelected = d.getTime() === deliveryDate.getTime();
              const isPast = d < today;
              const beforeEarliest = d < earliestDeliveryDate;
              return (
                <button
                  key={d.toISOString().slice(0, 10)}
                  type="button"
                  onClick={() => !isPast && !beforeEarliest && setDeliveryDate(new Date(d))}
                  disabled={isPast || beforeEarliest}
                  className={`min-w-[4rem] rounded-lg border-2 py-2 px-3 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-fern-500 bg-fern-500 text-white"
                      : isPast || beforeEarliest
                        ? "border-fern-100 bg-fern-50 text-fern-400 cursor-not-allowed"
                        : "border-fern-200 bg-white text-fern-800 hover:border-fern-300"
                  }`}
                >
                  {DAY_LABELS[d.getDay()]} {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery time */}
        <div className="mb-6">
          <p className="font-semibold text-fern-900 mb-2">Delivery time</p>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setDeliveryTimeSlot(slot.id)}
                className={`rounded-xl border-2 py-2.5 px-3 text-sm font-medium transition-colors ${
                  deliveryTimeSlot === slot.id
                    ? "border-fern-500 bg-fern-50 text-fern-800"
                    : "border-fern-200 bg-white text-fern-700 hover:border-fern-300"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}
        <button
          type="button"
          onClick={handleStep1Continue}
          className="w-full rounded-lg bg-fern-500 text-white py-3 font-medium hover:bg-fern-600 transition-colors"
        >
          Continue to address & details
        </button>
      </div>
    );
  }

  // ——— Step 2: Addresses & notes ———
  return (
    <div className="rounded-2xl border border-fern-200/80 bg-white p-6 sm:p-8 shadow-sm max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-fern-900">
          {isEdit ? "Edit address & details" : "Address & details"}
        </h2>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm font-medium text-fern-600 hover:text-fern-900"
        >
          Change date & time
        </button>
      </div>
      <div className="rounded-lg bg-fern-50 border border-fern-200 p-3 mb-6 text-sm text-fern-700">
        <strong>Pickup:</strong> {pickupDate.toLocaleDateString()} ({getTimeSlots().find((s) => s.id === pickupTimeSlot)?.label}) &nbsp;|&nbsp;{" "}
        <strong>Delivery:</strong> {deliveryDate.toLocaleDateString()} ({getTimeSlots().find((s) => s.id === deliveryTimeSlot)?.label}) &nbsp;|&nbsp; {numberOfLoads} load{numberOfLoads !== 1 ? "s" : ""}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div>
          <h3 className="text-lg font-medium text-fern-900 mb-3">Pickup address</h3>
          {addresses.length > 0 && !useNewPickup && (
            <select
              value={pickupAddressId}
              onChange={(e) => setPickupAddressId(e.target.value)}
              className={inputClass}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>{a.label} – {a.street}, {a.city}</option>
              ))}
            </select>
          )}
          {addresses.length > 0 && (
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={useNewPickup}
                onChange={(e) => setUseNewPickup(e.target.checked)}
                className="rounded border-fern-200 text-fern-500 focus:ring-fern-500"
              />
              <span className="text-sm text-fern-600">Use a new address</span>
            </label>
          )}
          {(useNewPickup || addresses.length === 0) && (
            <div className="mt-2 grid gap-2">
              <input placeholder="Label (e.g. Home)" value={newAddress.label} onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))} className={inputClass} />
              <input placeholder="Street" value={newAddress.street} onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))} className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))} className={inputClass} />
                <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))} className={inputClass} />
              </div>
              <input placeholder="ZIP" value={newAddress.zip} onChange={(e) => setNewAddress((a) => ({ ...a, zip: e.target.value }))} className={inputClass} />
              {addresses.length === 0 && (
                <button type="button" onClick={handleAddAddress} disabled={loading} className="rounded-lg bg-fern-100 text-fern-700 px-4 py-2 text-sm font-medium hover:bg-fern-200">
                  Add address
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium text-fern-900 mb-3">Delivery address</h3>
          {addresses.length > 0 && !useNewDelivery && (
            <select
              value={deliveryAddressId}
              onChange={(e) => setDeliveryAddressId(e.target.value)}
              className={inputClass}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>{a.label} – {a.street}, {a.city}</option>
              ))}
            </select>
          )}
          {addresses.length > 0 && (
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={useNewDelivery} onChange={(e) => setUseNewDelivery(e.target.checked)} className="rounded border-fern-200 text-fern-500 focus:ring-fern-500" />
              <span className="text-sm text-fern-600">Use a new address</span>
            </label>
          )}
          {(useNewDelivery || addresses.length === 0) && !useNewPickup && addresses.length > 0 && (
            <p className="mt-2 text-sm text-fern-500">Reusing the new address form above for delivery.</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`mt-1 ${inputClass}`} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-fern-500 text-white py-3 font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
        >
          {loading
            ? (isEdit ? "Saving…" : "Creating order…")
            : isEdit
              ? "Save changes"
              : "Create order & continue to payment"}
        </button>
      </form>
    </div>
  );
}
