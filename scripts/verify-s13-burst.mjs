// Same-state burst verification (the session-12 method): baseline shot of
// the streak-2 course view, then the SAME physical switch sequence — the
// only delta between the shots is the confetti burst in flight.
import { chromium } from "@playwright/test";
import sharp from "sharp";
const BASE = "http://localhost:3100";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "demo@thinkerwell.app", password: "Demo1234!" } });
const gen = (t) => page.request.post(`${BASE}/api/courses/generate`, { data: { topic: t, mode: "topic" }, timeout: 60_000 });
const two = (await (await gen("Physics")).json()).data.courseId;
const three = (await (await gen("Poetry")).json()).data.courseId;
await page.request.post(`${BASE}/api/quiz/submit`, { data: { courseId: two, answers: [1,1,1,1,1], total: 5, score: 2 }, timeout: 60_000 });
await page.request.post(`${BASE}/api/quiz/submit`, { data: { courseId: three, answers: [1,1,1,1,1], total: 5, score: 3 }, timeout: 60_000 });
await page.request.put(`${BASE}/api/student`, { data: { currentSubject: "Physics", quizCompleted: true } });
// Baseline: the streak-2 course view (pre-switch — no canvas).
await page.goto(`${BASE}/?course=${two}`);
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(1_200);
await page.screenshot({ path: "/tmp/s13-burst-baseline.png" });
// The switch: streak 2→3 → the 80-particle burst.
await page.getByRole("button", { name: "Physics" }).first().click();
await page.waitForTimeout(400);
await page.getByRole("menu").getByText("Poetry", { exact: true }).first().click();
await page.locator("canvas").first().waitFor({ timeout: 10_000 });
await page.screenshot({ path: "/tmp/s13-burst-live.png" });
await page.request.delete(`${BASE}/api/courses/${two}`);
await page.request.delete(`${BASE}/api/courses/${three}`);
await page.request.put(`${BASE}/api/student`, { data: { currentSubject: "Economics", quizCompleted: true } });
await ctx.close(); await browser.close();

// Diff: the burst shot vs the baseline — count pixels matching the confetti
// triple (#FFFD73 / #C8AEFF / #0F0E0E-over-light) that appear in the burst
// shot but not the baseline.
const a = (await sharp("/tmp/s13-burst-baseline.png").raw().toBuffer({ resolveWithObject: true })).data;
const b = (await sharp("/tmp/s13-burst-live.png").raw().toBuffer({ resolveWithObject: true })).data;
let burst = 0;
for (let i = 0; i < a.length; i += 4) {
  const [r, g, bl] = [b[i], b[i + 1], b[i + 2]];
  const changed = Math.abs(r - a[i]) > 30 || Math.abs(g - a[i + 1]) > 30 || Math.abs(bl - a[i + 2]) > 30;
  const confetti =
    (Math.abs(r - 255) < 50 && Math.abs(g - 253) < 50 && bl > 50 && bl < 210) ||
    (Math.abs(r - 200) < 60 && Math.abs(g - 174) < 60 && Math.abs(bl - 255) < 50) ||
    (r < 50 && g < 50 && bl < 50);
  if (changed && confetti) burst++;
}
console.log("burst-particle pixels (live vs baseline):", burst);
