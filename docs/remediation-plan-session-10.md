# Remediation Plan — Session 10

Repo state at start: `28e0c26` (session-9 complete at `ef3fb18` + the transcript
log commits; baseline gate green, re-verified fresh this session: lint ✓
typecheck ✓ 91 unit ✓ build ✓ 69 e2e ✓; the workspace PERSISTED from session 9
— `.env` + `db/custom.db` + `db/e2e.db` + `node_modules` already in place; the
stale shell `DATABASE_URL` trap re-armed — every dev/CLI command runs under
`env -u DATABASE_URL`).

Audit sources: a two-axis code review of the session-9 code commit
(`ef3fb18`, parallel sub-agents per the repo's `skills/code-review`:
Standards + Spec), a live re-audit focused on the session-9 handoff's
suggested target — **the Nori chat deep surface** (the first live drive of
the chat exchange: message sent, reply rendered, bubbles computed) — plus the
prompt's headline mobile-navigation re-verification (toaster-cover mechanism
measured precisely), the from_url contract re-decoded with a query-carrying
URL, the hub headers (desktop AND the second mobile `<header>`) captured
open-state, and the mobile lessons sheet. The live bundle is UNCHANGED
(`assets/index-CkEI9gsZ.js` — same hash as session 9; every prior decode
stands). The scandihaven reference repo was re-consulted for tech-stack
patterns (Tailwind v4 CSS-first full-hex tokens, async `searchParams`,
vitest/playwright split — all already aligned; nothing new to adopt).

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or visual drift · **P2** polish/test-gap. The `skills/` folder
is excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S10-F1 | **The client-side from_url writers drop the QUERY STRING (and the live's absolute format).** The live's `navigateToLogin()` = `redirectToLogin(window.location.href)` — the FULL current URL rides, verified live with a query-carrying URL: the anonymous desktop pill at `/?q=parity&s10=1` routes to `login?from_url=https%3A%2F%2Fpersonalized-tutor-app.base44.app%2F%3Fq%3Dparity%26s10%3D1`; the mobile Sign In item carries the same absolute contract (`from_url=https%3A%2F%2F…%2F`). The clone's three writers (desktop pill, mobile item, onboarding Continue deferral) push `pathname` ONLY — an anonymous visitor at `/?course=X` loses the param through the login round-trip (post-login destination differs by entry point). NOTE: the live's SERVER-side auth-guard redirects (e.g. `/demo` → `login?from_url=%2Fdemo`) are path-only — the clone's server guards match those exactly and need NO change (two different writers, two contracts). | live probes (both entry points, query-carrying URL); clone `app-header.tsx:620,730` + `onboarding-dashboard.tsx:201` (pathname-only); `login/page.tsx:20` (the same-origin guard rejects absolute URLs — the open-redirect FIX, keep it) | **P1** |
| S10-F2 | **The Nori chat USER bubble is the wrong color pair.** The live's user bubble: bg `rgb(15, 14, 14)` (BLACK) + text `rgb(255, 255, 255)` (WHITE), classes `max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm font-light leading-relaxed`, computed radius `16px 16px 4px` (bottom-RIGHT tail — 3-value CSS: TL 16, TR 16, BR 4, BL 16), pad `10px 14px`, font `14px/300`. The clone renders the same classes/shape but YELLOW `rgb(255, 253, 115)` + dark text — a session-1-era invention never live-diffed until now. The assistant bubble matches (gray `rgb(240,240,240)`, `16px 16px 16px 4px`, dark text, `.prose` wrapper). Radii already match on both sides (the clone's 4-value `16px 16px 4px 16px` computes identically). Zero existing e2e pins assert the user bubble's color (verified — blast radius zero). | live computed-style probe (post-send DOM); clone `nori-chat.tsx:118-129` | **P1** |
| S10-F3 | **The chat send button ships the wrong icon at the wrong size.** The live: `lucide-send` (the paper plane) at `w-3.5 h-3.5` `text-white` `stroke-width 1.5` (paths `M14.536 21.686a.5.5…` + `m21.854 2.147-10.94 10.939` — VERIFIED identical in lucide-react 0.525, so a named import is safe — NOT a version-trap icon). The clone: a hand-rolled `lucide-arrow-up` SVG (`m5 12 7-7 7 7` + `M12 19V5`) at `h-4 w-4`. The button shell matches (`w-7 h-7 rounded-lg` → 12px pinned, bg black, `disabled:opacity-30`); the input row matches (`rounded-xl px-3 py-2` bg `rgb(240,240,240)`, placeholder "Ask Nori anything..."). | live probe (svg attrs + path data + lucide 0.525 source comparison); clone `nori-chat.tsx:169-179` | **P1** |
| S10-F4 | **The hub's back-links drop the `?course=` param.** The live's hub header logo (desktop) AND the mobile hub header's "Dashboard" link both href `/?course=demo-enrollment` (the CURRENT course rides back to the dashboard). The clone's equivalents href bare `/` — with multiple enrollments the clone's hub logo lands on the FIRST course, not the viewed one. Everything else in both hub headers matches exactly (desktop: lesson-title span + `h-4 w-px bg-black/20` divider + "Course" pill `border border-black px-4 py-1.5` + the "?" pill with its EMPTY span; mobile: `md:hidden` header, ChevronLeft `w-4 h-4` + "Dashboard" text-sm font-medium, spacer, Lessons pill `border border-black/20 px-3 py-1.5 text-xs` with `lucide-list w-3.5 h-3.5`). | live hub-header HTML (both viewports); clone `hub-app.tsx:150` + `:287` | **P2** |
| S10-F5 | **The hub "?" help-menu header renders the wrong identity.** The live's hub `?` menu is the m_ panel instantiated with NO user: yellow `p-3` header, `w-8 h-8` black circle containing the literal "?", then EMPTY `<p class="text-sm font-semibold">` + EMPTY `<p class="text-xs text-black/50">` (the empty-name m_ variant — the trigger's span is empty for the same reason). The clone renders the signed-in user's initial + full name + email — a plausible-looking invention that the live never shows on this surface. | live open-state capture (full panel HTML); clone `hub-app.tsx:247-256` | **P2** |
| S10-F6 | **The hub "?" help-menu's My Courses row uses the wrong icon.** The live: `lucide-layout-grid w-4 h-4 text-black` sw 1.5 (LayoutGrid — the SAME icon the root mobile menu and the desktop m_ panel use). The clone renders `List` (h-4 w-4 sw 1.5). The Log Out row matches (LogOut sw 1.5). | live icon extraction; clone `hub-app.tsx:264` | **P2** |
| S10-F7 | **The session-9 R5 consolidation is incomplete (two-axis review, Standards axis).** The plan called for ONE predicate consumed by both call sites; the shipped code has TWO: module-level `pendingInputsValid(pending: {mode, topic, courseName, contentText})` AND the component's inline `inputsValid` ternary (`mode === "topic" ? topic ≥ 2 : courseName ≥ 2 && materialText ≥ 20`) — the 2/2/20 literals live in BOTH with DIFFERENT field names (`contentText` vs `materialText`). Threshold copies went 3→2, not →1. | code review + `onboarding-dashboard.tsx:30-39,158-161` | **P2** |
| S10-F8 | **The from_url push template is duplicated ×3 (code review, Standards axis).** `router.push(\`/login?from_url=${encodeURIComponent(pathname ?? "/")}\`)` is hand-rolled twice in `app-header.tsx` (mobile item :620, desktop pill :730) and once in `onboarding-dashboard.tsx` (:201). The repo's "ONE hook" doctrine (cf. `use-dismiss`) says extract. Fixing F1 touches all three anyway — extract ONE pure helper. | code review | **P2** |
| S10-F9 | **The live's demo-course chat is EPHEMERAL across reloads; the clone's persists (documented divergence, keep).** Reload after the live chat exchange → the pane resets to the welcome message (the demo-enrollment is a VIRTUAL course; base44 entity writes are 403-blocked, so real-course persistence cannot be observed on the live either way). The clone persists ChatMessage rows (a documented README feature, e2e-pinned "Nori reply + persistence"). Doctrine: the clone's DB makes persistence possible — same call as the advancing hub. Document; no code change. | live reload probe (HISTORY PERSISTED: NO); clone README + dashboard.spec | — (documented) |
| S10-F10 | **The live's hamburger has NO aria-label; the clone's `aria-label="Open menu"` is the documented a11y improvement.** AGENTS.md §8 already declares interactive-row aria-labels intentional. Document as accepted divergence; no change. | live header HTML (no aria-label attr); clone `app-header.tsx` | — (documented) |
| S10-F11 | CONFIRMED MATCHING (no action): the anonymous mobile menu (items-only `p-2` + My Courses `lucide-layout-grid w-4 h-4 text-black` sw 1.5 + icon-less Sign In row, `min-width: 220px` panel `rounded-[16px] shadow-xl`); the authed no-course mobile menu (yellow `p-3` header, `w-8` avatar, `text-sm font-semibold` name, items `p-2`, rows `px-3 py-2.5 rounded-xl hover:bg-gray-50`); the hub course-pill panel (EMPTY items div + `border-t border-black/10` All Courses with the `w-7 h-7 rounded-lg bg-black/5` tile + `text-black/60` label — the clone matches class-for-class); the mobile lessons sheet (lilac `p-4` container, `All Lessons` uppercase header, active BLACK row with yellow `w-7` numbered circle + `rgba(255,255,255,0.5)` stage label + the yellow "Active" badge, rest rows `rgba(255,255,255,0.6)`); the bottom tab bar; the chat pane chrome (header `px-5 py-4 border-b` + 36px sage mascot + "Nori" + green dot + "Your AI Tutor"; input row; the assistant bubble; the welcome message string; the placeholder); **the live's toaster bug precisely re-measured** (two `fixed top-0 z-[100] w-full` containers at 390×32 with `pointer-events: auto` — `elementFromPoint(352,30)` at the hamburger's center IS the toaster; the live's menu cannot be tapped open — the clone's `pointer-events-none` fix + the real-tap e2e pins hold and remain the doctrine fix); the roadmap sub-labels ("4/6 lessons completed" on Course Progress vs "4/6 lessons" on Learning Roadmap — the clone has both variants); "Enter The Hub" as an `<a href="/hub?course=…">` + "Retake Quiz" button; the quiz-derived demo numbers (60% / 4/6 / 3 days / 750 XP); the `rounded-full` progress bar/circles on the live vs the clone's completed `rounded-[9999px]` sweep (grep: only a comment mention remains). | live drives + HTML/computed-style captures | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `loginRedirectUrl(pathname, search)`** — `src/lib/domain.ts`:
  `` `/login?from_url=${encodeURIComponent((pathname || "/") + (search || ""))}` ``
  — the ONE from_url writer template (S10-F1/F8). Pure; TDD pins in
  `tests/domain-session10.test.ts`: (a) ("/", "") → `/login?from_url=%2F`;
  (b) ("/", "?q=parity") → `/login?from_url=%2F%3Fq%3Dparity`;
  (c) ("/hub", "?course=demo-enrollment") →
  `/login?from_url=%2Fhub%3Fcourse%3Ddemo-enrollment`; (d) ("/onboarding", "")
  → `/login?from_url=%2Fonboarding`; (e) ("", "") → the "/" fallback;
  (f) ("/", "?") → a bare "?" appends without doubling.
