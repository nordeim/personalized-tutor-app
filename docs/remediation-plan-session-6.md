# Remediation Plan — Session 6

Repo state at start: `4fe8a2d` (session-5 chrome-polish pass complete at `3907e09`,
plus the session-6 transcript commit; gate green: lint ✓ typecheck ✓ 65 unit ✓
build ✓ 45 e2e ✓).

Audit sources: live-app re-login (sepnetflix2023@outlook.com — account still in the
onboarding state with 0 courses; with-course surfaces studied on `/demo` and
`/hub?course=demo-enrollment`), driven DOM inspections at 1280×800 and 390×844
(onboarding dashboard, the p_ and m_ dropdowns desktop + mobile, the MOBILE
hamburger panel in both no-course and guest states, `/courses` empty state + Add
tile, the guest hub desktop + mobile header/tab bar/Lessons pill, hero computed
margins, typewriter rotation across reloads, /demo roadmap across THREE reloads),
computed-style probes (the `rounded-full` = 9999px trap on both sides) — PLUS a
two-axis code review of `c7cd576...HEAD` (Standards: AGENTS/CLAUDE/SKILL + Fowler
smell baseline; Spec: remediation-plan-session-5) run as parallel sub-agents, and
fresh bundle decodes from `clone-workspace/recon/live-index.js` (the Plus icon
path `C8`, the CO card's `tr`/`gv` icon strokes, the m_ chevron variants).

Legend — Severity: **P0** visible behavior/structure wrong vs the reference · **P1**
data/semantics drift · **P2** polish. The `skills/` folder is excluded from code
checking, testing and compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S6-F1 | The `/courses` Add-a-Course tile's inline Plus SVG ships a **typo'd path** — `M12 5v19` (the vertical stroke runs to the 24px viewBox bottom edge, visibly longer than a lucide Plus) and `strokeWidth="1.5"`. The live renders the lucide-canonical `M12 5v14` at `strokeWidth 2` (`lucide-plus w-4 h-4`) | live `/courses` DOM probe vs `src/components/courses/courses-app.tsx:209-211`; bundle `C8=[["path",{d:"M5 12h14"...],["path",{d:"M12 5v14"...]]` | P2 |
| S6-F2 | The CO course-card **ChevronRight renders strokeWidth 1.5**; the bundle's usage carries NO strokeWidth prop (lucide default **2**). Every other CO icon is correct (Trash2 1.5 ✓, subject icons 1.5 ✓, tile `w-10 h-10 rounded-[12px]` ✓) | bundle decode `p.jsx(tr,{className:"w-5 h-5 text-black/30 flex-shrink-0"})` (no strokeWidth); clone `courses-app.tsx:178` | P2 |
| S6-F3 | The UserMenu pill chevron renders `strokeWidth="1.5"` for BOTH variants. The live renders **sw 2 on the with-course trigger** (`/demo`) and **sw 1.5 on the no-course trigger** (`/`) — two components in the reference, one conditional in the clone | live DOM probes: `/demo` pill `stroke-width="2"`, `/` pill `stroke-width="1.5"`; clone `app-header.tsx:468-477` | P2 |
| S6-F4 | `useDismissOnOutsideClick` lives module-private inside `app-header.tsx` (session-5 extracted the app-header-internal triplication but could not be reused cross-module); `hub-app.tsx` still hand-rolls its own outside-click effect covering BOTH menus (courseMenu + helpMenu). The consolidation the session-5 plan intended is incomplete | code review (Duplicated Code); `hub-app.tsx:80-91`, `app-header.tsx:78-96` | P2 |
| S6-F5 | The typewriter timings are raw magic numbers inline in `onboarding-dashboard.tsx` (`2000`, `60`, `50`, `0`), while the repo precedent (lesson-view) pins behavioral timings as named module constants (`ANSWER_FEEDBACK_MS`, `ADVANCE_MS`, …) | code review; `lesson-view.tsx:69-72` vs `onboarding-dashboard.tsx` `useTypewriter` | P2 |
| S6-F6 | **E2E coverage gap (R15 partial):** the mobile Switch Course test asserts label + 2 rows + navigation + no-Update-Preferences but NEVER asserts the **Check marks the current course** (or its absence on the non-current row); and there is NO negative pin (1 enrollment → the section must not render) | spec-axis review; `tests/e2e/mobile-navigation.spec.ts:66-102` | P1 |
| S6-F7 | `courses-app.tsx:155` keeps an inline `c.contentSource === "custom" ? "Custom Material" : "AI-Generated Course"` predicate. NOTE: this matches the live EXACTLY (the bundle renders `e.content_source==="custom"` — custom ONLY, unlike `isCustomSource` = custom‖material used by the p_ icon). The fix must NOT change behavior: extract a behavior-identical `courseSourceLabel()` domain helper so the intentional predicate split is named and unit-pinned | bundle decode CO card; code review (Repeated predicate) | P3 |
| S6-F8 | CoursePill and AppHeader-mobile pass fresh arrow identities for `onDismiss` (the hook re-subscribes the document listener every render); UserMenu correctly memoizes with `useCallback`. Normalize | code review; `app-header.tsx:122, 673` vs `:440-443` | P3 |
| S6-F9 | **Plan-text drift in `remediation-plan-session-5.md`:** R17's letter says "the header pill name … shows the new value", but the executed name-split (panel = `student.name`, pill = `user.name`; the rename targets the Student row) supersedes it — the e2e pins the honest behavior while the plan file's letter was never amended. R0's heading also names a `mobileContextLine` helper that was (deliberately) not extracted. Amend with a session-6 addendum so the plan reflects what shipped and why | spec-axis review | P3 |
| S6-F10 | CONFIRMED MATCHING (no action): the mobile menu in ALL states (no-course: name-only header, p-2 items; guest /demo: subject context `text-black/60` + the live's real-session-name quirk documented; Switch Course: label geometry, BookOpen/Check structure, row navigation to `/?course=` — runtime-verified with 2 API-generated courses); the hamburger tap WORKS (toaster fix; the live STILL ships the bug — agent-browser refuses the covered click); computed radius `9999px` on the clone vs the live (zero `rounded-full` residue in `src/`); the p_ panel (trigger `px-4 py-1.5` + chevron sw 2, empty state, All Courses + dashed-border Add tile at sw 2); `/courses` empty state + Add tile classes; the guest hub desktop + mobile (header lesson-title span, Course + "?" pills at sw 2, bottom tab bar colors, Lessons pill `lucide-list sw 1.5`); hero computed margins (h1 mb 0 / sub mt 12px); date formatting; quote-pool randomization; typewriter topic rotation | DOM probes + computed-style diffing both sides | — |
| S6-F11 | ACCEPTED DIVERGENCES (documented, do not "fix"): the live `/demo` roadmap + daily-challenge question are **AI-generated PER VISIT** (across three reloads the stage-1 title alternated "Microeconomic Foundations" ↔ "Foundations of Microeconomics" with different descriptions) — the clone's static sample is within the observed output space; the live hub hangs at "Generating Lesson 1 content..." (live fragility — the clone's fallback doctrine is the correct response); the live `/demo` reads the REAL session user (the clone shows "Guest" — stateless mirror) | live reload probes | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `courseSourceLabel` helper** — `src/lib/domain.ts`:
  `courseSourceLabel(source)` = `source === "custom" ? "Custom Material" :
  "AI-Generated Course"` (behavior-identical to the live's CO predicate — custom
  ONLY; deliberately distinct from `isCustomSource`, which the p_ icon uses).
  TDD: `tests/domain-session6.test.ts` pins the four branches ("custom" →
  "Custom Material", "material" → "AI-Generated Course", "topic" →
  "AI-Generated Course", null → "AI-Generated Course") + a pin that it is NOT
  `isCustomSource` (the "material" case documents the intentional split).

### Phase 2 — Icon parity (S6-F1/F2/F3)

- [x] **R1. `/courses` Add tile Plus** (`courses-app.tsx`): replace the typo'd
  inline SVG with the imported lucide `Plus` at `strokeWidth 2`, `h-4 w-4`
  (canonical `M12 5v14` path; also removes the last hand-inlined icon in the
  file).
- [x] **R2. CO card ChevronRight** (`courses-app.tsx:178`): `strokeWidth 2`
  (the live relies on lucide's default).
- [x] **R3. UserMenu pill chevron** (`app-header.tsx`): conditional
  `strokeWidth={student ? 2 : 1.5}` (the with-course trigger renders sw 2, the
  no-course trigger sw 1.5 — the live's two-component split as one conditional).

### Phase 3 — Code quality (S6-F4/F5/F7/F8)

- [x] **R4. `useDismissOnOutsideClick` extraction**: move the hook from
  `app-header.tsx` to `src/components/layout/use-dismiss.ts` (exported);
  app-header's CoursePill/UserMenu/AppHeader-mobile import it; **hub-app.tsx
  drops its hand-rolled effect** and consumes the hook twice (courseMenu +
  helpMenu refs). No behavior change (same mousedown + contains semantics).
- [x] **R5. Typewriter named constants** (`onboarding-dashboard.tsx`):
  module-level `TYPEWRITER_TYPE_MS = 60`, `TYPEWRITER_DELETE_MS = 50`,
  `TYPEWRITER_HOLD_MS = 2000` (the lesson-view `ANSWER_FEEDBACK_MS` precedent)
  consumed by `useTypewriter`.
- [x] **R6. courses-app label routing**: `c.contentSource === "custom" ? …`
  → `courseSourceLabel(c.contentSource)` (R0 helper).
- [x] **R7. `onDismiss` memoization**: CoursePill + AppHeader-mobile wrap the
  dismiss callback in `useCallback` (UserMenu pattern) so the document listener
  is not re-subscribed per render.

### Phase 4 — Tests (TDD), gate

- [x] **R8. Unit**: `tests/domain-session6.test.ts` (R0 pins) — RED first
  (65 → 69), then GREEN.
- [x] **R9. E2E — Switch Course assertions** (`mobile-navigation.spec.ts`):
  (a) in the 2-course test, assert the Check icon count = 1 on the CURRENT
  course row (the last generated) and 0 on the other; (b) NEW negative pin:
  the demo user (1 enrollment) sees NO "Switch Course" label in the mobile
  menu.
- [x] **R10. Full gate** — lint → typecheck → test (unit) → build → e2e (all
  green; expected 69 unit + 46 e2e).

### Phase 5 — Docs, screenshots, delivery

- [x] **R11. Plan addendum (S6-F9)**: append a session-6 note to
  `remediation-plan-session-5.md` recording the R17 supersession (the name-split
  decode) and R0's `mobileContextLine` non-extraction.
- [x] **R12. Screenshots 51+**: the fixed `/courses` Add tile (empty + with
  courses), the CO card row, the with-course m_ chevron, the mobile menu
  (2-course Switch Course state), spot-check the hub.
- [x] **R13. Docs alignment**: AGENTS.md (icon-stroke invariants + the
  courseSourceLabel/isCustomSource split + shared dismiss hook), CLAUDE.md
  (same), README.md (counts + session-6 section), PAD v1.5 [S6] revision
  block, `personalized-tutor-app_SKILL.md` v1.5.0, `docs/session_6.md`,
  repo `worklog.md`. `.env.example` re-verify (no new env vars expected).
- [ ] **R14. Commit + push** — Conventional Commit on main (fix:/refactor:
  style — NOT a bare "update" message), push via `docs/ssh_git_wrapper_v3.py`
  (paramiko shim at `/home/z/my-project/bin/ssh`).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `courses-app.tsx:209-211` — the inline `<svg … strokeWidth="1.5" …><path
   d="M5 12h14" /><path d="M12 5v19" /></svg>` (R1 target; the `v19` typo
   confirmed against the bundle's `C8` `M12 5v14`) ✓.
2. `courses-app.tsx:178` — `<ChevronRight … strokeWidth={1.5} />` (R2 target)
   ✓; line 155 the inline label predicate (R6 target) ✓.
3. `app-header.tsx:468-477` — the pill chevron `strokeWidth="1.5"` hardcoded
   (R3 target); line 78-96 the module-private hook (R4 source); line 122 + 673
   the fresh-arrow onDismiss calls (R7 targets) ✓.
4. `hub-app.tsx:80-91` — the hand-rolled combined effect (R4 consumer) ✓.
5. `onboarding-dashboard.tsx` useTypewriter — raw `2000/60/50/0` numbers (R5
   target; lesson-view.tsx:69-72 is the named-constant precedent) ✓.
6. `tests/e2e/mobile-navigation.spec.ts:66-102` — the 2-course test navigates
   via the Astronomy row while Chemistry (the LAST generated) is the current
   course → the Check belongs on Chemistry (R9a target); no negative pin
   exists (R9b target; the demo user's 1-enrollment `/` state is the fixture) ✓.
7. No Prisma schema changes, no new API routes, no new env vars —
   icon/stroke/hook-organization/e2e work only (envelope-compatible).
8. `bun run test` baseline = 65 (5 files); R8 adds 1 file (+4 pins) → 69
   expected. E2E baseline = 45; R9b adds 1 test → 46 expected (R9a extends an
   existing test).

Execution order note: Phase 1 (red) → Phase 2 (icons) → Phase 3 (quality) →
unit green → build → Phase 4 e2e → full gate → screenshots → docs → push.
