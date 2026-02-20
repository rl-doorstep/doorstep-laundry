"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  picked_up: "Picked up",
  in_progress: "In progress",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const NEXT_STATUS: Record<string, string[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["picked_up", "cancelled"],
  picked_up: ["in_progress"],
  in_progress: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  pickupDate: Date | string;
  deliveryDate: Date | string;
  customer: { name: string | null; email: string; phone: string | null };
  pickupAddress: { street: string; city: string; state: string; zip: string };
  deliveryAddress: { street: string; city: string; state: string; zip: string };
};

export function StaffDashboard({
  initialOrders,
}: {
  initialOrders: OrderRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);

  async function fetchOrders() {
    setLoading(true);
    const params = new URLSearchParams();
    if (pickupDate) params.set("pickupDate", pickupDate);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json().catch(() => []);
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
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
        prev.map((o) =>
          o.id === orderId ? { ...o, status } : o
        )
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Pickup date
          </label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100"
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
          onClick={fetchOrders}
          disabled={loading}
          className="self-end rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Loading…" : "Apply filters"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                Pickup address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                Pickup / Delivery
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                Update
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  No orders for this date/filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-900 dark:text-zinc-100">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{order.customer.name ?? order.customer.email}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {order.customer.phone ?? order.customer.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {order.pickupAddress.street}, {order.pickupAddress.city},{" "}
                    {order.pickupAddress.state} {order.pickupAddress.zip}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(order.pickupDate as string).toLocaleDateString()} /{" "}
                    {new Date(order.deliveryDate as string).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {NEXT_STATUS[order.status]?.length ? (
                      <select
                        className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) updateStatus(order.id, v);
                          e.target.value = "";
                        }}
                      >
                        <option value="">Change status…</option>
                        {NEXT_STATUS[order.status].map((s) => (
                          <option key={s} value={s}>
                            → {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-zinc-400 text-sm">—</span>
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
