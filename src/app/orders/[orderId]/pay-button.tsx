"use client";

import { useState } from "react";

export function PayButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to start checkout");
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setLoading(false);
    } catch {
      alert("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="rounded-lg bg-green-600 text-white px-4 py-2 font-medium hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? "Redirecting…" : "Pay with Stripe"}
    </button>
  );
}
