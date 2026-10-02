// Session-8 probe: full typography histogram (font-size, line-height,
// letter-spacing, color, weight) over text-node leaves — the same walker as
// the live-side agent-browser eval (TreeWalker over SHOW_TEXT, dedup by
// parentElement), so the two sides diff cleanly.
// Usage: node scripts/probe-typography.mjs [route] [width] [height]
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
  const leaves = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    if (!t || t.startsWith("@keyframes")) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    leaves.push({
      text: t.slice(0, 30),
      fs: cs.fontSize,
      lh: cs.lineHeight,
      ls: cs.letterSpacing,
      col: cs.color,
      wt: cs.fontWeight,
      tag: el.tagName.toLowerCase(),
    });
  }
  return JSON.stringify({ count: leaves.length, leaves });
});
console.log(out);
await browser.close();
