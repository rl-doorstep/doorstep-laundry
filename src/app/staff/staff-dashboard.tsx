"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTimeSlotById } from "@/lib/slots";

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
  pickupTimeSlot: string | null;
  deliveryTimeSlot: string | null;
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

  const inputClass =
    "mt-1 rounded-lg border border-fern-200 bg-white px-3 py-2 text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-end rounded-2xl border border-fern-200/80 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-fern-700">
            Pickup date
          </label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fern-700">
            Status
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
          onClick={fetchOrders}
          disabled={loading}
          className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Apply filters"}
        </button>
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
                Pickup address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Time windows
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Pickup / Delivery date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-fern-500">
                Update
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fern-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-fern-500">
                  No orders for this date/filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-fern-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-fern-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-fern-900">{order.customer.name ?? order.customer.email}</div>
                    <div className="text-fern-500 text-xs">
                      {order.customer.phone ?? order.customer.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    {order.pickupAddress.street}, {order.pickupAddress.city},{" "}
                    {order.pickupAddress.state} {order.pickupAddress.zip}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-fern-100 text-fern-700">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    {order.pickupTimeSlot ? getTimeSlotById(order.pickupTimeSlot)?.label ?? order.pickupTimeSlot : "—"} /{" "}
                    {order.deliveryTimeSlot ? getTimeSlotById(order.deliveryTimeSlot)?.label ?? order.deliveryTimeSlot : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-fern-600">
                    {new Date(order.pickupDate as string).toLocaleDateString()} /{" "}
                    {new Date(order.deliveryDate as string).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {NEXT_STATUS[order.status]?.length ? (
                      <select
                        className="rounded-lg border border-fern-200 bg-white px-2 py-1.5 text-sm text-fern-900 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20"
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
                      <span className="text-fern-400 text-sm">—</span>
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
