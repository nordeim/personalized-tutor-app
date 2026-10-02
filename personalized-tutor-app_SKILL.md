---
name: personalized-tutor-app
description: >
  Complete engineering skill for the Thinkerwell codebase — a self-hosted
  clone of the base44 Personalized Tutor App built on Next.js 16 App Router,
  React 19, Prisma/SQLite, Tailwind v4, and a server-side AI seam. Captures
  the design tokens, the reference-mined behavioral contracts, the eight
  Tailwind v4 engine traps, the mobile-nav toaster fix, the quiz-flow
  semantics, the quiz-derived progress model, the lesson-view architecture
  (gO/yO/xO + Im), the two-dropdown header split (Course pill p_ + m_ user
  menu), the Q5 Add-a-Course modal, the hub pill semantics, the guest demo
  chrome, the session-5 mobile-menu component (Switch Course + guest Sign
  In), the m_ student-vs-user name split, the completed
  rounded-[9999px] computed-radius parity sweep, the session-7 computed-style
  histogram methodology (font-weight distributions + class→radius maps) and
  the radius/blur scale pins it produced, the session-8 public-surface model
  (the anonymous onboarding + pending_student_setup deferral + the signedOut
  header variant + the /demo auth gate + the Try-it navigation), the
  gamification math, the AI fallback doctrine, and the
  exact test gate every change must pass.
version: 1.8.0
last_updated: 2026-10-03
project_state: 91 unit tests + 69 e2e checks green; session-9 level-surface parity pass complete (the unclamped "9/8" Lesson Progress label, the Sign In pill from_url, the hub level-machinery decode + the level-2/3 context-card e2e pins via ?lesson=2|4, the lucide 0.475-vs-0.525 BookOpen/Trophy redesign trap)
---

# Thinkerwell (Personalized Tutor App) — Engineering SKILL

> **How to use this document:** the single source of truth for extending,
> debugging, onboarding onto, or replicating this codebase. Every claim is
> verifiable against a specific file or command (spot-checked at v1.1.0).
> Read §9 (Anti-Patterns) and §11 (Pre-Ship Checklist) before your first
> change; read §4 + §19 before touching any style.

---

## §1 Project Identity & Design Philosophy

**One sentence:** a production-grade, self-hosted clone of
`https://personalized-tutor-app.base44.app/` ("Thinkerwell") — an AI tutor
that builds a personalized 3-level mastery course from any topic or pasted
material, diagnoses gaps with a 7-question quiz, and coaches the learner
through the Hub with a Socratic chat tutor named Nori.

**Design thesis:** "friendly-brutalist stationery" — flat, ink-on-paper
surfaces with playful color blocking. Dark `#0F0E0E` gutters frame rounded
`[20px]` cards (yellow header, purple panels, lilac sidebar, paper body);
typography is a single family (Funnel Sans 300–800) with tight optical
sizing (`clamp()` display sizes, `letter-spacing: -0.03em`, `line-height:
0.88`); the mascot (Nori) is a hand-drawn-style SVG that animates via CSS
keyframes inside `<img>` tags.

**Non-negotiable design rules:**
- No shadows except the pinned `--shadow-sm` (v3 geometry) — depth comes
  from color contrast, not elevation.
- No purple gradients; purple is always a FLAT fill (`#C8AEFF`/`#D2C0F9`).
- The 4px gutter system (`gap-[4px] px-[4px] pb-[4px]` between cards) is
  sacred — cards never touch; the dark bg shows through as seams.
- Every measured token comes from the live app (see §19); inventing a hex
  is a bug.
- The anti-generic mandate: no default shadcn grays on branded surfaces —
  the only shadcn-styled surface is `/login` (the reference itself used
  slate shadcn there).

**CTA hierarchy:** black `#0F0E0E` primary buttons (rounded-[12px], bold,
disabled at 30% opacity) → tan `#E1C8B9` "Enter The Hub" (rounded-[20px]) →
white/`#F5F5F5` secondary rows → yellow `#FFFD73` is reserved for ACTIVE
state + progress, never a resting CTA.

**The clone doctrine:** parity over taste — where the reference ships a bug
(the mobile-nav toaster cover) the clone fixes it AND pins the fix with a
test; where the reference is merely different, the clone matches it.

## §2 Tech Stack & Environment

| Layer | Technology | Version | Critical note |
|-------|-----------|---------|---------------|
| Framework | next | ^16.1.1 | App Router ONLY; `output: "standalone"`; `next.config.ts` sets `ignoreBuildErrors` — the explicit `typecheck` gate is what catches types |
| UI runtime | react / react-dom | ^19.0.0 | Server components resolve state; ONE client shell per route |
| Language | typescript | ^5 | strict; `tsc --noEmit` must stay clean |
| Styling | tailwindcss + @tailwindcss/postcss | ^4 | CSS-first `@theme` (no tailwind.config.js) — see the trap log in §9 |
| DB | prisma + @prisma/client | ^6.11.1 | SQLite `file:` URL resolved by the tested `src/lib/db-path.ts` seam |
| Auth | hand-rolled (node:crypto) | — | scrypt + HMAC-signed cookie; NO NextAuth |
| AI | z-ai-web-dev-sdk | ^0.0.18 | server-only (`import "server-only"` in ai.ts); every flow has a static fallback |
| Confetti | canvas-confetti | ^1.9.4 | presets isolated in `src/lib/confetti.ts` (client-only seam) |
| Icons | lucide-react | ^0.525.0 | tree-shaken named imports (Zap, RotateCcw, X, CircleCheckBig, CircleX, Gem…) |
| Unit tests | vitest | ^5.0.1 | node env; `src/**/*.test.ts` + `tests/**/*.test.ts` |
| E2E | @playwright/test | ^1.63.0 | boots the standalone build on :3100 with `db/e2e.db` |
| Runtime | bun (≥1.1) | — | npm/node ≥20 also work; bun auto-loads `.env` |

**Env vars (3):** `DATABASE_URL` (required; SQLite `file:` or PostgreSQL
string), `AUTH_SECRET` (HMAC key; required in prod, insecure dev fallback),
`NEXT_PUBLIC_SITE_URL` (optional metadata origin). See `.env.example`.

