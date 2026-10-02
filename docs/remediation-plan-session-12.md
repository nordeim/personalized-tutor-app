# Remediation Plan — Session 12

Repo state at start: `73e1dac` (session-11 complete at `8fc9adb` + the transcript
log commits `0b1e12b`/`73e1dac`; the workspace PERSISTED from session 11 —
`.env` with `DATABASE_URL="file:../db/custom.db"` + `db/custom.db` at the repo
root + `node_modules` verified in place; the stale shell `DATABASE_URL` trap
re-armed (`file:/home/z/my-project/db/custom.db` overrides `.env`) — every
dev/CLI command ran under `env -u DATABASE_URL`).

Audit sources: a two-axis code review of the session-11 code commit
(`8fc9adb`, parallel sub-agents per the repo's `skills/code-review`: Standards
+ Spec axes — zero P0/P1 spec violations, one dead-feature HARD finding, five
judgement calls, seven P2/P3 nuances), a live re-audit (login, the dashboard
state, the mobile-nav real-tap re-verification at 390×844 hasTouch — the
prompt's headline), and a **fresh bundle decode pass** over the dashboard
component (`c_` — the Course-Lessons column) and the E3/wO/G5 regions of
`index-CkEI9gsZ.js` (the hash is UNCHANGED from sessions 9-11, so every prior
decode stands). The scandihaven reference repo re-consulted per the prompt
(unchanged at `cb0002a`; tech-stack patterns already aligned — nothing new to
adopt). The repo's Tailwind v4 skills (`skills/tailwind-patterns`,
`skills/nextjs16-tailwind4` §9 mobile-nav failure taxonomy) consulted for the
mobile-nav headline: the clone's toaster-cover fix matches the skill's
class-D "behind another layer" diagnosis; all 8 trap pins re-verified intact
in `globals.css` (zero `rounded-full` in `src/`, radius/blur/shadow pins, the
sonner pointer-events rules).

