# Session 7 — The Computed-Style Parity Pass

Continuing from session 6 (`e95eb78` + the transcript commit): the icon-level
parity was closed and the full gate stood at 69 unit + 46 e2e. This session
re-ran the full audit → plan → TDD → gate → push cycle with the user's
headline targets — the mobile navigation menu (re-verified) and the hunt for
Tailwind v4 engine bugs (two NEW traps found and pinned).

## What was audited

- **Workspace refresh:** `git pull` → `9fa7097` (brought `docs/session_7.md`,
  the session-6 transcript); core docs re-reviewed (AGENTS, CLAUDE, README,
  PAD v1.5, SKILL v1.5.0) + the session-6 log/plan/worklogs; baseline gate
  re-confirmed green (lint ✓ typecheck ✓ 69 unit ✓ build ✓ 46 e2e ✓ — the
  429s in the log are the known AI-seam noise; the fallbacks handle it). The
  stale shell `DATABASE_URL` trap re-armed itself (`echo $DATABASE_URL`
  showed the workspace-level file) — every dev-server/CLI command ran under
  `env -u DATABASE_URL`, and the sandbox's process reaper (it kills detached
  processes between tool calls) forced the server + probe pairs into single
  compound commands.
- **Two-axis code review** of the session-6 diff (`4fe8a2d...HEAD`, the
  `skills/code-review` methodology, parallel sub-agents): Standards — zero
  hard violations (the one-shared-dismiss-hook, icon-stroke, predicate-split,
  and typewriter-constant rules all check out); Spec — every R0-R14 item
  faithfully implemented, the minor "scope creep" findings all
  behavior-neutral strengthenings (the 4th TYPEWRITER_SWITCH_MS constant,
  the e2e's extra row assertions, the hub's useCallback wraps).
- **Live re-audit + the new methodology — computed-style histogram diffing:**
  the live (login + desktop 1280×800 + mobile 390×844) was probed via
  agent-browser while the clone ran under Node Playwright probe scripts
  (`scripts/probe-*.mjs` — the sandbox browser cannot reach localhost).
  Instead of class-string comparison, both sides were diffed on COMPUTED
  values: leaf-text font-weight distributions per route, class→radius maps
  over the whole DOM, box-shadow/backdrop-filter/typography spot checks.
