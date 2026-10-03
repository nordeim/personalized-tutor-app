# Session 21 — The Canonical Route-Set Pass

**Chain position:** the audit followed the session-19 handoff's three
suggested directions (the AI-seam recorded-fixture speedup, the measured
weight calibration, the single-constant-module extraction). Repo state at
start: `94abdc1` (session-19's `d292464` + the log commits `2795b01`/
`94abdc1`; the workspace persisted). Deliverables: the canonical AI
route-set module (the drift the handoff predicted, found ALREADY manifest,
eliminated at its source) + two stale-doc drifts closed. Plan:
`docs/remediation-plan-session-21.md` (5 findings + 13 TODOs, all
executed).

## The audit

The baseline gate re-ran fresh (lint ZERO · typecheck ✓ (with
`noImplicitAny: true`) · 197 unit ✓ (421ms) · build ✓), the live
re-probe ran the **10th consecutive verification** (the app bundle
byte-identical: md5 `f99e72793316ead62b335b6fd55ed6d5`, 788,085 bytes —
`/assets/index-CkEI9gsZ.js` on the authenticated page; login lands on
`/`; the mobile-nav headline re-verified for the 10th: the live's
hamburger at (334,12) 36×36, `elementFromPoint` at its center IS the
`fixed top-0 z-[100]` toaster with `pointer-events: auto`, the tap
REFUSES — the clone's fix + 12/12 real-tap pins re-verified green inside
this session's e2e gate; the unauthenticated mobile `/hub` visit bounces
to `login?from_url=<full-url>`), `.env` == `.env.example` re-verified
byte-identical (`DATABASE_URL="file:../db/custom.db"` — the prompt's step
satisfied; the `db/` folder at the repo root with custom.db + e2e.db +
the three shard DBs), scandihaven unchanged (`cb0002a`), the Tailwind v4
trap pins intact (all 8; zero actual `rounded-full` usages in `src/` —
the one grep hit is a comment), `bun outdated` showing only
doctrine-excluded majors (Prisma 7/8-rc, lucide 1.x, eslint 10, TS 7).
The skills catalog consulted (tdd, code-review-and-audit, agent-browser,
the Tailwind v4 cluster).

The three handoff directions investigated:

