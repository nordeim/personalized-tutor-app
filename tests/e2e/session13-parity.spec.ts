import { expect, test } from "@playwright/test";

import {
  cleanupGeneratedEnrollments,
  generateCourse,
  restoreDemoStudent,
  submitScore,
} from "./helpers";

// SESSION-13 parity pins (desktop 1440×900, authenticated storageState).
//
// Covered:
//   S13-F2 — the same-route course switch updates the dashboard content
//             (the frozen viewCourseId state rendered STALE stats — the
//             URL changed, the dashboard didn't; activeCourse now derives
//             from the currentCourseId PROP). This test FAILS on the
//             pre-fix code (empirically established in the session-13
//             probe: the stats stayed at the mount-time course until a
//             full reload).
//   S13-F2 — the switch-driven 80-particle streak burst: mounting at a
//             streak-2 course and switching to a streak-3 course crosses
//             EXACTLY 3 → the c_ port fires on its natural surface (the
//             live's most plausible real trigger — unblocked by the
//             course-switch fix).
//   S13-F6 — the 90-particle mastery-label burst: switching from a
//             20% (Apprentice) course to an 80% (Expert) course changes
//             the tier WITHOUT crossing a streak boundary (1 → 4) → the
//             only possible firing effect is the label change — its
//             first behavioral pin.
//   S14-F6 — the streak burst ISOLATED: the 2→3 drive above crosses both
//             the exact-3 boundary AND the Learner→Scholar tier change,
//             so its canvas could come from either preset (one shared
//             canvas-confetti surface). Scores 6/7 (total 7) clamp the
//             percent to 100 → Master→Master (no label change) while the
//             streak 6→7 crosses EXACTLY 7 — the 80-particle burst is the
//             ONLY possible firing effect.
//   S13-F4 — the submit-route validation symmetry: a present-but-non-
//             array answers and a non-integer/invalid total → 422.
//
// The quiz generation rides the AI seam (the fallback guarantees
// completion — 60s timeouts per the AI-assertion convention, applied to
// the request-level calls too: Playwright's request default is 30s while
// the AI budget is 45s).

test.use({ viewport: { width: 1440, height: 900 } });

const GENERATED = ["Astronomy", "Botany", "Chemistry", "Drama"];

test.afterEach(async ({ page }) => {
  // Cleanup per the session-11/12 pattern (the S15-F2 helpers now carry
  // the shapes): remove the generated enrollments AND restore the seeded
  // student state (the generate route repoints current_subject at the
  // new topic).
  await cleanupGeneratedEnrollments(page, GENERATED);
  await restoreDemoStudent(page);
});

/** The visible stats (the regexes ride the textContent — the same
 * discriminators the session-13 probe used). */
async function stats(page: import("@playwright/test").Page) {
  const t = (await page.textContent("body")) ?? "";
  return {
    streak: t.match(/Study Streak[\s\S]{0,80}?(\d+)/)?.[1] ?? "?",
    xp: t.match(/Total XP[\s\S]{0,60}?([\d,]+)/)?.[1] ?? "?",
  };
}

