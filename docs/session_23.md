I'll continue with the Session 21 task chain. The new instructions reference `docs/session_20.md`, `docs/remediation-plan-session-19.md`, `worklog.md`, and `docs/session_21.md` — so Sessions 19 and 20 are complete, and Session 21 is the current task. Let me start by refreshing the workspace.
The workspace exists. Let me refresh it with `git pull`:
Working tree is clean and on main. Let me pull the latest from remote and check the status docs:
`git pull` succeeded — the new `docs/session_21.md` (98 lines) was just fetched. Per the established convention, the current task chain is **Session 21** (Sessions 19 & 20 complete and pushed). Let me set up the task plan and read all required documents.
让我阅读状态文档以确认当前的项目状态：
Now I understand the state: `session_20.md` and `session_21.md` are both transcripts of the Session-19 execution (two log-only commits `2795b01` + `94abdc1` absorbed the Session-20 slot). Per the established convention (highest referenced doc = current chain), **this is the Session 21 task chain**. Let me read the remediation plan and remaining status docs:
Session-19 的计划已全部执行完毕。让我阅读工作日志的近期记录，然后开始阅读 5 份项目文档：
Repo state fully consistent with the worklog (Task ID 34/35, screenshots 106-108, tree clean at `94abdc1`). Now let me read the 5 project documents:
Let me read the documents in chunks to avoid output truncation:
AGENTS.md read. Now CLAUDE.md:
CLAUDE.md 已读取。现在开始读取 README.md：
README done. Now the Project Architecture Document:
The PAD has very long lines. Let me extract the key sections via grep:
Now the SKILL file — let me check its structure and read key sections:
已读取所有 5 份项目文档。我已经发现了两处潜在的文档对齐问题。让我来精确验证它们：
Confirmed two real doc-drift findings from Session-19's docs pass:
1. **PAD §1.2 (line 73)**: tech-stack table still says `noImplicitAny: false` — contradicts the same doc's [S19] entry and K-4 retirement
2. **SKILL §11 (lines 834/836)**: pre-ship checklist still says "153 Vitest / 86 Playwright" — actual counts are 197/91

Let me update the todo list and consult the skills catalog:
技能目录已查询。现在让我检查是否存在 shell `DATABASE_URL` 陷阱（这是文档中记录的风险），并运行 baseline fast gate：
Lint zero · typecheck ✓ · 197 unit in 421ms. Now the build:
Build green — baseline fast gate complete. Now let me audit the session-19 code changes (the recent changes):
The wrapper and plan module are clean. Now let me examine the handoff direction #3 — the AI-route regex duplication between the conventions scanner and shard-plan:
**发现关键偏差！** 这些路由集不一致：
- conventions 扫描器：6 个路由，**没有 `/api/quiz/skip`**（记录在案的 session-11 修复 —— clone 跳过了丢弃的 LLM 调用）
- shard-plan 的 `AI_ROUTE_PATTERN`：**7 个备选项，包括 `quiz/skip`** —— 且其自身的注释声称是“六个路由”

