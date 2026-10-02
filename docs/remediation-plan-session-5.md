# Remediation Plan — Session 5

Repo state at start: `25856bb` (session-4 parity pass complete at `c7cd576`, plus the
session-5 prompt transcript; gate green: lint ✓ typecheck ✓ 55 unit ✓ build ✓ 41 e2e ✓).

Audit sources: live-app re-login (sepnetflix2023@outlook.com — account sits in the
onboarding state with 0 courses; with-course surfaces studied on `/demo` and in the saved
bundle `clone-workspace/recon/live-index.js`), driven DOM inspections at 1280×800 and
390×844 (onboarding dashboard, setup panel tags, hub desktop + mobile header / tab bar /
lessons sheet, the p_ and m_ dropdowns, the guest Q5 modal submit, the /courses surface,
the login card), bundle decode of the MOBILE menu panel (the `md:hidden` variant), the
desktop m_ variants (w-80 with-course / 200px no-course), the typewriter state machine
(`o_`, topic list `$i`), and the tag-btn style block — PLUS a two-axis code review of
`c375a26...HEAD` (Standards: AGENTS/CLAUDE/SKILL + Fowler smell baseline; Spec:
remediation-plan-session-4) run as parallel sub-agents.

Legend — Severity: **P0** visible behavior/structure wrong vs the reference · **P1**
data/semantics drift · **P2** polish. The `skills/` folder is excluded from code
checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S5-F1 | **The mobile hamburger menu is a SEPARATE component in the reference** (not the desktop m_ reused): items container is `p-2` with NO `space-y-0.5`; it renders a **"Switch Course" section when enrollments.length > 1** — label `text-[10px] font-light px-3 py-1` #595959, rows = BookOpen (w-4 h-4, strokeWidth 1.5) + name `text-sm font-medium flex-1 truncate` + Check (w-3.5 h-3.5, strokeWidth 2) on the CURRENT course (`O.id === l`), rows navigate `/?course={id}` (the dashboard), followed by a divider `h-px bg-black/10 my-1`; then My Courses → `/courses`; then **Log Out (auth) / Sign In (guest, `!g`)** — **NO Update Preferences on mobile**. The menu header context line renders the CURRENT SUBJECT ALONE in `text-xs text-black/60` (not the full "· Default" context line, not #595959). The clone reuses the shared MenuBody (Update Preferences present, `space-y-0.5`, full context line, no switcher, no Sign In variant) | bundle decode `md:hidden absolute right-0 … minWidth:"220px"` → `{g && p-3 yellow header w-8 avatar + name + (o && p.text-xs.text-black/60 {o})}` then `p-2` items; live `/` 390×844 DOM (menu force-opened: name-only header + My Courses/Log Out); live `/demo` 390×844 DOM (context "Economics" text-black/60, My Courses + Log Out only) | P1 |
| S5-F2 | The desktop with-course m_ header: `p-4` + `gap-3` + avatar `w-10 h-10` with `text-base` font weight/size classes. The clone renders `p-3` + `gap-2.5` + w-10 avatar with `text-sm` | bundle `w-80` panel decode: `p-4` / `gap-3` / `w-10 h-10 … font-semibold text-base`; live `/demo` DOM match | P1 |
| S5-F3 | The desktop no-course m_ items container: `p-2` (NO space-y-0.5). The clone's shared MenuBody always renders `space-y-0.5 p-2` | bundle 200px panel decode `p.jsxs("div",{className:"p-2"` | P2 |
| S5-F4 | The p_ panel icons render at strokeWidth **2** (LayoutGrid in All Courses, Plus in Add a Course). The clone uses 1.5 | live `/demo` p_ panel DOM (`stroke-width="2"` on both) | P2 |
| S5-F5 | The GUEST user-pill hover is `hover:bg-black/5` (also the hub's user pill); the authenticated dashboard pill is `hover:bg-black/10`. The clone renders `hover:bg-black/10` everywhere | live `/demo` desktop pill DOM vs `/` pill DOM | P2 |
| S5-F6 | The typewriter timings: type **60 ms/char**, delete **50 ms/char**, hold (idle→deleting) **2000 ms**, no gap between delete-complete and typing, and the initial state is the FULL first topic (types $i[0], idles 2000 ms, then deletes). The clone: type 90, delete 45, hold 2400, gap 420, initial 600 ms from EMPTY | bundle `o_` state machine decode; live h1 DOM ("Dive into Economics" full text on load) | P2 |
| S5-F7 | The onboarding category tags: `tag-btn px-3 py-1 text-[13px] rounded-full flex items-center overflow-hidden leading-none` with background `rgba(255,255,255,0.5)` → computed height 21 px. The clone: `px-3 py-1.5 text-xs` + bg 0.6 → 28 px | live tag DOM + computed styles | P2 |
| S5-F8 | **Tailwind v4 `rounded-full` Infinity serialization**: the clone's 49 `rounded-full` usages compute to `33554400px` (`calc(Infinity*1px)`) while the v3 reference computes `9999px`. CLAUDE.md documents the pin ("use `rounded-[9999px]` on pills") but the code never adopted it | computed-style probe both sides (clone avatar 3.35544e+07px, live avatar 9999px) | P2 |
| S5-F9 | The reference's guest mobile menu renders a **Sign In** button when there is no user (`!g`), degrading Log Out. The clone's guest mobile menu renders Log Out | bundle `!g&&p.jsx("button",…children:"Sign In")` | P2 |
| S5-F10 | `MenuBody.saveName` checks only `res.ok` — it ignores the documented `{ok,error}` envelope and silently no-ops on failure (no toast), while `add-course-modal.submit` parses the envelope and toasts | code review (Standards axis): `src/components/layout/app-header.tsx` vs `add-course-modal.tsx` | P2 |
| S5-F11 | The outside-click dismissal effect is copy-pasted 3× (CoursePill, UserMenu, AppHeader-mobile). Extract one hook | code review (Standards axis, Duplicated Code smell) | P3 |
| S5-F12 | The custom-source predicate is duplicated: `domain.ts courseContextLine` (`==="custom"||"material"`) vs `app-header.tsx` CoursePill icon (`==="material"||"custom"`). Extract `isCustomSource()` in domain.ts | code review (Standards axis, Repeated Switches smell) | P3 |
| S5-F13 | Dead field: `hub-app.tsx` still types `courses[].current` and `hub/page.tsx` still computes it, but session-4 removed the only reader (the "current" badge) | code review (Standards axis, dead field) | P3 |
| S5-F14 | **Missing authenticated Q5 e2e flow**: no test drives tag click → topic fill → Start Assessment → `POST /api/courses/generate` → `/quiz?course=` (only the guest degradation path is tested) | code review (Spec axis, R10(1) partial) | P1 |
| S5-F15 | The preferences-save e2e never asserts the header name updates after PUT /api/student | code review (Spec axis, R10(3) partial) | P2 |
| S5-F16 | CONFIRMED MATCHING (no action): hub mobile header (chevron + Dashboard + Lessons pill), bottom tab bar (structure + active/inactive colors), mobile lessons sheet rows, login card, /courses surface, mode cards, setup panel input/Continue/Try-it, DIVE_TOPICS ($i) exact, caret-blink CSS exact, tag-btn hover mechanics (max-width/opacity/margin-right transitions + hover white), the p_ panel structure/empty state/tile classes | live DOM probes vs clone DOM probes | — |
| S5-F17 | The live's guest Q5 Start Assessment on /demo silently no-ops (entity writes 403; no toast, modal stays open). The clone degrades honestly (toast + `/login?from_url=`) — KEEP the clone behavior (documented divergence, K-5 doctrine). The live hub's user pill renders an empty name + "?" avatar (null full_name quirk) — do not replicate. The live /demo mobile menu reads the REAL session user; the clone's stateless /demo shows "Guest" — accepted divergence | live behavior probes | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `isCustomSource` + `mobileContextLine` helpers** — `src/lib/domain.ts`:
  `isCustomSource(s)` = `s === "custom" || s === "material"`; refactor
  `courseContextLine` to use it. TDD: `tests/domain-session5.test.ts` pins for
  `isCustomSource` branches ("custom" true, "material" true, "topic" false, null
  false) + `courseContextLine` regression (existing session-4 pins must stay green).

### Phase 2 — The mobile menu rework (`app-header.tsx`)

- [x] **R1. `useDismissOnOutsideClick` hook** — extract the triplicated effect into
  `src/components/layout/use-dismiss.ts` (or inline in app-header.tsx above the
  components); CoursePill/UserMenu/AppHeader-mobile consume it (S5-F11).
- [x] **R2. `MobileMenuBody`** (dedicated, S5-F1 + S5-F9): items `p-2` (no space-y) ·
  `Switch Course` section when `courses.length > 1` (label `px-3 py-1 text-[10px]
  font-light` #595959; rows BookOpen strokeWidth 1.5 + `flex-1 truncate` name + Check
  strokeWidth 2 on the current course; rows → `/?course={id}`; divider `h-px
  bg-black/10 my-1`) · My Courses → `/courses` · Log Out (auth) / Sign In (guest →
  `/login?from_url=%2Fdemo`) · header context = current subject ALONE in
  `text-xs text-black/60`.
- [x] **R3. AppHeader mobile wiring** — new optional prop `courses?: { id, name,
  current }[]` (ALL enrollments with current flags, distinct from `enrollments` =
  the OTHER courses for the p_ panel); the mobile panel renders MobileMenuBody;
  the mobile menu header drops the `student` context line in favor of the subject
  line. Pass `courses` from dashboard-app (all enrollments), demo-dashboard (the
  sample course as current), and leave quiz/courses apps as-is (no course →
  no switcher).
- [x] **R4. Mobile menu-state cleanup** — the mobile view no longer needs the
  `MenuView` preferences state (mobile has no preferences sub-panel): remove
  `mobileView`/`setMobileView` threading; `MenuBody` becomes desktop-only.

### Phase 3 — UserMenu + CoursePill fixes

- [x] **R5. Desktop m_ header metrics (S5-F2)**: with-course header `p-4` + `gap-3`
  + avatar `w-10 h-10` + `text-base`; no-course header stays `p-3`/`gap-2.5`/`w-8`
  (matches the 200px variant).
- [x] **R6. Items container split (S5-F3)**: `MenuBody` items `space-y-0.5 p-2` ONLY
  in the with-course (w-80) variant; the no-course variant renders `p-2`. Thread a
  `student != null` check (already available in MenuBody).
- [x] **R7. Guest pill hover (S5-F5)**: the UserMenu trigger uses
  `hover:bg-black/5` when `guest`, else `hover:bg-black/10`.
- [x] **R8. CoursePill icons (S5-F4)**: LayoutGrid + Plus at strokeWidth 2;
  the CoursePill icon predicate switches to `isCustomSource` (S5-F12).
- [x] **R9. `saveName` envelope (S5-F10)**: parse the `{ok,error}` body; on failure
  toast "Couldn't save your preferences — try again"; keep the return-to-items
  behavior only on success.

### Phase 4 — Dashboard surface polish

- [x] **R10. Typewriter (S5-F6)**: type 60 ms, delete 50 ms, hold 2000 ms, no
  delete→type gap; initial state = full first topic (idle 2000 ms → delete). Keep
  the hydration-safe mount behavior.
- [x] **R11. Tag buttons (S5-F7)**: `px-3 py-1 text-[13px] flex items-center
  overflow-hidden leading-none` + bg `rgba(255,255,255,0.5)` (drop `transition-all`
  from the class list? keep — hover transitions live in the .tag-btn CSS), height
  target 21 px.
- [x] **R12. `rounded-[9999px]` sweep (S5-F8)**: replace all 49 `rounded-full`
  usages in `src/` with `rounded-[9999px]` (computed-style parity with the v3
  reference; visually identical; e2e already asserts borders, not radii). Exclude
  `docs/`, `tests/` (no styled elements), and the `skills/` folder.

### Phase 5 — Hub dead-field cleanup

- [x] **R13. Drop `courses[].current` (S5-F13)** from hub-app's type + hub/page.tsx
  DTO mapping (the reader is gone; the mobile switcher in AppHeader uses its own
  `courses` prop, not the hub's).

### Phase 6 — Tests (TDD), gate, delivery

- [x] **R14. Unit tests** — `tests/domain-session5.test.ts`: `isCustomSource` pins
  + `courseContextLine` regression. RED first (55 → 57+).
- [x] **R15. E2E — mobile menu spec update** (`tests/e2e/mobile-navigation.spec.ts`
  + `header.spec.ts` if needed): the mobile menu still shows My Courses + Log Out
  (demo account: 1 enrollment → no switcher). NEW: a test that registers/adds a
  second course via the Q5 modal (API-driven: POST /api/courses/generate twice)
  then asserts the mobile "Switch Course" section renders (label, 2 rows, Check on
  the current, row click → `/?course=`). NEW: the guest demo mobile menu shows
  **Sign In** (not Log Out).
- [x] **R16. E2E — authenticated Q5 flow (S5-F14)**: tag click fills the topic
  (`"Economics: Microeconomics"`), Start Assessment disabled until filled, submit
  creates the course and lands on `/quiz?course=` (use a fresh registered user or
  the API to reset state).
- [x] **R17. E2E — preferences header-name assertion (S5-F15)**: after Save
  Changes, the header pill name (and the m_ header name) shows the new value.
- [x] **R18. Full gate** — lint → typecheck → test (unit) → build → e2e (all green).
- [x] **R19. Screenshots** — 45+: the reworked mobile menu (items + Switch Course
  variant + guest Sign In), the m_ desktop header metrics, the tag row, the
  typewriter mid-cycle, spot-check the rounded sweep.
- [x] **R20. Docs + SKILL + log** — AGENTS.md (mobile-menu invariant: separate
  component, no Update Preferences, Switch Course semantics), CLAUDE.md (same),
  README.md (parity section), PAD v1.4 [S5] revision block,
  `personalized-tutor-app_SKILL.md` v1.4.0, `docs/session_5.md` session log, repo
  `worklog.md`, workspace worklog. `.env.example` re-verify (no new env vars).
- [x] **R21. Commit + push** — Conventional Commit on main, push via
  `docs/ssh_git_wrapper_v3.py` (paramiko shim at `/home/z/my-project/bin/ssh`).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `src/components/layout/app-header.tsx` — line 336 MenuBody `space-y-0.5 p-2`
   (R6 target), lines 457-481 UserMenu header `p-3`/`gap-2.5` (R5 target), line 421
   pill `hover:bg-black/10` (R7 target), lines 585-660 mobile panel rendering
   MenuBody (R2-R4 targets), three outside-click effects (R1 target) ✓.
2. `src/components/dashboard/onboarding-dashboard.tsx` lines 46-77 useTypewriter
   (90/45/2400/420/600 + empty initial — R10 target) ✓.
3. `src/components/dashboard/onboarding-dashboard.tsx` tag buttons: `rounded-full
   px-3 py-1.5 text-xs` + `bg-white/60` (R11 target; verify exact lines at exec
   time) ✓.
4. `rg -c "rounded-full" src/` = 49 usages / 10 files (R12 sweep list) ✓.
5. `src/lib/domain.ts` `courseContextLine` has the inline `==="custom"||"material"`
   predicate (R0 extraction target) ✓.
6. `src/components/hub/hub-app.tsx` line ~64 `current: boolean` + `hub/page.tsx`
   DTO mapping (R13 target; grep `current:` to confirm at exec time) ✓.
7. E2E touchpoints: `tests/e2e/mobile-navigation.spec.ts` lines 42-59 (mobile menu
   items — stays green: demo account = 1 enrollment → no switcher; Log Out
   unchanged), `tests/e2e/header.spec.ts` (desktop — Update Preferences untouched),
   `tests/e2e/session4-parity.spec.ts` (desktop-only guest chrome — untouched),
   `tests/e2e/dashboard.spec.ts` (Q5 modal structure test — R16 extends with the
   authenticated flow; the existing disabled-state assertion may move) ✓.
8. `MenuBody`'s `guest` degradation (preferences → sign-up route) stays
   desktop-only: the mobile guest menu per the live = My Courses + Sign In (R2),
   no preferences surface. The demo mobile header keeps the Guest name line ✓.
9. No Prisma schema changes, no new API routes, no new env vars — client-component
   + page-snapshot wiring only (envelope-compatible).
10. `rounded-full` in `src/components/login/login-card.tsx` (2) — sweep includes it
    (shadcn surface; v4 pin applies there too — the reference login is v3).

Execution order note: Phase 1 (red) → Phase 2 (mobile rework — biggest structural
change) → Phase 3 (UserMenu/CoursePill) → Phase 4 (dashboard polish + sweep) →
Phase 5 (hub cleanup) → unit green → build → Phase 6 e2e updates → full gate →
screenshots → docs → push.
