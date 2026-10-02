# Session 11 — The Quiz-Surface Parity Pass

Continuing from session 10 (`3e9a0aa` + the log commits; the full gate stood
at 108 unit + 76 e2e). This session re-ran the full audit → plan → TDD →
gate → push cycle with the **diagnostic-quiz flow's terminal state** as the
deep-audit target (the session-10 handoff's own suggestion) — plus the
prompt's headline mobile-navigation re-verification.

## What was audited

- **Workspace refresh:** `git pull` → `996b8ae` (docs/session_11.md = the
  session-10 transcript, per the handoff convention). The workspace
  PERSISTED from session 10 — `.env` + `db/custom.db` at the repo root
  (DATABASE_URL=`file:../db/custom.db`) + `node_modules` verified. Baseline
  gate re-confirmed green: lint ✓ typecheck ✓ 108 unit ✓ build ✓ 76 e2e ✓
  (the AI 429s are the expected rate limits; the fallback doctrine handles
  them). The stale shell `DATABASE_URL` trap re-armed itself — every
  command ran under `env -u DATABASE_URL`.
- **The live bundle is UNCHANGED** (`assets/index-CkEI9gsZ.js` — the same
  hash sessions 9/10 decoded), so every prior decode stands.
- **Two-axis code review** of the session-10 code commit (`3e9a0aa`,
  parallel sub-agents per `skills/code-review`): zero HARD violations; the
  judgement calls — the login page's inline origin construction (impure,
  protocol-detection duplicating auth.ts with an opposite default, a
  Mysterious Name), the back-link e2e pin's regex (not the exact seeded
  id), and the pathname/search data clump — all folded into the plan.
- **The live re-audit — the quiz flow's drive blocked, the bundle decode
  complete:** the onboarding Continue on the live fires
  `POST /entities/Student` → **403** (the documented platform entity-write
  block — the probe account cannot create the Student profile, dead-ending
  at `/`), and `/quiz?course=demo-enrollment` renders the no-student
  state; `/demo`'s Retake Quiz is a no-op (`onRetakeQuiz: () => {}`).
  So the diagnostic-quiz component (**E3** in `index-CkEI9gsZ.js`) was
  decoded WHOLESALE from the bundle — the "read the compiled reference"
  doctrine. The wO route wrapper, the Ha-with-children header contract,
  the `$P` dashboard resolver, and the G5 dashboard's `/5` math were
  decoded in the same pass. **Every prior surface assumption about the
  quiz was wrong: the session-1 quiz-app was an invention.**
