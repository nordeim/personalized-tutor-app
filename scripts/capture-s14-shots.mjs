// Session-14 screenshot capture — the remediated build: the fresh
// authenticated dashboard, the course-switch flow, the ISOLATED streak
// burst (score 6→7, total 7 — the S14-F6 drive), and the /hub MOBILE tab
// shell at 390×844 (the session-13 handoff's suggested surface).
// Standalone server on :3100, demo account (the clone's own demo
// credentials — safe to commit the script).
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
async function freshCourse(topic, score, total = 5) {
  const gen = await page.request.post(`${BASE}/api/courses/generate`, {
    data: { topic, mode: "topic" },
    timeout: 60_000,
  });
  const id = (await gen.json()).data.courseId;
  generated.push(id);
  await page.request.post(`${BASE}/api/quiz/submit`, {
    data: { courseId: id, answers: [1, 1, 1, 1, 1], total, score },
    timeout: 60_000,
  });
  return id;
}
async function pillSwitch(label, rowText) {
  await page.getByRole("button", { name: label }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole("menu").getByText(rowText, { exact: true }).first().click();
}

// --- 91: the fresh authenticated dashboard (the remediated build) ---
const s6 = await freshCourse("Astronomy", 6, 7);
await freshCourse("Botany", 7, 7);
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Astronomy", quizCompleted: true },
});
await page.goto(`${BASE}/?course=${s6}`, { waitUntil: "domcontentloaded" });
await page.getByText("Course Progress").waitFor({ timeout: 15_000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/91-remediated-dashboard.png`, fullPage: false });

// --- 92: the ISOLATED streak burst (S14-F6 — score 6→7, total 7) ---
// Mount at the streak-6 (Master) course — no canvas (both refs init).
// Switch to the streak-7 course: the ONLY possible firing effect is the
// 80-particle exact-7 streak burst (the label stays Master→Master).
await page.waitForTimeout(600);
await pillSwitch("Astronomy", "Botany");
// poll for the canvas to appear, then shoot mid-flight
let canvases = 0;
for (let i = 0; i < 40; i += 1) {
  canvases = await page.locator("canvas").count();
  if (canvases > 0) break;
  await page.waitForTimeout(200);
}
if (canvases > 0) {
  await page.screenshot({ path: `${OUT}/92-isolated-streak-burst.png`, fullPage: false });
  console.log("burst captured mid-flight");
} else {
  await page.screenshot({ path: `${OUT}/92-isolated-streak-burst.png`, fullPage: false });
  console.log("WARN: no canvas observed — shot captured anyway");
}

// --- 93: the course-switch content (post-switch, the remediated state) ---
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/93-course-switch-remediated.png`, fullPage: false });

// --- 94: the /hub MOBILE tab shell (390×844 — the handoff's suggestion) ---
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const mpage = await mctx.newPage();
await mpage.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});
await mpage.goto(`${BASE}/hub`, { waitUntil: "domcontentloaded" });
await mpage.waitForTimeout(2500);
await mpage.screenshot({ path: `${OUT}/94-hub-mobile-tabs.png`, fullPage: false });
// tap the "Ask Nori" tab — the mobile chat surface
try {
  const tab = mpage.getByText(/Ask Nori|Ask/i).first();
  await tab.tap({ timeout: 5000 });
  await mpage.waitForTimeout(800);
  await mpage.screenshot({ path: `${OUT}/95-hub-mobile-ask-nori.png`, fullPage: false });
} catch (e) {
  console.log("WARN: Ask Nori tab tap failed:", String(e).slice(0, 120));
}

// --- cleanup (the e2e pattern: delete the generated enrollments + restore) ---
for (const id of generated) {
  await page.request.delete(`${BASE}/api/courses/${id}`);
}
await page.request.put(`${BASE}/api/student`, {
  data: { currentSubject: "Economics", quizCompleted: true },
});

await ctx.close();
await mctx.close();
await browser.close();
console.log("CAPTURE COMPLETE");
