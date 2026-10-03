// SESSION-23 (S23-F1) — the CANONICAL AI timeout budget for the e2e
// request seam: the trap-39 convention value. Both budget-family consumers
// import it:
//   - tests/e2e-conventions.test.ts (the trap-39 timeout convention —
//     every page.request call to an AI-backed route carries this exact
//     timeout; the scanner compares parsed spec literals against THIS
//     constant, never a local copy);
//   - tests/ai-budget.test.ts (the mutual-consistency pins: the weight
//     mirror + the headroom invariant).
//
// WHY 60s: Playwright's request-context default is 30s while the AI seam
// budgets AI_TIMEOUT_MS = 45_000 (src/lib/ai.ts) — a reachable-but-slow
// LLM aborts the call mid-test unless the request timeout exceeds the
// budget with room for the fallback path to complete and respond.
//
// WHY a bare constant (not derived from @/lib/ai): this module stays in
// the wrapper-safe plain-TS tier — scripts/e2e-sharded.mjs loads the
// tests/e2e/* chain at runtime where the `server-only` package does NOT
// exist (a Next bundler directive), so no file in that chain may import
// @/lib/ai. The RELATIONSHIP to the production budget is therefore PINNED
// in tests/ai-budget.test.ts (the vitest context, where the server-only
// stub makes the import safe) instead of shared.

/** The trap-39 convention: the explicit timeout every AI-backed
 *  request-level call in the e2e suite must carry. Must stay ABOVE
 *  AI_TIMEOUT_MS in src/lib/ai.ts (pinned in tests/ai-budget.test.ts). */
export const AI_SPEC_REQUEST_TIMEOUT_MS = 60_000;
