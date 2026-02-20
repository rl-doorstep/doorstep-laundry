"use client";

import { useState, useEffect } from "react";

type LoadLocationRow = {
  id: string;
  name: string;
  sortOrder: number;
};

const inputClass =
  "rounded-lg border border-fern-200 bg-white px-3 py-2 text-sm text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";

export function AdminLoadLocations() {
  const [locations, setLocations] = useState<LoadLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function loadLocations() {
    fetch("/api/admin/load-locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadLocations();
  }, []);

  async function createLocation() {
    const name = newName.trim();
    if (!name) return;
    setSavingId("new");
    try {
      const res = await fetch("/api/admin/load-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sortOrder: newSortOrder }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(err.error ?? "Failed to create location");
        return;
      }
      setNewName("");
      setNewSortOrder(0);
      loadLocations();
    } finally {
      setSavingId(null);
    }
  }

  async function updateLocation(id: string) {
    const name = editName.trim();
    if (!name) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/load-locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const err = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(err.error ?? "Failed to update");
        return;
      }
      setEditingId(null);
      loadLocations();
    } finally {
      setSavingId(null);
    }
  }

  async function deleteLocation(id: string) {
    if (!confirm("Remove this location? Loads using it will keep the name as text.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/load-locations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to delete");
        return;
      }
      setEditingId(null);
      loadLocations();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-fern-200/80 bg-white p-8 text-center text-fern-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-fern-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-fern-800 mb-3">
          Add location
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-fern-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createLocation()}
              placeholder="e.g. Washer 2, Shelf 1"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-fern-600 mb-1">
              Sort order
            </label>
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(Number(e.target.value) || 0)}
              className={`${inputClass} w-24`}
            />
          </div>
          <button
            type="button"
            onClick={createLocation}
            disabled={!newName.trim() || savingId === "new"}
            className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
          >
            {savingId === "new" ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-fern-200/80 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-fern-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Sort order
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-fern-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fern-200">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-fern-500">
                  No locations yet. Add one above.
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-fern-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === loc.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateLocation(loc.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className={inputClass}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-fern-900">{loc.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    {loc.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === loc.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateLocation(loc.id)}
                          disabled={savingId === loc.id}
                          className="text-sm font-medium text-fern-600 hover:text-fern-900 mr-3"
                        >
                          {savingId === loc.id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-sm font-medium text-fern-500 hover:text-fern-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(loc.id);
                            setEditName(loc.name);
                          }}
                          className="text-sm font-medium text-fern-600 hover:text-fern-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLocation(loc.id)}
                          disabled={deletingId === loc.id}
                          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === loc.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
