# Remediation Plan — Session 15

Repo state at start: `6429a1e` (session-14 complete at `6ee1e55` + the log
commit `9703c5c`; the new `docs/session_15.md` = the session-14 transcript,
per the handoff convention). The workspace PERSISTED — `.env` with
`DATABASE_URL="file:../db/custom.db"` + `db/custom.db` + `db/e2e.db` at the
repo root + `node_modules` verified in place; `.env.example` re-verified
byte-identical; the vitest + playwright configs verified wired (179 unit,
91 e2e). The stale shell `DATABASE_URL` trap re-armed itself
(`file:/home/z/my-project/db/custom.db` overrides `.env`) — every dev/CLI
command ran under `env -u DATABASE_URL`.

Audit sources: the baseline gate re-run fresh (lint ZERO findings ·
typecheck ✓ · 179 unit ✓ · build ✓ · the mobile-navigation spec re-run
12/12 on the fresh build), a live re-probe (login, the bundle hash, the
mobile-nav real-tap re-verification at 390×844 hasTouch — the prompt's
headline, 6th consecutive session), a systematic trap-39/trap-40 scan of
all 15 e2e spec files + 14 unit test files (a persisted scanner:
`scripts/s15-audit-scan.py` — outside the repo tree, not committed), and a
lint-hardening experiment matrix (each suppressed rule force-enabled at
repo scope, findings counted). **The live app bundle is byte-identical to
the recon copy for the 6th consecutive session (md5 `f99e7279…`, 788 085
bytes — `index-CkEI9gsZ.js`; the platform shell `index-D96eRrlv.js` is
94 919 bytes, session-13's identification)** — every prior decode stands.
scandihaven re-consulted per the prompt (unchanged at `cb0002a`; nothing
new to adopt). The repo's Tailwind v4 skills re-consulted for the
mobile-nav headline (the toaster-cover class-D taxonomy; all 8 trap pins
re-verified intact in `globals.css` — zero actual `rounded-full` class
usages in `src/`, the one grep match is inside a comment; the radius/
blur/shadow/font-weight pins + the sonner pointer-events rules). The
`skills/` folder is excluded from code checking, testing and compilation
throughout.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** latent-flake/test-gap ·
**P3** polish/hygiene.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S15-F1 | **The trap-39 60s-timeout convention was never BACKFILLED to the four specs session-13 did not touch.** The session-13 convention ("every `page.request` call to an AI-backed route carries an explicit `timeout: 60_000` — Playwright's request default is 30s while the AI seam budgets 45s") was applied to session12/session13's specs only. Eight call sites in the OLDER specs still ride the 30s default: `mobile-navigation.spec.ts:93,96` (2× `POST /api/courses/generate`), `session11-parity.spec.ts:33` (`freshCourse`'s generate), `:192,216` (2× `POST /api/quiz/submit`), `session5-parity.spec.ts:66` (generate), `:71` (submit), `session8-parity.spec.ts:42` (generate). The suite passes in this sandbox only because the unreachable SDK 429s into the fallbacks INSTANTLY — a reachable-but-slow LLM aborts these calls at 30s mid-test, the exact flake class trap 39 documents. Verified by the persisted scanner + manual reads of every flagged block. | scanner output + sed reads of all 4 files | **P2** |
| S15-F2 | **The e2e course-fixture helpers are triplicated.** `generateCourse(page, topic)` (session12:29-41, session13:40-52) and `freshCourse(page)` (session11:32-41 — the SAME logic under a different name, and the one missing the timeout) are three near-verbatim copies; the `GENERATED` topic list + the `afterEach` enrollment-cleanup + student-restore block repeats across the same three specs (session11:45-63, session12:43-64, session13:67-90 — ~40 lines each, only the topic list differing); session13 additionally carries `submitScore`. ~120 duplicated lines total. The session-14 handoff's own suggested cleanup ("e2e helper 去重提取"). Drift already happened once (the freshCourse timeout gap is F2/F1's root cause). | the three spec files, read whole | P3 |
| S15-F3 | **The lint gate suppresses rules the codebase already passes.** `eslint-config-next` v16's core-web-vitals layer enables the FULL react-hooks v7 ruleset by default (purity/set-state-in-effect/immutability/refs/… at error, exhaustive-deps at warn); the scaffold's override block turns `react-hooks/exhaustive-deps` AND `react-hooks/purity` off, plus a raft of core rules. Experiment matrix (force-enabled at repo scope, findings counted): `react-hooks/purity` **0** · `prefer-const` **0** · `no-unreachable` **0** · `no-redeclare` **0** · `no-useless-escape` **1** (`domain.ts:96` — `\.` needlessly escaped inside the `[:\.\-\s]` character class of the live-decoded `Step N:` strip regex; the regex semantics are unit-pinned by `tests/domain-session13.test.ts`) · `no-console` **61, ALL in `scripts/*.mjs` + `prisma/seed.ts`** (dev probe scripts whose console IS their output mechanism — zero in `src/`) · `react-hooks/exhaustive-deps` **3, all intentional suppressions** (`lesson-view.tsx:132,137` — the quiz-flow timing effects fire on lesson/question-change ONLY; `onboarding-dashboard.tsx:178` — the pending-setup pickup fires on publicMode change only; adding the deps without useCallback refactors would re-fire reset effects mid-quiz and break the pinned auto-advance semantics). The session-14 handoff's third suggested direction. | the experiment matrix output (this session) | P3 |
| S15-F4 | CONFIRMED MATCHING / documented (no action): the live app bundle **byte-identical for the 6th consecutive session** (md5 `f99e72793316ead62b335b6fd55ed6d5` — every decode stands); login works (the account remains onboarding-state — the documented entity-write 403 block; "Loading your learning space…" → the onboarding surface); **the mobile-nav headline re-verified for the 6th consecutive session** (390×844 hasTouch: the live's hamburger tap STILL REFUSES — `elementFromPoint` at the button center IS the `fixed top-0 z-[100]` toaster container with `pointer-events: auto`, `TimeoutError: locator.tap: Timeout 5000ms exceeded`; the clone's fix + real-tap pins hold — `mobile-navigation.spec.ts` re-run 12/12 on the fresh build, the hamburger tap + Switch Course + guest Sign In + hub tabs all green); the unauthenticated mobile `/hub` visit bounces to `login?from_url=<full-url>` (the session-10 `navigateToLogin` decode, re-observed); scandihaven unchanged (`cb0002a`); `.env`/`.env.example` byte-identical; vitest + playwright configs verified wired; all 8 Tailwind v4 trap pins intact (zero actual `rounded-full` in `src/`); the unit layer carries ZERO vacuous `expect(true)`-style assertions (the trap-40 scan across all 29 test files); the trap-40 lens on canvas-count assertions finds the 2→3 streak drive still confounded but DOCUMENTED as content-adjacent (the S14-F6 isolation drive carries the preset's confound-free pin — the hole is closed, the old drive kept for its content assertion). | probes + code | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — the trap-39 self-enforcement pin (TDD: the convention test lands RED against the current specs)

- [x] **R0. Write `tests/e2e-conventions.test.ts`** (S15-F1): a unit-level
  conventions pin — the trap-40 doctrine applied to the test suite itself
  ("a convention nobody enforces is a convention nobody keeps"). The test
  reads every `tests/e2e/*.spec.ts` source, extracts each
  `page.request.<method>(…)` call with a BALANCED-PAREN scanner (not a
  line-window — deterministic attribution), resolves the first API-path
  string literal in the argument region, and for every call whose route is
  AI-backed (`/api/courses/generate`, `/api/quiz/generate`,
  `/api/quiz/submit`, `/api/chat`, `/api/lessons/content`,
  `/api/challenge` — the six routes that import from `@/lib/ai`, verified
  by grep; `/api/quiz/skip` is NOT — the clone skips the live's discarded
  LLM call, the documented S11 fix) asserts the argument region carries
  `timeout: 60_000`. Two guard tests ride along: (a) the scanner finds
  MORE THAN ZERO AI-backed calls (a scanner that silently matches nothing
  pins nothing — trap 40's own lesson); (b) the helpers file itself
  (R2) complies. RED state: 8 violations (S15-F1's list).
- [x] **R1. Backfill the 8 missing `timeout: 60_000`s** (S15-F1): the two
  generates in `mobile-navigation.spec.ts`, the `freshCourse` generate + the
  two submits in `session11-parity.spec.ts`, the generate + submit in
  `session5-parity.spec.ts`, the generate in `session8-parity.spec.ts`.
  GREEN: the conventions test passes; the four specs re-run green.

### Phase 2 — the e2e fixture-helper extraction (behavior-preserving refactor)

- [x] **R2. Create `tests/e2e/helpers.ts`** (S15-F2): export
  `generateCourse(page, topic)` (the session13 shape — post + `gen.ok()`
  + `json.ok` + returns `courseId`, `timeout: 60_000`), `submitScore(page,
  courseId, score, total = 5)` (session13's shape verbatim),
  `cleanupGeneratedEnrollments(page, topics)` and `restoreDemoStudent(page)`
  (the afterEach bodies). Migrate: session11 (`freshCourse` DELETED →
  `generateCourse(page, "Astronomy")` — the timeout arrives with the
  helper; the afterEach calls the two cleanup helpers), session12 (the
  local `generateCourse` + afterEach bodies deleted → imports),
  session13 (the local `generateCourse`/`submitScore` + afterEach bodies
  deleted → imports), session5/session8/mobile-navigation (their one-off
  generate calls → `generateCourse`; the helper's `gen.ok()` assertion is
  a strictly-stronger precondition, behavior-equivalent for passing
  states). NOT migrated: the 422-family and custom-payload submits (their
  answer arrays carry documented test meaning), session12's material-mode
  generate (a distinct mode payload, already timeout-carrying). The
  playwright `testDir` never matches `helpers.ts` (the default testMatch
  is `**/*.@(spec|test).*` — helpers is a plain import); the vitest
  include patterns (`*.test.ts`) never match it either. Invariance: the
  e2e `test()` count stays EXACTLY 91; the full suite re-runs green.

### Phase 3 — the lint hardening (the handoff's third direction)

- [x] **R3. Harden `eslint.config.mjs`** (S15-F3): delete the
  `react-hooks/purity: "off"` override (the next-default ERROR returns —
  zero findings, experiment-verified twice); enable `prefer-const`,
  `no-unreachable`, `no-redeclare`, `no-useless-escape` at `"warn"`
  (zero findings modulo R3b); enable `no-console` at `"warn"` with a
  file-scoped block reverting `scripts/**` + `prisma/**` to `"off"` (the
  probe scripts' console IS their output — 61 of 61 findings live there).
  **R3b.** Fix `domain.ts:96` — un-escape the `\.` inside the character
  class (`[:\.\-\s]` → `[:.\-\s]`): identical regex semantics (a `.` is
  literal inside a class), guarded by the `parseRoadmap` unit pins
  (re-run green = the proof). **R3c.** `react-hooks/exhaustive-deps` STAYS
  off, now with an explicit rationale comment in the config (the 3
  intentional suppressions in the pinned quiz-flow timing effects — the
  useCallback refactor risk to the e2e-pinned auto-advance semantics
  outweighs the lint nicety). Verify: `bun run lint` → ZERO findings.

### Phase 4 — gate, screenshots, docs, delivery

- [x] **R4. Full gate**: lint (zero findings) → typecheck → test
  (179 + the conventions pins) → build → e2e (91 — the count invariant of
  R2).
- [x] **R5. Screenshots** (`docs/screenshots/`): the dev server on the
  remediated tree — the authenticated dashboard, the MOBILE menu OPEN
  (the clone's working hamburger — the direct contrast to the live's
  6th-verified refusal), and the hub mobile tab shell at 390×844.
- [x] **R6. Docs alignment**: AGENTS.md (the self-enforced trap-39
  convention + the helpers module + the hardened lint rules + counts),
  CLAUDE.md (condensed), README.md (the session-15 section + counts), PAD
  v1.14 `[S15]` + the testing table, SKILL v1.14.0 (trap 39 amended:
  "now unit-enforced by tests/e2e-conventions.test.ts"; §7 the
  conventions-pin pattern), docs/session_15.md rewritten as the formatted
  session summary (the handoff convention), this plan's TODO check-offs,
  repo `worklog.md`; `.env.example` re-verify (no new env vars).
- [x] **R7. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim;
  remote ref verified == HEAD; key shredded). The credential-bearing probe
  scripts (`scripts/s15-*.cjs`, `scripts/s15-audit-scan.py`) never enter
  the tree (the established convention — they live in the workspace's
  scripts/ outside the repo).

---

## Part C — Plan-vs-code validation (pre-execution)

1. **R0's scanner targets are real:** the persisted scanner
   (`s15-audit-scan.py`) + manual `sed` reads confirm all 8 call sites
   (mobile-nav 93/96 — the register at :88 is a FALSE positive of the
   line-window heuristic, which the balanced-paren scanner eliminates by
   construction; session11 33/192/216; session5 66/71; session8 42).
   Every flagged call block lacks `timeout:` ✓. The six AI-backed routes
   are verified by `grep -rln "from \"@/lib/ai\"" src/app/api/` → exactly
   `quiz/submit`, `quiz/generate`, `courses/generate`, `lessons/content`,
   `challenge`, `chat` ✓ (`quiz/skip` absent — the documented fix).
2. **R1 is additive-only:** adding `timeout: 60_000` to an existing
   `page.request.post` options object changes no assertion, no payload,
   no flow — the specs re-run green is the proof. Playwright's API
   accepts `timeout` on every request method ✓.
3. **R2's behavioral equivalence:** session13's `generateCourse` is the
   canonical body (already timeout-carrying); session11's `freshCourse`
   differs only in the missing timeout + name; session12's copy is
   byte-identical to session13's modulo the doc comment. The afterEach
   bodies differ ONLY in the topic list (session11: `["Astronomy"]`;
   session12: `["Astronomy","Botany"]` + the runtime `GENERATED.push("Cell
   Biology")`; session13: 4 topics) — parameterizing topics preserves
   each spec's cleanup scope exactly ✓. session12's `GENERATED.push`
   mutates a const array at runtime — the helper's `topics` parameter
   receives the same mutable reference ✓. session5/8/mobile-nav's
   generates: the helper returns `courseId` where the current code reads
   `json.data.courseId` — identical value; the helper's added
   `gen.ok()` assertion only strengthens a passing precondition ✓.
   `submitScore(page, id, 6, 7)`'s total parameter is already the
   session-14 shape (default 5) ✓.
4. **R2's file-placement safety:** playwright's default testMatch
   (`**/*.@(spec|test).?(c|m)[jt]s?(x)`) never matches `helpers.ts`;
   vitest's include (`src/**/*.test.ts`, `tests/**/*.test.ts`) never
   matches `tests/e2e/helpers.ts` ✓. The `@playwright/test` import inside
   helpers.ts (for the `Page` type) is type-only at runtime ✓.
5. **R3's zero-findings claims are experiment-verified:** purity
   (2 runs, 0 findings), prefer-const/no-unreachable/no-redeclare (1 run
   each at repo scope, 0 findings), no-useless-escape (1 finding — the
   R3b fix, guarded by the parseRoadmap unit pins:
   `tests/domain-session13.test.ts` pins the strip semantics on
   `"Step 1: …"` inputs where the character class matches — the unescape
   cannot change the language the regex accepts, `\.` ≡ `.` inside `[…]`)
   ✓. no-console: 61/61 findings in `scripts/*.mjs` + `prisma/seed.ts`,
   0 in `src/` ✓ — the scoped-off block mirrors the repo's existing
   ignore-block style ✓. exhaustive-deps stays off with the rationale
   comment (3 intentional suppressions, verified by the warn-level run:
   `onboarding-dashboard.tsx:178`, `lesson-view.tsx:132,137`) ✓.
6. **RED-state establishment:** R0's test is genuinely RED pre-R1 (8
   violations — the scanner output is reproducible via the persisted
   audit script). R2/R3 are behavior-preserving refactors — the 179-unit
   + 91-e2e green state is the harness; the conventions test + the lint
   zero-findings gate are the new pins that land with them.
7. **The e2e-count invariant:** R0/R1/R2/R3 add zero e2e `test()` calls
   and delete zero — the suite stays 91 ✓. The unit count grows by the
   conventions test's checks (3 planned: the timeout pin, the scanner
   self-test, the helpers compliance) → 179 + 3 = 182 expected.
8. **No new infrastructure:** the conventions test needs only
   `node:fs` + `node:path` + `import.meta.url` resolution (node
   environment, already the vitest default) — the vitest config is
   untouched ✓.

Execution order note: Phase 1 (RED → GREEN) → Phase 2 (the extraction,
suite re-run) → Phase 3 (lint, zero-findings proof) → fast gate → build →
Phase 4 (full e2e → screenshots → docs → push).
