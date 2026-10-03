# Remediation Plan — Session 14

Repo state at start: `348d3f8` (session-13 complete at `8797fec` + the log
commits `53fc9be`/`348d3f8`; the workspace PERSISTED — `.env` with
`DATABASE_URL="file:../db/custom.db"` + `db/custom.db` at the repo root +
`node_modules` verified in place; the stale shell `DATABASE_URL` trap re-armed
(`file:/home/z/my-project/db/custom.db` overrides `.env`) — every dev/CLI
command ran under `env -u DATABASE_URL`).

Audit sources: a two-axis code review of the session-13 code commit (`8797fec`,
parallel sub-agents per the repo's `skills/code-review`: Standards + Spec
axes), my own verification reads of every finding against the current files,
the baseline gate re-run fresh (lint 1 benign warning · typecheck ✓ · 175 unit
✓ · build ✓), and a live re-probe (login, the bundle hash, the mobile-nav
real-tap re-verification at 390×844 hasTouch — the prompt's headline, 5th
consecutive session). **The live app bundle is byte-identical to the recon
copy (md5 `f99e7279…`, 788 085 bytes)** — every prior decode stands. The
scandihaven reference repo re-consulted per the prompt (unchanged at
`cb0002a`; nothing new to adopt). The repo's Tailwind v4 skills re-consulted
for the mobile-nav headline (the clone's toaster-cover fix matches the class-D
"behind another layer" taxonomy; all 8 trap pins re-verified intact in
`globals.css` — zero `rounded-full` classes in `src/`, radius/blur/shadow/
font-weight pins, the sonner pointer-events rules). The `skills/` folder is
excluded from code checking, testing and compilation throughout.

