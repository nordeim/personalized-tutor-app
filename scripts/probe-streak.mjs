import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/demo", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const out = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll("p, span, div"));
  const label = els.find((e) => e.textContent.trim() === "Study Streak");
  const card = label?.closest('div[style*="background-color"]');
  if (!card) return "not found";
  const grid = card.querySelector(".justify-between");
  const cells = grid
    ? Array.from(grid.children).map((c) => {
        const cell = c.firstElementChild;
        const cs = getComputedStyle(cell);
        const letter = c.lastElementChild?.textContent;
        return [
          letter,
          cell.textContent.slice(0, 4) || "SVG",
          cell.className.slice(0, 100),
          cs.backgroundColor,
          cs.borderRadius,
          cs.width,
          cs.fontSize,
          cs.fontWeight,
        ].join(" | ");
      })
    : ["NO GRID"];
  const streakNum = card.querySelector(".text-4xl");
  return (
    "STREAK NUM: " +
    (streakNum ? streakNum.className + " | " + getComputedStyle(streakNum).fontWeight : "none") +
    "\n" +
    cells.join("\n")
  );
});
console.log(out);
await browser.close();
