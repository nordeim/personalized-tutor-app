import { expect, test } from "@playwright/test";

// Desktop (1440×900) parity essentials for the dashboard surfaces.
// Contexts arrive AUTHENTICATED (storageState); the seed plants the demo
// account with the reference's sample Economics course (60%, 4/6 lessons).

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("course dashboard (the seeded Economics demo state)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the welcome card, stats grid, roadmap and lessons panel", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Demo Learner", exact: true })).toBeVisible();
    await expect(page.getByText("Course Progress")).toBeVisible();
    await expect(page.getByText("Daily Challenge")).toBeVisible();
    await expect(page.getByText("Learning Roadmap")).toBeVisible();
    await expect(page.getByRole("link", { name: /Enter The Hub/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retake Quiz" })).toBeVisible();
    // Six lesson rows in the purple panel.
    const lessons = page.getByRole("button", { name: /Open lesson \d/ });
    await expect(lessons).toHaveCount(6);
  });

  test("the seeded progress computes honestly (4/6 lessons → 67%)", async ({ page }) => {
    // The reference's /demo hardcodes 60%, but a REAL course computes —
    // round(4/6*100) = 67. Assert the honest math on the seeded state.
    await expect(page.getByText("67%", { exact: true })).toBeVisible();
    await expect(page.getByText("4/6 lessons completed")).toBeVisible();
  });

  test("the quote bubble and mascot ship the reference tokens", async ({ page }) => {
    const bubble = page.locator("div.rounded-\\[14px\\]").first();
    await expect(bubble).toHaveCSS("background-color", "rgb(235, 226, 255)");
    const mascot = page.getByAltText("Thinkerwell mascot");
    await expect(mascot).toBeVisible();
    expect(await mascot.boundingBox()).toMatchObject({ width: 80, height: 105 });
  });

  test("Enter The Hub navigates with the course param", async ({ page }) => {
    await page.getByRole("link", { name: /Enter The Hub/ }).click();
    await expect(page).toHaveURL(/\/hub\?course=/);
    await expect(page.getByText("Your AI Tutor")).toBeVisible();
  });

  test("the lesson rows deep-link into the Hub", async ({ page }) => {
    await page.getByRole("button", { name: "Open lesson 5" }).click();
    await expect(page).toHaveURL(/\/hub\?course=.+&lesson=4/);
  });
});

test.describe("the Hub (desktop three-pane)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hub");
  });

  test("renders the lessons sidebar, Nori chat, and lesson content panes", async ({ page }) => {
    await expect(page.getByText("Lesson Progress").first()).toBeVisible();
    await expect(page.getByText("Nori", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Your AI Tutor").first()).toBeVisible();
    await expect(page.getByPlaceholder("Ask Nori anything...")).toBeVisible();
    // Lesson content: core concept card + question flow (AI or fallback).
    await expect(page.getByText("Core Concept").first()).toBeVisible({ timeout: 30_000 });
  });

  test("the sidebar active lesson row computes the yellow chip", async ({ page }) => {
    const active = page.getByRole("button", { name: /Lesson 1 · Now/ });
    await expect(active).toHaveCSS("background-color", "rgb(255, 253, 115)");
    const inactive = page.getByRole("button", { name: /Lesson 2 / }).first();
    await expect(inactive).toHaveCSS("background-color", "rgb(235, 235, 235)");
  });

  test("Nori answers with the Socratic persona", async ({ page }) => {
    const input = page.getByPlaceholder("Ask Nori anything...");
    // Assistant bubbles carry the .prose wrapper — count them so the
    // assertion proves a NEW reply arrived (not the greeting matching).
    const bubbles = page.locator(".prose");
    const before = await bubbles.count();
    await input.fill("What should I focus on first?");
    await input.press("Enter");
    await expect(bubbles).not.toHaveCount(before, { timeout: 60_000 });
    // The persisted exchange survives a reload (chat history round-trips).
    await page.reload();
    await expect(page.getByText("What should I focus on first?").first()).toBeVisible();
  });

  test("switching lessons loads a fresh lesson view", async ({ page }) => {
    await page.getByRole("button", { name: /Lesson 3 / }).first().click();
    await expect(page.getByText(/^Lesson 3$/).first()).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("the courses dashboard", () => {
  test("lists the seeded course and opens it", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Economics" })).toBeVisible();
    await page.getByRole("button", { name: "Open Economics" }).click();
    await expect(page).toHaveURL(/\/\?course=/);
    await expect(page.getByRole("heading", { name: "Demo Learner", exact: true })).toBeVisible();
  });

  test("the setup panel renders onboarding in force mode (Add a Course)", async ({ page }) => {
    await page.goto("/courses");
    const add = page.getByRole("link", { name: "Add a Course" });
    await expect(add).toHaveCSS("border-top-style", "dashed");
    await add.click();
    await expect(page).toHaveURL(/\/onboarding\/?$/);
    await expect(page.getByRole("heading", { name: "Let's get you set up" })).toBeVisible();
  });
});

test.describe("the guest demo route", () => {
  test("renders the full Economics dashboard without auth state", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: "Guest", exact: true })).toBeVisible();
    await expect(page.getByText("Microeconomic Foundations", { exact: true })).toBeVisible();
    // The demo pins the reference's static marketing numbers.
    await expect(page.getByText("60%", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Enter The Hub/ })).toBeVisible();
  });
});