Baseline gate: lint 1 warning (S14-F5 below — the only one) · typecheck ✓ ·
175 unit ✓ · build ✓ (the e2e baseline rides the session-13 push's green run;
the full e2e re-runs below as part of the gate).

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** polish/test-gap. The `skills/`
folder is excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S14-F1 | **The R1 prompt-tail unit pins are VACUOUS — the "verbatim parity" claim of session-13 is unpinned.** Both review axes converged on it and my read confirms: `tests/ai-seam.test.ts`'s test named "generate-time (no pct): the OBJECT schema + the '2-3 sentence description.' tail" contains ONLY `expect(true).toBe(true)`; its comment claims "the mock's call history is not directly exposed" — but it is: the mocked `completions.create(req)` receives `req.messages`, and the `vi.hoisted` factory can capture them. Neither the object tail nor the string-array tail is asserted anywhere — a regression that collapses the S13-F5 split back onto either single schema passes the suite silently. The session-13 remediation plan's own R1 line — "Unit pins: the pct-branch prompt carries the string-array tail; the no-pct branch carries the object tail with '2-3 sentence description.'" — was thus only half-delivered (the code is verbatim-correct; the pin is not). | `tests/ai-seam.test.ts:113-133` (the vacuous body); `src/lib/ai.ts:111-119` (the two tails) | **P2** |
| S14-F2 | **The submit-route validation is scattered and carries dead/duplicated guards.** (a) the `total` 422 sits AFTER the enrollment DB lookup (`route.ts:58-67`) while its answers/score siblings run pre-I/O — the "422 symmetry" holds in outcome but not placement; (b) line 30 computes the answers coercion BEFORE the present-but-invalid rejection at 31-33 (the derivation runs for payloads that are then rejected); (c) line 68's `body?.total && body.total > 0` can never be false once line 62-67 has 422'd every invalid present total (a present `total` is a validated integer ≥ 1) — a dead guard; (d) lines 72-75 re-derive `score` through the full `typeof/Number.isInteger/≥0/≤total` cascade that lines 39-46 and 69-71 have already guaranteed — the ternary always takes the `body.score` branch when present. Behavior is correct for every input (the 422 family e2e pins it); the structure violates the route's own "validate first, derive after" doctrine. | `src/app/api/quiz/submit/route.ts:30-75` | P3 |
| S14-F3 | **The stage-object element predicate is hand-rolled twice.** `ai.ts:139` (`typeof s === "object" && s !== null && typeof s.title === "string"`) and `domain.ts:77` (the identical predicate cast for `RoadmapStage`) are the same check — the dual-shape contract made both files need it. domain.ts is the CLAUDE-designated home for pure domain helpers and ai.ts already imports from it. | `ai.ts:137-140`; `domain.ts:77-82` | P3 |
| S14-F4 | **ai.ts comment/constant drift**: the `S12-F4 + S13-F5` comment says "the live carries THREE distinct roadmap prompts" then enumerates TWO branches — the third (the skip-time variant the live's wO discards by its own code) is real but only named in the docs, so the count reads as wrong; and the magic `3` in `stages.length >= 3` / `stages.slice(0, 3)` duplicates `STAGES_PER_COURSE` (exported from domain.ts, already in ai.ts's import neighborhood — just not imported). | `ai.ts:99-109,136,142` | P3 |
| S14-F5 | **lint warning — an unused `eslint-disable-next-line import/first`** at `tests/ai-seam.test.ts:25` (the directive suppresses nothing since the session-13 final polish reordered the imports). The repo's gate is "0 errors"; this warning is the only one. | lint output | P3 |
| S14-F6 | **The streak-burst e2e drive is confounded.** The 2→3 switch crosses BOTH the exact-3 streak boundary AND the Learner(40%)→Scholar(60%) tier change — either effect can produce the asserted canvas (canvas-confetti renders onto ONE shared global canvas, so `count() > 0` cannot discriminate). The label drive IS isolated (1→4 crosses no 3/7 boundary); the streak drive is not — a regression that breaks ONLY the streak preset (the 80-particle burst) while leaving the label preset intact would still pass the streak test. Isolation math for a clean drive: scores 6 and 7 with total 7 → `studyStreakDays` 6→7 (the exact-7 crossing fires) while `quizProgressPercent` clamps 120→140 to 100→100 → tier Master→Master (no label change) — the ONLY possible firing effect is the streak burst. | `tests/e2e/session13-parity.spec.ts:127-152`; `domain.ts:156-163,373-378,390-397` | P3 |
| S14-F7 | **The session-11 one-shot dev-server probes are superseded** (`scripts/verify-s11-quiz.mjs`, `verify-s11-quiz2.mjs`, `verify-s11-quiz3.mjs`, `verify-s11-skip.mjs`): their coverage is fully carried by `tests/e2e/session11-parity.spec.ts` (the E3 surface, the skip flow — pinned at the production build, which is stronger than a dev-server one-shot). No credentials inside (verified by scan — the demo account pair is in the README by design). The session-13 handoff itself suggested this cleanup ("可考虑 verify-s11-*.mjs 一次性探针归档清理"); git history is the archive. | `scripts/` (4 files, 358 lines total) | P3 |
| S14-F8 | CONFIRMED MATCHING / documented (no action): the live app bundle **byte-identical** (md5 `f99e7279…` — all decodes stand; 5th consecutive session); login works and the account remains onboarding-state (the documented entity-write 403 block — "Dive into Literature"); **the mobile-nav headline re-verified for the 5th consecutive session** (390×844 hasTouch: the tap still REFUSES — `elementFromPoint` at the hamburger center IS the `fixed top-0 z-[100]` toaster container with `pointer-events: auto`; the live's hamburger carries NO aria-label; the clone's `pointer-events-none` fix + the real-tap e2e pins hold; the clone's hamburger additionally ships `aria-label="Open menu"`/`aria-haspopup`/`aria-expanded` — a documented a11y-positive divergence); the live's `/hub` bounces the unauthenticated mobile context to `login?from_url=<full-url>` (the session-10 `navigateToLogin` decode, re-observed); `.env`/`.env.example` byte-identical (no new env vars); vitest + playwright configs verified wired (175 unit, 90 e2e `test()` calls); all 8 Tailwind v4 trap pins intact; scandihaven unchanged; the `avatarLetter("sepnetflix2023")` unit input and the `probe-fresh-user.mjs` comment reference the account NAME only (no credential pair — the real credentials never entered the tree). | probes + code | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — The prompt-capture pin (the headline; TDD: the pins land RED against the vacuous state)

- [x] **R0. Extend the transport mock to CAPTURE the request** (S14-F1): the
  `vi.hoisted` holder gains a `prompts: string[]` array; the mocked
  `completions.create(req)` records the LAST message's content (`req.messages`
  — `complete()` puts the user prompt last; `generateCourseStages` makes
  exactly one transport call per invocation). The capture is defensive
  (`Array.isArray(req?.messages) ? … : ""`).
- [x] **R1. Replace the vacuous test with the real verbatim pins** (S14-F1):
  (a) the no-pct branch — `generateCourseStages("Botany")` → the captured
  prompt contains `Create exactly 3 progressive learning stages for the
  course "Botany".` AND the verbatim object tail
  `Return JSON: { "steps": [{ "title": "Stage title", "description": "2-3 sentence description." }] }`;
  (b) the pct branch — `generateCourseStages("Botany", { pct: 60 })` → the
  captured prompt contains `Based on someone scoring 60% on a diagnostic quiz
  about Botany` AND the verbatim string-array tail
  `Return JSON: { "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."] }`;
  (c) the material variant — `{ pct: 60, material: " chapter 1 " }` → the
  prompt carries `their uploaded material` and `"Custom Material"` (not
  "Botany"); (d) a NEGATIVE pin — the pct-branch prompt does NOT contain
  `"description": "2-3` and the no-pct prompt does NOT contain `["Step 1:`
  (the split is bidirectional). Delete the `expect(true).toBe(true)` body and
  its stale "not directly exposed" comment; remove the unused
  `eslint-disable` (S14-F5 rides here — the lint gate returns to zero
  findings).

