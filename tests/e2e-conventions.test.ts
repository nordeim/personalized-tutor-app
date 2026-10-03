import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AI_BACKED_ROUTES } from "./e2e/ai-routes";
import { AI_SPEC_REQUEST_TIMEOUT_MS } from "./e2e/ai-budget";

// SESSION-15 conventions pin (S15-F1) — trap 40's doctrine applied to the
// test suite itself: "a convention nobody enforces is a convention nobody
// keeps." Trap 39 (SKILL §9) says every page.request call to an AI-backed
// route must carry an explicit `timeout: 60_000` — Playwright's request
// default is 30s while the AI seam budgets 45s, so a reachable-but-slow
// LLM aborts the call mid-test (the suite only passes in fast-fail
// sandboxes where the SDK 429s into the fallbacks instantly). Session-13
// applied the convention to the specs it touched; this pin makes it
// self-enforcing for every spec, present and future.
// SESSION-23 (S23-F1): the exact-value check compares against the CANONICAL
// constant (tests/e2e/ai-budget.ts — imported above), never a local literal;
// the budget family's mutual-consistency pins live in tests/ai-budget.test.ts
// (the weight mirror + the headroom invariant).

//
// SESSION-21 (S21-F1): the route set is the CANONICAL module
// ./e2e/ai-routes.ts (imported above) — previously this local array and
// the shard-plan's regex were DUPLICATED copies that drifted (the
// shard-plan picked up a seventh alternative, quiz/skip, this scanner
// deliberately excludes). The set is filesystem-pinned against the
// @/lib/ai importers in tests/ai-routes.test.ts. /api/quiz/skip is NOT
// in the set: the clone skips the live's discarded LLM call (the
// documented session-11 fix).

type Call = {
  file: string;
  line: number;
  route: string | null;
  timeoutMs: number | null;
};

/** Walk the argument region of one call, tracking string literals and
 * comments so a paren inside a string/comment cannot corrupt the
 * balanced-paren count. Returns the region's text. */
function regionOf(source: string, open: number): string {
  let depth = 0;
  let inStr: string | null = null; // the active quote char
  let i = open;
  while (i < source.length) {
    const ch = source[i];
    if (inStr) {
      if (ch === "\\") i++; // skip the escaped char
      else if (ch === inStr) inStr = null;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
    } else if (ch === "/" && source[i + 1] === "/") {
      // line comment: skip to EOL (its parens do not count)
      while (i < source.length && source[i] !== "\n") i++;
    } else if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i++;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
    i++;
  }
  return source.slice(open, i); // unterminated (malformed) — tolerate
}

/** Extract every `page.request.<method>(…)` call: the region spans the
 * method's opening paren to its matching close, so the `timeout:` check
 * is attributed to exactly the right call (NOT a line window — a window
 * can mis-attribute, the audit's own false positive on the register
 * block). */
function extractRequestCalls(source: string, file: string): Call[] {
  const calls: Call[] = [];
  const re = /page\.request\.(?:post|get|put|delete|patch|head)\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const open = m.index + m[0].length - 1;
    const region = regionOf(source, open);
    const routeMatch = region.match(/["'`](\/api\/[a-zA-Z0-9\-/[\]_.]+)["'`]/);
    const route = routeMatch ? routeMatch[1] : null;
    const timeoutMatch = region.match(/timeout\s*:\s*([\d_]+)/);
    const timeoutMs = timeoutMatch ? Number(timeoutMatch[1].replace(/_/g, "")) : null;
    const line = source.slice(0, m.index).split("\n").length;
    calls.push({ file, line, route, timeoutMs });
  }
  return calls;
}

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.join(testsDir, "e2e");

function specFiles(): string[] {
  return readdirSync(e2eDir)
    .filter((f) => f.endsWith(".spec.ts"))
    .sort();
}

function allCalls(): Call[] {
  const out: Call[] = [];
  for (const f of specFiles()) {
    const src = readFileSync(path.join(e2eDir, f), "utf-8");
    out.push(...extractRequestCalls(src, f));
  }
  // The shared fixture helpers (once extracted) carry the convention for
  // every migrated call site — they comply by the same rule.
  const helperPath = path.join(e2eDir, "helpers.ts");
  if (existsSync(helperPath)) {
    out.push(...extractRequestCalls(readFileSync(helperPath, "utf-8"), "helpers.ts"));
  }
  return out;
}

function aiBacked(calls: Call[]): Call[] {
  return calls.filter(
    (c) =>
      c.route !== null && AI_BACKED_ROUTES.some((r) => c.route === r || c.route!.startsWith(r)),
  );
}

describe("the trap-39 e2e conventions (S15-F1)", () => {
  it("every AI-backed request-level call carries an explicit timeout (Playwright's 30s default < the 45s AI budget)", () => {
    const offenders = aiBacked(allCalls()).filter((c) => c.timeoutMs === null);
    expect(
      offenders.map((c) => `${c.file}:${c.line} ${c.route}`),
      "AI-backed page.request calls missing a timeout (trap 39)",
    ).toEqual([]);
  });

  it("the scanner finds AI-backed calls at all (a scanner that matches nothing pins nothing — trap 40's own lesson)", () => {
    expect(aiBacked(allCalls()).length).toBeGreaterThan(0);
  });

  it("the timeout value is the trap-39 convention itself (the canonical constant)", () => {
    const offenders = aiBacked(allCalls()).filter(
      (c) => c.timeoutMs !== null && c.timeoutMs !== AI_SPEC_REQUEST_TIMEOUT_MS,
    );
    expect(
      offenders.map((c) => `${c.file}:${c.line} timeout ${c.timeoutMs}`),
      "AI-backed page.request calls whose timeout is not the canonical convention value",
    ).toEqual([]);
  });
});
