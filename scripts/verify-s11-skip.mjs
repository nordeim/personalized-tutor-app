import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "demo@thinkerwell.app", password: "Demo1234!" } });

// fresh course → quiz → skip
await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
await page.locator("input[placeholder^='e.g.']").first().fill("Chemistry", { timeout: 10_000 });
await page.getByRole("button", { name: /^continue$/i }).click();
await page.waitForURL(/\/quiz\?course=/, { timeout: 60_000 });
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });
const courseId = page.url().match(/course=([\w-]+)/)?.[1];
console.log("courseId:", courseId);

// click Skip quiz →
await page.getByRole("button", { name: /Skip quiz/ }).click();
await page.waitForTimeout(600);
console.log("SKIP OVERLAY:", JSON.stringify(await page.evaluate(() => document.body.innerText.slice(0, 120))));
await page.waitForURL(/\/\?course=/, { timeout: 30_000 });
console.log("SKIPPED TO:", page.url());
await page.waitForTimeout(1500);
const dash = await page.evaluate(() => document.body.innerText.slice(0, 350));
console.log("DASHBOARD (should be the 0% course dashboard):", JSON.stringify(dash));

// the X close path: start another quiz and close it
await page.goto(`${BASE}/quiz?course=${courseId}`, { waitUntil: "networkidle" });
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });
await page.getByRole("button", { name: "Close assessment" }).click();
await page.waitForURL(/\/\?course=/, { timeout: 15_000 });
console.log("CLOSED TO:", page.url());
await browser.close();
