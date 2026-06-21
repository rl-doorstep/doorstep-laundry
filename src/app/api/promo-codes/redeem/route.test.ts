import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  prisma: {
    promoCode: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { POST } from "./route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.promoCode.findUnique as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/promo-codes/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/promo-codes/redeem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ code: "ABCD-EFGH" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when code is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is empty string", async () => {
    const res = await POST(makeRequest({ code: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/promo-codes/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when promo code does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ code: "FAKE-CODE" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Invalid promo code");
  });

  it("deletes the promo code and increments creditedLoads on success", async () => {
    const promoCode = { id: "promo-1", code: "ABCD-EFGH", numberOfLoads: 2 };
    mockFindUnique.mockResolvedValue(promoCode);

    const mockTx = {
      promoCode: { delete: vi.fn().mockResolvedValue(undefined) },
      user: { update: vi.fn().mockResolvedValue({ creditedLoads: 5 }) },
    };
    mockTransaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));

    const res = await POST(makeRequest({ code: "ABCD-EFGH" }));
    expect(res.status).toBe(200);

    expect(mockTx.promoCode.delete).toHaveBeenCalledWith({ where: { id: "promo-1" } });
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { creditedLoads: { increment: 2 } },
      select: { creditedLoads: true },
    });

    const body = await res.json();
    expect(body).toEqual({ creditedLoads: 5, loadsAdded: 2 });
  });

  it("normalises code to uppercase before lookup", async () => {
    mockFindUnique.mockResolvedValue(null);
    await POST(makeRequest({ code: "abcd-efgh" }));
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { code: "ABCD-EFGH" } });
  });
});
