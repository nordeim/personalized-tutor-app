# AGENTS.md — Thinkerwell (Personalized Tutor App clone)

Single Next.js 16 App Router app that clones the reference AI-tutor app
`https://personalized-tutor-app.base44.app/` (Thinkerwell): a login route, an
onboarding/course dashboard at `/`, `/courses`, a `/quiz` diagnostic flow, the
`/hub` learning workspace (desktop three-pane, mobile bottom-tab shell), and a
guest `/demo`. Prisma/SQLite persistence, hand-rolled cookie auth, a Zustand-free
client (server components + fetch), and a server-side AI seam over
`z-ai-web-dev-sdk` with static fallbacks. Clone remote:
`https://github.com/nordeim/personalized-tutor-app.git`; pushes go to the SSH
remote via `docs/ssh_git_wrapper_v3.py`.

## Commands

| Task | Command |
|------|---------|
| Install | `bun install` (or `npm install`) |
| Dev server (port 3000) | `bun run dev` |
| Production build | `bun run build` |
| Production server | `bun run start` |
| Lint | `bun run lint` |
| Type check | `bun run typecheck` |
| Unit tests (179 checks) | `bun run test` |
| Browser E2E (91 checks; needs a build) | `bun run test:e2e` |
| Prisma client after schema change | `bunx prisma generate` |
| Recreate DB from schema | `bun run db:push` |
| Seed demo account | `bun run db:seed` |

**Gate order before every push:** `bun run lint` → `bun run typecheck` →
`bun run test` (179) → `bun run build` → `bun run test:e2e` (91 Playwright
checks — boots the standalone server on :3100 against its own `db/e2e.db`).
There is no hosted CI; the local gate is the only gate.
`next.config.ts` sets `ignoreBuildErrors` — the explicit `typecheck` step is
what catches type errors; never skip it.

First-run setup: `bun install && cp .env.example .env && bun run db:push &&
bun run db:seed && bun run dev`. Demo login: `demo@thinkerwell.app` /
`Demo1234!`.

## Architecture facts you would otherwise guess wrong

- **Every route is a real App Router route** (`/`, `/onboarding`, `/courses`,
  `/quiz`, `/hub`, `/demo`, `/login`) — no rewrites onto a single page, no
  client-side view switcher. Server components resolve the session and a
  serializable snapshot; the client components own interactivity.
- **`/onboarding` ALWAYS renders the setup state** (the Add-a-Course surface)
  — it never redirects away, even when the user already has courses. `/`
  shows the course dashboard only when the active course has a completed quiz
  or progress; otherwise the onboarding state.
- **"Add a Course" opens the in-page Q5 modal** (`add-course-modal.tsx`),
  never an `/onboarding` navigation: Build/Material mode cards, 6 quick tags
  (`ADD_COURSE_TAGS`, click sets topic `"Subject: Sub"`), Paste Text/Upload
  File tabs, submit ("Start Assessment") → `POST /api/courses/generate` →
  navigate `/quiz?course={id}`. On `/demo` (guest mode) the submit degrades
  to a sign-up toast + `/login?from_url=%2Fonboarding`.
- **THE mobile hamburger menu is its own component** (session-5 bundle
  decode — NOT the desktop m_ reused): items container `p-2` (no
  space-y), a "Switch Course" section when enrollments > 1 (label
  `text-[10px] font-light`, BookOpen rows, a Check on the CURRENT course,
  rows route to `/?course={id}`, divider `h-px bg-black/10 my-1`), My
  Courses, and Log Out — or **Sign In in guest mode**. There is NO Update
  Preferences on mobile; the header context line is the subject ALONE in
  `text-xs text-black/60`.
- **THE m_ name split:** the desktop m_ PANEL header renders the STUDENT's
  name (`e.name` in the bundle — the `PUT /api/student` save target, so the
  rename round-trips visibly) while the collapsed PILL renders the USER's
  name (`full_name`). The with-course panel header is `p-4`/`gap-3`/`w-10`
  avatar at `text-base`; the no-course panel is `p-3`/`gap-2.5`/`w-8` with
  `p-2` (no space-y) items.
- **THE source-predicate split (session-6):** `domain.ts` exports TWO
  distinct predicates and the split is intentional — `isCustomSource(s)`
  (`custom || material`) drives the p_ CoursePill icon and the m_ context
  line, while `courseSourceLabel(s)` (custom ONLY → "Custom Material",
  else "AI-Generated Course") drives the CO course-card label. The
  reference's bundle does exactly this; do not "consolidate" them (a
  "material" course shows the BookOpen pill icon but still labels
  AI-Generated). Pinned in `tests/domain-session6.test.ts`.
