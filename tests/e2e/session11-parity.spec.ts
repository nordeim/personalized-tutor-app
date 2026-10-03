import { expect, test } from "@playwright/test";

import {
  cleanupGeneratedEnrollments,
  generateCourse,
  restoreDemoStudent,
} from "./helpers";

// SESSION-11 parity pins (desktop 1440×900, authenticated storageState).
//
// Covered:
//   S11-F1 — the diagnostic-quiz surface (the E3 port): FIVE questions, the
//            Ha-with-children header ("{subject} · Knowledge Assessment" +
//            the X close — REPLACING the desktop user menu), the star
//            progress row (#4A4A4A track + #FFFD73 fill + the 42px star),
//            the lilac number tile, the TAN options with inline "A."
//            prefixes (no letter circles), the Confirm → Next Question /
//            Submit Assessment buttons, the dot strip, the "Skip quiz →"
//            pill. (The prior quiz-app was a session-1 invention.)
//   S11-F2 — the score is the CLIENT-computed correct count (all-wrong
//            answers → 0%, not the answered-count "perfect" score).
//   S11-F3 — the / route model: an enrollment EXISTS → the course dashboard
//            renders (0% when quiz-incomplete — where the skip path lands).
//   S11-F5/F6 — the Skip quiz and X close paths route to /?course={id}.
//
// The quiz generation rides the AI seam (the fallback guarantees questions
// — 60s timeouts per the AI-assertion convention).

test.use({ viewport: { width: 1440, height: 900 } });

test.afterEach(async ({ page }) => {
  // Cleanup (the S15-F2 helpers now carry the shapes): remove the generated
  // enrollments AND restore the demo student's current_subject (the
  // generate route points it at the new topic — "Astronomy" — which would
  // break every later spec that pins the seeded "Economics" surfaces) so
  // the demo state returns to baseline.
  await cleanupGeneratedEnrollments(page, ["Astronomy"]);
  await restoreDemoStudent(page);
});

test.describe("the diagnostic-quiz surface (S11-F1 — the E3 port)", () => {
  test("renders the live's structure: star progress, lilac tile, tan options, 5 questions", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");
    await page.goto(`/quiz?course=${courseId}`);
    await expect(page.getByText("A. ").first()).toBeVisible({ timeout: 60_000 });

    // (a) the header children: subject · Knowledge Assessment + the X
    // close REPLACING the desktop user menu (no name pill on this surface).
    await expect(page.getByText("Astronomy ·")).toBeVisible();
    await expect(page.getByText("Knowledge Assessment")).toBeVisible();
    await expect(page.getByRole("button", { name: "Close assessment" })).toBeVisible();
    // S12-F6: pin the REPLACEMENT structurally — the desktop cluster
    // (div.hidden.md:flex) contains EXACTLY ONE button when headerChildren
    // is present (the X close); the CoursePill + UserMenu triggers are gone
    // (the prior /Open menu|Account menu/ regex matched nothing in either
    // render, and the aria-haspopup locator caught the CSS-hidden mobile
    // hamburger). The accessible-name pin below covers the user pill.
    await expect(page.locator("header div.hidden.md\\:flex button")).toHaveCount(1);
    await expect(page.getByRole("button", { name: /Demo Learner/ })).toHaveCount(0);

    // (b) the star progress row: the #4A4A4A track + the 42px star image.
    const track = page.locator("div.h-1.rounded-\\[9999px\\]").first();
    await expect(track).toHaveCSS("background-color", "rgb(74, 74, 74)");
    const star = page.locator("img[src='/quiz-star.svg']");
    await expect(star).toBeVisible();
    const starBox = await star.boundingBox();
    expect(Math.abs((starBox?.width ?? 0) - 42)).toBeLessThan(1);
    expect(Math.abs((starBox?.height ?? 0) - 42)).toBeLessThan(1);

    // (c) the counter reads 1/5 (the FIVE-question pin — the live asks
    // exactly 5; the clone's 7-question quiz was a session-1 invention).
    await expect(page.getByText("1/5", { exact: true })).toBeVisible();

    // (d) the lilac number tile (w-9 = 36px, #D2C0F9).
    const tile = page.locator("div.rounded-\\[10px\\]").first();
    await expect(tile).toHaveCSS("background-color", "rgb(210, 192, 249)");
    expect((await tile.boundingBox())?.width).toBe(36);

    // (e) the TAN options with inline A./B. prefixes — no letter circles
    // (the session-1 white buttons + circle chips were inventions).
    const option = page.locator("button", { hasText: /^A\./ }).first();
    await expect(option).toHaveCSS("background-color", "rgb(225, 200, 185)");
    await expect(option).toHaveCSS("border-radius", "14px");
    await expect(page.locator("span.rounded-\\[9999px\\]").filter({ hasText: /^[A-D]$/ })).toHaveCount(0);

    // (f) the dot strip: 5 dots, the active one 24px.
    const dots = page.locator("div.h-1\\.5");
    await expect(dots).toHaveCount(5);
    await expect(dots.first()).toHaveCSS("width", "24px");

    // (g) the Confirm button starts disabled (gray #E0E0E0).
    const confirmBtn = page.getByRole("button", { name: /^Confirm$/, exact: true });
    await expect(confirmBtn).toBeDisabled();
    await expect(confirmBtn).toHaveCSS("background-color", "rgb(224, 224, 224)");

    // (h) the Skip quiz pill (the wO onSkip wiring).
    await expect(page.getByRole("button", { name: /Skip quiz/ })).toBeVisible();
  });

  test("the reveal paints the live's colors: correct #BCFCAF, wrong-pick #FFD0D0, others 40%", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");
    await page.goto(`/quiz?course=${courseId}`);
    await expect(page.getByText("A. ").first()).toBeVisible({ timeout: 60_000 });

    // Pick option A → Confirm → the reveal. Wait for the 200ms color
    // transition to settle before reading the computed styles (an early
    // read catches the interpolation midpoint).
    await page.locator("button", { hasText: /^A\./ }).first().click();
    await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
    await expect(page.getByRole("button", { name: /Next Question/ })).toBeVisible();
    await page.waitForTimeout(450);

    const options = page.locator("button").filter({ hasText: /^[A-D]\./ });
    const states = await options.evaluateAll((els) =>
      els.map((el) => ({
        prefix: el.textContent?.trim().slice(0, 2),
        bg: getComputedStyle(el).backgroundColor,
        op: getComputedStyle(el).opacity,
        icon: el.querySelector("svg")?.getAttribute("class")?.split(" ")[1] ?? null,
      })),
    );
    // The picked-wrong (A) goes #FFD0D0 + circle-x; the correct option
    // #BCFCAF + circle-check-big; the others stay tan at 0.4.
    const picked = states.find((s) => s.prefix === "A.");
    expect(picked?.bg).toMatch(/rgb\(255, 208, 208\)|rgb\(188, 252, 175\)/);
    const correct = states.find((s) => s.bg === "rgb(188, 252, 175)");
    expect(correct, "exactly one option reveals green").toBeTruthy();
    expect(correct?.icon).toContain("circle-check-big");
    const wrong = states.find((s) => s.bg === "rgb(255, 208, 208)");
    if (wrong && wrong.prefix === "A.") expect(wrong.icon).toContain("circle-x");
    for (const s of states) {
      if (s.bg === "rgb(225, 200, 185)") expect(s.op).toBe("0.4");
    }
  });
});