Baseline gate re-confirmed fresh this session: lint ✓ typecheck ✓ 125 unit ✓
build ✓ e2e 82 ✓ (the AI 429s are the expected rate limits; the fallback
doctrine handles them).

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or visual drift · **P2** polish/test-gap. The `skills/` folder
is excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S12-F1 | **The session-11 material-context gate is dead code — `contentSource === "custom"` is unreachable in this codebase.** `src/app/api/quiz/generate/route.ts:26` and `src/app/api/quiz/submit/route.ts:42` gate the learner's material on `enrollment.contentSource === "custom"`, but NO writer ever emits `"custom"`: `/api/courses/generate` writes `mode` ∈ {`topic`,`material`} (route.ts:23/41/61), `/api/courses` POST writes `material`\|`topic` (route.ts:52), the seed writes `"topic"`. The only enrollments that carry `contentText` (paste-text/material mode) are exactly the ones gated OUT — so the entire S11-F4 prompt feature (the quiz's material preamble, the "Custom Material" roadmap subject, the "based on their uploaded material" gap analysis) can never fire. The repo's own broad predicate `isCustomSource(s)` (`custom‖material`, domain.ts:243 — the p_ icon + m_ context line's gate) is the intended vocabulary. | two-axis review + writer scan | **P1** |
| S12-F2 | **The quiz-milestone confetti is misplaced AND mis-signaled — a session-2 misattribution the wholesale E3 port carried over.** A fresh bundle scan proves: (a) E3 (the diagnostic quiz component, full 11 KB segment re-extracted) contains ZERO confetti references — the live NEVER fires confetti during the diagnostic quiz; (b) the decoded 80-particle milestone (`particleCount:80, spread:55, origin:{x:.85,y:.4}, colors:["#FFFD73","#C8AEFF","#0F0E0E"]`) lives in the DASHBOARD's `c_` component (the Course-Lessons column) as `useEffect(() => { a.current!==null && a.current<h && (h===3\|\|h===7) && Aa({...80...}); a.current=h }, [h])` where `h = Math.min(quizScore, 7)` — the STREAK days, EXACT-equality crossing (not `>=`); (c) a SECOND dashboard trigger the clone does not ship: `useEffect(() => { l.current!==null && l.current!==c.label && Aa({particleCount:90, spread:60, origin:{x:.85,y:.3}, colors:[same]}); l.current=c.label }, [c.label])` — a 90-particle burst when the MASTERY LABEL changes, the tiers decoded as `[{Novice,min:0,🌱},{Apprentice,20,📘},{Learner,40,🔵},{Scholar,60,🎓},{Expert,80,⭐},{Master,100,🏆}]` via `l_(scorePercent)` (the label never RENDERS on the live — it exists solely to drive this confetti; the "progress to next tier" computation beside it is dead code). The clone fires `confettiQuizMilestone()` MID-QUIZ on the running correct count crossing `>=3` (quiz-app.tsx:89-96) and ships NO dashboard confetti. | bundle `function c_(`/`function E3(` decode | **P1** |
| S12-F3 | **The "Enter The Hub" CTA's trailing icon is ArrowRight on the clone; the live renders ChevronRight at lucide's default strokeWidth 2.** The live: `p.jsx(hv,{className:"w-5 h-5",strokeWidth:1.5})` (GraduationCap — the clone matches) + `p.jsx(tr,{className:"w-4 h-4"})` where `tr = ze("ChevronRight")` — NO strokeWidth prop → lucide default 2, path `m9 18 6-6-6-6` (stable across the live's 0.475 and the clone's 0.525 — the same icon the session-6 CO-card decode pinned at sw 2). The clone renders inline ArrowRight paths (`M5 12h14` + `m12 5 7 7-7 7`) at strokeWidth 1.5 (course-dashboard.tsx:522-525) — a session-1 invention never re-probed. | bundle G5 decode + course-dashboard.tsx | **P1** |
| S12-F4 | **The generate-time roadmap prompt silently drifted to the submit-time wording (S11-R6's blast radius), and the live's stages response schema needs wrapper parsing.** The bundle carries THREE distinct roadmap prompts: (a) GENERATE-time (G5's empty-roadmap effect, the onboarding/create path): `Create exactly 3 progressive learning stages for the course "{C}". Each stage needs a short title (2-3 words) and a description (2-3 sentences explaining what the student will learn in this stage). Return JSON: { "steps": [{ "title": "Stage title", "description": "2-3..." }] }`; (b) SUBMIT-time (E3, pct-aware): `Based on someone scoring {pct}% on a diagnostic quiz about {material?"their uploaded material":subject}, create exactly 3 progressive learning focus areas for the subject "{material?"Custom Material":subject}" (one per arena level). Return JSON: { "steps": [...] }`; (c) the wO skip-time variant (discarded by the live's own code). The clone's `generateCourseStages` (ai.ts:89-113) collapsed (a) into (b)'s wording — the no-pct onboarding call now sends the focus-areas prompt. Additionally: the live's LLM returns the `{ "steps": [...] }` OBJECT (response_json_schema) — the clone's `extractJson<StageDraft[]>` returns the object as-is → `parsed.length` is undefined → silently falls to the static fallback even when the LLM answered correctly. | bundle 3-prompt decode + ai.ts | **P1** |
| S12-F5 | **`quiz-app.skip()` discards the API envelope** — the response is never read (`redirectTo` returned by the skip route is dead data) while the client hardcodes `backTarget`; duplicated navigation knowledge, inconsistent with `submit()`'s typed envelope consumption and the repo's "Enveloped fetches" standard. | quiz-app.tsx:141-155 vs submit():124-130 | P2 |
| S12-F6 | **The session-11 "no desktop user menu" e2e assertion is vacuous** — `getByRole("button", { name: /Open menu\|Account menu/ })` matches nothing in either render: the desktop UserMenu trigger has NO aria-label (its accessible name is the user's name), the only "Open menu" button is the `md:hidden` mobile hamburger (display:none at the spec's 1440×900 viewport), and "Account menu" exists nowhere in the app. The pin proves nothing about the headerChildren replacement. | app-header.tsx:434-446 + session11-parity.spec.ts:74-75 | P2 |
| S12-F7 | **Stale 7-question references survived the 5-question rebuild**: `api/quiz/generate/route.ts:8` ("The reference generates 7 questions"), `personalized-tutor-app_SKILL.md` §1 ("diagnoses gaps with a 7-question quiz") + §5 inventory ("quiz-app.tsx — 7-question diagnostic + preparing overlay + the 3/7 confetti guard"), and quiz-app.tsx:89-90's "CROSSES 3 or 7" comment (the 7-crossing is unreachable on a 5-question surface). In a comment-as-invariant repo, now-false comments are live hazards. | grep | P2 |
| S12-F8 | **The submit route coerces a present-but-invalid `score` to 0 instead of rejecting** (fail-closed but inconsistent with the `courseId` 422 and the repo's validate-then-fail style), and `answers` entries are accepted without 0-3 membership validation (vestigial beyond the total fallback). | submit/route.ts:27-39 | P2 |
| S12-F9 | **Polish batch**: the duplicate `@/lib/domain` import (quiz-app.tsx:10-11, a rebuild leftover); the raw `<img>` for `public/quiz-star.svg` (the only raw img in `src/` — the convention is `next/image` + `unoptimized` wrappers per `mascot.tsx`); the login page's comment claims `headerOrigin` contains "the localhost http heuristic" (the heuristic lives at the call site, login/page.tsx:29-31); four near-duplicate `scripts/verify-s11-*.mjs` one-offs are superseded dead weight (one ships a leftover debug phrasing at verify-s11-quiz.mjs:160). | review | P3 |
| S12-F10 | CONFIRMED MATCHING / documented (no action): **the mobile-nav headline re-verified THIS session** (the prompt's headline): the live's anonymous/authed hamburger tap at 390×844 `hasTouch` still REFUSES — `elementFromPoint` at the hamburger center IS the `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4` toaster container (390×32, `pointer-events: auto`, TWO instances; the live's hamburger carries NO aria-label); the real `.tap()` times out on `button.md\:hidden`; the clone's `pointer-events-none` fix + the real-tap e2e pins hold (the doctrine fix — the Tailwind-v4 skills' class-D "behind another layer" taxonomy confirms the diagnosis). The live's account is in the onboarding state (the documented entity-write 403 block — `POST /entities/Student` dead-ends the Continue), so the dashboard CTAs were bundle-decoded instead: the Retake Quiz button (RotateCcw w-4 h-4 sw 1.5, `px-8 py-5 rounded-[20px]` bg #F8F8F8) + the Enter The Hub link (GraduationCap w-5 h-5 sw 1.5 + tan #E1C8B9 `flex-1 py-5 rounded-[20px] font-semibold text-base gap-3`) — the clone already matches both (bar S12-F3's trailing icon). The third overlay text "Preparing your course..." IS in the live's wO (the skip state — correct parity, not drift). The Course-Lessons card (row styles #F5F5F5/#FFFFFF+#0F0E0E-border/#FAFAFA, `rounded-xl px-3 py-2.5 space-y-2`, the ci/Og/Og-40 icon column, the "Lesson N" micro-label + `text-xs font-medium` title + the h-1 progress bar with `duration-700`, the `{g}/{n} lessons · {pct}% complete` footer, the row click-through to the hub) matches the c_ decode. The Study-Streak strip (M–S tiles, `min(quizScore,7)`, the flame SVG path, dates anchored today-(h-1)) matches. The roadmap card (✓ Done `text-[10px] font-medium` #595959 / → In progress `text-[12px] font-semibold` #0F0E0E / the h-1.5 Start-Complete bar `duration-700`) matches. The `label` mastery tiers never render visibly (confetti-only). The c_ 6-title default fallback ("Core Concepts"… "Tackle complex challenges") fires only when the roadmap array is empty AND the live regenerates titles per visit via LLM — the documented accepted divergence (SKILL trap 20); the clone's Kh expansion covers the surface. The live's `lessonIndex=` hub param vs the clone's `lesson=` is the documented App-Router contract difference (e2e-pinned). The quiz progress `/5` divisor, the demo 60% pin, the $P route model, and the E3 surface all re-verified intact. | live probes + bundle + code | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `masteryLabelTier(scorePercent)`** — `src/lib/domain.ts`
  (S12-F2c): the Qi ladder → `{ label, min }` for the confetti trigger (the
  label + tier object; the emoji is decoration the live never renders — omit
  or keep as data). Pins in `tests/domain-session12.test.ts`: (a) 0 →
  Novice; (b) 19 → Novice; (c) 20 → Apprentice; (d) 39 → Apprentice; (e) 40
  → Learner; (f) 59 → Learner; (g) 60 → Scholar; (h) 80 → Expert; (i) 100 →
  Master; (j) 150 → Master (clamped by the top tier); (k) -5 → Novice (the
  bottom fallback).
- [x] **R1. `confettiAt` → the decoded exact-equality semantics** (S12-F2b):
  `next === 3 || next === 7` on an upward crossing (the live's
  `a.current < h && (h===3||h===7)`), NOT `>=`. The existing six pins still
  pass under the new semantics; ADD the discriminating pins: (2,4) → false;
  (1,5) → false; (5,7) → true; (2,7) → true (crosses into 7 directly).
- [x] **R2. `enrollmentMaterial(contentSource, contentText)`** (S12-F1): the
  shared gate — `isCustomSource(source) && contentText?.trim() ? contentText
  : null`. Pins: ("material", "text") → "text"; ("custom", "x") → "x";
  ("topic", "x") → null; (null, "x") → null; ("material", null) → null;
  ("material", "  ") → null (blank never feeds the prompt).

### Phase 2 — The AI seam (prompt parity)

- [x] **R3. `generateCourseStages` prompt split + wrapper parsing**
  (S12-F4): the no-pct branch returns to the live's GENERATE-time prompt
  verbatim — `Create exactly 3 progressive learning stages for the course
  "{courseName}". Each stage needs a short title (2-3 words) and a
  description (2-3 sentences explaining what the student will learn in this
  stage). Return JSON: { "steps": [{ "title": "Stage title", "description":
  "2-3 sentences" }] }` (no material context on this branch — the live's
  G5 effect passes only the course name); the pct branch keeps the decoded
  submit-time focus-areas prompt (material-aware) unchanged. Parse BOTH
  response shapes: a bare `[{title,description}]` array AND the `{steps:
  [...]}` object wrapper (the live's response_json_schema) — extract
  `parsed.steps` when the object form arrives, then apply the existing ≥3
  validation.
- [x] **R4. The material gate call-sites** (S12-F1): `api/quiz/generate` +
  `api/quiz/submit` replace the dead `=== "custom"` ternaries with
  `enrollmentMaterial(enrollment.contentSource, enrollment.contentText)`
  (one helper, both routes — the S11-F4 feature finally fires for
  material-mode courses).

### Phase 3 — The component fixes

- [x] **R5. `quiz-app.tsx`** (S12-F2a + F5 + F7 + F9): remove the mid-quiz
  confetti block (the `confettiAt`/`confettiQuizMilestone` imports + the
  confirm() guard + the stale "CROSSES 3 or 7" comment — E3 has NO
  confetti); merge the duplicate `@/lib/domain` import; `skip()` consumes
  the envelope (`json.data.redirectTo` with the `backTarget` fallback —
  consistent with submit()).
- [x] **R6. The dashboard confetti port** (S12-F2b/c): `course-dashboard.tsx`
  gains the two decoded ref-guarded effects — (a) streak: `useRef<number |
  null>` + effect on `[streakDays]` firing `confettiQuizMilestone()` when
  `confettiAt(prev, streakDays)`; (b) label: `useRef<string | null>` +
  effect on `[label]` firing the NEW `confettiLabelChange()` when the label
  changes from non-null. `confetti.ts` gains `confettiLabelChange()` (90
  particles, spread 60, origin {x:.85,y:.3}, the same color triple). The
  label derives from `masteryLabelTier(progressPct)`.
- [x] **R7. The Enter The Hub trailing icon** (S12-F3): replace the inline
  ArrowRight paths with ChevronRight (`m9 18 6-6-6-6`) at `h-4 w-4` and
  lucide-default strokeWidth 2 (no explicit prop — matching the live's
  `tr` render; the path is stable across lucide 0.475/0.525).
- [x] **R8. The submit-route validation** (S12-F8): a present-but-invalid
  `score` (non-integer, < 0, > total) → `422 VALIDATION` (a MISSING score
  still defaults to 0 — the degraded-client path); `answers` entries
  validated as integers in -1..3 → `422` on garbage (they feed the total
  fallback and the audit shape).
- [x] **R9. The polish batch** (S12-F9): the quiz-star `<img>` → a
  `next/image`-`unoptimized` module-level wrapper (42×42, `alt=""` — the
  mascot.tsx convention; the e2e `img[src='/quiz-star.svg']` locator
  survives); the login-page comment corrected (the localhost heuristic
  lives at the call site); the generate-route comment updated (5 questions,
  not 7).

### Phase 4 — E2E pins

- [x] **R10. `session11-parity.spec.ts`** (S12-F6): replace the vacuous
  header-menu assertion with real ones — `getByRole("button", { name:
  "Course menu" })` count 0 (the CoursePill's actual aria-label) +
  `getByRole("button", { name: /Demo Learner/ })` count 0 (the UserMenu
  pill's accessible name — the seeded demo's display name).
- [x] **R11. NEW `tests/e2e/session12-parity.spec.ts`** (authenticated
  storageState, demo-user courses with afterEach cleanup per the session-11
  pattern): (a) the dashboard confetti trigger — create course A, POST
  `/api/quiz/submit` with score 2; create course B, submit score 3; load
  `/?course=A` (the streak ref initializes at 2), switch to course B via
  the CoursePill row (the same-route navigation keeps CourseDashboard
  mounted → the streakDays prop change 2→3 fires the 80-particle burst) →
  assert a confetti canvas appears; (b) the Enter The Hub trailing icon —
  the CTA's last svg carries the `m9 18 6-6-6-6` path (the ChevronRight
  pin) at 16px; (c) the material-course quiz path — generate a
  material-mode course via `/api/courses/generate` (`mode:"material"`),
  load `/quiz?course=` → the quiz renders (the gate now passes material to
  the prompt; the surface itself is unchanged); (d) the submit-route 422 —
  POST `/api/quiz/submit` with `score: 99` → 422 (and `answers:[7]` →
  422).
- [x] **R12. Full gate** — lint → typecheck → test (125 + ~15 new ≈ 140) →
  build → e2e (82 + 4 new = 86).

### Phase 5 — Docs, screenshots, delivery

- [x] **R13. Docs alignment**: AGENTS.md (the session-12 invariants: the
  material gate + `enrollmentMaterial`, the dashboard-confetti decode + the
  mastery-label tiers, the exact-equality `confettiAt`, the E3-no-confetti
  rule, the ChevronRight trailing icon, the three roadmap prompts, the
  wrapper parsing, counts); CLAUDE.md (condensed session-12 invariants);
  README.md (the session-12 section + counts + the confetti-feature row
  correction); PAD v1.11 `[S12]` + the testing table; SKILL.md v1.11.0 (§1
  + §5 de-staled to the 5-question surface, §7 the confetti contract
  rewrite, traps 34-36: the misplaced-confetti misattribution, the
  dead-gate `=== "custom"` trap, the prompt-branch collapse); this plan;
  `docs/session_12.md` (the formatted session summary — the current file
  is the session-11 transcript, per the handoff convention); repo
  `worklog.md`; `.env.example` re-verify (no new env vars).
- [x] **R14. Screenshots** (`docs/screenshots/`): the dashboard with the
  ChevronRight CTA, the streak-confetti burst captured mid-flight (the
  course-switch probe drive), the quiz surface re-shot post-cleanup, the
  clone's working mobile menu (the headline's proof).
- [x] **R15. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim; remote
  ref verified == HEAD; key shredded). The credential-bearing s12 probe
  scripts never enter the tree (the established convention); the historical
  verify-s11 one-offs stay (committed history — the cleanup deferred).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `domain.ts:243` `isCustomSource` exists and is the intended broad
   predicate ✓; `confettiAt` (domain.ts:344-348) is the `>=` form with six
   pins that all still pass under exact-equality ✓ (only the call site
   moves); no `masteryLabelTier` exists ✓ (R0's target).
2. `ai.ts:89-113` — the collapsed prompt + `extractJson<StageDraft[]>`
   (ai.ts:67-81 returns the first JSON value; the `{steps:…}` object case
   falls through `parsed.length >= 3` → fallback) = R3's target ✓; the
   pct branch's wording matches the E3 decode verbatim ✓ (keep it).
3. `api/quiz/generate/route.ts:25-26` + `api/quiz/submit/route.ts:41-42` —
   the dead `=== "custom"` ternaries = R4's target ✓; both routes already
   import from `@/lib/domain`-adjacent seams (submit imports displayName)
   ✓ — the new import is trivial.
4. `quiz-app.tsx:11-12` (the confetti imports), `:89-96` (the guard), `:141-155`
   (skip) = R5's targets ✓; `:10-11` the duplicate import ✓.
5. `course-dashboard.tsx:195` (`streakDays`), `:162` (`progressPct`) — the
   two effect inputs exist ✓; the component is a client component with
   existing `useRef`-free state — the refs are additive ✓; `confetti.ts`
   (src/lib/confetti.ts:20-50) holds the three presets — the 90-particle
   addition is R6's target ✓.
6. `course-dashboard.tsx:522-525` — the inline ArrowRight svg = R7's swap
   target ✓ (the leading GraduationCap + the link classes already match
   the G5 decode).
7. `submit/route.ts:35-39` — the silent-0 coercion = R8's target ✓; the
   route already 422s on a missing courseId ✓ (the style anchor).
8. `session11-parity.spec.ts:73-75` — the vacuous locator = R10's target ✓;
   the seeded demo's display name is "Demo Learner" (prisma/seed.ts:48) ✓
   and the CoursePill's aria-label is "Course menu" (app-header.tsx:136) ✓.
9. Blast radius: removing the quiz confetti breaks NO e2e pin (zero
   confetti assertions in tests/e2e — verified) ✓; `confettiAt`'s unit pins
   pass under both semantics ✓; the R12 e2e's course-switch drive reuses
   the session-11 spec's proven helpers (freshCourse + submit API + the
   afterEach cleanup with the currentSubject restore) ✓; the mastery-label
   effect adds no visible DOM (label used in the effect only — like the
   live) ✓; the R6 effects run client-side in course-dashboard which is
   already "use client" ✓.
10. The quiz-star `next/image` swap (R9): the existing e2e locator is
    `img[src='/quiz-star.svg']` (session11-parity.spec.ts:80-82) —
    `next/image` with `unoptimized` renders the same `<img src>` ✓ (the
    mascot wrappers prove the pattern); 42×42 via width/height props ✓.

Execution order note: Phase 1 (red) → Phase 2 → unit green → Phase 3 → fast
gate → build → Phase 4 e2e → full gate → screenshots → docs → push.