- [x] **R1. `sameOriginRedirectTarget(raw, origin)`** — `src/lib/domain.ts`:
  the login page's from_url consumer (S10-F1). Relative same-app paths pass
  through ("/hub?course=d"); absolute URLs decode to `pathname+search` ONLY
  when `new URL(raw).origin === origin` (tolerating the live's absolute
  format); foreign origins, protocol-relative ("//"), malformed values, and
  empty → "/" (the open-redirect FIX the live ships as a vulnerability —
  clone doctrine: fix + pin). TDD pins: (a) "" → "/"; (b) "/hub?course=d" →
  unchanged; (c) "//evil.com" → "/"; (d) "https://h/x?q=1" with origin
  "https://h" → "/x?q=1"; (e) "https://evil.com/x" origin "https://h" → "/";
  (f) protocol mismatch → "/"; (g) hash-only stripping ("https://h/x#f" →
  "/x"); (h) "https://h/x" origin "http://h" → "/".
- [x] **R2. `onboardingInputsValid({mode, topic, courseName, contentText})`**
  — `src/lib/domain.ts` (S10-F7): ONE predicate, the ≥2/≥2/≥20 thresholds;
  `pendingInputsValid` is DELETED (the pickup calls the domain predicate with
  the pending payload; the component's inline ternary is replaced by a call
  mapping `materialText` → `contentText`). TDD pins: topic-mode ≥2 true/false,
  material-mode name ≥2 + text ≥20 matrix, whitespace-only rejection.

