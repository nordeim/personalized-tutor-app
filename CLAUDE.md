---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs
version: 1.0.0
framework_version: "16.1"
last_updated: 2026-10-02
---

# Thinkerwell — Personalized Tutor App Clone

Self-hosted clone of the base44 Personalized Tutor App ("Thinkerwell"): an AI
tutor that builds personalized learning paths with the Socratic method.
Multi-route Next.js App Router app with cookie-session auth, Prisma/SQLite
persistence, a typed JSON API, and a server-side AI seam with deterministic
fallbacks.

**Tech Stack**: Next.js 16.1 (App Router, standalone output), React 19,
TypeScript 5 (strict), Tailwind CSS 4 (CSS-first, no config file), Prisma 6 +
SQLite, z-ai-web-dev-sdk (server-side LLM), Vitest 5 (unit), Playwright (e2e),
lucide-react.

## Core Identity & Purpose

Thinkerwell is a faithful functional clone of the reference tutoring app,
rebuilt as one deployable Next.js unit. The domain is deliberately small:
User → Student profile → CourseEnrollments (each carrying a 3-stage roadmap
JSON) → DiagnosticQuiz → per-lesson LessonProgress → ChatMessage history with
Nori, the Socratic tutor. The product promise: tell it what you want to learn
(or paste your own material), take a 5-question diagnostic quiz, receive a
gap analysis plus a 3-stage roadmap, then work through 6 lessons (2 per
stage, 8 questions each) inside the Hub while chatting with Nori.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — Read the route page, its client shell, and the API handlers
   you are touching. Server components own the session + snapshot; client
   components own interactivity. Changes ripple through the API envelope.
2. **PLAN** — Map the change across the four layers it will touch: schema
   (`prisma/schema.prisma`) → route handler (`src/app/api/…`) → pure domain
   logic (`src/lib/domain.ts` / `src/lib/ai.ts`) → client component.
3. **VALIDATE** — Confirm the plan preserves the `{ ok, data }` envelope and
   the AI-fallback guarantee before coding. Pure logic goes in `src/lib/*.ts`
   with a Vitest test — write the failing test first.
4. **IMPLEMENT** — One layer at a time; keep `bun run build` green between
   layers.
5. **VERIFY** — Run the full gate: `bun run lint && bun run typecheck &&
   bun run test && bun run build && bun run test:e2e` (182 unit + 91 Playwright
   checks required — run the e2e in per-spec chunks under a 10-minute
   command budget; kill any orphaned `standalone/server.js` on :3100 first).
