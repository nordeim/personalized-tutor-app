// Session-8 screenshots (64+): the public onboarding, the deferred login
// chain, the post-fix challenge modal + card icons, and the hub subject.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();

// 64 — the PUBLIC onboarding (anonymous root, desktop): Sign In pill +
// "Your Name" field + the typewriter hero.
const pctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ppage = await pctx.newPage();
await ppage.goto(`${BASE}/`, { waitUntil: "networkidle" });
await ppage.waitForTimeout(800);
await ppage.screenshot({ path: "docs/screenshots/64-public-onboarding-desktop.png" });

// 65 — the anonymous mobile header + open guest menu (items-only).
const pmctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const pmpage = await pmctx.newPage();
await pmpage.goto(`${BASE}/`, { waitUntil: "networkidle" });
await pmpage.waitForTimeout(800);
await pmpage.getByRole("button", { name: "Open menu" }).tap();
await pmpage.waitForTimeout(400);
await pmpage.screenshot({ path: "docs/screenshots/65-public-onboarding-mobile-guest-menu.png" });
await pmctx.close();

// 66 — the anonymous Continue → the deferred login (from_url chain).
await ppage.getByLabel("Your Name").fill("Alex Johnson");
await ppage.getByLabel("What would you like to learn").fill("World War II");
await ppage.getByRole("button", { name: "Continue", exact: true }).click();
await ppage.waitForURL(/\/login\?from_url=%2F$/);
await ppage.waitForTimeout(600);
await ppage.screenshot({ path: "docs/screenshots/66-public-onboarding-deferred-login.png" });
await pctx.close();

// Authenticated context for the post-fix surfaces (67-69).
const actx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const apage = await actx.newPage();
const reg = await apage.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});
if (!reg.ok()) console.error("demo login failed:", reg.status());

// 67 — /demo: the fixed stats icons (Trophy/Brain/BookOpen 24px) +
// Course Lessons 16px + the re-timed challenge card.
await apage.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
await apage.waitForTimeout(1500);
await apage.screenshot({ path: "docs/screenshots/67-demo-fixed-card-icons.png" });

// 68 — the challenge modal post-fix (overlay black/50, no blur).
await apage
  .getByRole("button", { name: /Daily challenge — open the challenge card/ })
  .click();
await apage.waitForTimeout(600);
await apage.screenshot({ path: "docs/screenshots/68-challenge-modal-black50.png" });

// 69 — the challenge reveal: colors + the Submit→Close swap.
const card = apage.locator("div.rounded-\\[24px\\]").first();
await card.getByRole("button").nth(1).click();
await card.getByRole("button", { name: "Submit Answer" }).click();
await apage.waitForTimeout(500);
await apage.screenshot({ path: "docs/screenshots/69-challenge-reveal-close-swap.png" });

// 70 — the hub lesson view (the student-subject h2 + the normal panes).
await apage.goto(`${BASE}/hub`, { waitUntil: "networkidle" });
await apage.waitForTimeout(2500);
await apage.screenshot({ path: "docs/screenshots/70-hub-lesson-subject.png" });
await actx.close();

await browser.close();
console.log("session-8 screenshots captured (64-70)");
