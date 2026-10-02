import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "demo@thinkerwell.app", password: "Demo1234!" } });
await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
await page.locator("input[placeholder^='e.g.']").first().fill("Astronomy", { timeout: 10_000 });
await page.getByRole("button", { name: /^continue$/i }).click();
await page.waitForURL(/\/quiz\?course=/, { timeout: 60_000 });
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });

// drive all 5 questions: pick → Confirm → reveal → Next/Submit
for (let i = 0; i < 5; i++) {
  await page.locator("button:has-text('A.')").first().click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
  await page.waitForTimeout(400);
  const actionBtn = page.getByRole("button", { name: /Next Question|Submit Assessment/ });
  console.log(`Q${i + 1} action label:`, await actionBtn.textContent());
  await actionBtn.click();
  await page.waitForTimeout(300);
}
await page.waitForTimeout(800);
console.log("POST-SUBMIT URL:", page.url());
const overlay = await page.evaluate(() => document.body.innerText.slice(0, 150));
console.log("OVERLAY:", JSON.stringify(overlay));
await page.waitForURL(/\/\?course=/, { timeout: 90_000 });
console.log("LANDED:", page.url());
await page.waitForTimeout(2000);
const dash = await page.evaluate(() => document.body.innerText.slice(0, 500));
console.log("DASHBOARD TEXT:", JSON.stringify(dash));
await browser.close();
