// Session-7 post-fix verification: lesson icons, rounded-lg tiles, backdrop blur.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();

// --- Authenticated /demo: lesson icons + p_ tiles + mobile item radius ---
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const demoOut = await page.evaluate(() => {
  const out = {};
  // Course Lessons icon column
  const lessonsCard = Array.from(document.querySelectorAll("p")).find(
    (p) => p.textContent.trim() === "Course Lessons",
  );
  const card = lessonsCard?.closest('div[style*="background-color"]');
  const rows = card ? card.querySelectorAll(".space-y-2 button") : [];
  const checkBig = card ? card.querySelectorAll(".lucide-circle-check-big").length : 0;
  const circles = card ? card.querySelectorAll(".lucide-circle:not(.lucide-circle-check-big)").length : 0;
  const numberedSpans = card ? card.querySelectorAll('span.rounded-\\[9999px\\].text-\\[10px\\]').length : 0;
  out.lessonRows = rows.length;
  out.circleCheckBigIcons = checkBig;
  out.circleIcons = circles;
  out.numberedCircleSpans = numberedSpans;
  // Row 5 (next) icon color, row 6 (later) icon color
  const rowIcons = card ? Array.from(rows).map((r) => {
    const ic = r.querySelector("svg");
    return ic ? getComputedStyle(ic).color : null;
  }) : [];
  out.rowIconColors = rowIcons;
  // "4/6 lessons completed" weight
  const pct = Array.from(document.querySelectorAll("p")).find((p) =>
    p.textContent.includes("lessons completed"),
  );
  out.lessonsCompletedWeight = pct ? getComputedStyle(pct).fontWeight : null;
  // p_ panel: open it and check the All Courses tile radius
  return out;
});
console.log("=== /demo post-fix ===");
console.log(JSON.stringify(demoOut, null, 1));

// p_ tile radius (open the pill)
const pill = page.getByRole("button", { name: /Economics/ }).first();
await pill.click();
await page.waitForTimeout(400);
const tileOut = await page.evaluate(() => {
  const allCourses = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent.trim().startsWith("All Courses"),
  );
  const tile = allCourses?.querySelector("div.rounded-lg, div[class*=rounded]");
  return tile ? { cls: tile.className.slice(0, 50), r: getComputedStyle(tile).borderRadius } : null;
});
console.log("=== p_ All-Courses tile ===");
console.log(JSON.stringify(tileOut));
await page.keyboard.press("Escape");
await ctx.close();

// --- Logged-out /login: backdrop blur ---
const lctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lpage = await lctx.newPage();
await lpage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const blurOut = await lpage.evaluate(() => {
  const card = document.querySelector(".rounded-2xl");
  const cs = card ? getComputedStyle(card) : null;
  return cs ? { backdropFilter: cs.backdropFilter, radius: cs.borderRadius } : null;
});
console.log("=== login card ===");
console.log(JSON.stringify(blurOut));
await lctx.close();

// --- Mobile menu item radius ---
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const mpage = await mctx.newPage();
await mpage.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
await mpage.waitForTimeout(600);
await mpage.locator('button[aria-label="Open menu"]').tap();
await mpage.waitForTimeout(400);
const mOut = await mpage.evaluate(() => {
  const menu = document.querySelector('[role="menu"]');
  const item = menu?.querySelector("button");
  return item ? { r: getComputedStyle(item).borderRadius, w: getComputedStyle(menu.querySelector("p")).fontWeight } : null;
});
console.log("=== mobile menu ===");
console.log(JSON.stringify(mOut));
await mctx.close();
await browser.close();
console.log("VERIFY DONE");
