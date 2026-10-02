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
| Unit tests (46 checks) | `bun run test` |
| Browser E2E (34 checks; needs a build) | `bun run test:e2e` |
| Prisma client after schema change | `bunx prisma generate` |
| Recreate DB from schema | `bun run db:push` |
| Seed demo account | `bun run db:seed` |

**Gate order before every push:** `bun run lint` → `bun run typecheck` →
`bun run test` (46) → `bun run build` → `bun run test:e2e` (34 Playwright
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
- **The 3-level mastery grid lives in `src/lib/domain.ts`** (pure, unit
  tested): lesson index 0-5 → stage 0-2 × level 0-1; 8 questions per lesson;
  `parseRoadmap` is defensive (invalid JSON → `[]`); lesson titles derive as
  `"{Stage}: Basics"` / `"{Stage}: In Practice"` with the default grid
  fallback (Introduction / Key Concepts / … / Mastery Check).
- **Tailwind 4 is CSS-first** — no `tailwind.config.js`. Tokens live in
  `src/app/globals.css` `@theme` as FULL hex colors (never bare HSL
  triplets), the v3 slate hexes are pinned (v4's oklch drifts), and
  `--shadow-sm` is pinned to the v3 geometry. See
  `docs/Tailwind-V4-Validation-Report.md` for the full trap log — read it
  before touching styles.
- **THE mobile-nav rule:** the toast layer (`src/components/toast.tsx`)
  renders the Sonner-compatible container as `pointer-events-none` with
  toast items `pointer-events-auto`. The live reference ships this broken
  (empty container covers the hamburger button; Playwright refuses the
  click). `tests/e2e/mobile-navigation.spec.ts` pins the fix — do not
  remove the pointer-events rules in `globals.css`/`toast.tsx`.
- **THE quiz-flow rules (ported from the reference bundle):** a correct
  answer AUTO-ADVANCES after 800 ms; a wrong answer opens the in-pane retry
  modal after 800 ms ("Retry later" re-queues the question at the end,
  "Skip it" just advances); a lesson completes at 8 correct. Completing a
  stage-boundary lesson (index 1 or 3) shows the in-pane "Level Up!"
  interstitial (1200 ms → burst → 800 ms → auto-advance); the final lesson
  fires dual confetti cannons. The presets live in `src/lib/confetti.ts`;
  the trigger math (`confettiAt` 3/7 crossing, `requeueQuestion`) lives in
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
- **The `/demo` route is a stateless guest mirror** with the reference's
  static marketing numbers — `demoPercent={60}` pins Course Progress at 60%
  while real courses honestly compute (4/6 → 67%). Do not "fix" either side.
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
