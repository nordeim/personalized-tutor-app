# Session 14 — The Pin-the-Pin Pass

Continuing from session 13 (`8797fec` + the log commits; the full gate stood
at 175 unit + 90 e2e). This session turned the audit onto the session-13
commit itself — a two-axis code review (Standards + Spec, parallel
sub-agents per `skills/code-review`) whose two axes CONVERGED on the same
finding — plus the prompt's headline mobile-navigation re-verification.

## What was audited

- **Workspace refresh:** `git pull` → `348d3f8` (docs/session_14.md = the
  session-13 transcript, per the handoff convention). The workspace
  PERSISTED — `.env` + `db/custom.db` at the repo root
  (DATABASE_URL=`file:../db/custom.db`) + `node_modules` verified; the
  `.env.example` re-verified byte-identical (no new env vars); vitest +
  playwright configs verified wired (175 unit, 90 e2e). The stale shell
  `DATABASE_URL` trap re-armed itself — every command ran under
  `env -u DATABASE_URL`. Baseline fast gate green (lint 1 benign warning ·
  typecheck ✓ · 175 unit ✓ · build ✓).
- **The live app bundle is BYTE-IDENTICAL** (md5 `f99e7279…`, 788 085 bytes
  — the same `index-CkEI9gsZ.js` sessions 9-13 decoded), so every prior
  decode stands. The live re-probe: the login works, the account remains
  in the onboarding state (the entity-write 403 block — "Dive into
  Literature"), the unauthenticated mobile `/hub` visit re-confirmed the
  `navigateToLogin` full-URL from_url decode, and the **mobile-nav headline
  re-verified for the 5th consecutive session** — the live's hamburger tap
  at 390×844 `hasTouch` still REFUSES (elementFromPoint at the button
  center IS the `fixed top-0 z-[100]` toaster container with
  `pointer-events: auto`); the clone's fix + real-tap pins hold.
- **scandihaven re-consulted** (unchanged at `cb0002a`; nothing new to
  adopt). The repo's Tailwind v4 skills re-consulted (the toaster-cover
  class-D taxonomy; all 8 trap pins re-verified intact — zero
  `rounded-full` in `src/`).
- **The two-axis review of `8797fec`:** zero HARD standards violations and
  a faithful R0-R9 spec implementation — but BOTH axes flagged the same
  P2: **the R1 prompt-tail unit pin was vacuous**. My read confirmed it
  (the details in the remediation plan's S14-F1). The Standards axis also
  surfaced the submit-route validation scatter (dead guards,
  post-lookup placement) and the duplicated stage-object predicate; the
  Spec axis surfaced the streak-burst confound (the 2→3 drive crosses a
  label change too).

## The remediation (TDD: `docs/remediation-plan-session-14.md`)

1. **S14-F1 — the vacuous prompt-split test replaced with captured-
   transport VERBATIM pins.** The mocked `completions.create(req)`
   receives `req.messages` (the user prompt last) — a `vi.hoisted` holder
   records it, and the two roadmap prompt tails are now asserted verbatim:
   the generate-time object tail (`"description": "2-3 sentence
   description."` + the `Create exactly 3 progressive learning stages`
   wording) vs the submit-time string-array tail (`["Step 1: ...", …] }` +
   the `Based on someone scoring 60%` wording), plus the material-aware
   subject swap ("their uploaded material" / `"Custom Material"`) and
   bidirectional negatives (each branch must NOT carry the other's
   schema). **Mutation-verified**: temporarily swapping the tails in
   `ai.ts` fails EXACTLY the two new pins; restoring brings the suite
   green. The session-13 comment "the mock's call history is not directly
   exposed" was simply wrong.
2. **S14-F6 — the streak-burst isolation drive.** The 2→3 e2e drive
   crosses BOTH the exact-3 streak boundary AND the Learner→Scholar tier
   change, and canvas-confetti renders onto ONE shared global canvas, so
   a count cannot attribute the burst. The new drive isolates: scores 6
   and 7 with total 7 — `quizProgressPercent` clamps 120/140 → 100 → tier
   Master→Master (the label effect CANNOT fire) while streak 6→7 crosses
   EXACTLY 7 → the 80-particle burst is the only possible source.
   e2e-pinned + **pixel-verified**: 1,383 burst-particle pixels in the
   screenshot vs a direct-mount same-view baseline (the session-13
   diff+palette method).
3. **S14-F2 — the submit route consolidated to validate-first /
   derive-after.** ALL present-but-invalid 422s (answers/score/total) now
   run BEFORE the enrollment lookup; the derivations read only validated
   input (the dead `&& body.total > 0` guard and the score
   re-derivation cascade deleted). The 422 status matrix is
   byte-identical for every pinned input class (the e2e 422 family in
   session12 + session13 specs, re-run green without edits).
4. **S14-F3/F4 — one predicate, one constant, corrected comments.**
   `isStageObject` in `domain.ts` (the exact predicate both sites
   hand-rolled, direct unit pins added); `parseRoadmap` and the AI seam's
   dual-shape element validator both consume it; `STAGES_PER_COURSE`
   replaces ai.ts's magic 3; the "THREE distinct roadmap prompts" comment
   now names the third (the skip-time variant the live's wO fires and
   discards by its own code).
5. **S14-F5/F7 — the polish.** The unused `eslint-disable` removed (lint
   back to ZERO findings); the superseded session-11 one-shot dev-server
   probes retired (`scripts/verify-s11-*.mjs` × 4 — their coverage lives
   in `tests/e2e/session11-parity.spec.ts`, and git history is the
   archive; the session-13 handoff's own suggested cleanup).

## The gate

lint (zero findings) ✓ · typecheck ✓ · **179 unit** ✓ · build ✓ ·
**91 e2e** ✓ (the full suite re-run fresh: 90 + 1 new isolation drive).
Screenshots 91-96: the remediated dashboard, the isolated streak burst
(mid-flight), the course-switch flow, and the /hub MOBILE tab shell at
390×844 (Learn / Ask Nori / Lessons — the session-13 handoff's suggested
surface, plus the Ask Nori and Lessons tab views).

## Delivered

Commit on `main`: the prompt-capture pins + the isolation drive + the
route consolidation + the shared guard + the cleanups + the docs
alignment (AGENTS/CLAUDE/README/PAD v1.13/SKILL v1.13.0 with trap 40 +
this summary + the checked-off plan + the worklog). Push via
`docs/ssh_git_wrapper_v3.py` (remote ref verified == HEAD; key shredded).

## Next-session suggestions

The audit surface is narrowing to test-quality and hygiene: a sweep for
OTHER vacuous/confounded assertions across the 15 spec files (the
trap-40 lens — e.g. every canvas-count assertion deserves an isolation
check); the e2e helper duplication (generateCourse/cleanup repeated
across session12/13 specs — an extraction to `helpers.ts`); or a run of
the deprecated-API/kb drift checks (`bunx tsc --noEmit` is clean, but a
`next lint --rules` pass over the newer React 19 hooks lints would
harden the lint gate further).
