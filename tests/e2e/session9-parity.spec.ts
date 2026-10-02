import { expect, test } from "@playwright/test";

// SESSION-9 parity pins (desktop 1440×900, authenticated storageState).
//
// Covered:
//   S9-F4 — the LEVEL-2/3 lesson-view surfaces (never e2e-pinned before):
//            the tan Real-World Scenario context card at ?lesson=2, the
//            lilac Final Boss Challenge card at ?lesson=4, and the h2 =
//            the GENERATED title on levels 2/3 (not the subject — the
//            live's yO/xO decode: h2 = meta.title).
//   S9-F1 — the Lesson Progress card label rides the UNCLAMPED formula
//            (`{answered + 1}/8` — the live renders "9/8" at completion;
//            the fresh-lesson "1/8" is the formula's observable seam).
//
// The hub's ?lesson= param drives the initial lesson directly (the sidebar
// lock only gates row clicks), so the level-2/3 surfaces are reachable
// without driving two full 8-correct lessons. The logged-out S9-F2/S9-F5
// pins live in session9-public.spec.ts (the storageState scoping rule).

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the level-2 lesson view (S9-F4 — ?lesson=2)", () => {
  test("renders the tan Real-World Scenario card and the generated-title h2", async ({ page }) => {
    // The seeded demo user's course (the no-param default enrollment) at
    // lesson index 2 = stage 1 = LEVEL 2. The lesson content is AI-generated
    // (the fallback guarantees termination; 45s keeps the AI path in budget).
    await page.goto("/hub?lesson=2");
    await expect(page.getByText("Lesson 3 · Now").first()).toBeVisible();

    // The level-2 h2 is the GENERATED title (the live's yO renders
    // meta.title), never the student's subject. The fallback computes
    // "{subject} In Practice"; any AI title is a 3-5 word level title.
    const h2 = page.getByRole("heading", { level: 2 }).first();
    await expect(h2).toBeVisible({ timeout: 45_000 });
    const h2Text = await h2.textContent();
    expect(h2Text, "the level-2 h2 is a generated title, not the subject").not.toBe("Economics");
    expect(h2Text?.trim().length ?? 0).toBeGreaterThan(0);

    // The level-1 yellow Core Concept card NEVER renders on level 2.
    await expect(page.getByText("Core Concept").first()).toHaveCount(0);

    // The tan Real-World Scenario card (the live's yO: renders when the
    // generated scenario is non-empty — the fallback and the prompted AI
    // both provide it on level 2).
    const scenarioCard = page
      .locator("div.rounded-\\[16px\\]")
      .filter({ hasText: "Real-World Scenario" })
      .first();
    await expect(scenarioCard).toBeVisible({ timeout: 45_000 });
    await expect(scenarioCard).toHaveCSS("background-color", "rgb(225, 200, 185)");
  });
});

test.describe("the level-3 lesson view (S9-F4 — ?lesson=4)", () => {
  test("renders the lilac Final Boss Challenge card", async ({ page }) => {
    await page.goto("/hub?lesson=4");
    await expect(page.getByText("Lesson 5 · Now").first()).toBeVisible();

    const h2 = page.getByRole("heading", { level: 2 }).first();
    await expect(h2).toBeVisible({ timeout: 45_000 });
    const h2Text = await h2.textContent();
    expect(h2Text, "the level-3 h2 is a generated title, not the subject").not.toBe("Economics");

    // The lilac Final Boss Challenge card (the live's xO: renders when the
    // generated challenge is non-empty — the fallback and the prompted AI
    // both provide it on level 3).
    const bossCard = page
      .locator("div.rounded-\\[16px\\]")
      .filter({ hasText: "Final Boss Challenge" })
      .first();
    await expect(bossCard).toBeVisible({ timeout: 45_000 });
    await expect(bossCard).toHaveCSS("background-color", "rgb(210, 192, 249)");
    // The tan scenario card does not render on level 3.
    await expect(page.getByText("Real-World Scenario").first()).toHaveCount(0);
  });
});

test.describe("the Lesson Progress label (S9-F1)", () => {
  test("a fresh lesson counts answered + 1 (the unclamped formula's seam)", async ({ page }) => {
    await page.goto("/hub?lesson=2");
    await expect(page.getByText("Lesson 3 · Now").first()).toBeVisible();
    // 0 answered → "1/8" (the live's qP label formula; the over-8 "9/8"
    // terminal value is unit-pinned in tests/domain-session9.test.ts).
    await expect(page.getByText("1/8", { exact: true }).first()).toBeVisible();
  });
});
