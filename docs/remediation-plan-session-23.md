# Remediation Plan — Session 23

Repo state at start: `2a9bfd7` (session-21 complete at `8bc8462` + the two
log-only commits `68c85eb`/`2a9bfd7`, both carrying session-21 transcripts —
`docs/session_22.md` the raw transcript, `docs/session_23.md` the detailed
log; the chain's numbering absorbed the log-only Session-22 slot, per the
handoff convention). The workspace was RESET — fresh clone; the environment
re-established exactly per the convention: `cp .env.example .env`
(`DATABASE_URL="file:../db/custom.db"`), `db/` created at the repo root
(schema-pushed + seeded — `demo@thinkerwell.app` / `Demo1234!`), `bun
install` (478 packages). The stale shell `DATABASE_URL` trap re-armed
(`file:/home/z/my-project/db/custom.db` exported in the shell OVERRIDES
`.env`) — every dev/CLI command ran under `env -u DATABASE_URL`.

Audit sources: the baseline gate re-run fresh on the new checkout (lint
ZERO findings · typecheck ✓ (with `noImplicitAny: true`) · 201 unit ✓ (436ms)
· build ✓ · 91 e2e SERIAL ✓ (1.9m) · 91 e2e SHARDED 3/3 ✓ (executed 93 ==
expected 93, the count invariant green — both modes verified this session)),
the live re-probe (the 11th consecutive verification, below), a read of the
session-21 commit's artifacts whole (`tests/e2e/ai-routes.ts`,
`tests/ai-routes.test.ts`, `tests/e2e/shard-plan.ts`,
`tests/e2e-conventions.test.ts`), the timeout-budget-family grep across
production + test infra, the API-handler filesystem count vs the doc
claims, a stale-count sweep across all five project docs, `bun outdated`
(only doctrine-excluded majors remain: Prisma 7/8-rc, lucide-react 1.x,
eslint 10, TypeScript 7), and the hygiene sweep (zero TODO/FIXME, zero
console.log in `src/`, tree clean, `.env`/`db/*.db`/`node_modules`
git-ignored). scandihaven re-consulted per the prompt (unchanged at
`cb0002a` — its AGENTS.md Tailwind v4 rules and E2E discipline re-read).
The repo's `skills/` folder consulted (tdd, code-review-and-audit,
agent-browser, webapp-testing-journey mobile-navigation, clone-app-pat-pro,
tailwind-patterns) and EXCLUDED from code checking, testing and compilation
throughout, per the task instruction.

