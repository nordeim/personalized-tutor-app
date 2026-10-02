// Session-11 dev-server verification of the rebuilt quiz surface (E3 port).
import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "demo@thinkerwell.app", password: "Demo1234!" } });

// A fresh course → the quiz surface (use the Q5 modal path: courses page)
await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
await page.locator("input[placeholder^='e.g.']").first().fill("Astronomy", { timeout: 10_000 });
await page.getByRole("button", { name: /^continue$/i }).click();
await page.waitForURL(/\/quiz\?course=/, { timeout: 60_000 });
console.log("QUIZ URL →", page.url());

// wait for questions (5)
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });
await page.waitForTimeout(1000);

// 1. the surface structure
const surface = await page.evaluate(() => {
  const span = document.querySelector("header span.text-sm");
  const tile = document.querySelector("div.rounded-\\[10px\\]");
  const opts = Array.from(document.querySelectorAll("main button, form button, div button")).filter((b) => /^A\./.test(b.textContent?.trim() ?? ""));
  const opt = opts[0];
  const optS = opt ? getComputedStyle(opt) : null;
  const track = document.querySelector("div.h-1.rounded-\\[9999px\\]");
  const star = document.querySelector("img[src='/quiz-star.svg']");
  const dots = document.querySelectorAll("div.h-1\\.5");
  const counter = Array.from(document.querySelectorAll("span")).find((s) => /^\d+\/\d+$/.test(s.textContent?.trim() ?? ""));
  const skip = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("Skip quiz"));
  const confirmBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Confirm");
  return {
    headerSpan: span?.textContent?.trim(),
    tile: tile ? { text: tile.textContent, bg: getComputedStyle(tile).backgroundColor, w: getComputedStyle(tile).width } : null,
    optionCount: opts.length,
    optBg: optS?.backgroundColor,
    optRadius: optS?.borderRadius,
    optPad: optS?.padding,
    trackBg: track ? getComputedStyle(track).backgroundColor : null,
    starSize: star ? { w: star.getBoundingClientRect().width, h: star.getBoundingClientRect().height } : null,
    dotCount: dots.length,
    firstDotW: dots[0] ? getComputedStyle(dots[0]).width : null,
    counter: counter?.textContent?.trim(),
    counterColor: counter ? getComputedStyle(counter).color : null,
    skipText: skip?.textContent?.trim(),
    confirmDisabled: confirmBtn?.disabled,
    confirmBg: confirmBtn ? getComputedStyle(confirmBtn).backgroundColor : null,
  };
});
console.log("SURFACE:", JSON.stringify(surface, null, 1));

// 2. pick + confirm → the reveal
await page.locator("button:has-text('B.')").first().click();
await page.waitForTimeout(200);
const confirmBtn = page.getByRole("button", { name: /^Confirm$/, exact: true });
const disabledBefore = await confirmBtn.isDisabled();
await confirmBtn.click();
await page.waitForTimeout(400);
const reveal = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll("button")).filter((b) => /^A\./.test(b.textContent?.trim() ?? ""));
  return opts.map((b) => {
    const s = getComputedStyle(b);
    return { text: b.textContent?.trim().slice(0, 20), bg: s.backgroundColor, op: s.opacity };
  });
});
const nextBtn = await page.getByRole("button", { name: /Next Question|Submit Assessment/ }).count();
console.log("CONFIRM disabled-before-pick… wait, we picked first:", JSON.stringify({ disabledBefore, nextBtn }));
console.log("REVEAL:", JSON.stringify(reveal));

await browser.close();
