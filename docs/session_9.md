# Session 9 — The Level-Surface Parity Pass

Continuing from session 8 (`e270282` + the transcript commit `9eb54e9`):
the full gate stood at 82 unit + 64 e2e. This session re-ran the full
audit → plan → TDD → gate → push cycle — and, for the first time in the
project's history, drove the live's quiz flow through a COMPLETE lesson
(the terminal state every prior session decoded from the bundle but never
observed at runtime).

## What was audited

- **Workspace refresh:** the workspace had been RESET — fresh
  `git clone`, `bun install`, `cp .env.example .env`, `db:push` +
  `db:seed` (the `db/` folder at the repo root, `DATABASE_URL=
  "file:../db/custom.db"` per the prompt's requirement — already the
  `.env.example` default). The stale shell `DATABASE_URL` trap re-armed
  itself (the workspace-level export); every DB command ran under
  `env -u DATABASE_URL`. Baseline gate re-confirmed green: lint ✓
  typecheck ✓ 82 unit ✓ build ✓ 64 e2e ✓.
- **Two-axis code review** of the session-8 diff (`5ca9c4e...e270282`,
  parallel sub-agents per `skills/code-review`): 1 HARD finding (`/demo`
  missing the documented `force-dynamic` export) + 8 judgement calls
  (icon-constant duplication, threshold duplication, dead fields/classes,
  the from_url inconsistency); the Spec axis found ONE real deviation
  candidate (the Sign In pill's width placement) — **live-verified this
  session as a stale-plan issue, not a code issue** (the pill IS
  desktop-only: at 390×844 its parent's computed display is `none`).
- **The live re-audit — the quiz flow driven to completion:** logged in,
  drove the live `/hub?course=demo-enrollment` through a full lesson 1
  (9 answered, 8 correct — reading each question and reasoning the
  answers), and observed the TERMINAL state for the first time: the
  Level-Up interstitial ("Preparing Lesson 1…" — `Preparing Lesson
  {level}`), the Lesson Progress card reading **"9/8"** (UNCLAMPED —
  `{answered + 1}` over 8), and the live's hub DEAD-ENDING after the
  completion (the sidebar stuck at "Lesson 1 · Now"; the pane at "8/8
  correct"). Fresh bundle archaeology (`/assets/index-CkEI9gsZ.js`)
  decoded the whole machinery: the qP's label formula `[c+1,"/",d]`, the
  Y2's 8-correct → `onCorrect` → `ie` (score += 10, `C < 3` → the
  interstitial + a StudySession update that NOTHING consumes), the qP's
  `activeLevel`/`levelingUp` dead props, and the sidebar's
  `activeLessonIndex` setter being called ONLY in the mount reset — the
  live's hub can never advance lessons. The clone's advancing 6-lesson
  flow is the documented doctrine fix.
- **The level-2/3 surfaces (the session-8 handoff's suggested target):**
  the live's `yO`/`xO` re-decoded — the h2 = the GENERATED title
  (`meta.title`) on levels 2/3, the tan Real-World Scenario / lilac
  Final Boss cards render CONDITIONALLY on the generated
  scenario/challenge, the context icons are lucide Lightbulb/MapPin/Trophy
  (t8/a8/yv) — all matching the clone's session-3 port, which had ZERO
  e2e coverage. The anonymous mobile menu, the authed menu, the mobile
  hub tab bar, and the toaster-cover bug were all re-verified (the live
  still ships the bug; the clone's fix + pins hold).
- **The icon-identity check** found a NEW trap class: lucide redesigns
  ACROSS VERSIONS — BookOpen and Trophy changed path data between the
  live's 0.475 and the clone's 0.525, so the hand-copied SVG constants are
  the CORRECT pin (lucide imports would drift the strokes).

## What was executed (TDD)

1. **Phase 1 (RED → GREEN):** `lessonProgressLabel` + `lessonProgressPct`
   in `domain.ts` — the live's UNCLAMPED qP formula (8 correct → "9/8"),
   pinned by `tests/domain-session9.test.ts` — 82 → **91 unit**.
2. **Phase 2 (P1s):** the Hub's Lesson Progress card now uses the helpers
   (no more `Math.min` clamp); the desktop anonymous Sign In pill carries
   `from_url` (the live's `navigateToLogin` decode); `/demo` gained
   `export const dynamic = "force-dynamic"`.
3. **Phase 3 (cleanups, all AUDIT-verified):** the icon constants
   deduplicated into ONE parameterized component per shape (the paths
   verbatim — the lucide-version trap documented in the why-not-lucide
   comment; the DEAD LESSON_ICON deleted); the onboarding validity
   thresholds unified (`inputsValid` + `pendingInputsValid` — one
   predicate, both call sites); the challenge overlay's dead `bg-black/50`
   class removed (the inline rgba is the single source of truth); the
   dashboard-app's dead Guest null-object replaced with honest nullable
   typing (AppHeader's `user: HeaderUser | null`).
4. **Phase 4 (e2e):** `session9-parity.spec.ts` (the level-2 tan card +
   generated-title h2 at `?lesson=2`, the level-3 lilac card at
   `?lesson=4`, the fresh "1/8" label) + `session9-public.spec.ts` (the
   desktop Sign In from_url pin; the mobile anonymous guest menu REAL-TAP
   pin closing the S9-F5 gap — logged-out file-level storageState per the
   scoping rule). 64 → **69 e2e**.
5. **Full gate green:** lint ✓ typecheck ✓ 91 unit ✓ build ✓ 69 e2e ✓;
   runtime probes: the dev-server drive confirmed the label progression
   1/8 → 2/8 → … → **9/8 at the interstitial**; screenshots 71-74
   captured (the level-2/3 cards — first runtime captures ever — the
   from_url login chain, the "9/8" terminal state).

## Docs aligned

`docs/remediation-plan-session-9.md` (8 findings + 12 TODOs executed, R4
revised mid-flight with the lucide-version discovery),
`docs/remediation-plan-session-8.md` (the R1 text corrected — the pill is
desktop-only, live-verified), AGENTS.md (the unclamped-label invariant,
the level-machinery decode, the icon-version trap, the from_url contract,
counts 91/69), CLAUDE.md (condensed), README.md (the session-9 section +
counts), PAD v1.8 `[S9]` + the testing table,
`personalized-tutor-app_SKILL.md` v1.8.0 (traps 27-29), this file, and
the repo `worklog.md`. `.env.example` re-verified (no new env vars).

## Delivery

Conventional commit on `main`; push via `docs/ssh_git_wrapper_v3.py`
--remote `git@github.com:nordeim/personalized-tutor-app.git` (paramiko
shim; remote ref verified == HEAD; key shredded).

## Headline outcomes

1. **The "9/8" label decoded and pinned (the session's P1):** the live's
   Lesson Progress card is UNCLAMPED — `{answered + 1}/8` renders "9/8"
   at the completing 8th correct (observed at runtime, decoded from the
   qP, pinned in unit + runtime). The clone's clamp was drift; the fix is
   a one-line formula now guarded by tests.
2. **The live's hub is a dead end — the decode corrected:** the sidebar's
   activeLessonIndex is never written after mount; the level-up only
   persists a StudySession level that nothing consumes. The clone's
   advancing flow is confirmed as the pinned fix, and the docs now carry
   the corrected decode (the level-up fires per LEVEL completion, not
   per the prior "lessons 1|3" reading).
3. **A NEW trap class found: lucide redesigns across versions.** BookOpen
   and Trophy changed path data between 0.475 and 0.525 — the
   hand-copied icon constants are the correct pin, now documented so no
   future review "cleans them up" into a regression.
4. **The level-2/3 surfaces gained their first e2e pins** (the tan
   Real-World Scenario card, the lilac Final Boss card, the
   generated-title h2) via the `?lesson=2|4` params — the surfaces the
   session-8 handoff flagged as never-live-diffed.
5. **The gate grew again: 91 unit + 69 e2e, all green** — plus the
   anonymous mobile guest menu's real-tap pin and the desktop pill's
   from_url contract.