### Phase 2 — The streak-burst isolation pin

- [x] **R2. NEW e2e drive in `tests/e2e/session13-parity.spec.ts`** (S14-F6):
  "the streak burst fires ISOLATED — the exact-7 crossing with NO label
  change". Create course A (score 6, total 7) + course B (score 7, total 7)
  via the submit API (`submitScore` gains an optional `total` parameter,
  default 5 — every existing call site unchanged); `quizProgressPercent`
  clamps both to 100 → tier Master→Master; `studyStreakDays` 6→7 crosses
  EXACTLY 7 → `confettiAt(6,7)` fires while the label effect cannot. Mount at
  A (ref initializes without firing — assert zero canvases), pill-switch to B
  → a canvas appears (8s `expect.poll` per trap 39). This is the streak
  burst's first confound-free behavioral pin (the 2→3 drive keeps its
  content-adjacent value; the isolation closes the regression hole).

### Phase 3 — The submit-route consolidation (behavior-preserving refactor)

- [x] **R3. Validate-first, derive-after** (S14-F2): move the `total` 422
  block BEFORE the enrollment lookup (placement symmetry with the
  answers/score 422s — all validation pre-I/O); swap the answers
  rejection/coercion order (the 422 check first, then
  `const answers = Array.isArray(body?.answers) ? body.answers : []`);
  replace the dead `body?.total && body.total > 0` guard with
  `const total = typeof body?.total === "number" ? body.total : answers.length || 5`
  (post-validation a present total is a positive integer; absent → the
  documented degrade); simplify the score derivation to
  `const score = typeof body?.score === "number" ? body.score : 0` (the
  pre-I/O 422 and the `score > total` check guarantee every present score is
  a valid integer in range — the re-derivation cascade is dead). The 422
  STATUS MATRIX must stay byte-identical for every input class — pinned by
  the existing e2e family (S13-F4's five cases + S12-F8's family in
  session12-parity) which this phase keeps green without edits.

### Phase 4 — The shared guard + constants + comments

- [x] **R4. One predicate, one constant** (S14-F3/F4): `domain.ts` exports
  `isStageObject(s: unknown): s is { title: string; description?: unknown }`
  (the exact predicate both sites hand-rolled); `parseRoadmap`'s object
  branch and `ai.ts`'s dual-shape element validator consume it. `ai.ts`
  imports `STAGES_PER_COURSE` from `@/lib/domain` and replaces the magic
  `stages.length >= 3` / `stages.slice(0, 3)` (the constant IS the live's
  "exactly 3" contract — named where the rest of the grid constants live).
