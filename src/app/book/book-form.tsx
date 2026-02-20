"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@prisma/client";

export function BookForm({
  addresses,
  defaultTotalCents,
}: {
  addresses: Address[];
  defaultTotalCents: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [useNewPickup, setUseNewPickup] = useState(addresses.length === 0);
  const [useNewDelivery, setUseNewDelivery] = useState(addresses.length === 0);
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [pickupAddressId, setPickupAddressId] = useState(addresses[0]?.id ?? "");
  const [deliveryAddressId, setDeliveryAddressId] = useState(addresses[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [totalCents, setTotalCents] = useState(defaultTotalCents);

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

    if (!finalPickupId || !finalDeliveryId || !pickupDate || !deliveryDate) {
      setError("Please select or add pickup and delivery addresses and dates.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddressId: finalPickupId,
          deliveryAddressId: finalDeliveryId,
          pickupDate: new Date(pickupDate).toISOString().slice(0, 10),
          deliveryDate: new Date(deliveryDate).toISOString().slice(0, 10),
          notes: notes || undefined,
          totalCents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create order");
        setLoading(false);
        return;
      }
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Pickup address
          </h2>
          {addresses.length > 0 && !useNewPickup && (
            <select
              value={pickupAddressId}
              onChange={(e) => setPickupAddressId(e.target.value)}
              className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} – {a.street}, {a.city}
                </option>
              ))}
            </select>
          )}
          {addresses.length > 0 && (
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={useNewPickup}
                onChange={(e) => setUseNewPickup(e.target.checked)}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Use a new address
              </span>
            </label>
          )}
          {(useNewPickup || addresses.length === 0) && (
            <div className="mt-2 grid gap-2">
              <input
                placeholder="Label (e.g. Home)"
                value={newAddress.label}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, label: e.target.value }))
                }
                className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
              />
              <input
                placeholder="Street"
                value={newAddress.street}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, street: e.target.value }))
                }
                className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, city: e.target.value }))
                  }
                  className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                />
                <input
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, state: e.target.value }))
                  }
                  className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <input
                placeholder="ZIP"
                value={newAddress.zip}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, zip: e.target.value }))
                }
                className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
              />
              {addresses.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddAddress}
                  disabled={loading}
                  className="rounded-lg bg-zinc-200 dark:bg-zinc-600 px-4 py-2 text-sm font-medium"
                >
                  Add address
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            Delivery address
          </h2>
          {addresses.length > 0 && !useNewDelivery && (
            <select
              value={deliveryAddressId}
              onChange={(e) => setDeliveryAddressId(e.target.value)}
              className="block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} – {a.street}, {a.city}
                </option>
              ))}
            </select>
          )}
          {addresses.length > 0 && (
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={useNewDelivery}
                onChange={(e) => setUseNewDelivery(e.target.checked)}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Use a new address
              </span>
            </label>
          )}
          {(useNewDelivery || addresses.length === 0) && !useNewPickup && addresses.length > 0 && (
            <p className="mt-2 text-sm text-zinc-500">
              Reusing the new address form above for delivery.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Pickup date
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Delivery date
            </label>
            <input
              type="date"
              required
              min={pickupDate || minDate}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total (cents, e.g. 2500 = $25)
          </label>
          <input
            type="number"
            min={0}
            value={totalCents}
            onChange={(e) => setTotalCents(Number(e.target.value) || 0)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 font-medium disabled:opacity-50"
        >
          {loading ? "Creating order…" : "Create order & continue to payment"}
        </button>
      </form>
    </div>
  );
}
