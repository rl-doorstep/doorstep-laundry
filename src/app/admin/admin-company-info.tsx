"use client";

import { useState, useEffect } from "react";
import { isValidPhone } from "@/lib/phone";

const FIELD_IDS = {
  name: "admin-company-name",
  address: "admin-company-address",
  maxServiceDistance: "admin-max-service-distance-miles",
  phone: "admin-company-phone",
  email: "admin-company-email",
  logoUrl: "admin-company-logo-url",
} as const;

export function AdminCompanyInfo() {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [maxServiceDistanceMiles, setMaxServiceDistanceMiles] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setLoadError(data.error ?? `Could not load settings (${res.status}).`);
          return;
        }
        setLoadError(null);
        setCompanyName(typeof data.companyName === "string" ? data.companyName : "");
        setCompanyAddress(typeof data.companyAddress === "string" ? data.companyAddress : "");
        setCompanyPhone(typeof data.companyPhone === "string" ? data.companyPhone : "");
        setCompanyEmail(typeof data.companyEmail === "string" ? data.companyEmail : "");
        setCompanyLogoUrl(typeof data.companyLogoUrl === "string" ? data.companyLogoUrl : "");
        setMaxServiceDistanceMiles(
          data.maxServiceDistanceMiles != null && Number.isFinite(data.maxServiceDistanceMiles)
            ? String(data.maxServiceDistanceMiles)
            : ""
        );
      })
      .catch(() => {
        setLoadError("Could not load settings. Check your connection and try refreshing.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (companyPhone.trim() !== "" && !isValidPhone(companyPhone)) {
      setMessage("Company phone must be a valid 10-digit US number (e.g. 505-123-4567) or empty.");
      return;
    }
    let maxDistPayload: number | null = null;
    if (maxServiceDistanceMiles.trim() !== "") {
      const n = parseFloat(maxServiceDistanceMiles.trim());
      if (!Number.isFinite(n) || n < 0) {
        setMessage("Maximum service distance must be empty or a non-negative number.");
        return;
      }
      maxDistPayload = n;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim(),
          maxServiceDistanceMiles: maxDistPayload,
          companyPhone: companyPhone.trim(),
          companyEmail: companyEmail.trim(),
          companyLogoUrl: companyLogoUrl.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to save");
        return;
      }
      setMessage("Saved.");
    } catch {
      setMessage("Request failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-fern-500">Loading…</p>;

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-md">
      {loadError && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}
      <div>
        <label htmlFor={FIELD_IDS.name} className="block text-sm font-medium text-fern-700 mb-1">
          Company name
        </label>
        <input
          id={FIELD_IDS.name}
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900"
          placeholder="Doorstep Laundry"
        />
      </div>
      <div>
        <label htmlFor={FIELD_IDS.address} className="block text-sm font-medium text-fern-700 mb-1">
          Address
        </label>
        <textarea
          id={FIELD_IDS.address}
          rows={2}
          value={companyAddress}
          onChange={(e) => setCompanyAddress(e.target.value)}
          className="w-full rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900"
          placeholder="123 Main St, City, State ZIP"
        />
      </div>
      <div className="rounded-lg border border-fern-200 bg-fern-50/80 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-fern-900">Service area</h3>
        <p className="text-xs text-fern-600 -mt-1">
          Uses the facility <span className="font-medium">Address</span> above. Customer addresses must fall within this radius when a limit is set.
        </p>
        <label
          htmlFor={FIELD_IDS.maxServiceDistance}
          className="block text-sm font-medium text-fern-700 mb-1"
        >
          Maximum service distance (miles)
        </label>
        <input
          id={FIELD_IDS.maxServiceDistance}
          type="number"
          min={0}
          step={0.1}
          value={maxServiceDistanceMiles}
          onChange={(e) => setMaxServiceDistanceMiles(e.target.value)}
          className="w-full rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900"
          placeholder="e.g. 15 (leave empty for no limit)"
        />
      </div>
      <div>
        <label htmlFor={FIELD_IDS.phone} className="block text-sm font-medium text-fern-700 mb-1">
          Phone
        </label>
        <input
          id={FIELD_IDS.phone}
          type="text"
          value={companyPhone}
          onChange={(e) => setCompanyPhone(e.target.value)}
          className="w-full rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900"
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label htmlFor={FIELD_IDS.email} className="block text-sm font-medium text-fern-700 mb-1">
          Email
        </label>
        <input
          id={FIELD_IDS.email}
          type="email"
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          className="w-full rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900"
          placeholder="hello@example.com"
        />
      </div>
      <div>
        <label htmlFor={FIELD_IDS.logoUrl} className="block text-sm font-medium text-fern-700 mb-1">
          Logo URL
        </label>
        <input
          id={FIELD_IDS.logoUrl}
          type="url"
          value={companyLogoUrl}
          onChange={(e) => setCompanyLogoUrl(e.target.value)}
          className="w-full rounded-lg border border-fern-300 px-3 py-2 text-sm text-fern-900"
          placeholder="https://… or /logo.png"
        />
        <p className="text-xs text-fern-500 mt-1">
          Full URL or path (e.g. /logo.png). Shown on receipts in the top left.
        </p>
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
