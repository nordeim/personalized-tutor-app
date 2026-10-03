我将继续执行会话 16 任务链。最新的指令引用了 `docs/session_15.md`、`docs/remediation-plan-session-15.md` 和 `docs/session_16.md` —— 确认会话 15 已完成，当前任务是会话 16。让我先刷新工作区。
The workspace exists. Let me refresh it with `git pull`:
`git pull` 成功 —— 拉取了 `docs/session_16.md`（Session 15 已完全提交并推送）。我来设置 Session 16 的 TODO 列表：
Now let me read the 5 project documentation files:
Now let me read the SKILL.md and the 4 status documents:
`docs/session_16.md` 确认 Session 15 已完成（已推送 `7412f8b` + `7702692`）——这是 Session 15 的执行日志。现在让我阅读剩余的状态文档：
All 4 status documents reviewed. Session 15 is fully delivered (182 unit + 91 e2e green, remote main @ `7412f8b` + log commit `7702692`). The Session 15 handoff suggests three directions for Session 16: exhaustive-deps suppression refactor evaluation, no-unused-vars cleanup, and vitest `isolate: false` speedup.

Let me update my todos and verify the workspace state:
工作区已验证：`.env` 中含有正确的 `DATABASE_URL="file:../db/custom.db"`，`db/` 位于仓库根目录，`.env.example` 字节一致。注意：旧 shell 的 `DATABASE_URL` 坑又再次生效了 —— 所有命令都必须在 `env -u DATABASE_URL` 下运行。让我运行基线快速门控：
Lint 和 typecheck 已通过。接下来是单元测试：
182 unit tests green. Vitest itself flags the `isolate: false` speedup (~1.2s) — matching the Session 15 handoff's suggestion. Now let me start the build in the background and read the skills catalog for the audit:
让我检索技能目录以寻找审计技能：
Let me look at the key skills in the repo's skills folder:
技能已加载。现在让我按照 code-review 技能的双轴方法，审计最近的 session-15 提交 (`7412f8b`)：
第15次会话的提交主要是测试基础设施和文档。现在让我针对第15次会话交接的三个方向，对代码库进行第16次会话的深度审计。首先，让我检查测试/ `lint` 配置以及已标记的区域：
现在，让我对交接建议的三个方向进行 Session-16 审计扫描。首先，检查 `no-unused-vars` 的发现和 `exhaustive-deps` 的抑制情况：
已识别出完整的未使用变量（unused-vars）列表 — `src/` 中有 18 个唯一发现 + 6 个在脚本中。现在让我检查 `exhaustive-deps` 抑制点，以评估安全重构方案：
我看到了 lesson-view 的抑制点。让我检查一下 onboarding-dashboard 的抑制情况以及剩余的 unused-vars 站点：
接下来，让我查看 `app-header`、`toast`、`ai.ts` 中剩余的 `unused-vars` 位置，并检查构建：
I noticed the sed output shows suspicious truncated lines (`const odalOpen, setModalOpen]` and `const ode, setMode]`). Since typecheck passed, this is likely an output rendering artifact — but let me verify the actual file content with Read:
文件完好无损——sed 的异常只是 `[m` 序列的终端渲染残留。现在让我检查剩余的细节：`generate` 函数体（闭合分析）以及构建状态：
`generate` 的函数体只关闭了稳定的 setter、`toast`（来自 context 的稳定 `useCallback`）、`router`（稳定的）——因此最新的引用（latest-ref）模式是行为等价的。让我确认一下构建是否已完成：
后台构建未在 `bash` 会话结束后存活。我来在前台重新运行它：
Build succeeded — baseline gate fully green (lint zero · typecheck · 182 unit · build). Now the live-site re-probe (7th consecutive verification). Let me check the workspace scripts directory for previous probe patterns:
Now let me create the Session 16 live probe script (7th verification — outside the repo per convention):
第7次验证：登录正常，移动端导航的点击依然被拒绝（toaster 覆盖层），/hub 匿名跳转正常。但未找到 `appBundle` ——让我运行一个针对性的 bundle 检查以调查：
**第7次连续会话：线上 app bundle 字节级一致** (md5 `f99e72793316ead62b335b6fd55ed6d5`，788,085 字节 — `index-CkEI9gsZ.js`)。之前的“未找到”是因为登录页面仅加载了平台 shell；app bundle 位于已认证的页面上。现在让我重新咨询 `scandihaven` 参考仓库：
scandihaven unchanged at `cb0002a`. Now let me empirically test the vitest `isolate: false` speedup direction (with mock-pollution hazard check):
快了 5 倍（1.9秒 → 375毫秒），所有 182 个都通过了。让我通过多次运行和随机排序来验证稳定性（mock 污染危险）：
`isolate: false` 在不同种子的 5 次运行（包括乱序运行）中均保持稳定。现在开始标准的 Tailwind v4 trap pins 验证：
All trap pins intact. Let me check for orphaned servers (trap 41) and run the mobile-navigation e2e spec as the focused clone verification:
Mobile-nav e2e 12/12 全部通过（根据 AI-fallback 设计，出现 429 是预期的）。现在让我检查一下 hub-app 的回调绑定，以进行 exhaustive-deps 重构规划：
审核进展顺利。现在让我对 session-15 的关键新增文件（conventions scanner + helpers）进行双轴审查：
Session-15 的补充内容经审计确认无误。让我来验证剩余的 cleanup sites —— ai.ts 的 fallbackLesson 调用者，以及 onboarding-dashboard 的调用者：
`fallbackLesson` 有一个调用者；`OnboardingDashboard` 只有一个调用者。现在让我通过启用该规则来确认 `exhaustive-deps` 的准确发现集：
已确认准确发现 3 处 `exhaustive-deps` 问题。在制定计划之前，让我先核对一下 `lesson-view` 效果上下文中的最终细节：
审查完成。现在让我来编写包含详细待办事项（ToDo）列表的第 16 次（Session-16）修复计划：
计划已制定并针对代码库进行了验证。现在开始执行 — 更新待办事项并从 Phase 1（RED 状态）开始：
现在进入第一阶段 —— RED 状态。启用 eslint.config.mjs 中的两条规则：
现在让我验证 RED 状态：
**RED state confirmed: 14 warnings** (3 exhaustive-deps + 6 src dead-code + 5 scripts — `__dirname`/`__filename` now exempt via the `^_` pattern). Now Phase 2 — the latest-ref pattern refactor. R1: lesson-view.tsx:
R1 已应用。现在进行 R2 — onboarding-dashboard.tsx 的 pick-up 效果：
现在让我来验证 exhaustive-deps 的发现是否已解决：
All 3 exhaustive-deps findings resolved (14 → 11). Now Phase 3 — dead-code cleanup. R4: remove the `courseName` prop from lesson-view + hub-app call sites:
R4 已完成。现在进行 R5 —— 移除 `user`/`studentName` 属性：
现在检查两个文件中孤立的外引用（orphaned imports）：
R5 complete. Now R6 — remove the dead `deleting` state in courses-app.tsx:
sed 显示再次造成了误导 —— 实际文本是 `const [modalOpen, setModalOpen]`。让我用准确的文本重试：
R6 complete. Now R7 — remove the unused toast in course-dashboard.tsx:
R7 complete. Now R8 — remove `fallbackLesson`'s unused `lessonNumber` param:
R8 done — but let me verify the enclosing function still uses its own `lessonNumber` (for the LLM prompt):
`generateLessonContent` 自身的 `lessonNumber` 现在也未被使用了（此前仅在 fallback 调用中被引用）。我来检查一下它的调用者：
该链条在端到端（提示词和回退中均未使用）完全是多余的。正在从函数签名和路由调用中移除：
让我检查一下测试套件中是否有签名引用：
已清理 — 仅在路由中引用。现在进行 R9 — 脚本清理：
现在清理 eslint.config.mjs 中无用的 `__dirname` 脚手架：
现在验证 GREEN 状态 — lint + typecheck：
Lint 无异常，typecheck 通过。现在进入第 4 阶段 — R10：在 vitest.config.ts 中应用 `isolate: false`：
现在开始快速门禁重检——在配置了新 runner 的情况下运行单元测试：
182/182 达到 379ms（快了 5 倍）。现在重新构建（src 已更改）并运行完整的 e2e 测试套件：
Build green, no orphans. Now the full e2e suite in chunks:
分块 1：36/36。分块 2：
分块 3：13/13。分块 4 —— 繁重的 AI 会话规范：
第 5 块：6/6，无孤儿进程。让我用 `--list` 验证精确的 e2e 计数不变性：
**Full gate GREEN: 91 tests in 17 files** (count invariant holds; all chunks passed). Now R12 — dev server screenshots. Let me check existing screenshot numbering and start the dev server:
开发服务器运行正常。正在编写截图捕获脚本（根据约定，在 repo 之外）：
The dev server died with the bash session (nohup trap). Let me restart it and capture in the same command:
All 3 screenshots captured (dashboard ✓, mobile menu OPEN ✓, courses page ✓). Let me verify the files and stop the dev server:
截图已验证。现在进行 R13 — 文档对齐。首先，重新确认 `.env.example`：
`.env.example` 已验证。现在更新 AGENTS.md —— session-16 的不变性：
现在更新 `CLAUDE.md` —— session-16 的不变性：
现在，在 README.md 中，添加 session-16 部分：
Now the PAD — v1.15 revision:
现在添加 [S16] 修订条目：
Let me check the PAD testing table for updates needed:
PAD 已更新。现在处理 SKILL.md — 版本升级 + 新的模式文档：
现在让我查找 SKILL.md 中的 §7（模式）和 trap 41，以添加 latest-ref 模式：
Now add trap 42 and the latest-ref pattern to the SKILL:
现在将 latest-ref 模式添加到 §15（编码模式）：
SKILL.md 已完成。现在勾选修复计划的 TODOs：
All 15 TODOs checked. Now rewrite `docs/session_16.md` as the formatted session summary (handoff convention):
现在追加仓库工作日志条目：
现在进行最终的预提交验证——完整的快速门禁检查以及凭据扫描：
所有检查已通过，凭证扫描无异常，24 个文件已暂存。正在创建提交：
已创建提交 `d4da6d2`。现在准备进行 SSH wrapper 推送 —— 让我检查一下 runbook 和 shim 的可用性：
Runbook confirmed, paramiko shim in place. Materializing the key (0600, outside the repo):
Key verified. Now the dry-run (authenticates, touches no refs):
Dry-run succeeded. Now the real push:
Push verified. Now independent remote verification and complete key destruction:
远程已验证 == HEAD，密钥已销毁，工作树已清理。现在开始处理会话日志提交（任务 31 —— 最终交付记录）：
日志提交已推送。进行最终的独立验证 + 共享工作区工作日志更新：
**Session 16 完成 ✅** — 已推送到 `main`（`d4da6d2` + 日志提交 `b62cc8f`，远端独立复核 == HEAD，密钥全部销毁，树干净）。

本轮"dead-code/deps pass"核心成果：

1. **exhaustive-deps 开启**：用 latest-ref 模式（useRef + 无依赖更新 effect）安全退役了 3 处刻意抑制 — 无需 useCallback 重构，quiz 自动推进语义由 91 项 e2e 验证保持
2. **零 unused-vars**：TS 感知规则启用，6 处真死代码全链条删除（含类型契约参数保留文档名的关键区分）
3. **单元测试 5× 提速**：`isolate: false`（经 5 次含乱序种子的实证验证，1.9s → 379ms）

门禁：lint 双规则零发现 · 182 unit · 91 e2e 全绿。Live bundle 第 7 次字节一致；移动端导航 live 仍不可点、克隆修复持续有效。

**下一步建议**：剩余 scaffold 级 lint 抑制规则（no-debugger/no-empty 等）可用同样的实验矩阵逐个退役；或评估 e2e 并行 worker 的 per-worker DB 隔离方案（当前串行 12-15 分钟）。
