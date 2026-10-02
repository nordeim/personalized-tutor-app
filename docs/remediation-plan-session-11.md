# Remediation Plan — Session 11

Repo state at start: `996b8ae` (session-10 complete at `3e9a0aa` + the transcript
log commits; baseline gate green, re-verified fresh this session: lint ✓
typecheck ✓ 108 unit ✓ build ✓ 76 e2e ✓; the workspace PERSISTED from session 10
— `.env` + `db/custom.db` at the repo root + `node_modules` verified in place;
the stale shell `DATABASE_URL` trap re-armed — every dev/CLI command runs under
`env -u DATABASE_URL`).

Audit sources: a two-axis code review of the session-10 code commit
(`3e9a0aa`, parallel sub-agents per the repo's `skills/code-review`:
Standards + Spec axes — zero HARD violations, five judgement calls), a live
re-audit targeting the session-10 handoff's suggested surface — **the
diagnostic-quiz flow driven toward its never-observed terminal state** — plus
the prompt's headline mobile-navigation re-verification (real-tap, 390×844).
The live bundle is UNCHANGED (`assets/index-CkEI9gsZ.js` — the session-9/10
hash; every prior decode stands). The live's entity writes remain 403-blocked
for the probe account (the documented platform constraint — the onboarding
Continue fired `POST /entities/Student` → 403, dead-ending at `/`), and
`/quiz?course=demo-enrollment` renders the no-student state — so the E3
decode below is BUNDLE-mined (the component's full source extracted from
`index-CkEI9gsZ.js`), which is the established ground-truth method
(SKILL §12 F1: "read the compiled reference"). `/demo`'s retake is a no-op
(`onRetakeQuiz: () => {}`) so the quiz surface cannot be rendered on the live
either way. The scandihaven reference repo was re-consulted per the prompt
(tech-stack patterns already aligned; nothing new to adopt).

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or visual drift · **P2** polish/test-gap. The `skills/` folder
is excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S11-F1 | **The diagnostic-quiz surface is a session-1 invention — the live's E3 component (fully extracted from the bundle at `function E3(`) is structurally different in nearly every element.** The clone's `quiz-app.tsx` was scaffolded from screenshots, never decoded: (1) the live generates **exactly 5 questions** ("2 easy, 2 medium, 1 harder", max 20 words, fields `q`/`opts`/`ans`, a custom-MATERIAL context variant embedding `content_text.slice(0,3000)`) — the clone asks **7** ("Create a 7-question multiple-choice diagnostic quiz"); (2) the header is Ha-with-children — `{current_subject} · Knowledge Assessment` (`text-sm font-light text-black/60` + `font-medium text-black/80`) + an X close button (`w-8 h-8 rounded-full bg-black/10`, X sw 1.5) REPLACING the desktop user menu; mobile = logo + hamburger (the standard authed menu); the clone renders the full two-dropdown header; (3) the progress row is a `h-1` track `#4A4A4A` + `#FFFD73` fill at width `(g+1)/count*100` (NO reveal jump) with a **42×42 star SVG riding the fill edge** (`absolute left:{pct}% translate(-50%,-50%)`, `media.base44.com/.../38da97250_Star.svg` — now extracted to `public/quiz-star.svg`) + a counter `text-xs font-light` `#C0C0C0` = `{g+1}/{count}`; the clone ships `bg-black/10` + black fill + no star; (4) the question row is a lilac `#D2C0F9` `w-9 h-9 rounded-[10px]` number tile + `h3 text-lg font-normal ls-[-0.02em]` — NO "Diagnostic Quiz" label, NO h1 course name (clone has both); (5) options are TAN `#E1C8B9` `rounded-[14px] p-4` with `A.`/`B.`/`C.`/`D.` as an inline `font-medium` prefix inside the option text (NO letter circles), picked = `border 1px #0F0E0E` (bg unchanged), revealed correct `#BCFCAF` + CircleCheckBig, wrong-pick `#FFD0D0` + CircleX, others opacity .4; the clone ships white `rounded-[16px]` buttons, letter CIRCLES, purple picked, yellow correct; (6) there is NO feedback-text row on the live (the clone's "Nice — that's correct!"/"Not quite"/"Pick the best answer." column is an invention); (7) the action buttons are `mt-2 px-5 py-2.5 rounded-[14px] ml-auto` + ChevronRight `w-4 h-4` sw 1.5: "Confirm" (disabled `#E0E0E0`/`#999999`, enabled `#0F0E0E`/`#FFFFFF`) → revealed "Next Question" / final "Submit Assessment" (+ `animate-fade-in-up`); the clone ships rounded-[12px] "Confirm"/"Next question"/"Build my course"; (8) below the card: a dot strip `flex justify-center gap-2 mt-5` — `h-1.5 rounded-full` dots, 24px active / 6px others, `#FFFD73` active / `#C0C0C0` done / `#4A4A4A` future; the clone has none; (9) a fixed "Skip quiz →" pill `bottom-6 right-6` `px-4 py-2 rounded-full text-xs font-medium` bg `#2A2A2A` color `#C0C0C0` (wO passes `onSkip`); the clone has none; (10) the load/submit overlays are the W component — `min-h-screen flex flex-col` bg `#0F0E0E` + Ha + centered mascot + `text-sm font-light #C0C0C0` reading **"Preparing your assessment..."** (loading) / **"Analyzing your results..."** (submitting); the clone renders the mascot inside the paper card with `rgb(89,89,89)` text ("Loading your diagnostic quiz..."/"Preparing your course..."). The question card itself is `rounded-[20px] p-5 md:p-8 space-y-5 md:space-y-6` bg `#F8F8F8` inside `w-full max-w-lg animate-fade-in-up` centered on the dark gutter — the clone's `max-w-xl` wrapper + inline `flex-1 items-center justify-center rounded-[20px] p-6` paper container diverges (the live centers the CARD, not a full-height paper panel). | bundle `function E3(` (full extract, 14 KB); clone `quiz-app.tsx` (256 lines) | **P0** |
| S11-F2 | **The quiz score semantics are wrong — every submitted quiz scores "perfect".** The live computes the score CLIENT-side as the CORRECT count (`Z.filter((G,re) => G === c[re].ans).length`) and the entity write stores it. The clone's `/api/quiz/submit` receives only the picked indices and computes `score = answers.reduce((acc,a) => (a >= 0 ? acc+1 : acc), 0)` — the count of ANY answered question. Since every question requires a Confirm, a completed clone quiz always submits all-answered → score 7 → `round(7/5*100)` = 140 → clamped 100 → 100%/6 lessons regardless of correctness. (The seeded demo's 60% works only because the SEED writes quizScore 4/3 directly; the live-driven flows never assert the post-submit numbers.) | bundle E3 `ne()` (the correct-count filter); clone `api/quiz/submit/route.ts:29` | **P1** |
| S11-F3 | **The `/` route model: the live renders the course dashboard whenever an enrollment EXISTS — the clone additionally requires `quizCompleted || lessonProgress.length > 0`.** The live's `$P` resolver: course param match (or newest enrollment) → `r(F)` (enrollment) + `t({...student})` → render `G5` whenever student + enrollment exist (quiz-incomplete → E=0%, the G5 roadmap effect regenerates empty stages); the onboarding `K5` renders only with NO enrollment. The clone's `dashboard-app.tsx:72` gates the course dashboard on `quizCompleted || progress`. The divergence lands on the NEW skip/close paths (S11-F5/F6): the live's skip → `/?course=` → the 0% course dashboard; the clone would re-render the onboarding. | bundle `function $P(` (the x resolver + the `d&&e?E3:!e||!n?K5:G5` return); clone `dashboard-app.tsx:66-72` | **P1** |
| S11-F4 | **The AI-seam prompts for the quiz flow drift from the live's.** (a) `generateDiagnosticQuiz`: the live's prompt embeds the material context ("The learner has provided this material to study:\n\n{text}") vs the clone's topic-only prompt; the live asks for `q`/`opts`/`ans` with the 5-question/easy-medium-hard/≤20-word requirements. (b) `generateGapAnalysis`: the live's prompt is "A professional named {name} scored {score}/{total} ({pct}%) on a diagnostic quiz {on {subject}|based on their uploaded material: …}. … Write a brief 2-3 sentence gap analysis…" — the clone's says "scored ${score}/7" (hardcoded /7 = wrong total) with no name. (c) The submit-time roadmap: the live uses a pct-based prompt ("Based on someone scoring {pct}% on a diagnostic quiz about …, create exactly 3 progressive learning focus areas…") — the clone's `generateCourseStages` uses a different, pct-less prompt. (d) The fallback quiz ships 7 questions — must trim to 5. | bundle E3 `O()` + `ne()`; clone `ai.ts:125-160, 380-400` | **P1** |
| S11-F5 | **The Skip path is missing entirely.** The live's wO `onSkip` (h): resets/creates the enrollment `{quiz_completed: false, quiz_score: 0, roadmap_steps: "", gap_analysis: ""}`, sets the student's `quiz_completed` false, navigates `/?course={id}` (NOTE: the LLM roadmap it generates is DISCARDED — a live quirk; the clone skips the wasted call per the fix-and-pin doctrine). The quiz surface renders "Skip quiz →" (S11-F1.9) wired to it. The clone has no skip. | bundle `function wO(` h; clone quiz-app/submit route | **P2** |
| S11-F6 | **The close (X) path is missing.** The live's E3 `onClose` → wO: `navigate(m)` where `m = course ? /?course={c} : /` — the X in the header returns to the dashboard. The clone has no X. | bundle E3 (the X button in the Ha children) + wO's `m`; | **P2** |
| S11-F7 | **The DiagnosticQuiz write is insert-only on the clone; the live upserts by (user, subject).** The live's `ne()`: `filter({user_id, subject})` → update if exists else create. The clone's submit always creates → retakes accumulate rows. | bundle E3 `ne()`; clone submit route `.create` | **P2** |
| S11-F8 | **Two-axis review (Standards axis) judgement calls:** (a) `login/page.tsx:27-30` — the origin construction re-implements protocol detection inline (`x-forwarded-proto` with an OPPOSITE default vs `auth.ts`) and names the header bag `h` (Mysterious Name); the impure input feeds the tested `sameOriginRedirectTarget` seam — extract a pure `(host, proto) → origin` helper + pin it. (b) The `pathname`/`search` pair + near-verbatim comments repeat across the 3 writer sites — a `useCurrentUrl()` seam would collapse them (mild; defer unless touched anyway — the quiz rebuild does NOT touch them). | code review | **P2** |
| S11-F9 | **Two-axis review (Spec axis): the session-10 back-link e2e pin asserts a regex (`/^\/\?course=.+$/`), not the exact seeded course id** — any course id passes; the spec's own text says "both href `/?course=<seeded id>`". Harden to the exact id. | `session10-parity.spec.ts` (the back-link test) | **P2** |
| S11-F10 | CONFIRMED MATCHING / documented (no action): the no-student state (the clone's quiz page already renders `bg-background` + `text-muted-foreground font-body` — the live's exact classes); the quiz e2e URL-transition pins (`session5-parity.spec.ts:48` `/quiz?course=` landing, `auth.spec.ts:68` the pending flow) — zero pins on the quiz UI details, so the S11-F1 rebuild's blast radius is scoped to the unit seam + the new specs; **the mobile-nav headline re-verified THIS session** (the live's anonymous hamburger tap at 390×844 still REFUSED — `elementFromPoint` at the hamburger center IS the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4` toaster container; the clone's `pointer-events-none` fix + the real-tap e2e pins hold — the doctrine fix); the Retake Quiz button (the clone's `/quiz?course=` navigation = the documented App-Router-per-route divergence vs the live's in-place SPA swap); the gap_analysis is write-only on the live (never rendered in the bundle — the clone's storage-only model matches); the live's demo retake is a no-op (`onRetakeQuiz: () => {}`); the G5 dashboard's `E = round(quiz_score/5*100)` — the /5 divisor now provably aligns with the 5-question quiz (the clone's `quizProgressPercent` formula stays as-is); the live's G5 regenerates empty roadmaps per visit (the clone's static fallback = the accepted-divergence pattern per SKILL trap 20). | bundle + live probes | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `diagnosticScore(picked: number[], correct: number[])`** —
  `src/lib/domain.ts` (S11-F2): the correct-count score (the live's
  `filter((G,re) => G === c[re].ans).length`). TDD pins in
  `tests/domain-session11.test.ts`: (a) all-correct → length; (b) one wrong →
  length-1; (c) unanswered (-1) entries never count; (d) mismatched lengths
  count the overlap; (e) empty → 0.
- [x] **R1. `quizMarkerPct(current, total)`** — `(current + 1) / total * 100`
  (S11-F1.3 — the star/fill position; NO reveal bump). Pins: (a) (0,5) → 20;
  (b) (4,5) → 100; (c) (0,1) → 100; (d) total 0 → 0 (guard).
- [x] **R2. `quizDotState(i, current)`** — `{ w, bg }` per dot (S11-F1.8):
  active → 24px `#FFFD73`; done (i < current) → 6px `#C0C0C0`; future → 6px
  `#4A4A4A`. Pins: the 3 states at (i=2, current=2), (i=1, current=2),
  (i=3, current=2).
