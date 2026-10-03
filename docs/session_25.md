I'll start by carefully reviewing this complex task. Let me first set up my task plan, then examine the workspace and the uploaded file.
Let me read the full operating instructions file to internalize it.
I've internalized the operating instructions. Now let me clone the repos and set up the workspace.
仓库已成功克隆。现在让我查看一下项目结构和核心文档。
现在让我查看一下文档文件的大小，并阅读核心文档。
The persisted output is nested. Let me read the original AGENTS.md file directly in chunks.
Now let me read CLAUDE.md and README.md.
Now let me read README.md and the Project Architecture Document.
Now let me read the Project Architecture Document.
Let me check the PAD's section structure to focus on the key sections.
Now let me review the personalized-tutor-app_SKILL.md structure.
Now let me read the session docs — session_22.md, session_23.md, remediation-plan-session-21.md, and worklog.md.
Let me check what the recent commits changed and read the remediation plan and worklog.
Now let me read the tail of the repo worklog.md to understand the latest state.
I now have a comprehensive understanding of the project state. The repo is at Session-21-complete state (201 unit + 91 e2e), and this task continues the chain (Session 23, per the highest referenced doc `docs/session_23.md`). The workspace was reset, so I need to re-establish the environment. Let me validate the current codebase state.
Workspace is fresh — no `.env`, no `db/`, and the **stale shell `DATABASE_URL` trap is armed** (`file:/home/z/my-project/db/custom.db` would override `.env`). Let me check `.env.example` and the test configs.
Let me review the db-path seam and the key lib files, then set up the environment.
The db-path seam already implements the required convention. Now let me set up the environment — `.env`, `db/` folder, dependencies.
Dependencies installed. Now let me push the DB schema, seed, and run the baseline gate (using `env -u DATABASE_URL` per the documented shell trap).
Baseline fast gate green: lint zero · typecheck ✓ · 201 unit ✓. Now the build.
Build green. Now let me check for orphaned servers and run the baseline e2e suite.
**Baseline FULL gate green**: lint zero · typecheck ✓ · 201 unit ✓ · build ✓ · 91 e2e passed (1.9m — the 429s are the documented expected fallback regime). Let me record progress in the workspace worklog and consult the repo skills catalog.
让我阅读一下此任务的相关技能 —— tdd、code-review-and-audit、webapp-testing-journey（移动端导航参考）以及 agent-browser。
agent-browser is available. Now let me review the scandihaven reference repo docs.
Let me review scandihaven's skills catalog and key parts of its SKILL and CLAUDE docs.
I now have a complete picture of both repos' patterns. Next, the critical live-app verification. Per the established convention, credential-bearing probe scripts live in the WORKSPACE `scripts/` dir (outside the repo). Let me set that up.
Playwright + Chromium are ready. Let me write the live-app probe script (the 11th consecutive verification) in the workspace scripts dir.
**11th consecutive live verification complete**: V1 login ✓ · V2 bundle **byte-identical** (md5 `f99e7279…`, 788,085 bytes) ✓ · V3 mobile-nav headline — the live's hamburger at (334,12) is still covered by the `fixed top-0 z-[100]` toaster, tap **REFUSED** ✓ · V4 auth-gate bounce ✓ · V5 reference screenshots captured. Let me compare the live dashboard against the reference image and the clone.
Bundle byte-identity (the ground truth) holds — the live app is unchanged, so parity surface is stable. Now let me audit the codebase systematically, starting with the recent session-21 changes and the mobile-nav/Tailwind hotspots.
All 8 Tailwind v4 trap pins + the toaster fix are intact. Let me now audit the mobile navigation spec and the app-header hamburger implementation.
The mobile-nav spec is comprehensive. Let me audit the app-header component and check recent changes across the codebase.
The app-header implementation matches the decoded reference contract. Now let me examine the session-22 handoff direction — the timeout budget family (`AI_TIMEOUT_MS` / `AI_WEIGHT_SECONDS` / the 60s trap-39 convention).
The timeout budget family is exactly as the session-22 handoff described — three views (`AI_TIMEOUT_MS = 45_000` private in ai.ts, `AI_WEIGHT_SECONDS = 45` in shard-plan.ts, the 60_000 trap-39 convention) with **no mutual-consistency pin**. Let me continue the audit with dependency freshness and a stale-count sweep.
Only doctrine-excluded majors remain — dependency health is clean. Now the stale-count sweep across docs.
Docs are fully aligned (historical counts only appear in changelog entries). Let me verify the sharded e2e mode also runs green, completing the baseline verification of both modes.
Both e2e modes green (serial 91/91 + sharded 3/3, count invariant 93==93). Now let me examine `ai.ts` to scope the timeout-budget finding.
Let me read the conventions scanner fully and check how specs handle per-test timeouts.
Let me count the actual API route handlers and check for doc-count drift — a classic stale-doc finding class.
Found a genuine stale-doc finding. Let me verify the CLAUDE.md claim too.
Confirmed — handler count stale in 3 places (CLAUDE 14, README 15, PAD §4.2/§3.3 14; actual = 16). Let me finish the audit with hygiene checks.
All hygiene checks pass. Let me look at the SKILL trap log structure (for the remediation's doc alignment) and verify the shard-plan comment referencing AI_TIMEOUT_MS.
The audit findings are consolidated. Let me verify one critical design constraint — whether the sharded wrapper imports shard-plan (which would constrain importing `@/lib/ai` from test-infra modules).
The wrapper constraint is confirmed — `shard-plan.ts` runs inside `scripts/e2e-sharded.mjs` where `server-only` is NOT installed, so it must NOT import `@/lib/ai`. The mutual-consistency **pin** (not a shared constant) is the correct design. The audit is complete. Let me write the comprehensive remediation plan.
Plan written and validated. Now executing **Phase 1 — RED**: the failing pins first.
**RED confirmed** — the new file fails on the nonexistent module, 18 other files stay green. Now **Phase 2 — GREEN**: the canonical module, the export, and the consumer rewirings.
Now the consumer rewirings — the conventions scanner (R1c) and the shard-plan comment (R1d).
8 failures — let me inspect what broke.
The direct run shows 204/204 green, but `bun run test` failed earlier with 8 failures — an order-dependent issue under `isolate: false` (exactly the documented hazard). Let me reproduce and capture the failure details.
3 sequential + 6 shuffle-seed runs all green — but that single 8-failure run right after the edits is a flake signal I must root-cause, not shrug off. Let me reproduce it aggressively.
17 of 18 runs green — but the one failure demands a root cause. My hypothesis: with `isolate: false`, when `ai-budget.test.ts` (imports `@/lib/ai` un-mocked) shares a worker with `ai-seam.test.ts` (which `vi.mock`s the SDK) **and runs first**, the shared `@/lib/ai` instance holds the real SDK and the transport-capture pins fail. Let me test this directly.
Both orders pass — vitest 5 isolates `vi.mock` per file even under `isolate: false`, disproving the mock-leak hypothesis. One remaining question: what does the real SDK module execute at import time (my `ai-budget.test.ts` is the only file that loads it un-mocked)? Let me root-cause that.
The SDK is import-safe (class definition only — `loadConfig` runs inside `ZAI.create()`, never at import). The flake investigation is closed: mock-leak disproven (both-orders experiment), SDK side-effects disproven (source inspection), consistent with one-time transform-cache churn during the 4-file write window. 17 green runs since. Let me run the fast gate on the changed tree.
Fast gate clean. Now **Phase 3 — docs alignment**: first the handler-count fixes (S23-F2).
Handler counts fixed. Now the session-23 entries — AGENTS.md first (the canonical-budget invariant).
Now update the AGENTS.md count references (201 → 204 unit).
Now CLAUDE.md — session-23 invariants block, counts, and date.
Now README.md — counts + the session-23 section.
Now the session-23 section in README (after the session-21 section, before "Pushing to GitHub").
Now the PAD — version bump to v1.19, the SR line, the [S23] revision entry, and the testing table.
Now the [S23] revision entry and the testing-table update.
Now the PAD testing-table row (add ai-budget.test.ts + count 204).
Now the SKILL file — version bump, frontmatter, §11 counts, trap 48, and the §15 pattern.
Now add trap 48 after trap 47 in the SKILL trap log.
Now the §15 pattern extension. Let me find the canonical-constant pattern block.
Now check off the remediation plan TODOs and rewrite `docs/session_23.md` as the formatted session summary.
`NEXT_PUBLIC_SITE_URL` is documented but has no `src/` consumer (static metadata, no `metadataBase`). Let me record this as an informational finding in the plan, then write the session summary.
Now rewrite `docs/session_23.md` as the formatted session-23 summary (the handoff convention).
Now **Phase 4 — the full gate**. Fast gate first, then build.
**FULL GATE GREEN** — lint zero · typecheck · 204 unit · build · 91 e2e serial (2.3m) + sharded 3/3 (count invariant 93==93). Now R4 — screenshots 112-114 on the dev server.
**MENU OPEN: true / My Courses instances: 1** — deterministic verification passed (the 11th-verified contrast to the live's refusal). Let me stop the dev server and verify the artifacts.
Screenshots 112-114 in place. Now the repo worklog entry and pre-commit verification.
The credential scan caught the live login email in my new docs — the prior sessions' convention keeps live credentials (even the email alone) out of the repo tree. Let me scrub it.
The worklog.md:12 hit is pre-existing committed history (not my diff); the plan file line 36 is mine and in the staged diff — scrubbing it to the prior sessions' phrasing.
Staged scan clean — 16 files. Now the commit.
Commit `26fdc55` created. Now let me read the SSH wrapper runbook and prepare the push.
Runbook understood. Let me set up the push infrastructure — check ssh/paramiko availability.
paramiko 5.0.0 installed. Now deploy the ssh shim (Appendix A) outside the repo.
Key verified (ed25519, SHA256 `3ddaNlFh…`). Now the wrapper dry-run with the shim on PATH.
Dry-run green (`2a9bfd7..26fdc55 → main`). Now the real push.
Push verified by the wrapper (`refs/heads/main @ 26fdc55 == local HEAD`). Now the independent ls-remote verification, then key destruction.
All key material destroyed. Now the session-log commit — `docs/session_24.md` with this session's raw transcript (the handoff convention).
**Session 23 fully delivered** — remote main @ `6e17f3c` == local HEAD, all keys destroyed, tree clean. Let me finalize the workspace worklog and todos.
All tasks complete. Here's the final verification ledger:

## Session 23 Complete ✅

**Verified state**: Remote `main` @ `6e17f3c` (fix `26fdc55` + log commit) — wrapper-asserted + independently ls-remote-verified; all SSH key material shredded (3-pass); tree clean.

**What was done:**
- **Workspace refreshed** (fresh clone; `.env` → `DATABASE_URL="file:../db/custom.db"`, `db/` at repo root, deps installed, seeded)
- **Docs internalized** (5 project + 4 status docs); codebase validated — baseline gate fully green on fresh checkout
- **Live app probed (11th consecutive)**: bundle **byte-identical**, mobile-nav live bug still present (tap refused behind toaster), clone's fix + pins green
- **Audit** (with repo skills): found the AI timeout budget family held together only by comments (trap 47's named hazard class) + stale handler counts (14/15 vs actual 16)
- **TDD remediation**: 3 new mutual-consistency pins (`tests/ai-budget.test.ts`), canonical `tests/e2e/ai-budget.ts`, `AI_TIMEOUT_MS` exported, scanner rewired — **204 unit + 91 e2e green in both modes**
- **Screenshots 112-114**, docs aligned (PAD v1.19, SKILL v1.19.0 + trap 48), `.env.example` verified

**Next steps**: consider wiring `NEXT_PUBLIC_SITE_URL` → `metadataBase` when canonical metadata lands (S23-F5); the flake playbook in trap 48 covers any future `isolate:false` one-run failures.
