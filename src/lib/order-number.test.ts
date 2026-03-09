import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsert = vi.fn();
const mockTransaction = vi.fn();

vi.mock("./db", () => ({
  prisma: {
    $transaction: (callback: (tx: { orderSequence: { upsert: ReturnType<typeof vi.fn> } }) => Promise<string>) =>
      mockTransaction(callback),
    orderSequence: { upsert: mockUpsert },
  },
}));

beforeEach(() => {
  mockUpsert.mockResolvedValue({ datePrefix: "20260219", lastNumber: 1 });
  mockTransaction.mockImplementation(
    async (
      callback: (tx: { orderSequence: { upsert: ReturnType<typeof vi.fn> } }) => Promise<string>
    ) => {
      const tx = {
        orderSequence: {
          upsert: mockUpsert,
        },
      };
      return callback(tx);
    }
  );
});

describe("order number", () => {
  it("generates ORDER-YYYYMMDD-XXXX format", async () => {
    const { generateOrderNumber } = await import("./order-number");
    const result = await generateOrderNumber();
    expect(result).toMatch(/^ORDER-\d{8}-\d{4}$/);
  });

  it("pads sequence number to 4 digits", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-19T12:00:00Z"));
    mockUpsert.mockResolvedValueOnce({ datePrefix: "20260219", lastNumber: 42 });
    mockTransaction.mockImplementationOnce(
      async (
        callback: (tx: { orderSequence: { upsert: ReturnType<typeof vi.fn> } }) => Promise<string>
      ) => callback({ orderSequence: { upsert: mockUpsert } })
    );
    const { generateOrderNumber } = await import("./order-number");
    const result = await generateOrderNumber();
    vi.useRealTimers();
    expect(result).toBe("ORDER-20260219-0042");
  });
});
