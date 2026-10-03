import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AI_BACKED_ROUTES, AI_ROUTE_PATTERN } from "./e2e/ai-routes";

// SESSION-21 (S21-F1) — the pins for the canonical AI route set. The set
// was previously duplicated: tests/e2e-conventions.test.ts carried the
// six-route AI_BACKED_ROUTES array while tests/e2e/shard-plan.ts shipped a
// SEVEN-alternative regex (including quiz/skip) whose comment and pin both
// claimed "the six routes the conventions scanner knows" — the duplication
// drifted within the very session that created it (the exact hazard the
// session-19 handoff's third direction named). The canonical module is the
// single source BOTH scanners import; these pins anchor it to the FILESYSTEM
// (the actual @/lib/ai importers) so the set can never drift from the code
// again — the trap-40 doctrine ("a convention nobody enforces is a
// convention nobody keeps") applied to the route set itself.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Walk src/app/api recursively and return every route.ts's route path
 * (its directory relative to src/app/api, prefixed /api — the App Router
 * convention: one route.ts per route directory). */
function apiRouteFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts") {
        const rel = path.relative(
          path.join(repoRoot, "src", "app", "api"),
          path.dirname(full),
        );
        out.push(`/api/${rel.split(path.sep).join("/")}`);
      }
    }
  };
  walk(path.join(repoRoot, "src", "app", "api"));
  return out.sort();
}

describe("the canonical AI route set (S21-F1)", () => {
  it("is exactly the routes whose handlers import @/lib/ai (the filesystem authority)", () => {
    // The set is not a hand-maintained list — it IS the @/lib/ai importers.
    // A new AI-backed route (or a route dropping its AI import) fails this
    // pin until AI_BACKED_ROUTES is updated, which is the point: the set
    // and the code cannot drift apart silently.
    const aiImporters = apiRouteFiles().filter((route) => {
      // "/api/chat" → src/app/api/chat/route.ts (route paths are App Router
      // directory paths under src/app — the leading /api is the folder name)
      const file = path.join(repoRoot, "src", "app", route.slice(1), "route.ts");
      return readFileSync(file, "utf8").includes('@/lib/ai"');
    });
    expect(aiImporters.sort()).toEqual([...AI_BACKED_ROUTES].sort());
    expect(aiImporters).toHaveLength(6);
  });

  it("deliberately excludes /api/quiz/skip (the clone skips the live's discarded LLM call)", () => {
    // The live's skip ALSO fires an LLM roadmap call its own code discards
    // (the enrollment write ships empty strings) — the wasted call is the
    // live's bug, not a contract; the clone skips it (session-11 S11-F5).
    // Excluded from the set AND from the pattern — counting a quiz/skip
    // mention at the 45s AI budget would inflate the shard-plan weight for
    // a route that makes NO AI call.
    expect(AI_BACKED_ROUTES).not.toContain("/api/quiz/skip");
    expect(AI_ROUTE_PATTERN.test("/api/quiz/skip")).toBe(false);
  });

  it("derives the pattern from the set — mutual consistency, no orphan alternatives", () => {
    // Every route in the set matches the pattern...
    for (const r of AI_BACKED_ROUTES) {
      expect(AI_ROUTE_PATTERN.test(r)).toBe(true);
    }
    // ...and the pattern's alternation carries exactly the set's
    // alternatives (an orphan alternative — like the drifted quiz/skip —
    // fails this equality). NOTE: RegExp.prototype.source escapes "/" as
    // "\/" (the constructor normalizes the input string to the literal
    // form's serialization) — unescape before comparing.
    const group = AI_ROUTE_PATTERN.source.match(/\(([^()]*)\)$/);
    expect(group).not.toBeNull();
    expect(group![1].split("|").map((a) => a.replace(/\\\//g, "/")).sort()).toEqual(
      AI_BACKED_ROUTES.map((r) => r.slice("/api/".length)).sort(),
    );
  });

  it("carries NO /g flag (a stateful lastIndex would corrupt repeated .test())", () => {
    expect(AI_ROUTE_PATTERN.flags).toBe("");
    // behavioral proof: the same route matches on consecutive calls
    const route = AI_BACKED_ROUTES[0];
    expect(AI_ROUTE_PATTERN.test(route)).toBe(true);
    expect(AI_ROUTE_PATTERN.test(route)).toBe(true);
  });
});
