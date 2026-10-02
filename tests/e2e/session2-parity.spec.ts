import { expect, test } from "@playwright/test";

// Session-2 parity pins (docs/remediation-plan-session-2.md): the reference's
// Study Streak + Total XP cards, the interactive Daily Challenge modal, and
// the ported lesson-quiz flow (auto-advance on correct, retry modal on wrong).
// Session-3 updated the numbers to the reference's quiz-derived model
// (docs/remediation-plan-session-3.md F24): quiz 4 → 80% → 5/6 lessons,
// XP = 80·10 + 4·50 = 1000; and the lesson view to the gO/Im architecture
// (tan 2-column options + the "Next Question" button).
// Contexts arrive AUTHENTICATED (storageState) with the seeded Economics
// course (quizScore 4, quizCompleted → 80%, 5/6 lessons).

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("dashboard gamification (the reference's right-column pair)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Study Streak caps the quiz score at 7 and renders the flame strip", async ({ page }) => {
    await expect(page.getByText("Study Streak")).toBeVisible();
    // seeded quizScore 4 → 4 days (min(4,7)).
    await expect(page.getByText("4", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("days", { exact: true })).toBeVisible();
    // The weekday strip renders seven tiles (M–S labels underneath).
    const tiles = page.locator("div.rounded-xl");
    await expect(tiles.first()).toBeVisible();
    expect(await tiles.count()).toBeGreaterThanOrEqual(7);
    for (const label of ["M", "T", "W", "F", "S"]) {
      expect(await page.getByText(label, { exact: true }).count()).toBeGreaterThan(0);
    }
  });

  test("Total XP computes the reference formula (scorePercent*10 + quizScore*50)", async ({ page }) => {
    await expect(page.getByText("Total XP")).toBeVisible();
    // 80*10 + 4*50 = 1000 for the seeded state (quiz-derived percent).
    await expect(page.getByText("1000")).toBeVisible();
    await expect(page.getByText("Keep learning to earn more XP!")).toBeVisible();
  });

  test("Course Lessons carries the reference footer count", async ({ page }) => {
    await expect(page.getByText("5 / 6 lessons · 80% complete")).toBeVisible();
  });
});

test.describe("the Daily Challenge modal (the reference's interactive card)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens from the tile, answers, and shows the result banner", async ({ page }) => {
    // The tile fetches the challenge client-side; wait for it to load.
    const tile = page.getByRole("button", { name: /Daily challenge/i });
    await expect(tile).toBeEnabled({ timeout: 20_000 });
    await tile.click();

    const dialog = page.locator("div.rounded-\\[24px\\]");
    await expect(dialog).toBeVisible();
    await expect(page.getByText("Submit Answer")).toBeVisible();

    // Pick the first option, submit, and land on one of the two banners.
    await page.locator("div.rounded-\\[24px\\] button.rounded-\\[12px\\]", { hasText: /.+/ }).first().click();
    await page.getByRole("button", { name: "Submit Answer" }).click();
    await expect(page.getByText(/Correct! Well done!|Not quite — the correct answer is highlighted/)).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });
});

test.describe("the Hub lesson-quiz flow (the gO/Im architecture)", () => {
  test("the lesson view ships the reference's tan 2-column options + Next Question button", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Core Concept").first()).toBeVisible({ timeout: 30_000 });

    // The subject rides in the h2 on level 1; the counter shows 0/8.
    await expect(page.getByText(/0\/8 correct/).first()).toBeVisible();
    // Options are tan rounded-[14px] grid buttons.
    const option = page.locator("button.rounded-\\[14px\\]", { hasText: /.+/ }).first();
    await expect(option).toHaveCSS("background-color", "rgb(225, 200, 185)");
    // The submit button reads "Next Question" (gray until a pick).
    const next = page.getByRole("button", { name: "Next Question" });
    await expect(next).toBeDisabled();
    await expect(next).toHaveCSS("background-color", "rgb(224, 224, 224)");
  });

  test("submitting an answer always progresses — auto-advance or the retry modal", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Core Concept").first()).toBeVisible({ timeout: 30_000 });

    // Submit one answer. Correct → reveal (1s) → advance (800 ms); wrong →
    // reveal → the in-pane retry modal. Either branch must land somewhere new.
    const option = page.locator("button.rounded-\\[14px\\]", { hasText: /.+/ }).first();
    await option.click();
    await page.getByRole("button", { name: "Next Question" }).click();

    const settles = page
      .waitForFunction(() => {
        const text = document.body.innerText;
        return (
          text.includes("Not quite!") || // retry modal
          text.includes("Would you like to retry this question later?") ||
          /1\/8 correct/.test(text) || // auto-advanced (1 correct)
          text.includes("Level Up!") ||
          text.includes("complete!")
        );
      }, undefined, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    expect(await settles).toBe(true);

    // If the retry modal opened, "Skip it" must return to the quiz flow.
    const skip = page.getByRole("button", { name: "Skip it" });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await expect(page.getByRole("button", { name: "Next Question" })).toBeVisible({ timeout: 10_000 });
    }
  });

  test("the Lesson Progress card counts the session questions (answered + 1)", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Core Concept").first()).toBeVisible({ timeout: 30_000 });
    // A fresh session starts at 1/8 (the reference's label semantics).
    await expect(page.getByText("1/8", { exact: true })).toBeVisible();
  });
});
