/**
 * Order status transition tests – delegates to shared transition module.
 * See order-transitions.test.ts for full coverage.
 */
import { describe, it, expect } from "vitest";
import { VALID_ORDER_TRANSITIONS } from "./order-transitions";

describe("order status transitions (shared module)", () => {
  it("scheduled can go to picked_up or cancelled", () => {
    expect(VALID_ORDER_TRANSITIONS.scheduled).toContain("picked_up");
    expect(VALID_ORDER_TRANSITIONS.scheduled).toContain("cancelled");
  });

  it("delivered and cancelled have no next status", () => {
    expect(VALID_ORDER_TRANSITIONS.delivered).toEqual([]);
    expect(VALID_ORDER_TRANSITIONS.cancelled).toEqual([]);
  });

  it("out_for_delivery can only go to delivered", () => {
    expect(VALID_ORDER_TRANSITIONS.out_for_delivery).toEqual(["delivered"]);
  });
});