1. **The single-constant-module extraction (the third direction) —
   the drift had ALREADY happened.** The session-19 commit created
   `tests/e2e/shard-plan.ts` with `AI_ROUTE_PATTERN =
   /api\/(courses\/generate|quiz\/generate|quiz\/submit|quiz\/skip|chat|challenge|lessons\/content)/`
   — SEVEN alternatives — while the conventions scanner's
   `AI_BACKED_ROUTES` array carries the SIX true `@/lib/ai` importers
   and documents the exclusion ("/api/quiz/skip is NOT here: the clone
   skips the live's discarded LLM call"). The filesystem is the
   authority: exactly six `src/app/api/**/route.ts` files import
   `@/lib/ai`; `quiz/skip/route.ts` imports only db/auth/api and
   comments "the wasted call is the live's bug, not a contract; the
   clone skips it." Three consequences: the module comment claimed "the
   six AI-backed route paths (the same set the e2e-conventions scanner
   knows)" while carrying seven (a self-contradiction); the pin was
   NAMED "matches exactly the six AI-backed routes the conventions
   scanner knows" but listed SEVEN routes and asserted `toHaveLength(7)`
   (a self-contradictory pin that pins the WRONG contract and cannot
   catch the drift it was written to pin); and the only `quiz/skip`
   mention in the spec tree is a flow COMMENT in
   `session11-parity.spec.ts:143` — counted at the 45s AI budget, it
   inflated that file's static weight by 45 units for a route that
   makes NO AI call (the plan's cost-model input corrupted at its
   source).
2. **The stale-doc sweep** (the same audit turned on the session-19
   docs pass): the PAD §1.2 technology-stack table still read
   "`noImplicitAny: false`" — contradicting the same document's [S19]
   revision entry and its own K-4 retirement row; the SKILL §11
   pre-ship checklist still read "153 Vitest checks" / "86 Playwright
   checks" — stale from the v1.11 era against the actual 197/91.
3. **The other two directions re-reviewed, both deferred with
   documented rationale:** the AI-seam recorded-fixture speedup
   (S21-F4 — this sandbox's steady state is the 429-fast-fallback
   regime; the real seam + the 429-into-fallback paths ARE what the
   suite verifies; the balanced sharding already captured the
   wall-clock win) and the measured weight calibration (S21-F5 — the
   static undercount is documented/bounded/ballast-robust; a
   server-instrumented calibration is not worth the complexity budget;
   the canonical fix removes the OPPOSITE failure — a spurious
   overcount — at its source).

## The remediation (TDD)

**Phase 1 — RED**: the corrected route-set pin in
`tests/shard-plan.test.ts` (the name finally matches the body: six
routes from the canonical import, `/api/quiz/skip` asserted NOT
matching) + the new `tests/ai-routes.test.ts` (4 pins: the
FILESYSTEM-AUTHORITY pin — walk `src/app/api/**/route.ts`, collect the
`@/lib/ai` importers, assert set equality; the quiz/skip exclusion; the
pattern⇔array mutual consistency; the no-`/g` flag with the behavioral
double-`.test()` proof). RED confirmed: both files failed on the
nonexistent module.

**Phase 2 — GREEN**: `tests/e2e/ai-routes.ts` (the canonical module:
`AI_BACKED_ROUTES` — the six, the quiz/skip doctrine documented — +
`AI_ROUTE_PATTERN` DERIVED from the array, so an orphan alternative is
impossible by construction); `tests/e2e/shard-plan.ts` rewired to import
the pattern (the local regex literal dropped, the module comment fixed);
`tests/e2e-conventions.test.ts` rewired to import the array (the local
const dropped). Two bring-up slips fixed immediately: the derivation's
route-prefix doubling (slice `"/api/".length`, not 1) and the pin's
source-string comparison (`RegExp.prototype.source` escapes "/" as
"\/" — the constructor normalizes to the literal form's serialization;
unescape before comparing). **201 unit green** (197 + 4; the corrected
pin is in place, count unchanged), incl. the `isolate: false`
shuffle-seed re-validation the vitest protocol requires for a new test
file (2 seeds, 201/201 both).

**Phase 3 — the plan re-verification**: the corrected weight table
(`session11-parity.spec.ts` at **96** = 2×45 + 6 — the spurious 45
gone; the total inventory weight 990 → 945), the LPT plan re-landed
**364/291/290** (session12 alone remains the atomic worst file), and
the sharded e2e re-ran green on the fresh build — 3/3 shards, the
runtime count invariant green (executed 93 == expected 93 = 91 + 2
setup copies). The serial `test:e2e` re-ran green in one command (91
passed, 1.4m — the byte-compatible default).

**Phase 4 — docs**: PAD v1.18 (the §1.2 `noImplicitAny: true` fix, the
[S21] revision entry, the SR line 201, the testing-table row), SKILL
v1.18.0 (the §11 counts fixed to 201/91, **trap 47** — a duplicated
domain constant drifts within the session that creates the duplication;
the canonical-module + filesystem-authority doctrine; the
`RegExp.source` serialization note — and §15 the canonical-constant
pattern), AGENTS.md (the canonical-route-set invariant + the counts),
CLAUDE.md (the session-21 invariants block + the counts), README.md
(the session-21 section + the counts), the remediation plan's 13 TODOs
checked off, this summary, both worklogs.

## The gate

lint (zero findings) · typecheck (with `noImplicitAny: true`) · 201 unit
(~0.4s + 2 shuffle seeds) · build ✓ · 91 e2e BOTH serially (1.4m) AND
balanced-sharded (3/3, the count invariant green). Screenshots 109-111
(the remediated dashboard; the clone's mobile menu OPEN at 390×844 —
real-tap + deterministic visibility verified "MENU OPEN: true / My
Courses instances: 1", the direct contrast to the live's 10th-verified
refusal; the hub desktop three-pane).

## Handoff directions (Session 22)

1. **The weight model's static undercount remains the known bounded
   gap** — if the slow-LLM regime ever becomes the norm (a CI runner
   with live LLM access), revisit the measured calibration (S21-F5's
   design review sketches the middleware shape) or the recorded
   fixtures for non-AI-pinning specs (S21-F4).
2. **The duplicate-constant audit generalizes** (trap 47's doctrine):
   other constants two modules both "know" — `AI_TIMEOUT_MS` (ai.ts)
   vs `AI_WEIGHT_SECONDS` (shard-plan) vs the 60_000 trap-39 budget
   (the conventions pin) are three views of one 45s/60s budget family
   worth a mutual-consistency pin or a shared constants module.
3. **The orphan-alternative hazard is closed for the route set but the
   pattern-class remains** — any future scanner regex built by hand
   (rather than derived from an array) should follow the
   canonical-constant pattern from birth, not after its first drift.