- [x] **R3. `headerOrigin(host, forwardedProto)`** — the pure
  `(host, proto) → "http(s)://host"` helper (S11-F8a) normalizing the
  `x-forwarded-proto` comma-list (first token) and defaulting to https for
  empty host-independent input; pins: (a) ("a.com", "https") → https://a.com;
  (b) ("a.com", "http") → http://a.com; (c) ("a.com", "https,http") →
  https://a.com; (d) ("a.com", null) → https://a.com; (e) ("", "https") → "".

### Phase 2 — The AI seam (prompt parity)

- [x] **R4. `generateDiagnosticQuiz(subject, material?)`** (S11-F4a): the
  live's exact contract — 5 questions, "2 easy, 2 medium, 1 harder", max 20
  words, the material-context preamble when `material` is non-empty
  (`The learner has provided this material to study:\n\n${material.slice(0,3000)}`
  vs `The topic is: ${subject}.`); validate 5×4-options; `fallbackQuiz` trims
  to 5 questions (the first five, correctIndex preserved). The route
  (`/api/quiz/generate`) passes the enrollment's `contentText` when
  `contentSource === "custom"`.
- [x] **R5. `generateGapAnalysis({name, subject, score, total, material?})`**
  (S11-F4b): the live's prompt shape — "A professional named {name} scored
  {score}/{total} ({pct}%) on a diagnostic quiz on {subject}… Write a brief
  2-3 sentence gap analysis highlighting what they need to work on and what
  they already understand well. Keep language professional and encouraging."
  The fallback keeps the {score}/{total} arithmetic (no /7 hardcode).
