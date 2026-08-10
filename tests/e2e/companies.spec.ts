import { test, expect } from "@playwright/test";

test.describe("companies", () => {
  test("page route exists", async ({ page }) => {
    await page.goto("/companies");
    await expect(page.getByRole("heading", { name: "Компании" })).toBeVisible();
  });
});