### Phase 2 — P1 component fixes

- [x] **R3. The user bubble colors** (`nori-chat.tsx:118-129`): bg →
  `rgb(15, 14, 14)`, color → `rgb(255, 255, 255)` (S10-F2). Radius/classes
  unchanged (already matching).
- [x] **R4. The send icon** (`nori-chat.tsx:169-179`): replace the hand-rolled
  arrow-up SVG with the lucide `Send` import at `w-3.5 h-3.5` strokeWidth 1.5
  (S10-F3 — paths verified identical across lucide 0.475/0.525; NO
  version-trap comment needed, cite the verification).
- [x] **R5. The three from_url writers** (S10-F1): `app-header.tsx` adds
  `useSearchParams()` (both the desktop pill :730 and the mobile item :620)
  and `onboarding-dashboard.tsx:201` — all three become
  `router.push(loginRedirectUrl(pathname, search))` (S10-F8 closed by the same
  edit). The `window.location.href`-vs-pathname note: the clone keeps the
  same-origin guard (R1) and writes RELATIVE path+search — the observable
  post-login destination is identical to the live's.

### Phase 3 — P2 fixes

- [x] **R6. The hub back-links** (`hub-app.tsx:150,287`): both href
  `/?course=${course.id}` when a course is active, bare `/` otherwise
  (S10-F4).