- [x] **R6. `generateCourseStages(courseName, pct?, material?)`** (S11-F4c):
  the submit-time call passes the pct + material context — "Based on someone
  scoring {pct}% on a diagnostic quiz about {…}, create exactly 3 progressive
  learning focus areas for the subject "…" (one per arena level)." Backward
  compatible (the courses/generate call site keeps the no-pct shape).

### Phase 3 — The quiz surface rebuild (the E3 port)

- [x] **R7. `AppHeader.headerChildren`** (S11-F1.2): an optional
  `React.ReactNode` prop — when present it renders in the `hidden md:flex`
  container INSTEAD of the CoursePill/UserMenu cluster (Ha's `c` contract:
  `children: [c, !c && …]`). The mobile hamburger/menu keeps its standard
  authed render (the live's quiz page shows it).
- [x] **R8. `quiz-app.tsx` rebuild** (S11-F1): the E3 structure —
  `min-h-screen flex flex-col` bg `#0F0E0E`; AppHeader with headerChildren =
  the subject · "Knowledge Assessment" span + the X close button (routes
  `/?course={id}` or `/`); the centered `w-full max-w-lg animate-fade-in-up`
  card (`rounded-[20px] p-5 md:p-8 space-y-5 md:space-y-6`, bg `#F8F8F8`);
  the star progress row (track `#4A4A4A` h-1, fill `#FFFD73`
  width=quizMarkerPct, the 42×42 `/quiz-star.svg` img at the fill edge,
  counter `#C0C0C0`); the lilac number tile + h3; the tan options with the
  `A.`-prefix + border-picked + reveal colors + the check/x icons (the
  existing lucide CircleCheckBig/CircleX at w-4 h-4 sw 1.5 — verify the live's
  `ci`/`ol` mapping); the Confirm/Next Question/Submit Assessment buttons;
  the dot strip; the "Skip quiz →" pill; the W overlays (dark bg + mascot +
  `#C0C0C0` text, the Ha-with-children header). The X + Skip wire to
  `/?course=` (client `router.push`). No feedback-text row.
- [x] **R9. The score fix** (S11-F2): the client computes
  `diagnosticScore(answers, questions.map(q => q.correctIndex))` and sends
  `{courseId, answers, total, score}`; the submit route VALIDATES
  (`0 ≤ score ≤ total`) and stores the payload score (never re-derives it).
- [x] **R10. `/api/quiz/skip`** (S11-F5): `POST {courseId}` → resets the
  enrollment `{quizCompleted: false, quizScore: 0, roadmapSteps: "",
  gapAnalysis: ""}` + the student's `quizCompleted: false` → returns
  `{redirectTo: /?course={courseId}}`. (The live's discarded LLM roadmap
  generation is NOT replicated — the wasted call is the live's own bug.)
- [x] **R11. The submit-route alignment** (S11-F4/F6/F2): the gap-analysis
  call gains `{name, total, material}`; the roadmap call gains the pct; the
  DiagnosticQuiz write becomes an UPSERT (find by user+subject → update |
  create); the enrollment update keeps `{quizScore: score}` (the payload
  score).

### Phase 4 — The `/` route model

- [x] **R12. `dashboard-app.tsx`** (S11-F3): `showCourseDashboard` drops the
  `quizCompleted || lessonProgress.length > 0` guard — the with-course
  dashboard renders whenever `activeCourse !== null` (any enrollment exists;
  the live's `$P` model). The 0% render path: the course-dashboard already
  handles the empty roadmap (`roadmap.length ? … : fallback`) and the 0%
  stats. Verify the seeded-demo + anonymous surfaces are unaffected.

### Phase 5 — E2E pins

- [x] **R13. `tests/e2e/session11-parity.spec.ts`** (authenticated
  storageState): (a) the quiz surface: 5 tan `rounded-[14px]` options with
  `A.` prefixes and NO letter circles; the star-progress row (`#4A4A4A` track
  + the star img); the lilac number tile; the "Knowledge Assessment" header
  span; the "Skip quiz →" pill; the dot strip (24px active); (b) the option
  reveal: pick + Confirm → the correct option computes `#BCFCAF`, the
  wrong-pick `#FFD0D0`; (c) the buttons: "Confirm" → reveal → "Next
  Question"; (d) the counter reads `1/5` (the 5-question pin); (e) the X
  close routes to `/?course=`; (f) the Skip flow: click → lands on
  `/?course=` rendering the COURSE dashboard (the 0% model — S11-F3's pin);
  (g) the submit flow with a WRONG answer: the final score derives from the
  correct count (e.g. 4/5 correct → 80%) — the S11-F2 pin.
- [x] **R14. Harden the session-10 back-link pin** (S11-F9): assert the exact
  seeded course id (not the regex).
- [x] **R15. Full gate** — lint → typecheck → test (108 + 17 new = 125) →
  build → e2e (76 + 6 new = 82).

### Phase 6 — Docs, screenshots, delivery

- [x] **R16. Docs alignment**: AGENTS.md (the E3 quiz-surface invariants, the
  5-question model, the score semantics, the `/` route model, the skip/close
  paths, counts); CLAUDE.md (condensed session-11 invariants); README.md
  (the session-11 section + counts + the features table's quiz row); PAD
  v1.10 `[S11]` + the testing table; SKILL.md v1.10.0 (the quiz-surface
  contract in §7, traps 32-33: the 7-question invention + the
  score-derivation bug); `docs/session_11.md` (the formatted summary — the
  current file is the session-10 transcript, per the handoff convention);
  repo `worklog.md`; `.env.example` re-verify (no new env vars).
- [x] **R17. Screenshots** (`docs/screenshots/`): the rebuilt quiz surface
  (the star progress + tan options), the reveal state, the skip path's 0%
  dashboard, the "Analyzing your results…" overlay.
- [x] **R18. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote git@github.com:nordeim/personalized-tutor-app.git`
  (paramiko shim; remote ref verified == HEAD; key shredded). Remove the
  credential-bearing probe scripts from the tree (the established
  convention).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `quiz-app.tsx:122-256` — the current render (the AppHeader + paper-card
   container, the white options with circles, the feedback row, the
   "Confirm"/"Next question"/"Build my course" labels) = the R8 rebuild
   target ✓; the state machine (loading/questions/current/answers/picked/
   revealed/finishing) maps 1:1 onto E3's (r/c/g/w/R/C) ✓ — the flow logic
   (pick→confirm→reveal→next) stays, only the surface + payloads change ✓.
2. `ai.ts:125-160` — `generateDiagnosticQuiz(subject)` + the 7-question
   prompt + `fallbackQuiz` (7 `mk(` calls, counted) = the R4 target ✓; the
   validation gate `parsed.length >= 5` already tolerates 5 ✓ (tighten to
   === 5 in the new shape); `ai.ts:380-400` `generateGapAnalysis(subject,
   score)` with the /7 hardcode = the R5 target ✓;
   `generateCourseStages(courseName)` = the R6 target (add optional params;
   the `/api/courses/generate` call site unchanged) ✓.
3. `api/quiz/submit/route.ts:29` — `answers.reduce((a >= 0)…)` (the R9/R11
   target) ✓; the `.create` DiagnosticQuiz write (the R11 upsert target) ✓;
   the `student.updateMany` keeps ✓.
4. `app-header.tsx:728-757` — the `hidden md:flex` container with the
   signedOut/pill/user-menu conditional = the R7 insertion point (an
   `headerChildren` branch first in the conditional) ✓; the mobile menu
   render path untouched ✓.
5. `dashboard-app.tsx:66-72` — the `quizCompleted || lessonProgress.length >
   0` guard = the R12 deletion target ✓; `course-dashboard.tsx:444` the
   empty-roadmap fallback exists ✓ (the 0% render is safe).
6. Blast radius: `session5-parity.spec.ts:48` pins the `/quiz?course=` URL
   only ✓; `auth.spec.ts:68` ends at the quiz URL ✓; the seeded demo (quiz
   completed) keeps its dashboard ✓; the anonymous root (no enrollment)
   keeps the public onboarding ✓; `mobile-navigation.spec.ts` runs on the
   seeded surfaces (the dashboard/hub) — the quiz page is not in its scope
   ✓; the `/` model change affects only quiz-incomplete enrollments (the
   generate-without-submit states) which no existing spec asserts ✓.
   `demoPercent`/`quizProgressPercent` (score/5) stay untouched — the /5 now
   provably matches the 5-question quiz (S11-F10) ✓.
7. New assets: `public/quiz-star.svg` (extracted from the live's media URL,
   3.4 KB) ✓; `MascotGenerating` = the km equivalent (`mascot-quiz-gen.svg`)
   ✓; the W overlay reuses it ✓. No schema changes, no new env vars — the
   skip route is the one new API handler (the 15th), pure helpers + prompts
   + the component rebuild + tests + docs ✓.

Execution order note: Phase 1 (red) → Phase 2 → unit green → Phase 3/4 →
fast gate → build → Phase 5 e2e → full gate → screenshots → docs → push.