- **The mobile-nav headline re-verified** (the prompt's headline): the
  anonymous hamburger tap at 390×844 still REFUSES on the live
  (`elementFromPoint` at the tap point IS the `fixed top-0 z-[100]`
  toaster container); the clone's `pointer-events-none` fix + the
  real-tap e2e pins hold. The live's `/` route model was also re-decoded
  in the same pass (the $P resolver renders the course dashboard whenever
  an enrollment exists — the clone's quizCompleted-or-progress guard was
  drift).

## What was executed (TDD)

1. **Phase 1 (RED → GREEN, 108 → 125 unit):** four pure helpers in
   `domain.ts` pinned by `tests/domain-session11.test.ts` (17 checks) —
   `diagnosticScore(picked, correct)` (the live's client-side correct
   count), `quizMarkerPct(current, total)` (the star/fill position), 
   `quizDotState(i, current)` (the dot strip), and `headerOrigin(host,
   proto)` (the login page's origin construction — the review finding).
2. **Phase 2 (the AI seam):** `generateDiagnosticQuiz(subject, material?)`
   — the live's exact 5-question prompt (2 easy, 2 medium, 1 harder, ≤ 20
   words, the material-context preamble; the fallback trimmed to 5);
   `generateGapAnalysis({name, subject, score, total, material})` — the
   live's "A professional named {name} scored {score}/{total} ({pct}%)…"
   shape; `generateCourseStages(courseName, {pct, material})` — the
   pct-aware submit-time roadmap prompt.
3. **Phase 3 (the E3 port):** `quiz-app.tsx` rebuilt to the decode — the
   `headerChildren` prop added to AppHeader (the Ha children contract),
   the star progress row with the extracted `public/quiz-star.svg`
   (42×42, from the live's media URL), the lilac number tile, the tan
   options with inline `A.`-prefixes, the Confirm/Next Question/Submit
   Assessment buttons, the dot strip, the "Skip quiz →" pill, and the
   dark W overlays. The client computes the score
   (`diagnosticScore`); the submit route stores the VALIDATED payload
   score, upserts the DiagnosticQuiz by (user, subject), and passes the
   name/total/material to the prompts. The new `POST /api/quiz/skip`
   implements the live's wO onSkip (the enrollment reset + `/?course=`
   navigation — minus the LLM call the live's own code discards).
4. **Phase 4 (the / route):** `dashboard-app.tsx`'s showCourseDashboard
   drops the quizCompleted-or-progress guard — the live's $P model (any
   enrollment → the course dashboard; quiz-incomplete → the 0% state,
   where the skip/close paths land).
5. **Phase 5 (e2e, 76 → 82):** `session11-parity.spec.ts` (6 checks: the
   E3 surface structure incl. the 1/5 counter + the star + the tan
   options + no letter circles + the header children, the reveal colors,
   the skip → 0% dashboard, the X close, the payload-score semantics
   0%/60%, the Submit Assessment flow) + the session-10 back-link pin
   hardened to the EXACT seeded id. The spec generates demo-user courses
   with afterEach cleanup (deleting the enrollments AND restoring the
   student's current_subject — the rate-limit budget and the seeded
   state both stay baseline).
6. **Full gate green:** lint ✓ typecheck ✓ 125 unit ✓ build ✓ 82 e2e ✓;
   runtime probes confirmed every surface value computed-identical to
   the decode (the header span, the tile, the track/star/dots/counter,
   the option bg/radius/pad, the reveal colors + icons, the skip and
   close paths, the all-wrong 0% score); screenshots 79-82 captured.

## Docs aligned

`docs/remediation-plan-session-11.md` (10 findings + 18 TODOs executed),
AGENTS.md (the E3 quiz-surface invariants, the 5-question model, the score
semantics, the /-route model, the skip/close paths, the upsert, counts
125/82), CLAUDE.md (the session-11 invariants), README.md (the
session-11 section + the features-table quiz row + counts), PAD v1.10
`[S11]` + the testing table + the 16-handler API table, SKILL.md v1.10.0
(the §7 diagnostic-quiz contract + traps 32-33), this file, and the repo
`worklog.md`. `.env.example` re-verified (no new env vars).

## Delivery

Conventional commit on `main`; push via `docs/ssh_git_wrapper_v3.py`
--remote `git@github.com:nordeim/personalized-tutor-app.git` (paramiko
shim; remote ref verified == HEAD; key shredded). The credential-bearing
live-probe scripts never entered the tree (the established convention).

## Headline outcomes

1. **The diagnostic quiz was the last major session-1 invention** — the
   live asks 5 questions on a structurally different surface (the star
   progress row, the tan options, the minimal header, the skip pill);
   the clone now ships the decoded E3, pinned by computed-style e2e.
2. **The score semantics were a real bug**: the clone scored every
   ANSWERED question correct — every completed quiz scored 100%; the
   live computes the correct count client-side. Fixed + unit- and
   e2e-pinned (0% and 60% cases).
3. **The / route model aligned to the live's $P** — the course dashboard
   renders whenever an enrollment exists; the new skip path lands on the
   0% dashboard exactly like the live.
4. **The mobile-nav headline re-verified again** — the live's menu
   remains untappable (the toaster cover); the clone's fix + pins hold.
5. **The gate grew again: 125 unit + 82 e2e, all green.**
