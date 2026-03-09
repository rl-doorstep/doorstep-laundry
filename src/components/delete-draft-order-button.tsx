"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function DeleteDraftOrderButton({
  orderId,
  onDeleted,
  variant = "button",
}: {
  orderId: string;
  onDeleted?: () => void;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete order");
        setDeleting(false);
        return;
      }
      if (onDeleted) onDeleted();
      else router.push("/dashboard");
    } catch {
      alert("Something went wrong");
      setDeleting(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={deleting}
        aria-label="Cancel order"
        title="Cancel order"
        className="shrink-0 rounded-lg border border-red-200 bg-white p-2 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <IconTrash />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {deleting ? "Cancelling…" : "Cancel order"}
    </button>
  );
}
