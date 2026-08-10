import { test, expect } from "@playwright/test";

test.describe("companies", () => {
  test("page route exists", async ({ page }) => {
    await page.goto("/companies");
    await expect(
      page.getByRole("heading", { name: /Карта компаний/ }),
    ).toBeVisible();
  });

  test("opens company profile modal", async ({ page }) => {
    await page.goto("/companies");
    await page.getByRole("button", { name: "Открыть" }).first().click();
    await expect(
      page.getByRole("dialog", { name: "Профиль компании" }),
    ).toBeVisible();
    await expect(page.getByText("Контакты")).toBeVisible();
    await expect(page.getByText("Источник")).toBeVisible();
  });
});