**Stack decisions that would otherwise be guessed wrong:**
- No Zustand/Redux — state lives in server-resolved snapshots + `useState`
  in client shells (zustand was removed as an unused scaffold leftover).
- No middleware — session checks live in route handlers and server
  components via `getSessionUser()`.
- No `prisma/migrations/` — schema changes go through `db push` +
  the idempotent seed.

## §3 Bootstrapping & Configuration

```bash
bun install                      # or npm install
cp .env.example .env             # defaults are fine for local dev
bun run db:push                  # create <repo>/db/custom.db from the schema
bun run db:seed                  # demo account + sample Economics course
bun run dev                      # http://localhost:3000
```

Demo login: `demo@thinkerwell.app` / `Demo1234!`.

**Verify the setup:**
```bash
curl -s localhost:3000/api/health   # {"ok":true,"data":{"status":"ok","db":true}}
bun run lint && bun run typecheck && bun run test
```

**Configuration files (all verified):**
- `next.config.ts` — `output: "standalone"`, `outputFileTracingRoot` pinned,
  `allowedDevOrigins` (Next 16 dev-origin protection), `ignoreBuildErrors: true`.
- `tsconfig.json` — strict, `@/*` → `src/*`, `moduleResolution: "bundler"`.
- `eslint.config.mjs` — eslint-config-next + the sync-setState rule that
  forced the keyed-remount pattern in `lesson-view.tsx`.
- `vitest.config.ts` — node env, `@` alias, `*.test.ts` only (specs never
  double-run).
- `playwright.config.ts` — one worker, `fullyParallel: false` (specs share
  one seeded SQLite file), setup project saves `storageState` to
  `tests/e2e/.auth/user.json`, webServer = `bun .next/standalone/server.js`
  on :3100 with `DATABASE_URL=file:../db/e2e.db`.
- `postcss.config.mjs` — `@tailwindcss/postcss`.

**The DB path contract (pinned by `tests/db-path.test.ts`):**
`DATABASE_URL="file:../db/custom.db"` resolves against
`prisma/schema.prisma` → `<repo>/db/custom.db` for the Prisma CLI, the
generated client, `next dev`, `next build`, AND the standalone server,
regardless of CWD (`src/lib/db-path.ts` implements the anchor search).
⚠ A `DATABASE_URL` exported in the shell OVERRIDES `.env` (dotenv
precedence) — check `echo $DATABASE_URL` when the app opens an unexpected
file. `db/*.db` is git-ignored; recreate with `db:push` + `db:seed`.

## §4 The Design System (Code-First)

Tokens live in `src/app/globals.css` under `@theme` (verified block):

```
--color-ink: #0f0e0e        gutters, primary text, dark bars
--color-yellow: #fffd73     header, progress cards, active states
--color-paper: #f8f8f8      light cards
--color-purple: #c8aeff     setup panel, lessons/streak cards
--color-lilac: #d2c0f9      hub sidebar
--color-bubble: #ebe2ff     mascot speech bubble
--color-tan: #e1c8b9        "Enter The Hub" CTA, challenge answers (resting)
--color-gray-body: #595959  secondary text (font-light)
--color-gray-chat: #f0f0f0  chat bubbles + chat input
--color-gray-row: #f5f5f5   lesson rows, done tiles
--color-gray-disabled: #d0d0d0  locked lesson circles
--color-track: #e0e0e0      progress track
--color-bar: #1a1a1a        mobile hub bottom tab bar
--color-online: #4caf50     "Your AI Tutor" dot
```

Plus the pinned v3-era slate ramp (`--color-slate-50: #f8fafc` …
`--color-slate-900: #0f172a`) used ONLY by the `/login` card, and the fonts
(`--font-sans: "Funnel Sans"…`, brand Eczar for the logo).

**Typography hierarchy:** display `clamp(40px, 7vw, 140px)` hero /
`clamp(64px, 4.5vw, 120px)` welcome name, both ls `-0.03em` lh `0.88`;
section heads `text-2xl/3xl font-normal`; body `text-sm font-light`
(`#595959`); captions `text-xs font-light`; micro-labels `text-[10px]`.

**Radius scale:** `rounded-[12px]` (form inputs/buttons) ·
`rounded-[14px]` (speech bubble, result banners) ·
`rounded-[16px]` (menu items, question cards) ·
`rounded-[18px]` (icon tiles) · `rounded-[20px]` (cards/CTAs) ·
`rounded-[24px]` (modals).

**Keyframes (globals.css):** `mascot-breathe`, `arm-l`, `arm-r`, `hair`,
`shadow-pulse`, `body-float` (mascot idle), `blink` (typewriter caret),
`fade-in-up` (pane transitions), `video-shimmer` (16:9 placeholder),
`spin` (loading). Use `animate-fade-in-up` on pane-level mounts.

**Custom utilities:** `.tag-btn` (subject hidden, expands on hover),
`.scroll-slim` (thin scrollbars), `.video-shimmer`, `.caret-blink`, and
the `[data-sonner-toaster]` pointer-events rules (see §9 — the mobile-nav
fix).

## §5 Component Architecture & Patterns

**Layering (the Golden Rule):** server page (session + snapshot) → ONE
client shell per route → leaf client components → `@/lib` seams →
`@/lib/db` (Prisma) → SQLite. Client components NEVER import `@/lib/db` or
`@/lib/ai` (both are `server-only`); API routes are the only client→server
channel, always via the `{ ok, data } | { ok, error }` envelope.

**Component inventory (14 client components, 0 server components in
`src/components/`):**
- `layout/app-header.tsx` — the reference's TWO-dropdown split: the bordered
  Course pill (p_) + the m_ user menu (context line, Update Preferences →
  PUT /api/student). The mobile hamburger opens its OWN component
  (session-5 decode — `MobileMenuBody`): items `p-2` (no space-y), a
  Switch Course section when enrollments > 1 (BookOpen rows + a Check on
  the current course, rows → `/?course={id}`), My Courses, Log Out — or
  guest **Sign In**; NO Update Preferences on mobile; the header context
  line is the subject alone in `text-black/60`. The m_ PANEL header
  renders the STUDENT's name (the rename target) while the pill renders
  the USER's name; with-course panel = `p-4`/`gap-3`/`w-10` avatar at
  `text-base`, no-course = `p-3`/`gap-2.5`/`w-8` with plain `p-2` items.
  The triplicated outside-click effect lives in ONE hook
  (`useDismissOnOutsideClick`).
