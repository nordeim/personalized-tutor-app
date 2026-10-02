import { expect, test } from "@playwright/test";

// Session-2 parity pins (docs/remediation-plan-session-2.md): the reference's
// Study Streak + Total XP cards, the interactive Daily Challenge modal, and
// the ported lesson-quiz flow (auto-advance on correct, retry modal on wrong).
// Contexts arrive AUTHENTICATED (storageState) with the seeded Economics
// course (quizScore 4, 4/6 lessons → 67%).

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
    // 67*10 + 4*50 = 870 for the seeded state.
    await expect(page.getByText("870")).toBeVisible();
    await expect(page.getByText("Keep learning to earn more XP!")).toBeVisible();
  });

  test("Course Lessons carries the reference footer count", async ({ page }) => {
    await expect(page.getByText("4 / 6 lessons · 67% complete")).toBeVisible();
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

test.describe("the Hub lesson-quiz flow (auto-advance + retry modal)", () => {
  test("submitting an answer always progresses — auto-advance or the retry modal", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Core Concept").first()).toBeVisible({ timeout: 30_000 });

    // Submit one answer. Correct → auto-advance after 800 ms; wrong → the
    // in-pane retry modal. Either branch must land somewhere new.
    const firstQuestion = page.getByText(/^Question 1$/).first();
    await expect(firstQuestion).toBeVisible();

    const option = page
      .locator("div.rounded-\\[16px\\] button.rounded-xl", { hasText: /.+/ })
      .first();
    await option.click();
    await page.getByRole("button", { name: "Submit Answer" }).click();

    // The reveal shows one of the two feedback lines, then the flow continues.
    await expect(
      page.getByText(/Nailed it!|Not quite — the highlighted answer is correct/).first()
    ).toBeVisible();

    const settles = page
      .waitForFunction(() => {
        const text = document.body.innerText;
        return (
          text.includes("Not quite!") || // retry modal
          text.includes("Would you like to retry this question later?") ||
          /^Question 2$/m.test(text) || // auto-advanced
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
      await expect(page.getByText(/Question \d/).first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
