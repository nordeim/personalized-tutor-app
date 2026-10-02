// Runtime verification of the session-10 fixes against the dev server.
import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "demo@thinkerwell.app", password: "Demo1234!" } });

// 1. the user bubble + send icon
await page.goto(`${BASE}/hub`, { waitUntil: "networkidle" });
await page.getByText("Lesson 1 · Now").first().waitFor({ timeout: 45_000 });
const input = page.getByPlaceholder("Ask Nori anything...").first();
await input.fill("verification probe");
await page.locator('button[aria-label="Send message"]').first().click();
await page.waitForTimeout(1500);
const bubble = page.locator("div.max-w-\\[80\\%\\]").filter({ hasText: "verification probe" }).first();
const bubbleCS = await bubble.evaluate((el) => {
  const s = getComputedStyle(el);
  return { bg: s.backgroundColor, color: s.color, radius: s.borderRadius };
});
console.log("USER BUBBLE:", JSON.stringify(bubbleCS));
const icon = await page.locator('button[aria-label="Send message"] svg.lucide-send').first().evaluate((el) => ({
  cls: el.getAttribute("class"),
  sw: el.getAttribute("stroke-width"),
  d1: el.querySelector("path")?.getAttribute("d")?.slice(0, 20),
}));
console.log("SEND ICON:", JSON.stringify(icon));

// 2. the hub back-links
const logoHref = await page.locator('a[aria-label="Thinkerwell home"]').getAttribute("href");
const dashHref = await page.locator('a[aria-label="Dashboard"]').getAttribute("href");
console.log("HUB LINKS:", JSON.stringify({ logoHref, dashHref }));

// 3. the ? menu
await page.locator('button[aria-label="Account menu"]').first().click();
await page.waitForTimeout(500);
const menuInfo = await page.getByRole("menu").first().evaluate((el) => ({
  avatar: el.querySelector("div.rounded-\\[9999px\\]")?.textContent?.trim(),
  nameText: el.querySelector("p.text-sm")?.textContent ?? "(none)",
  hasLayoutGrid: !!el.querySelector("svg.lucide-layout-grid"),
  hasList: !!el.querySelector("svg.lucide-list"),
}));
console.log("HUB ? MENU:", JSON.stringify(menuInfo));

// 4. the from_url chain with query
const gctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const gpage = await gctx.newPage();
await gpage.goto(`${BASE}/?q=parity&s10=1`, { waitUntil: "networkidle" });
await gpage.getByRole("button", { name: "Sign In", exact: true }).click();
await gpage.waitForURL(/login/, { timeout: 8000 });
console.log("FROM_URL CHAIN →", gpage.url());

// 5. the login guard: foreign origin collapses
await gpage.goto(`${BASE}/login?from_url=https%3A%2F%2Fevil.example%2Fx`, { waitUntil: "networkidle" });
// (the round-trip itself is pinned in the e2e; here verify the page renders)
console.log("LOGIN RENDERS:", await gpage.getByRole("button", { name: "Sign in" }).count() > 0);

await browser.close();
