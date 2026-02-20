"use client";

import { useState } from "react";

function IconCard({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

const iconBtnClass =
  "rounded-lg border p-2 transition-colors disabled:opacity-50 inline-flex items-center justify-center";

export function PayButton({
  orderId,
  variant = "button",
}: {
  orderId: string;
  variant?: "button" | "icon";
}) {
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

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        aria-label={loading ? "Redirecting to payment" : "Pay with Stripe"}
        title="Pay with Stripe"
        className={`${iconBtnClass} border-fern-200 bg-fern-500 text-white hover:bg-fern-600`}
      >
        <IconCard />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="rounded-lg bg-fern-500 text-white px-4 py-2 font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
    >
      {loading ? "Redirecting…" : "Pay with Stripe"}
    </button>
  );
}
