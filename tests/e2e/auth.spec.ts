import { expect, test } from "@playwright/test";

// Auth surface (logged out). This file opts OUT of the shared storageState
// (see playwright.config.ts) because it tests the logged-out views; the
// TOTAL real login attempts stay well under the rate-limiter budget.

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("unauthenticated routing", () => {
  test("the dashboard redirects to /login with a return URL", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login\?from_url=%2F$/);
    await expect(page.getByRole("heading", { name: "Welcome to Personalized Tutor App" })).toBeVisible();
  });

  test("the login card renders the reference structure", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Need an account? Sign up" })).toBeVisible();
    // The slate login surface (the one page that is NOT the yellow chrome).
    const main = page.locator("main");
    await expect(main).toHaveCSS("background-image", /linear-gradient/);
  });

  test("the Google button explains instead of failing silently", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(
      page.getByText("Google sign-in is not configured", { exact: false }),
    ).toBeVisible();
  });

  test("bad credentials surface the error, not a silent redirect", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@thinkerwell.app");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("sign-up mode creates an account and lands on onboarding", async ({ page }) => {
    const email = `e2e-signup-${Date.now()}@thinkerwell.test`;
    await page.goto("/login");
    await page.getByRole("button", { name: "Need an account? Sign up" }).click();
    await page.getByLabel("Name").fill("E2E Signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Sup3rSecret!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/(onboarding)?\/?$/, { timeout: 15_000 });
    // A fresh account sees the setup state.
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();
  });
});
