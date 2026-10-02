// Session-9 screenshots (71+): the never-before-captured level-2/3 lesson
// surfaces, the public Sign In from_url chain, and the unclamped "9/8"
// Lesson Progress terminal state.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();

// Authenticated context (the seeded demo user) for the hub surfaces.
const actx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const apage = await actx.newPage();
const login = await apage.request.post(`${BASE}/api/auth/login`, {
  data: { email: "demo@thinkerwell.app", password: "Demo1234!" },
});
if (!login.ok()) console.error("demo login failed:", login.status());

// 71 — the LEVEL-2 lesson view (?lesson=2): the tan Real-World Scenario
// context card + the generated-title h2 (first runtime capture ever).
await apage.goto(`${BASE}/hub?lesson=2`, { waitUntil: "networkidle" });
await apage.getByText("Real-World Scenario").first().waitFor({ timeout: 45_000 });
await apage.waitForTimeout(600);
await apage.screenshot({ path: "docs/screenshots/71-hub-level2-real-world-card.png" });

// 72 — the LEVEL-3 lesson view (?lesson=4): the lilac Final Boss Challenge
// card.
await apage.goto(`${BASE}/hub?lesson=4`, { waitUntil: "networkidle" });
await apage.getByText("Final Boss Challenge").first().waitFor({ timeout: 45_000 });
await apage.waitForTimeout(600);
await apage.screenshot({ path: "docs/screenshots/72-hub-level3-final-boss-card.png" });

// 74 — the UNCLAMPED Lesson Progress label: drive lesson 2 (index 1, the
// stage boundary) to 8 correct (the fallback content's correctIndex is 0 —
// pick the first option) so the completion fires the Level-Up interstitial
// while the sidebar card reads "9/8" (the live's observed terminal label).
// Timing: the interstitial renders after the 1000 ms reveal + 800 ms
// advance + the progress POST + the boundary's 1200 ms delay — so each
// submit waits for the OUTCOME (next question / retry modal / Level-Up)
// rather than a fixed delay.
await apage.goto(`${BASE}/hub?lesson=1`, { waitUntil: "networkidle" });
await apage.getByText("Lesson 2 · Now").first().waitFor({ timeout: 30_000 });
let levelUpSeen = false;
for (let i = 0; i < 12 && !levelUpSeen; i += 1) {
  const qBefore = await apage.getByRole("heading", { level: 3 }).first().textContent().catch(() => "");
  await apage.locator("button.rounded-\\[14px\\]").first().click();
  await apage.getByRole("button", { name: "Next Question" }).click();
  const outcome = await apage
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        if (text.includes("Level Up!")) return "levelup";
        if (text.includes("Not quite!")) return "retry";
        return false;
      },
      undefined,
      { timeout: 15_000 },
    )
    .then((r) => r.jsonValue())
    .catch(() => "timeout");
  if (outcome === "levelup") {
    levelUpSeen = true;
    break;
  }
  if (outcome === "retry") {
    await apage.getByRole("button", { name: "Skip it" }).click();
    await apage.waitForTimeout(900);
    continue;
  }
  await apage
    .waitForFunction(
      (prev) => {
        const h3 = document.querySelector("h3");
        return h3 && h3.textContent !== prev;
      },
      qBefore,
      { timeout: 8_000 },
    )
    .catch(() => {});
}
await apage.waitForTimeout(500);
await apage.screenshot({ path: "docs/screenshots/74-hub-lesson-progress-9of8.png" });
await actx.close();

// 73 — the public onboarding's desktop Sign In pill now carries from_url
// (S9-F2): click → /login?from_url=%2F (the live's navigateToLogin chain).
const pctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ppage = await pctx.newPage();
await ppage.goto(`${BASE}/`, { waitUntil: "networkidle" });
await ppage.getByRole("button", { name: "Sign In", exact: true }).click();
await ppage.waitForURL(/\/login\?from_url=%2F$/);
await ppage.waitForTimeout(600);
await ppage.screenshot({ path: "docs/screenshots/73-public-signin-from-url.png" });
await pctx.close();

await browser.close();
console.log("session-9 screenshots captured (71-74)");
