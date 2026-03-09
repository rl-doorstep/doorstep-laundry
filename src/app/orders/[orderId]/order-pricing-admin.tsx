"use client";

import { useState } from "react";

const inputClass =
  "rounded-lg border border-fern-200 bg-white px-3 py-2 text-sm text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";

export function OrderPricingAdmin({
  orderId,
  orderPricePerPoundCents,
  nmgrtExempt,
}: {
  orderId: string;
  orderPricePerPoundCents: number | null;
  nmgrtExempt: boolean | null;
}) {
  const [rate, setRate] = useState(
    orderPricePerPoundCents != null ? String(orderPricePerPoundCents) : ""
  );
  const [exempt, setExempt] = useState(nmgrtExempt ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const body: { orderPricePerPoundCents?: number | null; nmgrtExempt?: boolean | null } = {
        nmgrtExempt: exempt,
      };
      if (rate.trim() === "") {
        body.orderPricePerPoundCents = null;
      } else {
        const n = parseInt(rate, 10);
        if (!Number.isNaN(n) && n >= 0) {
          body.orderPricePerPoundCents = n;
        }
      }
      const res = await fetch(`/api/orders/${orderId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to update");
        setSaving(false);
        return;
      }
      setMessage("Saved. Overrides apply to this order only.");
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-fern-600">
        Override price per pound and/or NMGRT for this order only (overrides customer defaults).
      </p>
      {message && <p className="text-sm text-fern-600">{message}</p>}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-fern-500 mb-1">
            Order price/lb (cents)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="Use customer/default"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={inputClass}
            style={{ width: "10rem" }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-fern-700 cursor-pointer">
          <input
            type="checkbox"
            checked={exempt}
            onChange={(e) => setExempt(e.target.checked)}
            className="rounded border-fern-300 text-fern-600 focus:ring-fern-500"
          />
          NMGRT exempt
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-fern-500 text-white px-3 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
