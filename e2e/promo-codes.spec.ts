import { test, expect, CUSTOMER_STATE, ADMIN_STATE } from "./fixtures/base";
import { deletePromoCode, resetUserCreditedLoads, disconnect } from "./fixtures/db";

const CUSTOMER_EMAIL = "ricky+1@doorsteplaundrylc.com";

test.afterAll(async () => {
  await disconnect();
});

test.describe("Promo code redemption", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: CUSTOMER_STATE });

  let adminRequest: import("@playwright/test").APIRequestContext;
  let currentCode: string;

  test.beforeAll(async ({ playwright }) => {
    adminRequest = await playwright.request.newContext({
      baseURL: "http://localhost:3000",
      storageState: ADMIN_STATE,
    });
  });

  test.afterAll(async () => {
    await deletePromoCode(currentCode);
    await adminRequest.dispose();
  });

  test.beforeEach(async () => {
    if (currentCode) await deletePromoCode(currentCode);
    await resetUserCreditedLoads(CUSTOMER_EMAIL);

    // Create via admin API so the code lives in the same DB as the server
    const res = await adminRequest.post("/api/admin/promo-codes", {
      data: { count: 1, numberOfLoads: 2 },
    });
    const codes = await res.json();
    currentCode = codes[0].code;
  });

  test("redeeming a valid code adds credited loads and shows success message", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("textbox", { name: /promo code/i }).fill(currentCode);
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page.getByText(/2 free loads? added/i)).toBeVisible({ timeout: 8_000 });
  });

  test("reusing a deleted code shows 'Invalid promo code' error", async ({ page }) => {
    // Redeem it first
    await page.goto("/dashboard");
    await page.getByRole("textbox", { name: /promo code/i }).fill(currentCode);
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page.getByText(/free loads? added/i)).toBeVisible({ timeout: 8_000 });

    // Try again — code is now deleted
    await page.getByRole("textbox", { name: /promo code/i }).fill(currentCode);
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page.getByText(/invalid promo code/i)).toBeVisible({ timeout: 8_000 });
  });

  test("entering an unknown code shows error", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("textbox", { name: /promo code/i }).fill("ZZZZ-ZZZZ");
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page.getByText(/invalid promo code/i)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Admin promo code management", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: ADMIN_STATE });

  let createdCode: string | null = null;

  test.afterAll(async () => {
    if (createdCode) await deletePromoCode(createdCode);
  });

  test("admin can generate codes and see them in the table", async ({ page }) => {
    await page.goto("/admin");

    await page.getByRole("button", { name: /generate codes/i }).click();
    await expect(page.getByLabel(/number of codes to create/i)).toBeVisible({ timeout: 5_000 });

    await page.getByLabel(/number of codes to create/i).fill("1");
    await page.getByLabel(/free loads per code/i).fill("3");
    await page.getByRole("button", { name: /^generate$/i }).click();

    await expect(page.getByText(/generated 1 code/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 8_000 });
  });

  test("code is gone from admin table after it is redeemed", async ({ page, browser }) => {
    // Create a code via admin API so we know its value
    const ctx = await browser.newContext({ storageState: ADMIN_STATE });
    const req = ctx.request;
    const res = await req.post("http://localhost:3000/api/admin/promo-codes", {
      data: { count: 1, numberOfLoads: 1 },
    });
    const codes = await res.json();
    createdCode = codes[0].code;
    await ctx.close();

    // Confirm visible in admin list
    await page.goto("/admin");
    await expect(page.getByText(createdCode)).toBeVisible({ timeout: 8_000 });

    // Redeem as customer
    const customerCtx = await browser.newContext({ storageState: CUSTOMER_STATE });
    const customerPage = await customerCtx.newPage();
    await customerPage.goto("http://localhost:3000/dashboard");
    await customerPage.getByRole("textbox", { name: /promo code/i }).fill(createdCode);
    await customerPage.getByRole("button", { name: /apply/i }).click();
    await expect(customerPage.getByText(/free loads? added/i)).toBeVisible({ timeout: 8_000 });
    await customerCtx.close();

    // Reload admin — code should be gone
    await page.reload();
    await expect(page.getByText(createdCode)).not.toBeVisible({ timeout: 8_000 });
    createdCode = null; // already deleted (redeemed)
  });
});
