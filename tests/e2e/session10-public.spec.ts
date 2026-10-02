import { expect, test } from "@playwright/test";

// SESSION-10 PUBLIC-surface pins (logged OUT — the storageState scoping rule
// keeps anonymous specs in their own file, like auth.spec.ts).
//
// Covered:
//   S10-F1 — the from_url QUERY-STRING contract: the live's client-side
//            navigateToLogin = redirectToLogin(window.location.href) — the
//            current URL's path AND query ride. The anonymous desktop pill
//            at /?q=parity must route to /login?from_url=%2F%3Fq%3Dparity
//            (the clone's pathname-only writers dropped the query).
//            R8's consumer round-trips the query back post-login.
//   R8 pin  — the same-origin guard: a FOREIGN absolute from_url collapses
//            to "/" (the open-redirect FIX — the live ships the
//            vulnerability; clone doctrine: fix it AND pin it).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("the desktop anonymous Sign In pill carries the query (S10-F1)", () => {
  test("the pill at /?q=parity routes to /login?from_url=%2F%3Fq%3Dparity", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?q=parity");
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();

    const signIn = page.getByRole("button", { name: "Sign In", exact: true });
    await expect(signIn).toBeVisible();
    await signIn.click();
    await expect(page).toHaveURL(/\/login\?from_url=%2F%3Fq%3Dparity$/);
  });
});

test.describe("the from_url consumer (R8 — login/page.tsx)", () => {
  test("a query-carrying from_url round-trips back post-login", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login?from_url=%2F%3Fq%3Dparity");
    await page.getByLabel("Email").fill("demo@thinkerwell.app");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    // The demo user lands back on the root WITH the query intact.
    await expect(page).toHaveURL(/\/\?q=parity$/);
  });

  test("a FOREIGN absolute from_url collapses to / (the open-redirect fix)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login?from_url=https%3A%2F%2Fevil.example%2Fphish");
    await page.getByLabel("Email").fill("demo@thinkerwell.app");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    // The live would redirect to the foreign origin (an open redirect); the
    // clone's same-origin guard collapses it to the safe root.
    await expect(page).toHaveURL(/\/$/);
    await expect(page).not.toHaveURL(/evil/);
  });
});