The live re-probe (11th consecutive session): V1 login works
(the task-provided credentials land on `/` — never recorded in the repo tree); V2 the app bundle
**byte-identical for the 11th consecutive session** (md5
`f99e72793316ead62b335b6fd55ed6d5`, 788,085 bytes —
`/assets/index-CkEI9gsZ.js`, captured on the authenticated page); V3 the
mobile-nav headline re-verified for the 11th (390×844 hasTouch: the live's
hamburger at (334,12) 36×36, `elementFromPoint` at its center IS the
`fixed top-0 z-[100]` Sonner toaster container, the tap REFUSED —
`elementHandle.tap: Timeout 5000ms exceeded`; the clone's fix + real-tap
pins re-verified green inside this session's e2e gate — BOTH modes); V4 the
unauthenticated mobile `/hub` visit bounces to
`login?from_url=<full-url>`; V5 reference screenshots captured (the
authenticated desktop dashboard + the hub). No parity surface opened —
the byte-identical bundle means every decoded contract (the mobile-menu
component, the m_ name split, the icon paths, the radius/blur/weight pins,
the quiz E3 surface, the confetti triggers) remains the pinned truth.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** latent-flake/test-gap · **P3**
polish/hygiene.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S23-F1 | **The AI timeout budget family is triplicated with NO mutual-consistency pin — the session-22 handoff's first direction, and trap 47's own doctrine names the hazard class verbatim: "any constant two modules both 'know' (route sets, TIMEOUT BUDGETS, key names) needs either one exported source or a mutual-consistency pin — a comment claiming they match pins nothing."** The three views: (a) `AI_TIMEOUT_MS = 45_000` — a PRIVATE const in `src/lib/ai.ts:43` (the production seam's actual per-call budget — the `Promise.race` reject timer); (b) `AI_WEIGHT_SECONDS = 45` in `tests/e2e/shard-plan.ts:38` — the balanced-shard cost model's seconds-per-AI-call, whose only link to (a) is the COMMENT "mirrors AI_TIMEOUT_MS = 45_000 in src/lib/ai.ts" (a comment pins nothing); (c) the trap-39 spec-request convention `60_000` — a bare literal in `tests/e2e-conventions.test.ts:134` (`c.timeoutMs !== 60_000`) plus the same literal in every spec's `timeout: 60_000` request calls. The relationships that MUST hold but are pinned NOWHERE: (1) the weight mirror — `AI_WEIGHT_SECONDS × 1000 === AI_TIMEOUT_MS` (if the production budget changes to 60s, the shard weights silently understate by 33% and the "balanced" plan re-degenerates toward the count-based imbalance session-19 fixed); (2) the headroom invariant — the spec-request timeout must EXCEED the AI budget (a budget raised to 90s would make the 60s request timeout abort mid-AI-call — the EXACT latent-flake class trap 39 documents: "Playwright's request default is 30s while the AI seam budgets 45s"). Nothing fails today if any one of the three changes. This is S21-F1's hazard class one session later — the route-set duplication drifted within its creating session; the budget family has so far been held together only by comments. | `src/lib/ai.ts:43` + `tests/e2e/shard-plan.ts:36-38` + `tests/e2e-conventions.test.ts:132-140` + the session_22.md handoff direction (1) (this session) | P2 |
| S23-F2 | **The API handler count is stale in three docs vs the filesystem truth of 16.** `find src/app/api -name route.ts` → **16 handler files** (auth ×4, challenge, chat, courses ×3 incl. `[id]`+`generate`, health, lessons/content, progress, quiz ×3, student). The claims: `CLAUDE.md:406` "route handlers under `src/app/api/` (14 of them)", `README.md:63` "15 route handlers", `Project_Architecture_Document.md` §4.2 header "(14 handlers)" and §3.3 "one discriminated union across 14 handlers" — while the SAME PAD's SR line and its §3.2 directory tree both correctly say 16 (an internal contradiction, the exact drift class the session-21 stale-doc sweep closed). | the `find` count + the four doc lines (this session) | P3 |
| S23-F3 | **The recorded-fixture and measured-weight-calibration directions (the session-19/21 handoffs' standing deferrals) — re-reviewed, STILL DEFERRED, rationale unchanged and re-confirmed by this session's runs.** The steady state remains the 429-fast-fallback regime (both this session's e2e modes ran green with the SDK 429ing into the deterministic fallbacks in seconds — the 11th consecutive observation); the real seam + the fallback paths ARE the contract (SKILL F7), and the balanced sharding already captured the wall-clock win. Revisit only if a CI runner with live-LLM access makes the slow regime the norm. | this session's serial + sharded run transcripts | P3 |
| S23-F4 | **Reviewed observation, no remediation: the per-test timeout (45_000 in `playwright.config.ts`) EQUALS the AI budget (`AI_TIMEOUT_MS = 45_000`).** A single AI call that maxed the budget would leave zero margin for assertions under the per-test clock. Reviewed and left as-is BY DOCTRINE: the fallback guarantee terminates every AI call at 45s worst-case (the `Promise.race` fires → the deterministic fallback renders → assertions run against fallback content), the observed slow-regime call durations complete well under the budget (the documented 12-15m full-suite wall clock is all-green), and the request-seam hazard is owned by the 60s trap-39 convention. Changing the per-test timeout would alter the documented harness for a failure mode never observed in 10+ sessions — recorded here so the next session knows it was considered, not missed. | `playwright.config.ts:41` vs `src/lib/ai.ts:43` (this session) | Info |
| S23-F5 | **Reviewed observation, no remediation: `NEXT_PUBLIC_SITE_URL` is documented (`.env.example`, README, DEPLOYMENT.md — "used for metadata", optional) but has NO consumer in `src/`** — the root layout's `metadata` is static (no `metadataBase`, no sitemap route). The var stays: it is explicitly optional, harmless, and the standard knob for the day canonical/sitemap metadata lands (the DEPLOYMENT.md forward reference). Recorded so the next session knows the gap is known, not missed. | `rg NEXT_PUBLIC_SITE_URL src/` → no matches vs `.env.example:32` (this session) | Info |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — RED: the budget-family pins (TDD: the pins land first)

- [x] **R0. `tests/ai-budget.test.ts`** (NEW, 3 pins): (1) the WEIGHT-MIRROR
  pin — `AI_WEIGHT_SECONDS × 1000 === AI_TIMEOUT_MS` (imports BOTH: the
  weight constant from `./e2e/shard-plan`, the budget from `@/lib/ai` —
  under vitest with the `server-only` stub, the exact pattern
  `tests/ai-seam.test.ts` proves safe); (2) the HEADROOM pin —
  `AI_SPEC_REQUEST_TIMEOUT_MS > AI_TIMEOUT_MS` (the trap-39 convention must
  exceed the production budget, or the request timeout aborts mid-AI-call
  — the flake class trap 39 exists to prevent); (3) the SCANNER-DERIVATION
  pin — the conventions scanner's exact-value check derives its value from
  the canonical module (a source-scan of `tests/e2e-conventions.test.ts`:
  it imports `AI_SPEC_REQUEST_TIMEOUT_MS` and carries NO local `60_000`
  comparison literal — the pin-the-pin discipline of session-14: a
  canonical constant nobody imports is a constant that can silently split
  brains). RED: `@/lib/ai` does not export `AI_TIMEOUT_MS` (the import
  fails) and `./e2e/ai-budget` does not exist (the import fails).

### Phase 2 — GREEN: the canonical budget module + the consumer rewiring (S23-F1)

- [x] **R1a. `src/lib/ai.ts`**: `const AI_TIMEOUT_MS = 45_000` →
  `export const AI_TIMEOUT_MS = 45_000` — a zero-behavior-change edit (an
  added export; nothing else in the module moves). The export IS the
  authority read: the pin imports the value the seam actually races
  against, so the budget can never drift from its pin.
- [x] **R1b. `tests/e2e/ai-budget.ts`** (NEW canonical module):
  `export const AI_SPEC_REQUEST_TIMEOUT_MS = 60_000`, documented (trap 39:
  Playwright's request default 30s < the 45s AI budget; the convention
  value 60s = the budget + margin for the fallback path to complete and
  respond). Deliberately a SEPARATE module from `ai-routes.ts` (the route
  set is "WHICH routes"; the budget is "HOW LONG" — one concern per
  module, the established pattern) and deliberately NOT derived from
  `@/lib/ai` (the wrapper constraint: `scripts/e2e-sharded.mjs` imports
  the shard-plan/shard-env chain at runtime where the `server-only`
  package does NOT exist — a test-infra module importing `@/lib/ai` would
  crash the wrapper's spawn chain; the RELATIONSHIP is therefore pinned in
  vitest instead of shared — the "mutual-consistency pin" arm of trap 47's
  doctrine, with the constraint documented).
- [x] **R1c. `tests/e2e-conventions.test.ts`**: the exact-value check's
  literal `c.timeoutMs !== 60_000` →
  `c.timeoutMs !== AI_SPEC_REQUEST_TIMEOUT_MS` (imported from
  `./e2e/ai-budget`); the comment updated (the value is canonical + the
  budget family is pinned in `tests/ai-budget.test.ts`). The scanner's
  semantics are UNCHANGED: the parsed spec literals still carry `60_000`,
  and the scanner now compares them against the canonical constant — if
  the convention value ever changes, the scanner flags every spec that
  still carries the old literal (the DESIRED behavior: the convention
  changed, the specs must follow).
- [x] **R1d. `tests/e2e/shard-plan.ts`**: the `AI_WEIGHT_SECONDS` comment
  updated — "mirrors AI_TIMEOUT_MS = 45_000 in src/lib/ai.ts" → the
  mutual-consistency doctrine ("mirrors `AI_TIMEOUT_MS` in `src/lib/ai.ts`
  — the relationship is PINNED in `tests/ai-budget.test.ts`; this module
  cannot import `@/lib/ai` itself: the e2e-sharded wrapper loads it where
  `server-only` does not exist"). The constant keeps its plain-number
  form (wrapper-safe); the value keeps 45 (the pin holds the mirror).

### Phase 3 — docs alignment (S23-F2 + the session-23 entries)

- [x] **R2a.** `CLAUDE.md:406`: "(14 of them)" → "(16 of them)".
- [x] **R2b.** `README.md:63`: "15 route handlers" → "16 route handlers".
- [x] **R2c.** `Project_Architecture_Document.md` §4.2 header +
  §3.3: "(14 handlers)" / "across 14 handlers" → 16 (the SR line and the
  directory tree already say 16 — the internal contradiction closes).
- [x] **R2d.** The session-23 entries: AGENTS.md (the canonical-budget
  invariant + the counts 201 → 204), CLAUDE.md (the session-23 invariants
  block + the verify-gate counts + the date), README.md (the session-23
  section + the counts), PAD v1.19 (the SR line 201 → 204; the [S23]
  revision entry; the testing-table row), SKILL v1.19.0 (the frontmatter
  `project_state`; §11 counts 204/91; **trap 48** — the timeout-budget
  family doctrine: three views of one budget held together only by
  comments WILL drift (S21-F1's class); pin the relationships at an
  authority import, and when a shared constant is impossible (the
  `server-only`/wrapper constraint), the mutual-consistency pin is the
  doctrine; §15 the budget-family pattern beside the canonical-constant
  pattern), this plan's TODO check-offs, `docs/session_23.md` rewritten
  as the formatted session-23 summary (the handoff convention — it
  currently holds the session-21 detailed log, superseded by the worklog
  + remediation-plan-session-21.md + the commit messages).
- [x] **R2e.** `.env.example` re-verify (no new env vars — the budget pin
  is test infra; nothing reads new `process.env`).

### Phase 4 — gate, screenshots, delivery

- [x] **R3. Full gate**: lint (zero findings) → typecheck (with
  `noImplicitAny: true`) → unit (201 → 204 with the three budget pins; the
  `isolate: false` shuffle-seed re-validation protocol re-run per the
  vitest.config.ts note — a new test file joins the suite) → build → e2e
  SERIAL (the default mode, 91, the `--list` count-invariant) → e2e
  SHARDED (3 shards all green, the runtime count assertion green — the
  wrapper's inventory/plan inputs are UNCHANGED by the budget pins, but
  the mode re-verifies per the gate convention). Kill any orphaned
  `standalone/server.js` on :3100/:311x first per trap 41.
- [x] **R4. Screenshots** (`docs/screenshots/`): the dev server on the
  remediated tree — 112: the authenticated dashboard; 113: the MOBILE
  menu OPEN at 390×844 (the clone's working hamburger — the direct
  contrast to the live's 11th-verified refusal); 114: the hub surface.
- [x] **R5. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim on
  PATH; remote ref verified == HEAD; key shredded). The
  credential-bearing probe scripts (`scripts/s23-*.cjs` in the WORKSPACE
  scripts/ directory) never enter the repo tree — the established
  convention. Then the session-log commit (`docs/session_24.md` with this
  session's raw transcript, per the handoff convention).

---

## Part C — Plan-vs-code validation (pre-execution)

1. **R0's RED state is reproducible**: `tests/ai-budget.test.ts` imports
   `{ AI_TIMEOUT_MS }` from `@/lib/ai` — the module has no such export
   (verified: `rg "AI_TIMEOUT_MS" src/lib/ai.ts` → one PRIVATE const), so
   the import fails at load (vitest reports the failed resolution) ✓; it
   imports `{ AI_SPEC_REQUEST_TIMEOUT_MS }` from `./e2e/ai-budget` — the
   module does not exist yet ✓.
2. **The vitest-context import of `@/lib/ai` is proven safe**:
   `tests/ai-seam.test.ts` already imports the module under the same
   alias + `server-only` stub configuration (the vitest.config.ts
   `resolve.alias` maps `server-only` to `tests/stubs/server-only.ts`) —
   the budget pin adds zero new machinery ✓.
3. **The wrapper constraint is real and the design respects it**:
   `scripts/e2e-sharded.mjs:42-43` imports `../tests/e2e/shard-env` and
   `../tests/e2e/shard-plan` at runtime (bun resolving the TS directly);
   `node_modules/server-only` does NOT exist (verified — it is a bundler
   directive Next provides at build time). Therefore NO file in the
   wrapper's import chain may import `@/lib/ai` — `shard-plan.ts` keeps
   its plain-number constant, and the RELATIONSHIP lives in
   `tests/ai-budget.test.ts` (vitest context only). `ai-budget.ts` (the
   new canonical module) imports NOTHING (a bare export) — wrapper-safe
   by construction, and the wrapper does not need the timeout value
   (verified: it only consumes shardEnv/countSpecSignals/planShards/
   specWeight) ✓.
4. **The scanner rewiring is behavior-preserving**: the exact-value check
   compares parsed spec literals (`60_000` in every AI-backed request
   call today) against the canonical constant (also `60_000`) — the
   offender lists are byte-identical (empty) before and after; the
   other two checks (missing-timeout, scanner-finds-calls) are untouched
   ✓. The scanner's route-set import (`./e2e/ai-routes`) is untouched ✓.
5. **The unit count moves 201 → 204** (three new `it`s in one new file;
   no existing test changes). Vitest's `include` (`tests/**/*.test.ts`)
   picks up the new file; the shuffle protocol applies (a new test file
   joins the suite — re-validate `isolate: false` with a shuffle seed
   after the pins land; the new file is stateless — it imports constants
   and reads ONE source file — so cross-file leakage risk is nil, but
   the protocol runs anyway per the config's own note) ✓.
6. **The conventions stay intact**: the e2e-conventions scanner's scope
   (specs + helpers.ts) is unchanged; `ai-budget.ts` is outside its
   scope and contains no `page.request` calls; `tests/ai-budget.test.ts`
   reads `tests/e2e-conventions.test.ts` as TEXT (read-only node fs —
   the same pattern as the conventions scanner's own fs walk and the
   ai-routes authority pin) ✓.
7. **The shard-plan weight table is UNCHANGED**: `AI_WEIGHT_SECONDS`
   keeps the value 45 (only its comment changes), so the LPT plan, the
   weight table (364/291/290), and the count invariant's expected sum
   are all byte-identical — the sharded re-run in R3 is a re-verification,
   not a re-plan ✓.
8. **The production export is safe**: adding `export` to
   `AI_TIMEOUT_MS` changes no runtime behavior (the const's initializer
   and usage are untouched); the Next build tree-shakes unused exports
   from the server bundle the same way it already handles the module's
   other exported types/functions; the typecheck gate re-verifies the
   whole tree ✓.

Execution order note: Phase 1 (RED) → Phase 2 (the canonical module +
the export + the rewirings, fast gate) → Phase 3 (docs) → Phase 4 (full
gate → screenshots → commit → push → the log commit).