- **Mobile navigation re-verified end-to-end** (the prompt's first target):
  the live still ships the toaster bug (the empty notifications container
  covers the hamburger — agent-browser refuses the click; the clone's fix
  holds, real `.tap()` works); all three menu states (no-course
  authenticated, with-course, guest) match the live's decoded structure —
  panel `rounded-[16px]` min-width 220, `#FFFD73` `p-3` header, `w-8` avatar
  at computed 9999px, `p-2` items with sw-1.5 LayoutGrid/LogOut icons; the
  single-enrollment negative pin (no Switch Course) runtime-confirmed.
- **Findings** (5 catalogued in `docs/remediation-plan-session-7.md`): the
  app-wide base font-weight (live body = **300**, clone shipped 400 — every
  weight-less text node drifted: mode-card descriptions, category tags,
  "N/6 lessons completed"); **TWO new Tailwind v4 traps** — the radius-scale
  shift (the reference's custom v3 config maps `rounded-lg` AND `rounded-xl`
  to **12px**; v4 ships 8/14px — 41 usages drifted, and globals.css had even
  pinned the WRONG 0.875rem value off a misdiagnosis: the reference's 14px
  surfaces are `rounded-[14px]` arbitrary classes, never `rounded-xl`) and
  the blur-scale shift (the login card's `backdrop-blur-sm` computes 4px on
  v3 vs 8px on v4 — the `--shadow-sm` pin's sibling); the Course-Lessons
  icon column (the clone shipped the session-1 scaffold's numbered circles
  — `h-6 w-6` pills with ✓/index text — while the live renders lucide
  CircleCheckBig (done) / Circle (next, black; later, black/40) at w-4 h-4
  sw 1.5; `git log -S` confirmed the numbered circles were never decoded,
  just scaffolded); plus the accepted divergences (lucide-react's newer
  path-based icon geometry vs the live's polylines — visually identical).
  CONFIRMED MATCHING: the streak card (flames + number cells), the lesson
  ROW states (bg/border/bar), shadow-xl geometry, all arbitrary radii,
  h1/h2 typography, the 21px tags, /courses empty state + Add tile.

## What was executed (TDD)

1. **Phase 1 (RED → GREEN):** `lessonRowStatus(i, lessonsCompleted)` in
   `domain.ts` (done/next/later, keyed off the quiz-derived count) pinned by
   `tests/domain-session7.test.ts` — 69 → **73 unit**.
2. **Phase 2 (CSS token pins, one line each):** `body { font-weight: 300 }`;
   `--radius-lg: 0.75rem` + `--radius-xl: 0.75rem` (12px — Trap 6, replacing
   the misdiagnosed 0.875rem); `--blur-sm: 4px` (Trap 7).
3. **Phase 3 (component):** the Course-Lessons icon column swapped to the
   lucide status icons, consuming `lessonRowStatus`.
4. **Phase 4 (e2e pins):** new `tests/e2e/session7-parity.spec.ts` (body
   weight 300, weight-inheriting text 300, rounded-xl 12px, rounded-lg 12px,
   CircleCheckBig ×4 + Circle ×2 + zero numbered circles, the later-icon
   black/40 dim); `auth.spec.ts` gains the login-card blur(4px) + 16px pins;
   `mobile-navigation.spec.ts` gains the menu-item 12px pin. 46 → **52 e2e**.
5. **Full gate green:** lint ✓ typecheck ✓ 73 unit ✓ build ✓ 52 e2e ✓;
   runtime re-probes verified every computed value flipped to the live's
   (rounded-xl 14→12px, body 400→300, weight histogram 400-bucket 6→5,
   backdrop blur 8→4px, icon colors black ×5 + rgba(0,0,0,0.4)); screenshots
   56-63 (pre-fix baselines 56-58 + post-fix verification 59-63); dev DB
   reseeded clean.

## Docs aligned

`docs/remediation-plan-session-7.md` (5 findings + 12 TODOs, all executed),
`docs/Tailwind-V4-Validation-Report.md` (Traps 6 + 7 + the font-weight
methodology corollary), AGENTS.md (radius/blur/body-weight/Course-Lessons
invariants + counts), CLAUDE.md (condensed), README.md (seven-trap log +
session-7 section + counts), PAD v1.6 `[S7]` revision block,
`personalized-tutor-app_SKILL.md` v1.6.0 (traps 21-23, §9), the probe
scripts committed as session-7 audit tooling, `.env.example` re-verified
(no new env vars), this file, and the repo `worklog.md`.

## Delivery

Conventional commit on `main`; push via `docs/ssh_git_wrapper_v3.py`
--remote `git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim
at `/home/z/my-project/bin/ssh`; remote ref verified == HEAD; key shredded).

## Headline outcomes

1. **Two new Tailwind v4 engine traps found, pinned, and documented**
   (Traps 6-7): the radius-scale shift (lg/xl → 12px, 41 usages) and the
   blur-scale shift (backdrop-blur-sm → 4px) — both the shadow-sm trap's
   family, both invisible to class-string comparison, both proven by
   computed-style diffing.
2. **The systemic font-weight decode miss closed:** the live's body defaults
   to font-light (300); one globals.css line fixed every weight-inheriting
   text node at once.
3. **The Course-Lessons icon column finally decoded** (lucide status icons,
   not the scaffold's numbered circles), with the row-state derivation
   extracted into a unit-pinned domain helper.
4. **The audit methodology upgraded:** computed-style histogram diffing
   (font-weight distributions + class→radius maps) — "computed styles are
   the ground truth, class strings are the approximation" is now a pinned
   doctrine (SKILL §9 trap 23).
5. **The gate grew again:** 73 unit + 52 e2e, all green.
