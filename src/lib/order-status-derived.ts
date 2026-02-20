/**
 * Order-level display status derived from load statuses:
 * - "ready_for_delivery" when all loads are folded (ready_for_delivery)
 * - "in_progress" when any load has started (washing, drying, or folding)
 * - otherwise the order's database status is used
 */

export type LoadStatus = "washing" | "drying" | "folding" | "ready_for_delivery";

export function getDerivedOrderStatus(
  orderStatus: string,
  loadStatuses: LoadStatus[]
): string {
  if (loadStatuses.length === 0) return orderStatus;
  const allReady = loadStatuses.every((s) => s === "ready_for_delivery");
  if (allReady) return "ready_for_delivery";
  const anyStarted = loadStatuses.some(
    (s) => s === "washing" || s === "drying" || s === "folding"
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
