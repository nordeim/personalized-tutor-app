# Remediation Plan — Session 3

Repo state at start: `7f16110` (session-2 parity pass complete; gate green: lint ✓ typecheck ✓ 46 unit ✓ build ✓ 34 e2e ✓).

Audit sources: live-app re-login (dashboard, /demo, /hub desktop + mobile, /courses, /quiz), fresh
DOM captures of every live surface, and a deep re-mine of the 788 KB live bundle
(`clone-workspace/recon/live-index.js`) — this time decoding the actual component functions
(`qP` sidebar, `Y2` lesson view, `gO`/`yO`/`xO` level layouts, `Im` content card, `H2` Nori chat,
`Kh` lesson-title derivation, `CO` course card, `kO` courses page, the `ie` level-up handler, and
the complete lucide icon map via the `ze("Name", …)` factory). The live hub quiz was also DRIVEN
interactively (auto-advance, retry modal, session progress semantics all observed first-hand;
the live app itself crashed mid-quiz — its flow is genuinely fragile, which the clone must not
replicate).

Legend — Severity: **P0** visible behavior/structure wrong vs the reference · **P1** data/semantics
drift · **P2** polish. Each item lists the TDD step, files, and acceptance criterion.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| F1 | Lesson-view quiz options: live renders a **2-column grid** of `rounded-[14px] p-4` **tan `#E1C8B9`** buttons; selected = tan + `1px solid #0F0E0E`; revealed = correct `#BCFCAF` (+ CircleCheckBig), wrong-pick `#FFD0D0` (+ CircleX), others 40% opacity. Clone renders single-column white rounded-xl rows with A/B/C/D letter badges and yellow correct state | bundle `gO/yO/xO`; live hub DOM | P0 |
| F2 | Submit button: live = **"Next Question"** + ChevronRight, `ml-auto mt-4 px-5 py-2.5 rounded-[14px]`, disabled `#E0E0E0/#999999` + not-allowed, hidden after answer. Clone = "Submit Answer" black bold rounded-[12px] | bundle `gO` | P0 |
| F3 | Question block: live has **no wrapper card** — `h3` (text-base font-normal mb-4 mt-4, lineHeight 1.4) + options directly; no "Question N" label, no helper/feedback text lines. Clone wraps in a `#F5F5F5` card with a "Question N" eyebrow + feedback line | bundle `gO`; live DOM | P0 |
| F4 | Feedback timing: live = submit → **1000 ms reveal** → onAnswer → (correct: **800 ms** advance / wrong: **800 ms** → retry modal). Clone fires after a single 800 ms delay | bundle `gO` (`setTimeout(()=>o(E),1e3)`) + `Y2.R` | P0 |
| F5 | Level context cards: L1 "Core Concept" `#FFFD73` (Lightbulb) **only at questionIndex 0**; L2 "Real-World Scenario" `#E1C8B9` (MapPin); L3 "Final Boss Challenge" `#D2C0F9` (Trophy). Clone always renders a yellow "Core Concept" card | bundle `gO/yO/xO` | P0 |
| F6 | Lesson h2: live L1 = **subject** (fallback "General"); L2/L3 = the AI-generated `meta.title` (3-5 words). Clone always shows the lesson title | bundle `gO` (`children:c` = subject) vs `yO/xO` (`children:e.title`); live DOM h2 "General" | P0 |
| F7 | Per-question content cards (`Im`): **video** = 16:9 shimmer + centered play button (w-12 h-12 circle rgba(0,0,0,.25) + Play white) + caption "Example video — {content_text}"; **text** = "Reading" card `#F0F0F0` rounded-[16px] p-5 (FileText icon) + `content_text` paragraphs. Questions alternate content_type. Clone renders a bare shimmer with no play button/caption and no reading card | bundle `Im`; live DOM ("Example video — An introductory video…") | P0 |
| F8 | AI lesson schema: live prompt returns `{title, concept, scenario, challenge, questions[8] × {question, options, correctIndex, content_type, content_text}}` — per-lesson generation with the exact prompt "Generate 8 distinct multiple-choice questions for Level N on the subject…". Clone generates only `{coreConcept, questions}` | bundle `Y2.O` prompt + response_json_schema | P0 |
| F9 | Hub sidebar lesson rows: live = **3 states** — done (`#DCDCDC`, CircleCheckBig, "Lesson N · Done"), active (`#FFFD73`, ChevronRight, "Lesson N · Now"), locked (`#EBEBEB`, opacity .45, Lock icon, no suffix, NOT clickable); icon circle w-8 h-8 bg `#0F0E0E`/`#D0D0D0`. Clone = 2 states (active/inactive), all clickable, number-in-circle icons | bundle `qP`; live DOM (Lock icons observed) | P0 |
| F10 | Lesson Progress card: label = **`answered + 1`/8** where answered = the current SESSION's correct count (resets to 0 on lesson load, per level-up); bar = `Math.round(answered/8*100)`. Icon = **BookOpen w-3.5** (clone uses TrendingUp). Clone label = persisted correctCount/8 | bundle `qP` (`[c+1,"/",d]`); live DOM observed 1/8→2/8→3/8 live; icon lucide-book-open | P0 |
| F11 | Roadmap header right label: live = **"{completed}/6 lessons"** (completed = `Math.round(pct/100*6)`). Clone = "{stageDone}/3 stages" | bundle G5 (`[$,"/",6," lessons"]`) | P0 |
| F12 | Roadmap bar: live = **unrounded** `completed/6*100` (66.6667% observed). Clone rounds (67%) | live DOM `width: 66.6667%` | P1 |
| F13 | Stage status: done = `stage < floor(completed/2)`; in-progress = `stage === floor(completed/2)` (12px semibold `#0F0E0E`); later stages = **NO status text + opacity 0.45**. Clone renders "○ Upcoming" text at full opacity | bundle G5 (`Z=le<W, q=le===W, opacity:!Z&&!q?.45:1`) | P0 |
| F14 | Dashboard gap analysis: the live NEVER renders `gap_analysis` anywhere (write-only field; 7 bundle occurrences are all entity writes). Clone renders it under the Course Lessons footer | bundle grep: `.gap_analysis` → 0 render sites | P0 |
| F15 | Demo data drift: live `/demo` quizScore **3** (streak 3, XP 750 = 60·10+3·50), stage 1 title **"Foundations of Microeconomics"** with three specific descriptions, lessons 1-2 = "Foundations of Microeconomics: Basics/In Practice". Clone: quizScore 4 (XP 800, streak 4), "Microeconomic Foundations" + own descriptions | live /demo DOM (streak "3", XP "750", stage titles) | P0 |
| F16 | Lesson titles per stage: live `Kh` expansion suffixes = **["Basics","In Practice"], ["Fundamentals","Application"], ["Deep Dive","Mastery"]**. Clone uses "Basics"/"In Practice" for every stage | bundle `Kh` | P0 |
| F17 | Courses page cards: live `CO` = per-course card `rounded-[20px] p-5 #F8F8F8 hover:scale-[1.01]` in a `grid grid-cols-1 gap-[4px]` inside the Your Courses card; **black icon tile w-10 h-10 rounded-[12px]** with a keyword-mapped **subject icon** (Calculator/Leaf/Atom/Landmark/Brain/ChartColumnIncreasing/Cpu/Music/Palette/Scale/Megaphone/Globe/BookOpen); name + "Custom Material"/"AI-Generated Course" badge; Trash2 delete (w-8 h-8 rounded-full hover:bg-red-50) + ChevronRight; progress = **quiz-derived** `round(quiz_score/5×6)/6 lessons · pct%` + h-1.5 bar. Clone: purple initial-letter tiles, lessonProgress-based "4/6 lessons · quiz 4/7" | bundle `CO`/`kO`/`bO` + `ph=6` | P0 |
| F18 | Mobile hub header: live = **ChevronLeft + "Dashboard"** (no logo). Clone renders the BrandMark | live hub mobile DOM | P0 |
| F19 | Mobile lessons sheet: live = "All Lessons" header (text-xs font-semibold uppercase tracking-wider black/60) + rows where **active = bg #0F0E0E** (circle #FFFD73, label white/50, title white, "Active" badge `#FFFD73`/black) vs clone active = yellow row with black "Active" pill; label = "Stage N · **Level N**" (BOTH numbers = floor(i/2)+1 — the live prints the same number twice); clone prints Level 1/2 within the stage | bundle mobile sheet | P0 |
| F20 | Hub "Course" pill: live renders it **always** (even with 0 courses). Clone hides it when `courses.length <= 1` | live hub DOM (0 enrollments, pill present) | P1 |
| F21 | Nori chat question-context: the live prefixes the current question to the student's message server-side: `[Current question: "…" — Options: 1. …, 2. …]  Student: {text}`. The clone sends the bare message | bundle `H2.j` | P1 |
| F22 | Lesson Progress bar + "N/8 correct" in the lesson header: matches ✓ (kept) | live DOM | — |
| F23 | Confetti presets, retry modal, level-up interstitial, DIVE_TOPICS, category tags, quotes pool, login/courses-empty/quiz-guard surfaces: all verified aligned ✓ | live + bundle | — |
| F24 | **Dashboard progress is QUIZ-DERIVED** (the live has NO per-lesson progress entity): `E = quiz_completed ? Math.round(quiz_score/5×100) : 0`; lessons shown = `Math.round(E/100×6)`; roadmap bar = lessons/6×100 unrounded; stage statuses keyed off `floor(lessons/2)`; Course Lessons row states (#F5F5F5 done / #FFFFFF+black-border next / #FAFAFA later) keyed off the derived count; the /courses card uses the same math. The demo's "60%" is `round(3/5×100)` — NOT a marketing pin. The clone computes from lessonProgress and pins the demo at 60 — for the seeded course (quiz 4) the clone shows 67%/4/6/870 XP where the live model gives 80%/5/6/1000 XP | bundle G5: `E=n!=null&&n.quiz_completed&&(n==null?void 0:n.quiz_score)!=null?Math.round(n.quiz_score/5*100):0`; demo DOM cross-check: score 3 → 60%, 4/6, streak 3, XP 750, bar 66.6667%, stage 3 in-progress — ALL ✓ | P0 |

**Accepted divergences (documented, intentionally kept):** the clone persists per-lesson progress
and auto-advances lessons after completion (the live leaves the pane on the answered 8th question
with the next lesson LOCKED and actually crashed mid-quiz during the audit — its flow is broken;
the clone's coherent behavior is pinned by e2e and stays). The level-up fires at stage boundaries
(lessons 2/4) rather than after every lesson, matching the 3-level mastery grid semantics.
"Add a Course" links to `/onboarding` (the live opens an in-page modal with the same
mode-picker content). The `T` Nori personality messages are dead code in the live (message prop
never rendered in `H2`) — the clone keeps its visible feedback patterns.

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Pure domain layer (TDD: failing tests first)

- [ ] **R0. Quiz-derived progress model** — `src/lib/domain.ts`:
  `quizProgressPercent(quizScore, quizCompleted)` = `round(score/5×100)` (0 when
  not completed); `derivedLessonsCompleted(pct)` = `round(pct/100×6)`; the Course
  Progress / roadmap / footer / XP inputs all switch to these. `demoPercent` prop
  REMOVED (the demo's quiz 3 → 60% naturally). TDD: pins for score 3 → 60/4,
  score 4 → 80/5, score 7 → 140→clamped 100/6, uncompleted → 0/0.

- [ ] **R1. `lessonTitles()` per-stage suffixes** — `src/lib/domain.ts`: suffix pairs
  `LEVEL_SUFFIXES = [["Basics","In Practice"],["Fundamentals","Application"],["Deep Dive","Mastery"]]`.
  TDD: update `tests/domain.test.ts` — seeded roadmap produces
  "Microeconomic Foundations: Fundamentals" for lesson 3 etc.
- [ ] **R2. `stageLevelLabel()`** — both numbers = `floor(i/2)+1`. TDD: pin "Stage 2 · Level 2" for index 3.
- [ ] **R3. Roadmap status helpers** — `roadmapLessonsCompleted(pct)` = `Math.round(pct/100*6)`;
  `currentStageIndex(completedLessons)` = `floor(completed/2)`; `roadmapStageStatus(stage, current)`
  → "done" | "in-progress" | "upcoming" (upcoming renders NO text, opacity .45). TDD: 60% → 4
  lessons → stage 2 in-progress; 0% → stage 0 in-progress; 100% → all done.
- [ ] **R4. Courses-card progress** — `quizDerivedLessons(quizScore, quizCompleted)` =
  `round(score/5×6)` when completed, else 0; percent = `round(x/6*100)`. TDD: score 4 → 5 lessons
  (83%); score 0/uncompleted → 0 (0%).
- [ ] **R5. Subject icon mapper** — `subjectIconName(name, contentSource)` returning lucide names
  for the 12 keyword buckets + default BookOpen. TDD: "Microeconomics"→none-of-math…
  actually economics bucket → "ChartColumnIncreasing"; "Python Programming"→"Cpu";
  custom → "BookOpen"; default → "BookOpen".

### Phase 2 — AI lesson schema (server)

- [ ] **R6. `generateLessonContent` upgrade** — `src/lib/ai.ts`: the live's exact prompt
  ("Generate 8 distinct multiple-choice questions for Level {level} on the subject … Return a JSON
  object with: title (3-5 word level title), concept (1-2 sentence core idea), scenario (level 2
  only), challenge (level 3 only), questions[8] with question/options/correctIndex/content_type
  ("video"|"text", alternating)/content_text"); validation; static fallback carrying level-
  specific concept/scenario/challenge + alternating video/text question content.
  `LessonContent` type → `{title, concept, scenario, challenge, questions, aiGenerated}`.
  Update `/api/lessons/content` (pass level/subject/lessonFocus).

### Phase 3 — LessonView + HubApp rework (client)

- [ ] **R7. `lesson-view.tsx` rewrite** — the live's `gO/yO/xO/Im` architecture:
  header ("Lesson N" + h2 = subject (L1) / meta.title (L2/3) + "N/8 correct" + w-24 bar);
  level context card (F5 tokens, gated on questionIndex 0 for L1);
  per-question content card (video: shimmer + play + caption; text: "Reading" #F0F0F0);
  question h3 + 2-col tan options (F1 states/icons) + "Next Question" button (F2);
  feedback timing 1000 ms → onAnswer → 800 ms (F4);
  keep retry modal, level-up interstitial, completion card, confetti, progress POST;
  NEW `onAnswered(correct)` callback reporting the session's correct count to the hub.
- [ ] **R8. `hub-app.tsx` wiring** — lesson rows 3-state (F9: done/active/locked, not-clickable
  locked); Lesson Progress label `answered+1/8` from the live-reported session count (reset on
  lesson switch); BookOpen icon; Course pill always rendered; mobile header ChevronLeft+Dashboard;
  mobile sheet rework (F19: All Lessons header, black active row, yellow badge, label numbers);
  LessonView keyed on course+lesson (remount semantics like `${subject}_${q}`).

### Phase 4 — Dashboard

- [ ] **R9. Roadmap card** — header "N/6 lessons" (F11); unrounded bar (F12); new stage statuses
  (F13: no Upcoming text, opacity .45 on future stages; done = 10px medium #595959, in-progress =
  12px semibold #0F0E0E).
- [ ] **R10. Remove the gapAnalysis render block** (F14) from `course-dashboard.tsx`.
- [ ] **R11. Demo data sync** (F15) — `demo-dashboard.tsx`: quizScore 3; stage 1
  "Foundations of Microeconomics" + the live's three exact stage descriptions; lessons 1-2
  "Foundations of Microeconomics: Basics/In Practice"; gapAnalysis value kept (not rendered).

### Phase 5 — Courses page

- [ ] **R12. `courses-app.tsx` card rework** (F17) — grid gap-[4px] of CO-style cards: black
  subject-icon tile, name + "AI-Generated Course"/"Custom Material" badge, Trash2 + ChevronRight,
  quiz-derived progress `N/6 lessons · P%` + h-1.5 bar, hover:scale-[1.01]; page passes
  quizScore/quizCompleted/contentSource per course.

### Phase 6 — Chat context

- [ ] **R13. `/api/chat` + `nori-chat.tsx`** — optional `currentQuestion` payload
  `{question, options}`; the API builds the live's `[Current question: "…" — Options: …]`
  context into the AI prompt (and the saved user message stays the bare text, like the live's
  display strip). HubApp passes the active question from the LessonView report.

### Phase 7 — Tests, gate, delivery

- [ ] **R14. Test refresh** — unit: R1-R5 pins (+ ~14 new checks); e2e: update
  session2-parity/mobile-navigation/hub specs for the new DOM ("Next Question" button, option
  grid, lesson-row states, roadmap labels, /demo 750 XP + 3 streak, CO card). Full gate:
  lint → typecheck → unit → build → e2e.
- [ ] **R15. Screenshots** — fresh set 23+ (lesson view with tan grid + Next Question, content
  cards, 3-state sidebar, mobile sheet, courses card, demo gamification).
- [ ] **R16. Docs + SKILL + push** — AGENTS.md/CLAUDE.md/README/PAD updates (new invariants,
  counts); `personalized-tutor-app_SKILL.md` refresh per the distill meta-skill; commit on
  main; push via `docs/ssh_git_wrapper_v3.py`.

---

## Part C — Plan-vs-code validation (pre-execution)

1. `src/lib/domain.ts` `lessonTitles()` (line 73-85) — the "Basics/In Practice" constant is
   exactly F16's target. ✓
2. `src/components/hub/lesson-view.tsx` — current structure (lines 304-441) matches F1-F7's
   "wrong" descriptions: wrapper card, white options, "Submit Answer", static shimmer. ✓
3. `src/components/hub/hub-app.tsx` — `lessonProgressLabel` (line 139), 2-state rows (line 318+),
   `ICONS.trend` (line 57), `courses.length > 1` pill gate (line 174), BrandMark mobile header
   (line 279) — all match the findings. ✓
4. `src/components/dashboard/course-dashboard.tsx` — roadmap label (line 410),
   `stageProgressPct` (line 148-149), "Upcoming" span (line 452), gapAnalysis block (lines
   570-574) — all present as described. ✓
5. `src/components/dashboard/demo-dashboard.tsx` — `quizScore: 4` (line 46), DEMO_ROADMAP/
   DEMO_LESSONS (lines 9-34) — F15's target. ✓
6. `src/components/courses/courses-app.tsx` — purple tile + lessonProgress math (lines 89-120)
   — F17's target. ✓
7. `src/lib/ai.ts` `generateLessonContent` (line 197) — the simplified prompt is F8's target;
   consumers: `lesson-view.tsx` (type) + `/api/lessons/content` route. ✓
8. Consumers of `stageStatus` (course-dashboard line 422) and `stageLevelLabel` (hub-app) will
   be updated with the helpers' new shapes; `tests/domain.test.ts` pins both today.
9. The e2e suite's copy assertions that will need updates: "Submit Answer" → "Next Question"
   (session2-parity), lesson-row clickability (mobile-navigation uses the hamburger only —
   safe), "2/3 stages" style assertions if any (grep before running).
10. No schema changes, no new routes; `/api/lessons/content` gains optional body fields;
    `/api/chat` gains an optional `currentQuestion` object — both additive and
    envelope-compatible.

Execution order note: Phase 1 → 2 → 7(unit) keeps the red-green loop tight; Phases 3-5 change
DOM that e2e pins, so e2e updates land with them; Phase 6 is additive.
