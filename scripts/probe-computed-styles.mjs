// Session-7 clone-side probe: onboarding dashboard computed styles (390×844)
// to diff against the live capture. Mirrors the live probe's element picks.
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
await page.getByLabel("Email").fill("demo@thinkerwell.app");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(`${BASE}/`, { timeout: 15000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500); // typewriter settles

const out = await page.evaluate(() => {
  const pill = document.querySelector("header button");
  const h1 = document.querySelector("h1");
  const modeCard = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent.includes("Build Me a Course"),
  );
  const tag = Array.from(document.querySelectorAll("button")).find((b) =>
    /History/.test(b.textContent),
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
        "backgroundColor",
        "fontSize",
        "fontWeight",
        "border",
        "boxShadow",
      ]),
      h1: cs(h1, [
        "fontSize",
        "fontWeight",
        "letterSpacing",
        "lineHeight",
        "color",
        "marginBottom",
        "marginTop",
      ]),
      modeCard: cs(modeCard, [
        "borderRadius",
        "backgroundColor",
        "padding",
        "textAlign",
        "boxShadow",
      ]),
      tag: cs(tag, [
        "borderRadius",
        "padding",
        "fontSize",
        "lineHeight",
        "backgroundColor",
        "height",
        "width",
      ]),
    },
    null,
    1,
  );
});
console.log(out);
await browser.close();