- **THE icon-stroke invariants (session-6):** the CO card's ChevronRight
  renders at lucide's default strokeWidth 2 (no explicit prop); the m_ user
  pill's chevron is CONDITIONAL — `student ? 2 : 1.5` (the live ships two
  trigger components); the /courses Add-a-Course tile's Plus is the
  lucide-canonical path (`M12 5v14`, never a `v19` variant) at strokeWidth 2.
  Trash2/subject icons stay at 1.5. Every one of these was decoded from the
  live DOM or bundle — check before "normalizing" stroke weights to one value.
- **Outside-click dismissal is ONE hook** (`src/components/layout/use-dismiss.ts`,
  session-6 extraction): every dropdown consumes `useDismissOnOutsideClick`
  with a memoized `onDismiss` (useCallback — the hook re-subscribes the
  document listener on identity change). CoursePill, UserMenu, the AppHeader
  mobile menu, AND the hub's course/help menus all use it; do not hand-roll
  another copy.
- **The with-course header is TWO dropdowns** (`app-header.tsx`): the
  bordered Course pill (p_) labeled `student.current_subject`, listing the
  OTHER courses (`course_name !== current_subject`) or "This is your only
  course", plus All Courses + Add a Course (opens Q5); and the m_ user menu
  (w-80, yellow header with the `"{subject} · Custom material|Default"`
  context line, Update Preferences → inline Name form → `PUT /api/student`,
  My Courses, Log Out — the email only shows with NO course). The hub keeps
  its own header: the span shows the CURRENT LESSON TITLE (not the course
  name) and its pill rows route to `/?course={id}` (the dashboard).
- **Unauthenticated `/` redirects to `/login?from_url=…`**, but `/login`
  renders its card for EVERY visitor (no auth redirect on the login route).
- **API envelope is `{ ok, data } | { ok, error: { code, message } }`** — build
  responses with `ok()` / `fail()` from `src/lib/api.ts`. All domain routes
  are session-gated (`requireSession()`).
- **Auth is hand-rolled** (`src/lib/auth.ts`): scrypt password hashes +
  HMAC-signed stateless cookie (`thinkerwell_session`, 7-day TTL), `secure`
  derived from the request protocol (`req.url` / `x-forwarded-proto`) —
  a hard requirement: production-on-plain-HTTP (the e2e boot) must still set
  cookies, or browsers drop them silently. No NextAuth, no middleware.
  Auth routes are rate-limited (10 attempts/IP/15 min, in-process).
- **The AI seam is server-only** (`src/lib/ai.ts`): every generator (roadmap,
  diagnostic quiz, lesson content, Nori chat, gap analysis, daily challenge)
  degrades to a static fallback when the SDK is unavailable — never let an AI
  outage break a flow. The fallback lesson/quiz shapes are validated the same
  way as LLM output (4 options, correctIndex 0-3).
- **THE dashboard progress model (session-3): QUIZ-DERIVED, not lesson-
  counted.** The reference's CourseEnrollment carries NO per-lesson progress;
  every dashboard/courses number derives from the diagnostic quiz:
  `quizProgressPercent(score, completed)` = `round(score/5×100)` (clamped at
  100 — the live prints >100% for scores above 5), `derivedLessonsCompleted`
  = `round(pct/100×6)`, roadmap stage = `floor(lessons/2)`. The `/demo`'s
  60%/4-lessons/3-days/750-XP IS this math on quiz 3 — `demoPercent` is GONE.
  The Hub keeps its own honest per-lesson tracking purely for the completion
  POST; no dashboard surface reads it.
- **THE lesson-title suffixes are PER STAGE:** the live's `Kh` expansion uses
  `[["Basics","In Practice"],["Fundamentals","Application"],
  ["Deep Dive","Mastery"]]` — NOT Basics/In Practice everywhere. Unit-pinned
  in `tests/domain.test.ts`.
