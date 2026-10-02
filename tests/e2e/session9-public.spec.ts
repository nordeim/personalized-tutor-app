import { expect, test } from "@playwright/test";

// SESSION-9 PUBLIC-surface pins (logged OUT — the storageState scoping rule
// keeps anonymous specs in their own file, like auth.spec.ts).
//
// Covered:
//   S9-F2 — the desktop anonymous Sign In pill carries from_url (the live's
//            navigateToLogin = redirectToLogin(window.location.href); the
//            clone's pill previously pushed a bare /login).
//   S9-F5 — the mobile (390×844, hasTouch) anonymous public-onboarding
//            guest menu gets a REAL .tap() pin (auth.spec's structural test
//            clicks on a no-touch context; mobile-navigation.spec only pins
//            the guest DEMO menu — this file closes the gap).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("the desktop anonymous Sign In pill carries from_url (S9-F2)", () => {
  test("the pill routes to /login?from_url=%2F from the public root", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();

    // The live's pill calls navigateToLogin() = redirectToLogin(
    // window.location.href) — the current URL rides as from_url (the same
    // contract as the mobile Sign In item and the anonymous Continue).
    const signIn = page.getByRole("button", { name: "Sign In", exact: true });
    await expect(signIn).toBeVisible();
    await signIn.click();
    await expect(page).toHaveURL(/\/login\?from_url=%2F$/);
  });
});

test.describe("the anonymous mobile menu gets a real-tap pin (S9-F5)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the hamburger TAPS open and the panel is items-only (no name header)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();

    // The regression-guard preamble: the empty toaster must stay inert so
    // the tap lands (the live ships this broken; the clone pins the fix).
    const toaster = page.locator('[aria-label="Notifications"]');
    await expect(toaster).toHaveCSS("pointer-events", "none");

    // A REAL tap (Playwright refuses covered elements).
    await page.getByRole("button", { name: "Open menu" }).tap();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    // The anonymous panel: My Courses + Sign In, NO yellow name header.
    await expect(menu.getByRole("button", { name: "My Courses" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Log Out" })).toHaveCount(0);
    // No yellow name block renders for the anonymous variant (the authed
    // menu's p-3 #FFFD73 header is absent).
    await expect(menu.locator("div.p-3").filter({ hasText: /Demo|Guest/ })).toHaveCount(0);

    // The Sign In item routes with from_url on tap (the live's chain).
    await menu.getByRole("button", { name: "Sign In" }).tap();
    await expect(page).toHaveURL(/\/login\?from_url=%2F$/);
  });
});
