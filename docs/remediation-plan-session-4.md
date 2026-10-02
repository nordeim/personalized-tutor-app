# Remediation Plan — Session 4

Repo state at start: `9729f4e` (session-3 architecture pass complete at `c375a26`, plus the
session-4 prompt transcript; gate green: lint ✓ typecheck ✓ 49 unit ✓ build ✓ 36 e2e ✓).

Audit sources: live-app re-login (sepnetflix2023@outlook.com — account sits in the
onboarding state with 0 courses, so the with-course surfaces were studied on `/demo` and
in the 788 KB bundle `clone-workspace/recon/live-index.js`), driven DOM inspections of the
live "Add a Course" modal (opened from `/courses`), the live Course-pill dropdown, the
live user dropdown on `/`, `/courses`, `/demo`, and `/hub`, plus bundle decode of the
component functions `Q5` (the Add-a-Course modal), `p_` (the Course pill), `m_` (the
user dropdown with the preferences sub-panel), the hub header (in `vO`), and the icon
factory entries (`mv`=Sparkles, `Lr`=BookOpen, `tc`=FileText, `za`=Upload, `tr`=ChevronRight,
`oi`=X, `pv`=Plus, `mo`=LayoutGrid, `fv`=ChartColumnIncreasing, `T8`=Settings, `mh`=Check,
`nc`=LogOut, `Ba`=ChevronDown, `M6`=ChevronLeft, `Lg`=BookOpen).

