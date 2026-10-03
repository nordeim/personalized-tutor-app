// SESSION-19 (S19-F2) — the balanced-shard plan derivation. PURE: strings
// and numbers in, per-shard file groups out — no I/O, unit-pinned in
// tests/shard-plan.test.ts. Consumed by scripts/e2e-sharded.mjs, which
// feeds it playwright's own --list enumeration (the spec inventory + the
// per-file test counts) plus the spec sources (the AI-route mention scan).
//
// WHY a plan: playwright's `--shard=k/N` splits by test COUNT, contiguous
// in file order — measured on this suite that lands 17 of the 22 direct
// AI-route request-level calls in one shard (session11:3 + session12:8 +
// session13:5 + session10-parity:1) while another carries ~1. In the
// reachable-but-slow LLM regime (the documented 12-15 min serial case)
// every AI call budgets AI_TIMEOUT_MS = 45s, so the heavy shard alone
// approaches the full serial wall clock while the others idle — the
// parallel harness degenerates. The plan assigns WHOLE FILES to shards by
// LPT (largest-processing-time-first greedy bin-packing) over an AI-weight
// cost model, spreading the slow domain across the shards instead.
//
// The cost model: weight = aiMentions * 45 + testCount — an approximation
// of the file's worst-case seconds (each AI-route mention ≈ one 45s call;
// each test ≈ 1s of non-AI ballast). KNOWN LIMITATION (documented): the
// static mention scan undercounts UI-driven AI flows (specs that mount
// /hub or /quiz surfaces, or drive the chat/challenge UI, without naming
// the route path — each contributes 1-2 uncounted calls, bounded and
// spread across files; the ballast term keeps the assignment robust).
// The wrapper prints the full weight table + the resulting plan for
// inspection on every run.

import { AI_ROUTE_PATTERN } from "./ai-routes";
// SESSION-21 (S21-F1): the AI route matcher lives in ./ai-routes.ts — the
// CANONICAL set both scanners import (the conventions scanner's
// AI_BACKED_ROUTES array + this pattern were previously duplicated and
// DRIFTED: the local regex carried a seventh alternative, quiz/skip, a
// route that makes NO AI call in the clone — the session-11 fix). The set
// is filesystem-pinned (tests/ai-routes.test.ts — the @/lib/ai importers).

/** The slow-regime per-AI-call budget, in seconds (mirrors AI_TIMEOUT_MS in
 *  src/lib/ai.ts). The relationship is PINNED in tests/ai-budget.test.ts
 *  (the weight-mirror mutual-consistency pin) — this module deliberately
 *  does NOT import @/lib/ai: the e2e-sharded wrapper loads it at runtime
 *  where the `server-only` package does not exist (trap 48). */
export const AI_WEIGHT_SECONDS = 45;

/** One planned spec file: its test count (from playwright's --list) and
 *  its AI-route mention count (from the source scan). */
export type SpecFile = {
  file: string;
  tests: number;
  aiMentions: number;
};

/** The worst-case-seconds cost model (see the module header). */
export function specWeight(f: SpecFile): number {
  return f.aiMentions * AI_WEIGHT_SECONDS + f.tests;
}

/** Count the plannable signals in a spec SOURCE string: top-level
 *  `test(` declarations (NOT `test.describe(`) and AI-route path mentions
 *  (request-level calls, expectations, flow comments — a static proxy for
 *  the file's AI load). Pure: string in, counts out. */
export function countSpecSignals(src: string): { tests: number; aiMentions: number } {
  const tests = (src.match(/^\s*test\(/gm) || []).length;
  const aiMentions = (src.match(new RegExp(AI_ROUTE_PATTERN.source, "g")) || []).length;
  return { tests, aiMentions };
}

/** Plan `files` into `count` shard groups by LPT: sort weight-desc (ties
 *  by file name ascending), then assign each file to the currently
 *  lightest shard (ties by lowest shard index). Deterministic. A group may
 *  come back EMPTY when there are fewer files than shards — the wrapper
 *  still runs that shard's setup project. auth.setup.ts is NEVER special
 *  here: the wrapper prepends it to every shard itself (the setup
 *  duplication `--shard=k/N` would have provided). */
export function planShards(files: SpecFile[], count: number): string[][] {
  if (!Number.isInteger(count) || count < 2) {
    // One shard IS the serial mode (`bun run test:e2e`) — same contract
    // as shardEnv's validation.
    throw new Error(`shard count must be an integer >= 2 (got ${count})`);
  }
  if (files.length === 0) {
    throw new Error("no spec files to plan (empty inventory)");
  }
  const sorted = [...files].sort(
    (a, b) => specWeight(b) - specWeight(a) || a.file.localeCompare(b.file),
  );
  const groups: string[][] = Array.from({ length: count }, () => []);
  const loads: number[] = new Array(count).fill(0);
  for (const f of sorted) {
    let lightest = 0;
    for (let i = 1; i < count; i++) {
      if (loads[i] < loads[lightest]) lightest = i;
    }
    groups[lightest].push(f.file);
    loads[lightest] += specWeight(f);
  }
  return groups;
}
