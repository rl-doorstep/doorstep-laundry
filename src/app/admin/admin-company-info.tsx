"use client";

import { useState, useEffect } from "react";
import { isValidPhone } from "@/lib/phone";

const FIELD_IDS = {
  name: "admin-company-name",
  address: "admin-company-address",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setCompanyName(data.companyName ?? "");
        setCompanyAddress(data.companyAddress ?? "");
        setCompanyPhone(data.companyPhone ?? "");
        setCompanyEmail(data.companyEmail ?? "");
        setCompanyLogoUrl(data.companyLogoUrl ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (companyPhone.trim() !== "" && !isValidPhone(companyPhone)) {
      setMessage("Company phone must be a valid 10-digit US number (e.g. 505-123-4567) or empty.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyAddress: companyAddress.trim(),
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
