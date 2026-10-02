// Session-7 post-fix screenshots (59+): the remediated surfaces.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();

// 59 — /demo desktop: Course Lessons icon column + streak cells (12px)
const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const dpage = await dctx.newPage();
await dpage.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
await dpage.waitForTimeout(1200);
await dpage.screenshot({ path: "docs/screenshots/59-demo-lesson-icons-fixed.png", fullPage: false });
await dctx.close();

// 60 — login card (backdrop blur 4px pin)
const lctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lpage = await lctx.newPage();
await lpage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await lpage.waitForTimeout(600);
await lpage.screenshot({ path: "docs/screenshots/60-login-card-blur-fixed.png" });
await lctx.close();

// 61 — mobile menu (12px items), with-course guest state
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const mpage = await mctx.newPage();
await mpage.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
await mpage.waitForTimeout(800);
await mpage.locator('button[aria-label="Open menu"]').tap();
await mpage.waitForTimeout(500);
await mpage.screenshot({ path: "docs/screenshots/61-mobile-menu-12px-items.png" });
await mctx.close();

// 62 — fresh-user onboarding mobile (font-light descriptions + tags)
const octx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const opage = await octx.newPage();
await opage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await opage.getByRole("button", { name: /Sign up/ }).click();
const stamp = Date.now();
await opage.getByLabel("Email").fill(`shot${stamp}@thinkerwell.app`);
await opage.getByLabel("Password").fill("Probe1234!");
await opage.getByRole("button", { name: "Create account" }).click();
await opage.waitForURL(`${BASE}/`, { timeout: 20000 });
await opage.waitForTimeout(1500);
await opage.screenshot({ path: "docs/screenshots/62-onboarding-fontlight-fixed.png" });
await octx.close();

// 63 — authenticated dashboard (demo user) lesson icons
const actx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const apage = await actx.newPage();
await apage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await apage.getByLabel("Email").fill("demo@thinkerwell.app");
await apage.getByLabel("Password").fill("Demo1234!");
await apage.getByRole("button", { name: "Sign in" }).click();
await apage.waitForURL(`${BASE}/`, { timeout: 15000 });
await apage.waitForLoadState("networkidle");
await apage.waitForTimeout(800);
await apage.screenshot({ path: "docs/screenshots/63-dashboard-lesson-icons.png" });
await actx.close();

await browser.close();
console.log("SCREENSHOTS DONE");
