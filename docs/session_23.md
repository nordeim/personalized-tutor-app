# Session 23 — The Budget-Family Pin Pass

**Repo state at start:** `2a9bfd7` (session-21 complete at `8bc8462` + the
two log-only commits `68c85eb`/`2a9bfd7`, both carrying session-21
transcripts — `docs/session_22.md` the raw transcript, this file the
detailed log; the chain's numbering absorbed the log-only Session-22 slot).
**Plan:** `docs/remediation-plan-session-23.md` · **Live re-probe:** the
11th consecutive verification · **Gate:** lint zero · typecheck (with
`noImplicitAny: true`) · 204 unit · build · 91 e2e BOTH serially AND
balanced-sharded (3/3, the count invariant green).

## The audit

The workspace was RESET — a fresh clone; the environment re-established
exactly per the convention (`.env` from `.env.example` with
`DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root schema-pushed
+ seeded, `bun install`, the stale shell `DATABASE_URL` trap re-armed so
every command ran under `env -u DATABASE_URL`). The baseline gate ran green
on the fresh checkout BEFORE any change: lint zero · typecheck · 201 unit
(436ms) · build · 91 e2e serially (1.9m) · 91 e2e sharded (3/3, executed
93 == expected 93) — the codebase state fully consistent with the
worklog's claims.

The live re-probe (11th consecutive): login works; the app bundle
**byte-identical for the 11th consecutive session** (md5
`f99e72793316ead62b335b6fd55ed6d5`, 788,085 bytes); the mobile-nav
headline re-verified for the 11th (the live's hamburger at (334,12) 36×36
is still covered by the `fixed top-0 z-[100]` Sonner toaster, the tap
REFUSED); the unauthenticated mobile `/hub` visit bounces to
`login?from_url=<full-url>`; reference screenshots captured. **No parity
surface opened** — the byte-identical bundle means every decoded contract
remains the pinned truth (the mobile-menu component, the m_ name split,
the icon paths, the radius/blur/weight pins, the quiz E3 surface, the
confetti triggers — all re-verified green inside this session's e2e gate,
BOTH modes). The Tailwind v4 trap pins re-verified intact in `globals.css`
(all eight), and the repo's `skills/` folder consulted (tdd,
code-review-and-audit, agent-browser, webapp-testing-journey
mobile-navigation, clone-app-pat-pro, tailwind-patterns) while staying
excluded from checking/testing/compilation. `bun outdated`: only
doctrine-excluded majors remain.

## The findings

**S23-F1 (P2) — the AI timeout budget family: three views of one budget,
held together only by comments.** `AI_TIMEOUT_MS = 45_000` (PRIVATE in
`src/lib/ai.ts` — the production `Promise.race` timer),
`AI_WEIGHT_SECONDS = 45` (the balanced-shard cost model, "mirrored" by a
COMMENT), and the trap-39 `60_000` request convention (a bare literal in
the conventions scanner). Nothing failed if any one changed: a budget
raise would silently understate the shard weights (re-degenerating the
balanced plan toward the count-based imbalance session-19 fixed) AND push
the spec-request timeout under the budget (reintroducing the trap-39
request-abort flake). This is trap 47's hazard class verbatim — its own
text names "timeout budgets" in the generalization: "any constant two
modules both 'know' … needs either one exported source or a
mutual-consistency pin — a comment claiming they match pins nothing."

**S23-F2 (P3) — the API handler count stale in three docs** vs the
filesystem truth of 16 (`CLAUDE.md` "14 of them", `README` "15 route
handlers", PAD §4.2 header + §3.3 "14 handlers" — while the same PAD's SR
line and directory tree correctly said 16).

**S23-F3 (P3)** — the recorded-fixture and measured-weight-calibration
directions re-reviewed, STILL DEFERRED (rationale unchanged; this
session's runs reconfirmed the 429-fast-fallback steady state).

**S23-F4 (Info)** — the per-test timeout (45s) EQUALS the AI budget
(45s): reviewed, left as-is by doctrine (the fallback guarantee
terminates AI calls at 45s worst-case; the observed slow-regime durations
complete well under; the request seam is owned by the 60s convention).

**S23-F5 (Info)** — `NEXT_PUBLIC_SITE_URL` is documented but has no
`src/` consumer (static metadata): reviewed, left in place (optional,
harmless, the standard knob for future canonical metadata).

## The remediation (TDD)

**RED:** `tests/ai-budget.test.ts` (3 pins) written first — the weight
mirror (`AI_WEIGHT_SECONDS × 1000 === AI_TIMEOUT_MS`), the headroom
invariant (the spec-request convention EXCEEDS the production budget),
and the scanner-derivation pin (the conventions scanner imports the
canonical constant, no local `60_000` literal). RED confirmed: the
`@/lib/ai` import fails (no such export) and `./e2e/ai-budget` does not
exist — the other 18 files stay green at 201.

**GREEN:** (1) `src/lib/ai.ts` — `AI_TIMEOUT_MS` is now EXPORTED (the
authority read; zero behavior change). (2) `tests/e2e/ai-budget.ts` (NEW
canonical module) — `AI_SPEC_REQUEST_TIMEOUT_MS = 60_000`, documented
with the trap-39 doctrine and the wrapper constraint. (3) The conventions
scanner's exact-value check now imports the canonical constant (never a
local literal). (4) `tests/e2e/shard-plan.ts`'s comment updated to the
pinned-relationship doctrine. **204 unit green.**

**THE DESIGN CONSTRAINT (why pins, not one shared constant):** the
e2e-sharded wrapper (`scripts/e2e-sharded.mjs`) loads the `tests/e2e/*`
chain at runtime where the `server-only` package does NOT exist (a Next
bundler directive), so nothing in that chain may import `@/lib/ai` —
`shard-plan.ts` keeps its plain number and the RELATIONSHIP lives in the
vitest context (where the `server-only` stub makes the production import
safe — the pattern `tests/ai-seam.test.ts` already proves). Documented as
SKILL trap 48.

**The vitest-protocol validation:** one run immediately after the 4-file
GREEN write batch failed 8 tests (17 subsequent full runs all green). The
flake was investigated systematically, not shrugged off: the mock-leak
hypothesis (the new un-mocked `@/lib/ai` import corrupting ai-seam's
`vi.mock` under `isolate: false`) was DISPROVEN by a both-orders
single-worker experiment (16/16 green in each order — vitest 5 applies
mocks per test file even in shared workers); the SDK-import-side-effects
hypothesis was DISPROVEN by source inspection (`z-ai-web-dev-sdk`'s
module is a class definition only — `loadConfig` runs inside
`ZAI.create()`); the surviving explanation is one-time transform-cache
churn in the write window. The protocol's shuffle-seed re-validation ran
6 seeds — all green at 204/204.

## Docs alignment

The stale handler counts fixed (CLAUDE/README/PAD → 16 everywhere); the
session-23 entries landed in AGENTS (the canonical-budget invariant +
counts 204), CLAUDE (the session-23 invariants + counts + date), README
(the session-23 section + counts), PAD v1.19 (the SR line, the [S23]
revision entry, the testing-table row), SKILL v1.19.0 (the frontmatter,
§11 counts 204/91, **trap 48**, §15 the mutual-consistency-pin pattern
beside the canonical-constant pattern); this plan's 13 TODOs checked off;
this file rewritten as the formatted summary (the handoff convention).

## The gate

lint (zero findings) · typecheck (with `noImplicitAny: true`) · **204
unit** (~0.4s + 6 shuffle seeds green) · build · **91 e2e serially**
(1.9m) · **91 e2e sharded** (3/3, executed 93 == expected 93 — the count
invariant green; the 429s are the documented expected fallback regime).
Screenshots 112-114 (the remediated dashboard, the clone's mobile menu
OPEN at 390×844 — the 11th-verified contrast to the live's refusal — the
hub desktop three-pane). `.env` == `.env.example` re-verified (no new env
vars — the budget pin is test infra).

## Handoff directions (Session 25+)

1. **The authority-pin pattern is now complete for both families** (the
   route set + the budget) — the remaining handoff directions stay the
   standing deferrals (recorded fixtures, measured weight calibration;
   revisit only if a live-LLM CI makes the slow regime the norm).
2. **If the isolate:false flake class ever recurs** (a one-run failure
   after a multi-file write batch), the session-23 investigation playbook
   is in SKILL trap 48: run the both-orders single-worker experiment
   FIRST (it settles the mock-leak question in one command), then check
   the SDK import, then suspect cache churn.
3. **The NEXT_PUBLIC_SITE_URL gap (S23-F5)**: when canonical/sitemap
   metadata lands, wire `metadataBase` through it — the variable is
   already documented in all three env surfaces.
