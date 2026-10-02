# Remediation Plan — Session 2

Repo state at start: `7b68ab4` (clone complete, gate green: lint ✓ typecheck ✓ 33 unit ✓ build ✓ 29 e2e ✓).
Audit sources: live-app re-login (dashboard, demo, hub), the saved 788 KB live bundle
(`clone-workspace/recon/live-index.js`), the compiled CSS, and a full walk of the clone's
`src/`, `tests/`, configs and docs.

Legend — Severity: **P0** visible behavior/data wrong vs the reference · **P1** repo
identity/hygiene · **P2** documentation. Each item lists the TDD step, the files, and
the acceptance criterion.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| F1 | Typewriter topics list wrong: live `["Literature","Finance","History","Psychology","Marketing","Philosophy","Economics","Biology"]`; clone lacks Psychology, adds "Music Theory", different order | bundle `const $i=[…]`; `src/lib/domain.ts` `DIVE_TOPICS` | P0 |
| F2 | Quote pool: live has ONE 99-item array (49 authored quotes + 50 encouragement lines), picked **randomly per dashboard mount** (`Hy[Math.floor(Math.random()*Hy.length)]`); clone has 7 curated quotes (3 not in live) with deterministic daily rotation | bundle `const Hy=[…]` + usage in G5; `src/lib/quotes.ts` | P0 |
| F3 | Hub lesson quiz: live auto-advances 800 ms after a correct answer; wrong answer opens an in-pane **retry modal** (RotateCcw in #FFD0D0 tile, "Not quite!", "Would you like to retry this question later?", question card, Retry later → re-queue at end / Skip it). Clone reveals inline and requires a manual Next click | bundle `Y2` component; `src/components/hub/lesson-view.tsx` | P0 |
| F4 | Level-up moment: live renders an **in-pane light interstitial** (Zap in `w-14 h-14 rounded-[18px]` #FFFD73 tile, "Level Up!" `text-3xl` ls −0.03em, "Preparing Lesson N…" #595959, `animate-fade-in-up`) after 1200 ms, holds 800 ms; clone renders a fixed dark overlay with yellow text | bundle `Y2` render; `lesson-view.tsx` lines 304–316 | P0 |
| F5 | Confetti: live uses canvas-confetti in two places — (a) Hub level-up burst `70 particles, spread 60, origin {x:.5,y:.3}, colors #8b5cf6/#06b6d4/#f59e0b`; level-3 completion fires **dual side cannons** `120/angle 60/origin x:0` + `120/angle 120/origin x:1`; (b) dashboard right card fires `80 particles, spread 55, origin {x:.85,y:.4}, colors #FFFD73/#C8AEFF/#0F0E0E` when quizScore crosses 3 or 7. Clone has **no confetti anywhere** | bundle `Q()` + `c_()`; `grep confetti src/` → empty | P0 |
| F6 | Dashboard right column: live stacks **three** cards — Course Lessons, **Study Streak** (CalendarDays icon, days = `min(quizScore,7)` `text-4xl font-light` + weekday strip: active `bg #0F0E0E` white flame SVG, inactive `#F5F5F5` + date, M–S labels), **Total XP** (#FFFFFF, Gem icon, `scorePercent*10 + quizScore*50`, "Keep learning to earn more XP!"). Clone ships only Course Lessons | bundle `c_()` render; `course-dashboard.tsx` | P0 |
| F7 | Daily Challenge: live tile opens an **interactive modal** (question + italic hint + 4 answers with states #E1C8B9 → picked border / #FFD0D0 wrong / #FFFD73 correct / #DCDCDC others; result banner #BCFCAF "Correct! Well done!" or #FFD0D0 "Not quite — the correct answer is highlighted in yellow."; Close button) with a "Generating challenge…" spinner while AI runs. Clone links to the Hub | bundle modal; `course-dashboard.tsx` lines 213–236, `/api/challenge` returns `{question}` only | P0 |
| F8 | Course Progress tile: live is yellow **only when progress > 0** (`E>0?"#FFFD73":"#F8F8F8"`); clone always yellow | bundle G5; `course-dashboard.tsx` line 195 | P0 (minor) |
| F9 | `package.json` identity: `name:"orbital"`, description "ORBITAL — AI project management workspace" | `package.json` | P1 |
| F10 | `.env` header comment says "# ORBITAL — environment configuration" (`.env.example` already rebranded) | `.env` | P1 |
| F11 | `vitest.config.ts` comment lists ORBITAL-era seams (router, clarify questions, plan sanitizer, check-in mapping) that do not exist here | `vitest.config.ts` | P1 |
| F12 | Stale root `project-management_SKILL.md` (42 KB, the ORBITAL scaffold's skill) tracked at repo root; the user asked for `personalized-tutor-app_SKILL.md` instead | `git ls-files` | P1 |
| F13 | `src/lib/{api,auth,rate-limit}.ts` comments cite "the ORBITAL doctrine/convention" — lineage noise in a self-contained repo | those files | P1 |

**Verified non-issues** (checked, no action): DB layout — `.env DATABASE_URL="file:../db/custom.db"`
resolves schema-relative for the CLI and the runtime client, and through `db-path.ts` for
dev/build/standalone; `db/` sits at the repo root (git-ignored contents). The one anomaly
observed (DB created outside the repo) was a stale **shell-exported** `DATABASE_URL` in the
sandbox — dotenv precedence, not a repo bug. Vitest + Playwright suites/configs exist,
match, and pass. Mobile-nav toaster fix + all five Tailwind v4 trap pins are intact and
pinned by tests. Login/onboarding/hub/courses surfaces re-diffed against the live DOM —
structure, tokens, fonts and copy all match.

**Accepted divergences** (documented, intentionally kept): chat feedback props are dead
code in the live bundle (never rendered) — the clone will not invent UI the reference
doesn't show; the clone persists Nori chat history and lesson content (reference kept
them server-side/in-memory); the rank system (Novice→Master) never renders in live — only
its confetti-on-rank-change matters, covered by the same celebratory behavior; `/demo`
keeps its 60 % marketing pin.

---

## Part B — Remediation TODO (execution order)

### Phase 1 — Data layer (pure, unit-test first)

- [ ] **R1. DIVE_TOPICS sync** — `src/lib/domain.ts`: replace with the exact live list
  (Literature, Finance, History, Psychology, Marketing, Philosophy, Economics, Biology).
  TDD: extend `tests/domain.test.ts` pinning length 8 + exact order + Psychology present +
  Music Theory absent.
- [ ] **R2. Quote pool sync** — `src/lib/quotes.ts`: ship the 99-item `POOL` (49 quotes
  with `" — Author` + 50 encouragement lines) exactly as mined; `randomLine(pool, rng)`
  helper; dashboard bubble picks randomly per mount (reference semantics); keep
  `encouragementFor(n)` for the lesson-complete card (clone affordance, lines drawn from
  the same pool). TDD: new `tests/quotes.test.ts` — pool length 99; every quote matches
  `/^".*" — .+/`; 50 non-quote lines; `randomLine` with stubbed rng returns a pool member;
  the 4 previously shipped encouragement lines survive.
- [ ] **R3. Gamification math** — `src/lib/domain.ts`: `studyStreakDays(quizScore)` =
  `Math.min(quizScore, 7)`; `totalXp(scorePercent, quizScore)` = `scorePercent*10 +
  quizScore*50`; `confettiAt(prevScore, nextScore)` fires when crossing **3** or **7**
  (upward). TDD: unit tests incl. boundary cases (2→3 fires, 3→4 no, 6→7 fires, 7→7 no,
  downward never).
- [ ] **R4. Retry re-queue** — `src/lib/domain.ts`: pure `requeueQuestion(questions, q)`
  appending `{...q, id: len}`. TDD: unit test (original untouched, appended copy, length+1).

### Phase 2 — Quiz & Hub behaviors (client components)

- [ ] **R5. canvas-confetti dependency** — add `canvas-confetti` + `@types/canvas-confetti`;
  a thin `src/lib/confetti.ts` wrapper exporting the three live presets (quizMilestone,
  levelUp, courseComplete) so components never import the lib directly (testable seam).
- [ ] **R6. Diagnostic quiz confetti** — `src/components/quiz/quiz-app.tsx`: ref-guarded
  crossing detection on the running correct count → `confetti.quizMilestone()`.
- [ ] **R7. Lesson quiz flow** — `src/components/hub/lesson-view.tsx`: correct answer →
  auto-advance after 800 ms (progress = correct count / 8, matching live); wrong answer →
  800 ms → in-pane retry modal (live copy + tokens from F3); Retry later → re-queue + advance;
  Skip it → advance; queue exhaustion without 8 correct → complete with achieved score
  (graceful fallback for an edge the live app leaves broken). Level/lesson completes at 8
  correct. Keep "Submit Answer" reveal semantics.
- [ ] **R8. Level-up interstitial + confetti** — replace the dark fixed overlay with the
  live in-pane card (Zap tile, "Level Up!", "Preparing Lesson N…"), 1200 ms delay →
  interstitial + `confetti.levelUp()` → 800 ms → advance. Final lesson (index 5) completion
  fires `confetti.courseComplete()` (dual cannons) and keeps the existing completion card.
- [ ] **R9. Hub wiring** — `src/components/hub/hub-app.tsx`: level-up state owned by the
  hub (live architecture), lesson advance after interstitial, no regressions to the
  lesson-switch e2e spec.

### Phase 3 — Dashboard right column + Daily Challenge

- [ ] **R10. Study Streak + Total XP cards** — `course-dashboard.tsx` right column:
  Course Lessons (existing, add live row states + "N / 6 lessons · P% complete" footer if
  missing), Study Streak (F6 tokens), Total XP (F6 tokens).
- [ ] **R11. Daily Challenge modal** — `/api/challenge` upgraded to return
  `{question, hint, answers[4], correctIndex}` (AI + deterministic fallback); tile click
  opens the modal (F7 tokens + result banner + Close); "Generating challenge…" spinner
  while fetching.
- [ ] **R12. Course Progress conditional yellow** — `E>0 ? yellow : paper`.

### Phase 4 — Repo identity & hygiene

- [ ] **R13. Identity sweep** — `package.json` name/description → Thinkerwell;
  `.env` header; `vitest.config.ts` comment; remove `project-management_SKILL.md`;
  de-ORBITAL the three lib comments.

### Phase 5 — Docs, tests, delivery

- [ ] **R14. Test suite refresh** — update/extend unit + e2e for R1–R12 (new specs:
  streak/XP cards, daily-challenge modal, retry-modal flow, level-up interstitial;
  adjust any copy assertions). Full gate: lint → typecheck → unit → build → e2e.
- [ ] **R15. Documentation alignment** — AGENTS.md / CLAUDE.md / README.md /
  Project_Architecture_Document.md updated for the new behaviors, test counts, DB notes,
  and the new SKILL.md; create `personalized-tutor-app_SKILL.md` at the root following
  `skills/to-distill-project-into-skill` (20-section structure, codebase-verified);
  `.env.example` re-verified to match the code exactly (committed).
- [ ] **R16. Screenshots + push** — fresh `docs/screenshots/` set from the remediated dev
  server (desktop + mobile incl. open menu, streak/XP column, challenge modal, level-up);
  git commit on **main**; push via `docs/ssh_git_wrapper_v3.py` (runbook
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).

---

## Part C — Plan-vs-code validation (pre-execution)

Checked against the working tree at `7b68ab4`:

1. `DIVE_TOPICS` in `src/lib/domain.ts:138` — matches F1's "wrong list" description. ✓
2. `src/lib/quotes.ts` exports `QUOTES` (7) + `ENCOURAGEMENTS` (4) + `quoteOfTheDay` —
   consumed by `course-dashboard.tsx` (bubble) and `lesson-view.tsx` (encouragement). R2
   must keep both call sites compiling. ✓
3. `lesson-view.tsx` owns `levelingUp` locally (lines 39, 128–129, 304–316) and the
   hub-app passes `onComplete` — R8/R9 keep the prop contract, only the timing/ownership
   moves. The existing specs (`switching lessons loads a fresh lesson view`,
   `Nori answers with the Socratic persona`) do not touch the completion flow. ✓
4. `course-dashboard.tsx` right column currently renders only Course Lessons (lines
   348–407 region); the stats grid tiles live at lines 184–237; `/api/challenge/route.ts`
   is 8 lines returning `{question}` — all match the plan's assumptions. ✓
5. `grep confetti src/` → no matches (F5 confirmed). `package.json` name is `orbital`
   (F9 confirmed). `git ls-files` shows `project-management_SKILL.md` tracked (F12). ✓
6. Playwright config boots the standalone server with `db/e2e.db` via global-setup —
   unaffected by all changes. Vitest include globs (`src/**/*.test.ts`,
   `tests/**/*.test.ts`) pick up the new `tests/quotes.test.ts` automatically. ✓

No circular dependencies, no schema changes, no API-envelope changes, no new routes
beyond the existing `/api/challenge` (shape upgrade only — all call sites updated in the
same change). The `skills/` folder is excluded from lint/typecheck/compile per the repo
config (`eslint` and `tsc` both scope to `src/`/`tests/`).
