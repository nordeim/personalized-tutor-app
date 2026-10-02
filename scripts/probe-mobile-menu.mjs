// Session-7 clone-side probe: mobile menu structure + computed styles.
// Runs against the dev server on :3000 (repo .env → db/custom.db).
// Usage: node scripts/probe-mobile-menu.mjs [--demo-guest]
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const guest = process.argv.includes("--demo-guest");

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const page = await ctx.newPage();

if (guest) {
  await page.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
} else {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("demo@thinkerwell.app");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

// Hamburger (mobile) — real tap like the e2e pin
const burger = page.locator('button[aria-label="Open menu"]');
await burger.tap();
await page.waitForTimeout(600);

const panel = page.locator('[role="menu"]');
const html = await panel.evaluate((el) => el.outerHTML);
console.log("=== MOBILE MENU HTML (clone) ===");
console.log(html);

// Computed styles: avatar radius (the 9999px pin), panel radius, item radius
const styles = await panel.evaluate((el) => {
  const avatar = el.querySelector(".bg-black.rounded-\\[9999px\\], .bg-black");
  const firstBtn = el.querySelector("button");
  const cs = (node, prop) => (node ? getComputedStyle(node)[prop] : null);
  return {
    avatarRadius: cs(avatar, "borderRadius"),
    panelRadius: cs(el, "borderRadius"),
    itemRadius: cs(firstBtn, "borderRadius"),
    panelWidth: cs(el, "minWidth"),
    headerBg: cs(el.firstElementChild, "backgroundColor"),
  };
});
console.log("=== COMPUTED STYLES (clone) ===");
console.log(JSON.stringify(styles, null, 2));

// Switch Course section presence (demo user has 1 enrollment → negative pin)
const switchLabel = await page.getByText("Switch Course").count();
console.log("Switch Course label count (expect 0 for 1 enrollment):", switchLabel);

// Guest variant check
if (guest) {
  const signIn = await panel.getByText("Sign In").count();
  const logOut = await panel.getByText("Log Out").count();
  console.log("Guest menu — Sign In:", signIn, "Log Out:", logOut);
}

// Toast layer pointer-events (the mobile-nav fix)
const toastPE = await page.evaluate(() => {
  const t = document.querySelector("[data-sonner-toaster]");
  return t ? getComputedStyle(t).pointerEvents : "no toaster node";
});
console.log("Toaster pointer-events (expect none):", toastPE);

await page.screenshot({ path: "docs/screenshots/56-clone-mobile-menu-probe.png" });
await browser.close();
console.log("PROBE DONE");
