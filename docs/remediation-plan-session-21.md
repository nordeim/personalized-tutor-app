# Remediation Plan — Session 21

Repo state at start: `94abdc1` (session-19 complete at `d292464` + the log
commits `2795b01`/`94abdc1`; `docs/session_20.md` and `docs/session_21.md`
hold the session-19 execution's raw transcripts — the chain's numbering
absorbed the log-only Session-20 slot, per the handoff convention). The
workspace PERSISTED — `.env` (`DATABASE_URL="file:../db/custom.db"`,
byte-identical to `.env.example`, re-verified), `db/` at the repo root
(custom.db + e2e.db + the three shard DBs), node_modules installed; the
stale shell `DATABASE_URL` trap re-armed (`file:/home/z/my-project/db/
custom.db` overrides `.env`) — every dev/CLI command ran under
`env -u DATABASE_URL`.

Audit sources: the baseline gate re-run fresh (lint ZERO findings ·
typecheck ✓ (with `noImplicitAny: true`) · 197 unit ✓ (421ms) · build ✓),
the live re-probe (the 10th consecutive bundle verification + the
mobile-nav real-tap headline, below), a re-read of the session-19 commit's
artifacts whole (`tests/e2e/shard-plan.ts`, `scripts/e2e-sharded.mjs`,
`tests/shard-plan.test.ts`, `tests/e2e-conventions.test.ts`, `tsconfig.json`
— one real finding, below), the route-set authority grep over
`src/app/api/**/route.ts`, and a stale-count sweep across all five project
docs. `bun outdated` re-confirmed: every dep at its latest minor; the
remaining updates are all doctrine-excluded majors (Prisma 7/8-rc,
lucide-react 1.x, eslint 10, TypeScript 7). scandihaven re-consulted per
the prompt (unchanged at `cb0002a`). The repo's Tailwind v4 skills
re-consulted for the mobile-nav headline (all 8 trap pins intact in
`globals.css` — `--radius-lg`/`--radius-xl: 0.75rem`, `--blur-sm: 4px`,
`font-weight: 300`, the `[data-sonner-toaster]` pointer-events rules; zero
actual `rounded-full` usages in `src/` — the one grep hit is a comment).
The `skills/` folder is excluded from code checking, testing and
compilation throughout.

