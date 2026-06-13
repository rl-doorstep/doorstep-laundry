"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WaivePaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("Waive payment for this order? The order will be marked ready for delivery and will not count as revenue.")) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/waive-payment`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to waive payment");
        return;
      }
      setMessage("Payment waived.");
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
      >
        {loading ? "Waiving…" : "Waive payment"}
      </button>
      {message && (
        <span className="text-sm text-fern-600">{message}</span>
      )}
    </div>
  );
}
