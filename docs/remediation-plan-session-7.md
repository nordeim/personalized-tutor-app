# Remediation Plan — Session 7

Repo state at start: `9fa7097` (session-6 parity-polish pass complete at
`e95eb78` + the session-6 transcript commit; gate green: lint ✓ typecheck ✓
69 unit ✓ build ✓ 46 e2e ✓).

Audit sources: live-app re-login (sepnetflix2023@outlook.com — still the
onboarding state with 0 courses; with-course surfaces studied on `/demo` at
1280×800 AND 390×844), driven DOM inspections + **computed-style histograms**
(the session-7 headline technique: leaf-text font-weight distributions and
rounded-class → computed-radius maps diffed side-by-side), agent-browser for
the live side + Node Playwright probe scripts for the clone side
(`scripts/probe-*.mjs` — the sandbox's browser cannot reach localhost, so the
clone probes run through @playwright/test directly), PLUS a two-axis code
review of `4fe8a2d...HEAD` (Standards/Spec parallel sub-agents — both clean)
and git archaeology (`git log -S` on the numbered-circle markup → `01466f2`,
the session-1 scaffold).

Legend — Severity: **P0** visible behavior/structure wrong vs the reference · **P1**
data/semantics drift · **P2** polish. The `skills/` folder is excluded from code
checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S7-F1 | **The body base font-weight is 400 in the clone but 300 in the live.** The live's `body`/`#root` computed font-weight = 300 (the app-wide default is font-light); the clone's `globals.css` `body { font-weight: 400 }`. Every text node that does not set an explicit weight class inherits the drift: the onboarding mode-card descriptions (live 300/12px vs clone 400), the category tags (live 300/13px vs clone 400), "N/6 lessons completed" (live 300 vs clone 400 — the markup is otherwise byte-identical). The live /demo leaf-text weight histogram: 300×34, 400×5, 500×19, 600×5 vs the clone's 300×32, 400×9(6 visual), 500×19, 600×11 | live computed probes (body, header, pill, mode desc, tags); clone probes via `scripts/probe-weight-sweep.mjs`; `src/app/globals.css:96` | P1 |
| S7-F2 | **`rounded-xl` computes 14px in the clone (v4) but 12px in the live (base44's custom v3 config).** Tailwind v4's default `--radius-xl: 0.875rem` (14px) vs the live's uniformly-measured 12px (streak cells, mobile-menu items, lesson rows, form inputs — 15 DOM instances on /demo, 35 code usages). The clone's `globals.css` even PINS the wrong value: `--radius-xl: 0.875rem /* 12px/14px form controls */` — the "14px" half of that comment was a misdiagnosis (the live's 14px surfaces are `rounded-[14px]` ARBITRARY classes, e.g. the quiz options, never `rounded-xl`) | live radius map: `rounded-xl → 12px ×15`; clone map: `rounded-xl → 14px ×13`; `globals.css:54`; v4 default theme | P1 |
| S7-F3 | **`rounded-lg` computes 8px in the clone (v4 default) but 12px in the live** — the reference's config maps lg AND xl to 12px. Affects 6 code usages: the p_ panel's item icon tiles (`h-7 w-7 rounded-lg bg-black/5` on the live = 12px), the hub course-menu's All-Courses tile, the Nori chat send button | live p_ tile probe (12px); `app-header.tsx:158,185,200`, `hub-app.tsx:202`, `nori-chat.tsx:172` | P1 |
| S7-F4 | **The Course Lessons card's icon column is a session-1 scaffold artifact** — the clone renders `h-6 w-6 rounded-[9999px] text-[10px] font-semibold` numbered circles ("✓" when done, the index otherwise). The live renders **lucide SVG icons at w-4 h-4 sw 1.5**: `CircleCheckBig` (done, `text-black`), `Circle` (next lesson, `text-black`), `Circle` (later, `text-black/40`). The row states themselves (bg #F5F5F5 done / #FFFFFF+1px #0F0E0E next / #FAFAFA later, bar 100%/0%) already match — only the icon column was never decoded (`git log -S` → the initial scaffold commit `01466f2`) | live lesson-row DOM probe (all 6 rows); `course-dashboard.tsx:533-541` | P1 |
| S7-F5 | **The login card's `backdrop-blur-sm` computes blur(8px) in the clone (v4 scale) but blur(4px) in the live (v3 scale).** The class string matches the live (`backdrop-blur-sm` on the rounded-2xl card); the engine scale shifted (v3 blur-sm=4px → v4 blur-sm=8px, the same one-notch shift family as the pinned `--shadow-sm`) | live login probe `backdropFilter: blur(4px)`; v3/v4 scale docs; `login-card.tsx:64` | P2 |
| S7-F6 | ACCEPTED DIVERGENCE (documented, do not "fix"): the newer lucide-react renders path-based geometry where the live's older version ships polyline/line elements (e.g. LogOut) — visually identical strokes, not a drift. The live's mobile-nav toaster bug (empty notifications container covering the hamburger) STILL ships on the live; the clone's fix + e2e pin stays. The live /demo roadmap + challenge remain AI-generated per visit; the live hub still hangs at "Generating Lesson 1 content…" | icon-path diffs both sides; toaster re-probe (agent-browser refuses the covered click) | — |
| S7-F7 | CONFIRMED MATCHING (no action): the mobile menu in all three states (structure + computed: panel 16px radius, min-width 220px, #FFFD73 p-3 header, w-8 avatar at 9999px, items 14px→*12px after F2*, sw-1.5 icons); the Study Streak card (flame cells 40×40, number cells, text-4xl font-light streak); shadow-xl geometry (identical both sides); rounded-[16px]/[20px]/[14px]/[9999px] arbitrary values; h1/h2 typography (clamp 40/7vw/140, ls -0.03em, lh 0.88); the 21px tags; the typewriter; the /courses empty state + Add tile Plus (sw 2, canonical path); the p_ panel structure; the pill chevron conditional; the Switch-Course negative pin; the m_ name split; the toaster fix | computed-style diffing both sides | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `lessonRowStatus` helper** — `src/lib/domain.ts`:
  `lessonRowStatus(i, lessonsCompleted)` = `i < lessonsCompleted ? "done" :
  i === lessonsCompleted ? "next" : "later"` (the Course Lessons row state
  the live keys off the quiz-derived count). TDD:
  `tests/domain-session7.test.ts` pins (a) 4 completed → rows 0-3 "done",
  row 4 "next", row 5 "later"; (b) 0 completed → row 0 "next", rest "later";
  (c) 6 completed → no "next" row (row 5 "done"); (d) the icon contract:
  "done" → CircleCheckBig, "next"/"later" → Circle (the component consumes
  the status; the icons are pinned at the e2e layer in R8).

### Phase 2 — CSS token pins (globals.css; one line each, engine-level)

- [x] **R1. Body weight**: `body { font-weight: 300 }` — the live's
  app-wide font-light default (S7-F1). All explicit font-* classes override
  it, so only weight-inheriting text changes (toward the live).
- [x] **R2. Radius-xl pin**: `--radius-xl: 0.75rem` (12px) — replace the
  misdiagnosed 0.875rem; fix the comment (S7-F2).
- [x] **R3. Radius-lg pin**: ADD `--radius-lg: 0.75rem` (12px) — the
  reference's custom scale maps lg == xl == 12px (S7-F3).
- [x] **R4. Blur-sm pin**: ADD `--blur-sm: 4px` — restores the v3 geometry
  for `backdrop-blur-sm` (login card, S7-F5); mirrors the `--shadow-sm`
  precedent (Trap 5). No other blur consumer exists.

### Phase 3 — Component fix (S7-F4)

- [x] **R5. Course Lessons icon column** (`course-dashboard.tsx`): replace
  the numbered-circle span with status icons — done →
  `<CircleCheckBig className="h-4 w-4 flex-shrink-0 text-black"
  strokeWidth={1.5} />`; next → `<Circle className="h-4 w-4 flex-shrink-0
  text-black" strokeWidth={1.5} />`; later → `<Circle className="h-4 w-4
  flex-shrink-0 text-black/40" strokeWidth={1.5} />`. Row states (bg/border/
  bar) unchanged; consume `lessonRowStatus` (R0).

### Phase 4 — Tests (TDD), gate

- [x] **R6. Unit**: `tests/domain-session7.test.ts` (R0 pins) — RED first
  (69 → ~73), then GREEN.
- [x] **R7. E2E — `tests/e2e/session7-parity.spec.ts`** (desktop 1440×900,
  authenticated storageState): (a) body font-weight 300 on `/`; (b) the
  streak day-cell (rounded-xl) computes 12px; (c) the p_ All-Courses tile
  (rounded-lg) computes 12px; (d) the Course Lessons rows show
  CircleCheckBig ×4 + Circle ×2 on /demo and NO numbered-circle spans;
  (e) "4/6 lessons completed" weight 300. Logged-out login pin (empty
  storageState): (f) the login card's backdrop-filter is blur(4px) + radius
  16px. Mobile pin (390×844 hasTouch, per mobile-navigation.spec): (g) the
  mobile-menu item (rounded-xl) computes 12px.
- [x] **R8. Full gate** — lint → typecheck → test (unit) → build → e2e
  (all green; expected ~73 unit + ~53 e2e).

### Phase 5 — Docs, screenshots, delivery

- [x] **R9. Tailwind-V4-Validation-Report.md**: add Trap 6 (the radius-scale
  shift: v4's rounded-xl 14px + rounded-lg 8px vs the reference's custom
  lg/xl==12px config — and the class-set blindness that hid it) and Trap 7
  (the blur-scale shift: v4 blur-sm 8px vs v3 4px — the shadow-sm sibling).
  Cross-reference from the trap log in globals.css.
- [x] **R10. Docs alignment**: AGENTS.md (the radius/blur/body-weight
  invariants + the Course-Lessons icon column), CLAUDE.md (same, condensed),
  README.md (counts + session-7 section), PAD v1.6 [S7] revision block,
  `personalized-tutor-app_SKILL.md` v1.6.0 (new traps), `docs/session_7.md`
  (formatted session summary), repo `worklog.md`. `.env.example` re-verify
  (no new env vars expected). Commit the probe scripts
  (`scripts/probe-*.mjs`) as the session-7 audit tooling.
- [x] **R11. Screenshots 56+**: post-fix verification shots (fresh-user
  onboarding mobile, /courses fresh, mobile menu, /demo desktop with the
  fixed lesson icons + streak cells). Probes 56-58 already captured pre-fix
  baselines.
- [x] **R12. Commit + push** — Conventional Commit on main, push via
  `docs/ssh_git_wrapper_v3.py` (paramiko shim at `/home/z/my-project/bin/ssh`).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `src/app/globals.css:96` — `body { … font-weight: 400 }` (R1 target) ✓;
   `:54` `--radius-xl: 0.875rem` (R2 target) ✓; no `--radius-lg` / `--blur-sm`
   tokens exist yet (R3/R4 additions) ✓.
2. `src/components/dashboard/course-dashboard.tsx:533-541` — the
   `h-6 w-6 rounded-[9999px] text-[10px] font-semibold` numbered-circle span
   with `{isDone ? "✓" : i + 1}` (R5 target); the row bg/border logic
   (`isDone ? #F5F5F5 : isNext ? #FFFFFF+#0F0E0E : #FAFAFA`) already matches
   the live — keep it, only swap the icon column ✓.
3. `src/lib/domain.ts` exports `derivedLessonsCompleted` already; R0 adds
   `lessonRowStatus` alongside it (same file, pure) ✓.
4. The live's radius map (ground truth): `rounded-full 9999px`, `rounded-xl
   12px`, `rounded-lg 12px`, `rounded-[16px]/[20px]/[14px]` — the clone's
   arbitrary values already match; only the two named classes need pins ✓.
5. The e2e baseline = 46 (R7 adds ~7 checks → ~53 expected); the unit
   baseline = 69 (R6 adds ~4 pins → ~73 expected) ✓.
6. No Prisma schema changes, no new API routes, no new env vars —
   CSS-token/component/e2e work only (envelope-compatible) ✓.

Execution order note: Phase 1 (red) → Phase 2 (pins) → Phase 3 (component) →
unit green → build → Phase 4 e2e → full gate → screenshots → docs → push.
