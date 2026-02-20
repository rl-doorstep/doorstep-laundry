"use client";

import { useState, useEffect, useCallback } from "react";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  customer: { name: string | null; email: string; phone: string | null };
  deliveryAddress: { street: string; city: string; state: string; zip: string };
};

const STATUS_LABEL: Record<string, string> = {
  ready_for_delivery: "Ready for delivery",
  out_for_delivery: "Out for delivery",
};

const LOCATION_INTERVAL_MS = 30_000;

function formatAddress(a: { street: string; city: string; state: string; zip: string }) {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`.trim();
}

export function DriverDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [displayOrderIds, setDisplayOrderIds] = useState<string[]>([]);
  const [runOrderIds, setRunOrderIds] = useState<string[] | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/driver/orders");
    const data = await res.json().catch(() => []);
    setOrders(Array.isArray(data) ? data : []);
  }, []);

  const fetchRun = useCallback(async () => {
    const res = await fetch("/api/driver/run");
    const data = await res.json().catch(() => ({}));
    if (data.runId && Array.isArray(data.orderIds)) {
      setRunOrderIds(data.orderIds);
    } else {
      setRunOrderIds(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOrders(), fetchRun()]).finally(() => setLoading(false));
  }, [fetchOrders, fetchRun]);

  useEffect(() => {
    if (orders.length && displayOrderIds.length === 0) {
      setDisplayOrderIds(orders.map((o) => o.id));
    }
  }, [orders, displayOrderIds.length]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const handleOptimize = async () => {
    const ids = selectedIds.size ? Array.from(selectedIds) : orders.map((o) => o.id);
    if (ids.length === 0) return;
    setOptimizing(true);
    try {
      const res = await fetch("/api/driver/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.orderIds && Array.isArray(data.orderIds)) {
        setDisplayOrderIds(data.orderIds);
        setSelectedIds(new Set(data.orderIds));
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleStartDelivery = async () => {
    const ids = displayOrderIds.filter((id) => selectedIds.has(id) || selectedIds.size === 0);
    const toUse = (ids.length ? ids : displayOrderIds).filter(
      (id) => orders.find((o) => o.id === id)?.status === "ready_for_delivery"
    );
    if (toUse.length === 0) return;
    if (!confirm(`Start delivery run with ${toUse.length} stop(s)?`)) return;
    setStarting(true);
    try {
      const res = await fetch("/api/driver/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: toUse }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to start run");
        return;
      }
      const data = await res.json();
      setRunOrderIds(data.orderIds);
      setLocationSharing(true);
      await fetchOrders();
      await fetchRun();
    } finally {
      setStarting(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setDeliveringId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to update");
        return;
      }
      await fetchOrders();
      await fetchRun();
    } finally {
      setDeliveringId(null);
    }
  };

  useEffect(() => {
    if (!locationSharing || typeof navigator === "undefined" || !navigator.geolocation) return;
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetch("/api/driver/location", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        },
        () => {}
      );
    };
    sendLocation();
    const interval = setInterval(sendLocation, LOCATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [locationSharing]);

  const runOrders = runOrderIds
    ? runOrderIds
        .map((id) => orders.find((o) => o.id === id))
        .filter((o): o is OrderRow => o != null)
    : [];

  const inputClass =
    "rounded-lg border border-fern-200 bg-white px-3 py-2 text-sm text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";

  if (loading) {
    return (
      <div className="rounded-2xl border border-fern-200/80 bg-white p-8 text-center text-fern-500">
        Loading…
      </div>
    );
  }

  const orderedList = displayOrderIds.length
    ? displayOrderIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as OrderRow[]
    : orders;

  return (
    <div className="space-y-6">
      {locationSharing && (
        <div className="rounded-lg border border-fern-200 bg-fern-50 px-4 py-2 text-sm text-fern-700">
          Sharing location with admin (updates every 30s).
        </div>
      )}

      {runOrderIds && runOrderIds.length > 0 ? (
        <div className="rounded-2xl border border-fern-200/80 bg-white shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-fern-800 border-b border-fern-200">
            Current run – Mark delivered at each stop
          </h2>
          <ul className="divide-y divide-fern-200">
            {runOrders.map((order, index) => (
              <li key={order.id} className="px-4 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-sm font-medium text-fern-900">
                    Stop {index + 1}: {order.orderNumber}
                  </span>
                  <p className="text-sm text-fern-600 mt-0.5">
                    {formatAddress(order.deliveryAddress)}
                  </p>
                  <p className="text-xs text-fern-500">
                    {order.customer.name ?? order.customer.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkDelivered(order.id)}
                  disabled={deliveringId === order.id || order.status === "delivered"}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    order.status === "delivered"
                      ? "bg-fern-100 text-fern-500 cursor-default"
                      : "bg-fern-500 text-white hover:bg-fern-600 disabled:opacity-50"
                  }`}
                >
                  {order.status === "delivered"
                    ? "Delivered"
                    : deliveringId === order.id
                      ? "Updating…"
                      : "Mark delivered"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-fern-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-fern-800 mb-3">Orders available for delivery</h2>
        <p className="text-xs text-fern-500 mb-3">Only orders with all loads ready can be picked up. Select orders, optimize route, then Start delivery.</p>
        {orders.length === 0 ? (
          <p className="text-sm text-fern-500">No orders ready for delivery.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={selectAll}
                className="text-sm font-medium text-fern-600 hover:text-fern-900"
              >
                {selectedIds.size === orders.length ? "Deselect all" : "Select all"}
              </button>
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing || (displayOrderIds.length <= 1 && selectedIds.size <= 1)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${inputClass}`}
              >
                {optimizing ? "Optimizing…" : "Optimize route"}
              </button>
              <button
                type="button"
                onClick={handleStartDelivery}
                disabled={starting}
                className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50"
              >
                {starting ? "Starting…" : "Start delivery"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-fern-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-fern-500 w-8">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-fern-500">Order</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-fern-500">Address</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-fern-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fern-200">
                  {orderedList.map((order) => (
                    <tr key={order.id}>
                      <td className="px-2 py-2">
                        {order.status === "ready_for_delivery" ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            className="rounded border-fern-300"
                          />
                        ) : (
                          <span className="text-fern-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 font-mono text-sm text-fern-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-2 py-2 text-sm text-fern-600">
                        {formatAddress(order.deliveryAddress)}
                      </td>
                      <td className="px-2 py-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-fern-100 text-fern-700">
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!locationSharing && runOrderIds && runOrderIds.length > 0 && (
        <button
          type="button"
          onClick={() => setLocationSharing(true)}
          className="rounded-lg border border-fern-200 bg-white px-4 py-2 text-sm font-medium text-fern-700 hover:bg-fern-50"
        >
          Share location with admin
        </button>
      )}
    </div>
  );
}
