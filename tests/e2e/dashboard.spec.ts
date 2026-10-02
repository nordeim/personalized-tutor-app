import { expect, test } from "@playwright/test";

// Desktop (1440×900) parity essentials for the dashboard surfaces.
// Contexts arrive AUTHENTICATED (storageState); the seed plants the demo
// account with the reference's sample Economics course (quiz 4/7 → the
// reference's quiz-derived model: 80%, 5/6 lessons).

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

  test("the seeded progress derives from the quiz score (4/5 → 80%, 5/6 lessons)", async ({ page }) => {
    // The reference has NO per-lesson progress — every dashboard number
    // derives from the diagnostic quiz: round(4/5*100) = 80%, round(0.8*6) = 5.
    await expect(page.getByText("80%", { exact: true })).toBeVisible();
    await expect(page.getByText("5/6 lessons completed")).toBeVisible();
    await expect(page.getByText("5/6 lessons", { exact: true })).toBeVisible();
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

  test("the sidebar lesson rows ship the reference's 3 states", async ({ page }) => {
    const active = page.getByRole("button", { name: /Lesson 1 · Now/ });
    await expect(active).toHaveCSS("background-color", "rgb(255, 253, 115)");
    const locked = page.getByRole("button", { name: /Lesson 2 / }).first();
    await expect(locked).toHaveCSS("background-color", "rgb(235, 235, 235)");
    await expect(locked).toHaveCSS("opacity", "0.45");
    await expect(locked).toBeDisabled();
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
    // Future lessons are locked on the sidebar (the reference's qP rule) —
    // the deep link selects lesson 3 directly.
    await page.goto("/hub?lesson=2");
    await expect(page.getByText(/^Lesson 3$/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Lesson 3 · Now/ })).toBeVisible();
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
    await expect(page.getByText("Foundations of Microeconomics", { exact: true })).toBeVisible();
    // The reference's demo numbers arrive via the quiz-derived model
    // (quiz 3/7 → round(3/5*100) = 60%, 4/6 lessons, 750 XP, 3-day streak).
    await expect(page.getByText("60%", { exact: true })).toBeVisible();
    await expect(page.getByText("750")).toBeVisible();
    await expect(page.getByRole("link", { name: /Enter The Hub/ })).toBeVisible();
  });
});
