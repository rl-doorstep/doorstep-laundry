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
                      className="rounded-lg border border-fern-200 bg-white px-3 py-1.5 text-sm font-medium text-fern-700 hover:bg-fern-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        disabled={saving}
                        className="rounded-lg border border-fern-200 bg-white px-3 py-1.5 text-sm font-medium text-fern-700 hover:bg-fern-50 disabled:opacity-50"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      disabled={saving}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
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
