import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/demo", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const out = await page.evaluate(() => {
  const leafWithText = (root) => {
    const out = [];
    const walk = (n) => { for (const c of n.children) { if (c.children.length === 0 && c.textContent.trim()) out.push(c); else walk(c); } };
    walk(root); return out.slice(0, 400);
  };
  const leaves = leafWithText(document.body);
  const all = leaves.map(l => {
    const w = getComputedStyle(l).fontWeight;
    return [w, l.textContent.trim().slice(0, 30), (typeof l.className === 'string' ? l.className : '').slice(0, 90)];
  });
  return JSON.stringify(all);
});
console.log(out);
await browser.close();
