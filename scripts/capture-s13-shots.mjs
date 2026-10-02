// Session-13 screenshot capture — the course-switch fix (S13-F2): the
// pre/post switch content, the switch-driven streak burst, and the
// mastery-label burst. Standalone server on :3100, demo account (the
// clone's own demo credentials — safe to commit the script).
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3100";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});

const generated = [];
async function freshCourse(topic, score) {
  const gen = await page.request.post(`${BASE}/api/courses/generate`, {
    data: { topic, mode: "topic" },
    timeout: 60_000,
  });
  const id = (await gen.json()).data.courseId;
  generated.push(id);
  await page.request.post(`${BASE}/api/quiz/submit`, {
    data: { courseId: id, answers: [1, 1, 1, 1, 1], total: 5, score },
    timeout: 60_000,
  });
  return id;
}
async function pillSwitch(label, rowText) {
  await page.getByRole("button", { name: label }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole("menu").getByText(rowText, { exact: true }).first().click();
}

// --- 87 + 88: the course-switch content fix (S13-F2) ---
// Mount at the streak-3 course, then pill-switch to the streak-2 course:
// the content UPDATES (the pre-fix code rendered the stale stats).
const high = await freshCourse("Astronomy", 3);
const low = await freshCourse("Botany", 2);
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Astronomy", quizCompleted: true },
});
await page.goto(`${BASE}/?course=${high}`, { waitUntil: "domcontentloaded" });
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/87-course-switch-before.png`, fullPage: false });

await pillSwitch("Astronomy", "Botany");
// The 3→2 switch changes the label (Scholar→Learner) too — one burst rides
// the swap. Wait past the canvas's ~2-3s self-removal for a clean content
// shot (the burst shots are 89/90).
await page.waitForTimeout(4_000);
await page.screenshot({ path: `${OUT}/88-course-switch-after.png`, fullPage: false });

// --- 89: the switch-driven streak burst (S13-F2 — the c_ surface) ---
// Mount at the streak-2 course (ref inits), switch to the streak-3 course
// → min(quizScore,7) crosses EXACTLY 3 → the 80-particle burst.
const two = await freshCourse("Chemistry", 2);
const three = await freshCourse("Drama", 3);
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Chemistry", quizCompleted: true },
});
await page.goto(`${BASE}/?course=${two}`, { waitUntil: "domcontentloaded" });
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(800);
await pillSwitch("Chemistry", "Drama");
await page.locator("canvas").first().waitFor({ timeout: 10_000 });
await page.screenshot({ path: `${OUT}/89-switch-streak-burst.png`, fullPage: false });

// --- 90: the mastery-label burst (S13-F6) ---
// Mount at the 20% (Apprentice) course, switch to the 80% (Expert) course:
// the label change fires the 90-particle burst with NO streak crossing
// (1 → 4).
const app = await freshCourse("Geology", 1);
const exp = await freshCourse("History", 4);
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Geology", quizCompleted: true },
});
await page.goto(`${BASE}/?course=${app}`, { waitUntil: "domcontentloaded" });
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(800);
await pillSwitch("Geology", "History");
await page.locator("canvas").first().waitFor({ timeout: 10_000 });
await page.screenshot({ path: `${OUT}/90-label-burst.png`, fullPage: false });

// Cleanup: remove the generated enrollments + restore the seeded student.
for (const id of generated) {
  await page.request.delete(`${BASE}/api/courses/${id}`);
}
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Economics", quizCompleted: true },
});
await ctx.close();
await browser.close();
console.log("captured 87-90");
