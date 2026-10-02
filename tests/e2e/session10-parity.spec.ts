import { expect, test } from "@playwright/test";

// SESSION-10 parity pins (desktop 1440×900, authenticated storageState).
//
// Covered:
//   S10-F2 — the Nori chat USER bubble is BLACK #0F0E0E with WHITE text (the
//            live's computed decode — the clone shipped yellow/dark, a
//            session-1 invention never live-diffed until session 10).
//   S10-F3 — the chat send button carries lucide's Send paper plane at
//            w-3.5 h-3.5 (paths verified identical across the live's lucide
//            0.475 and the clone's 0.525 — the clone shipped arrow-up h-4).
//   S10-F4 — the hub's back-links carry ?course={id} (the live's hub logo
//            AND mobile "Dashboard" link both href /?course=<current>).
//   S10-F5/F6 — the hub's "?" menu: the empty-name m_ header (the "?"
//            avatar + EMPTY name/email lines — the live's own output) and
//            the LayoutGrid My Courses icon (the clone shipped List).
//
// The logged-out from_url pins (S10-F1) live in session10-public.spec.ts
// (the storageState scoping rule).

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the Nori chat user bubble (S10-F2)", () => {
  test("computes the live's black bg + white text after sending", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Lesson 1 · Now").first()).toBeVisible({ timeout: 45_000 });

    // The desktop instance is the FIRST match (the hub renders desktop AND
    // mobile chat panes in one DOM — the dual-DOM locator rule).
    const input = page.getByPlaceholder("Ask Nori anything...").first();
    await input.fill("What is opportunity cost?");
    await input.press("Enter");

    // The user message renders optimistically (no AI wait needed).
    const userBubble = page.locator("div.max-w-\\[80\\%\\]").filter({ hasText: "What is opportunity cost?" }).first();
    await expect(userBubble).toBeVisible();
    await expect(userBubble).toHaveCSS("background-color", "rgb(15, 14, 14)");
    await expect(userBubble).toHaveCSS("color", "rgb(255, 255, 255)");
    // The mirrored tail: browsers serialize the equivalent 4-value radius
    // (TL/TR/BL 16, BR 4) to the 3-value form — the IDENTICAL computed
    // string the live's user bubble produces.
    await expect(userBubble).toHaveCSS("border-radius", "16px 16px 4px");
  });
});

test.describe("the chat send button (S10-F3)", () => {
  test("renders lucide's Send paper plane at w-3.5 h-3.5", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByPlaceholder("Ask Nori anything...").first()).toBeVisible({ timeout: 45_000 });

    const icon = page.locator('button[aria-label="Send message"] svg.lucide-send').first();
    await expect(icon).toBeVisible();
    await expect(icon).toHaveClass(/h-3\.5 w-3\.5/);
    // The live's exact path data (verified identical in lucide 0.525 —
    // NOT a version-trap icon).
    await expect(icon.locator("path").first()).toHaveAttribute("d", /^M14\.536 21\.686/);
  });
});

test.describe("the hub back-links carry the course (S10-F4)", () => {
  test("the desktop logo and mobile Dashboard link both href /?course={id}", async ({ page }) => {
    // S11-F9 (the spec-axis review): pin the EXACT course — the seeded
    // demo user's Economics enrollment (the hub's default at /hub). The
    // prior /^\/\?course=.+$/ regex accepted any id.
    const res = await page.request.get("/api/courses");
    expect(res.ok()).toBeTruthy();
    const courses = (await res.json()) as {
      ok: boolean;
      data: { id: string; courseName: string }[];
    };
    expect(courses.ok).toBeTruthy();
    // The hub at bare /hub resolves the NEWEST enrollment — the seeded
    // list is createdAt-desc so the first row is the target.
    const target = courses.data[0]?.id;
    expect(target).toBeTruthy();

    await page.goto("/hub");
    await expect(page.getByText("Lesson 1 · Now").first()).toBeVisible({ timeout: 45_000 });

    // Both headers render in one DOM (CSS-hidden per breakpoint) — the
    // href is present regardless of visibility.
    const desktopLogo = page.locator('a[aria-label="Thinkerwell home"]');
    await expect(desktopLogo).toHaveAttribute("href", `/?course=${target}`, { timeout: 45_000 });

    const mobileDashboard = page.locator('a[aria-label="Dashboard"]');
    await expect(mobileDashboard).toHaveAttribute("href", `/?course=${target}`);
  });
});

test.describe("the hub '?' help menu (S10-F5/F6)", () => {
  test("renders the empty-name header and the LayoutGrid My Courses icon", async ({ page }) => {
    await page.goto("/hub");
    await expect(page.getByText("Lesson 1 · Now").first()).toBeVisible({ timeout: 45_000 });

    // The "?" trigger (the hub's own header — NOT the dashboard's m_ pill).
    await page.locator('button[aria-label="Account menu"]').first().click();
    const menu = page.getByRole("menu").first();
    await expect(menu).toBeVisible();

    // The live's empty-name m_ instantiation: the "?" avatar circle, and
    // the name/email lines render EMPTY (the trigger's span is empty for
    // the same reason — the hub header has no user context).
    const avatar = menu.locator("div.rounded-\\[9999px\\]").first();
    await expect(avatar).toHaveText("?");
    const headerLines = menu.locator("p.text-sm, p.text-xs");
    await expect(headerLines).toHaveCount(2);
    await expect(headerLines.first()).toHaveText("");
    await expect(headerLines.last()).toHaveText("");

    // The My Courses row's icon is LayoutGrid (the live's decode), not List.
    await expect(menu.locator("svg.lucide-layout-grid")).toHaveCount(1);
    await expect(menu.locator("svg.lucide-list")).toHaveCount(0);
  });
});