The live re-probe (10th consecutive session): V1 login works (lands on
`/`); V2 the app bundle **byte-identical for the 10th consecutive
session** (md5 `f99e72793316ead62b335b6fd55ed6d5`, 788,085 bytes —
`/assets/index-CkEI9gsZ.js`, captured on the authenticated page); V3 the
mobile-nav headline re-verified for the 10th (390×844 hasTouch: the live's
hamburger at (334,12) 36×36, `elementFromPoint` at its center IS the
`fixed top-0 z-[100]` toaster container, the tap REFUSED —
`elementHandle.tap: Timeout 5000ms exceeded`; the clone's fix + 12/12
real-tap pins re-verified inside this session's full e2e gate); V4 the
unauthenticated mobile `/hub` visit bounces to
`login?from_url=<full-url>`.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** latent-flake/test-gap ·
**P3** polish/hygiene.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S21-F1 | **The duplicated AI route set has ALREADY DRIFTED — the exact hazard the session-19 handoff's third direction named ("the e2e-conventions scanner and the new shard-plan weight scan share the same AI-route regex — extract it into a single exported constant module to eliminate drift").** `tests/e2e/shard-plan.ts` exports `AI_ROUTE_PATTERN = /api\/(courses\/generate|quiz\/generate|quiz\/submit|quiz\/skip|chat|challenge|lessons\/content)/` — SEVEN alternatives, including `quiz/skip` — while the conventions scanner (`tests/e2e-conventions.test.ts`) carries the SIX-route `AI_BACKED_ROUTES` array and documents the exclusion: "/api/quiz/skip is NOT here: the clone skips the live's discarded LLM call (the documented session-11 fix)." The authority is the filesystem: exactly six `src/app/api/**/route.ts` files import `@/lib/ai` (challenge, chat, courses/generate, lessons/content, quiz/generate, quiz/submit) — `quiz/skip/route.ts` imports only `db`/`auth`/`api` and comments "the wasted call is the live's bug, not a contract; the clone skips it." Consequences: (a) the module comment on `AI_ROUTE_PATTERN` claims "The six AI-backed route paths (the same set the e2e-conventions scanner knows)" while carrying seven — a self-contradiction; (b) the pin in `tests/shard-plan.test.ts` is NAMED "matches exactly the six AI-backed routes the conventions scanner knows" but lists SEVEN routes and asserts `toHaveLength(7)` — a self-contradictory pin that pins the WRONG contract and cannot catch the drift; (c) the only `quiz/skip` mention in the spec tree is a flow COMMENT in `session11-parity.spec.ts:143` — counted as an AI mention, it inflates that file's static weight by 45 units (a route that makes NO AI call in the clone), corrupting the plan's cost-model input at its source. **Remediation (the handoff's own direction): ONE canonical module `tests/e2e/ai-routes.ts`** — the `AI_BACKED_ROUTES` array (the six, the doctrine documented) plus the `AI_ROUTE_PATTERN` derived FROM the array — consumed by BOTH the conventions scanner and the shard-plan. The pin set: a FILESYSTEM-AUTHORITY pin (scan `src/app/api/**/route.ts` for `@/lib/ai` imports → the derived set must equal `AI_BACKED_ROUTES`, so the set can never drift from the actual code again), the `quiz/skip` exclusion pin, the pattern⇔array mutual-consistency pin, and the no-`/g`-flag pin (the stateful-`lastIndex` hazard). The shard-plan's route-set pin is corrected to the true contract (six routes; `quiz/skip` asserted NOT matching). | the source comparison + the grep over `src/app/api/**/route.ts` + `session11-parity.spec.ts:143` (this session) | P2 |
| S21-F2 | **PAD §1.2's technology-stack table still reads "TypeScript (strict, `noImplicitAny: false`)"** — stale: the same document's `[S19]` revision entry and its own K-4 row ("RETIRED session-19") record the flip to `true`, and `tsconfig.json` carries `"noImplicitAny": true`. An internal contradiction inside the definitive architecture doc, missed by the session-19 docs pass (which updated the K-4 row but not the §1.2 table). | `Project_Architecture_Document.md:73` vs `tsconfig.json:13` + PAD line 35/656 (this session) | P3 |
| S21-F3 | **SKILL §11's pre-ship checklist still reads "153 Vitest checks" / "86 Playwright checks"** — stale from the v1.11 era; the actual gate is 197 unit / 91 e2e (and 201 unit after this session's pins). The SKILL's own frontmatter `project_state` says 197/91 — the §11 block is internally inconsistent with the rest of the file. | `personalized-tutor-app_SKILL.md:834,836` vs the frontmatter (this session) | P3 |
| S21-F4 | **The AI-seam e2e speedup via recorded fixtures (the session-19 handoff's first direction) — re-reviewed, STILL DEFERRED, rationale unchanged.** This sandbox's steady state is the 429-fast-fallback regime (the SDK rate-limits into the deterministic fallbacks in seconds — the full 91-check serial e2e ran 1.4m in the session-19 gate), so the slow-LLM wall clock the fixtures would compress is not the common case; and the S19-F3 rationale holds — the real seam + the 429-into-fallback paths ARE what the suite verifies (SKILL F7: "the AI 429s during the e2e suite are not flakes"), and the balanced sharding already captured most of the wall-clock win. Revisit only if a CI runner with live LLM access makes the slow regime the norm. | design review (this session) | P3 |
| S21-F5 | **The measured weight calibration (the session-19 handoff's second direction — server-side AI-route request counts per spec) — re-reviewed, DEFERRED.** The static `aiMentions` undercount is documented, bounded (the helper-driven and UI-driven flows contribute 1-2 uncounted calls per file, spread across files — e.g. `session10-parity` rides `generateCourse` from `helpers.ts` with zero static mentions), and the test-count ballast keeps the LPT assignment robust to it; the balanced plan lands 364/313/313 on the current inventory. A measured calibration would instrument the e2e server (a request-counting middleware + a per-test attribution pass) for a marginal assignment improvement — the complexity budget is better spent elsewhere. The canonical route-set fix (S21-F1) removes the OPPOSITE failure (a spurious 45-unit overcount) at its source. | design review + the helpers.ts request-surface comparison (this session) | P3 |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — RED: the corrected and new pins (TDD: the seam's pins land first)

- [x] **R0a. `tests/shard-plan.test.ts`**: correct the route-set pin — the
  test keeps its NAME ("matches exactly the six AI-backed routes the
  conventions scanner knows") and its body finally matches it: the route
  list comes from `AI_BACKED_ROUTES` (imported from the canonical module),
  the matched count asserts the set's length, and `/api/quiz/skip` is
  asserted NOT to match (with the doctrine comment: the clone skips the
  live's discarded LLM roadmap call — session-11 S11-F5). RED: the
  current 7-alternative pattern matches `quiz/skip` → the pin fails; the
  canonical module does not exist yet → the import fails.
- [x] **R0b. `tests/ai-routes.test.ts`** (NEW, 4 pins): (1) the
  FILESYSTEM-AUTHORITY pin — walk `src/app/api/**` recursively, read every
  `route.ts`, collect the ones importing `@/lib/ai`, derive each route
  path from its directory, and assert the derived set equals
  `AI_BACKED_ROUTES` (the set can never drift from the actual code again);
  (2) the `quiz/skip` exclusion pin (the documented fix — plus
  `AI_ROUTE_PATTERN.test("/api/quiz/skip")` is false); (3) the
  pattern⇔array mutual-consistency pin (every route in the set matches the
  pattern; the pattern's alternation count equals the set's size); (4) the
  no-`/g`-flag pin (`AI_ROUTE_PATTERN.flags === ""` + the behavioral
  double-`.test()` proof — a stateful `lastIndex` would corrupt the second
  call). RED: the module does not exist yet.

### Phase 2 — GREEN: the canonical module + the consumer rewiring (S21-F1)

- [x] **R1. `tests/e2e/ai-routes.ts`** (NEW): `AI_BACKED_ROUTES` — the
  six-route canonical array (the grep-verified `@/lib/ai` importers, the
  conventions scanner's order), with the `quiz/skip` doctrine documented;
  `AI_ROUTE_PATTERN` — DERIVED from the array
  (`new RegExp("api/(" + routes…join("|") + ")")`, no `/g` flag — the
  stateful-`lastIndex` hazard documented), matching the previous
  pattern's semantics exactly minus the spurious `quiz/skip` alternative.
- [x] **R2a. `tests/e2e/shard-plan.ts`**: drop the local regex literal,
  import `AI_ROUTE_PATTERN` from `./ai-routes`, fix the module comment
  ("the canonical route set — see `./ai-routes.ts`, the single source both
  scanners import"). `countSpecSignals` is UNCHANGED (it already builds a
  fresh global regex from `AI_ROUTE_PATTERN.source`); the public surface
  (`AI_WEIGHT_SECONDS`, `specWeight`, `countSpecSignals`, `planShards`,
  `SpecFile`) is unchanged (the pattern's export moves to the canonical
  module; `shard-plan.test.ts` imports it from there).
- [x] **R2b. `tests/e2e-conventions.test.ts`**: drop the local
  `AI_BACKED_ROUTES` const, import it from `./e2e/ai-routes`, and update
  the comment (the set is now canonical + filesystem-pinned in
  `tests/ai-routes.test.ts`). The `aiBacked()` filter semantics
  (`c.route === r || c.route.startsWith(r)`) are unchanged; the scanner
  scope (specs + helpers.ts) is unchanged; no `page.request` calls are
  added, so the conventions stay intact.

### Phase 3 — the plan re-verification (S21-F1's downstream proof)

- [x] **R3.** Re-run the sharded e2e on the fresh build: the wrapper's
  printed weight table must show `session11-parity.spec.ts` at 96 (2 AI
  mentions × 45 + 6 tests — the spurious 45 gone), the re-landed plan
  must balance (the total inventory weight is conserved; the worst-shard
  weight can only stay or drop), and the runtime count invariant must
  hold (the executed sum == `total + N − 1`; the file inventory is
  unchanged — 16 spec files + the setup copy per shard).

### Phase 4 — docs alignment (S21-F2 + S21-F3 + the session-21 entries)

- [x] **R4a.** `Project_Architecture_Document.md` §1.2: the tech-stack
  table's TypeScript row → `noImplicitAny: true` (the [S19] entry and
  K-4 already say it).
- [x] **R4b.** `personalized-tutor-app_SKILL.md` §11: the pre-ship
  checklist counts → 201 unit / 91 e2e (and the command comments match
  the AGENTS table).
- [x] **R4c.** The session-21 entries: AGENTS.md (the canonical-route-set
  invariant + the counts 197 → 201), CLAUDE.md (the session-21
  invariants block + the verify-gate counts + the date), README.md (the
  session-21 section + the counts), PAD v1.18 (the SR line 197 → 201 at
  v1.18; the [S21] revision entry; the testing-table row), SKILL v1.18.0
  (the frontmatter `project_state`; **trap 47** — a duplicated route-set
  constant drifts within the session that creates it: the canonical
  module + the filesystem-authority pin doctrine; §15 the canonical
  constant pattern), this plan's TODO check-offs, `docs/session_21.md`
  rewritten as the formatted session summary (the handoff convention),
  both worklogs (the repo's + the workspace's).
- [x] **R4d.** `.env.example` re-verify (no new env vars — the canonical
  module is test infra; nothing reads process.env).

### Phase 5 — gate, screenshots, delivery

- [x] **R5. Full gate**: lint (zero findings) → typecheck (with
  `noImplicitAny: true`) → unit (197 → 201 with the ai-routes pins; the
  `isolate: false` shuffle-seed re-validation protocol re-run per the
  vitest.config.ts note — a new test file joins the suite) → build → e2e
  SERIAL (the default mode, 91, the `--list` count-invariant) → e2e
  SHARDED (the re-landed balanced plan: 3 shards all green, the runtime
  count assertion green, the wall clock recorded). Kill any orphaned
  `standalone/server.js` on :3100/:311x first per trap 41.
- [x] **R6. Screenshots** (`docs/screenshots/`): the dev server on the
  remediated tree — 109: the authenticated dashboard; 110: the MOBILE
  menu OPEN at 390×844 (the clone's working hamburger — the direct
  contrast to the live's 10th-verified refusal); 111: the hub surface.
- [x] **R7. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim;
  remote ref verified == HEAD; key shredded). The credential-bearing
  probe scripts (`scripts/s21-*.cjs` in the WORKSPACE scripts/
  directory) never enter the repo tree — the established convention.
  Then the session-log commit (`docs/session_22.md` with this session's
  raw transcript, per the handoff convention).

---

## Part C — Plan-vs-code validation (pre-execution)

1. **R0's RED state is reproducible**: the corrected shard-plan pin
   asserts `AI_ROUTE_PATTERN.test("/api/quiz/skip") === false` — the
   current pattern's alternation includes `quiz\/skip`, so the assertion
   FAILS (RED); the import of the nonexistent `./e2e/ai-routes` fails the
   new test file at load (the conventional RED) ✓.
2. **The derived pattern's semantics are verified equivalent minus the
   excluded route**: the current literal
   `api\/(courses\/generate|quiz\/generate|quiz\/submit|quiz\/skip|chat|challenge|lessons\/content)`
   — `\/` in a regex literal is the plain `/`, so the derived
   `api/(courses/generate|quiz/generate|quiz/submit|chat|challenge|lessons/content)`
   matches the same strings for every route in the six-route set;
   alternation order affects only which alternative fires, never whether
   a match exists, and the `/g` scan counts non-overlapping matches
   either way ✓. The `chat` prefix inside `api/challenge` matches via the
   `chat` alternative in BOTH forms — one match per occurrence, no
   double-count ✓.
3. **The consumers' rewiring is behavior-preserving**: the conventions
   scanner's `aiBacked()` filter (`c.route === r ||
   c.route.startsWith(r)`) reads the same six strings from the canonical
   array — and NO spec makes a request-level call to `/api/quiz/skip`
   (the only mention in the spec tree is the flow comment), so the
   timeout-convention results are byte-identical ✓. `countSpecSignals`
   already rebuilds a fresh global regex from `AI_ROUTE_PATTERN.source`
   — the no-`/g` property carries over and is pinned ✓.
4. **The plan input changes at exactly one file**: the corrected route
   set counts `session11-parity.spec.ts`'s mentions as 2 (the two
   `/api/quiz/submit` request calls) instead of 3 (the comment's
   `quiz/skip`) — weight 141 → 96. Every other file's weight is
   unchanged (`session12`:8, `session13`:5, `session5`:3, `auth`:1; the
   helper-driven flows were never statically counted — the documented
   undercount, S21-F5). The 16-file inventory and the 91-test total are
   unchanged, so the count invariant's expected sum is unchanged ✓.
5. **The unit count moves 197 → 201** (four new `it`s in
   `tests/ai-routes.test.ts`; the shard-plan route-set pin is corrected
   in place — its count is unchanged). Vitest's `include`
   (`tests/**/*.test.ts`) picks up the new file; the shuffle protocol
   applies (a new test file joins the suite — re-validate `isolate:
   false` with a shuffle seed after the pins land) ✓.
6. **The conventions stay intact**: the e2e-conventions scanner reads
   `*.spec.ts` + `helpers.ts` only — `ai-routes.ts` is outside its scope
   and contains no `page.request` calls; the new `tests/ai-routes.test.ts`
   reads `src/app/api/**` (read-only, node fs — same pattern as the
   conventions scanner's own fs walk) ✓.
7. **The authority pin's filesystem walk is well-defined**: every
   `src/app/api/**/route.ts` maps to exactly one route path (its
   directory relative to `src/app/api`, prefixed `/api`); exactly six
   import `@/lib/ai` (grep-verified this session: challenge, chat,
   courses/generate, lessons/content, quiz/generate, quiz/submit — the
   `[id]` dynamic segment dir is not an AI importer) ✓.

Execution order note: Phase 1 (RED) → Phase 2 (the canonical module +
rewiring, fast gate) → Phase 3 (the sharded re-verification) → Phase 4
(docs) → Phase 5 (full gate → screenshots → commit → push → the log
commit).
