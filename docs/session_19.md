# Session 19 — The Balance + Strictness Pass

**Chain position:** the audit followed the session-17 handoff's three
suggested directions (the AI-seam e2e speedup, the `noImplicitAny`
tightening, the duration-informed shard balance). Repo state at start:
`7f12b08` (session-17's `d51d65a` + the log commits; the workspace
persisted). Deliverables: the AI-weight BALANCED sharded e2e harness + the
last scaffold TypeScript concession retired. Plan:
`docs/remediation-plan-session-19.md` (4 findings + 8 TODOs, all executed).

## The audit

The baseline gate re-ran fresh (lint ZERO · typecheck ✓ · 186 unit ✓ ·
build ✓ · the session-17 sharded e2e re-validated green in one command —
3/3 shards, 91 unique), the live re-probe ran the **9th consecutive
verification** (the app bundle byte-identical: md5 `f99e7279…`, 788,085
bytes — `/assets/index-CkEI9gsZ.js` on the authenticated page; login
lands on `/`; the mobile-nav headline re-verified for the 9th: the live's
hamburger at (334,12) 36×36, `elementFromPoint` at its center IS the
`fixed top-0 z-[100]` toaster with `pointer-events: auto`, the tap REFUSES
— the clone's fix + 12/12 real-tap pins hold; the unauthenticated mobile
`/hub` visit bounces to `login?from_url=<full-url>`), `.env` ==
`.env.example` re-verified byte-identical (`DATABASE_URL=
"file:../db/custom.db"` — the prompt's step satisfied), scandihaven
unchanged (`cb0002a`), the Tailwind v4 trap pins intact, `bun outdated`
showing only doctrine-excluded majors (Prisma 7/8-rc, lucide 1.x,
eslint 10, TS 7).

The three handoff directions investigated EMPIRICALLY:

1. **The `noImplicitAny` experiment**: flipping the flag (`false` →
   `true`) and re-running the FULL typecheck with a fresh
   `tsconfig.tsbuildinfo` produces **ZERO errors on the current tree** —
   and the flag is canary-proven to bite (a synthetic implicit-any
   parameter fails with `error TS7006`). The PAD's K-4 ("tightening is a
   mechanical pass") turned out to be a NO-OP on the current code: the
   last scaffold TypeScript concession retires for free.
2. **The shard-balance measurement**: a JSON-report serial run (91
   checks, 80.3s wall in the 429-fallback regime) + the per-file
   AI-route-mention scan + the `--shard=k/N --list` distribution probes
   measured playwright's count-based split: shard 2 carries **17 of the
   22 direct AI-route request-level calls** (session12:8, session13:5,
   session11:3, session10-parity:1) while shard 1 carries ~1 — weighted
   at the 45s `AI_TIMEOUT_MS` budget, that is 765 cost-units vs 56. In
   the reachable-but-slow LLM regime the heavy shard alone ≈ the full
   serial wall clock (≈ 13 min) while the others idle after ~2 min: the
   parallel harness silently degenerates.
3. **The AI-seam speedup design review**: recorded fixtures or
   request-level short-circuits would change WHAT the suite verifies
   (the real seam + the 429-fallback paths are the contract — SKILL F7);
   the balanced sharding captures most of the wall-clock win without
   touching test semantics. DEFERRED with the rationale documented
   (S19-F3).

## The remediation (TDD)

**Phase 1 — RED**: `tests/shard-plan.test.ts` (11 pins) imports a module
that does not exist — the conventional RED confirmed.

**Phase 2 — GREEN, the balanced sharding (S19-F2)**:
`tests/e2e/shard-plan.ts` — ONE pure module: `AI_WEIGHT_SECONDS` (45,
mirroring `AI_TIMEOUT_MS`), `specWeight` (`aiMentions × 45 + tests` —
worst-case seconds), `countSpecSignals` (the static spec scanner: top-level
`test(` declarations + AI-route path mentions, string in / counts out),
and `planShards` (LPT bin-packing: sort weight-desc / name-asc, assign
each file to the lightest shard, ties by lowest index; deterministic;
empty groups allowed when files < shards; count < 2 and an empty
inventory throw — one shard IS the serial mode). The wrapper
(`scripts/e2e-sharded.mjs`) reworked to orchestrate the plan: ONE
pre-flight `bunx playwright test --list` provides the authoritative
inventory + per-file test counts (zero drift vs a filesystem walk), the
spec sources are scanned for the AI weights, the weight table + plan
print for inspection, and each shard spawns as
`bunx playwright test tests/e2e/auth.setup.ts <group…>` — `auth.setup.ts`
prepended to EVERY shard's file list reproduces the setup-duplication
semantics `--shard=k/N` itself provided (each shard signs the demo user
in against its own server). The per-shard env (port 3111+ / own DB /
own auth / own outputDir via `tests/e2e/shard-env.ts` — UNTOUCHED), the
orphan pre-flight (trap 41), the `bunx playwright` spawn (trap 45), the
SIGTERM/SIGINT traps, and the exit-code aggregation all carry over. The
count invariant is now ENFORCED at runtime: each shard's trailing
"N passed" summary line is parsed and the sum asserted to equal
`total + N − 1` on green runs (the setup test runs once per shard; the
serial total counts it once). **The bring-up found and fixed one real
bug** (the first balanced run failed the assertion exactly): the
`--list` line for the setup project ends `.setup.ts`, NOT `.spec.ts` —
the initial `\S+\.spec\.ts` regex dropped it and the expected count ran
one short (93 executed vs 92 expected). The fixed pattern
`(\S+\.(?:spec|setup)\.ts)` catches both; the failure was the
assertion's own proof that it bites.

On the current inventory the plan lands **364 / 313 / 313** (shard 1 =
session12 alone — a file is the atomic unit; shards 2/3 = 7 and 8 files)
vs the count-based 56 / 765 / 220: a ~2.1× improvement of the slow-regime
critical path. KNOWN LIMITATION (documented in the module + the wrapper):
the static aiMentions scan undercounts UI-driven AI flows (specs that
mount `/hub` or `/quiz` surfaces without naming the route path — each
contributes 1-2 uncounted calls, bounded, spread across files; the
ballast term keeps the assignment robust).

**Phase 3 — the TypeScript tightening (S19-F1)**: `tsconfig.json`
`noImplicitAny: false` → `true` (the experiment's zero-error result
re-proven by the full gate; the canary proves TS7006 fires on any new
implicit-any — the typecheck gate hardens instead of riding the
concession). K-4 retires from the PAD's Known-Issues table.

## The gate

- lint: ZERO findings (the session-17 ruleset, unchanged)
- typecheck: ✓ **with `noImplicitAny: true`**
- unit: **197** (186 + the eleven shard-plan pins), ~0.4s, AND the
  `isolate: false` shuffle-seed re-validation protocol re-run per the
  vitest.config.ts note (a new test file joined the suite) — 197/197
- build: ✓
- e2e SERIAL (the byte-compatible default): **91 passed in 1.4m** (one
  command)
- e2e SHARDED (the balanced plan): **3/3 shards green** — shard 1:
  5 passed in 17.2s (the AI-heavy session12 domain), shards 2/3: 44
  passed each in 1.3m; **executed 93 = expected 93** (91 unique + 2
  setup copies — the count invariant green); zero orphaned :3100/:311x
  servers before or after

Screenshots 106-108 (`docs/screenshots/`): the remediated authenticated
dashboard (1440×900), the clone's mobile menu OPEN at 390×844 (the
real-tap-verified contrast to the live's 9th-verified refusal — a
deterministic visibility probe re-confirmed "MENU OPEN: true"), and the
hub desktop three-pane (the AI-weight motivation surface).

## Handoff

- **Session 19 delivered**: remote main @ the remediation commit (this
  session) — the SSH wrapper push with the remote-ref verification, all
  key material destroyed after.
- The live bundle remains byte-identical (9th); every prior decode
  stands. The mobile-nav headline: the live still refuses, the clone's
  pins hold.
- **Suggested directions for Session 20**: (1) the AI-seam e2e speedup
  remains the deferred direction — if the slow regime becomes the common
  case, a request-level recorded-fixture layer for the NON-AI-asserting
  specs only (the specs that don't pin AI content) would compress the
  domain without changing what the AI-pinning specs verify; (2) the
  shard-plan's static weight undercount could be closed with a
  UI-flow marker scan (`goto("/hub"` / `goto("/quiz"` / challenge-tile
  interactions) — measure the actual per-test AI-route request counts
  first (an instrumented server run) before trusting any static proxy;
  (3) the session-15 `e2e-conventions` scanner and the new
  `shard-plan` weight scan share the AI-route regex — consider ONE
  exported constant module so the two can never drift apart.
