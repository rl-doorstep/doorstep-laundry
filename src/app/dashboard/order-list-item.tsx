"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTimeSlotById } from "@/lib/slots";
import { DeleteDraftOrderButton } from "@/components/delete-draft-order-button";
import { PayButton } from "@/app/orders/[orderId]/pay-button";

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  picked_up: "Picked up",
  ready_for_wash: "Ready for wash",
  in_progress: "In progress",
  waiting_for_payment: "Waiting for payment",
  ready_for_delivery: "Ready for delivery",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type OrderListItemOrder = {
  id: string;
  orderNumber: string;
  status: string;
  stripePaymentId?: string | null;
  totalCents?: number | null;
  pickupDate: Date | string;
  deliveryDate: Date | string;
  pickupTimeSlot: string | null;
  deliveryTimeSlot: string | null;
  orderLoads?: { weightLbs: number | null }[];
};

export function OrderListItem({ order }: { order: OrderListItemOrder }) {
  const router = useRouter();
  const isScheduled = order.status === "scheduled";
  const showPay = order.status === "waiting_for_payment" && !order.stripePaymentId;

  return (
    <li className="flex gap-2 items-stretch">
      <Link
        href={`/orders/${order.id}`}
        className="flex-1 min-w-0 block rounded-2xl border border-fern-200/80 bg-white p-5 hover:bg-fern-50/50 hover:border-fern-200 transition-colors shadow-sm"
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono font-medium text-fern-900">
              {order.orderNumber}
            </span>
            <p className="text-sm text-fern-500 mt-1">
              Pickup {new Date(order.pickupDate).toLocaleDateString()}
              {order.pickupTimeSlot && ` ${getTimeSlotById(order.pickupTimeSlot)?.label ?? order.pickupTimeSlot}`}
              {" · Delivery "}
              {new Date(order.deliveryDate).toLocaleDateString()}
              {order.deliveryTimeSlot && ` ${getTimeSlotById(order.deliveryTimeSlot)?.label ?? order.deliveryTimeSlot}`}
            </p>
            {order.status === "waiting_for_payment" && (order.totalCents != null || (order.orderLoads?.length ?? 0) > 0) && (
              <p className="text-sm text-fern-700 mt-1">
                {order.totalCents != null && order.totalCents > 0 && (
                  <>Total: ${(Math.round(order.totalCents) / 100).toFixed(2)}</>
                )}
                {order.orderLoads?.length ? (
                  <span className="text-fern-600">
                    {order.totalCents != null && order.totalCents > 0 ? " · " : ""}
                    {order.orderLoads
                      .map((l) => (l.weightLbs != null ? `${l.weightLbs.toFixed(1)} lbs` : null))
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </span>
                ) : null}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              order.status === "delivered"
                ? "bg-fern-100 text-fern-700"
                : order.status === "cancelled"
                  ? "bg-fern-100 text-fern-500"
                  : "bg-fern-200 text-fern-800"
            }`}
          >
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>
      </Link>
      {showPay && (
        <PayButton orderId={order.id} variant="icon" />
      )}
      {isScheduled && (
        <DeleteDraftOrderButton
          orderId={order.id}
          variant="icon"
          onDeleted={() => router.refresh()}
        />
      )}
    </li>
  );
}
