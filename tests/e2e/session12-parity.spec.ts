import { expect, test } from "@playwright/test";

// SESSION-12 parity pins (desktop 1440×900, authenticated storageState).
//
// Covered:
//   S12-F2 — the dashboard confetti decode (the c_ port): the 80-particle
//            streak burst fires on the DASHBOARD (min(quizScore,7) crossing
//            exactly 3), NOT during the diagnostic quiz (E3 has zero
//            confetti). Driven via a same-route course switch — the
//            mounted CourseDashboard's streakDays prop changes 2→3.
//   S12-F3 — the Enter The Hub CTA's trailing icon is ChevronRight
//            (`m9 18 6-6-6-6`, lucide default sw 2) — not ArrowRight.
//   S12-F1 — the material gate: material-mode courses drive the quiz flow
//            (the dead `=== "custom"` gate blocked them entirely).
//   S12-F8 — the submit route REJECTS malformed payloads (422).
//
// The quiz generation rides the AI seam (the fallback guarantees questions
// — 60s timeouts per the AI-assertion convention).

test.use({ viewport: { width: 1440, height: 900 } });

/**
 * Generate a quiz-incomplete course AS THE SEEDED DEMO USER (the page
 * context is already authenticated via storageState — zero login/register
 * calls, keeping the auth rate-limit budget at the suite's baseline). The
 * enrollments are deleted in afterEach so the demo user's state stays
 * [Economics] for the later specs.
 */
async function generateCourse(
  page: import("@playwright/test").Page,
  topic: string,
): Promise<string> {
  const gen = await page.request.post("/api/courses/generate", {
    data: { topic, mode: "topic" },
  });
  expect(gen.ok()).toBeTruthy();
  const json = (await gen.json()) as { ok: boolean; data: { courseId: string } };
  expect(json.ok).toBeTruthy();
  return json.data.courseId;
}

const GENERATED = ["Astronomy", "Botany"];

test.afterEach(async ({ page }) => {
  // Cleanup: remove the generated enrollments AND restore the demo
  // student's state (the generate route repoints current_subject at the
  // new topic, which would break every later spec that pins the seeded
  // "Economics" surfaces).
  const res = await page.request.get("/api/courses");
  if (res.ok()) {
    const courses = (await res.json()) as { ok: boolean; data: { id: string; courseName: string }[] };
    if (courses.ok) {
      for (const c of courses.data) {
        if (GENERATED.includes(c.courseName)) {
          await page.request.delete(`/api/courses/${c.id}`);
        }
      }
    }
  }
  await page.request.put("/api/student", {
    data: { currentSubject: "Economics", quizCompleted: true },
  });
});

test.describe("the dashboard confetti decode (S12-F2 — the c_ port)", () => {
  test("the streak burst fires when the active course's score crosses 3 (refresh-driven)", async ({ page }) => {
    // The live's c_ fires on REACTIVE entity updates while the dashboard is
    // mounted (Base44's realtime store re-renders G5's props in place). The
    // clone's architectural equivalent of that in-place update is
    // router.refresh() re-fetching the snapshot (client state preserved,
    // props updated — the App Router's same-route course-switch REMOUNTS
    // via a new Router Cache entry, so it cannot fire there; a documented
    // ADR-001 divergence). Drive: mount at score 2 → submit score 3
    // API-level → trigger the UI's refresh (the m_ rename flow's
    // onStudentUpdated → router.refresh()) → streakDays 2→3 fires.
    const astronomy = await generateCourse(page, "Astronomy");
    const submit = await page.request.post("/api/quiz/submit", {
      data: { courseId: astronomy, answers: [1, 1, 1, 1, 1], total: 5, score: 2 },
    });
    expect(submit.ok()).toBeTruthy();

    // Restore the seeded subject so the surfaces stay deterministic.
    await page.request.put("/api/student", {
      data: { currentSubject: "Economics", quizCompleted: true },
    });

    // Mount: the streak ref initializes at 2 — no confetti yet.
    await page.goto(`/?course=${astronomy}`);
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(600);
    expect(await page.locator("canvas").count()).toBe(0);

    // The score updates on the server while the dashboard stays mounted…
    const retake = await page.request.post("/api/quiz/submit", {
      data: { courseId: astronomy, answers: [1, 1, 1, 1, 1], total: 5, score: 3 },
    });
    expect(retake.ok()).toBeTruthy();

    // …then the UI's own refresh path (the m_ Update Preferences save →
    // onStudentUpdated → router.refresh()) re-renders the snapshot in
    // place: streakDays 2→3 → the 80-particle burst.
    await page.getByRole("button", { name: /Demo Learner/ }).click();
    await page.getByRole("button", { name: /Update Preferences/ }).click();
    await page.locator("#pref-name-input").fill("Demo Learner");
    await page.getByRole("button", { name: /^Save Changes$/ }).click();
    await page.waitForTimeout(1500);

    // The burst: canvas-confetti appends a fixed full-screen canvas.
    const canvases = await page.locator("canvas").count();
    expect(canvases).toBeGreaterThan(0);
  });
});

