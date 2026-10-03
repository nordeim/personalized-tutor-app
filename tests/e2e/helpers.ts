import { expect } from "@playwright/test";

// The seeded demo account (prisma/seed.ts — the README's documented pair;
// the storageState setup signs in once per run with these).
export const DEMO_EMAIL = "demo@thinkerwell.app";
export const DEMO_PASSWORD = "Demo1234!";

/**
 * Session note for spec authors: the main Playwright project starts every
 * test ALREADY authenticated — the "setup" project signs the demo user in
 * once and playwright.config.ts injects the saved storageState. Specs that
 * need the logged-out surface (tests/e2e/auth.spec.ts) opt out with an
 * empty storageState at the file level.
 *
 * The auth endpoints are rate-limited (10 attempts/IP/15 min) — keep the
 * TOTAL number of real login attempts per run well under that budget.
 */

// SESSION-15 (S15-F2) — the shared e2e course fixtures. The same
// generateCourse/submitScore/cleanup block was hand-rolled three times
// (session11's `freshCourse` — the one that had drifted out of the
// trap-39 timeout convention, session12, session13); ONE module now
// carries the canonical shapes. Every AI-backed request here rides the
// 60s timeout (trap 39 — unit-enforced by tests/e2e-conventions.test.ts,
// which also scans this file).
//
// NOT for the custom-payload calls: the 422-family submits and the
// material-mode generate carry documented test meaning in their exact
// payloads — those stay inline in their specs.

/** Generate a quiz-incomplete topic-mode course AS THE AUTHENTICATED
 * USER (the page context already carries the storageState — zero
 * login/register calls, keeping the auth rate-limit budget at the
 * suite's baseline). Returns the new enrollment's courseId. */
export async function generateCourse(
  page: import("@playwright/test").Page,
  topic: string,
): Promise<string> {
  const gen = await page.request.post("/api/courses/generate", {
    data: { topic, mode: "topic" },
    timeout: 60_000,
  });
  expect(gen.ok()).toBeTruthy();
  const json = (await gen.json()) as { ok: boolean; data: { courseId: string } };
  expect(json.ok).toBeTruthy();
  return json.data.courseId;
}

/** Submit a diagnostic score for a course (the canonical drive: five
 * neutral picks, the validated score rides the payload — the API stores
 * it verbatim per the S11-F2 client-computed contract). */
export async function submitScore(
  page: import("@playwright/test").Page,
  courseId: string,
  score: number,
  total = 5,
): Promise<void> {
  const res = await page.request.post("/api/quiz/submit", {
    data: { courseId, answers: [1, 1, 1, 1, 1], total, score },
    timeout: 60_000,
  });
  expect(res.ok()).toBeTruthy();
}

/** Delete the generated enrollments (the afterEach cleanup — the
 * generate route repoints current_subject at the new topic, which would
 * break every later spec that pins the seeded "Economics" surfaces). */
export async function cleanupGeneratedEnrollments(
  page: import("@playwright/test").Page,
  topics: readonly string[],
): Promise<void> {
  const res = await page.request.get("/api/courses");
  if (res.ok()) {
    const courses = (await res.json()) as {
      ok: boolean;
      data: { id: string; courseName: string }[];
    };
    if (courses.ok) {
      for (const c of courses.data) {
        if (topics.includes(c.courseName)) {
          await page.request.delete(`/api/courses/${c.id}`);
        }
      }
    }
  }
}

/** Restore the seeded demo student's state after a generated course
 * repointed it (the generate route's current_subject side effect). */
export async function restoreDemoStudent(page: import("@playwright/test").Page): Promise<void> {
  await page.request.put("/api/student", {
    data: { currentSubject: "Economics", quizCompleted: true },
  });
}
