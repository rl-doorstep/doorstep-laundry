import type { LoadStatus, OrderStatus } from "@prisma/client";

export const BLOCKED_ADD_STATUSES: OrderStatus[] = [
  "cancelled",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
];

export const REMOVABLE_LAST_LOAD_STATUSES: LoadStatus[] = ["ready_for_pickup", "incoming"];

export function canAddOrderLoad(orderStatus: OrderStatus): boolean {
  return !BLOCKED_ADD_STATUSES.includes(orderStatus);
}

export type DeleteLastLoadResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Driver-style removal: only while scheduled/picked up, min 1 load, last load not past incoming.
 */
export function canDeleteLastOrderLoad(
  orderStatus: OrderStatus,
  numberOfLoads: number,
  lastLoadStatus: LoadStatus
): DeleteLastLoadResult {
  if (orderStatus !== "scheduled" && orderStatus !== "picked_up") {
    return {
      ok: false,
      reason: "Loads can only be removed while the order is scheduled or picked up",
    };
  }
  if (numberOfLoads <= 1) {
    return { ok: false, reason: "An order must have at least one load" };
  }
  if (!REMOVABLE_LAST_LOAD_STATUSES.includes(lastLoadStatus)) {
    return {
      ok: false,
      reason:
        "Only loads that have not started processing (ready for pickup or incoming) can be removed",
    };
  }
  return { ok: true };
}

export function initialLoadStatusForOrder(orderStatus: OrderStatus): LoadStatus {
  switch (orderStatus) {
    case "scheduled":
      return "ready_for_pickup";
    case "picked_up":
      return "incoming";
    case "ready_for_wash":
    case "in_progress":
    case "waiting_for_payment":
      return "ready_for_wash";
    default:
      return "ready_for_wash";
  }
}
