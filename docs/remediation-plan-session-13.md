# Remediation Plan — Session 13

Repo state at start: `ea91746` (session-12 complete at `3123f9f` + the log commits
`02f2ba5`/`ea91746`; the workspace PERSISTED — `.env` with
`DATABASE_URL="file:../db/custom.db"` + `db/custom.db` at the repo root +
`node_modules` verified in place; the stale shell `DATABASE_URL` trap re-armed
(`file:/home/z/my-project/db/custom.db` overrides `.env`) — every dev/CLI
command ran under `env -u DATABASE_URL`).

Audit sources: a two-axis code review of the session-12 code commit (`3123f9f`,
parallel sub-agents per the repo's `skills/code-review`: Standards + Spec axes),
my own empirical probes against the standalone build (the course-switch probe —
mounting at one course and pill-switching to another, observing the rendered
stats + canvases; the wrapper-parser crash repro), a live re-probe (login, the
onboarding state, the mobile-nav real-tap re-verification at 390×844 hasTouch —
the prompt's headline), and **fresh bundle re-decodes** of the wO skip block,
the E3 submit block, the `$P`/G5/c_ regions, and the Kh/roadmap-card string
mappings in `index-CkEI9gsZ.js`. **The live app bundle is byte-identical to the
recon copy (md5 `f99e7279…`)** — every prior decode stands. (The login route
serves the Base44 PLATFORM shell — `static/index-D96eRrlv.js`, 94 KB of
mixpanel/error-reporting runtime with zero app markers — not an app update.)
The scandihaven reference repo re-consulted per the prompt (unchanged at
`cb0002a`; nothing new to adopt). The repo's Tailwind v4 skills re-consulted for
the mobile-nav headline (the clone's toaster-cover fix matches the class-D
"behind another layer" taxonomy; all 8 trap pins re-verified intact in
`globals.css` — zero `rounded-full` classes in `src/`, radius/blur/shadow pins,
the sonner pointer-events rules).

Baseline gate re-confirmed fresh this session: lint ✓ typecheck ✓ 153 unit ✓
build ✓ (the e2e baseline rode the session-12 push's green run; the full e2e
re-runs below as part of the gate).

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** polish/test-gap. The `skills/`
folder is excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S13-F1 | **The `{steps}` wrapper parser trusts the cast — a string-valued `steps` crashes the route with a 500** (violates the "AI features may degrade, never fail" invariant). `generateCourseStages` computes `const stages = Array.isArray(parsed) ? parsed : parsed?.steps;` then `stages.length >= 3 && stages.every(…)`. An LLM answering `{"steps": "Foundation, Application, Mastery"}` (a realistic lazy-string reply — the live's own schema is a STRING array, so this shape is the EXPECTED answer under the S13-F5 fix) passes `length >= 3` (the string's length) and throws `TypeError: stages.every is not a function` — empirically reproduced. The sibling quiz parser in the same file already applies the missing check (`Array.isArray(rawParsed.questions)`). | `src/lib/ai.ts:114-116` (vs sibling `:174-178`); repro: `{"steps": "…"}` → TypeError | **P1** |
| S13-F2 | **`setViewCourseId` is dead code — a same-route course switch renders STALE content.** `dashboard-app.tsx` holds `const [viewCourseId, setViewCourseId] = useState(currentCourseId)` and derives `activeCourse = courses.find(c => c.id === viewCourseId)` — but `setViewCourseId` has NO caller (grep: one occurrence). An App Router same-route navigation (the CoursePill rows' `router.push("/?course=" + id)`, the mobile Switch Course rows) fetches the fresh RSC payload and re-renders `DashboardApp` with the NEW `currentCourseId`/`currentCourse` props — but the component does NOT remount (same type, same tree position), so the state persists at the mount-time course and `activeCourse` never changes. **Empirically confirmed**: mounted at a score-3 course (streak=3, XP=750), pill-switched to a score-2 course → URL updated, the dashboard STILL rendered streak=3/XP=750 (course B's data); the correct streak=2/XP=500 appeared only after a full reload. Every same-route course switch (desktop pill rows, mobile Switch Course rows) shows the wrong course. This is ALSO the true reason the session-12 course-switch confetti drive failed — and the false "the App Router remounts the page on same-route navigation" diagnosis in the session-12 docs (see F3) masked it. | `dashboard-app.tsx:67-73` (the only `setViewCourseId` occurrence); probe: switch → stats stale, 0 canvases; reload → correct stats | **P1** |
| S13-F3 | **The session-12 mechanism claims are empirically false and mutually contradictory.** AGENTS/CLAUDE/session_12/worklog say "the App Router remounts the **keyed CourseDashboard** on a same-route course switch, so the triggers must live above the key boundary"; the session-12 spec's comment says the opposite ("the whole same-route navigation **REMountS** via a new Router Cache entry, so it cannot fire there"). Empirically NOTHING remounts and `activeCourse` never changes (F2 — that's why neither the content nor the refs moved). In a comment-as-invariant repo, two mutually exclusive false stories about the same mechanism are live hazards. | AGENTS.md session-12 invariants block; `tests/e2e/session12-parity.spec.ts:69-74`; `docs/session_12.md:74-77`; worklog Task 22 | P2 |
| S13-F4 | **The submit-route 422 doctrine is applied asymmetrically** (S12-F8's own comment: "a present-but-invalid payload is REJECTED rather than silently coerced"): a present-but-NON-ARRAY `answers` is silently coerced to `[]` → 200; `total` is never type-validated — a string `"5"` passes `total > 0` via coercion and echoes into the gap-analysis prompt; `total: 0.5` with `score: 1` yields `pct = 200` in the roadmap prompt. | `src/app/api/quiz/submit/route.ts:27,52-54` | P2 |
| S13-F5 | **The submit-time roadmap contract diverges from the decode: the live requests a STRING array and stores the strings; the clone requests/persists `{title, description}` objects.** Fresh bundle decode of the E3 submit block: the prompt tail is `Return JSON: { "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."] }` with `response_json_schema: {steps: {type: "array", items: {type: "string"}}}`, and BOTH writes persist the raw strings — `DiagnosticQuiz.roadmap_steps = JSON.stringify(z?.steps || [])` AND `CourseEnrollment.roadmap_steps = JSON.stringify(z?.steps || [])`. The live's renderers handle BOTH shapes: the roadmap card maps `typeof le == "object" && le.title → {name: le.title, label: le.description || ""}` else strips `/^Step\s*\d+[:\.\-\s]*/i` then splits on `" — "` (else `": "` when the index < 40) into name/label; Kh (lesson titles) strips `/^(Lesson|Step)\s*\d+[:\.\-\s]*/i` and takes the pre-`" — "` part as the title. The session-12 decode (F4) captured the prompt BODY but shipped the generate-time OBJECT schema on the submit branch — and the clone's `parseRoadmap` FILTERS OUT strings, so a live-shaped roadmap parses to `[]` → the static fallback. | bundle E3 submit decode (`z?.steps` ×2 writes + the card/Kh mappers); `ai.ts:106-107` vs bundle; `domain.ts:63-82` | P2 |
| S13-F6 | **The 90-particle mastery-label burst has no behavioral pin** (only the streak burst is e2e-driven; `masteryLabelTier`'s unit pins cover the mapping, not the effect), and "E3 fires zero confetti" is likewise un-pinned (the removal is code-only). With F2 fixed, the label burst gains a natural UI drive (switching courses across tier boundaries). | `tests/e2e/session12-parity.spec.ts` (4 checks — streak only) | P2 |
| S13-F7 | **The e2e AI-timeout convention is not applied to the request-level submits** — Playwright's `page.request.post` defaults to a 30s timeout while each submit runs up to two AI calls at `AI_TIMEOUT_MS = 45s`; the file header claims "60s timeouts per the AI-assertion convention" but only the material test's `toBeVisible` honors it. Passes today only because the sandbox SDK fails fast into fallbacks; a reachable-but-slow LLM aborts the submits. Also the confetti positive assertion is a fixed `waitForTimeout(1500)` racing the canvas's own ~2-3s lifetime — a slow refresh reads `count() === 0` and flakes (a poll exits as soon as the canvas appears). | `tests/e2e/session12-parity.spec.ts:19-21,33,77,94,111-118` vs `src/lib/ai.ts:41` | P2 |
| S13-F8 | **The generate-time prompt tail drifts from the decode**: the clone ships `"description": "Stage description"` where the live ships `"description": "2-3 sentence description."` (also the plan-12 R3 quote). Behaviorally immaterial; a verbatim-parity fix is one line. | `src/lib/ai.ts:108-110` vs bundle@469708 | P3 |
| S13-F9 | **Stale comment points at the wrong file**: quiz-app.tsx's header says the dashboard confetti triggers live in `course-dashboard.tsx` — they live in `dashboard-app.tsx` (course-dashboard's own comment says "the PARENT shell"). | `quiz-app.tsx:22-24` | P3 |
| S13-F10 | **Import-style outlier**: `tests/domain-session12.test.ts` is the only domain spec not using the `@` alias (`../../src/lib/domain`). | `tests/domain-session12.test.ts:6` | P3 |
| S13-F11 | **Unit coverage gaps on the new pins**: `confettiAt` never pins a `nextScore` above 7 (e.g. `(4, 8) → false`); `masteryLabelTier` pins "keeps-below" only for the 0/20/40 boundaries (79 → Scholar is unpinned). | `tests/domain-session12.test.ts:12-73` | P3 |
| S13-F12 | **SKILL.md §6 contradicts §7**: §6 still says the quiz-milestone confetti ref-guard lives in `quiz-app.tsx` while §7 (the session-12 rewrite) says E3 fires NO confetti and the triggers live on the dashboard. | `personalized-tutor-app_SKILL.md:267-269` vs `:329-332` | P3 |
| S13-F13 | CONFIRMED MATCHING / documented (no action): the live app bundle **byte-identical** (md5 `f99e7279…` — all decodes stand; the `/login` route's `static/index-D96eRrlv.js` is the Base44 platform shell, not an app update); the account remains onboarding-state (the documented entity-write 403 block); **the mobile-nav headline re-verified for the 4th consecutive session** (390×844 hasTouch: the tap still REFUSES — `elementFromPoint` at the hamburger center IS the `fixed top-0 z-[100]` toaster container with `pointer-events: auto`; the clone's `pointer-events-none` fix + the real-tap e2e pins hold); the skip route matches the freshly decoded wO contract EXACTLY (enrollment reset `quiz_completed:!1, quiz_score:0, roadmap_steps:"", gap_analysis:""` + the student flag + `/?course=` redirect; the live's LLM call is discarded by its own code — `E`/`j` computed, never used); the roadmap-card EMPTY state (the clone's static 3-stage fallback vs the live's transient "Generating your personalized roadmap…" row) stays the documented trap-20 accepted divergence (the live regenerates titles per-visit via LLM — the clone does not; a permanent "Generating…" row would be worse than the static fallback); the streak input reading the enrollment (vs the live's c_ reading the DiagnosticQuiz row for `quizScore` — a post-skip edge where the live's own tiles disagree) stays the documented unified-read decision; `.env`/`.env.example` match (no new env vars); vitest + playwright configs verified wired (153 unit, 86 e2e `test()` calls across 15 spec files); all 8 Tailwind v4 trap pins intact; scandihaven unchanged. | probes + bundle + code | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — The AI seam (TDD: failing tests first)

- [x] **R0. Harden the wrapper parser** (S13-F1): `generateCourseStages` —
  `const stages = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.steps) ? parsed.steps : null)`
  (a string/absent `steps` falls to the static fallback instead of throwing);
  the element validation accepts objects with string titles (the generate
  branch's shape) AND non-empty strings (the submit branch's shape — S13-R1).
  Unit pins in `tests/ai-seam.test.ts` (new, mocked `complete`): (a)
  `{"steps": "Foundation, Application, Mastery"}` → fallback, NO crash;
  (b) `{"steps": ["Step 1: A — desc", "Step 2: B", "Step 3: C"]}` → parsed;
  (c) `{"steps": [{title…}]}` → parsed (the generate shape); (d) bare array →
  parsed; (e) `{"steps": []}` → fallback.
- [x] **R1. The submit-time roadmap contract → the live's verbatim shape**
  (S13-F5): the pct branch's prompt tail becomes `Return JSON: { "steps":
  ["Step 1: ...", "Step 2: ...", "Step 3: ..."] }` (the decoded string schema);
  `generateCourseStages` returns the RAW steps (`(string | StageDraft)[]`) with
  the validation accepting both shapes; the submit route stores them as-is
  (the live's exact write: `JSON.stringify(steps)` — strings when the LLM
  answers, the static object fallback when it degrades); the generate branch's
  prompt tail → `"2-3 sentence description."` verbatim (S13-F8). Unit pins:
  the pct-branch prompt carries the string-array tail; the no-pct branch
  carries the object tail with "2-3 sentence description.".
- [x] **R2. `parseRoadmap` dual-shape** (S13-F5): strings map to
  `{title, description}` via the live's exact split semantics — strip
  `/^(Lesson|Step)\s*\d+[:\.\-\s]*/i`, then split on `" — "` (title before,
  description after), else split on `": "` when the index < 40, else the whole
  string with `""`; objects unchanged (title/description direct). Unit pins:
  `"Step 1: Core Foundations — build the base"` →
  `{title: "Core Foundations", description: "build the base"}`;
  `"Step 2: Reading: strategies"` → split at ": " (index < 40);
  `"Step 3: Plain title"` → `{title: "Plain title", description: ""}`;
  a long `": "`-late string (index ≥ 40) → the whole string as title;
  mixed arrays (objects + strings) parse in order; the existing object pins
  unchanged (backward compatible).

### Phase 2 — The course-switch fix (the centerpiece)

- [x] **R3. Derive `activeCourse` from the props — drop the frozen
  `viewCourseId` state** (S13-F2): `dashboard-app.tsx` replaces
  `useState(currentCourseId)` + `courses.find(viewCourseId)` with
  `courses.find(c => c.id === currentCourseId) ?? currentCourse` (memoized on
  `[forceOnboarding, currentCourseId, courses, currentCourse]`). Then a
  same-route pill switch re-renders with the new `currentCourseId` prop → the
  KEYED `CourseDashboard` remounts with the new course's content (the content
  fix) while the UNKEYED shell persists → the ref-guarded confetti effects
  observe the streak/label change exactly like the live's unkeyed c_ (the
  firing-surface fix — the live's most plausible real trigger). The refresh
  path (the session-12 rename-driven pin) is unchanged: `router.refresh()`
  re-renders with the SAME `currentCourseId` but fresh course data → the
  effects observe the updated quizScore. Cross-route navigations remount the
  shell → refs init (unchanged). Unit-testable seam: none needed (the e2e
  pins carry it — the component is a thin shell).
- [x] **R4. Correct the mechanism claims** (S13-F3): rewrite the false
  "remounts" sentences in AGENTS.md (the session-12 invariants block), the
  session12-parity.spec.ts comment, docs/session_12.md, worklog.md Task 22,
  and the SKILL/PAD wherever the story appears — to the TRUE mechanism: a
  same-route course switch re-renders the shell with fresh props (no remount);
  the keyed child remounts (the content swap); the unkeyed shell's refs
  persist (the trigger surface). Note the firing surface is now BOTH the
  course switch AND `router.refresh()`.

### Phase 3 — The route validation completion

- [x] **R5. The submit-route 422 symmetry** (S13-F4): a present-but-non-array
  `answers` → 422 `VALIDATION` (a MISSING answers still degrades to `[]` —
  the legacy-client path); `total` present-but-invalid (non-integer, < 1) →
  422 (missing still defaults to 5). Unit pins ride the route-level e2e (the
  422 family in session12-parity + new cases here).

### Phase 4 — E2E pins

- [x] **R6. NEW `tests/e2e/session13-parity.spec.ts`** (authenticated
  storageState, demo-user courses with afterEach cleanup per the session-11
  pattern): (a) **the course-switch content pin** — create courses A (score 2)
  + B (score 3), mount at `/?course=B`, pill-switch to A, assert the streak/XP
  stats update to A's values (the F2 fix's direct pin — this test FAILS on the
  pre-fix code); (b) **the switch-driven streak burst** — mount at A (score 2
  → streak 2), switch to B (score 3 → streak 3, the exact-3 crossing) → a
  confetti canvas appears (the live's c_ surface, finally delivered);
  (c) **the label burst** — mount at a score-1 course (20% → Apprentice)…
    switch to a score-4 course (80% → Expert) → the label changes → a canvas
    appears (the 90-particle burst's first behavioral pin); (d) **the 422
    family extension** — `answers: "garbage"` → 422; `total: "5"` (string) →
    422; `total: 0.5` → 422.
- [x] **R7. The session12 spec hardening** (S13-F7): the request-level
  generate/submit calls carry `timeout: 60_000`; the confetti positive
  assertion becomes `expect.poll(() => page.locator("canvas").count(),
  { timeout: 8_000 }).toBe(1)` (exits as soon as the canvas appears instead of
  a fixed 1500ms race); the negative assertion keeps its bounded one-shot
  shape.
- [x] **R8. Full gate** — lint → typecheck → test (153 + ~15 new ≈ 168) →
  build → e2e (86 + ~4 new = 90).

### Phase 5 — Polish, docs, delivery

- [x] **R9. The polish batch** (S13-F9/F10/F11/F12): the quiz-app.tsx comment
  → `dashboard-app.tsx`; the domain-session12 import → `@/lib/domain`; the
  confettiAt `(4, 8) → false` + masteryLabelTier 79→Scholar/99→Expert unit
  pins; the SKILL.md §6 contradiction resolved (§6 → the dashboard-shell
  guard).
- [x] **R10. Screenshots** (`docs/screenshots/`): the working course switch
  (before/after content), the switch-driven streak burst mid-flight, the
  label burst, a fresh dashboard shot.
- [x] **R11. Docs alignment**: AGENTS.md (the course-switch invariant + the
  corrected confetti mechanism + counts), CLAUDE.md (condensed), README.md
  (the session-13 section + counts), PAD v1.12 `[S13]` + the testing table,
  SKILL.md v1.12.0 (§7 the corrected firing surface, traps 37-39: the
  frozen-state trap, the wrapper-cast trap, the dual-shape roadmap contract),
  docs/session_13.md (the formatted session summary), this plan's TODO
  check-offs, repo `worklog.md`; `.env.example` re-verify (no new env vars).
- [x] **R12. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim; remote
  ref verified == HEAD; key shredded). The credential-bearing probe scripts
  never enter the tree (the established convention).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `ai.ts:114-116` — `Array.isArray(parsed) ? parsed : parsed?.steps` with no
   `Array.isArray` on the `.steps` branch = R0's target ✓ (the TypeError repro
   confirms); the sibling `:174-178` shows the in-file pattern to mirror ✓.
2. `ai.ts:102-110` — the two prompt branches with the object-schema tail on
   both = R1's target ✓; `AI_TIMEOUT_MS = 45_000` at `ai.ts:41` confirms the
   S13-F7 budget math ✓.
3. `domain.ts:63-82` — `parseRoadmap`'s object-only filter (strings dropped)
   = R2's target ✓; `lessonTitles` operates on the parsed `Road` — unchanged
   by the dual-shape (strings normalize BEFORE it) ✓; the roadmap card and
   the hub consume `parseRoadmap`'s output via the page/shell snapshots ✓
   (grep: no other raw `roadmapSteps` JSON.parse in `src/`).
4. `dashboard-app.tsx:67-73` — the `useState` + dead `setViewCourseId` (one
   grep occurrence) = R3's target ✓; the page (`src/app/page.tsx:43-47`)
   resolves `currentId` from the URL param against the enrollments (so
   `currentCourseId` is always a member of `courses` or the fallback
   `enrollments[0]` — the `?? currentCourse` tail never diverges) ✓; the
   `forceOnboarding`/anonymous paths pass `currentCourseId: null` → the
   onboarding render is unchanged ✓.
5. Blast radius of R3: the session-12 refresh-driven confetti pin drives
   `router.refresh()` with an UNCHANGED `currentCourseId` (the rename flow) —
   `activeCourse` = the fresh course object → the streak effect still observes
   the retaken quizScore → the pin keeps passing ✓; the session-6 Switch
   Course specs assert URL navigation (the content now ALSO updates — no
   assertion breaks) ✓; the hub back-links are cross-route full navigations
   (remount — unchanged) ✓; the e2e specs that mount via `page.goto` are
   unaffected (fresh mount) ✓.
6. `submit/route.ts:27` (the `Array.isArray` answers coercion) + `:52-54`
   (the untyped `total`) = R5's target ✓; the route's own 422 anchors
   (courseId/score/answers-entries) show the validation style to mirror ✓.
7. The R6 spec's drives reuse the session-11/12 proven helpers (freshCourse
   via `/api/courses/generate` + the submit API + the afterEach cleanup
   deleting the enrollments AND restoring the student's current_subject) ✓;
   the tier math: score 1 → round(20)% → Apprentice, score 4 → 80% → Expert
   (masteryLabelTier pins confirm) — a valid label-change drive ✓; the
   streak math: score 2 → streak 2, score 3 → streak 3 — the exact-3
   crossing ✓.
8. The pre-fix RED run: R6(a) FAILS on the current code (the frozen state
   renders B's stats at A's URL — the probe proved it), R6(b)/(c) likewise
   fail (zero canvases on the switch — the probe measured 0) — the TDD red
   state is empirically established before R3 lands ✓.
9. The R1 storage change: readers all parse via `parseRoadmap` (post-R2
   dual-shape) ✓; the seeded course's object roadmap and the generate-route
   object output parse identically (backward compatible) ✓; the submit-route
   response's `roadmap` field has no client consumer (quiz-app reads
   `redirectTo` only — verified in session-12's R5) ✓.
10. The unit spec additions live in a NEW `tests/ai-seam.test.ts` (the ai.ts
    seam currently has no direct unit spec — the fallback/validation logic
    rides the e2e; mocked `complete` via vi.mock keeps the seam pure) ✓ and
    the extended `tests/domain-session12.test.ts` / `tests/domain.test.ts`
    pins for the dual-shape parser ✓.

Execution order note: Phase 1 (red) → Phase 2 → unit green → Phase 3 → fast
gate → build → Phase 4 e2e (R6 red→green against R3) → full gate →
screenshots → docs → push.
