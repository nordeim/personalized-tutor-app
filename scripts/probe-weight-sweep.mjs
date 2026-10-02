// Session-7 probe: /demo (or any route) text-weight distribution sweep —
// diff against the live's leaf-weight histogram.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const route = process.argv[2] ?? "/demo";
const width = Number(process.argv[3] ?? 1280);
const height = Number(process.argv[4] ?? 800);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height } });
const page = await ctx.newPage();
await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const leafWithText = (root) => {
    const out = [];
    const walk = (n) => {
      for (const c of n.children) {
        if (c.children.length === 0 && c.textContent.trim()) out.push(c);
        else walk(c);
      }
    };
    walk(root);
    return out.slice(0, 400);
  };
  const leaves = leafWithText(document.body);
  const dist = {};
  const all = [];
  for (const l of leaves) {
    const w = getComputedStyle(l).fontWeight;
    dist[w] = (dist[w] || 0) + 1;
    all.push([w, l.textContent.trim().slice(0, 40)]);
  }
  return JSON.stringify({ total: leaves.length, weightDist: dist, all }, null, 1);
});
console.log(out);
await browser.close();
// appended: detailed dump mode
