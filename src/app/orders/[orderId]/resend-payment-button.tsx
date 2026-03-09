"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResendPaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-payment-link`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to resend");
        return;
      }
      setMessage("Payment link sent to your email.");
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
        className="rounded-lg border border-fern-300 bg-white px-3 py-2 text-sm font-medium text-fern-700 hover:bg-fern-50 disabled:opacity-50 transition-colors"
      >
        {loading ? "Sending…" : "Resend payment link"}
      </button>
      {message && (
        <span className="text-sm text-fern-600">{message}</span>
      )}
    </div>
  );
}