- **THE lesson-view architecture (gO/yO/xO + Im, session-3):** the h2 shows
  the SUBJECT on level 1 but the AI `title` on levels 2/3; level 1 renders
  the yellow "Core Concept" card (question 0 ONLY), level 2 the tan
  "Real-World Scenario", level 3 the lilac "Final Boss Challenge"; every
  question carries a content card (video: 16:9 shimmer + play + "Example
  video — …" caption; text: the "Reading" card); options are a 2-column
  grid of tan `#E1C8B9` rounded-[14px] buttons (reveal: correct GREEN
  `#BCFCAF` + CircleCheckBig, wrong pick `#FFD0D0` + CircleX, others 40%);
  the submit button reads "Next Question" (ChevronRight, ml-auto, gray until
  a pick); timing = submit → 1000 ms reveal → 800 ms advance/retry.
- **THE hub sidebar is 3-STATE (qP):** rows BEFORE the active lesson are
  done (`#DCDCDC` + CircleCheckBig + "Lesson N · Done"), the active row is
  yellow (+ ChevronRight + "· Now"), rows AFTER are LOCKED (`#EBEBEB`,
  opacity .45, Lock icon, NOT clickable). The Lesson Progress card shows
  `{answered + 1}/8` from the SESSION's correct count (resets per lesson;
  the LessonView reports it via `onAnswered`) with the BookOpen icon.
- **The 3-level mastery grid lives in `src/lib/domain.ts`** (pure, unit
  tested): lesson index 0-5 → stage 0-2 × level 0-1; 8 questions per lesson;
  `parseRoadmap` is defensive (invalid JSON → `[]`); lesson titles derive
  with the per-stage suffix pairs and the default grid fallback
  (Introduction / Key Concepts / … / Mastery Check).
- **Tailwind 4 is CSS-first** — no `tailwind.config.js`. Tokens live in
  `src/app/globals.css` `@theme` as FULL hex colors (never bare HSL
  triplets), the v3 slate hexes are pinned (v4's oklch drifts), and
  `--shadow-sm` is pinned to the v3 geometry. Circular radii use
  `rounded-[9999px]` — v4's `rounded-full` compiles to
  `calc(Infinity*1px)` = 33554400px in computed styles while the v3
  reference computes 9999px (session-5: the sweep is complete; keep it).
  See `docs/Tailwind-V4-Validation-Report.md` for the full trap log —
  read it before touching styles.
- **THE radius + blur scale pins (session-7):** the reference's custom v3
  config maps `rounded-lg` AND `rounded-xl` to **12px** (measured on every
  live instance) — v4 ships lg=8px/xl=14px, so `globals.css` pins
  `--radius-lg`/`--radius-xl: 0.75rem` (Trap 6). `--blur-sm: 4px` restores
  the v3 geometry for the login card's `backdrop-blur-sm` (Trap 7 — v4
  doubles it to 8px). Never "simplify" these pins: 41 radius usages + the
  login card ride on them. The 14px surfaces (quiz options, Next-Question)
  are `rounded-[14px]` ARBITRARY on both sides — NOT rounded-xl.
- **THE body base weight is 300 (session-7):** the live's app-wide default
  is font-light — `body { font-weight: 300 }` in globals.css. Every text
  node without an explicit `font-*` class inherits it (mode-card
  descriptions, category tags, "N/6 lessons completed"). Do not "normalize"
  it to 400; audit weight drift with a leaf-text font-weight histogram
  (computed styles are the ground truth, class strings are the
  approximation).
- **THE Course-Lessons icon column (session-7):** the dashboard's lesson
  rows carry lucide status icons — `CircleCheckBig` (done, text-black),
  `Circle` (next, text-black), `Circle` (later, text-black/40) at w-4 h-4
  sw 1.5 — NEVER numbered circles (that was the session-1 scaffold). The
  row states derive from `lessonRowStatus(i, derivedLessonsCompleted(pct))`
  in `domain.ts` (pinned in `tests/domain-session7.test.ts`).
- **THE mobile-nav rule:** the toast layer (`src/components/toast.tsx`)
  renders the Sonner-compatible container as `pointer-events-none` with
  toast items `pointer-events-auto`. The live reference ships this broken
  (empty container covers the hamburger button; Playwright refuses the
  click). `tests/e2e/mobile-navigation.spec.ts` pins the fix — do not
  remove the pointer-events rules in `globals.css`/`toast.tsx`.
