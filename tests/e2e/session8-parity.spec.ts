import { expect, test } from "@playwright/test";

// SESSION-8 parity pins (desktop 1440×900, authenticated storageState).
//
// Covered:
//   S8-F3 — the Try it Sample card routes to /demo (a navigation, not a
//            course generation — the live's X2 onTryIt handler).
//   S8-F4 — the hub LessonView h2 = the STUDENT's current_subject, not the
//            active course name (fresh user + PUT /api/student divergence).
//   S8-F6 — the challenge modal: overlay rgba(0,0,0,0.5) with NO blur, and
//            the post-reveal swaps Submit→Close with NO banner.
//   S8-F5 — the stats-card icons: Trophy 24px (Course Progress), Brain 24px
//            (Daily Challenge), BookOpen 24px (Subject), Sparkles 24px
//            (roadmap), BookOpen 16px (Course Lessons).
//   S8-F7 — the streak weekday letters compute rgba(0,0,0,0.4) (Trap 8).
//   S8-F8 — an unowned ?course= renders the DEFAULT-GRID hub ("General").

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the Try it Sample card routes to /demo (S8-F3)", () => {
  test("the onboarding's Try it navigates to the demo route", async ({ page }) => {
    // The seeded demo user has a course — the setup state lives at
    // /onboarding (the always-available Add-a-Course surface). The button's
    // accessible name is its aria-label ("Try the sample Economics course
    // demo" — the S8 swap added it alongside the navigation change).
    await page.goto("/onboarding");
    await page.getByRole("button", { name: /Try the sample Economics course/i }).click();
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByRole("heading", { name: "Guest", exact: true })).toBeVisible();
  });
});

test.describe("the hub h2 subject is the STUDENT's current_subject (S8-F4)", () => {
  test("a divergent student subject overrides the active course name", async ({ page }) => {
    // Fresh user (never pollutes the seeded demo account): generate an
    // Astronomy course, then point the STUDENT's current_subject at Physics.
    const email = `s8-h2-${Date.now()}@parity.test`;
    const reg = await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", fullName: "S8 Subject" },
    });
    expect(reg.ok()).toBeTruthy();
    const gen = await page.request.post("/api/courses/generate", {
      data: { mode: "topic", topic: "Astronomy" },
    });
    const genJson = (await gen.json()) as { ok: boolean; data?: { courseId: string } };
    expect(genJson.ok).toBe(true);
    const put = await page.request.put("/api/student", {
      data: { currentSubject: "Physics" },
    });
    expect(put.ok()).toBeTruthy();

    // The hub's LessonView h2 (level 1) shows the student's subject —
    // "Physics" — even though the active course is Astronomy. (The lesson
    // content is AI-generated for a real courseId — the fallback guarantees
    // termination, but 45s keeps the AI path in budget.)
    await page.goto(`/hub?course=${genJson.data?.courseId}`);
    const h2 = page.getByRole("heading", { level: 2 }).first();
    await expect(h2).toHaveText("Physics", { timeout: 45_000 });
  });

  test("the unowned course param renders the default-grid hub with General (S8-F8)", async ({ page }) => {
    await page.goto("/hub?course=not-an-enrollment-id");
    // The hub shell renders (no redirect) with the DEFAULT grid and the
    // "General" subject (no enrollment resolves — the live's observed
    // behavior for unowned ids).
    await expect(page).toHaveURL(/\/hub/);
    await expect(page.getByText("Lesson 1 · Now").first()).toBeVisible();
    const h2 = page.getByRole("heading", { level: 2 }).first();
    await expect(h2).toHaveText("General", { timeout: 30_000 });
  });
});

test.describe("the daily challenge modal (S8-F6)", () => {
  test("the overlay is black/50 with no blur; the reveal swaps Submit→Close with no banner", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: /Daily challenge — open the challenge card/ }).click();

    const overlay = page.locator(".fixed.inset-0.z-50").first();
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveCSS("background-color", "rgba(0, 0, 0, 0.5)");
    await expect(overlay).toHaveCSS("backdrop-filter", "none");

    // Pick an option and submit — the SAME button slot swaps to "Close"
    // with no result banner (the reveal colors carry the feedback).
    const card = page.locator("div.rounded-\\[24px\\]").first();
    await card.getByRole("button").nth(1).click();
    await card.getByRole("button", { name: "Submit Answer" }).click();
    await expect(card.getByRole("button", { name: "Close", exact: true })).toBeVisible();
    await expect(page.getByText("Correct! Well done!")).toHaveCount(0);
    await expect(page.getByText("Not quite", { exact: false })).toHaveCount(0);

    // Close resets the modal.
    await card.getByRole("button", { name: "Close", exact: true }).click();
    await expect(overlay).toHaveCount(0);
  });
});

test.describe("the dashboard card icons (S8-F5)", () => {
  test("the stats + card headers decode to the live's icons and sizes", async ({ page }) => {
    await page.goto("/demo");

    // The icon identity lives in the first path's `d` prefix; the size in
    // the computed width (the clone pins lucide props on each svg). Each
    // label's parent card carries its icon as the first svg.
    const progressSvg = page
      .getByText("Course Progress", { exact: true })
      .locator("xpath=..")
      .locator("svg")
      .first();
    await expect(progressSvg).toHaveCSS("width", "24px");
    const progressD = await progressSvg.locator("path").first().getAttribute("d");
    expect(progressD?.startsWith("M6 9H4.5")).toBe(true); // lucide Trophy

    const challengeSvg = page
      .getByText("Daily Challenge", { exact: true })
      .locator("xpath=..")
      .locator("svg")
      .first();
    await expect(challengeSvg).toHaveCSS("width", "24px");
    const challengeD = await challengeSvg.locator("path").first().getAttribute("d");
    expect(challengeD?.startsWith("M12 5a3 3 0 1 0-5.997")).toBe(true); // lucide Brain

    const subjectSvg = page
      .getByText("Subject", { exact: true })
      .locator("xpath=..")
      .locator("svg")
      .first();
    await expect(subjectSvg).toHaveCSS("width", "24px");

    const roadmapSvg = page
      .getByText("Learning Roadmap", { exact: true })
      .locator("xpath=..")
      .locator("svg")
      .first();
    await expect(roadmapSvg).toHaveCSS("width", "24px");

    // The Course Lessons card header icon decodes at 16px.
    const lessonsSvg = page
      .getByText("Course Lessons", { exact: true })
      .locator("xpath=..")
      .locator("svg")
      .first();
    await expect(lessonsSvg).toHaveCSS("width", "16px");
  });

  test("the streak weekday letters compute the v3 rgba serialization (S8-F7)", async ({ page }) => {
    await page.goto("/demo");
    const letter = page.getByText("Study Streak", { exact: true }).locator("xpath=..");
    // The 7 weekday letter spans under the streak card.
    const spans = letter.locator("xpath=following::span[contains(@class,'text-xs')]").first();
    await expect(spans).toHaveCSS("color", "rgba(0, 0, 0, 0.4)");
  });
});
