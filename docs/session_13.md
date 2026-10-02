# Session 13 — The Course-Switch + Data-Contract Pass

Continuing from session 12 (`3123f9f` + the log commits; the full gate stood
at 153 unit + 86 e2e). This session re-ran the full audit → plan → TDD →
gate → push cycle with the **session-12 code commit's behavioral claims** as
the deep-audit target — plus the prompt's headline mobile-navigation
re-verification.

## What was audited

- **Workspace refresh:** `git pull` → `ea91746` (docs/session_13.md = the
  session-12 transcript, per the handoff convention). The workspace
  PERSISTED — `.env` + `db/custom.db` at the repo root
  (DATABASE_URL=`file:../db/custom.db`) + `node_modules` verified; the
  `.env.example` re-verified against the codebase (no new env vars). The
  stale shell `DATABASE_URL` trap re-armed itself — every command ran under
  `env -u DATABASE_URL`. Baseline fast gate re-confirmed green (lint ✓
  typecheck ✓ 153 unit ✓ build ✓; the e2e baseline rode the session-12
  push's green run).
- **The live app bundle is BYTE-IDENTICAL** (md5 `f99e7279…` — the same
  `index-CkEI9gsZ.js` sessions 9-12 decoded), so every prior decode stands.
  A probe of `/login` initially surfaced a NEW script hash
  (`static/index-D96eRrlv.js`) — investigated and identified as the Base44
  PLATFORM shell (94 KB of mixpanel/error-reporting runtime with zero app
  markers), not an app update: the root page still serves the app bundle.
  The live re-probe: the login works, the account remains in the
  onboarding state (the entity-write 403 block), and the **mobile-nav
  headline re-verified for the 4th consecutive session** — the live's
  hamburger tap at 390×844 `hasTouch` still REFUSES (elementFromPoint at
  the tap point IS the `fixed top-0 z-[100]` toaster container); the
  clone's `pointer-events-none` fix + the real-tap e2e pins hold.
- **Two-axis code review** of the session-12 code commit (`3123f9f`,
  parallel sub-agents per `skills/code-review`): one HARD standards
  finding (the `{steps}` wrapper cast — a lazy string reply crashes
  `.every` → a 500, violating the "AI may degrade, never fail"
  invariant) and one HARD spec finding (**`setViewCourseId` is dead
  code** — the same-route course switch renders stale content), plus
  validation/timeout/pin-coverage judgement calls and polish nits.
- **My own empirical probes** settled both HARD findings: the course-switch
  probe (mount at a score-3 course, pill-switch to a score-2 course → the
  URL changed but the stats stayed at the pre-switch course until a full
  reload — the frozen-state bug confirmed, and the session-12 "the App
  Router remounts the page on same-route navigation" mechanism claim
  disproven: nothing remounts, the stale state ignored the fresh props);
  the wrapper-crash repro (`{"steps": "…"}` → `TypeError: stages.every is
  not a function`). **Fresh bundle decodes** added the wO skip contract
  (the LLM call the live itself discards — `E`/`j` computed, never used),
  the submit-time roadmap's STRING-array response schema (both the
  DiagnosticQuiz and the enrollment persist the raw strings), and the
  Kh/roadmap-card dual-shape mappers (strip the `Step N:` prefix, split
  `" — "` else `": "` under 40 chars). The scandihaven reference repo
  re-consulted (unchanged at `cb0002a`; nothing new to adopt).

## What was executed (TDD)

1. **Phase 1 (RED → GREEN, 153 → 175 unit):** the NEW
   `tests/ai-seam.test.ts` (11 checks — the first direct unit coverage of
   the AI seam, enabled by a vitest `server-only` stub alias +
   `vi.mock`ed SDK transport): the wrapper parsing for all four valid
   shapes (object wrapper, bare array, STRING steps, bare string array)
   + the degrade-never-crash pins (the string-valued steps, the empty
   array, the null reply, the two-step answer). Plus
   `tests/domain-session13.test.ts` (8 checks: `parseRoadmap`'s
   dual-shape mapping — the em-dash split, the colon split, the
   < 40-char rule, the Lesson prefix, mixed arrays) + the S13-F11
   coverage gaps (confettiAt above 7; masteryLabelTier 79/99).
