import { expect, test } from "@playwright/test";

// Authenticated header chrome (uses the shared storageState — unlike
// auth.spec.ts, which opts out at file level for logged-out surfaces).

test.describe("authenticated chrome", () => {
  test("the header user menu opens, shows the email, and logs out", async ({ page }) => {
    await page.goto("/");
    const pill = page.getByRole("button", { name: /Demo Learner/ }).first();
    await expect(pill).toBeVisible();
    await pill.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    // Desktop panel carries name + email in the yellow header.
    await expect(menu.getByText("demo@thinkerwell.app")).toBeVisible();
    await menu.getByRole("button", { name: "My Courses" }).click();
    await expect(page).toHaveURL(/\/courses\/?$/);
  });

  test("the yellow header computes the reference tokens", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS("background-color", "rgb(255, 253, 115)");
    await expect(header).toHaveCSS("border-bottom-left-radius", "20px");
    const app = page.locator("div.min-h-screen").first();
    await expect(app).toHaveCSS("background-color", "rgb(15, 14, 14)");
    // Brand wordmark is Eczar.
    const brand = header.locator("a span").first();
    expect(await brand.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Eczar");
  });

  test("Log Out from the dropdown returns to the login card", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Demo Learner/ }).first().click();
    await page.getByRole("menu").getByRole("button", { name: "Log Out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome to Personalized Tutor App" }),
    ).toBeVisible();
  });
});
