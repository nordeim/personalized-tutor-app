// Session-7 probe: /courses page (fresh 0-course user) weights + radii.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Sign up/ }).click();
const stamp = Date.now();
await page.getByLabel("Email").fill(`cprobe${stamp}@thinkerwell.app`);
await page.getByLabel("Password").fill("Probe1234!");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(`${BASE}/`, { timeout: 20000 });
await page.goto(`${BASE}/courses`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const out = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  const results = { h1: h1 ? [getComputedStyle(h1).fontSize, getComputedStyle(h1).fontWeight] : null };
  const tiles = document.querySelectorAll(".rounded-xl");
  const seen = {};
  for (const t of tiles) {
    const r = getComputedStyle(t).borderRadius;
    seen[(typeof t.className === "string" ? t.className.slice(0, 35) : "") + " => " + r] = true;
  }
  results.xlTiles = Object.keys(seen);
  const p20 = Array.from(document.querySelectorAll('[class*="rounded-[20px]"]'));
  results.p20 = p20.slice(0, 3).map((t) => getComputedStyle(t).borderRadius);
  const paragraphs = Array.from(document.querySelectorAll("p"));
  results.pWeights = paragraphs.slice(0, 12).map(
    (p) => getComputedStyle(p).fontWeight + " " + p.textContent.trim().slice(0, 30),
  );
  // Add tile icon check (session-6 R1 verified Plus sw 2 — re-verify)
  const addBtn = Array.from(document.querySelectorAll("button")).find((b) =>
    /Add.*Course/i.test(b.textContent),
  );
  if (addBtn) {
    const plus = addBtn.querySelector("svg");
    results.addPlus = plus
      ? [plus.getAttribute("stroke-width"), plus.getAttribute("class").slice(0, 40)]
      : "no svg";
  }
  return JSON.stringify(results, null, 1);
});
console.log(out);
await page.screenshot({ path: "docs/screenshots/58-clone-courses-fresh.png" });
await browser.close();
