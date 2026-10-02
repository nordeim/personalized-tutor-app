import { expect, test } from "@playwright/test";

// Session-4 parity: the two-dropdown header split (the decoded p_ Course pill
// + m_ user menu), the hub pill semantics, the Q5 Add-a-Course modal, and the
// guest /demo chrome. Uses the shared authenticated storageState (seed:
// Demo Learner, current_subject "Economics", one enrollment).

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the hub Course pill (S4-F3/F4)", () => {
  test("the pill labels current_subject and its rows route to the dashboard", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Your AI Tutor").first()).toBeVisible();

    // Label = student.current_subject (NOT the hardcoded "Course").
    const pill = page.getByRole("button", { name: /^Economics/ }).first();
    await expect(pill).toBeVisible();
    await pill.click();
    const menu = page.getByRole("menu", { name: "Course menu" });
    await expect(menu).toBeVisible();

    // Plain name rows (no tiles, no current badge) + the All Courses section.
    const row = menu.getByRole("button", { name: "Economics", exact: true }).first();
    await expect(row).toBeVisible();
    await expect(menu.getByText("current")).toHaveCount(0);
    await expect(menu.getByRole("button", { name: "All Courses" })).toBeVisible();

    // A row click navigates to the DASHBOARD (?course=), not /hub?course=.
    await row.click();
    await expect(page).toHaveURL(/\/\?course=/);
    await expect(page.getByRole("heading", { name: "Demo Learner", exact: true })).toBeVisible();
  });

  test("the header span shows the current lesson title, not the course name", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Core Concept").first()).toBeVisible({ timeout: 30_000 });
    // Seeded Economics lesson 1 = "Microeconomic Foundations: Basics" — the
    // span beside the Course pill (the reference's Qe = De[q]).
    await expect(
      page.getByText("Microeconomic Foundations: Basics", { exact: true }).first(),
    ).toBeVisible();
    // Switching lessons (deep link to lesson 3) updates the span.
    await page.goto("/hub?lesson=2");
    await expect(page.getByText(/^Lesson 3$/).first()).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("Macroeconomic Principles: Fundamentals", { exact: true }).first(),
    ).toBeVisible();
  });
});

test.describe("the guest demo chrome (S4-F5)", () => {
  test("the demo header renders the real two-pill structure with guest degradation", async ({ page }) => {
    await page.goto("/demo");

    // The bordered Economics Course pill.
    const coursePill = page.getByRole("button", { name: /^Economics/ }).first();
    await expect(coursePill).toBeVisible();
    await expect(coursePill).toHaveCSS("border-top-style", "solid");
    await coursePill.click();
    const courseMenu = page.getByRole("menu", { name: "Course menu" });
    await expect(courseMenu).toBeVisible();
    await expect(courseMenu.getByText("This is your only course")).toBeVisible();

    // Guest "Add a Course" opens the Q5 modal; Start Assessment (guest) routes
    // to sign-up instead of hitting the API.
    await courseMenu.getByRole("button", { name: "Add a Course" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder(/e\.g\. Python programming/).fill("Python");
    await dialog.getByRole("button", { name: /Start Assessment/ }).click();
    await expect(page).toHaveURL(/\/login\/?\?from_url=%2Fonboarding/);

    // Back on the demo: the Guest user pill opens the m_ menu with the
    // "Economics · Default" context line + Update Preferences.
    await page.goto("/demo");
    const guestPill = page.getByRole("button", { name: /Guest/ }).first();
    await expect(guestPill).toBeVisible();
    await guestPill.click();
    const userMenu = page.getByRole("menu").first();
    await expect(userMenu.getByText("Economics · Default")).toBeVisible();
    await expect(userMenu.getByRole("button", { name: "Update Preferences" })).toBeVisible();

    // Guest preferences save degrades to the sign-up route.
    await userMenu.getByRole("button", { name: "Update Preferences" }).click();
    await userMenu.getByLabel("Name").fill("Someone");
    await userMenu.getByRole("button", { name: /Save Changes/ }).click();
    await expect(page).toHaveURL(/\/login\/?\?from_url=%2Fdemo/);
  });
});