test.describe("the same-route course switch (S13-F2 — the frozen-state fix)", () => {
  test("the dashboard content updates when the pill switches courses", async ({ page }) => {
    const astronomy = await generateCourse(page, "Astronomy");
    const botany = await generateCourse(page, "Botany");
    await submitScore(page, astronomy, 2); // streak 2, XP 500
    await submitScore(page, botany, 3); // streak 3, XP 750
    // The pill shows the student's currentSubject; point it at Astronomy
    // so the dropdown lists the OTHER courses (Botany, Economics).
    await page.request.put("/api/student", {
      data: { currentSubject: "Astronomy", quizCompleted: true },
    });

    // Mount at Astronomy: streak 2 / XP 500.
    await page.goto(`/?course=${astronomy}`);
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(600);
    expect(await stats(page)).toEqual({ streak: "2", xp: "500" });

    // Same-route switch via the CoursePill row (router.push) — pre-fix
    // this left the dashboard rendering Astronomy's stats.
    await page.getByRole("button", { name: "Astronomy" }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("menu").getByText("Botany", { exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`course=${botany}`));

    // The content swap: the KEYED CourseDashboard remounts with Botany's
    // data (streak 3 / XP 750) while the shell stays mounted.
    await expect
      .poll(async () => (await stats(page)).streak, { timeout: 10_000 })
      .toBe("3");
    expect((await stats(page)).xp).toBe("750");
  });

  test("the switch-driven streak burst fires when the streak crosses EXACTLY 3", async ({ page }) => {
    const astronomy = await generateCourse(page, "Astronomy");
    const botany = await generateCourse(page, "Botany");
    await submitScore(page, astronomy, 2); // streak 2 — the ref initializes here
    await submitScore(page, botany, 3); // streak 3 — the switch crossing
    await page.request.put("/api/student", {
      data: { currentSubject: "Astronomy", quizCompleted: true },
    });

    // Mount at the streak-2 course: first observation initializes the ref
    // WITHOUT firing.
    await page.goto(`/?course=${astronomy}`);
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => page.locator("canvas").count(), { timeout: 2_000 })
      .toBe(0);

    // Switch to the streak-3 course: streakDays 2→3 crosses exactly 3 →
    // the 80-particle burst (the live's c_ surface, unblocked by S13-F2).
    await page.getByRole("button", { name: "Astronomy" }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("menu").getByText("Botany", { exact: true }).first().click();
    await expect
      .poll(async () => page.locator("canvas").count(), { timeout: 8_000 })
      .toBeGreaterThan(0);
  });

  test("the mastery-label burst fires on a tier change with no streak crossing (S13-F6)", async ({ page }) => {
    // Chemistry score 1 → 20% → Apprentice (streak 1); Drama score 4 →
    // 80% → Expert (streak 4). Switching Chemistry → Drama changes the
    // label (Apprentice → Expert) WITHOUT a streak fire (1→4 is not the
    // exact-3/7 crossing) — the canvas can only come from the label
    // effect: its first behavioral pin.
    const chemistry = await generateCourse(page, "Chemistry");
    const drama = await generateCourse(page, "Drama");
    await submitScore(page, chemistry, 1);
    await submitScore(page, drama, 4);
    await page.request.put("/api/student", {
      data: { currentSubject: "Chemistry", quizCompleted: true },
    });

    await page.goto(`/?course=${chemistry}`);
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => page.locator("canvas").count(), { timeout: 2_000 })
      .toBe(0);

    await page.getByRole("button", { name: "Chemistry" }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("menu").getByText("Drama", { exact: true }).first().click();
    await expect
      .poll(async () => page.locator("canvas").count(), { timeout: 8_000 })
      .toBeGreaterThan(0);
  });

  test("the streak burst fires ISOLATED — the exact-7 crossing with NO label change (S14-F6)", async ({ page }) => {
    // The 2→3 drive above crosses BOTH the exact-3 streak boundary AND the
    // Learner(40%)→Scholar(60%) tier change — either effect can produce the
    // canvas (canvas-confetti renders onto ONE shared global canvas, so a
    // count cannot discriminate). This drive ISOLATES the streak burst:
    // scores 6 and 7 (total 7) — quizProgressPercent clamps 120/140 → 100
    // → tier Master→Master (the label effect CANNOT fire) while
    // studyStreakDays 6→7 crosses EXACTLY 7 → confettiAt(6,7) fires. The
    // only possible firing effect is the 80-particle streak burst — the
    // preset's first confound-free behavioral pin.
    const astronomy = await generateCourse(page, "Astronomy");
    const botany = await generateCourse(page, "Botany");
    await submitScore(page, astronomy, 6, 7); // streak 6, pct 100 → Master
    await submitScore(page, botany, 7, 7); // streak 7 — the exact-7 crossing
    await page.request.put("/api/student", {
      data: { currentSubject: "Astronomy", quizCompleted: true },
    });

    // Mount at the streak-6 course: first observation initializes BOTH refs
    // WITHOUT firing (streak 6 is not a boundary arrival; tier Master).
    await page.goto(`/?course=${astronomy}`);
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () => page.locator("canvas").count(), { timeout: 2_000 })
      .toBe(0);

    // Switch to the streak-7 course: 6→7 crosses exactly 7 → the streak
    // burst fires; the label stays Master→Master → the label burst cannot.
    await page.getByRole("button", { name: "Astronomy" }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("menu").getByText("Botany", { exact: true }).first().click();
    await expect
      .poll(async () => page.locator("canvas").count(), { timeout: 8_000 })
      .toBeGreaterThan(0);
  });
});

test.describe("the submit-route validation symmetry (S13-F4)", () => {
  test("rejects a non-array answers and an invalid total with 422", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");

    const badAnswers = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: "garbage", total: 5, score: 1 },
      timeout: 60_000,
    });
    expect(badAnswers.status()).toBe(422);

    const stringTotal = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [0, 0, 0, 0, 0], total: "5", score: 1 },
      timeout: 60_000,
    });
    expect(stringTotal.status()).toBe(422);

    const fractionalTotal = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [0, 0, 0, 0, 0], total: 0.5, score: 1 },
      timeout: 60_000,
    });
    expect(fractionalTotal.status()).toBe(422);

    // The degraded paths still succeed: a MISSING answers (→ []) and a
    // MISSING total (→ answers.length || 5).
    const missingAnswers = await page.request.post("/api/quiz/submit", {
      data: { courseId, total: 5, score: 2 },
      timeout: 60_000,
    });
    expect(missingAnswers.ok()).toBeTruthy();
    const missingTotal = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [1, 1, 1, 1, 1], score: 2 },
      timeout: 60_000,
    });
    expect(missingTotal.ok()).toBeTruthy();
  });
});