模块注释与其自身的 regex 相矛盾。让我来验证其影响：
**Drift confirmed — the pin itself is self-contradictory**: the test named "matches exactly the **six** AI-backed routes the conventions scanner knows" lists **7 routes** and asserts `toHaveLength(7)`. Let me quantify the impact:
Impact quantified: `session11-parity.spec.ts` carries 1 spurious `quiz/skip` mention (a flow **comment**), inflating its weight by 45 units — while the clone's `/api/quiz/skip` route deliberately makes **no AI call** (the documented session-11 fix). Let me consult the required skills, then continue the audit:
技能已查阅。现在让我验证测试 configs、依赖项更新情况以及 Tailwind v4 固定版本（移动端导航检查）：
有一个 `rounded-full` 出现了（之前记录为零）。让我检查一下：
这只是一个记录线上替代 Chrome 的代码注释——零实际使用量，符合文档记录。现在让我重新参考一下 `scandihaven` 参考（根据提示）并检查 `worklog` 工作空间：
scandihaven 在 `cb0002a` 处未更改 ✓。现在进行实时探测（第 10 次连续验证）。根据惯例，探测脚本存放在仓库之外。让我检查一下现有的探测脚本：
The prior probe script is the exact template. Let me create the s21 version and run the 10th consecutive live verification:
V1/V2/V4 已验证 — bundle **连续 10 次 session 字节完全一致**。V3 的通用 locator 漏掉了（已知问题）；让我运行针对性的 mobile-nav 探测：
**V3 已连续第 10 个 session 确认**：hamburger 位于 (334,12) 36×36，`elementFromPoint` = `fixed top-0 z-[100]` toaster，点击被拒绝。完整线上探测已通过。现在让我映射 route-set 重复的所有位置：
The audit is complete. Let me do a final stale-counts sweep across all docs, then check the SKILL §11 block fully:
Audit complete. Let me check the workspace worklog and record progress, then write the remediation plan:
现在我已经掌握了完整的审计情况。让我检查一下 API 目录结构（这是权威 pin 设计所需的）：
The authority set is filesystem-verifiable: exactly 6 route.ts files import `@/lib/ai`. Now let me write the Session-21 remediation plan:
Plan written and validated against the codebase. Now executing **Phase 1 — RED** (the corrected and new pins):
Now writing the RED state — first the corrected shard-plan pin:
现在开始为规范模块编写新的基准测试文件 (R0b)：
There's a path bug in my authority pin (double "api" segment). Let me fix it:
现在让我确认 RED 状态（两个测试文件都针对一个不存在的模块 + 错误的模式）：
**RED confirmed** — both files fail on the nonexistent module (`Cannot find module './e2e/ai-routes'`), 16 other files stay green. Now **Phase 2 — GREEN**: the canonical module:
I have a derivation bug — the route prefix would be doubled (`api/(api/courses/generate|…)`). Let me fix it:
现在让我简化 `ai-routes.test.ts` 中的互一致性 pin（源表达式）：
现在重新连接消费者。首先是 `shard-plan.ts` (R2a)：
Let me fix the import placement (imports belong at the top — `import/first` lint rule):
现在重新连接 conventions scanner (R2b)：
Now let me run the GREEN check — the full unit suite:
The RegExp constructor escapes `/` as `\/` in `.source` (same serialization as the original literal — semantics identical). Let me fix the pin's comparison to unescape:
**GREEN: 201 unit tests.** Per the vitest protocol (a new stateful/fs-reading test file joined the `isolate: false` suite), let me re-validate with shuffle seeds:
CLI 参数语法问题 — seed 是一个单独的选项。我来修复：
Shuffle re-validation green (2 seeds × 201/201). Now the fast gate on the new files:
Fast gate green. Now **Phase 3 — the sharded e2e re-verification** (the planning input changed). Kill orphans first (trap 41), then run:
All 3 shards green with the count invariant (93 = 91 + 2 setup copies). Let me capture the weight table (the plan's R3 evidence) with a planning-only script:
**R3 verified**: session11's weight is now **96** (the spurious 45 gone), the plan re-lands **364/291/290** (total 945, down from 990), count invariant green on the real run. Now **Phase 4 — docs alignment**. First the two stale-doc fixes (R4a + R4b):
R4a + R4b done. Now the session-21 entries — AGENTS.md first:
Now CLAUDE.md — the counts + the session-21 invariants block:
Now README.md — counts + the session-21 section:
Now the PAD — version bump, SR line, [S21] entry, testing table:
My edit corrupted the [S19] entry — its header was consumed. Let me repair by restoring the [S19] header at the junction:
The revision block order needs fixing ([S21] should follow [S19] chronologically). Let me reorder:
Order fixed. Now update the PAD testing table (the file list + count):
PAD done. Now the SKILL file — version bump, frontmatter, trap 47, §15 pattern:
Now add trap 47 to the SKILL trap log (after trap 46, before §10):
Now the §15 pattern. Let me find the balanced-shard pattern's end:
SKILL done. Now check off the remediation plan TODOs:
My sed mangled the TODO lines. Let me repair them:
All TODOs checked off. Now R4d — re-verify `.env.example` parity, then run the fresh build for the full gate:
Build green. Now the serial e2e (the byte-compatible default):
**Full gate green** — both e2e modes (serial 91/91 in 1.4m + sharded 3/3 with the count invariant). Now R6 — screenshots 109-111. Let me check the prior capture script:
Screenshots captured with the menu tapped open. Let me run the deterministic verification of the menu-open state, then stop the dev server:
MENU OPEN verified (true / 1 instance), dev server stopped. Now the final docs — rewrite `docs/session_21.md` as the formatted session summary (the handoff convention). Let me check the session-19 summary format first:
Now append the repo worklog entry (Task ID 37):
Now the pre-commit verification — full fast gate + credential scan:
Credential scan clean. Now the commit:
Commit `8bc8462` created (16 files, +708/-137). Now the SSH wrapper push — check the shim + wrapper state first:
Infrastructure ready. Materialize the operator key outside the repo and verify:
The wrapper needs the shim on PATH. Let me prepend it:
Dry-run green (`94abdc1..8bc8462 → main`). Now the real push:
Push verified by the wrapper (`8bc8462 @ main == HEAD`). Now the independent ls-remote verification:
Independently verified: remote main @ `8bc846262f19f9db23d909dea15bd6a6c25e3bd5`. Now destroy all key material:
All keys destroyed, tree clean at `8bc8462`. Now the session-log commit — `docs/session_22.md` with this session's raw transcript (the handoff convention):
Log commit `68c85eb` created. Now push it via the wrapper:
All pushed and verified. Final housekeeping — the workspace worklog:
**Session 21 完成 ✅** — 已推送到 `main`（修复提交 `8bc8462` + 日志提交 `68c85eb`，远端经 wrapper 断言 + 独立 `ls-remote` 双重复核一致，SSH 密钥全部销毁，工作树干净）。

本轮核心成果：

1. **规范路由集合模块**：session-19 移交方向三预测的“两个 AI 路由正则会漂移”**已经发生**——shard-plan 的 7 备选正则（含 `quiz/skip`）vs conventions 扫描器的 6 路由数组，而 pin 名与注释都自称“六条一致”（自相矛盾的 pin，钉错契约）。现抽成单一模块 `tests/e2e/ai-routes.ts`（数组 + 从数组派生的正则，孤儿备选在构造上不可能），配**文件系统权威 pin**（遍历 `src/app/api/**`，断言集合 == 实际 `@/lib/ai` 导入者——集合从此不可能再与代码漂移）。修正后权重表：session11-parity 96（虚增 45 移除），规划落位 364/291/290。
2. **两处文档漂移闭合**：PAD §1.2 的 `noImplicitAny: false`（与其自身 [S19]/K-4 矛盾）、SKILL §11 的 153/86 计数 → 均已修正。

门禁全绿：lint 零 · typecheck · **201 unit**（含 shuffle 双种子）· build · 91 e2e 双模式（串行 1.4 分钟 / 均衡分片 3/3，计数不变式绿）。Live bundle 第 10 次字节一致；移动端导航 live 仍不可点（第 10 次）、克隆 12/12 pins 有效。截图 109–111、`.env.example` 复核、全部文档对齐入库。

**下一步建议（Session 22）**：(1) 陷阱 47 教义可推广——`AI_TIMEOUT_MS`/`AI_WEIGHT_SECONDS`/`60_000` 三份超时预算视图值得互洽 pin；(2) 慢速 LLM 域成常态时再评估录制夹具/实测权重校准（本轮已按论证延期）；(3) 未来手工正则扫描器应从出生起遵循“从数组派生”模式。