- `courses/add-course-modal.tsx` — the Q5 "Add a Course" in-page modal
  (Build/Material cards, ADD_COURSE_TAGS quick tags, Paste Text/Upload File
  tabs, Start Assessment → /quiz?course=).
- `dashboard/dashboard-app.tsx` — the route shell; picks onboarding vs
  course view; receives `bubbleQuote` from the server page.
- `dashboard/onboarding-dashboard.tsx` — typewriter hero + setup panel.
- `dashboard/course-dashboard.tsx` — welcome card, stats grid, roadmap,
  CTAs, right column (Course Lessons + Study Streak + Total XP), the
  Daily Challenge modal.
- `dashboard/demo-dashboard.tsx` — guest mirror (60% pin).
- `hub/hub-app.tsx` — 3-pane desktop / bottom-tab mobile; owns lesson
  selection + progress state.
- `hub/lesson-view.tsx` — THE quiz flow (see §7).
- `hub/nori-chat.tsx` — chat pane with `.prose` assistant bubbles.
- `quiz/quiz-app.tsx` — 7-question diagnostic + preparing overlay + the
  3/7 confetti guard.
- `courses/courses-app.tsx`, `login/login-card.tsx`, `mascot.tsx` (SVG
  wrappers), `toast.tsx` (Sonner-compatible, pointer-events fixed).

**Patterns that differ from defaults:**
- Pages are `force-dynamic` and hand ONE serializable snapshot to the
  client shell — no client-side data fetching on first paint (the Daily
  Challenge fetch is the deliberate exception: the reference shows a
  "Generating challenge..." spinner).
- **Keyed remount over sync setState:** per-lesson state resets happen by
  keying `LessonView` on the active lesson (`key={`desktop-${lesson}`}`) —
  the eslint sync-setState rule forbids resetting state inline in effects.
- **Hydration-safe randomness:** any random content (bubble quote) is
  picked on the SERVER and passed as a prop — never `Math.random()` in a
  client render path.
- **Dual DOM instances:** the Hub renders desktop AND mobile
  LessonView/NoriChat in one DOM (CSS-hidden). Locators use `.first()`
  (desktop) / `.last()` (mobile) — Playwright strict mode otherwise fails.

## §6 Custom "Hooks" Deep Dive

**`useDismissOnOutsideClick(ref, onDismiss)`** (session-6 extraction,
`src/components/layout/use-dismiss.ts`) — the ONE shared outside-click
dismissal, consumed by the CoursePill, the UserMenu, the mobile hamburger,
AND the hub's course/help menus (the hub's hand-rolled effect was deleted).
Callers pass a useCallback-memoized `onDismiss` — the hook re-subscribes
the document listener on identity change, so a fresh arrow re-subscribes
on every render.

- `useTypewriter(topics)` (`onboarding-dashboard.tsx`) — the reference's
  `o_` machine: types 60 ms/char, holds 2000 ms, deletes 50 ms/char, no
  delete→type gap; the initial state renders the FULL first topic (held,
  then deletes). Timings are named module constants (`TYPEWRITER_*_MS`);
  cleans its timer on unmount; the caret is a separate
  `<span class="caret-blink">`.
- `useToast()` (`toast.tsx` + `ToastProvider`) — Sonner-compatible API;
  the container is `pointer-events-none` (§9) with items `auto`.
- `useMascot*` — not hooks; the mascot wrappers (`MascotWelcome`,
  `MascotGenerating`, `BrandMark`) are plain components around static SVGs.
- The confetti "hooks" are ref-guards: `confettiAt(prev, next)` (pure, in
  `domain.ts`) + a `useRef` in `quiz-app.tsx` — never fire on first
  observation, only on upward crossings.

## §7 Content & AI Flows (the reference-mined contracts)

**The 99-line pool** (`src/lib/quotes.ts`, pinned by
`tests/parity-session2.test.ts`): ONE array — 49 authored quotes
(`'"text" — Author'`) followed by 50 plain encouragement lines, order
verbatim from the live bundle. The dashboard bubble picks a RANDOM line
per page load (server-side pick → `bubbleQuote` prop — the reference's
`Hy[Math.floor(Math.random()*Hy.length)]` semantics, hydration-safe).
`encouragementFor(n)` cycles the encouragement half deterministically for
the lesson-complete card.

**The lesson-quiz flow** (`lesson-view.tsx` — the bundle's Y2 + gO/yO/xO +
Im, ported in session-3):
1. Pick an option (tan 2-column grid) → "**Next Question**" (ChevronRight,
   ml-auto; gray `#E0E0E0`/`#999` until a pick) → **1000 ms reveal** →
   then **800 ms** advance/retry. The reveal paints the correct option
   GREEN `#BCFCAF` (+ CircleCheckBig) and a wrong pick `#FFD0D0`
   (+ CircleX); the others dim to 40%.
