"use client";

import { useState, useEffect, useCallback } from "react";
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

function loadsSummary(order: OrderRow): string {
  const loads = order.orderLoads ?? [];
  if (loads.length === 0) return `0/${order.numberOfLoads}`;
  const ready = loads.filter((l) => l.status === "ready_for_delivery").length;
  return `${ready}/${loads.length} ready`;
}

function locationsSummary(order: OrderRow): string {
  const loads = order.orderLoads ?? [];
  if (loads.length === 0) return "—";
  const parts = loads.map((l) => (l.location?.trim() || "—"));
  return parts.join(", ");
}

export function OrdersTable({
  initialOrders,
}: {
  initialOrders: OrderRow[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"due_today" | "all">("all");
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams();
      params.set("filter", filter);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json().catch(() => []);
      setOrders(Array.isArray(data) ? data : []);
      if (showLoading) setLoading(false);
    },
    [filter]
  );

  useEffect(() => {
    if (filter === "all") {
      setOrders(initialOrders);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    params.set("filter", filter);
    fetch(`/api/orders?${params}`)
      .then((res) => res.json().catch(() => []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filter, initialOrders]);

  // Poll for updates from other washers; refetch when tab becomes visible
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => fetchOrders(false);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchOrders(false);
    }, POLL_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-center rounded-2xl border border-fern-200/80 bg-white p-4 shadow-sm">
        <div className="flex rounded-lg border border-fern-200 p-0.5 bg-fern-50">
          <button
            type="button"
            onClick={() => setFilter("due_today")}
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
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-white text-fern-900 shadow-sm"
                : "text-fern-600 hover:text-fern-900"
            }`}
          >
            All orders
          </button>
        </div>
        {loading && (
          <span className="text-sm text-fern-500">Loading…</span>
        )}
        <span className="text-xs text-fern-500">
          Updates from other washers refresh every 15s and when you return to this tab.
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-fern-200/80 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-fern-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Loads
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Pickup / Delivery
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fern-200">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-fern-500"
                >
                  No orders for this filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/orders/${order.id}`);
                    }
                  }}
                  className="hover:bg-fern-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-fern-900">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-fern-900">
                      {order.customer.name ?? order.customer.email}
                    </div>
                    {order.customer.name && (
                      <div className="text-xs text-fern-500">
                        {order.customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-fern-100 text-fern-700">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    {loadsSummary(order)}
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    {locationsSummary(order)}
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
                      {new Date(order.pickupDate as string).toLocaleDateString()}{" "}
                      /{" "}
                      {new Date(order.deliveryDate as string).toLocaleDateString()}
                    </div>
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
