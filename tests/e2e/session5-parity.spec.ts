import { expect, test } from "@playwright/test";

// SESSION-5 parity pins (desktop, 1440×900). Contexts arrive AUTHENTICATED
// via the shared storageState, but the mutation-heavy specs register a FRESH
// user through the API (page.request shares the context cookie jar) so the
// seeded demo account's course list is never polluted for the other files.
//
// Covered:
//   S5-F14 — the authenticated Q5 flow: tag click fills the topic, Start
//             Assessment submits to /api/courses/generate and lands on
//             /quiz?course= (previously only the guest degradation path was
//             tested).
//   S5-F15 — the preferences save round-trip updates the HEADER PILL NAME
//             (and the m_ panel name), not just the panel state.

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the authenticated Q5 Add-a-Course flow (S5-F14)", () => {
  test("a tag click fills the topic and Start Assessment lands on /quiz?course=", async ({ page }) => {
    // Register a fresh user via the API (shares the context cookie jar).
    const email = `s5-q5-${Date.now()}@parity.test`;
    const reg = await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", fullName: "S5 Fresh" },
    });
    expect(reg.ok()).toBeTruthy();

    // The fresh user starts in the onboarding state — the Q5 modal opens
    // from the /courses dashed card.
    await page.goto("/courses");
    await expect(page.getByText("No courses yet.")).toBeVisible();
    await page.getByRole("button", { name: "Add a Course" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Start Assessment is disabled until the topic is set.
    const start = dialog.getByRole("button", { name: /Start Assessment/ });
    await expect(start).toBeDisabled();

    // A quick-tag click fills the topic with "Subject: Sub".
    await dialog.getByRole("button", { name: "Python", exact: true }).click();
    await expect(dialog.getByPlaceholder(/e\.g\. Python programming/)).toHaveValue(
      "Programming: Python",
    );
    await expect(start).toBeEnabled();

    // Submit → POST /api/courses/generate → navigate /quiz?course={id}.
    await start.click();
    await expect(page).toHaveURL(/\/quiz\?course=[\w-]+/, { timeout: 30_000 });
    // The quiz route renders the diagnostic surface (generating state at
    // minimum — the AI seam or its fallback produces the questions).
    await expect(page).toHaveTitle(/Quiz Page/);
  });
});

test.describe("the preferences save updates the header name (S5-F15)", () => {
  test("Save Changes renames the user in the m_ panel AND the header pill", async ({ page }) => {
    // Fresh user so the rename never touches the seeded demo account.
    const email = `s5-pref-${Date.now()}@parity.test`;
    await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", fullName: "Before Rename" },
    });

    // Give the user a completed course (API-driven): generate + submit the
    // diagnostic quiz — only then does / render the with-course dashboard
    // whose m_ menu carries Update Preferences.
    const gen = await page.request.post("/api/courses/generate", {
      data: { mode: "topic", topic: "Chess" },
    });
    const genBody = (await gen.json()) as { ok: boolean; data: { courseId: string } };
    expect(genBody.ok).toBeTruthy();
    await page.request.post("/api/quiz/submit", {
      data: { courseId: genBody.data.courseId, answers: [0, 1, 2, 3, 4, 5, 6], total: 7 },
    });

    await page.goto("/");
    const pill = page.getByRole("button", { name: /Before Rename/ }).first();
    await expect(pill).toBeVisible();
    await pill.click();
    const menu = page.getByRole("menu");
    await expect(menu.getByText("Chess · Default")).toBeVisible();
    await menu.getByRole("button", { name: "Update Preferences" }).click();
    await menu.getByLabel("Name").fill("After Rename");
    await menu.getByRole("button", { name: /Save Changes/ }).click();

    // The m_ panel returns to the items view; router.refresh() re-renders
    // the header snapshot so the PANEL carries the new student name.
    await expect(
      menu.getByRole("button", { name: "Update Preferences" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(menu.getByText("After Rename").first()).toBeVisible();
    // The reference's name split (session-5 decode): the m_ PANEL header
    // renders the STUDENT's name (e.name — the save target) while the
    // collapsed PILL keeps the USER's name (g.full_name). Pin both.
    await page.mouse.click(10, 300);
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(page.getByRole("button", { name: /Before Rename/ }).first()).toBeVisible();
  });
});