2. **Phase 2 (the AI seam):** `generateCourseStages` — the
   `Array.isArray(parsed?.steps)` guard (S13-F1) + the element
   validation for both shapes; the submit-time prompt tail → the live's
   verbatim STRING schema; the generate-time tail → `"2-3 sentence
   description."` verbatim; the function now returns the RAW steps
   (`(string | StageDraft)[]`) so the routes store whatever the LLM
   answered (the live's exact write).
3. **Phase 3 (the components + routes):** `dashboard-app.tsx` derives
   `activeCourse` from the `currentCourseId` PROP (the frozen
   `viewCourseId` state deleted — S13-F2, the session's centerpiece);
   `parseRoadmap` dual-shape (S13-F5); the submit route's 422 symmetry
   (a present-but-non-array `answers` and an invalid `total` now 422 —
   S13-F4); the quiz-app comment fix; the SKILL §6 contradiction
   resolved.
4. **Phase 4 (e2e, 86 → 90):** `session13-parity.spec.ts` (4 checks: the
   course-switch CONTENT update — fails on the pre-fix code; the
   switch-driven streak burst (2→3 crossing — the c_ surface finally
   delivered); the mastery-label burst (Apprentice→Expert with NO streak
   crossing — the 90-particle effect's first behavioral pin); the 422
   family extension). Plus the session-12 spec hardened (60s timeouts on
   every request-level AI call; the confetti assertion converted from a
   fixed 1500ms wait to an 8s `expect.poll`).
5. **Docs mechanism corrections (S13-F3):** the false "the App Router
   remounts the keyed CourseDashboard / the page on a same-route switch"
   claims (two mutually contradictory stories) corrected in AGENTS.md,
   CLAUDE.md, README.md, PAD, SKILL.md, docs/session_12.md, worklog.md
   Task 22, and the session12 spec's comment — to the true mechanism: a
   same-route switch re-renders the shell with fresh props (no remount);
   the keyed child remounts on the key change (the content swap); the
   unkeyed shell's refs persist (the trigger surface).
6. **Full gate green:** lint ✓ typecheck ✓ 175 unit ✓ build ✓ 90 e2e ✓
   (the AI 429s are the expected rate limits); the switch-driven burst
   verified twice (the e2e canvas pins + a same-state pixel diff: 7,358
   burst-particle pixels vs the pre-switch baseline); screenshots 87-90
   (the pre/post course-switch content pair, the switch-driven streak
   burst, the mastery-label burst).

## Docs aligned

`docs/remediation-plan-session-13.md` (13 findings + 12 TODOs executed),
AGENTS.md (the course-switch + dual-shape + wrapper-guard invariants, the
corrected confetti mechanism, counts 175/90), CLAUDE.md (the session-13
invariants + counts), README.md (the session-13 section + counts), PAD
v1.12 `[S12]`/`[S13]` revision entries + the testing table (the new
ai-seam + session13 rows), SKILL.md v1.12.0 (§6/§7 corrected, trap 36's
response schemas corrected, traps 37-39: the frozen-state trap, the
wrapper-cast trap, the request-timeout/poll trap), this file, and the repo
`worklog.md`.

## Delivery

Conventional commit on `main`; push via `docs/ssh_git_wrapper_v3.py`
--remote `git@github.com:nordeim/personalized-tutor-app.git` (paramiko
shim; remote ref verified == HEAD; key shredded). The credential-bearing
live-probe scripts never entered the tree (the established convention);
`scripts/capture-s13-shots.mjs` + `scripts/verify-s13-burst.mjs` (the
clone's own credentials only) are committed per the session-12 precedent.

## Headline outcomes

1. **The same-route course switch was functionally broken since
   session 8** — the shell's `viewCourseId` state froze at mount (its
   setter had no caller), so every pill-row / mobile Switch Course
   navigation changed the URL while the dashboard kept rendering the
   mount-time course. Deriving `activeCourse` from the prop fixed the
   switch AND finally delivered the live's c_ confetti surface (the
   course switch — its most plausible real trigger).
2. **The session-12 "the page remounts" diagnosis was wrong** — two
   mutually contradictory false mechanism claims shipped as invariants
   across five docs + a spec comment; all corrected to the true
   mechanism (re-render with fresh props, no remount).
3. **The wrapper parser could 500 the submit/generate routes** — a lazy
   string reply (`{"steps": "…"}`) passed `.length >= 3` and crashed
   `.every`; the parser now array-checks every unwrapped field
   (empirically reproduced, unit-pinned).
4. **The roadmap data contract is dual-shape** — the live's submit-time
   prompt asks for a STRING array and persists the strings; the clone
   now mirrors both schemas verbatim and `parseRoadmap` maps both via
   the live's own split semantics.
5. **The mobile-nav headline re-verified again** — the live's menu
   remains untappable (the toaster cover); the clone's fix + pins hold.
6. **The gate grew again: 175 unit + 90 e2e, all green** (the first
   direct AI-seam unit coverage).
