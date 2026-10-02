# Session 10 — The Chat-Surface Parity Pass

Continuing from session 9 (`ef3fb18` + the log commits; the full gate stood
at 91 unit + 69 e2e). This session re-ran the full audit → plan → TDD →
gate → push cycle with the live's **Nori chat surface** as the deep-audit
target (the session-9 handoff's own suggestion) — plus the prompt's
headline mobile-navigation re-verification.

## What was audited

- **Workspace refresh:** `git pull` → `28e0c26` (docs/session_10.md = the
  session-9 transcript, per the handoff convention). The workspace
  PERSISTED from session 9 — `.env` + `db/custom.db` at the repo root
  (DATABASE_URL=`file:../db/custom.db`, per the prompt's requirement) +
  `node_modules` all verified in place. Baseline gate re-confirmed green:
  lint ✓ typecheck ✓ 91 unit ✓ build ✓ 69 e2e ✓. The stale shell
  `DATABASE_URL` trap re-armed itself — every command ran under
  `env -u DATABASE_URL`.
- **The live bundle is UNCHANGED** (`assets/index-CkEI9gsZ.js` — the same
  hash session 9 decoded), so every prior decode stands; the audit targeted
  surfaces, not the bundle.
- **Two-axis code review** of the session-9 code commit (`ef3fb18`,
  parallel sub-agents per `skills/code-review`): zero HARD violations; the
  judgement calls — the R5 consolidation incomplete (the 2/2/20 thresholds
  in TWO predicates with different field names), the from_url push
  template duplicated ×3, and the `usePathname()`-vs-`window.location.href`
  decode gap — all folded into the plan.
- **The live re-audit — the Nori chat driven through a real exchange**
  (the first time beyond structure probes): logged in, drove
  `/hub?course=demo-enrollment`, sent a message, captured the reply, and
  computed the bubble styles. **The user bubble is BLACK `#0F0E0E` with
  WHITE text** (radius `16px 16px 4px`, pad 10px 14px, font 14/300) — the
  clone's yellow bubble was a session-1 invention. **The send button
  carries lucide's Send paper plane** at w-3.5 h-3.5 sw 1.5 (paths
  verified IDENTICAL across the live's 0.475 and the clone's 0.525 — the
  ONE safe lucide import). The assistant bubble, input row, welcome
  message, and chat chrome all matched. Reload → the live's demo-course
  chat is EPHEMERAL (the clone's persistence stays the documented
  divergence).
- **The from_url contract re-decoded with a query-carrying URL:** the
  anonymous desktop pill at `/?q=parity&s10=1` routes to
  `login?from_url=https%3A%2F%2F…%2F%3Fq%3Dparity%26s10%3D1` — the FULL
  absolute URL (path AND query); the mobile Sign In item carries the same
  contract. The clone's three writers were pathname-only (the query was
  dropped through the login round-trip). The server-side auth guards are
  path-only on BOTH sides (a different writer, a matching contract — no
  change).
- **The hub headers fully decoded** (including the SECOND, mobile
  `<header>` earlier probes missed): the desktop logo AND the mobile
  "Dashboard" link both href `/?course={current}` (the clone's bare `/`
  would land on the FIRST enrollment); the "?" menu is the m_ panel
  instantiated with NO user — the yellow `p-3` header renders the literal
  "?" avatar + EMPTY name/email lines, and the My Courses icon is
  **LayoutGrid** (the clone's user-identity header + List icon were
  inventions). The mobile lessons sheet, tab bar, course-pill panel, and
  both mobile menus re-verified matching.
- **The mobile-nav headline re-verified with the mechanism measured:** the
  live's toaster bug precisely quantified — two `fixed top-0 z-[100] w-full`
  containers at 390×32 with `pointer-events: auto`; `elementFromPoint` at
  the hamburger's center (352,30) IS the toaster div; the live's menu
  cannot be tapped open. The clone's `pointer-events-none` fix + the
  real-tap e2e pins hold (the doctrine fix). The live's hamburger has no
  aria-label — the clone's is the documented a11y improvement.

## What was executed (TDD)

1. **Phase 1 (RED → GREEN, 91 → 108 unit):** three pure helpers in
   `domain.ts` pinned by `tests/domain-session10.test.ts` (17 checks) —
   `loginRedirectUrl(pathname, search)` (the ONE from_url writer; the
   query rides; the search-normalization contract),
   `sameOriginRedirectTarget(raw, origin)` (the login's consumer; the
   open-redirect fix), and `onboardingInputsValid` (the R5 completion).
2. **Phase 2 (P1s):** the user bubble → black + white text (nori-chat.tsx);
   the send button → lucide `Send` at w-3.5 h-3.5 sw 1.5; the three
   from_url writers → `loginRedirectUrl(pathname, search)` with
   `useSearchParams()` added to both app-header components and the
   onboarding dashboard.
3. **Phase 3 (P2s):** the hub back-links carry `?course={id}` (desktop
   logo + mobile Dashboard link); the hub "?" menu → the empty-name m_
   variant ("?" avatar + empty lines) + LayoutGrid icon (the now-dead
   `user` prop removed from HubApp + the hub page); the login page's
   guard → `sameOriginRedirectTarget` (headers-derived origin).
4. **Phase 4 (e2e, 69 → 76):** `session10-parity.spec.ts` (the BLACK
   user-bubble computed styles + the identical computed radius string, the
   Send icon's path + size pins, the back-link hrefs, the "?"-menu
   structure) + `session10-public.spec.ts` (the query-carrying from_url
   chain, the post-login query round-trip, the foreign-origin
   open-redirect rejection).
5. **Full gate green:** lint ✓ typecheck ✓ 108 unit ✓ build ✓ 76 e2e ✓;
   runtime re-probes confirmed every fix computed-identical to the live
   (bubble bg/color/radius, icon class + path, hrefs, the "?" header, the
   from_url chain); screenshots 75-78 captured.

## Docs aligned

`docs/remediation-plan-session-10.md` (11 findings + 14 TODOs executed),
`docs/remediation-plan-session-9.md` (the R5-completion note), AGENTS.md
(the chat-bubble split, the from_url full contract + the open-redirect fix,
the hub header invariants, the one-predicate rule, counts 108/76),
CLAUDE.md (the session-10 invariants), README.md (the session-10 section +
counts), PAD v1.9 `[S10]` + the testing table, SKILL.md v1.9.0 (traps
30-31), this file, and the repo `worklog.md`. `.env.example` re-verified
(no new env vars).

## Delivery

Conventional commit on `main`; push via `docs/ssh_git_wrapper_v3.py`
--remote `git@github.com:nordeim/personalized-tutor-app.git` (paramiko
shim; remote ref verified == HEAD; key shredded).

## Headline outcomes

1. **The chat's user bubble was the wrong color since session 1** — the
   live's BLACK + white-text bubble is now computed-style-pinned; the
   yellow bubble and the arrow-up icon were unexamined inventions, not
   decodes.
2. **The from_url contract is now query-carrying end-to-end** — and the
   open-redirect vulnerability the live ships is FIXED and pinned (foreign
   origins collapse to `/`): the fix-and-pin doctrine applied to a
   security bug.
3. **The hub's back-links and "?" menu match the live exactly** — the
   course param survives the hub → dashboard trip, and the "?" menu's
   empty-name header (an odd-looking live quirk) is faithfully reproduced
   instead of "helpfully" filled in.
4. **The mobile-nav headline is re-verified with the mechanism measured** —
   the live's menu is verifiably untappable (the toaster covers the tap
   point); the clone's fix holds and the doctrine is documented.
5. **The gate grew again: 108 unit + 76 e2e, all green.**
