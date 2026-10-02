// Session-12 screenshot capture — the dashboard-confetti port, the
// ChevronRight CTA, the quiz surface post-cleanup, and the clone's working
// mobile menu (the prompt's headline). Dev server on :3000, demo account
// (the clone's own demo credentials — safe to commit the script).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

const browser = await chromium.launch();

// ---------- Desktop (1440×900) ----------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});

// 83 — the dashboard with the ChevronRight trailing CTA icon (S12-F3):
// the seeded Economics course surface, full page.
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/83-dashboard-hub-cta-chevron.png`, fullPage: false });

// 84 — the streak-confetti burst (S12-F2): mount at score 2, submit 3,
// refresh via the rename flow → the 80-particle burst mid-flight.
const gen = await page.request.post(`${BASE}/api/courses/generate`, {
  data: { topic: "Astronomy", mode: "topic" },
});
const courseId = (await gen.json()).data.courseId;
await page.request.post(`${BASE}/api/quiz/submit`, {
  data: { courseId, answers: [1, 1, 1, 1, 1], total: 5, score: 2 },
});
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Economics", quizCompleted: true },
});
await page.goto(`${BASE}/?course=${courseId}`, { waitUntil: "domcontentloaded" });
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(800);
await page.request.post(`${BASE}/api/quiz/submit`, {
  data: { courseId, answers: [1, 1, 1, 1, 1], total: 5, score: 3 },
});
await page.getByRole("button", { name: /Demo Learner/ }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /Update Preferences/ }).click();
await page.waitForTimeout(300);
await page.locator("#pref-name-input").fill("Demo Learner");
await page.getByRole("button", { name: /^Save Changes$/ }).click();
await page.locator("canvas").first().waitFor({ timeout: 10_000 });
await page.waitForTimeout(350); // mid-burst
await page.screenshot({ path: `${OUT}/84-dashboard-streak-confetti.png`, fullPage: false });

// cleanup the generated course
await page.request.delete(`${BASE}/api/courses/${courseId}`);
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Economics", quizCompleted: true },
});

// 85 — the quiz surface post-S12-cleanup (no mid-quiz confetti; the
// next/image star wrapper): fresh course → pick → confirm → reveal.
const gen2 = await page.request.post(`${BASE}/api/courses/generate`, {
  data: { topic: "Botany", mode: "topic" },
});
const courseId2 = (await gen2.json()).data.courseId;
await page.goto(`${BASE}/quiz?course=${courseId2}`, { waitUntil: "domcontentloaded" });
await page.locator("button:has-text('A.')").first().waitFor({ timeout: 60_000 });
await page.locator("button:has-text('A.')").first().click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: /^Confirm$/, exact: true }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/85-quiz-surface-post-s12.png`, fullPage: false });
await page.request.delete(`${BASE}/api/courses/${courseId2}`);
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Economics", quizCompleted: true },
});
await ctx.close();

// ---------- Mobile (390×844, hasTouch) — the headline's proof ----------
const mob = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const mpage = await mob.newPage();
await mpage.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});
await mpage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await mpage.getByText("Course Progress").waitFor({ timeout: 15_000 });
await mpage.waitForTimeout(1200);

// 86 — the mobile menu OPEN (the real tap the live cannot perform)
await mpage.tap("button[aria-label='Open menu']");
await mpage.waitForTimeout(700);
await mpage.screenshot({ path: `${OUT}/86-mobile-menu-open.png`, fullPage: false });

console.log("screenshots 83-86 captured");
await browser.close();
