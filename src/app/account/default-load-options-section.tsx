"use client";

import { useState } from "react";
import type { LoadOptionsInput } from "@/lib/load-options";
import { LOAD_OPTION_KEYS, LOAD_OPTION_LABELS } from "@/lib/load-options";

export function DefaultLoadOptionsSection({
  initialOptions,
}: {
  initialOptions: LoadOptionsInput | null;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<LoadOptionsInput>(initialOptions ?? {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultLoadOptions: options }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to update");
        setSaving(false);
        return;
      }
      setMessage("Saved. These options will pre-fill when you book a new order.");
      setSaving(false);
    } catch {
      setMessage("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <p className="text-sm text-fern-600">
        Set your default wash preferences. They will pre-fill for each load when you book; you can still change them per order.
      </p>
      {message && (
        <p className="text-sm text-fern-600">{message}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LOAD_OPTION_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center gap-1.5 text-sm text-fern-700 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={Boolean(options[key])}
              onChange={(e) => {
                setOptions((prev) => ({ ...prev, [key]: e.target.checked }));
              }}
              className="rounded border-fern-300 text-fern-600 focus:ring-fern-500"
            />
            {LOAD_OPTION_LABELS[key]}
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save defaults"}
      </button>
    </form>
  );
}
