// Session-10 screenshots (75+): the chat-surface fixes (the BLACK user
// bubble + the Send paper plane), the hub "?" menu's empty-name header, and
// the query-carrying from_url chain. Runs against the dev server on :3000.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();

// Authenticated context (the seeded demo user) via the request-level login
// (the same pattern as capture-s9-shots.mjs — dodges nothing, the dev
// server has no rate-limit pressure).
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
const login = await page.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});
if (!login.ok()) console.error("demo login failed:", login.status());

// 75 — the chat exchange: the BLACK user bubble (white text, mirrored
// 16/16/4 tail) + the gray assistant bubble + the Send paper-plane button.
await page.goto(`${BASE}/hub`, { waitUntil: "networkidle" });
await page.getByText("Lesson 1 · Now").first().waitFor({ timeout: 45_000 });
await page.waitForTimeout(1500);
const input = page.getByPlaceholder("Ask Nori anything...").first();
await input.fill("What is opportunity cost in one sentence?");
await page.locator('button[aria-label="Send message"]').first().click();
// The user bubble renders optimistically; give the assistant reply a
// window too (the fallback guarantees termination).
await page.waitForTimeout(9000);
await page.screenshot({ path: "docs/screenshots/75-nori-user-bubble-black.png" });

// 76 — the hub "?" menu open: the empty-name m_ header (the "?" avatar +
// EMPTY name/email lines) + LayoutGrid My Courses.
await page.goto(`${BASE}/hub`, { waitUntil: "networkidle" });
await page.getByText("Lesson 1 · Now").first().waitFor({ timeout: 45_000 });
await page.waitForTimeout(800);
await page.locator('button[aria-label="Account menu"]').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: "docs/screenshots/76-hub-help-menu-empty-name.png" });

// 77 — the mobile hub: the Dashboard back-link carries ?course= (the
// S10-F4 fix) + the Lessons pill + the tab bar.
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mpage = await mctx.newPage();
await mpage.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});
await mpage.goto(`${BASE}/hub`, { waitUntil: "networkidle" });
await mpage.waitForTimeout(2500);
await mpage.screenshot({ path: "docs/screenshots/77-hub-mobile-dashboard-link.png" });

// 78 — the query-carrying from_url chain: the anonymous pill at /?q=parity
// routes to /login?from_url=%2F%3Fq%3Dparity (the S10-F1 fix).
const gctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const gpage = await gctx.newPage();
await gpage.goto(`${BASE}/?q=parity`, { waitUntil: "networkidle" });
await gpage.waitForTimeout(1000);
await gpage.getByRole("button", { name: "Sign In", exact: true }).click();
await gpage.waitForURL(/login/, { timeout: 10_000 });
await gpage.waitForTimeout(800);
await gpage.screenshot({ path: "docs/screenshots/78-from-url-query-chain.png" });

await browser.close();
console.log("captured: 75-nori-user-bubble-black / 76-hub-help-menu-empty-name / 77-hub-mobile-dashboard-link / 78-from-url-query-chain");
