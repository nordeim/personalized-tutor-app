// Session-7 probe: FRESH 0-course user (onboarding state) computed styles at
// 390×844 — apples-to-apples with the live sepnetflix2023 account state.
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Sign up/ }).click();
const stamp = Date.now();
await page.getByLabel("Email").fill(`probe${stamp}@thinkerwell.app`);
await page.getByLabel("Password").fill("Probe1234!");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(`${BASE}/`, { timeout: 20000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

const out = await page.evaluate(() => {
  const pill = document.querySelector("header button");
  const h1 = document.querySelector("h1");
  const modeCard = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent.includes("Build Me a Course"),
  );
  const tag = Array.from(document.querySelectorAll("button")).find((b) =>
    /History/.test(b.textContent),
  );
  const contBtn = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent.trim() === "Continue",
  );
  const cs = (n, props) => {
    if (!n) return null;
    const s = getComputedStyle(n);
    return Object.fromEntries(props.map((p) => [p, s[p]]));
  };
  return JSON.stringify(
    {
      pill: cs(pill, [
        "borderRadius",
        "padding",
        "fontSize",
        "fontWeight",
        "border",
      ]),
      h1: cs(h1, [
        "fontSize",
        "letterSpacing",
        "lineHeight",
        "marginTop",
        "marginBottom",
      ]),
      modeCard: cs(modeCard, [
        "borderRadius",
        "backgroundColor",
        "padding",
        "textAlign",
      ]),
      tag: cs(tag, [
        "borderRadius",
        "padding",
        "fontSize",
        "lineHeight",
        "backgroundColor",
        "height",
      ]),
      contBtn: cs(contBtn, [
        "borderRadius",
        "backgroundColor",
        "padding",
        "fontSize",
        "fontWeight",
      ]),
    },
    null,
    1,
  );
});
console.log(out);
await page.screenshot({ path: "docs/screenshots/57-clone-onboarding-mobile.png" });
await browser.close();
