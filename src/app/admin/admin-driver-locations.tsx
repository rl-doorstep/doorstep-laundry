"use client";

import { useState, useEffect } from "react";

type DriverLocationRow = {
  userId: string;
  name: string | null;
  email: string;
  lat: number;
  lng: number;
  updatedAt: string;
};

export function AdminDriverLocations() {
  const [locations, setLocations] = useState<DriverLocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/driver-locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-fern-200/80 bg-white p-6 text-center text-fern-500">
        Loading…
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-2xl border border-fern-200/80 bg-white p-6 text-center text-fern-500">
        No driver locations yet. Drivers share location from the Driver page when on a run.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fern-200/80 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-fern-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
              Driver
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
              Last updated
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-fern-500">
              Map
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fern-200">
          {locations.map((loc) => (
            <tr key={loc.userId} className="hover:bg-fern-50/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-fern-900">
                  {loc.name ?? loc.email}
                </div>
                {loc.name && (
                  <div className="text-sm text-fern-500">{loc.email}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-fern-600">
                {new Date(loc.updatedAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-fern-600 hover:text-fern-900"
                >
                  View on map
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
