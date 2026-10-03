# Remediation Plan — Session 19

Repo state at start: `7f12b08` (session-17 complete at `d51d65a` + the log
commits `0ff08f4`/`7f12b08`; `docs/session_18.md` = the session-17 raw
transcript and `docs/session_19.md` = its detailed execution log, per the
handoff convention). The workspace PERSISTED — `.env` (`DATABASE_URL=
"file:../db/custom.db"`, the prompt's step re-verified byte-identical to
`.env.example`), `db/` at the repo root (custom.db + e2e.db + the three
shard DBs), node_modules installed; the stale shell `DATABASE_URL` trap
re-armed (`file:/home/z/my-project/db/custom.db` overrides `.env`) — every
dev/CLI command ran under `env -u DATABASE_URL`.

Audit sources: the baseline gate re-run fresh (lint ZERO findings ·
typecheck ✓ · 186 unit ✓ (390ms) · build ✓ · the SHARDED e2e re-run green
in one command — 3/3 shards, 91 unique), the live re-probe (the 9th
consecutive bundle verification + the mobile-nav real-tap headline, below),
the session-17 handoff's three suggested directions investigated
empirically (the `noImplicitAny` flip experiment with a canary file; the
per-spec-file duration + AI-route-mention measurement over a fresh
JSON-report serial run; the AI-seam speedup design review), and a re-read
of the session-17 commit's four artifacts whole (shard-env.ts,
playwright.config.ts, e2e-sharded.mjs, eslint.config.mjs — no hard
findings). `bun outdated` re-confirmed: every dep at its latest minor; the
remaining updates are all doctrine-excluded majors (Prisma 7/8-rc,
lucide-react 1.x, eslint 10, TypeScript 7). scandihaven re-consulted per
the prompt (unchanged at `cb0002a`). The repo's Tailwind v4 skills
re-consulted for the mobile-nav headline (all 8 trap pins intact in
`globals.css`; the sonner pointer-events rules intact; zero actual
`rounded-full` usages in `src/`). The `skills/` folder is excluded from
code checking, testing and compilation throughout.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** latent-flake/test-gap ·
**P3** polish/hygiene.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S19-F1 | **`noImplicitAny: false` — the LAST scaffold TypeScript concession (PAD K-4, "tightening is a mechanical pass") — retires for FREE.** The experiment: flipping the flag to `true` and re-running the FULL typecheck with a fresh `tsconfig.tsbuildinfo` produces ZERO errors on the current tree. The flag is proven to bite (a canary file with an implicit-any parameter fails with `error TS7006: Parameter 'param' implicitly has an 'any' type`), so the clean run is a genuine pass, not a dead flag. The tightening closes the last item the PAD's Known-Issues table tracks as a scaffold default (K-4), makes `strict: true` mean what it says, and hardens the typecheck gate against future implicit-any regressions (any new untyped parameter now FAILS the gate instead of riding the concession). | tsconfig.json flip experiment + TS7006 canary (this session) | P1 |
| S19-F2 | **The sharded e2e harness's `--shard=k/N` distribution is badly AI-unbalanced — in the reachable-but-slow LLM regime (the documented 12-15 min serial case, each AI call budgeting `AI_TIMEOUT_MS = 45_000`), the slowest shard degenerates to the full serial wall clock, defeating the parallel harness.** The measured distribution (playwright `--shard=k/N` splits by test COUNT, contiguous by file order): shard 1 = auth + dashboard + header + mobile-navigation (39 tests, ~1 direct AI-route call), shard 2 = session10-parity + session10-public + session11 + session12 + session13 (22 tests, **17 of the 22 direct AI-route request-level calls** — session12:8, session13:5, session11:3, session10-parity:1), shard 3 = the rest (29 tests, ~4). Weighting each AI call at its 45s budget: shard 2 ≈ 765 cost-units vs shard 1 ≈ 56 — a ~13× imbalance. In the fast-fallback regime (this sandbox, 429s → deterministic fallbacks) all shards finish ~1.3m and the imbalance is invisible; in the slow regime shard 2 alone ≈ 17 × 45s ≈ 13 min while shards 1/3 sit idle after ~2 min. **Remediation: an LPT (largest-processing-time-first) file→shard assignment by AI-weight** — the same 91 checks, planned by cost instead of count. The pure derivation (`tests/e2e/shard-plan.ts`, unit-pinned): per-spec weight = `aiMentions × 45 + testCount` (aiMentions = AI-route path mentions in the spec source — the same route set the e2e-conventions scanner knows; the weight approximates worst-case seconds), files sorted weight-desc (ties by name) and greedily assigned to the lightest shard. The wrapper then spawns per-shard FILE LISTS (`bunx playwright test tests/e2e/auth.setup.ts <group…>`) instead of `--shard=k/N` — `auth.setup.ts` is prepended to EVERY shard's list, reproducing the setup-duplication semantics `--shard` itself provides (verified: the setup project's testMatch matches the file in every shard; the chromium project testIgnores it). The wrapper derives the file inventory + per-file test counts from playwright's OWN `--list` enumeration (one pre-flight invocation, ~3s — zero drift risk vs a filesystem walk), and asserts the post-run per-shard "N passed" lines sum to `total + N − 1` (the count invariant, now ENFORCED at runtime instead of structurally inherited from `--shard`). On the current inventory the plan lands at shard weights 364 / 313 / 313 (worst-shard ≈ session12's 8 AI calls alone — a file is the atomic unit) vs the current 56 / 765 / 220 — the slow-regime critical path improves ~2.1×. KNOWN LIMITATION (documented): the static aiMentions term undercounts UI-driven AI flows (specs that mount `/hub`/`/quiz` surfaces or drive the chat/challenge UI without naming the route path — each contributes 1-2 uncounted AI calls); the undercount is bounded (~1-2 calls/file, spread across 7 files) and the LPT ballast term keeps the assignment robust to it; the weight formula and its limitation are documented in the module and the wrapper prints the full weight table + plan for inspection. | `--shard=k/N --list` distribution probes + the per-file AI-mention/duration measurement + the JSON-report serial run (this session) | P2 |
| S19-F3 | **The AI-seam e2e speedup (the session-17 handoff's first suggested direction) — DEFERRED, with rationale.** The direction: "request-level retry/short-circuit or recorded-fixture mode" to compress the slow-LLM domain. Reviewed and deliberately not taken this session: (a) a recorded-fixture layer would change what the suite VERIFIES — the AI-backed specs exist to exercise the real seam end-to-end, and the 429-into-fallback paths are FEATURES the suite proves (SKILL §12 F7: "the AI 429s during the e2e suite are not flakes"); (b) a request-level short-circuit (a test-only env that skips the SDK) would mute exactly the degradation behavior the fallback doctrine pins; (c) the balanced sharding (S19-F2) captures most of the wall-clock win without touching test semantics. Revisit only if the slow regime becomes the common case (e.g. a CI runner with live LLM access). | design review (this session) | P3 |
| S19-F4 | CONFIRMED MATCHING / documented (no action): the live app bundle **byte-identical for the 9th consecutive session** (md5 `f99e72793316ead62b335b6fd55ed6d5`, 788,085 bytes — `/assets/index-CkEI9gsZ.js`, captured on the authenticated page); login works (landed on `/`); **the mobile-nav headline re-verified for the 9th consecutive session** (390×844 hasTouch: the live's hamburger tap STILL REFUSES — the button at (334,12) 36×36, `elementFromPoint` at its center IS the `fixed top-0 z-[100]` toaster container with `pointer-events: auto`, `Timeout 5000ms exceeded`; the clone's fix + 12/12 real-tap pins re-ran green inside this session's sharded run); the unauthenticated mobile `/hub` visit bounces to `login?from_url=<full-url>` (the session-10 decode, re-observed); `.env` == `.env.example` (byte-identical, `DATABASE_URL="file:../db/custom.db"` — the prompt's step satisfied and re-verified); the vitest + playwright configs verified wired (186 unit / 91 e2e, both e2e modes green this session); the sharded e2e harness re-validated on the fresh build (3/3 shards, all 91 unique); all 8 Tailwind v4 trap pins intact; `bun outdated` shows only doctrine-excluded majors remaining. | probes + code + runs (this session) | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — the RED state (TDD: the pure seam's pins land first)

- [x] **R0. `tests/shard-plan.test.ts`**: the failing pins for the pure
  shard-plan module —
  `specWeight({ file, tests, aiMentions })` = `aiMentions * 45 + tests`
  (45 = `AI_TIMEOUT_MS / 1000`, the slow-regime budget per AI call; the
  ballast term keeps non-AI files balanced too);
  `countSpecSignals(src)` counts `/^\s*test\(/gm` (NOT `test.describe(`) and
  AI-route path mentions (the six AI routes) on synthetic sources;
  `planShards(files, count)` — LPT: every input file appears in EXACTLY ONE
  output group; the heavy-file balance property (a 4-file/2-shard case
  lands the heaviest file with the lightest, mirroring greedy
  bin-packing); DETERMINISM (identical inputs → identical outputs, ties
  broken weight-desc then name-asc then lowest-shard-index); validation
  throws (count < 2 — one shard IS the serial mode; empty files).
  RED: the module `tests/e2e/shard-plan.ts` does not exist yet.

### Phase 2 — GREEN: the balanced sharding (S19-F2)

- [x] **R1. `tests/e2e/shard-plan.ts`**: the pure derivation —
  `AI_WEIGHT_SECONDS` (45), `specWeight`, `countSpecSignals` (string in,
  counts out — no I/O), `planShards` (sort weight-desc/name-asc, assign
  each file to the lightest shard, lowest index on ties; a group may be
  EMPTY when there are fewer files than shards — the wrapper still runs
  its setup-only shard). Unit-testable, consumed by R2.
- [x] **R2. `scripts/e2e-sharded.mjs` rework**: derive the spec inventory
  + per-file test counts from ONE pre-flight `bunx playwright test --list`
  (playwright's own enumeration — zero drift vs a filesystem walk; the
  setup line is excluded from planning and prepended to every shard's
  file list); read each spec source + `countSpecSignals` for the AI
  weights; `planShards` → per-shard file groups; spawn
  `bunx playwright test tests/e2e/auth.setup.ts <group…>` with the SAME
  per-shard env (E2E_PORT/E2E_DB/E2E_AUTH/E2E_OUTPUT/E2E_SHARDED —
  `tests/e2e/shard-env.ts` unchanged, still unit-pinned); print the
  weight table + the plan for inspection; parse each shard's trailing
  `N passed` summary line and ASSERT `sum == total + N − 1` (the count
  invariant — the setup test runs once per shard; the serial total counts
  it once). The orphan pre-flight, prefix streaming, SIGTERM/SIGINT
  traps, and exit-code aggregation stay as-is.

### Phase 3 — the TypeScript tightening (S19-F1)

- [x] **R3. `tsconfig.json`**: `"noImplicitAny": false` → `true` (the
  experiment already verified ZERO typecheck errors on the current tree;
  the canary proved the flag bites — TS7006 fires on any new implicit-any).
  The full gate re-runs typecheck with the flag on; K-4 retires from the
  PAD's Known-Issues table.

### Phase 4 — gate, screenshots, docs, delivery

- [x] **R4. Full gate**: lint (zero findings) → typecheck (with
  `noImplicitAny: true`) → unit (186 → 190+ with the shard-plan pins; the
  `isolate: false` shuffle-seed re-validation protocol re-run per the
  vitest.config.ts note — a new test file joins the suite) → build → e2e
  SERIAL (the default mode, 91, `--list` count-invariant) → e2e SHARDED
  (the NEW plan: 3 shards all green, the per-shard weight table + the
  runtime count assertion green, the wall clock recorded). Kill any
  orphaned `standalone/server.js` on :3100/:311x first per trap 41.
- [x] **R5. Screenshots** (`docs/screenshots/`): the dev server on the
  remediated tree — 106: the authenticated dashboard; 107: the MOBILE
  menu OPEN at 390×844 (the clone's working hamburger — the direct
  contrast to the live's 9th-verified refusal); 108: the hub surface
  (the three-pane workspace whose lesson-content fetch is the AI-weight
  motivation).
- [x] **R6. Docs alignment**: AGENTS.md (the balanced-sharding invariant +
  the noImplicitAny retirement; counts), CLAUDE.md (the session-19
  invariants), README.md (the session-19 section + counts), PAD v1.17
  ([S19] + the testing section + K-4 retired from Known Issues), SKILL
  v1.17.0 (§15 the LPT plan pattern; trap 46: count-based shard splits
  are AI-unbalanced in the slow regime; the shard-plan module), this
  plan's TODO check-offs, `docs/session_19.md` rewritten as the formatted
  session summary (the handoff convention), repo `worklog.md` append.
  `.env.example` re-verify (no new env vars — E2E_SHARDS is test-infra
  env, not app env).
- [x] **R7. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim;
  remote ref verified == HEAD; key shredded). The credential-bearing
  probe scripts (`scripts/s19-*.cjs` in the WORKSPACE scripts/
  directory) never enter the repo tree — the established convention.
  Then the session-log commit (`docs/session_20.md` with this session's
  raw transcript, per the handoff convention).

---

## Part C — Plan-vs-code validation (pre-execution)

1. **R0's RED state is reproducible**: `tests/shard-plan.test.ts` imports a
   module that does not exist — vitest fails on the import, the
   conventional RED. The pinned weight formula matches R1's constant
   exactly (45 = AI_TIMEOUT_MS/1000, named `AI_WEIGHT_SECONDS`) ✓.
2. **R2 preserves the serial default and the shard-env contract**:
   `tests/e2e/shard-env.ts`, `playwright.config.ts`, `global-setup.ts`,
   and `auth.setup.ts` are UNTOUCHED — the per-shard port/DB/auth/
   outputDir isolation and the byte-compatible serial mode carry over
   unchanged; only the WRAPPER's test-selection mechanism changes
   (`--shard=k/N` → explicit file lists with auth.setup.ts in every
   shard) ✓. The spawn stays `bunx playwright` (trap 45) ✓. The
   orphan pre-flight stays (trap 41) ✓.
3. **The setup-duplication semantics are preserved by construction**: the
   `--shard` mode's verified property (every shard signs the demo user
   in against its own server) is exactly what prepending
   `tests/e2e/auth.setup.ts` to every shard's file list reproduces — the
   setup project's `testMatch: /auth\.setup\.ts/` matches it in every
   shard, the chromium project's `testIgnore` keeps it out of the spec
   count, and each shard's per-shard `E2E_AUTH` path receives its own
   signed state ✓.
4. **The count invariant is ENFORCED, not assumed**: the wrapper's
   pre-flight `--list` gives the authoritative total; the post-run
   assertion `sum(N passed) == total + shards − 1` fails the wrapper
   loudly on any file the plan dropped or duplicated (the failure mode
   file-list sharding could otherwise introduce silently) ✓.
5. **R3 is zero-delta by experiment**: the flag flip produced ZERO
   typecheck errors on the current tree THIS session (fresh buildinfo;
   canary-verified the flag bites). The full gate re-proves it ✓.
6. **The conventions stay intact**: the e2e-conventions scanner reads
   `*.spec.ts` + `helpers.ts` only — the new `shard-plan.ts` and the
   wrapper edits are outside its scope and contain no `page.request`
   calls; vitest's `include` (`tests/**/*.test.ts`) picks up the new
   pins ✓. The unit count moves 186 → 190+ (the shard-plan pins); the
   e2e count stays EXACTLY 91 unique in serial mode and 91 + (N−1)
   executions in sharded mode (the setup duplication, now counted and
   asserted) ✓.
7. **The unit-runner shuffle protocol applies**: a new test file joins
   the suite — per the vitest.config.ts note, re-validate `isolate:
   false` with a shuffle seed after the pins land (the documented
   re-validation protocol) ✓.

Execution order note: Phase 1 (RED) → Phase 2 (the balanced sharding,
fast gate + the sharded run as its own proof) → Phase 3 (the flag flip,
fast gate) → Phase 4 (full gate → screenshots → docs → push).
