import { expect, test } from "@playwright/test";

// MOBILE NAVIGATION — the highest-regression-risk chrome and the exact
// surface the live app ships broken: the Sonner toaster portal renders
// `div.fixed.top-0.z-[100].w-full.p-4` with pointer-events auto WHILE
// EMPTY, covering the top 32px and swallowing taps on the hamburger menu
// button. This suite pins the FIX (container pointer-events-none) and the
// menu behavior at 390×844 (the reference's mobile geometry), plus the
// Hub's Learn/Ask Nori/Lessons bottom tab bar.
//
// Contexts arrive AUTHENTICATED (setup-project storageState).

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.describe("mobile navigation (390×844)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("the hamburger menu is CLICKABLE — the empty toaster must not cover it", async ({ page }) => {
    // THE regression pin: the live app's empty Notifications region sits
    // at fixed top-0 with pointer-events auto and intercepts the tap.
    const toaster = page.locator('[aria-label="Notifications"]');
    await expect(toaster).toHaveCount(1);
    await expect(toaster).toHaveCSS("pointer-events", "none");
    expect(await toaster.locator("*").count()).toBe(0); // empty in this state

    // A real tap (Playwright refuses covered elements — this is the exact
    // failure the live app produces).
    const hamburger = page.getByRole("button", { name: "Open menu" });
    await hamburger.tap();
    await expect(page.getByRole("menu")).toBeVisible();
  });

  test("the menu shows the name-only header and both actions", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).tap();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    // Mobile header: name only (the email line is desktop-only).
    await expect(menu.getByText("Demo Learner")).toBeVisible();
    await expect(menu.getByText("demo@thinkerwell.app")).toHaveCount(0);
    await expect(menu.getByRole("button", { name: "My Courses" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Log Out" })).toBeVisible();
    // Panel tokens: white, 16px radius, min-width 220.
    await expect(menu).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(menu).toHaveCSS("border-radius", "16px");
  });

  test("menu navigation reaches /courses and closes the menu", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await page.getByRole("menu").getByRole("button", { name: "My Courses" }).tap();
    await expect(page).toHaveURL(/\/courses\/?$/);
    await expect(page.getByRole("heading", { name: "Demo Learner", exact: true })).toBeVisible();
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("Log Out returns to the login card", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await page.getByRole("menu").getByRole("button", { name: "Log Out" }).tap();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome to Personalized Tutor App" }),
    ).toBeVisible();
  });

  test("the mobile dashboard stacks hero above the purple setup panel", async ({ page }) => {
    // The demo user already has a course, so the SETUP state lives at
    // /onboarding (the always-available Add-a-Course surface).
    await page.goto("/onboarding");
    // The setup panel is purple at every width (computed, not class-matched
    // — the mobile DOM reorders the flex children).
    const panelBg = await page
      .getByRole("heading", { name: "Let's get you set up" })
      .evaluate((el) => {
        let node: Element | null = el;
        while (node && node !== document.body) {
          const bg = getComputedStyle(node).backgroundColor;
          if (bg === "rgb(200, 174, 255)") return bg;
          node = node.parentElement;
        }
        return "not-found";
      });
    expect(panelBg).toBe("rgb(200, 174, 255)");
    // The h1 typewriter renders.
    const h1 = page.getByRole("heading", { name: /^Dive into/ });
    await expect(h1).toBeVisible();
  });
});

test.describe("hub mobile chrome (390×844)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hub");
  });

  test("the hub header links to Dashboard and opens the Lessons sheet", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Lessons", exact: true }).first().tap();
    // The sheet header + all six lessons. The reference prints the stage
    // number twice ("Stage 2 · Level 2") and the ACTIVE row goes black.
    await expect(page.getByText("All Lessons").first()).toBeVisible();
    for (const label of ["Stage 1 · Level 1", "Stage 2 · Level 2", "Stage 3 · Level 3"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    const activeRow = page.getByRole("button", { name: /Active/ }).first();
    await expect(activeRow).toHaveCSS("background-color", "rgb(15, 14, 14)");
  });

  test("the bottom tab bar carries Learn / Ask Nori / Lessons with the yellow active chip", async ({ page }) => {
    const bar = page.locator("div.rounded-\\[20px\\]", { hasText: "Learn" }).last();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveCSS("background-color", "rgb(26, 26, 26)");
    const learn = bar.getByRole("button", { name: "Learn", exact: true });
    await expect(learn).toHaveCSS("background-color", "rgb(255, 253, 115)");
    await expect(learn).toHaveCSS("color", "rgb(15, 14, 14)");
    const nori = bar.getByRole("button", { name: "Ask Nori", exact: true });
    await expect(nori).toHaveCSS("color", "rgba(255, 255, 255, 0.4)");
  });

  test("tabs switch between Learn, Ask Nori, and Lessons", async ({ page }) => {
    const bar = page.locator("div.rounded-\\[20px\\]", { hasText: "Learn" }).last();
    await bar.getByRole("button", { name: "Ask Nori", exact: true }).tap();
    // .last(): the desktop pane renders first (hidden) — the mobile chat
    // instance is the visible one at 390px.
    await expect(page.getByText("Your AI Tutor").last()).toBeVisible();
    await expect(page.getByPlaceholder("Ask Nori anything...").last()).toBeVisible();
    await bar.getByRole("button", { name: "Lessons", exact: true }).tap();
    // .last(): the desktop sidebar's instance renders first (hidden at 390).
    await expect(page.getByText("All Lessons").last()).toBeVisible();
    await bar.getByRole("button", { name: "Learn", exact: true }).tap();
    // .last(): same DOM-order rule — the mobile lesson view is second.
    await expect(page.getByText("Core Concept").last()).toBeVisible();
  });
});
