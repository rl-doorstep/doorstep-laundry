"use client";

import { useState, useEffect } from "react";

export function AdminPremiumPrices() {
  const [nextMorningCents, setNextMorningCents] = useState<number | null>(null);
  const [sameDayCents, setSameDayCents] = useState<number | null>(null);
  const [nextMorningInput, setNextMorningInput] = useState("");
  const [sameDayInput, setSameDayInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error ?? `Could not load settings (${res.status}).`);
          setNextMorningCents(200);
          setSameDayCents(300);
          setNextMorningInput("2.00");
          setSameDayInput("3.00");
          return;
        }
        const nm =
          typeof data.nextMorningPremiumCents === "number" && Number.isFinite(data.nextMorningPremiumCents)
            ? data.nextMorningPremiumCents
            : 200;
        const sd =
          typeof data.sameDayPremiumCents === "number" && Number.isFinite(data.sameDayPremiumCents)
            ? data.sameDayPremiumCents
            : 300;
        setNextMorningCents(nm);
        setSameDayCents(sd);
        setNextMorningInput((nm / 100).toFixed(2));
        setSameDayInput((sd / 100).toFixed(2));
      })
      .catch(() => {
        setMessage("Could not load settings. Check your connection and try refreshing.");
        setNextMorningCents(200);
        setSameDayCents(300);
        setNextMorningInput("2.00");
        setSameDayInput("3.00");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsedNm = parseFloat(nextMorningInput);
    const parsedSd = parseFloat(sameDayInput);
    if (Number.isNaN(parsedNm) || parsedNm < 0) {
      setMessage("Enter a valid non-negative amount for next-morning service.");
      return;
    }
    if (Number.isNaN(parsedSd) || parsedSd < 0) {
      setMessage("Enter a valid non-negative amount for same-day service.");
      return;
    }
    const nmCents = Math.round(parsedNm * 100);
    const sdCents = Math.round(parsedSd * 100);
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextMorningPremiumCents: nmCents, sameDayPremiumCents: sdCents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to save");
        return;
      }
      setNextMorningCents(nmCents);
      setSameDayCents(sdCents);
      setMessage("Saved.");
    } catch {
      setMessage("Request failed.");
    } finally {
      setSaving(false);
    }
  }

  if (nextMorningCents === null || sameDayCents === null) {
    return <p className="text-sm text-fern-500">Loading…</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="admin-next-morning-premium" className="text-sm font-medium text-fern-700 w-56">
          Next-morning surcharge ($/lb)
        </label>
        <input
          id="admin-next-morning-premium"
          type="number"
          min="0"
          step="0.01"
          value={nextMorningInput}
          onChange={(e) => setNextMorningInput(e.target.value)}
          className="rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900 w-24"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="admin-same-day-premium" className="text-sm font-medium text-fern-700 w-56">
          Same-day surcharge ($/lb)
        </label>
        <input
          id="admin-same-day-premium"
          type="number"
          min="0"
          step="0.01"
          value={sameDayInput}
          onChange={(e) => setSameDayInput(e.target.value)}
          className="rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900 w-24"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-fern-600 text-white px-4 py-2 text-sm font-medium hover:bg-fern-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && <span className="text-sm text-fern-600">{message}</span>}
      </div>
    </form>
  );
}
