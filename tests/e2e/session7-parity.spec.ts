import { expect, test } from "@playwright/test";

// SESSION-7 parity pins — the computed-style layer (desktop, 1440×900).
// Contexts arrive AUTHENTICATED via the shared storageState; the guest
// /demo mirror carries the reference fixture (quiz 3 → 60% → 4 derived
// lessons) so every pin below is deterministic.
//
// Covered (docs/remediation-plan-session-7.md):
//   S7-F1 — the body's base font-weight is 300 (the live's app-wide
//            font-light default; weight-inheriting text like "N/6 lessons
//            completed" must compute 300, not 400).
//   S7-F2 — `rounded-xl` computes 12px (the reference's custom scale; v4's
//            engine default is 14px — pinned in globals.css Trap 6).
//   S7-F3 — `rounded-lg` computes 12px (the p_ panel's icon tiles; v4's
//            engine default is 8px — same pin).
//   S7-F4 — the Course Lessons rows carry lucide status icons
//            (CircleCheckBig done / Circle next / Circle later at /40),
//            never the scaffold's numbered circles.

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the base typography weight (S7-F1)", () => {
  test("the body defaults to font-weight 300 like the live", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toHaveCSS("font-weight", "300");
  });

  test("weight-inheriting secondary text renders 300 (N/6 lessons completed)", async ({ page }) => {
    await page.goto("/demo");
    const line = page.getByText(/lessons completed/);
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("font-weight", "300");
  });
});

test.describe("the pinned radius scale (S7-F2/S7-F3)", () => {
  test("the Course Lessons rows (rounded-xl) compute 12px", async ({ page }) => {
    await page.goto("/demo");
    const row = page.locator('button[aria-label^="Open lesson"]').first();
    await expect(row).toBeVisible();
    await expect(row).toHaveCSS("border-radius", "12px");
  });

  test("the p_ panel's icon tiles (rounded-lg) compute 12px", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: /Economics/ }).first().click();
    const tile = page
      .getByRole("button", { name: /^All Courses/ })
      .locator("div")
      .first();
    await expect(tile).toHaveCSS("border-radius", "12px");
  });
});

test.describe("the Course Lessons icon column (S7-F4)", () => {
  const rows = (page: import("@playwright/test").Page) =>
    page.locator('button[aria-label^="Open lesson"]');

  test("/demo renders CircleCheckBig x4 + Circle x2 — no numbered circles", async ({ page }) => {
    // The guest mirror: quiz 3 → 60% → 4 derived lessons.
    await page.goto("/demo");
    await expect(rows(page)).toHaveCount(6);
    await expect(rows(page).locator(".lucide-circle-check-big")).toHaveCount(4);
    await expect(rows(page).locator(".lucide-circle")).toHaveCount(2);
    // The scaffold's numbered-circle span is gone.
    await expect(rows(page).locator("span.rounded-\\[9999px\\]")).toHaveCount(0);
  });

  test("the later row's Circle icon dims to black/40 while the next row stays black", async ({ page }) => {
    await page.goto("/demo");
    const nextIcon = rows(page).nth(4).locator("svg");
    const laterIcon = rows(page).nth(5).locator("svg");
    await expect(nextIcon).toHaveCSS("color", "rgb(0, 0, 0)");
    await expect(laterIcon).toHaveCSS("color", "rgba(0, 0, 0, 0.4)");
  });
});