Legend — Severity: **P0** visible behavior/structure wrong vs the reference · **P1**
data/semantics drift · **P2** polish. Each item lists the TDD step, files, and the
acceptance criterion. The `skills/` folder is excluded from code checking, testing and
compilation throughout.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S4-F1 | `/courses` "Add a Course" opens the **Q5 in-page modal** (never an `/onboarding` navigation): overlay `fixed inset-0 z-50 flex items-center justify-center p-4` bg `rgba(0,0,0,0.75)` + `backdrop-blur(6px)`; card `w-full max-w-md rounded-[24px] p-6 flex flex-col gap-5 relative` bg `#C8AEFF`, `maxHeight 90vh, overflowY auto`; X close `absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20`; h2 "Add a Course" `text-2xl font-normal` + sub "Choose what you'd like to learn next." `text-black/60 text-sm font-light mt-1`; label "What would you like to learn?" `text-sm font-semibold`; 2 mode cards `flex flex-col items-start gap-3 p-4 text-left transition-all` radius 12, selected `#FFFD73`/white — Build (Sparkles w-7 h-7 stroke 1.5, "Tell us what you want to learn."), Material (BookOpen, "Upload files or paste text."); Build mode: topic input + **6 single-label quick tags** (World War II, Microeconomics, Social Psychology, Calculus, Python, Genetics; `px-3 py-1 text-xs rounded-full`, selected bg `#0F0E0E`/white, tag click sets topic `"Subject: Sub"`); Material mode: course-name input + Paste Text/Upload File tabs (`flex-1 py-2 text-xs font-semibold`, active `bg-black text-white`; FileText/Upload icons) + textarea rows=4 / dropzone (`p-5` "Click to upload PDF or document", accept `.pdf,.docx,.txt`, "Extracting..." spinner); submit **"Start Assessment" + ChevronRight** `w-full py-3.5 bg-black text-white font-bold text-sm` radius 12 `disabled:opacity-30` + spinner while submitting; on success creates CourseEnrollment + Student then **navigates to `/quiz?course={id}`**. The clone's dashed button is an `<a href="/onboarding">` | live DOM (modal opened + measured via eval) + bundle `Q5`; entity writes are 403-blocked on the live account so the submit's navigation is confirmed from `onAdded:h=>{l(!1),d(h?`/quiz?course=${h}`:"/quiz")}` | P0 |
| S4-F2 | The with-course dashboard header renders **TWO dropdowns**. (a) The **Course pill** (`p_`): trigger `flex items-center gap-2 px-4 py-1.5 rounded-full border border-black text-sm font-medium` labeled `student.current_subject`; panel `w-64 rounded-[16px] shadow-xl border border-black/10`: enrollments-prop = **courses EXCLUDING the current subject** — `>0`: label "Switch course" (`text-xs font-light px-3 py-1.5` #595959) + rows `w-7 h-7 rounded-lg bg-black` tile (Sparkles for topic source / BookOpen for custom) + name `text-sm font-medium truncate`; `===0`: "This is your only course" (`p-4 text-center` #595959); then `border-t border-black/10 p-2`: "All Courses" (tile `bg-black/5` + LayoutGrid) + "Add a Course" (dashed-border tile + Plus) → **opens Q5**. (b) The **user dropdown** (`m_`): panel `w-80`; yellow header with w-10 avatar + name + context line `"{current_subject} · Custom material\|Default"`; items **Update Preferences** (Settings icon) → inline "Update Preferences" sub-panel (h3 + back X, Name label `text-xs font-semibold` #595959, input `px-4 py-2.5 rounded-xl bg-gray-50`, "Save Changes" `w-full py-2.5 bg-black text-white rounded-xl text-sm font-semibold` + Check icon, spinner) → PUT Student.name; **My Courses**; **Log Out**. (The live's "content" sub-panel — "Switch Learning Content" with the DIVE_TOPICS list + material textarea — has NO trigger in the bundle: dead code, not ported.) The clone merges everything into ONE user menu ("Switch course" label-row + course rows + Update Preferences→`/onboarding` link + My Courses + Log Out) and renders no Course pill on the dashboard | live `/demo` DOM (both pills opened + items measured) + bundle `p_`/`m_`/usage `enrollments:l.filter(O=>O.course_name!==(o==null?void 0:o.current_subject))` | P0 |
| S4-F3 | The hub desktop header's subject span shows the **current LESSON title** (`De[q]` = `lessonTitles[activeLessonIndex]`), not the course name. The clone renders `course?.courseName ?? "Introduction"` | bundle `Qe=De[q]||De[0]`; live hub DOM ("Introduction" beside the pill) | P1 |
| S4-F4 | The hub **Course pill**: label = `student.current_subject \|\| "Course"` (clone: hardcoded "Course"); panel anchored `left-0` with plain name rows (**no tiles, no current badge** — clone renders right-0 + a "current" badge); empty state = just the All Courses section (**no "No courses yet" text** — clone renders one); rows navigate to **`/?course=${id}` (the dashboard)** — clone navigates `/hub?course=${id}` | bundle hub pill + live `/hub` DOM | P1 |
| S4-F5 | The demo header renders the real two-pill structure: "Economics" is the **bordered Course pill** (opens: "This is your only course" + All Courses + Add a Course → Q5) and the Guest pill opens the **m_ dropdown** (w-80, "Economics · Default" context line, Update Preferences → preferences form, My Courses, Log Out). The clone renders two static spans (no borders, no dropdowns) | live `/demo` DOM (390×844 and desktop) | P1 |
| S4-F6 | The live mobile-nav toaster bug persists (hamburger covered by the empty toaster div; Playwright refuses the tap) — the clone's fix + regression spec stay as-is; re-verified live this session | live `/demo` at 390×844: "covered by `<div.fixed.top-0`" | — |
| S4-F7 | Hub user dropdown = My Courses + Log Out only ✓; Nori welcome message ✓; onboarding-state user dropdown = My Courses + Log Out ✓; courses empty state + card structure ✓ (session-3 CO pass); quiz flow/timing ✓ (session-3) | live DOM | — |

**Accepted divergences (documented, intentionally kept):** the Q5 modal's Upload File tab
reads `.txt`/`.md` client-side and toasts an honest "PDF/DOCX extraction is not available
in the self-hosted clone — paste the text instead" notice for binary formats (K-5); the
guest `/demo` pill dropdown degrades "Add a Course" to a sign-up notice (the live demo
posts to platform entities the clone deliberately does not fake); the live's dead
"Switch Learning Content" sub-panel is not ported (no trigger exists in the bundle).

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [x] **R0. `ADD_COURSE_TAGS` + `courseContextLine`** — `src/lib/domain.ts`:
  `ADD_COURSE_TAGS` = the 6 `{subject, sub}` pairs (History/World War II,
  Economics/Microeconomics, Psychology/Social Psychology, Math/Calculcus→Calculus,
  Programming/Python, Biology/Genetics); `courseContextLine(subject, contentSource)` =
  `"{subject} · Custom material"` for source "custom"/"material", else
  `"{subject} · Default"` (null subject → "Default" alone, matching the live's
  `e==null?void 0:e.current_subject` render of "· Default"). TDD: pins for the exact
  6 pairs (order included) and the 3 context-line branches.

### Phase 2 — The Q5 Add-a-Course modal (client)

- [x] **R1. `src/components/courses/add-course-modal.tsx`** — the decoded Q5 port with
  every token from S4-F1 (overlay/blur/card/close/header/mode cards/tags/material
  tabs/dropzone/Start Assessment button, spinner + disabled states, X icon close,
  Escape key optional). Submit → `POST /api/courses/generate` (existing route already
  implements the exact semantics: Student upsert + enrollment + roadmap fallback) →
  `onAdded(courseId)`; the parent navigates `/quiz?course={id}` + `router.refresh()`.
  Guest mode prop (`guest?: boolean`): Start Assessment toasts "Create a free account
  to save your course" and routes `/login?from_url=%2Fonboarding`. Files: new component
  + lucide imports (Sparkles, BookOpen, FileText, Upload, ChevronRight, X).

### Phase 3 — The CoursePill + user-menu rework (`app-header.tsx`)

- [x] **R2. `CoursePill` component** (exported from `app-header.tsx`) — the `p_` port:
  bordered pill trigger (label = `currentSubject || "Course"`), w-64 panel, other-courses
  rows (black tile + Sparkles/BookOpen + name), "This is your only course" empty state,
  border-t section (All Courses → `/courses`, Add a Course → opens the Q5 modal),
  outside-click close, `hover:bg-black/5` pill.
- [x] **R3. User dropdown `m_` rework** — with-course menu = yellow header (avatar +
  name + `courseContextLine`) + Update Preferences / My Courses / Log Out; no-course
  menu stays My Courses + Log Out (live `/` + `/courses` behavior). Update Preferences
  switches the panel to the preferences sub-view (Name input + Save Changes → `PUT
  /api/student` → `onStudentUpdated` callback → `router.refresh()`). The old
  "Switch course" label-row + course rows are REMOVED from the user menu. Mobile
  hamburger keeps the same menu items (the live's mobile menu carries the m_ items —
  no course switcher on mobile).
- [x] **R4. `AppHeader` API** — new optional props: `currentSubject?: string | null`,
  `enrollments?: { id, name, source }[]` (the OTHER courses), `studentName` update
  callback wiring; renders `CoursePill` between the brand and the user pill when
  `currentSubject` is non-null (dashboard-with-course) — matching the live's layout
  `flex items-center gap-3` + pill order (Course pill left of the user pill).

### Phase 4 — Page wiring

- [x] **R5. `dashboard-app.tsx` / `page.tsx`** — resolve the Student + enrollments
  server-side (page already reads them), pass `currentSubject` and other-courses
  (excluding the current subject, exactly the live's filter) into AppHeader;
  `onAdded` → `/quiz?course={id}`.
- [x] **R6. `demo-dashboard.tsx`** — render the bordered CoursePill ("Economics",
  opens "This is your only course" + All Courses + Add a Course → Q5 in guest mode)
  and make the Guest pill open an m_-styled guest dropdown (context line "Economics ·
  Default", Update Preferences → sign-up notice, My Courses → `/courses`, Log Out →
  `/login`). Desktop only — mobile keeps the hamburger-less simple header? NO: the
  live mobile demo header shows logo + hamburger only; the clone's demo mobile header
  already matches (logo + Guest pill static → keep the guest pill static on mobile,
  the live hides the pills behind the hamburger at 390px).

### Phase 5 — Hub fixes

- [x] **R7. `hub-app.tsx`** — header span = `titles[activeLesson]` (the current lesson
  title, "Introduction" fallback already the default-grid title); Course pill label =
  `currentSubject || "Course"`; pill panel `left-0`, plain rows, no current badge, no
  "No courses yet" text; row click navigates `/?course=${id}` (dashboard, the live's
  behavior — NOT /hub).
- [x] **R8. `hub/page.tsx`** — fetch the Student row, pass `currentSubject` into
  HubApp.

### Phase 6 — Tests, gate, delivery

- [x] **R9. Unit tests** — `tests/domain.test.ts` (or a new `tests/domain-session4.test.ts`):
  ADD_COURSE_TAGS pins (6 pairs, exact order) + courseContextLine branches. RED first.
- [x] **R10. E2E specs** — new `tests/e2e/session4-parity.spec.ts` (authenticated,
  storageState): (1) `/courses` Add a Course opens the modal, structure assertions
  (title, 2 mode buttons, 6 tags, Start Assessment disabled), tag click fills topic,
  Start Assessment creates a course and lands on `/quiz?course=`; (2) the dashboard
  CoursePill renders "Economics", dropdown shows "This is your only course" + All
  Courses + Add a Course (opens Q5); (3) the user menu shows Update Preferences →
  preferences form saves a name (PUT /api/student, header name updates); (4) the hub
  header span shows the lesson title + pill label "Economics" + rows navigate to
  `/?course=`; (5) `/demo` renders the bordered Economics pill + guest dropdown.
  Update `dashboard.spec.ts` / `header.spec.ts` copy assertions that reference the old
  merged user menu ("Switch course" rows) if any (grep first).
- [x] **R11. Full gate** — lint → typecheck → test (unit) → build → e2e (all green).
- [x] **R12. Screenshots** — 33+: Q5 modal (build mode + material mode + tag
  selected), courses pill dropdown, user preferences form, hub header (span + pill),
  demo pill dropdown (desktop + mobile).
- [x] **R13. Docs + SKILL + log** — AGENTS.md (new invariants: Q5 modal, p_/m_
  split, hub pill semantics), CLAUDE.md, README.md, PAD v1.3 [S4] revision block,
  `personalized-tutor-app_SKILL.md` v1.3.0 (distill refresh), `docs/session_4.md`
  session log, repo `worklog.md`, workspace worklog.
- [x] **R14. Commit + push** — Conventional Commit on main, push via
  `docs/ssh_git_wrapper_v3.py` (paramiko shim at `/home/z/my-project/bin/ssh`).

---

## Part C — Plan-vs-code validation (pre-execution)

1. `src/components/courses/courses-app.tsx` line 201-211 — the dashed `<a
   href="/onboarding">` is S4-F1's target ✓ (becomes a button opening the modal).
2. `src/components/layout/app-header.tsx` lines 127-174 — the merged `menuItems`
   (Switch course label-row + course rows + Update Preferences→/onboarding + My
   Courses + Log Out) is S4-F2's target ✓. The component already owns the
   outside-click pattern (reuse for the pill).
3. `src/components/hub/hub-app.tsx` line 147 (`course?.courseName ?? "Introduction"`),
   line 159 (hardcoded "Course"), lines 165-195 (right-0 panel + current badge +
   "No courses yet"), line 93 (`switchCourse` → `/hub?course=`) — all S4-F3/F4
   targets ✓.
4. `src/components/dashboard/demo-dashboard.tsx` lines 80-93 (static spans) —
   S4-F5's target ✓.
5. `src/app/api/courses/generate` — already implements the Q5 submit semantics
   (Student upsert + enrollment + roadmap + `{courseId}` response) ✓ no API changes
   needed for the modal.
6. `src/app/api/student` PUT — already accepts `{name}` ✓ no changes needed for the
   preferences form.
7. `src/app/hub/page.tsx` — needs the Student read (one `db.student.findUnique`)
   → new `currentSubject` prop ✓ additive.
8. `src/app/page.tsx` (dashboard) — needs the Student read + other-courses filter;
   the page already reads enrollments ✓ additive.
9. E2E copy to re-check: `tests/e2e/dashboard.spec.ts` (user menu items),
   `tests/e2e/header.spec.ts` (menu structure), `tests/e2e/mobile-navigation.spec.ts`
   (hamburger only — safe), `tests/e2e/session2-parity.spec.ts` (dashboard copy).
   Grep for "Switch course" / "Update Preferences" / "No courses yet" in
   `tests/e2e/` before running.
10. No Prisma schema changes, no new API routes; everything is client-component +
    page-snapshot wiring (envelope-compatible).

Execution order note: Phase 1 (red) → Phase 2 (modal, self-contained) → Phase 3
(header rework) → Phases 4-5 (wiring) → unit green → build → Phase 6 e2e updates →
full gate → screenshots → docs → push.