- [x] **R7. The hub "?" menu** (`hub-app.tsx:247-264`): the header becomes the
  empty-name m_ variant (avatar circle renders the literal "?", the name and
  email `<p>`s render empty — the live's own output), and the My Courses icon
  swaps `List` → `LayoutGrid` (S10-F5/F6).
- [x] **R8. The login page's from_url consumer** (`login/page.tsx:16-24`):
  replace the inline startsWith guard with `sameOriginRedirectTarget(from_url,
  origin)` (origin from `await headers()` host + x-forwarded-proto; R1). The
  post-login navigation in `login-card.tsx:51` stays `router.push(fromUrl)`.

### Phase 4 — E2E pins

- [x] **R9. `tests/e2e/session10-parity.spec.ts`** (authenticated
  storageState): (a) the chat user bubble computes `rgb(15, 14, 14)` bg +
  `rgb(255, 255, 255)` color after sending a message (no AI wait needed — the
  user bubble renders optimistically); (b) the send button carries
  `svg.lucide-send` with the `M14.536` path prefix at `w-3.5 h-3.5`; (c) the
  hub back-links: the desktop logo + the mobile "Dashboard" link both href
  `/?course=<seeded id>` at `/hub?course=<id>`; (d) the hub "?" menu: the
  header avatar renders "?", the name/email lines are empty, and the My
  Courses row's icon is `lucide-layout-grid`.
- [x] **R10. `tests/e2e/session10-public.spec.ts`** (logged-out file-level
  storageState): (e) the desktop anonymous Sign In pill at `/?q=parity` routes
  to `/login?from_url=%2F%3Fq%3Dparity` (the QUERY rides — the S10-F1 pin);
  (f) the login round-trip: `login?from_url=%2F%3Fq%3Dparity` + demo
  credentials → lands at `/?q=parity`; (g) the open-redirect fix:
  `login?from_url=https%3A%2F%2Fevil.example%2Fx` + login → lands at `/`
  (the security pin).
- [x] **R11. Full gate** — lint → typecheck → test (91 + ~15 new = ~106) →
  build → e2e (69 + ~7 new = ~76).

### Phase 5 — Docs, screenshots, delivery

- [x] **R12. Docs alignment**: AGENTS.md (the from_url full-URL contract + the
  same-origin fix, the black user-bubble invariant, the send-icon decode, the
  hub back-link/`?`-menu invariants, counts); CLAUDE.md (condensed
  session-10 invariants); README.md (the session-10 section + counts); PAD
  v1.9 `[S10]` revision block + the testing table;
  `personalized-tutor-app_SKILL.md` v1.9.0 (the new pins + the ephemeral-chat
  divergence note); `docs/session_10.md` (the session summary);
  `docs/remediation-plan-session-9.md` R5 note (the consolidation completed
  this session); repo `worklog.md`; `.env.example` re-verify (no new env
  vars).
- [x] **R13. Screenshots** (the new surfaces): the chat exchange with the
  BLACK user bubble + the Send icon (the S10-F2/F3 before-state capture
  already exists as live-s10-nori-chat.png — capture the clone's fixed
  state), the hub "?" menu open (the empty-name header), the query-carrying
  from_url chain (the login URL with the query).
- [x] **R14. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote git@github.com:nordeim/personalized-tutor-app.git`
  (paramiko shim; remote ref verified == HEAD; key shredded).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `nori-chat.tsx:118-129` — the user bubble's `backgroundColor:
   "rgb(255, 253, 115)"` + `color: "rgb(15, 14, 14)"` (R3 target) ✓; the
   assistant bubble at :104-110 stays gray/dark ✓; the sending indicator at
   :137-146 uses the GRAY bubble (correct — it's an assistant-side state) ✓.
2. `nori-chat.tsx:169-179` — the hand-rolled `lucide-arrow-up` SVG
   (`m5 12 7-7 7 7` + `M12 19V5`) at `h-4 w-4` (R4 target) ✓; the button
   shell (`h-7 w-7 rounded-lg bg-black disabled:opacity-30`) matches the live
   (`w-7 h-7 rounded-lg`) ✓; `Send` is NOT in the file's lucide import —
   add it ✓.
3. `app-header.tsx:4` — `usePathname, useRouter` imported, NO
   `useSearchParams` (R5 adds it) ✓; the two push sites at :620 (mobile item,
   inside MobileMenuBody which has its own `pathname` at :567) and :730
   (desktop pill, AppHeader's `pathname` at :677) ✓ — BOTH components need
   their own `useSearchParams()` call (they are separate components!) ✓.
4. `onboarding-dashboard.tsx:201` — the deferral push (R5's third site) ✓;
   `:30-39` pendingInputsValid + `:158-161` the inline ternary (R2 targets) ✓;
   the pickup at `:179` consumes `pendingInputsValid` ✓.
5. `login/page.tsx:16-24` — the inline guard (R8 target) ✓; the page is
   `force-dynamic` (headers() is legal) ✓; `login-card.tsx:51`
   `router.push(fromUrl || "/")` — with R8 the prop is always a valid
   same-app path ✓.
6. `hub-app.tsx:150` (`href="/"`, desktop logo) + `:287` (`href="/"`, mobile
   Dashboard link — aria-label="Dashboard") (R6 targets) ✓; `:247-256` the
   user-identity header + `:264` the List icon (R7 targets) ✓; LayoutGrid is
   NOT imported in hub-app.tsx (add) ✓; `course` is nullable —
   `course ? \`/?course=${course.id}\` : "/"` ✓.
7. E2E blast radius: `session9-public.spec.ts:18` pins
   `/login?from_url=%2F` from the bare root (no query → unchanged output
   under R5) ✓; `auth.spec.ts`'s pending-flow pins route through the
   deferral's `/login?from_url=%2Fonboarding` (no query at that URL) ✓;
   `dashboard.spec.ts:78` counts `.prose` bubbles (assistant-side — the user
   bubble color change doesn't affect it) ✓; no spec asserts the send icon,
   the user bubble, the hub back-link hrefs, or the `?` menu header ✓.
8. No Prisma schema changes, no new API routes, no new env vars — three pure
   domain helpers, five component tweaks, one login-page guard swap, tests,
   docs ✓.

Execution order note: Phase 1 (red) → Phase 2 (P1s) → Phase 3 (P2s) → unit
green → build → Phase 4 e2e → full gate → screenshots → docs → push.
