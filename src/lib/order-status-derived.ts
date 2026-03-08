/**
 * Order-level display status derived from load statuses:
 * - "ready_for_delivery" when all loads are ready_for_delivery
 * - "in_progress" when any load is incoming, washing, drying, or folding
 * - otherwise the order's database status is used
 */

export type LoadStatus =
  | "ready_for_pickup"
  | "incoming"
  | "washing"
  | "drying"
  | "folding"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered";

export function getDerivedOrderStatus(
  orderStatus: string,
  loadStatuses: LoadStatus[]
): string {
  if (loadStatuses.length === 0) return orderStatus;
  const allReady = loadStatuses.every((s) => s === "ready_for_delivery");
  if (allReady) return "ready_for_delivery";
  const anyStarted = loadStatuses.some(
    (s) =>
      s === "incoming" || s === "washing" || s === "drying" || s === "folding"
  );
  if (anyStarted) return "in_progress";
  return orderStatus;
}

export const DERIVED_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  picked_up: "Picked up",
  in_progress: "In progress",
  ready_for_delivery: "Ready for delivery",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
