// Session-41 paired clone probe (v2.14 survey): boots the production
// standalone server as a child process (the sandbox kills background
// processes between shell invocations, so server + probes must share one
// process tree), signs the demo user in once via a real page login, then
// re-measures every surface pinned by the v2.13 survey so the numbers can
// be compared 1:1 against the live reference probe.
import { chromium } from "/home/z/my-project/project-management/node_modules/@playwright/test/index.mjs";
import { spawn } from "node:child_process";

const BASE = "http://localhost:3000";
const ROOT = "/home/z/my-project/project-management";

// ---- 1. boot the production server (explicit env: the shell trap) ----
const server = spawn("bun", [".next/standalone/server.js"], {
  cwd: ROOT,
  env: { ...process.env, DATABASE_URL: "file:../db/custom.db", NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

async function waitForHealth() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      /* retry until the 40-attempt/500ms window elapses — not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
if (!(await waitForHealth())) {
  console.error("SERVER FAILED TO BOOT:\n" + serverLog);
  server.kill();
  process.exit(1);
}
console.log("server: up on :3000");

// ---- 2. login once (page-based; fresh rate limiter) ----
const browser = await chromium.launch();
const loginCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const lp = await loginCtx.newPage();
await lp.goto(BASE + "/login", { waitUntil: "networkidle" });
await lp.fill('input[id="email"]', "demo@orbital.app");
await lp.fill('input[id="password"]', "Demo1234!");
await lp.click('button[type="submit"]');
await lp.waitForURL(BASE + "/", { timeout: 20_000 });
const cookies = await loginCtx.cookies(BASE);
const session = cookies.find((c) => c.name === "orbital_session");
if (!session) throw new Error("no orbital_session cookie after login");
await loginCtx.close();
console.log("login: ok");

async function probe(viewport, path, fn) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addCookies([{ name: "orbital_session", value: session.value, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  const result = await fn(page);
  await ctx.close();
  return result;
}

const out = {};

// ---- 3. mobile 390: tab bar + app bar census ----
out.mobile390 = await probe({ width: 390, height: 844 }, "/", async (page) =>
  page.evaluate(() => {
    const o = {};
    const hdr = document.querySelector("header");
    if (hdr) {
      const r = hdr.getBoundingClientRect();
      const cs = getComputedStyle(hdr);
      o.appbar = {
        rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10),
        radius: cs.borderRadius, pad: cs.padding,
      };
    }
    const tabnav = [...document.querySelectorAll("nav")].find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 300 && r.y > 600 && getComputedStyle(n).display !== "none";
    });
    if (!tabnav) { o.tabbar = "NOT FOUND"; return o; }
    const nb = tabnav.getBoundingClientRect();
    const ncs = getComputedStyle(tabnav);
    o.tabbar = {
      rect: [nb.x, nb.y, nb.width, nb.height].map((v) => Math.round(v * 10) / 10),
      radius: ncs.borderRadius, z: ncs.zIndex,
    };
    o.tabs = [...tabnav.querySelectorAll("button,a")].map((el) => {
      const r = el.getBoundingClientRect();
      const svg = el.querySelector("svg");
      const chip = el.querySelector("div,span");
      return {
        tag: el.tagName, href: el.getAttribute("href") || null,
        rect: [r.width, r.height].map((v) => Math.round(v * 10) / 10),
        label: (el.textContent || "").trim(),
        glyph: svg ? (svg.getAttribute("class") || "").match(/lucide-([a-z-]+)/)?.[1] : null,
        stroke: svg ? getComputedStyle(svg).strokeWidth : null,
        glyphSize: svg ? Math.round(svg.getBoundingClientRect().width) : null,
        chipBg: chip ? getComputedStyle(chip).backgroundColor : null,
        chipRadius: chip ? getComputedStyle(chip).borderRadius : null,
      };
    });
    return o;
  })
);

// ---- 4. MORE sheet: open, census, navigate ----
out.moreSheet = await probe({ width: 390, height: 844 }, "/", async (page) => {
  await page.getByRole("button", { name: "More" }).click();
  await page.waitForTimeout(800);
  const census = await page.evaluate(() => {
    const overlay = [...document.querySelectorAll("div")].find((d) => {
      const cs = getComputedStyle(d);
      return cs.position === "fixed" && parseFloat(cs.zIndex) === 200 && cs.display !== "none" && d.getBoundingClientRect().width > 300;
    });
    const panel = [...document.querySelectorAll("div")].find((d) => {
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return cs.position === "fixed" && parseFloat(cs.zIndex) === 201 && r.width > 300 && cs.display !== "none";
    });
    if (!overlay || !panel) return { overlay: !!overlay, panel: !!panel };
    const r = panel.getBoundingClientRect();
    const cs = getComputedStyle(panel);
    return {
      overlay: { z: getComputedStyle(overlay).zIndex, bg: getComputedStyle(overlay).backgroundColor },
      panel: {
        rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10),
        radius: cs.borderRadius, pad: cs.padding, z: cs.zIndex,
      },
      rows: [...panel.querySelectorAll("a")].map((a) => a.getAttribute("href")),
    };
  });
  // navigate via the Tasks row
  await page.evaluate(() => {
    const panel = [...document.querySelectorAll("div")].find((d) => {
      const cs = getComputedStyle(d);
      return cs.position === "fixed" && parseFloat(cs.zIndex) === 201;
    });
    panel.querySelector('a[href="/tasks"]').click();
  });
  await page.waitForTimeout(1200);
  census.navUrl = new URL(page.url()).pathname;
  census.navH1 = await page.evaluate(() => document.querySelector("h1")?.textContent);
  return census;
});

// ---- 5. 768 pill nav census ----
out.pill768 = await probe({ width: 768, height: 1024 }, "/", async (page) =>
  page.evaluate(() => {
    const pill = [...document.querySelectorAll("nav,div")].find((n) => {
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      return r.width > 400 && r.width < 600 && r.y > 800 && parseFloat(cs.zIndex) === 100 && cs.display !== "none";
    });
    if (!pill) return "PILL NOT FOUND";
    const r = pill.getBoundingClientRect();
    const cs = getComputedStyle(pill);
    return {
      rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10),
      z: cs.zIndex, radius: cs.borderRadius, pad: cs.padding, gap: cs.gap,
      chips: [...pill.querySelectorAll("a")].map((a) => {
        const chip = a.querySelector("div,span");
        return [a.getAttribute("href"), (a.textContent || "").trim(), chip ? getComputedStyle(chip).minWidth : null, chip ? getComputedStyle(chip).borderRadius : null];
      }),
    };
  })
);

// ---- 6. desktop 1440: sidebar + New Goal pill + user pill + h1 ----
out.desktop = await probe({ width: 1440, height: 900 }, "/", async (page) =>
  page.evaluate(() => {
    const o = {};
    const aside = document.querySelector("aside");
    if (aside) {
      const r = aside.getBoundingClientRect();
      const cs = getComputedStyle(aside);
      o.aside = {
        rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10),
        radius: cs.borderRadius, pos: cs.position,
        navRows: [...aside.querySelectorAll("nav a")].slice(0, 6).map((a) => {
          const ar = a.getBoundingClientRect();
          return [a.getAttribute("href"), Math.round(ar.height)];
        }),
      };
    }
    const ng = [...document.querySelectorAll("button, a")].find((b) => (b.textContent || "").trim().toUpperCase().replace(/\s+/g, " ").startsWith("NEW GOAL") && b.getBoundingClientRect().width > 50);
    if (ng) {
      const r = ng.getBoundingClientRect();
      const cs = getComputedStyle(ng);
      o.newGoalPill = { tag: ng.tagName, rect: [r.width, r.height].map((v) => Math.round(v * 10) / 10), radius: cs.borderRadius, pad: cs.padding, fs: cs.fontSize, fw: cs.fontWeight };
    }
    const pill = [...document.querySelectorAll("header button, header [role=button], header div")].filter((e) => e.getBoundingClientRect().width > 80 && e.getBoundingClientRect().height > 30 && e.children.length >= 1 && (e.textContent || "").trim().length > 0 && (e.textContent || "").trim().length < 30 && !(e.textContent || "").trim().toUpperCase().startsWith("NEW GOAL") && !(e.textContent || "").trim().toUpperCase().startsWith("LOG")).pop();
    if (pill) {
      const r = pill.getBoundingClientRect();
      const cs = getComputedStyle(pill);
      o.userPill = { tag: pill.tagName, text: (pill.textContent || "").trim().slice(0, 12), rect: [r.width, r.height].map((v) => Math.round(v * 10) / 10), radius: cs.borderRadius, pad: cs.padding };
    }
    o.h1 = document.querySelector("h1")?.textContent;
    return o;
  })
);

// ---- 7. wizard deep link ----
out.wizard = await probe({ width: 1440, height: 900 }, "/goals?new=true", async (page) =>
  page.evaluate(() => {
    const scrim = [...document.querySelectorAll("div")].find((d) => {
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return cs.position === "fixed" && r.width > 600 && parseFloat(cs.zIndex) >= 90 && cs.display !== "none" && r.height > 300;
    });
    if (!scrim) return "WIZARD NOT FOUND";
    const panel = [...scrim.querySelectorAll("div")].find((d) => {
      const r = d.getBoundingClientRect();
      return r.width > 500 && r.width < 800 && getComputedStyle(d).display !== "none";
    });
    const pr = panel.getBoundingClientRect();
    const pcs = getComputedStyle(panel);
    return {
      scrimZ: getComputedStyle(scrim).zIndex, scrimBg: getComputedStyle(scrim).backgroundColor, scrimDisplay: getComputedStyle(scrim).display,
      panel: [Math.round(pr.x), Math.round(pr.y), Math.round(pr.width), Math.round(pr.height)],
      panelRadius: pcs.borderRadius, panelPad: pcs.padding,
    };
  })
);

// ---- 8. activity pill ----
out.activityPill = await probe({ width: 1440, height: 900 }, "/activity", async (page) =>
  page.evaluate(() => {
    const pill = [...document.querySelectorAll("div,p")].find((e) => e.children.length >= 2 && (e.textContent || "").replace(/\s+/g, " ").trim().startsWith("Online"));
    if (!pill) return "PILL NOT FOUND";
    const r = pill.getBoundingClientRect();
    const cs = getComputedStyle(pill);
    return {
      tag: pill.tagName, rect: [r.width, r.height].map((v) => Math.round(v * 10) / 10),
      pad: cs.padding, gap: cs.gap,
      kids: [...pill.children].map((c) => [(c.textContent || "").trim().slice(0, 10), Math.round(c.getBoundingClientRect().width * 10) / 10]),
    };
  })
);

// ---- 9. view h1s ----
out.viewH1s = {};
for (const p of ["goals", "my-tasks", "tasks", "activity", "team", "settings"]) {
  out.viewH1s[p] = await probe({ width: 1440, height: 900 }, "/" + p, async (page) =>
    page.evaluate(() => document.querySelector("h1")?.textContent)
  );
}

// ---- 10. login card (fresh logged-out context) + F13 (authed /login) ----
const loCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const loPage = await loCtx.newPage();
await loPage.goto(BASE + "/login", { waitUntil: "networkidle" });
await loPage.evaluate(() => document.fonts.ready);
await loPage.waitForTimeout(800);
out.loginCard = await loPage.evaluate(() => {
  const card = [...document.querySelectorAll("div")].find((d) => {
    const r = d.getBoundingClientRect();
    const cs = getComputedStyle(d);
    return r.width > 400 && r.width < 500 && r.height > 600 && r.height < 800 && cs.display !== "none" && parseFloat(cs.borderRadius) > 10;
  });
  if (!card) return "CARD NOT FOUND";
  const r = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  return { rect: [Math.round(r.width), Math.round(r.height)], radius: cs.borderRadius, backdrop: cs.backdropFilter };
});
await loCtx.close();

out.f13 = await probe({ width: 1440, height: 900 }, "/login", async (page) =>
  page.evaluate(() => location.pathname + " | card: " + !!document.querySelector('input[type=email], input[name=email]'))
);

// ---- 11. add-task dialog (v2.10 generation) ----
out.addTaskDialog = await probe({ width: 1440, height: 900 }, "/goals", async (page) => {
  await page.getByRole("link", { name: /Product Onboarding Redesign/ }).first().click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Add Task", exact: true }).first().click();
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const scrim = [...document.querySelectorAll("div")].find((d) => {
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return cs.position === "fixed" && parseFloat(cs.zIndex) === 200 && r.width > 800 && r.height > 300 && cs.display !== "none" && cs.display === "flex";
    });
    if (!scrim) return "SCRIM NOT FOUND";
    const panel = [...scrim.querySelectorAll("div")].find((d) => {
      const r = d.getBoundingClientRect();
      return r.width > 400 && r.width < 600 && r.height > 200 && getComputedStyle(d).display !== "none" && parseFloat(getComputedStyle(d).borderRadius) >= 19;
    });
    if (!panel) return "PANEL NOT FOUND";
    const r = panel.getBoundingClientRect();
    const cs = getComputedStyle(panel);
    return {
      panel: [Math.round(r.width), Math.round(r.height)], radius: cs.borderRadius, pad: cs.padding,
      scrimZ: getComputedStyle(scrim).zIndex, scrimBg: getComputedStyle(scrim).backgroundColor,
      scrimDisplay: getComputedStyle(scrim).display,
    };
  });
});

console.log(JSON.stringify(out, null, 1));

await browser.close();
server.kill();
process.exit(0);
