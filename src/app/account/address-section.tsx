"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Address = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-fern-200 bg-white px-3 py-2.5 text-fern-900 placeholder-fern-400 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20 transition-colors";
const labelClass = "block text-sm font-medium text-fern-700";

const iconBtnClass =
  "rounded-lg border p-2 transition-colors disabled:opacity-50 inline-flex items-center justify-center";

function IconEdit({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}
function IconStar({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}
function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function AddressSection({ addresses: initialAddresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editForm, setEditForm] = useState<Record<string, { label: string; street: string; city: string; state: string; zip: string; isDefault: boolean }>>({});
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    isDefault: false,
  });

  function openEdit(addr: Address) {
    setEditingId(addr.id);
    setEditForm((prev) => ({
      ...prev,
      [addr.id]: {
        label: addr.label,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        isDefault: addr.isDefault,
      },
    }));
    setMessage("");
  }

  async function handleUpdate(id: string) {
    const form = editForm[id];
    if (!form || !form.label?.trim() || !form.street?.trim() || !form.city?.trim() || !form.state?.trim() || !form.zip?.trim()) {
      setMessage("All address fields are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to update address");
        setSaving(false);
        return;
      }
      setEditingId(null);
      setMessage("");
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  }

  async function handleSetDefault(id: string) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to set default");
        setSaving(false);
        return;
      }
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this address?")) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to delete address");
        setSaving(false);
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  }

  async function handleAdd() {
    if (!newAddress.label?.trim() || !newAddress.street?.trim() || !newAddress.city?.trim() || !newAddress.state?.trim() || !newAddress.zip?.trim()) {
      setMessage("All address fields are required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, isDefault: initialAddresses.length === 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to add address");
        setSaving(false);
        return;
      }
      setAddOpen(false);
      setNewAddress({ label: "", street: "", city: "", state: "", zip: "", isDefault: false });
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-fern-600">{message}</p>
      )}
      <ul className="space-y-3">
        {initialAddresses.map((addr) => (
          <li
            key={addr.id}
            className="rounded-xl border border-fern-200/80 p-4 bg-fern-50/50"
          >
            {editingId === addr.id && editForm[addr.id] ? (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Label</label>
                  <input
                    value={editForm[addr.id].label}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        [addr.id]: { ...f[addr.id], label: e.target.value },
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g. Home"
                  />
                </div>
                <div>
                  <label className={labelClass}>Street</label>
                  <input
                    value={editForm[addr.id].street}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        [addr.id]: { ...f[addr.id], street: e.target.value },
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      value={editForm[addr.id].city}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          [addr.id]: { ...f[addr.id], city: e.target.value },
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      value={editForm[addr.id].state}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          [addr.id]: { ...f[addr.id], state: e.target.value },
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ZIP</label>
                  <input
                    value={editForm[addr.id].zip}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        [addr.id]: { ...f[addr.id], zip: e.target.value },
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm[addr.id].isDefault}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        [addr.id]: { ...f[addr.id], isDefault: e.target.checked },
                      }))
                    }
                    className="rounded border-fern-200 text-fern-500 focus:ring-fern-500"
                  />
                  <span className="text-sm text-fern-700">Default address</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(addr.id)}
                    disabled={saving}
                    className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={saving}
                    className="rounded-lg border border-fern-200 bg-white px-4 py-2 text-sm font-medium text-fern-700 hover:bg-fern-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-medium text-fern-900">
                      {addr.label}
                      {addr.isDefault && (
                        <span className="ml-2 text-xs text-fern-500">(default)</span>
                      )}
                    </span>
                    <p className="text-sm text-fern-600 mt-1">
                      {addr.street}, {addr.city}, {addr.state} {addr.zip}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(addr)}
                      disabled={saving}
                      aria-label="Edit address"
                      className={`${iconBtnClass} border-fern-200 bg-white text-fern-700 hover:bg-fern-50`}
                    >
                      <IconEdit />
                    </button>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        disabled={saving}
                        aria-label="Set as default address"
                        className={`${iconBtnClass} border-fern-200 bg-white text-fern-700 hover:bg-fern-50`}
                      >
                        <IconStar />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      disabled={saving}
                      aria-label="Remove address"
                      className={`${iconBtnClass} border-red-200 bg-white text-red-700 hover:bg-red-50`}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {addOpen ? (
        <div className="rounded-xl border border-fern-200/80 p-4 bg-fern-50/50 space-y-3">
          <h3 className="text-sm font-medium text-fern-900">New address</h3>
          <div>
            <label className={labelClass}>Label</label>
            <input
              value={newAddress.label}
              onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Home"
            />
          </div>
          <div>
            <label className={labelClass}>Street</label>
            <input
              value={newAddress.street}
              onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>City</label>
              <input
                value={newAddress.city}
                onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                value={newAddress.state}
                onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>ZIP</label>
            <input
              value={newAddress.zip}
              onChange={(e) => setNewAddress((a) => ({ ...a, zip: e.target.value }))}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress((a) => ({ ...a, isDefault: e.target.checked }))}
              className="rounded border-fern-200 text-fern-500 focus:ring-fern-500"
            />
            <span className="text-sm text-fern-700">Default address</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add address"}
            </button>
            <button
              type="button"
              onClick={() => { setAddOpen(false); setMessage(""); }}
              disabled={saving}
              className="rounded-lg border border-fern-200 bg-white px-4 py-2 text-sm font-medium text-fern-700 hover:bg-fern-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setAddOpen(true); setMessage(""); }}
          className="rounded-lg border border-fern-200 bg-white px-4 py-2 text-sm font-medium text-fern-700 hover:bg-fern-50 hover:border-fern-300"
        >
          + Add address
        </button>
      )}
    </div>
  );
}
