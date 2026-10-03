import { expect, test } from "@playwright/test";

import { generateCourse } from "./helpers";

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
    // S7-F2: the menu items (rounded-xl) compute 12px — the reference's
    // custom radius scale, NOT v4's engine default 14px (Trap 6 pin).
    const item = menu.getByRole("button", { name: "My Courses" });
    await expect(item).toHaveCSS("border-radius", "12px");
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

  test("a single enrollment renders NO Switch Course section (S6-F6)", async ({ page }) => {
    // The demo account has exactly one enrollment (Economics) — the
    // reference's section exists only when enrollments.length > 1.
    await page.getByRole("button", { name: "Open menu" }).tap();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Switch Course")).toHaveCount(0);
    // No course rows either — the rows live only inside the section.
    await expect(menu.getByRole("button", { name: /Economics/ })).toHaveCount(0);
    // The actions still render.
    await expect(menu.getByRole("button", { name: "My Courses" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Log Out" })).toBeVisible();
  });

  test("the mobile menu carries the reference's Switch Course section (S5-F1)", async ({ page }) => {
    // A fresh user with TWO courses (API-driven; the register call shares
    // the context cookie jar). The reference's `md:hidden` panel renders a
    // Switch Course section whenever enrollments.length > 1 — ALL courses,
    // Check on the current one, rows navigate to the dashboard.
    const email = `s5-mobile-${Date.now()}@parity.test`;
    await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", fullName: "S5 Mobile" },
    });
    const first = await generateCourse(page, "Astronomy");
    const second = await generateCourse(page, "Chemistry");
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();

    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).tap();
    const menu = page.getByRole("menu");

    // The section label + both rows; NO Update Preferences on mobile.
    await expect(menu.getByText("Switch Course")).toBeVisible();
    await expect(menu.getByRole("button", { name: /Astronomy/ })).toBeVisible();
    await expect(menu.getByRole("button", { name: /Chemistry/ })).toBeVisible();
    await expect(
      menu.getByRole("button", { name: "Update Preferences" }),
    ).toHaveCount(0);

    // The Check marks the CURRENT course — the LAST generated (Chemistry;
    // the page defaults to the newest enrollment) — and ONLY it (session-6,
    // S6-F6: the pin the session-5 spec review found missing).
    await expect(
      menu.getByRole("button", { name: /Chemistry/ }).locator("svg.lucide-check"),
    ).toHaveCount(1);
    await expect(
      menu.getByRole("button", { name: /Astronomy/ }).locator("svg.lucide-check"),
    ).toHaveCount(0);

    // A row tap navigates to /?course={id} (the DASHBOARD, not the hub).
    await menu.getByRole("button", { name: /Astronomy/ }).tap();
    await expect(page).toHaveURL(new RegExp(`/\\?course=${first}`));
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("the guest demo mobile menu shows Sign In instead of Log Out (S5-F9)", async ({ page }) => {
    // /demo is a stateless guest surface — its mobile menu renders the
    // reference's no-user variant (Sign In where Log Out would be).
    await page.goto("/demo");
    await page.getByRole("button", { name: "Open menu" }).tap();
    const menu = page.getByRole("menu");
    await expect(menu.getByText("Guest")).toBeVisible();
    // The reference renders Sign In when there is no user (guest mode).
    await expect(menu.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Log Out" })).toHaveCount(0);
    await menu.getByRole("button", { name: "Sign In" }).tap();
    await expect(page).toHaveURL(/\/login\?from_url=%2Fdemo/);
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
