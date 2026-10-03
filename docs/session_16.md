我将接续之前的会话。根据规律（用户指令引用 `docs/session_14.md` + `docs/session_15.md`），当前为 **Session 15 任务链**：Session 14 已完成入库，待执行的是 Session 15。让我先建立任务清单，然后刷新工作区。
工作区存在。现在执行 git pull 刷新：
✅ git pull 成功：Session 14 已入库（commit `6ee1e55`），且拉取到了新增的 `docs/session_15.md`（commit `6429a1e`）。确认当前为 **Session 15 任务链**。

现在精读 5 份项目文档与 4 份状态文档：
`docs/session_15.md` 确认为 Session 14 的执行记录（handoff 约定：session N 完成时写入 session N+1 文档）。末尾给出 Session 15 建议方向：**以 trap-40 视角扫描其余 15 个 spec 文件的空转/混淆断言、e2e helper 去重、lint 规则加固**。

继续读取其余核心文档：
AGENTS.md 已读完。继续读取 CLAUDE.md 与 README.md：
Remediation plan session-14 的 R0–R10 全部勾选完成。现在读取 worklog 最新条目与 SKILL.md 关键部分：
Worklog 确认 Session 14 完整交付。快速核查 SKILL.md 版本头与最新 trap 记录：
文档研读完成。现在验证工作区状态（.env、db/、配置）并运行基线快速门禁：
工作区状态验证通过（`.env` 正确、`db/` 在 repo 根、`.env.example` 字节一致）。Shell DATABASE_URL 陷阱再次武装（`file:/home/z/my-project/db/custom.db` 覆盖 `.env`）— 所有命令需 `env -u DATABASE_URL`。

运行基线快速门禁：
基线快速门禁全绿（lint 零告警 · typecheck ✓ · 179 unit ✓）。后台启动构建，同时开始代码审计：
技能目录已读取。按既往会话模式与本轮 handoff 建议，Session 15 审计方向为：**trap-40 视角的空转/混淆断言扫描、e2e helper 去重、lint 规则加固**。开始系统审计测试套件：
无直接空转断言残留（仅注释引用）。深入检查 e2e 中 canvas 断言的混淆问题与 helper 重复：
确认 helper 三重重复（session11/12/13）。同时发现 `session11-parity.spec.ts` 的 `freshCourse` **缺少 60s 超时**（trap 39 违规候选）。系统扫描所有 AI-backed 请求级调用的超时覆盖：
扫描脚本有 bug，改用持久化脚本重写：
发现真实审计发现。逐一验证这些 trap-39 违规点：
所有 trap-39 违规确认属实（session5/8/11/mobile-nav 四个旧 spec 未回填 60s 超时约定）。现在检查第三方向 — lint 配置现状：
eslint 配置几乎关闭了所有规则（`exhaustive-deps`/`react-compiler` 全 off）。试验性开启关键规则评估加固可行性：
仅 3 处 exhaustive-deps 告警。查看这些 effect 的实际结构以判断是否可安全修复：
三处告警均为**刻意的依赖抑制**（quiz 流程的“仅在课时/题目变更时触发”语义——贸然修复有回归风险）。快速测试其余 React 19 hooks 规则的影响面：
`set-state-in-effect` 与 `purity` 规则**零发现** — 可零成本启用。检查构建进度并启动 live 端复核探针：
构建后台任务未成功（产物时间戳仍是旧的）。改为前台同步执行构建：
✅ 构建成功（全部 20 路由）。现在编写 live 站复核探针（凭证不入库 — 脚本置于 repo 外）：
Live 复核关键结果：登录正常、移动端导航第 6 次验证 **tap 仍被拒**（toaster 覆盖机制不变）、未认证 /hub 反弹至 `login?from_url=<full-url>`。还需从认证页面验证 app bundle 哈希：
**Live app bundle 第 6 次会话字节级一致**（md5 `f99e72793316ead62b335b6fd55ed6d5`，788 085 字节）— 所有既有 decode 依然有效。