6. **DELIVER** — Conventional Commit on `main`, push via the SSH wrapper
   runbook (`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).

### Project-Specific Principles

- **Every route is real.** `/`, `/onboarding`, `/courses`, `/quiz`, `/hub`,
  `/demo`, `/login` are distinct App Router folders — no SPA rewrites, no
  client router module. `/onboarding` always renders the setup state (it is
  the Add-a-Course surface); `/` renders the course dashboard only when the
  active course has a completed quiz or progress.
- **The AI features may degrade, never fail.** Roadmap generation, the
  diagnostic quiz, lesson content, Nori chat, gap analysis, and the daily
  challenge all fall back to deterministic static content
  (`src/lib/ai.ts` fallbacks). LLM output AND fallbacks pass the same shape
  validation (4 options, correctIndex 0-3, ≥3 stages) — preserve that
  guarantee when touching them.
- **Server components resolve, client components mutate.** Every page is
  `force-dynamic`, resolves the session server-side, and hands ONE
  serializable snapshot to a single client shell. No client stores, no
  React Query — mutations call the API then `router.refresh()` or local
  state updates.
- **Test at the pure seams.** The mastery grid (`lessonMeta`, `stageStatus`,
  `masteryLevel`), roadmap parsing (`parseRoadmap`), lesson title derivation,
  progress math, quote rotation, db-path resolution, and AI JSON extraction
  live in `src/lib/*.ts` with Vitest specs — TDD (red → green) is the default
  for changes there.
- **Auth endpoints are rate-limited; auth navigation uses router flows.**
  10 attempts/IP/15 min on login + register (`429 RATE_LIMITED` +
  `Retry-After`). Login success and Log Out navigate via `router.push()` +
  `router.refresh()` — never `window.location` assignments (ESLint flags
  them). "Continue with Google" renders for parity but degrades to an
  explanatory notice — no OAuth credentials in a self-hosted clone
  (documented deviation).
- **The cookie `secure` flag is protocol-derived, never env-guessed.**
  `createSession(userId, req?)` inspects `req.url` then
  `x-forwarded-proto`; plain-HTTP production boots (the e2e server) MUST
  still set cookies. Regressing this silently breaks every authenticated
  e2e test — the bug class that cost a full debug cycle.
- **THE source-predicate split (session-6):** `isCustomSource(s)` (custom‖
  material — the p_ icon + m_ context line) and `courseSourceLabel(s)` (custom
  ONLY — the CO card label) are intentionally different predicates; the
  reference's bundle ships exactly this split. A "material" course shows the
  BookOpen pill icon but still labels "AI-Generated Course". Pinned in
  `tests/domain-session6.test.ts` — do not consolidate.
- **THE radius/blur/body-weight invariants (session-7):** the reference's
  custom scale maps `rounded-lg` AND `rounded-xl` to **12px** (v4 ships
  8/14px — pinned `--radius-lg`/`--radius-xl: 0.75rem`, Trap 6);
  `--blur-sm: 4px` restores the login card's v3 backdrop blur (Trap 7);
  and `body { font-weight: 300 }` — the live's app-wide font-light default
  inherited by every weight-less text node. The dashboard's Course-Lessons
  rows carry lucide status icons (CircleCheckBig done / Circle next /
  Circle later at /40 — never numbered circles), derived from
  `lessonRowStatus` (pinned in `tests/domain-session7.test.ts`).
- **THE icon-stroke invariants (session-6):** CO-card ChevronRight at
  lucide default strokeWidth 2; the m_ pill chevron is conditional
  (`student ? 2 : 1.5` — the live ships two trigger components); the
  /courses Add tile's Plus is the canonical `M12 5v14` at sw 2; Trash2 +
  subject icons stay 1.5. All decoded from live DOM/bundle — do not
  "normalize" stroke weights blindly.
- **Outside-click dismissal is ONE shared hook**
  (`src/components/layout/use-dismiss.ts`, session-6): CoursePill,
  UserMenu, AppHeader-mobile AND the hub's course/help menus consume
  `useDismissOnOutsideClick` with useCallback-memoized callbacks (the hook
  re-subscribes the document listener on identity change). Never hand-roll
  another copy.
- **THE mobile-menu invariant (session-5):** the hamburger dropdown is a
  SEPARATE component from the desktop m_ — decoded straight from the
  reference bundle: items `p-2` (no space-y), a "Switch Course" section
  when enrollments > 1 (BookOpen rows + a Check on the current course,
  rows route to `/?course={id}`), My Courses, Log Out — or **Sign In** in
  guest mode (and for the anonymous public onboarding — items-only, no
  yellow name header). NO Update Preferences on mobile; the header context
  line is the subject alone in `text-black/60`.
- **THE public-surface model (session-8):** anonymous `/` + `/onboarding`
  render the PUBLIC ONBOARDING (Sign In pill, items-only mobile menu,
  "Your Name" block, `pending_student_setup` deferral → login → the
  post-login pickup auto-generates → `/quiz`). `/demo` is auth-gated like
  `/hub` `/quiz` `/courses` (the live registers them all under the auth
  guard). "Try it Sample: Economics Course" NAVIGATES to `/demo` — never a
  course generation (the live's `onTryIt: navigate("/demo")`; the
  is_sample pending path is dead code).
- **THE hub h2 + challenge-modal + card-icon invariants (session-8):** the
  LessonView h2 on level 1 = the STUDENT's `current_subject || "General"`
  (`hubLessonSubject`, unit-pinned) — NEVER the active course name; an
  unowned `?course=` renders the default-grid hub. The challenge modal:
  inline `rgba(0,0,0,0.5)` overlay (Trap 8), NO blur, NO result banner —
  the Submit button swaps in place to "Close" after the reveal. The card
  icons: Trophy/Brain/BookOpen/Sparkles at h-6 w-6 (stats + roadmap),
  BookOpen h-4 w-4 (Course Lessons), Brain h-5 w-5 (modal header) — probed
  from the live's path `d` data.
- **THE m_ name split (session-5):** the desktop m_ panel header renders
  the STUDENT's name (the `PUT /api/student` target — renames round-trip
  visibly) while the collapsed pill renders the USER's name; with-course
  panel = `p-4`/`gap-3`/`w-10` avatar at `text-base`, no-course panel =
  `p-3`/`gap-2.5`/`w-8` with plain `p-2` items.
- **THE session-9 invariants:** the Hub's Lesson Progress label is
  UNCLAMPED (`lessonProgressLabel(answered)` = `{answered + 1}/8` — 8
  correct renders "9/8", the live's observed terminal value; unit-pinned,
  never reintroduce a Math.min clamp); the desktop anonymous Sign In pill
  carries `from_url` (the live's `navigateToLogin` =
  `redirectToLogin(window.location.href)`); the live's hub lesson-advance
  machinery is dead code (the sidebar's activeLessonIndex is never written
  after mount — the live dead-ends after lesson 1; the clone's advancing
  flow is the pinned fix); the level-2/3 context cards (tan Real-World
  Scenario / lilac Final Boss) render conditionally on the generated
  scenario/challenge and are e2e-pinned via `?lesson=2|4`; the dashboard
  card icons pin the LIVE's lucide 0.475 paths as parameterized local
  components (BookOpen/Trophy were REDESIGNED by lucide 0.525 — do not
  swap for lucide imports without re-probing).
- **THE session-10 invariants:** the client-side from_url contract carries
  the path AND the query (the live's `navigateToLogin` = full
  `window.location.href`) through ONE pure helper
  (`loginRedirectUrl(pathname, search)` in domain.ts — all three writers:
  desktop pill, mobile item, onboarding deferral), while the login page
  consumes it via `sameOriginRedirectTarget` (same-origin absolutes
  decode; foreign origins + `//` collapse to `/` — the open-redirect FIX
  the live ships as a vulnerability; both unit- AND e2e-pinned, including
  the query-carrying round-trip). The Nori chat USER bubble is BLACK
  `#0F0E0E` + WHITE text (radius 16/16/4) — the assistant bubble stays
  gray — and the send button is lucide's Send paper plane at w-3.5 h-3.5
  sw 1.5 (paths identical across lucide versions — the ONE safe import).
  The hub's back-links carry `?course={id}` (desktop logo + mobile
  Dashboard link); the hub's "?" menu renders the empty-name m_ header
  (the "?" avatar + empty lines) with a LayoutGrid My Courses icon. The
  onboarding 2/2/20 thresholds live in ONE domain predicate
  (`onboardingInputsValid`). The live's demo-course chat is ephemeral
  across reloads; the clone's persistence is the documented divergence.
- **THE session-11 invariants (the diagnostic-quiz E3 port):** the quiz
  asks FIVE questions (the live's "exactly 5" prompt with the material
  context for custom courses), and the surface is the decoded E3 — the
  Ha-with-children header ("{subject} · Knowledge Assessment" + the X
  close REPLACING the desktop user menu; AppHeader's `headerChildren`
  prop), the star progress row (#4A4A4A track + #FFFD73 fill at
  `quizMarkerPct` + the 42px /quiz-star.svg + the #C0C0C0 counter), the
  lilac number tile, TAN #E1C8B9 options with inline A. prefixes and the
  border-picked reveal colors (#BCFCAF/#FFD0D0/0.4), the Confirm → Next
  Question/Submit Assessment buttons, the dot strip, the "Skip quiz →"
  pill, and the dark W overlays. The score is the CLIENT-computed correct
  count (`diagnosticScore` — unit-pinned; the API stores the validated
  payload score, never re-derives it). The / route renders the course
  dashboard whenever an enrollment EXISTS (the $P model — the skip/close
  paths land on the 0% dashboard; `POST /api/quiz/skip` resets the
  enrollment). The submit upserts the DiagnosticQuiz by (user, subject).
  The login page's origin construction is the pinned `headerOrigin`
  helper (comma-list proto normalization + localhost http heuristic).
- **THE session-12 invariants (the dashboard c_ decode; corrected
  session-13 S13-F2/F3):** the diagnostic
  quiz (E3) fires NO confetti — the decoded triggers live on the
  DASHBOARD, ported into the UNKEYED shell (`dashboard-app.tsx`, not the
  keyed CourseDashboard which remounts when the active course's key
  changes on a same-route switch): the 80-particle streak burst
  (min(quizScore,7) crossing
  EXACTLY 3 or 7 — `confettiAt`'s exact-equality semantics, unit-pinned)
  and the 90-particle mastery-label burst (`masteryLabelTier` —
  Novice/Apprentice/Learner/Scholar/Expert/Master at 0/20/40/60/80/100;
  the label never renders, it exists for the trigger). The shell derives
  activeCourse from the currentCourseId PROP (S13-F2 — the frozen
  viewCourseId state had blocked same-route switches); the firing
  surfaces are BOTH the course switch AND `router.refresh()` (the
  live's is the reactive entity
  store) — e2e-pinned via the m_ rename-driven refresh AND the
  course-switch drives. The quiz-flow
  material context gates on the BROAD predicate (`enrollmentMaterial` =
  isCustomSource && non-blank text — the session-11 `=== "custom"` gate
  was dead code: no clone writer emits "custom"). The roadmap prompts
  are THREE shapes (generate-time "stages" vs submit-time pct-aware
  "focus areas"; the LLM answers the `{"steps":[…]}` wrapper, which
  `generateCourseStages` now parses alongside the bare array). The Enter
  The Hub trailing icon is ChevronRight at lucide default sw 2
  (`m9 18 6-6-6-6`); the submit route 422s on present-but-invalid
  payloads (a missing score still degrades to 0).
- **THE session-13 invariants (the course-switch fix + the dual-shape
  roadmap):** `dashboard-app.tsx` derives `activeCourse` from the
  `currentCourseId` PROP — the session-8 `viewCourseId` state was frozen
  at mount (its setter had no caller), so same-route course switches
  rendered STALE content and the ported confetti triggers never fired on
  them (a same-route navigation re-renders the shell with fresh props
  WITHOUT remounting it — the session-12 "the page remounts" diagnosis
  was wrong; the KEYED child remounts on the key change, the unkeyed
  shell persists). The roadmap contract is DUAL-SHAPE (the live's
  generate-time OBJECTS vs submit-time STRING array — each branch's
  prompt + response verbatim; `parseRoadmap` maps strings via the live's
  Kh/card split semantics), and the `{steps}` wrapper parser
  ARRAY-CHECKS `parsed?.steps` (a lazy string reply crashed `.every` →
  500 — the degrade-never-fail invariant). e2e-pinned by the
  course-switch content/burst/label drives.
- **THE session-14 invariants (the pin-the-pin pass):** the roadmap
  prompt-split is now asserted VERBATIM from the captured transport
  request (`tests/ai-seam.test.ts`'s mocked `completions.create(req)`
  records `req.messages` — the session-13 "prompt split" test was a
  vacuous `expect(true).toBe(true)`; a mock closing over a `vi.hoisted`
  holder can always capture what it receives — a test named for a
  contract it never observes pins nothing); the submit route validates
  FIRST, derives after (every present-but-invalid 422 runs BEFORE the
  enrollment lookup; the derivations read only validated input — the
  422 matrix is byte-identical, e2e-carried); the dual-shape OBJECT arm
  is ONE predicate (`isStageObject` in domain.ts — consumed by both
  `parseRoadmap` and the AI seam's element validator; the stage count
  rides `STAGES_PER_COURSE`); and the confetti drives are ISOLATED
  (scores 6/7 with total 7 clamp the percent to 100 → Master→Master so
  the label burst cannot fire while the streak 6→7 crosses EXACTLY 7 —
  the 80-particle burst's only possible source; e2e + pixel-verified).
- **THE session-15 invariants (the conventions pass):** the trap-39
  60s-timeout convention is UNIT-ENFORCED (`tests/e2e-conventions.test.ts`
  scans every spec source + helpers.ts with a balanced-paren scanner — a
  new spec that forgets `timeout: 60_000` on an AI-backed request fails
  the unit gate); the e2e course fixtures live in ONE module
  (`tests/e2e/helpers.ts` — generateCourse/submitScore/
  cleanupGeneratedEnrollments/restoreDemoStudent + the demo
  credentials); and the lint gate runs the strongest zero-findings
  ruleset (`react-hooks/purity` at next-default error, prefer-const /
  no-unreachable / no-redeclare / no-useless-escape / no-console at warn
  — no-console scoped off for scripts/** + prisma/**).
- **THE session-16 invariants (the dead-code/deps pass):**
  `react-hooks/exhaustive-deps` is ON (the session-15 trade-off
  retired via the LATEST-REF pattern — a `useRef` + no-deps update
  effect declared before the consumer decouples the callback identity
  from the pinned firing triggers: lesson-view's two reporters ride
  `onAnsweredRef`/`onQuestionChangeRef` with deps `[lessonIndex]`/
  `[q]`, onboarding's pickup rides `generateRef` with `[publicMode]`);
  `@typescript-eslint/no-unused-vars` is ON (warn, `^_` patterns — the
  TS-aware rule flags dead code, not named type-contract params); and
  the unit runner runs `isolate: false` (5× faster; re-validate with
  a shuffle seed when a stateful test file joins).
- **THE mobile-nav invariant:** the toast container
  (`src/components/toast.tsx`) is `pointer-events-none` with toast items
  `pointer-events-auto`, mirrored by the `[data-sonner-toaster]` rules in
  `globals.css`. The live reference ships this broken — an empty
  notifications layer covers the hamburger button and Playwright refuses
  the tap. `tests/e2e/mobile-navigation.spec.ts` pins the fix with a REAL
  `.tap()`; do not weaken either rule or that spec.
- **THE quiz-flow invariants (session-3 port of gO/yO/xO + Im):** correct
  answers resolve after a 1000 ms reveal, then auto-advance after 800 ms
  (never require a manual Next click); wrong answers open the in-pane retry
  modal after 1800 ms ("Retry later" = `requeueQuestion` appends at the END;
  "Skip it" advances); a lesson completes at 8 correct; stage-boundary
  lessons (index 1, 3) render the in-pane "Level Up!" interstitial (1200 ms
  → `confettiLevelUp` → 800 ms → auto-advance); the final lesson fires the
  dual cannons. Options are the tan 2-column grid (reveal: correct GREEN
  `#BCFCAF`, wrong `#FFD0D0`); the button reads "Next Question".
  `tests/parity-session2.test.ts` + `tests/e2e/session2-parity.spec.ts` pin
  all of it.
- **THE progress-model invariant (session-3 F24):** dashboard/courses
  numbers are QUIZ-DERIVED (`round(score/5×100)`, `round(pct/100×6)` —
  `src/lib/domain.ts` `quizProgressPercent`/`derivedLessonsCompleted`),
  NOT lesson-counted. `/demo` = the same math on quiz 3 (60%, 4/6, 750 XP,
  3 days). The hub sidebar is 3-STATE (done/active/LOCKED past the active
  lesson) and its Lesson Progress card counts the SESSION
  (`{answered + 1}/8`), reported by the LessonView via `onAnswered`.
- **THE content pool:** `src/lib/quotes.ts` is the reference's exact
  99-line array (49 quotes + 50 encouragements). The bubble pick is
  SERVER-side (page → `bubbleQuote` prop) so hydration never mismatches;
  `randomLine(rng)` is injectable for tests. Regenerate only via
  `scripts/extract-live-quotes.mjs` + `scripts/generate-quotes-ts.mjs`.
- **The visual system is flat, token-driven, and measured** (not
  neumorphic): app gutter `#0F0E0E`; yellow `#FFFD73` (header
  `rounded-b-[20px] px-4 md:px-8 py-3 mx-[4px]`, accent cards, active
  states); paper `#F8F8F8`; purple `#C8AEFF` (setup panel); lilac `#D2C0F9`
  (hub sidebar); bubble `#EBE2FF` (mascot speech); tan `#E1C8B9` (Enter The
  Hub CTA); secondary text `#595959` at font-weight 300; chat bubbles
  `#F0F0F0` (radius 16/16/16/4 assistant tail); lesson rows `#F5F5F5`;
  cards `rounded-[20px]` separated by `gap-[4px] px-[4px]` gutters.
  Typography: Funnel Sans everywhere (300-800), Eczar serif ONLY for the
  "Thinkerwell" wordmark (16px/400, top offset 2px). H1s are
  `clamp(64px, 4.5vw, 120px)`, ls `-0.03em`, lh 0.9. Buttons: form radius
  12, menu rows radius 12 `hover:bg-gray-50`, cards radius 20.
- **Tailwind v4 traps are pinned in `globals.css`** — read
  `docs/Tailwind-V4-Validation-Report.md` before styling work. The five
  pins: full-hex `@theme` vars, v3 slate hexes, arbitrary gradient syntax,
  no `space-y-*` + explicit child margins, `--shadow-sm` at v3 geometry.
  Plus the global `button { cursor: pointer }` base rule (v4 preflight sets
  none) and the completed `rounded-[9999px]` sweep (session-5 — v4's
  `rounded-full` serializes as `calc(Infinity*1px)` = 33554400px in
  computed styles; the reference's v3 computes 9999px).
- **Mascots/SVG assets are static files** in `public/` (extracted from the
  live app — the animated keyframes run inside `<img>`). Use the wrappers
  in `src/components/mascot.tsx`; never inline the 10 KB SVGs into TSX.
- **The Hub renders desktop AND mobile instances in one DOM** (CSS-hidden).
  Playwright locators for "Your AI Tutor" / "Ask Nori anything..." /
  "Lesson Progress" / "Core Concept" match twice — `.first()` is the
  desktop instance, `.last()` the mobile one. Document the order in specs.
- **The `/demo` route is an auth-gated sample mirror** (session-8: the live
  registers /demo under the auth guard — anonymous →
  `/login?from_url=%2Fdemo`) with the reference's
  sample data (quiz 3/7 — the live's 60% / 4/6 / 3 days / 750 XP all fall
  out of the shared quiz-derived math). Do not "fix" the inconsistency —
  it replicates the reference.

## Implementation Standards

### Next.js 16 Specifics

- App Router; every page is `export const dynamic = "force-dynamic"` and
  resolves `getSessionUser()` server-side, redirecting to
  `/login?from_url=…` when required. `/login` renders its card for EVERY
  visitor (parity with the reference — no authenticated redirect).
- All server logic lives in route handlers under `src/app/api/` (14 of
  them); there are no server actions.
- Client components are explicit: the app shells (`*-app.tsx`), header,
  chat, lesson view, login card carry `"use client"`.
- Fonts load via Google Fonts `<link>` in the root layout (Funnel Sans +
  Eczar + Inter) — the same mechanism the reference uses. The
  `no-page-custom-font` ESLint warning is a Pages Router false positive;
  it is suppressed inline with a justification.
- `next.config.ts` pins `outputFileTracingRoot` and `allowedDevOrigins`
  (Next 16 dev-origin protection blocks dev chunks for non-localhost
  origins — includes the sandbox preview host). Keep both.
- Mascot/logo images use `next/image` with `unoptimized` (the SVGs carry
  their own animations; the optimizer would strip them).

### TypeScript Standards

- `strict: true` with `noImplicitAny: false` (intentional scaffold
  default).
- Route handlers cast parsed bodies to typed shapes and validate manually
  (trim, length caps, enum membership, ownership checks). Follow that
  style; do not introduce Zod halfway.
- DTO types ride with their components (`CourseDto`, `HubCourse`,
  `LessonContent`); pure domain types live in `src/lib/domain.ts`.

### Tailwind CSS 4

- CSS-first: ALL tokens in `src/app/globals.css` under `@theme` (brand
  colors) and `@theme inline` (shadcn bridge for the login surface).
  There is NO tailwind.config.js — do not add one.
- Custom utilities live in `@layer utilities` (caret-blink, fade-in-up,
  video-shimmer, tag-btn hover expansion, scroll-slim). The tag-btn rules
  replicate the reference's inline `<style>` block.
- Inline `style` attributes carry measured values (font stacks, radii,
  background colors) where byte-parity with the reference matters — the
  reference itself ships these as inline styles.

### Prisma / SQLite

- Schema changes use `db push` (no migrations directory). After schema
  edits: `bunx prisma generate && bun run db:push`.
- `bun run db:seed` is idempotent — it wipes domain tables and reseeds the
  demo account (demo@thinkerwell.app / Demo1234!) with the sample
  Economics course (3-stage roadmap, quiz 4/7, lessons 1-4 complete).
- Import `db` from `@/lib/db` only. Relative `DATABASE_URL` `file:` paths
  resolve against `prisma/schema.prisma` via the tested
  `src/lib/db-path.ts` seam (pinned by `tests/db-path.test.ts`).

### Testing Standards

- **Unit (Vitest)**: `src/**/*.test.ts` + `tests/*.test.ts`, node
  environment, `@` alias. The pure seams must stay pure — no I/O in
  `domain.ts`/`quotes.ts`.
- **E2E (Playwright)**: `tests/e2e/*.spec.ts`, boots the production
  standalone server on :3100 with `db/e2e.db` (global-setup pushes +
  seeds). The "setup" project signs the demo user in ONCE
  (`storageState`), so per-test logins never trip the rate limiter.
  `auth.spec.ts` opts OUT with an empty storageState (logged-out
  surface); authenticated specs live elsewhere — a file-level
  `test.use({ storageState: ... })` applies to the WHOLE file (the
  scoping bug that cost a debug cycle — keep auth states in separate
  files).
- E2E timeouts: 45s per test, 60s for AI-dependent assertions (Nori chat,
  lesson generation) — the LLM is real and slow; the fallbacks guarantee
  termination.

### Git & Deployment

- Conventional Commits on `main` only. Never commit secrets, `.auth`
  state, or `db/*.db` (all git-ignored).
- Pushes go through `docs/ssh_git_wrapper_v3.py` (materializes the deploy
  key 0600 outside the repo, pushes `HEAD:refs/heads/main`, verifies the
  remote ref, shreds the key). Exit codes: 0 ok, 1 usage/no-ssh, 2 key
  materialization, 3 local git, 4 auth/verification.
- Production: `bun run build && bun run start` (standalone server from the
  project root). Set `AUTH_SECRET` (`openssl rand -hex 32`); consider an
  absolute `DATABASE_URL` (see docs/DEPLOYMENT.md).

## Key File Map

| File | Role |
|------|------|
| `src/app/globals.css` | All design tokens + the 5 Tailwind v4 trap pins + toaster fix |
| `src/lib/auth.ts` | scrypt + HMAC cookie sessions (protocol-derived secure flag) |
| `src/lib/api.ts` | `{ ok, data }` / `{ ok, error }` envelope helpers |
| `src/lib/ai.ts` | z-ai-web-dev-sdk seam + static fallbacks (7 AI flows) |
| `src/lib/domain.ts` | Pure mastery grid, roadmap parsing, progress math |
| `src/components/layout/app-header.tsx` | Yellow chrome: desktop pill + mobile hamburger menus |
| `src/components/dashboard/*` | Onboarding / course / demo shells |
| `src/components/hub/*` | HubApp (3-pane + mobile tabs), NoriChat, LessonView |
| `tests/e2e/mobile-navigation.spec.ts` | THE regression pin: hamburger tappable, hub tabs |
