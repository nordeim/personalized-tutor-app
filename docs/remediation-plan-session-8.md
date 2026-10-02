# Remediation Plan — Session 8

Repo state at start: `5ca9c4e` (session-7 complete at `b9d02e8` + the session-7
transcript commit; baseline gate green: lint ✓ typecheck ✓ 73 unit ✓ build ✓
52 e2e ✓).

Audit sources: live-app re-login (sepnetflix2023@outlook.com — onboarding
state, 0 courses; plus a full LOGGED-OUT pass: the anonymous surfaces were
probed for the first time since session-1), driven DOM inspections +
computed-style histograms (the session-7 doctrine) at 1280×800 and 390×844
via agent-browser (live) + `scripts/probe-typography.mjs` (clone — same
TreeWalker as the live eval, so the sides diff cleanly), PLUS a two-axis code
review of `9fa7097...b9d02e8` (Standards + Spec parallel sub-agents — zero
hard violations; three judgement-call notes and two honest e2e-pin gaps
rolled into this plan) and fresh bundle archaeology (the X2 onboarding
component fully decoded: the pending_student_setup contract, the Try-it →
/demo navigation, and the Y2 subject prop).

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or visual drift · **P2** polish. The `skills/` folder is
excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S8-F1 | **THE PUBLIC-SURFACE MODEL IS INVERTED.** The live's anonymous `/` and `/onboarding` render the onboarding surface — NOT a login redirect. The anonymous header carries the black **Sign In pill** (`flex items-center gap-2 px-4 py-1.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all`, computed r 9999px) instead of the m_ user menu, plus the `md:hidden w-9 h-9` hamburger; the anonymous mobile menu is ITEMS-ONLY (no yellow name header): My Courses + Sign In. The setup panel renders an extra **"Your Name"** block between the subtitle and the mode cards (`div.space-y-1.5` > `label.text-sm font-semibold` "Your Name" + `input.w-full.px-4.py-3.text-sm focus:ring-2 ring-black/20` placeholder "e.g. Alex Johnson"; anonymous = name required, authenticated = no field). The anonymous Continue stores `pending_student_setup` (`{name, content_source, current_subject, content_text}`) then `navigateToLogin()` = `/login?from_url=<current>`; after login the X2 onboarding picks the pending up, creates/updates the Student (`name: full_name \|\| pending.name` — the ACCOUNT name wins), and navigates to **/quiz**. The clone redirects anonymous `/` + `/onboarding` to `/login?from_url=…` — the public landing surface does not exist. | live anonymous DOM probes (/, /onboarding, 390 + 1280); bundle X2 decode (`localStorage.setItem("pending_student_setup"…` / `name:a.full_name\|\|g.name` / `e("/quiz")`); clone `src/app/page.tsx:20` + `src/app/onboarding/page.tsx:14` (both `redirect("/login?from_url=…")`) | **P0** |
| S8-F2 | **The anonymous flow inverts /demo's gate.** The live's `/demo` REQUIRES auth (anonymous → the login redirect; the route is registered under the auth gate — verified logged-out). The clone's `/demo` is open to everyone. | live logged-out `/demo` → login card; live route decode (`r ? <Route path="/demo" …/>`); clone `src/app/demo/page.tsx` (no session check) | **P1** |
| S8-F3 | **"Try it Sample: Economics Course" is a NAVIGATION, not a course generation.** The live's X2: `const o = () => { e("/demo") }` — the Try it button routes to `/demo` for every state (the is_sample pending path in the bundle is dead code — no writer exists). The clone's Try it calls `generate({ mode: "topic", topic: "Economics" })` — creating a real Economics enrollment + quiz for the user. | bundle X2 decode (`onTryIt:o` where `o=()=>e("/demo")`); clone `onboarding-dashboard.tsx:298-299` | **P1** |
| S8-F4 | **The hub LessonView h2 subject comes from the STUDENT, not the course.** The live: `ce = (student?.current_subject) \|\| "General"` → `Y2({ subject: ce })`; on level 1 the h2 renders that prop directly (no course-name fallback). The clone: `subject = course?.courseName ?? "General"` (hub-app:130) — the HubCourse.currentSubject field (already `student?.currentSubject`) is passed to the Course PILL but NOT to the LessonView. Drifts whenever the student's current_subject ≠ the active course name (the multi-course switched state). | bundle (`const ce=(g==null?void 0:g.current_subject)\|\|"General"` + `subject:ce`); live /hub for the 0-course account (h2 "General" while the course pill reads "Economics"… on /demo the virtual student has id null → "General"); clone `hub-app.tsx:130`, `lesson-view.tsx:122` | **P1** |
| S8-F5 | **The dashboard card icons drift (identity + size).** The live's stats mini-cards: Subject = BookOpen at **24px** (clone: BookOpen 20px); Course Progress = **Trophy** at 24px (clone: TrendingUp 20px); Daily Challenge = **Brain** at 24px (clone: Sparkles 20px); Learning Roadmap = Sparkles at **24px** (clone: 20px); Course Lessons card = BookOpen at **16px** (clone: 20px); the challenge modal header icon = Brain at 20px (clone: Sparkles). The Study Streak CalendarDays (w-4) and Total XP Gem (w-4) match exactly on both sides (class-for-class). | live icon path-data probes (all card headers on /demo); clone icon constants (BOOK_ICON/TREND_ICON/SPARKLE_ICON all `h-5 w-5`) | **P1** |
| S8-F6 | **The Daily Challenge modal drifts on three points.** (a) The overlay = `fixed inset-0 z-50 flex items-center justify-center` with bg **rgba(0,0,0,0.5)** and NO backdrop blur — the clone ships `bg-black/75` + `backdrop-blur(6px)`. (b) The post-reveal state has **NO result banner** — the reveal colors alone communicate (correct = yellow #FFFD73, others = #DCDCDC, confirmed by answering the live challenge) and the Submit button swaps in place to **"Close"** (`w-full py-3 rounded-[12px] bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-all`). The clone renders a green/red result banner (CircleCheckBig/CircleX + text) plus a separate Close button — session-2 scope creep. (c) The card itself matches (`w-full max-w-md mx-4 rounded-[24px] p-6 flex flex-col gap-4`, question/hint/options geometry all equal). | live challenge driven open + answered (reveal colors probed); clone `course-dashboard.tsx:295-394` | **P2** |
| S8-F7 | **Tailwind v4 alpha-color serialization (Trap 8, documentation-grade).** The streak weekday letters' `text-black/40` computes `oklab(0 0 0 / 0.4)` in v4 vs `rgba(0, 0, 0, 0.4)` in v3 — visually identical for achromatic alpha (the audit found zero chromatic alpha usages), but a computed-value mismatch the histogram doctrine should record. Session-7 already normalized the later-lesson icon via inline rgba; the 7 streak letters still ride the class. | live vs clone /demo color histograms (7 oklab vs 7 rgba); the class sweep (only black/white alphas in the app) | **P2** |
| S8-F8 | **The clone's `/hub?course=<unowned id>` falls back to `enrollments[0]`** (the newest course); the live renders the hub with NO enrollment (the default-grid hub — verified live with `?course=demo-enrollment` as a 0-course account: the default lesson titles + "General"). Edge-case drift. | live /hub?course=demo-enrollment probe; clone `src/app/hub/page.tsx:44` (`matched ?? enrollments[0]`) | **P2** |
| S8-F9 | CONFIRMED MATCHING (no action): the /demo desktop typography histogram (68 real text leaves both sides — font-size/line-height/letter-spacing/color/weight buckets equal after dropping the clone's 3 inline-script text nodes and the live's 1 style node); the hub shell (desktop header + Course pill + "?" trigger + 3-pane geometry + mobile header/Lessons pill + tab bar); NoriChat (header `px-5 py-4 border-b` + w-9 mascot, `space-y-3` messages, 16/16/16/4 bubbles, input row + w-7 send); LessonView (options `grid grid-cols-2 gap-2.5` tan rounded-[14px], Next-Question disabled #E0E0E0, Core Concept `rounded-[16px] p-4 flex items-start gap-3`, shimmer wrapper + `px-1 pt-2 pb-1` caption, h3 `text-base font-normal mb-4 mt-4`, the w-24 progress bar track #E0E0E0); the sidebar 3-state rows (w-8 h-8 circles, `space-y-2`) + the Lesson Progress card (track rgba(0,0,0,0.12)); the mobile menu in all three states (the prompt's standing headline — panel 16px/220px min-w, items 12px, guest = My Courses + Sign In with NO name header; the live toaster bug persists, the clone's fix + e2e pin hold); the quiz no-student message; the XP Gem + streak CalendarDays icons; the login card. The two-axis review of the session-7 diff: zero hard violations (probe-script duplication + a status-map refactor noted as judgement calls). | computed-style diffs both sides; parallel sub-agent reviews | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `hubLessonSubject` helper** — `src/lib/domain.ts`:
  `hubLessonSubject(course)` = `(course?.currentSubject ?? "").trim() ||
  "General"` — the live's `ce` formula over the HubCourse shape (the
  student's current_subject, NOT the course name). TDD:
  `tests/domain-session8.test.ts` pins (a) currentSubject "Economics" →
  "Economics"; (b) null course → "General"; (c) null/blank currentSubject →
  "General" (the live's `||` semantics — an empty subject never falls back
  to the course name); (d) the LIVE-vs-clone contract: the courseName field
  is deliberately ignored (the multi-course-switched pin).

### Phase 2 — The public onboarding flow (S8-F1/F2/F3)

- [x] **R1. `AppHeader` signed-out variant** (`src/components/layout/app-header.tsx`):
  a `signedOut?: boolean` prop — when true: (a) desktop renders the black
  Sign In pill (`flex items-center gap-2 px-4 py-1.5 rounded-[9999px]
  bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all`
  → `router.push("/login")`) at ALL widths (the live shows the pill beside
  the mobile hamburger too — it is NOT inside the `hidden md:flex` block);
  (b) the CoursePill + UserMenu desktop block is skipped; (c) the mobile
  menu panel renders ITEMS-ONLY (no yellow name header) via
  `MobileMenuBody` with `courses={[]}` + `guest` semantics (My Courses +
  Sign In). The hamburger itself is unchanged (`md:hidden w-9 h-9
  rounded-full hover:bg-black/10`).
- [x] **R2. `OnboardingDashboard` public mode** (`src/components/dashboard/onboarding-dashboard.tsx`):
  a `publicMode?: boolean` prop — (a) renders the "Your Name" block
  (`div.space-y-1.5` > `label.text-sm font-semibold text-black` "Your Name" +
  `input.w-full bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2
  focus:ring-black/20 transition-all` placeholder "e.g. Alex Johnson",
  rounded 12) between the subtitle block and the "What would you like to
  learn?" block — required for Continue in public mode (the live's
  `(a || x)` gate: anonymous requires the name, authenticated never shows
  the field); (b) the anonymous Continue + Try it store
  `pending_student_setup` (sessionStorage, the live's key name:
  `{mode, topic, courseName, contentText, name}`) and redirect to
  `/login?from_url=<current pathname>` — the live's `navigateToLogin`;
  (c) **Try it routes to `/demo`** (S8-F3 — for every auth state; anonymous
  → /demo → the R4 gate → login, exactly the live's chain);
  (d) the post-login pickup: on mount (authenticated, non-public), read +
  remove `pending_student_setup` and AUTO-SUBMIT the stored form through the
  existing `generate()` flow → `/quiz?course=<id>` (the live: X2 creates
  the student then `navigate("/quiz")`; the clone's generate creates the
  student + enrollment in one seam — the observable flow matches: land in
  the quiz for the chosen topic).
- [x] **R3. Public pages** (`src/app/page.tsx` + `src/app/onboarding/page.tsx`):
  no session → render the DashboardApp with `user=null, student=null,
  courses=[], currentCourseId/currentCourse=null, bubbleQuote` (the public
  onboarding state) instead of the login redirect. `DashboardApp` widens
  `user` to `DashboardUser | null` and threads `signedOut` to AppHeader +
  `publicMode` to OnboardingDashboard.
- [x] **R4. `/demo` auth gate** (`src/app/demo/page.tsx`): `getSessionUser()`
  → anonymous redirects to `/login?from_url=%2Fdemo` (S8-F2 — matches the
  live; the authenticated /demo content is unchanged: the guest chrome,
  degraded writes, and the seeded sample all stay).

### Phase 3 — Challenge modal + card icons (S8-F5/F6)

- [x] **R5. Challenge modal** (`course-dashboard.tsx`): overlay bg →
  `rgba(0, 0, 0, 0.5)` with NO backdrop blur; delete the result banner
  branch — after the reveal the SAME button slot renders "Close"
  (`w-full py-3 rounded-[12px] bg-black text-white text-sm font-semibold
  transition-all hover:bg-gray-800`) which resets + closes; the reveal
  colors stay (correct #FFFD73, wrong-pick #FFD0D0, others #DCDCDC).
- [x] **R6. Card icon swaps** (`course-dashboard.tsx`): Subject → BookOpen
  **h-6 w-6**; Course Progress → **Trophy h-6 w-6**; Daily Challenge
  mini-card → **Brain h-6 w-6**; Learning Roadmap → Sparkles **h-6 w-6**;
  Course Lessons card → BookOpen **h-4 w-4**; challenge modal header →
  **Brain h-5 w-5** (sw 1.5 everywhere, matching the live's lucide props).

### Phase 4 — P2 polish (S8-F7/F8)

- [x] **R7. Streak weekday letters**: inline `color: "rgba(0, 0, 0, 0.4)"`
  on the 7 letters (the session-7 later-icon precedent — computed parity
  with the live's v3 rgba serialization). Add **Trap 8** to
  `docs/Tailwind-V4-Validation-Report.md` (v4 alpha colors serialize as
  oklab color-mix vs v3's rgba — achromatic-equivalent, chromatic risk
  none in this app; normalize pinned surfaces via inline rgba).
- [x] **R8. Hub unowned-param** (`src/app/hub/page.tsx`): a `course` param
  that matches no enrollment renders the hub with NO course (the default
  grid + "General" — the live's observed behavior) instead of falling back
  to `enrollments[0]`. The no-param case KEEPS the newest-enrollment
  default (unchanged).

### Phase 5 — Tests (TDD), gate

- [x] **R9. Unit**: `tests/domain-session8.test.ts` (R0 pins) — RED first
  (73 → ~77), then GREEN. `parsePendingSetup` (the sessionStorage payload
  parser — defensive: invalid JSON → null) also unit-pinned if extracted as
  a helper.
- [x] **R10. E2E updates**: `tests/e2e/auth.spec.ts` — the anonymous-root
  test REWRITES to the public onboarding (Sign In pill visible, "Your Name"
  field, "Let's get you set up"); ADD the anonymous redirect pins for
  /demo, /hub, /quiz, /courses; ADD the pending-flow e2e (anonymous
  onboarding → fill name + topic → Continue → `/login?from_url=%2F` →
  sign-up → the pickup auto-generates → `/quiz?course=`).
- [x] **R11. E2E `tests/e2e/session8-parity.spec.ts`** (authenticated
  storageState where needed): (a) the /hub h2 = the STUDENT's
  current_subject ≠ course name pin (fresh user via API + PUT
  /api/student; R0's behavioral pin); (b) the challenge overlay computes
  rgba(0,0,0,0.5) with NO blur + the post-reveal swaps Submit→Close with
  NO banner; (c) the Trophy/Brain icon pins (path `d` prefixes + 24px
  computed widths; the Course-Lessons 16px); (d) the Try-it → /demo
  navigation pin; (e) the /hub unowned-param default-grid pin; (f) the
  streak weekday letter color rgba(0,0,0,0.4). Mobile (390, hasTouch): the
  public onboarding's guest menu (no name header; My Courses + Sign In).
- [x] **R12. Full gate** — lint → typecheck → test → build → e2e (all
  green; expected ~77 unit + ~62 e2e).

### Phase 6 — Docs, screenshots, delivery

- [x] **R13. Docs alignment**: AGENTS.md (the public-surface model, the
  Try-it→/demo invariant, the h2-subject invariant, the challenge modal +
  icon contracts, the /demo gate), CLAUDE.md (condensed), README.md
  (counts + session-8 section), PAD v1.7 [S8] revision block,
  `personalized-tutor-app_SKILL.md` v1.7.0 (Trap 8 + the public-flow
  section), `docs/session_8.md` (formatted session summary), repo
  `worklog.md`, `.env.example` re-verify (no new env vars expected —
  sessionStorage carries the pending setup, not env).
- [x] **R14. Screenshots 64+**: the public onboarding (desktop + mobile +
  the guest menu open), the anonymous Try-it → login chain, the post-fix
  challenge modal (overlay + reveal + Close), the /hub h2 subject state,
  the fixed card icons.
- [x] **R15. Commit + push** — Conventional Commit on main, push via
  `docs/ssh_git_wrapper_v3.py` (paramiko shim at `/home/z/my-project/bin/ssh`;
  `--remote` ALWAYS passed).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `src/components/hub/hub-app.tsx:130` — `const subject = course?.courseName
   ?? "General"` (R0/F4 target); the `HubCourse` type already carries
   `currentSubject?: string | null` (line 30) and `src/app/hub/page.tsx:54`
   populates it from `student?.currentSubject ?? null` ✓ — the fix is a
   one-line swap to the domain helper.
2. `src/app/page.tsx:20` + `src/app/onboarding/page.tsx:14` — both carry the
   anonymous `redirect("/login?from_url=…")` (R3 target) ✓; `src/app/demo/
   page.tsx` has NO session check (R4 target) ✓.
3. `src/components/dashboard/onboarding-dashboard.tsx:295-317` — the Try it
   button calls `generate({ mode: "topic", topic: "Economics" })` (R2c
   target) ✓; the setup panel's `space-y-6` block structure (lines 227-236)
   is where the name block inserts (between the h2/subtitle div and the
   `space-y-2` modes div) ✓.
4. `src/components/layout/app-header.tsx` — the desktop pills block
   (`hidden items-center gap-3 md:flex`) and the mobile panel's yellow name
   header are the two conditionals the `signedOut` variant skips; the
   Sign In pill geometry decodes from the live probe (9999px computed) ✓.
5. `src/components/dashboard/course-dashboard.tsx:295-394` — the challenge
   modal's overlay (`bg-black/75` + blur), the banner branch, and the
   Close button are all present (R5 targets); the icon constants
   (BOOK_ICON/TREND_ICON/SPARKLE_ICON, all h-5 w-5) + the SPARKLE modal
   header icon are the R6 targets; the streak letters (line ~624
   `text-black/40`) are the R7 target ✓.
6. `src/app/hub/page.tsx:44` — `const matched = course ?
   enrollments.find((e) => e.id === course) : undefined; const enrollment =
   matched ?? enrollments[0] ?? null` (R8 target: `matched ?? null` when the
   param was present) ✓.
7. E2E blast radius: `auth.spec.ts:10-14` (the anonymous-root redirect test)
   is the ONLY existing test that breaks (R10 rewrites it); every other
   /demo-touching spec (mobile-navigation, session4-parity, session7-parity)
   rides the authenticated storageState and survives the /demo gate
   unchanged; the seeded demo user (Economics + student.currentSubject
   "Economics") shows no visible h2 change — the R11a pin needs the fresh
   user + `PUT /api/student` (the session5-parity fresh-user pattern) ✓.
8. No Prisma schema changes, no new API routes, no new env vars — pages,
   components, one domain helper, CSS-adjacent inline styles, and tests ✓.

Execution order note: Phase 1 (red) → Phase 2 (public flow) → Phase 3
(challenge + icons) → Phase 4 (P2s) → unit green → build → Phase 5 e2e →
full gate → screenshots → docs → push.