- **THE public-surface model (session-8):** anonymous `/` and `/onboarding`
  render the PUBLIC ONBOARDING (the live's landing surface — no login
  redirect): the AppHeader `signedOut` variant (desktop black **Sign In
  pill** — DESKTOP-ONLY, inside the `hidden md:flex` container, live-
  verified at 390px; mobile items-only menu: My Courses + Sign In, NO
  yellow name header), the "Your Name" block in the setup panel
  (anonymous-only — required for Continue; authenticated users never see
  it), and the deferred setup: Continue stores `pending_student_setup`
  (sessionStorage, the live's key) then routes
  `/login?from_url=<current>`; after login the onboarding picks it up and
  AUTO-SUBMITS through `/api/courses/generate` → `/quiz` (the live's X2:
  create student → `navigate("/quiz")`; the account name wins —
  `full_name || pending.name`). `/demo`, `/hub`, `/quiz`, `/courses`
  remain auth-gated (`/demo` TOO — the live registers it under the auth
  guard; anonymous → `/login?from_url=%2Fdemo`). The Sign In pill's
  from_url (session-9 S9-F2 + session-10 S10-F1): the live's `Ha` pill calls
  `navigateToLogin()` = `redirectToLogin(window.location.href)` — the
  current URL's path AND QUERY ride on BOTH the desktop pill and the
  mobile item (verified live: the pill at `/?q=parity` routes to
  `login?from_url=%2F%3Fq%3Dparity`). All three client writers go through
  ONE pure helper — `loginRedirectUrl(pathname, search)` in `domain.ts` —
  and the login page consumes from_url via `sameOriginRedirectTarget`
  (same-origin absolute urls decode to path+search; foreign origins and
  `//` collapse to `/` — the open-redirect FIX for a contract the live
  ships as a vulnerability). The server-side auth guards stay path-only
  (they match the live's platform guard).
- **THE Try-it invariant (session-8):** "Try it Sample: Economics Course"
  NAVIGATES TO `/demo` — it never generates a course (the live's X2:
  `onTryIt: () => navigate("/demo")`; the is_sample pending path in the
  bundle is dead code — no writer). Do not "restore" a sample-generation
  flow.
- **THE hub h2 subject invariant (session-8):** the LessonView h2 on level
  1 = `hubLessonSubject(course)` = the STUDENT's `current_subject ||
  "General"` (the live's `ce`), NEVER the active course name — a student
  whose current_subject differs from the viewed course still sees the
  student's subject. Unit-pinned in `tests/domain-session8.test.ts`;
  behavioral pin in `tests/e2e/session8-parity.spec.ts`. An unowned
  `?course=` renders the hub with NO course (the default grid —
  `matched ?? null` when the param was present).
- **THE Lesson Progress label is UNCLAMPED (session-9):** the sidebar's
  yellow card computes the live's qP formula `{answered + 1}/8` with NO
  clamp — at the completing 8th correct it renders **"9/8"** (observed on
  the live through the Level-Up interstitial; the session-9 drive
  confirmed it). `lessonProgressLabel`/`lessonProgressPct` live in
  `domain.ts`, unit-pinned in `tests/domain-session9.test.ts` — do NOT
  reintroduce a `Math.min` clamp; the over-8 label is the reference's own
  arithmetic.
- **THE hub level machinery, decoded (session-9):** the live's sidebar
  `activeLessonIndex` is NEVER written after mount (the setter is only
  called in the course-change reset; locked rows are unclickable; the qP's
  `activeLevel`/`levelingUp` props are DEAD), so the live's hub
  DEAD-ENDS after lesson 1's completion (observed stuck at "8/8 correct"
  behind the interstitial). The clone's advancing 6-lesson flow is the
  DOCUMENTED FIX (the "where the reference ships a bug the clone fixes it
  AND pins the fix" doctrine) — the level-up fires when the LEVEL changes
  (lessons 1|3), the final lesson completes the course. The lesson-view
  h2 = the SUBJECT on level 1, the GENERATED title on levels 2/3
  (`meta.title` in the live's yO/xO decode); the level-2 tan
  Real-World Scenario + level-3 lilac Final Boss context cards render
  CONDITIONALLY on the generated scenario/challenge being non-empty —
  e2e-pinned via the `?lesson=2`/`?lesson=4` params in
  `tests/e2e/session9-parity.spec.ts` (the param drives the initial
  lesson directly; the sidebar lock only gates row clicks).
- **THE dashboard card icons pin the LIVE's lucide 0.475 paths
  (session-9):** BookOpen AND Trophy were REDESIGNED upstream between the
  live's lucide-react 0.475 and the clone's 0.525 (0.475 BookOpen
  `M2 3h6…` vs 0.525 `M12 7v14…`), so `course-dashboard.tsx` renders
  ONE parameterized local component per shape (BookOpenIcon /
  TrophyIcon / BrainIcon / SparklesIcon — the paths verbatim from the
  live probe) instead of lucide imports. Do NOT swap them for
  `lucide-react` imports without re-probing the live's paths — the
  session-8 e2e icon pins assert the `d` prefixes.
- **THE Nori chat bubble split (session-10, S10-F2):** the USER bubble is
  BLACK `#0F0E0E` with WHITE text (radius 16/16/4 — bottom-RIGHT tail;
  browsers serialize the 4-value form to the identical 3-value string the
  live computes), while the ASSISTANT bubble is gray `#F0F0F0` with dark
  text (16/16/16/4 — bottom-left tail) — same classes on both
  (`max-w-[80%] px-3.5 py-2.5 text-sm font-light leading-relaxed`). The
  clone's earlier yellow user bubble was a session-1 invention;
  computed-style-pinned in `tests/e2e/session10-parity.spec.ts`. The send
  button is `w-7 h-7 rounded-lg` black with lucide's **Send** paper plane
  at `w-3.5 h-3.5` sw 1.5 (S10-F3 — paths verified IDENTICAL across the
  live's 0.475 and the clone's 0.525, so the named import is safe — the
  ONE icon where that's true; the arrow-up it replaced was drift). The
  live's demo-course chat is EPHEMERAL across reloads; the clone persists
  ChatMessage rows — a documented divergence (the clone's DB makes it
  possible; the README declares it a feature).
- **THE hub header invariants (session-10):** the hub's back-links carry
  the CURRENT course — the desktop logo AND the mobile "Dashboard" link
  both href `/?course={id}` (S10-F4; a bare `/` would land on the FIRST
  enrollment). The hub's "?" menu is the m_ panel instantiated with NO
  user: the yellow `p-3` header renders the literal "?" avatar and EMPTY
  name/email lines (S10-F5 — the live's own output; do not "helpfully"
  fill in the user's identity), and the My Courses row's icon is
  **LayoutGrid** sw 1.5 (S10-F6 — the same icon as every other My Courses
  row in the app), never List.
- **THE onboarding thresholds live in ONE predicate (session-10, S10-F7):**
  `onboardingInputsValid({mode, topic, courseName, contentText})` in
  `domain.ts` (unit-pinned) — consumed by BOTH the Continue gate and the
  pending-setup pickup. The component maps its `materialText` state onto
  `contentText`; do not re-inline the ≥2/≥2/≥20 literals.
- **THE diagnostic quiz is the E3 port (session-11, S11-F1):** FIVE
  questions, not seven (the live's prompt: "exactly 5… 2 easy, 2 medium,
  1 harder… max 20 words" with a material-context preamble for custom
  courses — `generateDiagnosticQuiz(subject, material?)`). The surface:
  the Ha-with-children header (`{subject} · Knowledge Assessment` + the X
  close button REPLACING the desktop user menu — AppHeader's
  `headerChildren` prop; mobile keeps the standard hamburger), the star
  progress row (`h-1` track `#4A4A4A` + `#FFFD73` fill at
  `quizMarkerPct(current, total)` — the CURRENT question counts, no
  reveal bump — with the 42px `/quiz-star.svg` riding the fill edge and
  the `#C0C0C0` counter), the lilac `#D2C0F9` `w-9` `rounded-[10px]`
  number tile, TAN `#E1C8B9` `rounded-[14px] p-4` options with inline
  `A.`-`font-medium` prefixes (NO letter circles; picked = border
  `#0F0E0E`, revealed correct `#BCFCAF` + CircleCheckBig, wrong-pick
  `#FFD0D0` + CircleX, others opacity .4), NO feedback-text row, the
  `ml-auto px-5 py-2.5 rounded-[14px]` action buttons ("Confirm" →
  "Next Question" / "Submit Assessment" + ChevronRight), the dot strip
  (24px/6px, `#FFFD73`/`#C0C0C0`/`#4A4A4A`), the fixed "Skip quiz →" pill
  (`#2A2A2A`/`#C0C0C0`), and the dark W overlays ("Preparing your
  assessment…" / "Analyzing your results…" / "Preparing your course…")
  on `#0F0E0E` with the mascot + `#C0C0C0` text.
- **THE quiz score is CLIENT-computed (session-11, S11-F2):** the live's
  E3 counts the CORRECT picks (`diagnosticScore(picked, correct)` in
  `domain.ts`, unit-pinned) and the API stores the payload's validated
  score — the server NEVER re-derives it from the answered count (the
  session-1 derivation scored every answered question correct → a
  completed quiz always scored 100%).
- **THE / route model (session-11, S11-F3):** the with-course dashboard
  renders whenever the enrollment EXISTS (the live's $P resolver → G5
  unconditionally; quiz-incomplete → the 0% state). The onboarding renders
  only with NO enrollment. The quiz Skip (`POST /api/quiz/skip` — the
  enrollment reset + `/?course=` navigation) and the X close both land on
  the 0% dashboard. The live's skip ALSO fires an LLM roadmap call it
  discards — the clone skips the wasted call (the fix-and-pin doctrine).
- **THE quiz submit upserts the DiagnosticQuiz (session-11, S11-F6):**
  find by (user, subject) → update | create — retakes no longer
  accumulate rows. The gap-analysis prompt is the live's named/pct-aware
  shape; the submit-time roadmap prompt carries the pct.
- **THE dashboard confetti is the c_ port (session-12, S12-F2; corrected
  session-13 S13-F2/F3):** the diagnostic quiz (E3) fires NO confetti —
  the decoded triggers live on the DASHBOARD, ported into the UNKEYED
  shell (`dashboard-app.tsx`, not the keyed CourseDashboard — the keyed
  child remounts when the active course's key changes on a same-route
  course switch, while the live's unkeyed c_ keeps its refs): (a) the
  streak burst — 80 particles, spread 55, origin
  {x:.85,y:.4}, `#FFFD73/#C8AEFF/#0F0E0E` — when `min(quizScore,7)`
  crosses EXACTLY 3 or 7 upward (`confettiAt`'s exact-equality semantics,
  unit-pinned); (b) the label burst — 90 particles, spread 60, origin
  {x:.85,y:.3} — when the mastery tier changes
  (`masteryLabelTier(scorePercent)`: Novice 0 / Apprentice 20 / Learner
  40 / Scholar 60 / Expert 80 / Master 100 — the label NEVER renders;
  it exists for the trigger, like the live). The shell derives
  `activeCourse` from the `currentCourseId` PROP (S13-F2 — the
  session-8 `viewCourseId` state was frozen at mount, so same-route
  switches rendered stale content and the triggers never fired on them);
  the firing surface is BOTH the same-route course switch (re-render
  with fresh props — the shell does NOT remount) AND `router.refresh()`
  (the live's is Base44's reactive entities); e2e-pinned via the m_
  rename-driven refresh (session-12) and the course-switch drives
  (session-13).
- **THE material gate is the BROAD predicate (session-12, S12-F1):** the
  quiz-flow material context (the diagnostic preamble, the "Custom
  Material" roadmap subject, the "based on their uploaded material" gap
  analysis) feeds from `enrollmentMaterial(source, text)` —
  `isCustomSource(source) && text.trim()` (custom‖material). The
  session-11 `=== "custom"` gate was DEAD CODE (no clone writer emits
  "custom"; they emit "topic"|"material"), so the S11-F4 prompts never
  fired for material courses. Unit-pinned in
  `tests/domain-session12.test.ts`.
- **THE roadmap prompts are THREE shapes (session-12, S12-F4):**
  generate-time (G5/onboarding — "Create exactly 3 progressive learning
  stages for the course…", course name only) vs submit-time (E3,
  pct-aware "focus areas… one per arena level", material-aware) — the
  session-11 port had collapsed both onto the submit wording. The LLM
  answers the `{"steps":[…]}` OBJECT (response_json_schema) —
  `generateCourseStages` parses the wrapper AND the bare array. The
  "Enter The Hub" trailing icon is ChevronRight at lucide default sw 2
  (`m9 18 6-6-6-6`), never ArrowRight; the submit route 422s on
  present-but-invalid score/answers (a MISSING score still degrades to
  0).
- **THE same-route course switch derives from the PROP (session-13,
  S13-F2):** `dashboard-app.tsx` computes `activeCourse` from the
  URL-resolved `currentCourseId` PROP — never from client state. The
  session-8 `viewCourseId` `useState` was FROZEN at mount (its setter
  had no caller), so the pill rows' `router.push("/?course=" + id)`
  re-rendered the shell with fresh props while `activeCourse` kept
  resolving the mount-time course — the dashboard rendered STALE
  content on every same-route switch (empirically: the pre-switch
  course's streak/XP persisted until a full reload). The mechanism: a
  same-route App Router navigation does NOT remount the shell (same
  type, same tree position) — the props re-render in place; the KEYED
  `CourseDashboard` remounts on the `key` change (the content swap).
  e2e-pinned by the course-switch content/burst drives in
  `tests/e2e/session13-parity.spec.ts`.
- **THE roadmap data contract is DUAL-SHAPE (session-13, S13-F5):** the
  live's generate-time prompt asks for `{title, description}` OBJECTS
  while the submit-time prompt asks for a STRING array
  (`"steps": ["Step 1: …"]` — its response_json_schema), and BOTH
  writes persist whatever the LLM answered verbatim. The clone's
  `generateCourseStages` mirrors both schemas (the pct branch requests
  strings; the no-pct branch requests objects — each branch's verbatim
  tail) and validates both shapes; `parseRoadmap` maps both (strings:
  strip `/^(Lesson|Step)\s*\d+/`, split `" — "` else `": "` when
  < 40 chars, else whole-string+empty — the live's Kh/roadmap-card
  semantics). Unit-pinned in `tests/ai-seam.test.ts` +
  `tests/domain-session13.test.ts`.
- **THE wrapper parser array-checks `steps` (session-13, S13-F1):**
  `generateCourseStages` must `Array.isArray(parsed?.steps)` before
  trusting it — a lazy string reply (`{"steps": "Foundation, …"}`)
  passes `.length >= 3` (the string's own length) and then crashes
  `.every` → a 500 from the route, violating the "AI may degrade,
  never fail" invariant. The quiz parser already did this; the stages
  parser now mirrors it. Unit-pinned (the exact crash shape).
- **THE prompt-split pins are VERBATIM and transport-captured
  (session-14, S14-F1):** `tests/ai-seam.test.ts`'s mock records the
  REQUEST (`completions.create(req)` receives `req.messages` — the user
  prompt last), so the two roadmap prompt tails are asserted VERBATIM:
  the generate-time object tail (`…"description": "2-3 sentence
  description." }] }` + the `Create exactly 3 progressive learning
  stages` wording) vs the submit-time string-array tail (`["Step 1:
  ...", …] }` + the `Based on someone scoring {pct}%` wording, with the
  material-aware subject swap pinned too), plus bidirectional negatives
  (each branch must NOT carry the other's schema). The session-13
  version was a vacuous `expect(true).toBe(true)` — a mock that closes
  over a `vi.hoisted` holder can always capture what it receives; a test
  named for a contract it never observes pins nothing.
- **THE submit route validates FIRST, derives after (session-14,
  S14-F2):** every present-but-invalid payload check (answers/score/
  total) runs BEFORE the enrollment lookup; the derivations read only
  validated input (`total` = the validated number or `answers.length ||
  5`; `score` = the validated number or 0). The 422 status matrix is
  byte-identical to the session-13 layout for every pinned input class —
  the e2e 422 family carries it.
- **THE confetti drives are ISOLATED (session-14, S14-F6):** the
  2→3 streak drive crosses BOTH the exact-3 boundary AND the
  Learner→Scholar tier change — either preset could produce its canvas
  (canvas-confetti renders onto ONE shared global canvas, so a count
  cannot discriminate). The isolation drive: scores 6 and 7 (total 7) —
  `quizProgressPercent` clamps 120/140 → 100 → tier Master→Master (the
  label burst CANNOT fire) while streak 6→7 crosses EXACTLY 7 → the
  80-particle burst is the ONLY possible firing effect (e2e-pinned +
  pixel-verified: 1,383 burst-particle pixels vs a direct-mount
  baseline).
- **THE daily-challenge modal (session-8):** overlay `rgba(0,0,0,0.5)` via
  INLINE style (Trap 8 — v4's bg-black/50 computes oklab), NO backdrop
  blur, and NO result banner — after the reveal the SAME button slot swaps
  "Submit Answer" → "Close" (`w-full py-3 rounded-[12px] bg-black
  text-white text-sm font-semibold hover:bg-gray-800`). The reveal colors
  carry the feedback: correct #FFFD73, wrong-pick #FFD0D0, others #DCDCDC.
- **THE dashboard card icons (session-8):** Subject = BookOpen h-6 w-6,
  Course Progress = **Trophy** h-6 w-6, Daily Challenge = **Brain** h-6 w-6,
  Learning Roadmap = Sparkles h-6 w-6, Course Lessons header = BookOpen
  h-4 w-4, challenge-modal header = Brain h-5 w-5 (all lucide sw 1.5).
  Study Streak = CalendarDays w-4 + Total XP = Gem w-4 (already exact).
  Icon identity was probed from the live's path `d` data — check before
  "normalizing" (the session-2 TrendingUp/Sparkles picks were drifts).
- **THE quiz-flow rules (ported from the reference bundle):** a correct
  answer resolves after a **1000 ms reveal** then **auto-advances after
  800 ms**; a wrong answer opens the in-pane retry modal after the same
  1800 ms ("Retry later" re-queues the question at the end, "Skip it" just
  advances); a lesson completes at 8 correct. Completing a stage-boundary
  lesson (index 1 or 3) shows the in-pane "Level Up!" interstitial
  (1200 ms → burst → 800 ms → auto-advance); the final lesson fires dual
  confetti cannons. The presets live in `src/lib/confetti.ts`; the trigger
  math (`confettiAt` 3/7 crossing, `requeueQuestion`) lives in
  `src/lib/domain.ts` and is unit-pinned.
- **THE content pool:** `src/lib/quotes.ts` ships the reference's exact
  99-line pool (49 authored quotes + 50 encouragements, order preserved).
  The dashboard bubble picks a random line per page load — the pick happens
  SERVER-side (`page.tsx` / `demo/page.tsx` → `bubbleQuote` prop) so it is
  hydration-safe. `encouragementFor(n)` cycles the pool deterministically.
  Regenerate only with `scripts/extract-live-quotes.mjs` +
  `scripts/generate-quotes-ts.mjs`; `tests/parity-session2.test.ts` pins it.
- **Design tokens (measured off the live app):** app gutter `#0F0E0E`,
  yellow `#FFFD73` (header, accent cards, active states), paper `#F8F8F8`,
  purple `#C8AEFF` (setup panel), lilac `#D2C0F9` (hub sidebar), bubble
  `#EBE2FF`, tan `#E1C8B9` (Enter The Hub), secondary text `#595959`
  (font-light). Cards `rounded-[20px]` with `gap-[4px] px-[4px]` gutters.
  Fonts: Funnel Sans (UI) + Eczar (brand) via Google Fonts `<link>` in the
  root layout (the `no-page-custom-font` warning is a Pages Router false
  positive — suppressed with a justification comment).
- **The `/demo` route is an auth-gated sample mirror** (session-8: the live
  registers /demo under the auth guard — anonymous visitors bounce to
  `/login?from_url=%2Fdemo`) with the reference's
  sample data — quiz 3/7, which flows through the same quiz-derived math to
  produce the live's exact 60% / 4/6 lessons / 3-day streak / 750 XP. Do not
  "fix" either side.
- **Mascots are static SVGs in `public/`** (extracted from the live app;
  their CSS keyframes animate inside `<img>`). Use the wrappers in
  `src/components/mascot.tsx` — never inline the 10 KB SVGs.
- **SQLite path normalization:** import `db` from `@/lib/db`, never construct
  `PrismaClient` directly. Relative `file:` URLs resolve against
  `prisma/schema.prisma` (the tested `src/lib/db-path.ts` seam). NOTE: a
  `DATABASE_URL` exported in your shell OVERRIDES `.env` (dotenv precedence)
  — check `echo $DATABASE_URL` if the app opens an unexpected file.
- **Standalone server must start from the project root**
  (`output: "standalone"`; `outputFileTracingRoot` pinned in
  `next.config.ts`, which also carries `allowedDevOrigins` — Next 16's
  dev-origin protection blocks dev chunks for non-localhost origins).

## Conventions that differ from defaults

- **Server components resolve state; client components mutate.** Pages are
  `force-dynamic` and pass ONE serializable snapshot to a single client
  shell per route (no prop drilling, no client stores).
- **Playwright strict mode pitfall:** the Hub renders desktop AND mobile
  instances of NoriChat/LessonView in one DOM (hidden by CSS, still
  locatable). Use `.last()` for the mobile instance / `.first()` for
  desktop in specs — `tests/e2e/mobile-navigation.spec.ts` documents the
  DOM order.
- **Schema changes use `db push`, not migrations** (no `prisma/migrations/`).
  `bun run db:seed` is idempotent — it wipes and reseeds domain tables.
- **Commit style:** Conventional Commits, atomic units, never commit
  secrets. The e2e `.auth/` state and `db/*.db` are git-ignored.
- **Pushes go through `docs/ssh_git_wrapper_v3.py`** (never a plain
  `git push` — the wrapper materializes the deploy key outside the repo,
  verifies the remote ref, and shreds the key). Runbook:
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.
