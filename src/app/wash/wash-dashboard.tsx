"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTimeSlotById } from "@/lib/slots";

const POLL_INTERVAL_MS = 15_000;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  picked_up: "Picked up",
  in_progress: "In progress",
  ready_for_delivery: "Ready for delivery",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const LOAD_STATUS_LABEL: Record<string, string> = {
  washing: "Washing",
  drying: "Drying",
  folding: "Folding",
  ready_for_delivery: "Ready for delivery",
};

const NEXT_STATUS: Record<string, string[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["picked_up", "cancelled"],
  picked_up: ["in_progress"],
  in_progress: ["ready_for_delivery", "out_for_delivery"],
  ready_for_delivery: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

type OrderLoadRow = {
  id: string;
  loadNumber: number;
  loadCode: string | null;
  status: string;
  location: string | null;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  numberOfLoads: number;
  pickupDate: Date | string;
  deliveryDate: Date | string;
  pickupTimeSlot: string | null;
  deliveryTimeSlot: string | null;
  customer: { name: string | null; email: string; phone: string | null };
  pickupAddress: { street: string; city: string; state: string; zip: string };
  deliveryAddress: { street: string; city: string; state: string; zip: string };
  orderLoads: OrderLoadRow[];
};

export function WashDashboard({
  initialOrders,
  initialFilter = "due_today",
}: {
  initialOrders: OrderRow[];
  initialFilter?: "due_today" | "all";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<"due_today" | "all">(initialFilter);
  const [statusFilter, setStatusFilter] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);
  const [updatingLoadId, setUpdatingLoadId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const params = new URLSearchParams();
    params.set("filter", filter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json().catch(() => []);
    setOrders(Array.isArray(data) ? data : []);
    if (showLoading) setLoading(false);
  }, [filter, statusFilter]);

  // Poll for updates from other washers; refetch when tab becomes visible
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      fetchOrders(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders(false);
      }
    }, POLL_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  function setFilterAndFetch(value: "due_today" | "all") {
    setFilter(value);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("filter", value);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/orders?${params}`)
      .then((res) => res.json().catch(() => []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  async function updateStatus(orderId: string, status: string, note?: string) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Failed to update status");
      return;
    }
    startTransition(() => {
      router.refresh();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    });
    fetchOrders(false);
  }

  async function updateLoad(
    loadId: string,
    updates: { status?: string; location?: string }
  ) {
    setUpdatingLoadId(loadId);
    try {
      const res = await fetch(`/api/order-loads/${loadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to update load");
        return;
      }
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          orderLoads: o.orderLoads.map((l) =>
            l.id === loadId
              ? {
                  ...l,
                  status: updated.status ?? l.status,
                  location: updated.location !== undefined ? updated.location : l.location,
                  loadCode: updated.loadCode !== undefined ? updated.loadCode : l.loadCode,
                }
              : l
          ),
        }))
      );
      fetchOrders(false);
    } finally {
      setUpdatingLoadId(null);
    }
  }

  const inputClass =
    "rounded-lg border border-fern-200 bg-white px-2 py-1.5 text-sm text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-center rounded-2xl border border-fern-200/80 bg-white p-4 shadow-sm">
        <div className="flex rounded-lg border border-fern-200 p-0.5 bg-fern-50">
          <button
            type="button"
            onClick={() => setFilterAndFetch("due_today")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "due_today"
                ? "bg-white text-fern-900 shadow-sm"
                : "text-fern-600 hover:text-fern-900"
            }`}
          >
            Due today
          </button>
          <button
            type="button"
            onClick={() => setFilterAndFetch("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-white text-fern-900 shadow-sm"
                : "text-fern-600 hover:text-fern-900"
            }`}
          >
            All orders
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-fern-700 mb-1">
            Order status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">All</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => fetchOrders(true)}
          disabled={loading}
          className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Apply"}
        </button>
        <span className="text-xs text-fern-500">
          Updates from other washers refresh every 15s and when you return to this tab.
        </span>
      </div>

      <p className="text-sm text-fern-600">
        Each load has a unique ID. Loads in the same order are grouped for pickup and delivery.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-fern-200/80 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-fern-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Order status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Load
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Load status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Time / Dates
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fern-200">
            {(() => {
              const rows: { order: OrderRow; load: OrderLoadRow | null }[] = orders.flatMap(
                (order) => {
                  const loads = order.orderLoads ?? [];
                  if (loads.length === 0) {
                    return [{ order, load: null }];
                  }
                  return loads.map((load) => ({ order, load }));
                }
              );
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-fern-500">
                      No orders for this filter.
                    </td>
                  </tr>
                );
              }
              return rows.map(({ order, load }) => (
                <tr
                  key={load ? load.id : `${order.id}-empty`}
                  className="hover:bg-fern-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-sm text-fern-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-fern-100 text-fern-700">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-fern-800">
                    {load ? (
                      <span title={`Load ID: ${load.loadCode ?? `${order.orderNumber}-L${load.loadNumber}`}`}>
                        L{load.loadNumber}/{order.numberOfLoads}
                      </span>
                    ) : (
                      <span className="text-fern-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {load ? (
                      <select
                        value={load.status}
                        onChange={(e) =>
                          updateLoad(load.id, { status: e.target.value })
                        }
                        disabled={updatingLoadId === load.id}
                        className={inputClass}
                      >
                        {Object.entries(LOAD_STATUS_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-fern-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {load ? (
                      <input
                        type="text"
                        placeholder="e.g. Washer 2, Shelf 1"
                        value={load.location ?? ""}
                        onChange={(e) =>
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === order.id
                                ? {
                                    ...o,
                                    orderLoads: o.orderLoads.map((l) =>
                                      l.id === load.id
                                        ? { ...l, location: e.target.value || null }
                                        : l
                                    ),
                                  }
                                : o
                            )
                          )
                        }
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (load.location ?? "")) {
                            updateLoad(load.id, { location: v || "" });
                          }
                        }}
                        disabled={updatingLoadId === load.id}
                        className={`${inputClass} min-w-[120px]`}
                      />
                    ) : (
                      <span className="text-fern-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    <div>
                      {order.pickupTimeSlot
                        ? getTimeSlotById(order.pickupTimeSlot)?.label ??
                          order.pickupTimeSlot
                        : "—"}{" "}
                      /{" "}
                      {order.deliveryTimeSlot
                        ? getTimeSlotById(order.deliveryTimeSlot)?.label ??
                          order.deliveryTimeSlot
                        : "—"}
                    </div>
                    <div className="text-fern-500 text-xs mt-0.5">
                      {new Date(order.pickupDate as string).toLocaleDateString()} /{" "}
                      {new Date(order.deliveryDate as string).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
