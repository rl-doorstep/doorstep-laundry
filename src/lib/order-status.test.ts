const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["picked_up", "cancelled"],
  picked_up: ["in_progress"],
  in_progress: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

describe("order status transitions", () => {
  it("draft can go to scheduled or cancelled", () => {
    expect(VALID_TRANSITIONS.draft).toContain("scheduled");
    expect(VALID_TRANSITIONS.draft).toContain("cancelled");
  });

  it("scheduled can go to picked_up or cancelled", () => {
    expect(VALID_TRANSITIONS.scheduled).toContain("picked_up");
    expect(VALID_TRANSITIONS.scheduled).toContain("cancelled");
  });

  it("delivered and cancelled have no next status", () => {
    expect(VALID_TRANSITIONS.delivered).toEqual([]);
    expect(VALID_TRANSITIONS.cancelled).toEqual([]);
  });

  it("out_for_delivery can only go to delivered", () => {
    expect(VALID_TRANSITIONS.out_for_delivery).toEqual(["delivered"]);
  });
});