test.describe("the Enter The Hub trailing icon (S12-F3)", () => {
  test("the CTA's last svg is ChevronRight (the live's tr), not ArrowRight", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Course Progress")).toBeVisible({ timeout: 15_000 });

    const cta = page.getByRole("link", { name: /Enter The Hub/ });
    await expect(cta).toBeVisible();
    const icons = await cta.locator("svg").evaluateAll((svgs) =>
      svgs.map((s) => ({
        paths: Array.from(s.querySelectorAll("path")).map((p) => p.getAttribute("d")),
        sw: s.getAttribute("stroke-width"),
        cls: s.getAttribute("class"),
      })),
    );
    // Leading: GraduationCap; trailing: ChevronRight `m9 18 6-6-6-6` at
    // lucide's DEFAULT strokeWidth 2 (the ArrowRight paths `M5 12h14` were
    // a session-1 invention).
    expect(icons.length).toBe(2);
    expect(icons[1].paths).toEqual(["m9 18 6-6-6-6"]);
    expect(icons[1].sw).toBe("2");
    expect(icons[1].cls).toContain("chevron-right");
    expect(JSON.stringify(icons)).not.toContain("M5 12h14");
  });
});

test.describe("the material-course gate (S12-F1)", () => {
  test("a material-mode course drives the quiz flow (the dead custom gate)", async ({ page }) => {
    // The material gate: paste-text courses carry contentText, and the
    // quiz/generate + quiz/submit routes now feed it to the prompts (the
    // session-11 `=== "custom"` gate was unreachable — no writer emits
    // "custom"). Surface-level pin: the quiz renders for the material
    // course (the prompt path is unit-pinned via enrollmentMaterial).
    const gen = await page.request.post("/api/courses/generate", {
      data: {
        mode: "material",
        courseName: "Cell Biology",
        contentText:
          "The cell membrane is a phospholipid bilayer. Mitochondria produce ATP through oxidative phosphorylation. Ribosomes synthesize proteins from mRNA transcripts.",
      },
    });
    expect(gen.ok()).toBeTruthy();
    const json = (await gen.json()) as { ok: boolean; data: { courseId: string } };
    expect(json.ok).toBeTruthy();
    GENERATED.push("Cell Biology");

    await page.goto(`/quiz?course=${json.data.courseId}`);
    await expect(page.getByText("A. ").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Cell Biology ·")).toBeVisible();
    await expect(page.getByText("Knowledge Assessment")).toBeVisible();
  });
});

test.describe("the submit-route validation (S12-F8)", () => {
  test("rejects a malformed score and out-of-range answers with 422", async ({ page }) => {
    const courseId = await generateCourse(page, "Astronomy");

    const badScore = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [0, 0, 0, 0, 0], total: 5, score: 99 },
    });
    expect(badScore.status()).toBe(422);

    const badAnswers = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [7, 0, 0], total: 5, score: 1 },
    });
    expect(badAnswers.status()).toBe(422);

    const badType = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [0, 0, 0, 0, 0], total: 5, score: "3" },
    });
    expect(badType.status()).toBe(422);

    // A MISSING score still degrades to 0 (the degraded-client path the
    // session-11 spec pins) and a well-formed payload still succeeds.
    const missing = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [0, 0, 0, 0, 0], total: 5 },
    });
    expect(missing.ok()).toBeTruthy();
    const valid = await page.request.post("/api/quiz/submit", {
      data: { courseId, answers: [1, 1, 1, 0, 0], total: 5, score: 3 },
    });
    expect(valid.ok()).toBeTruthy();
  });
});
