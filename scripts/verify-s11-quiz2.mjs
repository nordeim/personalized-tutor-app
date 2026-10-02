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

// pick the FIRST option (A) → confirm → reveal
await page.locator("button:has-text('A.')").first().click();
await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
await page.waitForTimeout(400);
const reveal = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll("button")).filter((b) => /^[A-D]\./.test(b.textContent?.trim() ?? ""));
  return opts.map((b) => {
    const s = getComputedStyle(b);
    const icon = b.querySelector("svg");
    return { prefix: b.textContent?.trim().slice(0, 2), bg: s.backgroundColor, op: s.opacity, icon: icon ? icon.getAttribute("class")?.slice(0, 30) : null };
  });
});
console.log("REVEAL (picked A):", JSON.stringify(reveal, null, 1));

// the next button label
const btns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button"))
    .map((b) => b.textContent?.trim())
    .filter((t) => t && (t.includes("Next Question") || t.includes("Submit Assessment")))
);
console.log("ACTION BUTTONS:", JSON.stringify(btns));

// advance through all 5 → Submit Assessment → the terminal
for (let i = 0; i < 4; i++) {
  await page.locator("button:has-text('A.')").first().click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: /Next Question/ }).click();
  await page.waitForTimeout(400);
}
// final question: pick + submit
await page.locator("button:has-text('A.')").first().click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: /Submit Assessment/ }).click();
await page.waitForTimeout(1000);
console.log("TERMINAL URL:", page.url());
const overlay = await page.evaluate(() => document.body.innerText.slice(0, 200));
console.log("OVERLAY TEXT:", JSON.stringify(overlay));
await page.waitForURL(/\/\?course=/, { timeout: 90_000 });
console.log("LANDED:", page.url());
await page.waitForTimeout(1500);
const dash = await page.evaluate(() => document.body.innerText.slice(0, 400));
console.log("DASHBOARD TEXT:", JSON.stringify(dash));
await browser.close();
