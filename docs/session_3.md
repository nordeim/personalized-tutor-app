# Session 3 — The Architecture Pass

Continuing from session 2 (`afbcb4f`): the clone had closed the data-level
parity gaps (quote pool, quiz flow, gamification) but still shipped its own
 interpretations of several structural surfaces. This session's audit went
deeper — instead of diffing rendered DOM only, the live bundle's actual
component functions were decoded (`qP` sidebar, `Y2` lesson view, the
`gO/yO/xO` per-level layouts, the `Im` content card, `H2` Nori chat, `Kh`
lesson-title derivation, `CO`/`kO` course cards, the `bO` icon mapper, the
`ie` level-up handler) and the live hub quiz was driven interactively to
observe the real timings (and the reference's own fragility — it crashed
mid-quiz during the audit).

## The audit

- git pull → `7f16110`; re-read AGENTS.md / CLAUDE.md / README.md / PAD /
  SKILL.md / session_2.md / remediation-plan-session-2.md / worklog.md and
  validated every claim against the code.
- Baseline gate re-confirmed green (lint, typecheck, 46 unit, build, 34 e2e);
  the stale shell `DATABASE_URL` export was unset (the documented dotenv
  precedence trap) so the repo-root `db/custom.db` resolves correctly.
- Fresh DOM captures of the live `/demo`, `/hub` (desktop + mobile),
  `/courses`, `/quiz` + the login flow; the mobile hamburger was confirmed
  still covered by the empty toaster layer on the live (the clone's
  `pointer-events-none` fix remains THE divergence that matters).
- Bundle decode produced the session-3 findings catalogue
  (docs/remediation-plan-session-3.md): 24 findings, the headline ones being
  the lesson-view architecture (F1–F8), the 3-state sidebar (F9), the
  quiz-derived progress model (F24 — the live's dashboard derives EVERYTHING
  from `round(quiz_score/5×100)`, which is exactly why its demo shows 60%
  with a 3/7 score), the per-stage lesson-title suffixes (F16), and the
  subject-icon course cards (F17).

## The remediation (TDD, plan-first)

1. **Domain layer** (tests first): `quizProgressPercent` /
   `derivedLessonsCompleted` / `roadmapCurrentStage` / `roadmapStageStatus`
   (the quiz-derived model), the `LEVEL_SUFFIXES` per-stage title pairs,
   `stageLevelLabel` (stage number twice), and `subjectIconName` (the 12
   keyword buckets). 46 → 49 unit checks.
2. **AI seam**: `generateLessonContent` upgraded to the reference's exact
   Y2 prompt and schema — `{title, concept, scenario, challenge,
   questions[8] × {question, options, correctIndex, contentType,
   contentText}}` with the level fed as the 1-based stage number.
3. **LessonView**: rewritten onto the decoded `gO/yO/xO + Im` architecture —
   subject h2 on level 1 / AI title on 2-3, per-level context cards, per-
   question video/reading content cards, the tan 2-column option grid with
   the green/red reveal, the "Next Question" button, and the 1000 ms →
   800 ms two-stage timing. The retry modal, level-up interstitial and
   confetti contracts survive unchanged.
4. **HubApp**: the 3-state sidebar (done/active/locked — locked rows are
   disabled), the session-scoped "{answered + 1}/8" Lesson Progress card
   (BookOpen icon), the always-rendered Course pill, the chevron-left
   mobile header, and the reference's mobile lessons sheet (All Lessons
   header, black active rows, yellow Active badge). The LessonView reports
   the session's answered count and the active question upward
   (`onAnswered` / `onQuestionChange`).
5. **Dashboard**: roadmap header "N/6 lessons", unrounded bar, the
   floor(lessons/2) stage statuses (no "Upcoming" text — future stages sit
   at 0.45 opacity), the gap_analysis render removed (the live never
   displays it), and `demoPercent` deleted — the demo's quiz 3 flows
   through the shared math to reproduce the live's exact 60% / 4/6 / 750 /
   3 numbers.
6. **Courses page**: the reference's CO cards — black subject-icon tiles
   (keyword-mapped lucide icons), "AI-Generated Course" / "Custom Material"
   badges, Trash2 + ChevronRight affordances, quiz-derived progress, the
   gap-[4px] grid with hover scale.
7. **Chat**: the reference's `[Current question: "…" — Options: …]` context
   prefix rides to `/api/chat` (prompt-only; the stored message stays bare).

## The gate

lint ✓ · typecheck ✓ · 49 unit ✓ · build ✓ · 36 e2e ✓ (screenshots 23–32
captured and pixel-verified — the reference's exact hexes all present).

## The deliverable

Commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py`; docs (AGENTS.md,
CLAUDE.md, README.md, PAD v1.2, SKILL.md v1.2.0) aligned with the
remediated codebase.

**Next steps to consider:** the /courses "Add a Course" could become the
reference's in-page modal (it currently links to /onboarding — the same
mode-picker content); "My Personal Material" could grow PDF extraction; the
reference's StudySession-level persistence (active_level across reloads) is
a candidate for the hub.