- [x] **R5. The comment corrections** (S14-F4): the `ai.ts:99` comment names
  all THREE live prompts including the skip-time variant (the wO decode: the
  live fires it and DISCARDS the result — hence two branches in the clone);
  the submit-route comments move with their code blocks (R3's reorder).

### Phase 5 — Cleanup, gate, screenshots, docs, delivery

- [x] **R6. Delete the superseded one-shot probes** (S14-F7):
  `scripts/verify-s11-quiz.mjs`, `verify-s11-quiz2.mjs`,
  `verify-s11-quiz3.mjs`, `verify-s11-skip.mjs` — the e2e spec carries the
  coverage at the production build; git history is the archive (the
  session-13 handoff's own suggested cleanup).
- [x] **R7. Full gate**: lint (zero findings post-R1) → typecheck →
  test (175 + 4 new ≈ 179) → build → e2e (90 + 1 new = 91).
- [x] **R8. Screenshots** (`docs/screenshots/`): the fresh authenticated
  dashboard, the /hub MOBILE tab shell (the session-13 handoff's third
  suggestion — Learn/Ask Nori/Lessons at 390×844), and the course-switch
  flow on the remediated build.
- [x] **R9. Docs alignment**: AGENTS.md (counts 179/91 + the
  prompt-capture-in-the-mock invariant + the isolation-drive note), CLAUDE.md
  (condensed), README.md (the session-14 section + counts), PAD v1.13
  `[S14]` + the testing table, SKILL.md v1.13.0 (§7 the captured-transport
  pattern; the trap log gains the vacuous-assertion trap — "a test named for
  a contract it never observes"), docs/session_14.md formatted summary, this
  plan's TODO check-offs, repo `worklog.md`; `.env.example` re-verify (no
  new env vars).
- [x] **R10. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim; remote
  ref verified == HEAD; key shredded). The credential-bearing probe scripts
  never enter the tree (the established convention).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `tests/ai-seam.test.ts:8-23` — the mock factory closes over the
   `vi.hoisted` holder; the mocked `create: async () => ({ chat: {
   completions: { create: async () => … } } })` currently IGNORES its
   arguments = R0's extension point ✓. `ai.ts:43-59` — `complete()` calls
   `zai.chat.completions.create({ messages, stream, thinking })` with the
   user prompt LAST in `messages` ✓; `generateCourseStages` makes exactly one
   `complete()` call ✓ (grep: one call at `ai.ts:120`).
2. `ai.ts:111-119` — the two prompt tails verbatim (the object tail with
   "2-3 sentence description."; the string-array tail) = R1's assertion
   targets ✓; the pct branch interpolates `${opts.pct}%` and the
   material-aware subject swap (`their uploaded material` /
   `"Custom Material"`) at `:113-115` = R1(c)'s targets ✓.
3. `session13-parity.spec.ts:47-57` — `submitScore` posts
   `{ answers: [1,1,1,1,1], total: 5, score }`; adding an optional `total`
   param keeps every existing call byte-identical ✓. The isolation math:
   `quizProgressPercent(6|7, true)` = `min(100, round(6|7/5*100))` = 100 →
   `masteryLabelTier(100)` = Master for both (domain.ts:156-163, 417-423);
   `studyStreakDays(6|7)` = 6|7 (clamped at 7 — domain.ts:373);
   `confettiAt(6, 7)` → `nextScore === 7` → fires (domain.ts:390) ✓. The
   submit API accepts score ≤ total (route.ts:69-71) — score 6/7 with
   total 7 is valid ✓. The `answers: [1,1,1,1,1]` entries pass the -1..3
   validation ✓ (answers.length need not equal total — the route never
   checks that, matching the live's contract).
4. Blast radius of R3: the 422 family e2e (session13:184-217 +
   session12's submit family) drives the exact same inputs — the reorder
   returns the same statuses (validation is order-independent for every
   input class EXCEPT a payload with BOTH an invalid total AND a missing
   courseId: previously 422 (courseId checked before the lookup), still 422
   (total checked before the lookup — either way a 422 fires, only the
   message differs, and no spec pins the message) ✓; a payload with an
   invalid total AND a foreign courseId: previously 404 (lookup first),
   now 422 (total first) — NO spec drives this combination (the 422 family
   always passes a valid owned courseId; the 404 drive in the auth spec
   passes a valid-shaped body) ✓ — the matrix is behavior-equivalent where
   pinned.
5. `domain.ts:77` and `ai.ts:139` — the two predicates are textually
   identical (`typeof s === "object" && s !== null && typeof s.title ===
   "string"`) = R4's extraction is semantics-preserving ✓. `STAGES_PER_
   COURSE` is already exported (domain.ts:6) and consumed by `parseRoadmap`'s
   `.slice(0, STAGES_PER_COURSE)` — ai.ts merely joins the existing import
   block (ai.ts:3-7) ✓.
6. R2's placement: the new test joins the S13-F2 describe block (the
   switch surface); the GENERATED topic list already carries "Astronomy"
   and "Botany" (the cleanup's afterEach deletes them + restores
   current_subject) ✓ — the isolation drive reuses the same pair (score 6/7
   rides the submit API's total parameter; no new course names needed).
7. RED state establishment: R1's pins are RED against the CURRENT code in
   the sense that the vacuous test passes anything (the new assertions land
   with the implementation already verbatim-correct — a deliberate
   pin-the-contract test, not a bug fix; the RED proof is that the
   assertions FAIL if either branch's tail regresses, demonstrable by
   mutation: swapping the tails fails (a)/(b) immediately). R2 is RED
   only in the confound sense (the streak-preset regression hole — the
   isolation drive closes it; pre-R2 the suite cannot distinguish the two
   presets). R3/R4/R5 are behavior-preserving refactors — the existing
   175-unit + 90-e2e green state is the harness ✓.
8. The vitest `server-only` stub alias (vitest.config.ts + tests/stubs/)
   already resolves `ai.ts`'s directive import ✓ — no new infrastructure
   needed for R0/R1.

Execution order note: Phase 1 (the pins) → Phase 2 (the e2e isolation
drive, written RED-first against a temporarily-broken preset to prove the
confound hole, then restored) → Phase 3 → Phase 4 → fast gate → build →
Phase 5 (full e2e → screenshots → docs → push).
