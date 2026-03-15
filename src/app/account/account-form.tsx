"use client";

import { useState } from "react";
import { isValidPhone } from "@/lib/phone";

const inputClass =
  "mt-1 block w-full rounded-lg border border-fern-200 bg-white px-3 py-2.5 text-fern-900 placeholder-fern-400 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20 transition-colors";
const labelClass = "block text-sm font-medium text-fern-700";

export function AccountForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name, email, phone });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.phone.trim() !== "" && !isValidPhone(form.phone)) {
      setMessage("Please enter a valid 10-digit US phone number (e.g. 505-123-4567).");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to update");
        setSaving(false);
        return;
      }
      setMessage("Saved.");
      setSaving(false);
    } catch {
      setMessage("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {message && (
        <p className="text-sm text-fern-600">{message}</p>
      )}
      <div>
        <label className={labelClass}>
          Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>
          Email
        </label>
        <input
          type="email"
          value={form.email}
          readOnly
          className="mt-1 block w-full rounded-lg border border-fern-200 bg-fern-50 px-3 py-2.5 text-fern-500"
        />
        <p className="text-xs text-fern-500 mt-1">Email cannot be changed here.</p>
      </div>
      <div>
        <label className={labelClass}>
          Phone (for SMS updates)
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+1 (505)-123-4567"
          className={inputClass}
          aria-invalid={form.phone.trim() !== "" && !isValidPhone(form.phone)}
        />
        <p className="text-xs text-fern-500 mt-1">10-digit US number. Leave blank for no SMS.</p>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
