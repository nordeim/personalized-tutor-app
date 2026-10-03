import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AI_TIMEOUT_MS } from "@/lib/ai";
import { AI_SPEC_REQUEST_TIMEOUT_MS } from "./e2e/ai-budget";
import { AI_WEIGHT_SECONDS } from "./e2e/shard-plan";

// SESSION-23 (S23-F1) — the AI timeout budget family's mutual-consistency
// pins. Trap 47's doctrine: "any constant two modules both 'know' (route
// sets, timeout budgets, key names) needs either one exported source or a
// mutual-consistency pin — a comment claiming they match pins nothing."
// The family:
//
//   AI_TIMEOUT_MS = 45_000              src/lib/ai.ts (the PRODUCTION
//                                        budget — the Promise.race reject
//                                        timer every generator races)
//   AI_WEIGHT_SECONDS = 45              tests/e2e/shard-plan.ts (the
//                                        balanced-shard cost model's
//                                        seconds-per-AI-call — previously
//                                        "mirrored" by COMMENT only)
//   AI_SPEC_REQUEST_TIMEOUT_MS = 60_000 tests/e2e/ai-budget.ts (the
//                                        trap-39 convention — the request
//                                        timeout every AI-backed
//                                        page.request call must carry)
//
// WHY pins instead of one shared constant: the e2e-sharded wrapper
// (scripts/e2e-sharded.mjs) imports the shard-plan chain at runtime where
// the `server-only` package does NOT exist (it is a Next bundler
// directive), so test-infra modules in the wrapper's import chain must
// NOT import @/lib/ai. The relationships are therefore held HERE, in the
// vitest context (where the server-only stub makes the import safe — the
// same configuration tests/ai-seam.test.ts already rides).

describe("the AI timeout budget family (S23-F1)", () => {
  it("the shard-plan weight model mirrors the production AI budget (the weight mirror)", () => {
    // If the production budget changes (say 45s → 60s), the shard weight
    // model silently understates by the ratio — and the "balanced" plan
    // re-degenerates toward the count-based imbalance session-19 fixed.
    // This pin fails the unit gate the moment the two views disagree.
    expect(
      AI_WEIGHT_SECONDS * 1000,
      `AI_WEIGHT_SECONDS (${AI_WEIGHT_SECONDS}) must equal AI_TIMEOUT_MS (${AI_TIMEOUT_MS}) in milliseconds — update the shard-plan weight when the production budget changes`,
    ).toBe(AI_TIMEOUT_MS);
  });

  it("the trap-39 spec-request timeout EXCEEDS the AI budget (the headroom invariant)", () => {
    // The convention exists because Playwright's request default (30s) is
    // SHORTER than the AI budget (45s) — a reachable-but-slow LLM aborts
    // the call mid-test. The same failure returns if the budget is ever
    // raised ABOVE the convention value: the request timeout would abort
    // before the seam's own timeout fires. The convention must stay clear
    // of the budget, with room for the fallback path to complete.
    expect(
      AI_SPEC_REQUEST_TIMEOUT_MS,
      `AI_SPEC_REQUEST_TIMEOUT_MS (${AI_SPEC_REQUEST_TIMEOUT_MS}) must exceed AI_TIMEOUT_MS (${AI_TIMEOUT_MS}) — a budget at or above the convention value reintroduces the trap-39 flake`,
    ).toBeGreaterThan(AI_TIMEOUT_MS);
  });

  it("the conventions scanner derives its convention value from the canonical module (no local literal)", () => {
    // The pin-the-pin discipline (session-14): a canonical constant nobody
    // imports is a constant that can silently split brains — the scanner
    // could regress to a local `60_000` while the canonical module drifts.
    // The scanner's source must import AI_SPEC_REQUEST_TIMEOUT_MS and
    // carry no local 60_000 comparison literal.
    const testsDir = path.dirname(fileURLToPath(import.meta.url));
    const scannerSource = readFileSync(
      path.join(testsDir, "e2e-conventions.test.ts"),
      "utf-8",
    );
    expect(scannerSource, "the scanner imports the canonical budget constant").toContain(
      'from "./e2e/ai-budget"',
    );
    expect(
      scannerSource,
      "the scanner carries no local 60_000 literal (the value is canonical)",
    ).not.toContain("!== 60_000");
  });
});