test.describe("the quiz flow's terminal paths (S11-F2/F3/F5/F6)", () => {
  test("the skip path lands on the 0% course dashboard (the $P model)", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");
    await page.goto(`/quiz?course=${courseId}`);
    await expect(page.getByText("A. ").first()).toBeVisible({ timeout: 60_000 });

    // Skip quiz → POST /api/quiz/skip → /?course={id} with the
    // quiz-incomplete enrollment rendering the COURSE dashboard at 0%
    // (the S11-F3 pin — the old model re-rendered the onboarding).
    await page.getByRole("button", { name: /Skip quiz/ }).click();
    await page.waitForURL(new RegExp(`/\\?course=${courseId}`), { timeout: 30_000 });
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("0/6 lessons completed")).toBeVisible();
  });

  test("the X close path routes back to the course dashboard", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");
    await page.goto(`/quiz?course=${courseId}`);
    await expect(page.getByText("A. ").first()).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: "Close assessment" }).click();
    await page.waitForURL(new RegExp(`/\\?course=${courseId}`), { timeout: 15_000 });
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
  });

  test("the submitted score is the client-computed correct count (S11-F2)", async ({ page }) => {
    // Deterministic API-level pin: the route stores the PAYLOAD's score
    // (the live's client-computed correct count) — never re-derives it from
    // the answered count (the session-1 derivation scored every ANSWERED
    // question correct, so a fully-answered quiz always scored "perfect").
    // The client-side computation itself is unit-pinned (diagnosticScore).
    const courseId = await generateCourse(page, "Astronomy");
    const submit = await page.request.post("/api/quiz/submit", {
      data: {
        courseId,
        // Five answered picks, ZERO correct — the answered-count bug would
        // store 5 (→ 100%); the correct-count semantics store 0 (→ 0%).
        answers: [0, 0, 0, 0, 0],
        total: 5,
        score: 0,
      },
      timeout: 60_000,
    });
    expect(submit.ok()).toBeTruthy();
    const json = (await submit.json()) as { ok: boolean; data: { score: number; redirectTo: string } };
    expect(json.ok).toBeTruthy();
    expect(json.data.score).toBe(0);

    // The dashboard derives the reference's quiz-percent math on the
    // stored score: 0/5 → 0% (NOT 100%).
    await page.goto(`/?course=${courseId}`);
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("0/6 lessons completed")).toBeVisible();

    // The retake round-trip: a second submission with score 3 → 60%
    // (the /5 divisor provably matches the 5-question quiz).
    const retake = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [1, 1, 1, 0, 0], total: 5, score: 3 },
      timeout: 60_000,
    });
    expect(retake.ok()).toBeTruthy();
    await page.goto(`/?course=${courseId}`);
    await expect(page.getByText("60%", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("the final question swaps the action to Submit Assessment and lands on the dashboard", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");
    await page.goto(`/quiz?course=${courseId}`);
    await expect(page.getByText("A. ").first()).toBeVisible({ timeout: 60_000 });

    // Drive all five questions (pick → Confirm → advance). The action
    // reads "Next Question" through Q4 and "Submit Assessment" on Q5 —
    // then the "Analyzing your results…" overlay → /?course={id}.
    for (let i = 0; i < 5; i++) {
      await page.locator("button", { hasText: /^A\./ }).first().click();
      await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
      const action = page.getByRole("button", { name: /Next Question|Submit Assessment/ });
      await expect(action).toBeVisible();
      if (i < 4) {
        await expect(action).toHaveText(/Next Question/);
      } else {
        await expect(action).toHaveText(/Submit Assessment/);
      }
      await action.click();
      await page.waitForTimeout(300);
    }

    await page.waitForURL(new RegExp(`/\\?course=${courseId}`), { timeout: 90_000 });
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
  });
});
