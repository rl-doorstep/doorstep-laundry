"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function IconGift({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a4 4 0 00-4-4H6m6 6a4 4 0 014-4h2M6 6a4 4 0 014-4h.01M6 6H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
    </svg>
  );
}

export function UseCreditButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApply() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/apply-credit`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to apply credit");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      alert("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApply}
      disabled={loading}
      aria-label={loading ? "Applying credit…" : "Use a free load credit"}
      title="Use a free load credit"
      className="rounded-lg border border-green-300 bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors inline-flex items-center justify-center"
    >
      <IconGift />
    </button>
  );
}