复核 scandihaven 参考仓库状态，并跑克隆端移动导航 e2e 作为聚焦验证：
移动导航 e2e 12/12 全绿（克隆端修复持续有效）；scandihaven 无变化（`cb0002a`）。验证 Tailwind v4 trap pins 完好性：
`rounded-full` 唯一匹配位于**注释内**（描述 live 行为），实际 class 用量为零 ✓。全部 8 个 trap pins 完好。最后验证测试配置接线：
配置全部验证完毕。现在确认哪些 API 路由真正触及 AI seam（为约定测试定义精确范围）：
现在检查 eslint 插件版本与默认启用规则集（确定 lint 加固的正确方式）：
关键发现：Next 16 的 core-web-vitals 已默认启用完整 React Compiler 规则集 — scaffold 只压制了 `exhaustive-deps` 与 `purity`。测试其余被压制规则的零成本启用空间：
`prefer-const`/`no-console`/`no-unreachable`/`no-redeclare` 全部零发现！检查全 repo（含 tests/scripts）在这些规则下的表现：
审计完成。lint 硬化零成本集合确定：`purity`/`prefer-const`/`no-unreachable`/`no-redeclare` 全 repo 零发现，`no-console` 仅 scripts/prisma 合法使用，`no-useless-escape` 仅 1 处（domain.ts:96 字符类内 `\.`,有 unit pins 守护）。

现在撰写 Session-15 修复计划：
修复计划已就绪。开始执行 **Phase 1（TDD RED）** — 编写 trap-39 自执行约定测试：
第三测试有死代码且存在扫描器鲁棒性问题（字符串/注释内的括号会破坏配对计数）。重写为更严谨的版本：
**RED 状态确立** — 恰好 8 处违规（与人工审计完全一致，且消除了行窗口误报）。执行 **R1 回填**：
✅ **第一阶段完成**（红色→绿色：3/3 约定测试通过）。执行 **第二阶段 — R2 辅助程序提取**：
迁移 session13（删除本地 generateCourse/submitScore/afterEach → 导入 helper）：
迁移 session12：
顺序不匹配（session12 的 `test.use` 在前）。拆分为两个精确编辑：
导入出现重复（前次失败编辑的部分应用）。检查并修复：
session12 修复完成。迁移 session11（删除 freshCourse → 使用 helper）：
修复重复的 `test.use` 与 freshCourse 调用点：
session11 迁移完成。迁移 session5/8/mobile-nav 的一次性 generate 调用至 helper：
session8 完成。查看 mobile-navigation 的下游使用后迁移：
全部 6 个 spec 迁移完成。验证类型检查与约定测试（helpers.ts 现在也被扫描）：
发现已覆盖了一个**既有 helpers.ts**（auth.setup.ts 导入 DEMO_EMAIL/DEMO_PASSWORD）！立即恢复丢失的导出：
恢复被覆盖的 DEMO 凭证常量与说明注释，并修正 mobile-nav 的引用：
✅ **182 个单元测试通过**（179 + 3 个约定测试）。执行 **阶段 3 — R3 lint 硬化**：
parseRoadmap 指标全绿（29/29 — 转义修复受控）。现在优化 eslint 配置：
✅ **Lint 硬化后零发现**。重建（domain.ts 已变更）并运行完整 e2e 套件：
e2e 超时。诊断：先跑迁移过的 spec 子集观察：
子集也卡住（14/18 — session11 的 reveal 测试）。直接测量 AI seam 的实际响应时间：
课程生成 13ms（fallback 路径 — AI seam 不是瓶颈）。测量 quiz/generate 路由：
AI seam 全部即时响应。清理手动服务器与污染的测试数据，重跑子集定位：
session11 出现 5 个失败。查看失败详情：
查看错误上下文与页面快照状态：
页面卡在“Preparing your assessment...”加载层。检查 quiz 页面实际发送的 payload：
payload 与我的 curl 完全一致。用真实浏览器驱动复现并监控网络时序：
复现成功 — **quiz/generate 请求从未发出**（客户端 effect 未触发 fetch）。检查服务器日志与页面控制台错误：
关键线索：**端口被孤儿进程占用**（此前超时 run 遗留的 webServer），且页面可能根本未 hydrate（SSR 初始态即渲染加载层）。捕获控制台错误验证：
**根因找到**：`ChunkLoadError` — 孤儿服务器（超时 run 遗留）持有**旧构建的 chunk 引用**，而我重建后 `.next/static` 已被替换 → hydration 失败 → effect 不触发 → fetch 永不发出。测试失败与我的代码修改无关！

