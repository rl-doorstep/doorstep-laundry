"use client";

import { useState, useEffect } from "react";

export function AdminPricePerPound() {
  const [pricePerPoundCents, setPricePerPoundCents] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState< string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const cents = data.pricePerPoundCents ?? 150;
        setPricePerPoundCents(cents);
        setInputValue((cents / 100).toFixed(2));
      })
      .catch(() => setPricePerPoundCents(150));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(inputValue);
    if (Number.isNaN(parsed) || parsed < 0) {
      setMessage("Enter a valid non-negative number.");
      return;
    }
    const cents = Math.round(parsed * 100);
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerPoundCents: cents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to save");
        return;
      }
      setPricePerPoundCents(cents);
      setMessage("Saved.");
    } catch {
      setMessage("Request failed.");
    } finally {
      setSaving(false);
    }
  }

  if (pricePerPoundCents === null) return <p className="text-sm text-fern-500">Loading…</p>;

  return (
    <form onSubmit={handleSave} className="flex flex-wrap items-center gap-3">
      <label htmlFor="admin-price-per-pound" className="text-sm font-medium text-fern-700">
        Price per pound ($)
      </label>
      <input
        id="admin-price-per-pound"
        type="number"
        min="0"
        step="0.01"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900 w-24"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-fern-600 text-white px-4 py-2 text-sm font-medium hover:bg-fern-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {message && (
        <span className="text-sm text-fern-600">{message}</span>
      )}
    </form>
  );
}
