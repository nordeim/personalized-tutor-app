import { expect, test } from "@playwright/test";

// Authenticated header chrome (uses the shared storageState — unlike
// auth.spec.ts, which opts out at file level for logged-out surfaces).
// Session-4: the with-course header is the reference's TWO-dropdown split —
// the bordered Course pill (p_) + the m_ user menu (context line + Update
// Preferences + My Courses + Log Out; the email only shows with NO course).

test.describe("authenticated chrome", () => {
  test("the user menu shows the course context line and navigates to My Courses", async ({ page }) => {
    await page.goto("/");
    const pill = page.getByRole("button", { name: /Demo Learner/ }).first();
    await expect(pill).toBeVisible();
    await pill.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    // With a course, the m_ variant carries the context line, NOT the email.
    await expect(menu.getByText("Economics · Default")).toBeVisible();
    await expect(menu.getByText("demo@thinkerwell.app")).toHaveCount(0);
    await expect(menu.getByRole("button", { name: "Update Preferences" })).toBeVisible();
    await menu.getByRole("button", { name: "My Courses" }).click();
    await expect(page).toHaveURL(/\/courses\/?$/);
  });

  test("Update Preferences opens the inline name form and saves (PUT /api/student)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Demo Learner/ }).first().click();
    const menu = page.getByRole("menu");
    await menu.getByRole("button", { name: "Update Preferences" }).click();
    const input = menu.getByLabel("Name");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("Demo Learner");
    await menu.getByRole("button", { name: /Save Changes/ }).click();
    // The panel returns to the items view after the save.
    await expect(menu.getByRole("button", { name: "Update Preferences" })).toBeVisible({ timeout: 10_000 });
  });

  test("the Course pill (p_) opens: only-course notice + All Courses + Add a Course", async ({ page }) => {
    await page.goto("/");
    // The seeded student has exactly one enrollment — the pill is labeled
    // with current_subject and the panel filters OUT that course.
    const coursePill = page.getByRole("button", { name: /^Economics/ }).first();
    await expect(coursePill).toBeVisible();
    // Tailwind v4 renders rounded-full as calc(Infinity*1px) → 3.35544e+07px,
    // so assert the pill's BORDER instead (the static spans had none).
    await expect(coursePill).toHaveCSS("border-top-width", "1px");
    await coursePill.click();
    const menu = page.getByRole("menu", { name: "Course menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByText("This is your only course")).toBeVisible();
    await expect(menu.getByRole("button", { name: "All Courses" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Add a Course" })).toBeVisible();
    await menu.getByRole("button", { name: "All Courses" }).click();
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