2. Correct → score +1 → auto-advance after the 800 ms (no manual Next).
3. Wrong → 800 ms → the in-pane retry modal ("Not quite!" / "Would you
   like to retry this question later?"): "Retry later" re-queues the
   question at the END (`requeueQuestion`), "Skip it" just advances.
4. A lesson completes at **8 correct** (or queue exhaustion — the graceful
   fallback for the edge the reference leaves broken).
5. Stage-boundary lessons (index 1 or 3) → **1200 ms** → the in-pane
   "Level Up!" interstitial (Zap in a `#FFFD73` w-14 h-14
   `rounded-[18px]` tile, "Preparing Lesson N…") + the level-up confetti
   burst → **800 ms** → auto-advance into the next lesson.
6. The final lesson (index 5) fires the dual side cannons and lands on
   the completion card ("LEGENDARY! 🌟").
7. The h2 shows the STUDENT'S `current_subject` (never the course name —
   `hubLessonSubject`, session-8) on level 1, the AI `title` on levels 2/3; the
   level context card is "Core Concept" (#FFFD73, question 0 only),
   "Real-World Scenario" (#E1C8B9), or "Final Boss Challenge" (#D2C0F9);
   each question carries a content card — video (16:9 shimmer + play +
   "Example video — …" caption) or "Reading" (#F0F0F0, FileText).

**The lesson-content contract** (`/api/lessons/content`):
`{title, concept, scenario, challenge, questions[8] ×
{question, options[4], correctIndex, contentType "video"|"text",
contentText}, aiGenerated}` — the reference's exact prompt ("Generate 8
distinct multiple-choice questions for Level N on the subject…"), the
level fed as the 1-based STAGE number (floor(lessonIndex/2)+1).

**The quiz-derived progress model** (session-3, `domain.ts`): the
reference has NO per-lesson entity — `quizProgressPercent(score,
completed) = round(score/5×100)` (clamped at 100), `derivedLessonsCompleted
= round(pct/100×6)`, roadmap current stage = `floor(lessons/2)`, roadmap
bar = lessons/6×100 UNROUNDED. The hub sidebar is 3-state (done
`#DCDCDC`/active yellow/locked `#EBEBEB`+0.45+Lock) keyed off the active
lesson index; its Lesson Progress card shows `{answered + 1}/8` from the
SESSION's correct count (the LessonView reports via `onAnswered`).

**Confetti presets** (`src/lib/confetti.ts`): quiz milestone
(80 particles, spread 55, origin {x:.85,y:.4}, `#FFFD73/#C8AEFF/#0F0E0E`)
at diagnostic scores crossing 3 or 7; level-up (70/60/{x:.5,y:.3}/
`#8b5cf6/#06b6d4/#f59e0b`); course-complete = two calls (120 particles,
angles 60°/120°, spread 70, origins x:0/x:1, the right cannon swapping in
`#10b981`).

**Gamification math** (`domain.ts`): `studyStreakDays(quizScore) =
min(quizScore, 7)`; `totalXp(pct, score) = pct*10 + score*50`; the Study
Streak strip renders M–S tiles — active tiles `#0F0E0E` with the white
flame SVG, inactive `#F5F5F5` with the date, dates anchored to today.

**The AI seam** (`src/lib/ai.ts`, server-only): seven generators
(roadmap, lesson titles, diagnostic quiz, lesson content + 8 questions,
Nori chat, gap analysis, daily challenge) each validate the LLM JSON
shape (4 options, correctIndex 0–3, etc.) and fall back to deterministic
static content — an AI outage must NEVER break a flow (the e2e suite
exercises this via real 429s). The Daily Challenge returns
`{question, hint, options[4], correctIndex, aiGenerated}`.

## §8 Accessibility Notes

- Contrast: `#0F0E0E` on `#FFFD73` ≈ 14.9:1; `#595959` on `#F8F8F8` ≈ 7:1 —
  body text passes AA; the `text-black/30` hint and `text-black/40` weekday
  labels are decorative micro-copy (match the reference).
- Interactive rows carry `aria-label`s (`Open lesson N: title`, `Open
  menu`, `Account menu`); option buttons use `aria-pressed`.
- Focus states are browser-default-visible (the reference ships no custom
  rings); do not add `outline: none` anywhere.
- The toast region is `aria-live` (`role="region"`, alt+T).
- Reduced motion: NOT shipped by the reference — the mascot and typewriter
  animate unconditionally (accepted divergence, documented).

## §9 Anti-Patterns & Common Bugs (the trap log)

1. **Bare-HSL `@theme` vars resolve transparent** (Tailwind v4 + `@theme
   inline`) — always ship FULL hex values. Symptom: invisible text/colors.
2. **v4 oklch palette drift** — v4's default palette differs 1–3 sRGB
   units from v3; the slate ramp is pinned hex-for-hex (the `/login` card
   would otherwise shift).
3. **oklab gradient interpolation** — v4 interpolates `bg-gradient-*` in
   oklab; brand gradients ship as arbitrary `bg-[linear-gradient(…)]`
   sRGB values.
4. **`space-y-*` vs child `mt-*`** — v4's `space-y` uses `:where()`
   (zero specificity), so a child's explicit `mt-*` WINS; avoid the combo
   (the mobile-nav CTA ships without `mt-3` for exactly this reason).
5. **Shadow scale shift** — `--shadow-sm` is pinned to v3's
   `0 1px 2px 0 rgb(0 0 0 / 0.05)`; v4's default is one notch heavier.
6. **THE mobile-nav toaster cover (the reference's own bug):** an empty
   toast container with `pointer-events: auto` (Sonner default) renders
   `fixed top-0 w-full p-4` OVER the hamburger button — Playwright refuses
   the tap. Fix: container `pointer-events-none`, items `pointer-events-auto`,
   mirrored in `globals.css` `[data-sonner-toaster]` rules; pinned by
   `tests/e2e/mobile-navigation.spec.ts` with a REAL `.tap()`. Do not
   "simplify" those rules.
7. **Cookie `secure` on plain-HTTP production:** the e2e standalone server
   serves HTTP; a hard-coded `secure: true` silently drops cookies.
   `createSession()` derives the flag from `req.url` +
   `x-forwarded-proto`.
8. **Playwright strict-mode duplicates:** the Hub renders desktop AND
   mobile instances of the same component — unqualified locators match
   twice and throw. Use `.first()`/`.last()` per the DOM order.
9. **storageState is file-scoped:** `test.use({ storageState: ... })`
   applies to the WHOLE file; logged-out specs must live in their own file
   with an EMPTY storageState (see `auth.spec.ts` vs the rest).
10. **Hydration mismatch from randomness:** `Math.random()` in a client
    render path breaks SSR hydration — pick random content server-side
    and pass it as a prop (the `bubbleQuote` pattern).
11. **Sync setState in effects:** resetting quiz state inside an effect
    violates the lint rule — reset by REMOUNTING (key the component on
    the changing identity).
12. **dotenv precedence:** a shell-exported `DATABASE_URL` overrides
    `.env`; a mysteriously wrong DB file is almost always this (§3).
13. **Lesson-counted dashboard progress (session-3):** the reference has NO
    per-lesson progress entity — deriving dashboard numbers from
    LessonProgress rows produces 67%-style numbers the live never shows.
    Use the quiz-derived seam (`quizProgressPercent` /
    `derivedLessonsCompleted`); the hub's per-lesson tracking feeds nothing
    visual.
14. **Reveal-then-advance timing:** the reference resolves an answer in TWO
    stages — 1000 ms reveal, then 800 ms advance/retry — collapsing them
    into a single 800 ms delay makes the reveal invisible to the user and
    breaks the e2e settle checks.
15. **Nested component definitions trip the react-compiler lint** ("Cannot
    create components during render") — extract inner cards to module-level
    components with props (the ContentCard/ContextCard pattern in
    lesson-view.tsx).
16. **`rounded-full` computes to 33554400px in v4** (session-5):
    `calc(Infinity*1px)` serializes as `3.35544e+07px` in computed styles
    while the reference's v3 computes `9999px`. The sweep is COMPLETE —
    every circular element uses `rounded-[9999px]`. Visually identical,
    computed-style different; e2e specs assert borders, not radii.
17. **The mobile menu is NOT the m_ reused** (session-5): reusing the
    desktop menu body on mobile reintroduces Update Preferences, the
    `space-y-0.5` gap, and the full context line — all absent from the
    reference's `md:hidden` panel. Mobile renders `MobileMenuBody`
    (Switch Course + My Courses + Log Out/Sign In).
18. **The m_ panel name vs the pill name** (session-5): the panel header
    must render the STUDENT's name (`e.name` — what `PUT /api/student`
    writes) or the preferences rename visibly round-trips nowhere; the
    pill renders the USER's `full_name`. Same-name seeds hide this bug —
    test with a rename.
19. **Icon stroke weights are decoded values, not style choices**
    (session-6): the CO card's ChevronRight is lucide-default sw 2; the
    m_ pill chevron is CONDITIONAL (`student ? 2 : 1.5` — the live ships
    two trigger components); the /courses Add tile Plus is the canonical
    `M12 5v14` at sw 2 (a `v19` typo renders a visibly longer stroke);
    Trash2 + subject icons stay 1.5. "Normalizing" every icon to one
    weight silently breaks parity.
20. **Two source predicates, intentionally split** (session-6):
    `isCustomSource` (custom‖material — the p_ icon + m_ context line) vs
    `courseSourceLabel` (custom ONLY → "Custom Material" — the CO card
    label). The reference's bundle ships exactly this split; a
    "material" course shows the BookOpen pill icon but still labels
    AI-Generated on the card. Pinned in `tests/domain-session6.test.ts`.
    Also: the live /demo roadmap + challenge question are AI-generated PER
    VISIT (titles alternate) — the clone's static sample is an accepted
    divergence, not drift to chase.
21. **The radius-scale shift** (session-7, Trap 6): the reference's custom
    v3 config maps `rounded-lg` AND `rounded-xl` to **12px** — v4 ships
    lg=8px/xl=14px. Both tokens are pinned (`--radius-lg`/
    `--radius-xl: 0.75rem` in globals.css); 41 usages ride on them. The
    14px surfaces (quiz options, Next-Question) are `rounded-[14px]`
    ARBITRARY on both sides — never "round" them to rounded-xl.
22. **The blur-scale shift** (session-7, Trap 7): v4 moved every named
    blur level up one notch — the login card's `backdrop-blur-sm`
    computes blur(8px) on v4 vs the live's blur(4px). `--blur-sm: 4px`
    restores the v3 geometry (the `--shadow-sm` precedent's sibling; no
    other blur consumer exists).
23. **The base font-weight is 300, not 400** (session-7): the live's body
    computes font-light — every weight-less text node (mode-card
    descriptions, category tags, "N/6 lessons completed") inherits 300.
    Audit weight drift with a leaf-text font-weight HISTOGRAM per route;
    computed styles are the ground truth, class strings are the
    approximation. The same sweep surfaced the Course-Lessons icon column
    (lucide CircleCheckBig/Circle per row status — never the scaffold's
    numbered circles; see `lessonRowStatus` in domain.ts).

24. **Alpha-color serialization drift** (session-8, Trap 8): v4 generates
    alpha-modified colors via `color-mix(in oklab, …)` — `text-black/40`
    computes `oklab(0 0 0 / 0.4)` while the reference's v3 computes
    `rgba(0, 0, 0, 0.4)`. Achromatic alpha renders identically (and this
    app has ZERO chromatic alpha classes — audited), but computed-style
    pins catch it immediately. Pinned surfaces normalize via inline
    `rgba()` (the streak weekday letters, the challenge-modal overlay).
    CHROMATIC alpha (`bg-purple/50`) would mix in oklab vs v3's sRGB — a
    REAL visual difference; audit before porting.
25. **The public-surface model** (session-8): anonymous `/` and
    `/onboarding` render the PUBLIC ONBOARDING — never a login redirect
    (the live's landing surface). The anonymous header = the signedOut
    variant (desktop black Sign In pill, mobile items-only menu: My
    Courses + Sign In, NO yellow name header); the setup panel gains the
    anonymous-only "Your Name" block (required for Continue); Continue
    stores `pending_student_setup` (sessionStorage) and routes
    `/login?from_url=<current>`; after login the onboarding pickup
    AUTO-SUBMITS through `/api/courses/generate` → `/quiz`. `/demo` is
    auth-gated like /hub /quiz /courses. And "Try it Sample: Economics
    Course" NAVIGATES to `/demo` — never a course generation (the
    bundle's `onTryIt: () => navigate("/demo")`; the is_sample pending
    path is dead code).
26. **The hub h2 subject is the STUDENT's** (session-8): the LessonView
    h2 on level 1 = `hubLessonSubject(course)` = the student's
    `current_subject || "General"` — NEVER the active course name (a
    divergent student still sees their saved subject). The dashboard card
    icons decode from the live's path `d` data: Trophy/Brain/BookOpen/
    Sparkles at h-6 w-6 (stats + roadmap), BookOpen h-4 w-4 (Course
    Lessons header), Brain h-5 w-5 (challenge modal) — the session-2
    TrendingUp/Sparkles picks were drifts. The challenge modal has NO
    result banner: the Submit button swaps in place to "Close" after the
    reveal (overlay inline `rgba(0,0,0,0.5)`, no blur).
27. **The Lesson Progress label is unclamped** (session-9, S9-F1): the
    live's qP computes `[c + 1, "/", d]` — at the completing 8th correct
    the card renders **"9/8"** (observed on the live; the clone's
    Math.min clamp was drift). `lessonProgressLabel`/`lessonProgressPct`
    are unit-pinned domain helpers — never reintroduce the clamp.
28. **The hub's lesson-advance machinery is dead code on the live**
    (session-9): the sidebar's activeLessonIndex is NEVER written after
    mount (the setter only runs in the course-change reset; locked rows
    are unclickable; the qP's activeLevel/levelingUp props are dead) —
    the live's hub dead-ends after lesson 1's completion ("8/8 correct"
    stuck behind the Level-Up interstitial; the level-up only persists
    the StudySession's active_level). The clone's advancing 6-lesson flow
    is the pinned doctrine fix. The level-2/3 context cards (tan
    Real-World Scenario / lilac Final Boss) render CONDITIONALLY on the
    generated scenario/challenge; the h2 = the generated title on levels
    2/3 (yO/xO decode); both are e2e-pinned via `?lesson=2|4`.
29. **lucide icon versions drift** (session-9): BookOpen AND Trophy were
    REDESIGNED upstream between the live's lucide-react 0.475 and the
    clone's 0.525 (0.475 BookOpen `M2 3h6…` vs 0.525 `M12 7v14…`). The
    dashboard's card icons pin the live's exact path data as
    parameterized local components — swapping them for current lucide
    imports changes the rendered strokes AND breaks the e2e icon pins.
    Re-probe the live's paths before ANY icon-component swap. The desktop
    anonymous Sign In pill carries from_url (the live's navigateToLogin
    = redirectToLogin(window.location.href) — same contract on the
    desktop pill and the mobile item).

## §10 Debugging Guide

| Symptom | Likely cause | Fix/verify |
|---------|--------------|-----------|
| Colors invisible / transparent | trap 1 (bare HSL) | check `@theme` entries are full hexes |
| Login card looks "off" vs reference | trap 2 (slate drift) | diff `--color-slate-*` against §19 |
| Mobile hamburger unclickable in tests | trap 6 regressed | run `mobile-navigation.spec.ts`; check the pointer-events rules |
| E2E auth specs all fail w/ fresh cookies | trap 7 (secure cookie) | `curl -i` the login route on :3100; `Set-Cookie` must lack `Secure` |
| `strict mode violation` in a Hub spec | trap 8 (dual DOM) | scope with `.first()`/`.last()` |
| App opens the wrong SQLite file | trap 12 | `echo $DATABASE_URL`; `ls -la db/` |
| `P1003: database file does not exist` | db never pushed / wrong anchor | `bun run db:push` from the repo root |
| AI flows hang then show fallback content | SDK 429/timeout | expected degradation — check `dev.log` for the 429, the fallback is by design |
| Quiz seems "stuck" after a correct answer | you removed the 1800 ms reveal+advance contract | restore `ANSWER_FEEDBACK_MS` (1000) + `ADVANCE_MS` (800) (§7) |
| Level-up never appears | boundary logic changed | completing lesson index 1 or 3 with 8 correct must interstitial |
| Dashboard shows 67% / 4-6 lessons on the seeded course | lesson-counted math regressed (trap 13) | quiz 4 must derive 80% / 5/6 (`quizProgressPercent`) |
| "Cannot create components during render" lint error | trap 15 (nested components) | extract the card to a module-level component |
| Options render white/single-column | the tan 2-col grid regressed | `button.rounded-[14px]` grid + `#E1C8B9` (§4) |
| Bubble quote changes on every render / hydration warning | random pick moved client-side | move the pick back to the server page (§5) |
| Preferences rename doesn't show in the m_ header | trap 18 (panel renders user.name) | render `student.name` in the panel, `user.name` in the pill |
| Computed border-radius shows 3.35544e+07px | trap 16 (`rounded-full` returned) | grep `rounded-full` in `src/` — must be zero; use `rounded-[9999px]` |

**Live-site verification commands:**
```bash
curl -s localhost:3000/api/health          # {"ok":true,"data":{"status":"ok","db":true}}
bun run test                              # 91 unit
bun run build && bun run test:e2e         # 69 e2e on :3100
```

## §11 Pre-Ship Checklist

Run IN ORDER; the local gate is the only gate (no hosted CI):

```bash
bun run lint          # eslint . — zero warnings
bun run typecheck     # tsc --noEmit — zero errors (build won't catch them!)
bun run test          # 91 Vitest checks
bun run build         # standalone build (also required for e2e)
bun run test:e2e      # 69 Playwright checks on :3100
```

Verification categories beyond the gate:
- **Mobile-nav:** `tests/e2e/mobile-navigation.spec.ts` passed (the toaster
  pin) — never skip this file.
- **Quiz flow:** answered a full lesson in a browser — auto-advance works,
  the retry modal re-queues, the boundary level-up fires.
- **DB:** `ls db/` shows `custom.db` (+ `e2e.db` after e2e); the app's
  health route reports `db: true`.
- **Security:** no secrets in the diff (`.env` is git-ignored;
  `.env.example` carries placeholders only); the SSH push goes through
  `docs/ssh_git_wrapper_v3.py` (runbook:
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) — never a plain push.
- **Docs:** AGENTS.md / CLAUDE.md / README.md /
  Project_Architecture_Document.md counts still match reality (routes,
  tests, cards); update the Revision Block.

## §12 Lessons Learnt

1. **F1 — Read the compiled reference, not just its pixels.** Every
   behavioral contract in §7 (timings, confetti numbers, pool contents)
   came from mining the live JS bundle; visual diffing alone missed them.
2. **F2 — The reference's dead code is a parity signal.** The live bundle
   passes quiz-feedback props it never renders; implementing UI the
   reference doesn't show would be a divergence, not parity. Verify a
   "missing" feature actually renders before building it.
3. **F3 — Env precedence bites in sandboxes.** A shell-exported
   `DATABASE_URL` silently redirected every DB operation outside the repo
   (§3, §10) — hours of "Prisma resolves the wrong path" was one
   `echo $DATABASE_URL` away.
4. **F4 — Empty overlay containers must be pointer-events-none.** The
   reference's own mobile-nav bug (§9 #6) is the canonical example; the
   fix pattern (container none, items auto) applies to ANY fixed portal.
5. **F5 — Secure cookies on plain-HTTP break silently.** Browsers drop
   them without an error; only end-to-end e2e on the real HTTP server
   catches it — derive `secure` from the request, never hard-code.
6. **F6 — One DOM, two viewports.** Rendering desktop + mobile instances
   simultaneously is what makes CSS-hidden state testable — but every
   locator must be scoped (§9 #8), and the mobile e2e specs use `.tap()`
   to prove real touch ergonomics.
7. **F7 — Fallbacks are features.** The AI 429s during the e2e suite are
   not flakes — they exercise the deterministic fallback paths and the
   suite stays green because of them.
8. **F8 — Random content needs a server-side home.** Client-side
   randomness breaks hydration (§9 #10); the `bubbleQuote` prop pattern
   keeps per-load randomness SSR-safe.

## §13 Pitfalls to Avoid

- **Don't** construct `PrismaClient` directly in a route — import `db`
  from `@/lib/db` (the URL resolution seam).
- **Don't** import `@/lib/ai` or `@/lib/db` from a client component —
  both are `server-only` and will fail the build.
- **Don't** return raw JSON from a handler — always `ok()`/`fail()` (the
  envelope is a contract the client shells rely on).
- **Don't** hand-edit `src/lib/quotes.ts` — regenerate with the two
  scripts (§7) and let `tests/parity-session2.test.ts` verify.
- **Don't** add a Next middleware for auth — the reference has none and
  `requireSession()` is the guard.
- **Don't** use `space-y-*` on containers whose children also set `mt-*`
  (§9 #4).
- **Don't** name a test file `*.spec.ts` unless it's a Playwright spec
  (vitest only matches `*.test.ts` — and vice versa).
- **Don't** run `db:migrate` — this repo uses `db push` + idempotent seed.
- **Don't** push with a plain `git push` — always the SSH wrapper.
- **Don't** "fix" the `/demo` 60% pin or the honest 67% real-course math —
  both are intentional (documented divergence).

## §14 Best Practices

- **TDD for pure seams:** every new domain calculation gets a failing
  `tests/*.test.ts` first (the session-2 helpers `confettiAt`,
  `studyStreakDays`, `totalXp`, `requeueQuestion` all landed red first).
- **Mine, don't guess:** when closing a parity gap, extract the exact
  values from the saved bundle
  (`clone-workspace/recon/live-index.js`) — copy, numbers, colors, and
  timings.
- **Snapshot-per-route:** new pages hand ONE serializable snapshot to ONE
  client shell (§5) — keep props primitive.
- **Enveloped fetches:** client code types every API response as
  `{ ok: true; data } | { ok: false; error: { code, message } }`.
- **Idempotent seed:** `prisma/seed.ts` wipes domain tables and reseeds —
  safe to run any time; e2e relies on that guarantee.
- **Comment the WHY with numbers:** timing literals in `lesson-view.tsx`
  cite the live bundle's 1200/800/800 ms values — keep the citations.

## §15 Coding Patterns (copy these)

**The envelope:**
```ts
import { ok, fail } from "@/lib/api";
export async function POST(req: Request) {
  const user = await requireSession();
  if (!user) return fail("UNAUTHORIZED", "Sign in first", 401);
  return ok({ question, hint, options, correctIndex });
}
```

**The ref-guarded confetti trigger:**
```ts
// domain.ts (pure, unit-tested)
export function confettiAt(prev: number | null, next: number): boolean {
  if (prev === null) return false;          // first observation initializes
  if (next <= prev) return false;           // downward never fires
  return (prev < 3 && next >= 3) || (prev < 7 && next >= 7);
}
// quiz-app.tsx (client)
if (wasCorrect && confettiAt(prevCount, nextCount)) confettiQuizMilestone();
```

**The requeue (retry-later):**
```ts
export function requeueQuestion<T extends object>(questions: T[], q: T): T[] {
  return [...questions, { ...q }];          // append a copy at the END
}
```

**The hydration-safe random pick:**
```tsx
// page.tsx (server)                     <DashboardApp bubbleQuote={randomQuote()} />
// course-dashboard.tsx (client)          const quote = bubbleQuote ?? FALLBACK_BUBBLE;
```

**The in-pane interstitial (replaces the pane, not the screen):**
```tsx
if (levelingUp) {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="animate-fade-in-up space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px]"
             style={{ backgroundColor: "rgb(255, 253, 115)" }}>
          <Zap className="h-6 w-6 text-black" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-normal text-black" style={{ letterSpacing: "-0.03em" }}>
          Level Up!
        </h2>
        <p className="text-sm font-light" style={{ color: "rgb(89, 89, 89)" }}>
          Preparing Lesson {n}...
        </p>
      </div>
    </div>
  );
}
```

## §16 Coding Anti-Patterns

```tsx
// ❌ direct client + CWD-dependent resolution
const prisma = new PrismaClient();

// ✅ the seam
import { db } from "@/lib/db";

// ❌ random content in a client render path (hydration mismatch)
const quote = useMemo(() => QUOTES[Math.floor(Math.random() * 99)], []);

// ✅ server-picked prop
const quote = bubbleQuote ?? FALLBACK_BUBBLE;

// ❌ resetting state inside an effect (lint violation)
useEffect(() => { setQIndex(0); setPicked(null); }, [lessonIndex]);

// ✅ keyed remount
<LessonView key={`desktop-${activeLesson}`} ... />

// ❌ manual Next button after a correct answer
<button onClick={next}>Next</button>

// ✅ the 800 ms auto-advance contract
later(() => advance(nextScore, total), ANSWER_FEEDBACK_MS);
```

## §17 Responsive Breakpoint Reference

| Breakpoint | Role |
|-----------|------|
| base (< 768) | mobile: header shows hamburger; dashboard stacks (hero → setup → stats); Hub uses the bottom tab bar (`#1a1a1a` `rounded-[20px]`, tabs `py-3.5`, active `#FFFD73`) |
| `sm` (≥ 640) | stats grid spans 2→3 columns for Daily Challenge; CTA row stays stacked until `sm` |
| `md` (≥ 768) | header switches to the user pill; streak/XP pair goes side-by-side; hub header appears |
| `lg` (≥ 1024) | dashboard two-column (`flex-[2]` / `flex-[1]`); Hub desktop 3-pane (sidebar `w-[35%]`) |

Tested viewports: 1440×900 (desktop specs), 390×844 (mobile specs).

## §18 Z-Index Layer Map

| Layer | z | Where |
|-------|---|-------|
| Base cards | auto | everything |
| Header dropdowns | 50 | `app-header.tsx` |
| Modals / overlays (challenge, generating, Q5 add-course) | 50 | `course-dashboard.tsx`, `hub-app.tsx`, `add-course-modal.tsx` |
| Toast container | 100 (`z-[100]`) | `toast.tsx` — pointer-events-none container (§9 #6) |
| Dev overlay | — | Next 16 dev tools (dev only) |

Rule: new overlays use `z-50`; nothing may exceed the toaster's 100; the
toaster must stay pointer-events-none.

## §19 Color Reference (complete)

See §4 for the token block (the source of truth is
`src/app/globals.css` `@theme`). Inline `rgb()` literals used for
measured one-offs (kept verbatim from the reference): `rgb(255, 208, 208)`
wrong-answer tint & red tiles, `rgb(188, 252, 175)` challenge-success
banner, `rgb(220, 220, 220)` dimmed options, `rgb(235, 235, 235)` inactive
sidebar rows, `rgb(250, 250, 250)` future lesson rows, `rgb(255, 255, 255)`
next-lesson row + XP card, `rgb(139, 92, 246)`/`rgb(6, 182, 212)`/
`rgb(245, 158, 11)`/`rgb(16, 185, 129)` confetti palette (the reference's
own values), `rgb(76, 175, 80)` online dot.

## §20 TypeScript Interface Reference (key shapes)

```ts
// src/lib/api.ts — the envelope
type ApiOk<T>  = { ok: true; data: T };
type ApiErr    = { ok: false; error: { code: string; message: string } };

// src/lib/domain.ts
type RoadmapStep = { title: string; description: string };
type StageStatus = "done" | "in-progress" | "upcoming";
function lessonMeta(i: number): { index: number; number: number; stage: number; level: number };
function confettiAt(prev: number | null, next: number): boolean;
function requeueQuestion<T extends object>(questions: T[], q: T): T[];
function studyStreakDays(quizScore: number): number;   // min(score, 7)
function totalXp(scorePercent: number, quizScore: number): number;
// session-3 quiz-derived progress seam:
function quizProgressPercent(quizScore: number | null, quizCompleted: boolean | null): number; // round(score/5*100), clamped
function derivedLessonsCompleted(progressPct: number): number;   // round(pct/100*6)
function roadmapCurrentStage(lessonsCompleted: number): number;  // floor(x/2)
function roadmapStageStatus(stage: number, currentStage: number): StageStatus;
function subjectIconName(courseName: string | null, contentSource: string | null): string;
const LEVEL_SUFFIXES: readonly (readonly [string, string])[];  // per-stage lesson-title suffix pairs

// src/lib/quotes.ts
type PoolQuote = { raw: string; text: string; author: string };
const QUOTE_POOL: PoolQuote[];          // 49
const ENCOURAGEMENT_POOL: string[];     // 50
const POOL: string[];                   // 99, reference order
function randomLine(rng?: () => number): string;
function randomQuote(rng?: () => number): { raw: string; text: string; author: string | null };
function encouragementFor(lessonNumber: number): string;

// src/components/dashboard/course-dashboard.tsx
type BubbleQuote = { raw: string; text: string; author: string | null };
type Challenge = { question: string; hint: string; options: string[]; correctIndex: number; aiGenerated: boolean };

// hub lesson content (POST /api/lessons/content) — the reference's Y2 schema
type LessonQuestion = { question: string; options: string[]; correctIndex: number; contentType: "video" | "text"; contentText: string };
type LessonContent = { title: string; concept: string; scenario: string; challenge: string; questions: LessonQuestion[]; aiGenerated: boolean };
```

---

## Appendix A — The Meticulous Workflow (how changes land here)

1. **MINE** — extract the reference's exact values from
   `clone-workspace/recon/live-index.js` (bundle) and the saved page HTMLs.
2. **PIN** — write the failing unit test first
   (`tests/parity-session2.test.ts` pattern): exact lists, math, semantics.
3. **PORT** — implement against the seam layer (`domain.ts` /
   `quotes.ts` / `confetti.ts`), keep components thin.
4. **GATE** — lint → typecheck → unit → build → e2e (§11).
5. **PROVE** — drive the flow in a real browser (agent-browser), capture
   screenshots to `docs/screenshots/`.
6. **DOCUMENT** — update the four docs + this SKILL, then commit on `main`
   and push via the SSH wrapper.

## Appendix B — Quick Reference Card

| Need | File |
|------|------|
| Design tokens | `src/app/globals.css` (`@theme`) |
| Mastery grid / progress math | `src/lib/domain.ts` |
| Quote pool + picks | `src/lib/quotes.ts` |
| Confetti presets | `src/lib/confetti.ts` |
| AI generators + fallbacks | `src/lib/ai.ts` |
| DB URL resolution | `src/lib/db-path.ts` (+ `db.ts`) |
| Auth (scrypt + cookie) | `src/lib/auth.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Quiz flow / level-up / retry | `src/components/hub/lesson-view.tsx` |
| Streak/XP/challenge modal | `src/components/dashboard/course-dashboard.tsx` |
| Mobile-nav fix | `src/components/toast.tsx` + `globals.css` |
| Unit pins | `tests/domain.test.ts`, `tests/db-path.test.ts`, `tests/parity-session2.test.ts` |
| E2E pins | `tests/e2e/mobile-navigation.spec.ts`, `tests/e2e/session2-parity.spec.ts`, `tests/e2e/dashboard.spec.ts` |
| Screenshots | `docs/screenshots/01-22*.png` |
| Tailwind v4 trap log | `docs/Tailwind-V4-Validation-Report.md` |
| Session-2 remediation plan | `docs/remediation-plan-session-2.md` |
| SSH push runbook | `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` (+ `docs/ssh_git_wrapper_v3.py`) |