清理孤儿进程并分块重跑：
✅ **26/26 通过（30 秒）** — 孤儿服务器即全部问题。继续运行其余 spec：
分块运行全部通过（26+27+40=93 项 — 与文档的 91 有出入）。精确核对用例总数：
✅ **完整门禁全绿**：lint 零告警 · typecheck ✓ · 182 unit · build ✓ · **91 e2e**（计数不变量成立）。

进入 **R5 截图**。启动 dev server 并捕获：
97/98 已捕获，99 超时（hub 课内容生成）。用全新上下文重试 99：
99 仍失败。诊断 hub 页面实际渲染状态：
Hub 页面实际正常渲染（诊断确认 "Lesson 1 · Now" 存在）— 前次失败可能是登录限流瞬时问题。重试捕获：
差异定位：诊断脚本未用 `isMobile/hasTouch`。打印完整错误并移动端上下文复现：
定位到问题：hub 的双 DOM 陷阱（trap 8）— `.first()` 命中 CSS 隐藏的桌面实例。截图无需严格等待，直接稳定后捕获：
移动端 hub 默认显示 **Learn 标签**（侧栏在 Lessons 标签内 — 隐藏是正常的）。等待课内容渲染后直接捕获：
检查移动端 hub 默认视图中实际**可见**的元素：
Learn 标签完全渲染正常（Core Concept 卡片、题目、选项、标签栏均可见）。用可见元素等待捕获：
原因确认：**登录限流器触发**（10 次/15 分钟 — 我的多次捕获脚本已超限；限流器在进程内）。重启 dev server 清除限流后单次登录捕获：
✅ 三张截图全部捕获。验证图片有效性后进入 **R6 文档对齐**：
截图有效。开始文档对齐 — 先更新 AGENTS.md：
编辑未命中（原子性全部回滚）。读取实际文本精确定位：
前两项已应用（182 计数 + 门禁 NOTE）。补上第三个不变量段落（用精确原文定位）：
更新 CLAUDE.md、README.md 的计数与 session-15 内容：
更新 PAD（v1.14 头部 + [S15] 修订条目 + 测试表）：
更新 SKILL.md（v1.14.0 + trap 39 修订 + 新 trap 41）：
勾选修复计划的 TODO 并重写 `docs/session_15.md` 为格式化总结（handoff 约定）：
追加 repo worklog 条目（Task 28）：
进入 **R7 提交与推送**。最终预提交验证（凭证扫描 + 快速门禁复核 + 树状态）：
扫描命令卡住（PNG 二进制 + git diff 管道问题）。简化为定向 grep：
✅ Stash 对比证明：我的新增内容**零凭证匹配**（历史匹配均为操作者既有文件）。最终快速门禁复核后提交：
Commit `7412f8b` 已创建。按 runbook 准备 SSH wrapper 推送：
Runbook 明确。执行推送序列 — 密钥物化 → 验证 → dry-run → 真实 push：
✅ 推送成功（remote 已验证 == HEAD）。独立复核 + 销毁全部密钥材料：
推送已验证、密钥已销毁、树干净。按 session-log 模式追加最终交付条目并做 log commit：
✅ **Session 15 完整交付**：remote `main @ 7702692` == HEAD（两个提交均已入库），密钥全部销毁，树干净。更新共享工作区 worklog：
**Session 15 完成 ✅** — 已推送到 `main`（`7412f8b` + log commit `7702692`，远端独立复核 == HEAD，密钥全部销毁）。

本轮“conventions pass”核心成果：

1. **Trap-39 约定自执行化**：4 个旧 spec 的 8 处 AI 请求缺失 60s 超时已回填，新 `e2e-conventions.test.ts` 用括号配对扫描器单元级强制该约定（RED→GREEN，漏写超时毫秒级失败）
2. **E2E 夹具归一**：三重重复的 generateCourse/cleanup 提取至 `helpers.ts`（6 个 spec 迁移，计数不变量 91 保持）
3. **Lint 硬化**：`purity` 回归 error 级 + 5 条核心规则启用，零发现
4. **新诊断 trap 41**（孤儿 webServer → 旧 chunk → hydration 失败）已文档化

门禁：lint 零告警 · 182 unit · 91 e2e 全绿。Live bundle 第 6 次字节级一致；移动端导航 live 仍不可点、克隆修复持续有效（截图 97-99 含菜单打开状态）。

**下一步建议**：下轮可评估 exhaustive-deps 的 3 处刻意抑制是否可安全重构、`no-unused-vars` 18 处参数类发现的清理策略，或 vitest `isolate: false` 提速方案。
