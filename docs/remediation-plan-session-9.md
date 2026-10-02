# Remediation Plan — Session 9

Repo state at start: `9eb54e9` (session-8 complete at `e270282` + the session-8
transcript commit; baseline gate green: lint ✓ typecheck ✓ 82 unit ✓ build ✓
64 e2e ✓ — re-verified fresh after the workspace reset: clone + `cp
.env.example .env` + `db:push` + `db:seed`).

Audit sources: a two-axis code review of the session-8 code commit
(`5ca9c4e...e270282`, parallel sub-agents per the repo's `skills/code-review`:
Standards + Spec), a live re-audit (agent-browser login + the ANONYMOUS
surfaces + a full lesson-1 completion drive on the live's `/demo` hub — the
first runtime drive of the quiz flow's terminal state), and fresh bundle
archaeology (`/assets/index-CkEI9gsZ.js`, 788 KB — the Y2/gO/yO/xO/qP/Ha
level machinery re-decoded). The stale shell `DATABASE_URL` trap re-armed
itself after the reset (`echo` showed the workspace-level file); every
dev/CLI command ran under `env -u DATABASE_URL`.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or visual drift · **P2** polish/test-gap. The `skills/` folder
is excluded from code checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S9-F1 | **The Hub's Lesson Progress label clamps at 8/8; the live computes `{answered + 1}/8` UNCLAMPED.** The live's sidebar card renders `[c+1,"/",d]` (qP decode) where `c` = the onProgressChange-reported correct count — at the 8th correct it shows **"9/8"** (observed on the live after completing lesson 1: the card read `9/8` during the Level-Up interstitial). The clone pins `Math.min(sessionAnswered + 1, 8)` → "8/8". A computed-value drift on the one surface every hub visit sees. | live runtime drive (the "9/8" observation); bundle `qP` (`children:[c+1,"/",d]`, `h=Math.round(c/d*100)`); clone `hub-app.tsx:127-128` | **P1** |
| S9-F2 | **The desktop anonymous Sign In pill drops the `from_url`.** The live's `Ha` header renders the pill with `onClick: () => m()` where `m = navigateToLogin` = `ge.auth.redirectToLogin(window.location.href)` — the CURRENT URL rides (the same contract as the onboarding deferral and the mobile Sign In item). The clone's desktop pill pushes plain `/login` while the mobile Sign In item correctly pushes `/login?from_url=<current>`. Post-login destination differs by entry point. | bundle `Ha` pill decode (`onClick:()=>m()`) + provider decode (`A=()=>{ge.auth.redirectToLogin(window.location.href)}`); clone `app-header.tsx:719` (`router.push("/login")`) vs `:620` (the mobile item's from_url) | **P1** |
| S9-F3 | **`/demo` omits `export const dynamic = "force-dynamic"`.** CLAUDE.md: "every page is `export const dynamic = "force-dynamic"` and resolves `getSessionUser()` server-side" — the session-8 diff converted `/demo` into a session-resolving page but skipped the export (the only session-gated page without it; benign via the cookie read, but the documented rule is explicit and `typecheck`/review are the guards). | code review (AUDIT-1a, HARD); clone `src/app/demo/page.tsx` (no `dynamic` export; all 5 sibling data pages declare it) | **P1** |
| S9-F4 | **The level-2/3 lesson-view surfaces have ZERO e2e coverage.** The tan Real-World Scenario card, the lilac Final Boss Challenge card, and the h2 = generated-title-on-levels-2/3 are implemented (session-3 bundle port) but never driven by any spec (the session-8 handoff's own suggested deep-audit target). The live's `yO`/`xO` decodes were re-verified this session: the scenario card renders `e.scenario && …` (CONDITIONAL on the AI returning a non-empty scenario), the challenge card `e.challenge && …`, the yO/xO h2 = `meta.title` (the generated title, NOT the subject), the context icons are lucide **Lightbulb/MapPin/Trophy** (t8/a8/yv decode) — the clone's ContextCard matches all of it, untested. | grep `tests/e2e` (zero hits for Real-World/Final Boss/Scenario); bundle yO/xO decodes; clone `lesson-view.tsx:574-628` | **P2** (test gap) |
| S9-F5 | **The mobile hasTouch pin for the ANONYMOUS public onboarding's guest menu is missing.** `auth.spec.ts` drives the public onboarding's mobile menu with `.click()` on a no-touch context (the comment says mobile-navigation owns the real-tap pin) — but `mobile-navigation.spec.ts` only pins the guest DEMO menu (S5-F9), not the anonymous onboarding's items-only variant. | code review (AUDIT-1b); `auth.spec.ts:41-45` vs `mobile-navigation.spec.ts` (no anonymous-root test) | **P2** (test gap) |
| S9-F6 | **Judgement-call cleanups (two-axis review, all verified in code):** (a) 7 hand-copied inline-SVG icon constants in `course-dashboard.tsx` (~80 lines: BOOK_ICON/BOOK_ICON_SM/TROPHY_ICON/BRAIN_ICON/BRAIN_ICON_SM/SPARKLE_ICON + the **dead LESSON_ICON** — a Play icon defined at line 124 and used NOWHERE); lucide-react exports the identical components (path parity verified: lucide 0.525's Brain = 9 paths = the live's probed `d` data); (b) the onboarding validity thresholds (≥2/≥2/≥20) duplicated across `canContinue` (2 branches) and the pickup effect's inverted guards; (c) the challenge overlay keeps the dead `bg-black/50` class alongside the winning inline rgba (Trap 8 normalization — two sources of truth, one inert); (d) `dashboard-app.tsx:116`'s `user ?? { name: "Guest", email: "guest@thinkerwell.demo" }` null-object is unreachable (`showCourseDashboard` requires a user) — dead code fabricating a magic account. | code review (AUDIT-1a) + manual verification of every site | **P2** |
| S9-F7 | **Stale/conflicting docs + the session-9 hub decodes need recording.** (a) `docs/remediation-plan-session-8.md` R1 claims the anonymous Sign In pill renders "at ALL widths … NOT inside the `hidden md:flex` block" — **live-verified FALSE this session**: the pill IS inside `hidden md:flex items-center gap-3`; at 390×844 the parent computes `display: none` and the pill's `offsetParent` is null (the CODE's desktop-only placement is CORRECT — the session-8 transcript's mid-flight "Correction" note was right; the plan text was never updated). (b) The hub level machinery re-decode: the live's sidebar `activeLessonIndex` is NEVER written after mount (the setter is called only in the course-change reset; locked rows are unclickable; the `qP` receives `activeLevel`/`levelingUp` as DEAD props) — the live's hub **dead-ends after lesson 1's completion** (observed: "Lesson 1 · Now" + "8/8 correct" stuck behind the Level-Up interstitial; the level-up only persists the StudySession's `active_level`). The clone's advancing 6-lesson flow remains the documented doctrine fix ("where the reference ships a bug the clone fixes it AND pins the fix"). The decode correction (level-up fires per Y2 completion with `C < 3`, not "at lessons 1|3" per se) goes into the docs. | live probes (computed display/offsetParent); bundle decodes (qP dead props, G-only-at-reset, `ie` = `C<3` branch) | **P2** (docs) |
| S9-F8 | CONFIRMED MATCHING (no action): the anonymous mobile header + items-only menu (My Courses + Sign In, no name header — structure AND computed styles); the authed mobile menu (yellow name header + My Courses + Log Out); **the live toaster bug still covers the hamburger** (agent-browser refuses the covered click — the clone's pointer-events fix + e2e pins hold); the lesson-view header (`Lesson {n}` + the h2 + `{correct}/8 correct` + the w-24 bar — gO decode, class-for-class); the context-card conditional rendering (`scenario &&` / `challenge &&`); the context icons (Lightbulb/MapPin/Trophy at w-4 h-4 sw 1.5); the mobile lessons-sheet labels (`Stage N · Level N` — `stageLevelLabel` matches); the mobile hub tab bar (Learn active #FFFD73 / Ask Nori / Lessons, py-3.5); the hub default-grid for the unowned `?course=` (the live's demo-enrollment renders Introduction/Key Concepts/… exactly like the clone's R8 fix); the quiz auto-advance + retry + requeue flow (driven live through a full lesson: 1000 ms reveal → 800 ms advance observed; the requeue appends at the END; 8 correct → Level Up interstitial "Preparing Lesson 1…" = `Preparing Lesson {level}` — the clone's `{level + 1}` renders the identical string); the gO option grid + reveal colors (#BCFCAF/#FFD0D0/40%); the Nori chat pane structure. | live drives + bundle decodes | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `lessonProgressLabel` + `lessonProgressPct` helpers** —
  `src/lib/domain.ts`:
  `lessonProgressLabel(answered)` = `` `${answered + 1}/8` `` **UNCLAMPED**
  (the live's qP `[c+1,"/",d]` — answered 8 renders "9/8", the observed
  live value) and `lessonProgressPct(answered)` = `Math.round(answered/8*100)`
  (the live's `h` formula — no clamp; answered never exceeds 8 because the
  lesson completes at 8). TDD: `tests/domain-session9.test.ts` pins
  (a) 0 → "1/8"; (b) 3 → "4/8"; (c) 7 → "8/8"; (d) **8 → "9/8"** (the live's
  observed over-8 label); (e) pct 0 → 0, 4 → 50, 8 → 100; (f) the CLAMP-REMOVAL
  contract (the label is a pure string of `answered + 1` — no Math.min).

### Phase 2 — P1 fixes

- [x] **R1. The Lesson Progress card** (`src/components/hub/hub-app.tsx`):
  replace `Math.min(sessionAnswered + 1, 8)` and
  `Math.round((Math.min(sessionAnswered, 8) / 8) * 100)` with the two domain
  helpers (S9-F1). The card now reads "9/8" during the completion/interstitial
  window exactly like the live.
- [x] **R2. The desktop Sign In pill's from_url**
  (`src/components/layout/app-header.tsx:~719`): the onClick becomes
  `router.push(\`/login?from_url=${encodeURIComponent(pathname ?? "/")}\`)`
  (S9-F2 — the live's `navigateToLogin` = `redirectToLogin(window.location.href)`
  contract; same as the mobile Sign In item one screen over).
- [x] **R3. `/demo` force-dynamic** (`src/app/demo/page.tsx`): add
  `export const dynamic = "force-dynamic";` (S9-F3 — the documented
  every-session-resolving-page rule).

### Phase 3 — P2 cleanups (AUDIT-1a judgement calls, all verified)

- [x] **R4. Icon-constant dedup** (`src/components/dashboard/course-dashboard.tsx`):
  ~~replace the 6 used hand-copied SVG constants with lucide-react
  components~~ — **REVISED mid-execution**: the lucide path comparison
  revealed BookOpen AND Trophy were REDESIGNED upstream between the live's
  0.475 and the clone's 0.525 (0.475 BookOpen `M2 3h6…` vs 0.525 `M12
  7v14…`), so lucide imports would CHANGE the rendered strokes and break
  the session-8 e2e icon pins. Executed instead: ONE parameterized local
  component per shape (BookOpenIcon/TrophyIcon/BrainIcon/SparklesIcon with
  a className prop — the paths stay verbatim), the 6 size constants now
  derive from the 4 components, **the dead LESSON_ICON (a Play icon used
  nowhere) is DELETED**, and the why-not-lucide comment documents the
  version-drift trap (Brain/Sparkles paths happen to be identical across
  versions but ride the same pattern for consistency).
- [x] **R5. Onboarding validity dedup**
  (`src/components/dashboard/onboarding-dashboard.tsx`): extract ONE
  `onboardingInputsValid({ mode, topic, courseName, contentText })` predicate
  (module-level, or domain.ts if pure-pinnable) consumed by BOTH
  `canContinue`'s branches AND the pickup effect's guards (S9-F6b — three
  copies of ≥2/≥2/≥20 drift risk). NOTE: `pending.name` STAYS in the stored
  payload — the sessionStorage schema (`{name, content_source, …}`) is the
  live's own contract; the pickup ignoring it is the decoded
  account-name-wins behavior. Add the why-comment.
  *(Session-10 completion: this landed as TWO predicates with different
  field names — the consolidation was finished in session-10 as
  `onboardingInputsValid` in `domain.ts` with unit pins; see
  `docs/remediation-plan-session-10.md` R2.)*
- [x] **R6. Challenge overlay dead class** (`course-dashboard.tsx:345`): drop
  the `bg-black/50` class, keep the inline `rgba(0, 0, 0, 0.5)` + the Trap 8
  comment (S9-F6c — one source of truth).
- [x] **R7. Dead null-object** (`dashboard-app.tsx:116`): the CourseDashboard
  branch requires a user — drop the unreachable
  `?? { name: "Guest", email: "guest@thinkerwell.demo" }` fallback (narrow
  with `user &&` in the JSX condition so the prop stays honestly typed;
  S9-F6d).

### Phase 4 — E2E pins (S9-F4/F5)

- [x] **R8. `tests/e2e/session9-parity.spec.ts`** (authenticated
  storageState): (a) `/hub?course=<seeded>&lesson=2` renders the LEVEL-2
  surface: the tan Real-World Scenario context card (label + computed
  `rgb(225, 200, 185)`) AND the h2 ≠ the subject (the generated-title
  contract — the fallback's "{subject} In Practice" and any AI title both
  satisfy the ≠ assertion); (b) `?lesson=4` renders the LEVEL-3 surface: the
  lilac Final Boss Challenge card (label + `rgb(210, 192, 249)`); (c) the
  desktop anonymous Sign In pill navigates to `/login?from_url=%2F` (the
  R2 pin — desktop viewport, click the pill, assert the URL); (d) the
  Lesson Progress label pins: fresh lesson = "1/8" (already pinned
  elsewhere — keep the R1 regression pin asserting the UNCLAMPED label via
  the unit suite; the e2e asserts "1/8" on load at lesson=2 as the formula's
  observable seam). Mobile (390, hasTouch): (e) the anonymous public
  onboarding's guest menu — REAL `.tap()` on the hamburger, the panel shows
  My Courses + Sign In with NO name header (the S9-F5 gap —
  mobile-navigation.spec gains the anonymous-root test).
- [x] **R9. Full gate** — lint → typecheck → test (82 + ~6 new = ~88) →
  build → e2e (64 + ~5 new = ~69).

### Phase 5 — Docs, screenshots, delivery

- [x] **R10. Docs alignment**: `docs/remediation-plan-session-8.md` R1 text
  corrected (the pill IS desktop-only — quote the live probe); AGENTS.md (the
  Lesson Progress unclamped invariant + the level-machinery decode + the
  Sign In from_url contract); CLAUDE.md (condensed invariants); README.md
  (counts + the session-9 section); PAD v1.8 [S9] revision block;
  `personalized-tutor-app_SKILL.md` v1.8.0 (the new pins);
  `docs/session_9.md` (the session summary); repo `worklog.md`;
  `.env.example` re-verify (no new env vars).
- [x] **R11. Screenshots**: the level-2 Real-World card + the level-3 Final
  Boss card (the never-before-captured surfaces), the public onboarding
  desktop pill post-R2 (the from_url login URL), the hub Lesson Progress
  "9/8" terminal state.
- [x] **R12. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote git@github.com:nordeim/personalized-tutor-app.git`
  (paramiko shim; remote ref verified == HEAD; key shredded).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `hub-app.tsx:127-128` — `Math.min(sessionAnswered + 1, 8)` +
   `Math.round((Math.min(sessionAnswered, 8) / 8) * 100)` (R0/R1 targets) ✓;
   the card renders `{lessonProgressLabel}` at line 309 — a two-line swap to
   the helpers.
2. `app-header.tsx:719` — the desktop pill's `onClick={() =>
   router.push("/login")}` (R2 target) ✓; the mobile item's from_url pattern
   at line 620 (`router.push(\`/login?from_url=${encodeURIComponent(pathname
   ?? "/")}\`)`) is the exact template to copy ✓; `usePathname` is already
   imported (the mobile item uses it).
3. `src/app/demo/page.tsx` — no `dynamic` export (R3 target) ✓; the 5 sibling
   pages (`/`, `/onboarding`, `/courses`, `/quiz`, `/hub`) all declare it ✓.
4. `course-dashboard.tsx:55-131` — the 7 icon constants (R4 targets) ✓; the
   lucide imports already exist in the file? NO — Brain/BookOpen/Trophy/
   Sparkles must be added to the lucide-react import list; LESSON_ICON
   confirmed unused (grep `LESSON_ICON}` = 0 hits) ✓.
5. `onboarding-dashboard.tsx:139-146 + 158-161` — the threshold duplication
   (R5 target) ✓; the pickup at 155-169 never reads `pending.name` ✓ (the
   field stays for payload parity — comment only).
6. `course-dashboard.tsx:345-349` — the dead `bg-black/50` + inline rgba pair
   (R6 target) ✓.
7. `dashboard-app.tsx:116` — the Guest null-object (R7 target) ✓; the
   condition `showCourseDashboard && activeCourse` at ~114 guards the branch
   (add `&& user`).
8. E2E blast radius: the R2 change (desktop pill from_url) breaks NO existing
   pin (auth.spec asserts the pill's existence/shape, not its URL... verify:
   `auth.spec.ts` clicks the pill? grep "Sign In" in auth.spec — the
   anonymous-root test asserts visibility; the mobile-menu Sign In item's
   from_url pin (`login?from_url=%2F`) targets the MOBILE item, unaffected).
   The R1 label change: session2-parity's "1/8" pin unaffected (0 → 1/8 both
   formulas); the "9/8" only appears post-completion (no existing e2e drives
   that far). The R4 icon swap: session8-parity's icon pins assert path `d`
   prefixes + computed widths — lucide renders the same paths (verified) —
   but the hand-copied SVGs carry `style={{ color: ... }}`? LESSON_ICON did
   (dead); the 6 used ones carry only className ✓.
9. No Prisma schema changes, no new API routes, no new env vars — one domain
   helper pair, one component label fix, one onClick fix, one page export,
   icon/threshold/null-object cleanups, tests, docs ✓.

Execution order note: Phase 1 (red) → Phase 2 (P1s) → Phase 3 (cleanups) →
unit green → build → Phase 4 e2e → full gate → screenshots → docs → push.
