import { expect, test } from "@playwright/test";

// Auth surface (logged out). This file opts OUT of the shared storageState
// (see playwright.config.ts) because it tests the logged-out views; the
// TOTAL real login attempts stay well under the rate-limiter budget.
//
// S8-F1: the anonymous / is the PUBLIC ONBOARDING (the live's landing
// surface — Sign In pill, "Your Name" field, pending_student_setup
// deferral), not a login redirect. /demo, /hub, /quiz and /courses still
// bounce to /login?from_url=… (the live's auth gate).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("the public onboarding (S8-F1)", () => {
  test("the anonymous root renders the onboarding with the Sign In pill and the name field", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();
    // The anonymous setup panel carries the "Your Name" block.
    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Alex Johnson")).toBeVisible();
    // The header renders the black Sign In pill (desktop) instead of the
    // m_ user menu.
    const signIn = page.getByRole("button", { name: "Sign In", exact: true });
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(signIn).toHaveCSS("border-radius", "9999px");
    // The typewriter hero renders (the reference's landing surface).
    await expect(page.getByRole("heading", { name: /Dive into/ })).toBeVisible();
  });

  test("the anonymous /onboarding renders the same public surface", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();
    await expect(page.getByLabel("Your Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In", exact: true })).toBeVisible();
  });

  test("the anonymous mobile menu is items-only (My Courses + Sign In, no name header)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // click (not tap): this file's context has no hasTouch — the
    // mobile-navigation spec owns the real-tap pin on its hasTouch context.
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    // The anonymous panel has NO yellow name header (unlike the authed menu).
    await expect(menu.getByText("Guest", { exact: true })).toHaveCount(0);
    await expect(menu.getByRole("button", { name: "My Courses" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Log Out" })).toHaveCount(0);
  });

  test("the anonymous Continue defers via pending_student_setup and lands on the login card", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Your Name").fill("Alex Johnson");
    await page
      .getByLabel("What would you like to learn")
      .fill("World War II");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?from_url=%2F$/);
    await expect(
      page.getByRole("heading", { name: "Welcome to Personalized Tutor App" }),
    ).toBeVisible();
  });

  test("the pending setup auto-generates after sign-up (the full public flow)", async ({ page }) => {
    const email = `s8-pending-${Date.now()}@parity.test`;
    await page.goto("/");
    await page.getByLabel("Your Name").fill("Alex Johnson");
    await page.getByLabel("What would you like to learn").fill("Astronomy");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?from_url=%2F$/);

    // Sign up on the login card — the post-login navigation returns to the
    // root, where the onboarding picks the pending setup up and
    // auto-submits through /api/courses/generate → /quiz?course=….
    await page.getByRole("button", { name: "Need an account? Sign up" }).click();
    await page.getByLabel("Name").fill("Alex Signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Sup3rSecret!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/quiz\?course=[\w-]+/, { timeout: 30_000 });
    await expect(page).toHaveTitle(/Quiz Page/);
  });
});

test.describe("the auth-gated routes redirect anonymously (S8-F2)", () => {
  test("the demo route requires a session", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/login\?from_url=%2Fdemo/);
  });

  test("the hub, quiz and courses routes require a session", async ({ page }) => {
    for (const [path, code] of [
      ["/hub", "%2Fhub"],
      ["/quiz", "%2Fquiz"],
      ["/courses", "%2Fcourses"],
    ] as const) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?from_url=${code}`));
      await expect(
        page.getByRole("heading", { name: "Welcome to Personalized Tutor App" }),
      ).toBeVisible();
    }
  });
});

test.describe("unauthenticated routing", () => {
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
    // S7-F5: the card's backdrop-blur-sm must compute the v3 geometry
    // (4px — v4's engine doubles it to 8px; globals.css Trap 7 pins it)
    // and the card radius stays 16px.
    const card = page.locator(".rounded-2xl");
    await expect(card).toHaveCSS("backdrop-filter", "blur(4px)");
    await expect(card).toHaveCSS("border-radius", "16px");
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
