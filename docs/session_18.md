我将执行 Session 17 任务链。最新的指令引用了 `docs/session_16.md`、`docs/remediation-plan-session-16.md`、`worklog.md` 和 `docs/session_17.md` —— 确认 Session 16 已完成（远端 main @ `42274b9` = `d4da6d2` 修复提交 + 两个日志提交），当前任务是 Session 17。工作区已被重置 —— 重新 clone：
clone 完成，HEAD `42274b9`。Session 16 的三份交付物（exhaustive-deps ON via latest-ref、零 unused-vars、isolate:false 5× 提速）确认入库。设置 Session 17 的 TODO 列表并读取 5 份项目文档：
AGENTS/CLAUDE/README/PAD v1.15/SKILL v1.15.0 全部精读完毕。现在读取 4 份状态文档并验证代码库对齐：
Session 16 确认完成（`d4da6d2` + 日志提交；session_17.md 现为 Session 16 原始日志 —— 按交接约定本 Session 结束时将其改写为格式化摘要，我的原始日志写入 session_18.md）。Session 16 交接建议三个方向：剩余 scaffold lint 抑制规则、e2e 并行 worker DB 隔离评估、依赖新鲜度 pass。工作区重建（.env + db/ + install + push + seed）—— 陈旧 shell DATABASE_URL 陷阱再次生效，所有命令须在 `env -u DATABASE_URL` 下运行。基线快速门禁：
lint 零发现 · typecheck ✓ · 182 unit（363ms，isolate:false 生效）· build ✓。先跑 e2e 基线（分块）与 shuffle 种子复验：
182 unit 含 shuffle 种子全绿；91 e2e 分 8 块全绿（12+29+13+18+8+7+5+6 减 8 次 setup 重跑 = 91 唯一）。现在写 live 探针脚本（第 8 次连续验证，脚本在 repo 之外的 workspace scripts/）：
登录成功 · app bundle 第 8 次字节一致（md5 `f99e72793316ead62b335b6fd55ed6d5`，788,085 字节）· /hub 匿名重定向携带完整 URL from_url。汉堡定位器未命中 —— 补一个针对性探针：
**移动端导航标题第 8 次复核：live 的汉堡点击依然被拒**（390×844 hasTouch，elementFromPoint 于按钮中心 = `fixed top-0 z-[100]` toaster，Timeout 5000ms）。克隆侧 mobile-navigation spec 在新构建上 12/12 全绿。scandihaven 复核（clone 到 scandihaven-ref，`cb0002a` 未变 —— 其 e2e 也是串行的，分片方案为原创设计）。现在跑 Session 17 审计三方向的实验矩阵：
lint 实验矩阵：5 条规则零发现（no-debugger/no-irregular-whitespace/no-case-declarations/no-fallthrough/no-mixed-spaces-and-tabs）；no-empty 恰 1 处（探针脚本空 catch）；no-undef 6 处类型感知误报（React JSX 作用域 + NodeJS ambient）。**另发现配置卫生 bug：eslint.config.mjs 存在死重复键**（第 32 行 off 被第 58 行启用块覆盖 —— JS 重复键语义，误导读者）。依赖新鲜度：bun outdated 显示各 major 内均已最新（next 16.3.8 / react 19.3.0 / prisma 6.19.3），余下全为越域 major（Prisma 7 / lucide 1.x / eslint 10 / TS 7）；manifest 下界滞后于 lockfile。e2e 并行可行性实证：
`--shard --list` 证明 setup 依赖项目会复制进每个分片（每分片各自登录，不触发限流）；specs 无 beforeAll/无 serial 模式（每测试自隔离）；.gitignore 已覆盖 db/*.db 与 .auth/。分片计数 40/23/30（91 唯一 + 2 个 setup 副本）。Session 16 提交双轴复核（latest-ref 三站点 + 死代码删除）—— 无硬发现。审计完成，编写 Session 17 修复计划并对照代码库验证：
计划落盘（4 项发现 + 13 项 TODO）。Phase 1 —— RED：写 `tests/shard-env.test.ts`（纯分片派生契约 pins）：
RED 确认（模块不存在，import 失败）。Phase 2 —— GREEN：实现 `tests/e2e/shard-env.ts` + 参数化 playwright.config.ts（E2E_DB/E2E_AUTH/E2E_OUTPUT/E2E_SHARDED）+ global-setup/auth.setup 走 env + 编排器 `scripts/e2e-sharded.mjs`：
4 个 pin 全绿。首次分片运行失败 —— 三个子进程都无法解析 TS 配置（`Expected "}" but found "as"`）。实证对比：`bunx playwright` 正常、`bun node_modules/@playwright/test/cli.js` 解析失败 —— 只有 bunx 的 bin 解析走类型剥离加载器。改用 `bunx playwright` spawn（trap 45）：
第二次分片运行：分片 2 通过，1/3 失败 —— 失败在分片间移动。根因定位：**共享 test-results/ 的跨进程产物竞态**（`apiRequestContext.dispose: ENOENT .playwright-artifacts-0`）—— 并发 playwright 进程互相清空对方的产物目录，输家在 disposal 时失败。修复：每分片独立 outputDir（E2E_OUTPUT → test-results/shard-{k}/，trap 44）+ envs 构建补齐 outputDir 字段（第一次修复时漏了 destructure）：
**分片全绿：40+23+30 = 93（91 唯一 + 2 setup 副本），单命令 ~1.5 分钟**。串行模式复验（auth spec 12/12 + `--list` 91 in 17 files）—— 默认行为字节兼容。Phase 3 —— lint 退役：
启用 6 条规则 + 删除死重复键 + no-undef 文档化保留。RED = 恰 1 条 no-empty 警告。修复探针脚本空 catch（加注释 —— 注释块即通过规则，无需放宽选项）。一次误删 retry 延迟行，立即恢复。GREEN = lint 零发现。Phase 4 —— manifest 对齐：
package.json 下界对齐 lockfile 已验证版本（next ^16.3.8 / react ^19.3.0 / prisma ^6.19.3 / typescript ^5.9.3 等）；`bun install` 后 lockfile diff 仅为声明镜像（零解析变更）。Phase 5 —— 全门禁 + 截图 + 文档 + 交付：
typecheck ✓ · 186 unit ✓ · build ✓ · **串行单命令全量 91/91（1.4 分钟）** · 分片模式 3/3 全绿。截图 103-105（remediated dashboard、移动端菜单 OPEN —— 独立真点 + 可见性断言复验 MENU OPEN: true —— hub 桌面三栏）。文档对齐：AGENTS（分片 harness + 最终 lint 规则集 + manifest 镜像不变式；计数 186/91）、CLAUDE（session-17 不变式）、README（session-17 章节 + test:e2e:sharded）、PAD v1.16（[S17] + 测试表 + SR 行）、SKILL v1.16.0（traps 43/44/45 + §15 分片派生模式）、remediation-plan 13 项 TODO 全勾、session_17.md 改写为格式化摘要、repo worklog 追加。最终预提交验证 + 凭据扫描（0 匹配）：
提交 `d51d65a` 创建。SSH wrapper 推送 —— 重建 paramiko shim（workspace 已重置；pip 装 paramiko 5.0.0）：
key 指纹验证（SHA256:3ddaN…）→ dry-run 成功（`42274b9..d51d65a`）→ 真实推送成功（wrapper 远端复核 == HEAD）→ 独立 ls-remote 复核（`d51d65a` @ refs/heads/main）→ 所有密钥销毁（operator key 随机字节覆写 + 删除；wrapper 临时密钥已碎；/tmp 目录清除）。按交接约定创建本原始日志（session_18.md）并追加最终交付 worklog 记录：
**Session 17 完成 ✅** —— 已推送到 `main`（`d51d65a`，远端独立复核 == HEAD，密钥全部销毁，树干净）。

本轮"lint 退役 + 分片 e2e + manifest 对齐"核心成果：

1. **Lint 脚手架块退役至最终两条有据可查的 off**：6 条规则启用（5 条零发现 + no-empty 严格模式），no-undef 以类型感知误报为由文档化保留，死重复配置键删除（trap 43）
2. **分片 e2e harness**：同一套 91 检查以 3 个并行 playwright 进程运行（每分片独立端口/DB/auth/outputDir）—— 带来两个实证修复的陷阱：共享 outputDir 处置竞态（trap 44）与 bunx-vs-cli.js 的 TS 配置加载差异（trap 45）；串行默认模式字节兼容（单命令 91/91，1.4 分钟）
3. **Manifest 下界镜像 gate 验证版本**：零解析变更（lockfile 仅重录声明范围）

门禁：lint 零发现（含 6 条新规则）· 186 unit · 91 e2e 双模式全绿。Live bundle 第 8 次字节一致；移动端导航 live 仍不可点、克隆修复 + 12/12 pins 持续有效。

**下一步建议（Session 18）**：AI seam 的 e2e 慢速 LLM 域仍是运行时主导（每 AI 调用 45s 预算）—— 请求级重试/短路策略或录制夹具模式可进一步压缩；`noImplicitAny: false` 仍是最后一项 scaffold TypeScript 让步（PAD K-4）—— 可用全门禁做机械化收紧 pass；分片分布按测试数（40/23/30）而非时长 —— 上次运行时长的清单可优化慢速 LLM 域的均衡。
