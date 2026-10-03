# Remediation Plan — Session 16

Repo state at start: `febcb12` (session-15 complete at `7412f8b` + the log
commits `7702692`/`febcb12`; the new `docs/session_16.md` = the session-15
transcript, per the handoff convention). The workspace PERSISTED — `.env`
with `DATABASE_URL="file:../db/custom.db"` + `db/custom.db` + `db/e2e.db` at
the repo root + `node_modules` verified in place; `.env.example` re-verified
byte-identical; the vitest + playwright configs verified wired (182 unit,
91 e2e). The stale shell `DATABASE_URL` trap re-armed itself
(`file:/home/z/my-project/db/custom.db` overrides `.env`) — every dev/CLI
command ran under `env -u DATABASE_URL`.

Audit sources: the baseline gate re-run fresh (lint ZERO findings ·
typecheck ✓ · 182 unit ✓ · build ✓ · the mobile-navigation spec re-run
12/12 on the fresh build, zero orphaned :3100 servers), a live re-probe
(bundle hash, login, the mobile-nav real-tap re-verification at 390×844
hasTouch — the prompt's headline, 7th consecutive session), the
session-15 handoff's three suggested directions investigated empirically
(the exhaustive-deps experiment matrix re-run: exactly 3 findings; the
no-unused-vars scan: 18 src/ findings; the `--isolate=false` speed probe:
5 stable runs incl. 2 shuffled seeds), and a two-axis review of the
session-15 commit itself (the conventions scanner + helpers read whole —
no hard findings). **The live app bundle is byte-identical to the recon
copy for the 7th consecutive session (md5 `f99e7279…`, 788 085 bytes —
`/assets/index-CkEI9gsZ.js`; the platform shell `index-D96eRrlv.js` is
94 919 bytes, session-13's identification — the first /login-page script
enumeration now captured the full chunk map too)** — every prior decode
stands. scandihaven re-consulted per the prompt (unchanged at `cb0002a`;
nothing new to adopt). The repo's Tailwind v4 skills re-consulted for the
mobile-nav headline (all 8 trap pins re-verified intact in `globals.css`;
zero actual `rounded-full` class usages in `src/`; the sonner
pointer-events rules intact). The `skills/` folder is excluded from code
checking, testing and compilation throughout.

Legend — Severity: **P0** visible behavior/flow wrong vs the reference · **P1**
data/semantics or invariant violation · **P2** latent-flake/test-gap ·
**P3** polish/hygiene.

---

## Part A — Findings (audited facts)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| S16-F1 | **`react-hooks/exhaustive-deps` is OFF behind 3 "intentional suppressions" that no longer need to be suppressions.** The session-15 config comment documents the trade-off ("adding the deps without useCallback refactors would re-fire reset effects mid-quiz") — but the latest-ref pattern (`useRef` + a no-deps update effect) removes the callback from the dependency equation WITHOUT the useCallback refactor: the consuming effect's deps stay exactly the firing triggers the pinned semantics demand. The 3 sites: `lesson-view.tsx:130` (`onAnswered` rides a ref, deps stay `[lessonIndex]` — the "reset the session counter on lesson change" trigger), `lesson-view.tsx:135` (`onQuestionChange` rides a ref, the effect restructured to read `q` directly with deps `[q]` — the question identity, which changes exactly when content loads or the question advances, a superset-equal of the old `[activeQuestion?.question]` text trigger and immune to its duplicate-text blind spot), `onboarding-dashboard.tsx:165` (`generate` rides a ref, deps stay `[publicMode]` — the post-login pickup trigger). Risk assessment: `onAnswered`/`onQuestionChange` are STABLE state setters at the sole call site (hub-app passes `setSessionAnswered`/`setCurrentQuestion`), `generate` closes only over stable handles (setters, the context's useCallback'd `toast`, `useRouter`) — the ref indirection is behaviorally identical even before the e2e harness proves it. The quiz-flow auto-advance + the pending-setup pickup are both e2e-pinned (91 checks). | eslint experiment (exactly 3 findings) + hub-app.tsx:408-409,428-429 + generate body read | **P3** |
| S16-F2 | **18 real unused-vars findings in `src/` (6 dead-code) + 12 type-contract positions + 6 in scripts/ — all cleanable to zero.** The TS-aware rule flags exactly the 6 dead-code sites: `lesson-view.tsx:76` (`courseName` prop — vestigial since the S8-F4 subject-h2 fix), `onboarding-dashboard.tsx:118,119` (`user`/`studentName` props — the public-surface model made both unused; the single caller `dashboard-app.tsx:185` passes them), `courses-app.tsx:69` (`deleting` state — `setDeleting` is called but the value is NEVER read; nothing renders it), `course-dashboard.tsx:144` (`const { toast } = useToast()` — destructured, never called), `ai.ts:365` (`fallbackLesson`'s `lessonNumber` param — unused in the body, one internal caller). The 12 type-annotation positions (callback prop contracts like `onComplete: (lessonIndex: number, …)`) are flagged ONLY by the base rule, NOT by `@typescript-eslint/no-unused-vars` — enabling the TS-aware rule alone keeps the named type contracts intact while flagging exactly the dead code. The 6 scripts/ findings (`eslint.config.mjs`'s `__dirname`, the capture/probe scripts' unused destructurings) ride the same rule. | the eslint scan matrix (both rules, both alone) + per-site reads | P3 |
| S16-F3 | **The vitest worker pool re-spawns 15 workers per run (~86ms each) — `isolate: false` is a 5× wall-clock win (1.9s → 375ms) and empirically stable.** The suite reports it itself ("at least ~1.20s faster with isolate: false"). The mock-pollution hazard (shared worker ⇒ shared module graph ⇒ `vi.mock` leakage in tests/ai-seam.test.ts) was probed empirically: 5 full runs green (3 sequential + `--sequence.shuffle` with 2 different seeds — file-order randomization), 182/182 each time. The pure-seams doctrine (domain/quotes/db-path tests share zero state) + vitest's per-file mock re-registration make the shared worker safe here; the config comment documents the validation protocol for future file additions. | the 5-run probe matrix (this session) | P3 |
| S16-F4 | CONFIRMED MATCHING / documented (no action): the live app bundle **byte-identical for the 7th consecutive session** (md5 `f99e72793316ead62b335b6fd55ed6d5` — every decode stands); login works (the account remains onboarding-state — the documented entity-write 403 block; "Loading your learning space…" → the onboarding surface); **the mobile-nav headline re-verified for the 7th consecutive session** (390×844 hasTouch: the live's hamburger tap STILL REFUSES — `elementFromPoint` at the button center IS the `fixed top-0 z-[100]` toaster container with `pointer-events: auto`, `TimeoutError: locator.tap: Timeout 5000ms exceeded`; the clone's fix + real-tap pins hold — `mobile-navigation.spec.ts` re-run 12/12 on the fresh build); the unauthenticated mobile `/hub` visit bounces to `login?from_url=<full-url>` (the session-10 `navigateToLogin` decode, re-observed); scandihaven unchanged (`cb0002a`); `.env`/`.env.example` byte-identical (`DATABASE_URL="file:../db/custom.db"` — the prompt's step satisfied and verified); vitest + playwright configs verified wired; all 8 Tailwind v4 trap pins intact (zero actual `rounded-full` in `src/`); zero orphaned :3100 servers; the session-15 additions (e2e-conventions scanner + helpers.ts) reviewed whole — no hard findings. | probes + code | — |

---

## Part B — Remediation TODO (execution order)

### Phase 1 — the RED state (TDD: the rules land enabled against the current code)

- [x] **R0. Enable both rules in `eslint.config.mjs`** (S16-F1/S16-F2):
  `react-hooks/exhaustive-deps: "warn"` + `@typescript-eslint/no-unused-vars:
  ["warn", { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern:
  "^_", caughtErrors: "none" }]` (the TS-aware rule only — the base
  `no-unused-vars` stays off so the 12 type-contract positions keep their
  documentation names while the 6 dead-code sites flag). RED state: 3
  exhaustive-deps warnings + 6 src + 6 scripts unused-vars warnings.

### Phase 2 — the exhaustive-deps remediation (latest-ref pattern, behavior-preserving)

- [x] **R1. `lesson-view.tsx` — the two reporter effects** (S16-F1):
  add `onAnsweredRef`/`onQuestionChangeRef` (useRef + a no-deps update
  effect each, declared BEFORE the consuming effects); the `onAnswered`
  effect keeps deps `[lessonIndex]` and calls
  `onAnsweredRef.current?.(0)`; the `onQuestionChange` effect is
  restructured to read `q` directly
  (`onQuestionChangeRef.current?.(q ? { question: q.question, options:
  q.options } : null)`, deps `[q]`) and the now-single-use
  `activeQuestion` const is deleted. The e2e-pinned quiz-flow semantics
  (session-counter reset on lesson change, chat-context question
  reporting) are the harness.
- [x] **R2. `onboarding-dashboard.tsx` — the pickup effect** (S16-F1):
  add `generateRef` (useRef + the no-deps update effect, declared before
  the pickup effect); the pickup keeps deps `[publicMode]` and calls
  `generateRef.current({ … })`. The e2e-pinned pending-setup pickup
  (the anonymous onboarding → login → auto-generate → /quiz flow) is the
  harness.
- [x] **R3. The old suppression trade-off comments deleted** (in
  eslint.config.mjs + the AGENTS/CLAUDE/SKILL docs where the "stays off by
  documented trade-off" rationale lives — now superseded by the ref
  pattern).

### Phase 3 — the dead-code cleanup (S16-F2)

- [x] **R4. `lesson-view.tsx`**: remove the `courseName` prop (the
  destructure + the type) + the two `courseName={…}` bindings in
  `hub-app.tsx` (desktop :402 + mobile :422).
- [x] **R5. `onboarding-dashboard.tsx`**: remove the `user`/`studentName`
  props (destructure + type) + the two bindings at
  `dashboard-app.tsx:185-186`.
- [x] **R6. `courses-app.tsx`**: remove the `deleting` state + both
  `setDeleting` calls (the value is never read — byte-identical UI).
- [x] **R7. `course-dashboard.tsx`**: remove the `const { toast } =
  useToast();` line + the import if now unused.
- [x] **R8. `ai.ts`**: remove `fallbackLesson`'s `lessonNumber` param +
  the call-site argument.
- [x] **R9. The scripts/ findings** (6): `eslint.config.mjs`'s `__dirname`
  const + `dirname` import; the unused destructurings in
  `capture-s13-shots.mjs` (low/three/exp), `capture-s14-shots.mjs` (s7),
  `paired-probe-v214.mjs` (cookie).

### Phase 4 — the vitest speedup (S16-F3)

- [x] **R10. `vitest.config.ts`**: `isolate: false` + the documenting
  comment (the 5-run shuffle-seed validation protocol; the pure-seams
  doctrine; the re-validation requirement when a stateful test file
  joins the suite).

### Phase 5 — gate, screenshots, docs, delivery

- [x] **R11. Full gate**: lint (zero findings, now with BOTH new rules)
  → typecheck → test (182 — with the 5× faster runner) → build → e2e
  (91 — per-spec chunks under the 10-minute command budget; kill any
  orphaned `standalone/server.js` on :3100 first per trap 41).
- [x] **R12. Screenshots** (`docs/screenshots/`): the dev server on the
  remediated tree — the authenticated dashboard, the MOBILE menu OPEN
  (the clone's working hamburger — the direct contrast to the live's
  7th-verified refusal), and one more surface per the session's focus
  (the courses page — the `deleting`-state cleanup's surface).
- [x] **R13. Docs alignment**: AGENTS.md (the exhaustive-deps ON
  invariant + the latest-ref pattern + the unused-vars ruleset + the
  isolate:false runner note; counts), CLAUDE.md (condensed), README.md
  (the session-16 section + counts), PAD v1.15 `[S16]` + the testing
  table, SKILL v1.15.0 (§7 the latest-ref pattern; the trap-39/trap-41
  notes unchanged), `docs/session_16.md` rewritten as the formatted
  session summary (the handoff convention), this plan's TODO check-offs,
  repo `worklog.md`; `.env.example` re-verify (no new env vars).
- [x] **R14. Commit + push** — Conventional Commit on main; push via
  `docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/personalized-tutor-app.git` (paramiko shim;
  remote ref verified == HEAD; key shredded). The credential-bearing
  probe scripts (`scripts/s16-*.cjs`) never enter the tree (the
  established convention — they live in the workspace's scripts/
  outside the repo).

---

## Part C — Plan-vs-code validation (pre-execution)

1. **R0's RED state is reproducible**: the two eslint experiment runs
   (this session) show exactly 3 exhaustive-deps + 18+6 unused-vars
   findings; enabling both rules in the config reproduces them in the
   gate ✓.
2. **R1/R2's ref pattern is behavior-preserving**: the consuming
   effects' deps stay the SAME firing triggers (`[lessonIndex]`,
   the question identity, `[publicMode]`); the refs only decouple the
   CALLBACK identity (which the sole call site makes stable anyway —
   hub-app passes state setters; generate closes over stable handles
   only). The `[q]` restructure fires on question-object identity —
   the old `[activeQuestion?.question]` fired on question-text change;
   both fire on content-load and question-advance (the only two ways a
   new question appears), and the object-identity version additionally
   catches duplicate-text question changes (a strict improvement, not
   a regression). `activeQuestion` has exactly ONE consumer (the old
   effect) — deletion is safe (grep-verified) ✓.
3. **R4-R8 are pure deletions**: `courseName`/`user`/`studentName` are
   never referenced in their components' bodies (the eslint scan IS the
   proof); `deleting`'s value never renders; `toast` is destructured
   but never called; `fallbackLesson`'s `lessonNumber` is never read in
   the body. Each deletion updates its single call site — typecheck +
   the full suite re-run is the proof ✓.
4. **R10's stability is probed**: 5 full runs (3 sequential + 2 shuffle
   seeds) green at 182/182; the ai-seam transport-capture pins
   (session-14's captured-`req.messages` assertions) would fail on any
   mock leakage — they pass in every probe ✓.
5. **The unit count stays 182 and the e2e count stays 91**: no test
   files are added or removed; the behavior-preserving refactors are
   proven by the existing pins (the auto-advance spec, the pending-setup
   pickup spec, the chat-context specs) ✓.
6. **No new infrastructure**: all changes ride the existing lint/vitest
   configs and the existing component files ✓.
7. **The session-15 conventions stay intact**: the e2e-conventions
   scanner still scans every spec (no spec files change in this
   session); the helpers module is untouched ✓.

Execution order note: Phase 1 (RED) → Phase 2 (refs, fast gate) →
Phase 3 (deletions, fast gate) → Phase 4 (runner) → fast gate → build →
Phase 5 (full e2e → screenshots → docs → push).
