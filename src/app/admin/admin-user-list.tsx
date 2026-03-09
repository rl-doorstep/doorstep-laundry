"use client";

import { useState, useEffect } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Admin",
};

export function AdminUserList() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users?list=staff_only")
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function setRole(userId: string, role: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to update role");
        return;
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const inputClass =
    "rounded-lg border border-fern-200 bg-white px-3 py-2 text-sm text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";

  if (loading) {
    return (
      <div className="rounded-2xl border border-fern-200/80 bg-white p-8 text-center text-fern-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fern-200/80 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-fern-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
              Role
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fern-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-fern-50/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-fern-900">{user.email}</div>
                {user.name && (
                  <div className="text-sm text-fern-500">{user.name}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  onChange={(e) => setRole(user.id, e.target.value)}
                  disabled={updatingId === user.id}
                  className={inputClass}
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
