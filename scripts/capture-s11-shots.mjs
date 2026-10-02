// Session-11 screenshot capture — the rebuilt diagnostic-quiz surface.
// Dev server on :3000, demo account (screenshots use the clone's own
// demo credentials — safe to commit the script).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "demo@thinkerwell.app", password: "Demo1234!" } });

// Generate a fresh course → the quiz surface
await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
await page.locator("input[placeholder^='e.g.']").first().fill("Astronomy", { timeout: 10_000 });
await page.getByRole("button", { name: /^continue$/i }).click();
await page.waitForURL(/\/quiz\?course=/, { timeout: 60_000 });
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });
await page.waitForTimeout(800);

// 79 — the quiz surface (star progress + lilac tile + tan options + dots + skip)
await page.screenshot({ path: `${OUT}/79-quiz-surface-e3-port.png`, fullPage: false });

// 80 — the reveal state (pick a wrong answer → Confirm)
await page.locator("button:has-text('A.')").first().click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/80-quiz-reveal-colors.png`, fullPage: false });

// 81 — the skip path → the 0% course dashboard (the $P model)
await page.getByRole("button", { name: /Next Question/ }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Skip quiz/ }).click();
await page.waitForURL(/\/\?course=/, { timeout: 30_000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/81-quiz-skip-0pc-dashboard.png`, fullPage: false });

// 82 — the "Analyzing your results…" overlay: intercept the submit to hold it
await page.goto(`${BASE}/quiz?course=${page.url().match(/course=([\w-]+)/)?.[1]}`, { waitUntil: "networkidle" });
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });
// delay the submit response so the overlay is capturable
await page.route("**/api/quiz/submit", async (route) => {
  await new Promise((r) => setTimeout(r, 2500));
  await route.continue();
});
for (let i = 0; i < 5; i++) {
  await page.locator("button:has-text('A.')").first().click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
  const action = page.getByRole("button", { name: /Next Question|Submit Assessment/ });
  await action.waitFor({ timeout: 10_000 });
  if (i === 4) {
    await action.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/82-quiz-analyzing-overlay.png`, fullPage: false });
  } else {
    await action.click();
    await page.waitForTimeout(400);
  }
}
await page.waitForTimeout(4000);

console.log("screenshots 79-82 captured");
await browser.close();
