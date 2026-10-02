我将开始执行 Session 9 任务链。首先检查工作区状态并进行 git pull/clone。
工作区已重置，需要重新 clone 仓库。
仓库已克隆，位于 main 分支，工作区干净。现在创建任务清单并开始精读文档。
仓库结构显示这是 Next.js 应用，且 vitest/playwright 配置已存在，docs 下已有 session_9.md。现在精读核心文档。
已读完 AGENTS.md 与 README.md。继续读取 CLAUDE.md 与架构文档。
架构文档已读完。继续读取 SKILL 文档和 session 文档。
SKILL 文档已读完。现在读取 session 文档与 worklog。
文档评审完成。当前状态：Session 1-8 已完成并推送（HEAD `9eb54e9`，82 unit + 64 e2e 全绿）。现在验证代码库实际状态与文档对齐。
发现关键点：
1. `.env` 不存在（全新 clone）——需从 `.env.example` 创建
2. `db/` 目录不存在——需 `db:push` 创建
3. **陈旧 shell `DATABASE_URL` 陷阱再次触发**（`file:/home/z/my-project/db/custom.db` 会覆盖 `.env`）——所有 DB 命令需 `env -u DATABASE_URL`
4. vitest + playwright 配置已存在（前序 session 已完成）

现在检查 skills 目录并安装依赖。
现在开始环境搭建：安装依赖、创建 `.env`、初始化数据库。注意使用 `env -u DATABASE_URL` 规避陈旧 shell 陷阱。
环境就绪（`.env` 已建、`db/custom.db` 已建于 repo 根目录、demo 账号已 seed）。现在运行基线 gate 验证文档声称的 82 unit + 64 e2e 状态。
82 unit 全部通过 ✓。现在运行 build + e2e（耗时较长）。
**基线 gate 全绿：lint ✓ typecheck ✓ 82 unit ✓ build ✓ 64 e2e ✓**（429 为 AI SDK 限流，fallback 机制按设计工作）。与文档完全对齐。

现在读取审计所需的技能文件。
理解了 code-review 双轴审查模式。现在读取 tdd 与 agent-browser 技能。
agent-browser 已就绪。现在启动双轴代码审查子代理（审查 session-8 代码提交 `5ca9c4e...e270282`），同时我自己进行 live 站复审。
双轴审查完成，关键发现：

**Standards 轴**（1 hard + 8 判断级）：
- **HARD**: `src/app/demo/page.tsx` 缺少 `export const dynamic = "force-dynamic"` 
- `BRAIN_ICON`/`BOOK_ICON` 等重复 SVG 代码（可用 lucide-react 组件替代）
- 有效性阈值三处重复、死字段 `pending.name`、死 null-object、死类 `bg-black/50`

**Spec 轴**（1 真实偏差）：
- **Sign In pill 位置矛盾**：remediation plan 说 "ALL widths"，代码放进了 `hidden md:flex`（desktop-only）——需要 live 复核裁决

现在进行 live 站复审，重点验证此矛盾及移动端导航。
已登录 live 站（onboarding 状态）。现在验证 AUDIT-1b 的关键发现：匿名移动端 header 的 Sign In pill 位置。先设置移动端视口并登出。
移动端视口下已认证 header 只显示 logo + hamburger（m_ pill 隐藏）。现在登出验证匿名移动端 header。
**Live 站 toaster bug 依然存在**（空 toast 容器覆盖 hamburger——文档记载的 live bug，克隆版已修复并用 e2e 钉住）。用 JS 点击绕过验证菜单结构。
已认证移动菜单结构确认（黄色名头 + My Courses + Log Out）。现在登出，验证**匿名移动端 header 的 Sign In pill 位置**——AUDIT-1b 的核心矛盾点。
需要更精确的可见性检测（pill 自身 display:flex 但父容器可能 display:none）。
**裁决明确**：live 匿名移动端（390px）下 Sign In pill 的父容器 `hidden md:flex` 计算值为 `display:none`——**pill 是 desktop-only，代码正确**，remediation plan R1 文本（"ALL widths"）是陈旧错误，属文档问题而非代码问题。

继续验证匿名移动菜单结构。
**匿名移动菜单确认**：items-only（My Courses + Sign In，无黄色名头）——与克隆实现一致。

现在登录并深入审计 session-9 建议的未深审面：level-2/3 lesson-view（Real-World Scenario / Final Boss 卡片从未 live-diff 过）。
Live /demo 已加载（Guest + Economics 课程）。进入 Hub 审计 level-2/3 lesson surface。
Live hub 已加载（h2="General"，默认网格课程标题）。现在点击 Lesson 3（stage 1）审计从未 diff 过的 tan Real-World Scenario 卡片。
发现重要疑点：live hub 侧边栏显示**默认网格标题**（Introduction/Key Concepts/...），而 /demo 仪表盘显示 roadmap 派生标题（Microeconomic Foundations: Basics 等）。且 Lesson 3 被锁定（3-state 侧边栏锁定行为确认——不可直接跳转）。

现在检查克隆版 hub 侧边栏的标题来源。
克隆的 demo Enter The Hub → `/hub?course=demo-enrollment`（unowned param → 默认网格 hub，session-8 R8 已修复）——与 live 行为一致 ✓。

现在检查 e2e 对 level-2/3 上下文卡片的覆盖情况，然后驱动 live 完成课程以审计未验证面。
e2e 对 level-2/3 上下文卡片**零覆盖**——这是 session-9.md 建议的深审空白。先驱动 live 端完成 Lesson 1 到达 stage-1。
克隆 e2e 从未驱动完整课程（8 题正确）到达 level-2/3。现在驱动 live 完成课程以审计 tan Real-World 卡片。先读当前题目并作答。
答错触发 retry modal（"Not quite!"）。检查 reveal 颜色是否保留在 DOM 中（可学习正确答案）。
Modal 完全替换了选项区。点击 "Retry later" 重新排队，然后用教育学知识正确作答。
答对并推进 ✓。继续读取下一题选项。
进度卡显示 "4/8 correct"（注意措辞——需与克隆对比）。继续作答。
重排的第 1 题回来了（当前 7 正确）。作答 "To set the stage" 完成第 8 题。
**第 8 题正确完成 → "Level Up!" interstitial 出现**（live 显示 "Preparing Lesson 1..."）。对比克隆实现细节。
克隆的进度标签是 `min(sessionAnswered + 1, 8)/8`（钳制在 8），而 live 显示 **"9/8"（未钳制）**——疑似 drift。等 level-up 完成后精确复核。
Live 出现意外状态：Level Up 后 pane 显示 "Lesson 1 | 8/8 correct" 且侧边栏仍是 "Lesson 1 · Now"——未推进到 Lesson 2。等待并复核（可能是 AI 生成延迟）。
Live hub 卡在回归状态（per-visit AI 重新生成 + 虚拟课程写入限制）。让我捕获 pane 详细结构判断当前状态。
Pane 显示 "Lesson 1 | 8/8 correct"（课程完成态）。等待 AI 生成下一课（live 可能需要 30-60s）。
Live 卡在 lesson-1 完成态。但已观察到关键疑点：**live 在完成 lesson index 0 时就触发了 "Level Up!"**，而克隆按 decode 只在 index 1/3（stage 边界）触发。检查克隆的触发条件。
Live 在完成课程 1 时触发 Level Up（克隆仅在 index 1/3 触发）——需要重新解码线上包的升级（level-up）条件。获取线上 JS 包进行验证。
**关键解码**：live 的 Y2 组件有 `level`（1-3，分别渲染 gO/yO/xO）和 `lessonNumber` 两个概念，interstitial 显示 "Preparing Lesson {level}"。现在找 level-up 的触发条件。
**重大解码**：`levelingUp` 和 `level` 都是 Y2 的 **props**——由父组件（hub）控制。找父组件的设置逻辑。
**解码出 live 的 level-up 逻辑**：`ie`（onCorrect）中 `C<3` 时触发 interstitial。需要确认 Y2 何时调用 onCorrect。深入解码 Y2 的答题逻辑。
**核心语义确认**：Y2 内部 8 题正确 → 调用 onCorrect → `ie`（分数+10 + Level Up + StudySession 更新）。侧边栏 q 不自动推进。解码 qP 侧边栏的行状态逻辑。
**qP 完全解码**：行状态仅由 `activeLessonIndex`（q）驱动；**Lesson Progress 标签 = `answered+1` 未钳制**（"9/8" 实锤）——克隆的 `Math.min(..., 8)` 是 drift！继续查 q 是否有其他推进路径。
**gO 完全解码**：课程视图 header = "Lesson {lessonNumber}"（左侧小字）+ h2 主题 + 右侧 **"{correctCount}/8 correct"** + w-24 进度条。现在对比克隆的 lesson-view header 实现。
克隆的 lesson-view header 与 live 完全匹配 ✓。现在解码 yO（level 2）确认 h2 = AI title 的行为。
**yO 解码确认**：level 2 h2 = AI `meta.title`；tan Real-World 卡片**条件渲染**（仅当 AI 返回非空 scenario）。检查克隆的 ContextCard 条件性。
克隆的 ContextCard 条件渲染匹配 ✓。验证图标身份（live 的 t8/a8 vs 克隆的 Lightbulb/MapPin/Trophy）。
图标身份全部验证匹配（Lightbulb/MapPin ✓）。检查 xO（level 3）的图标。
所有上下文卡片图标验证匹配（Lightbulb/MapPin/Trophy ✓）。现在快速验证移动端 hub（390×844 tab 栏）。
**移动端 Lessons sheet 确认**：行标签 "N Stage S · Level L {title}"（stage 与 level 同号）。检查克隆的移动端 lessons sheet 实现。
克隆的 stageLevelLabel 与 live 匹配 ✓。Live 审计完成。现在验证审计发现对应的具体代码位置。
桌面 pill 无 `from_url` 而移动端有——查 live bundle 的桌面 pill 行为。
**解码确凿**：live 的桌面 Sign In pill 调用 `navigateToLogin()` = 带 `window.location.href` 的重定向——**克隆桌面 pill 缺 from_url 是真实 drift**。继续验证其余判断级发现。
所有判断级发现代码验证完毕。检查 auth.spec 的移动端 pin 现状。
**克隆的 hub 支持 `?lesson=N` 参数**——e2e 可直达 level-2/3 课程！检查 ai.ts fallback 的 scenario/challenge 字段。
fallback 会为 level-2/3 填充 scenario/challenge ✓。验证 lucide 0.525 的 Brain 路径数据与 live 探测值一致（R5 前置检查）。
lucide-react 0.525 的 Brain 路径与 live 探测值**完全一致**（9 paths）——图标置换安全。检查所有手复制图标常量。
审计完成。现有 e2e 以「双结果收敛」模式处理 AI 不确定性。现在撰写 session-9 修复计划。
修复计划已写入。现在按 TDD 执行——**Phase 1: RED**（先写失败测试）。
RED 确认（9 失败）。现在 GREEN——实现 domain.ts 中的两个 helper。
**GREEN — 91 unit**（82 + 9 新增）。现在执行 Phase 2 P1 修复。
R1 完成。现在 R2：桌面 Sign In pill 的 from_url 修复。
验证 `pathname` 变量作用域是否覆盖桌面 pill 位置。
`pathname` 属于 MobileMenuBody 而非 AppHeader——需要在 AppHeader 中添加 `usePathname()`。
R2 完成。现在 R3：`/demo` 页添加 force-dynamic。
Phase 2 完成。现在 Phase 3 清理。先查 course-dashboard 的 lucide 导入。
验证 lucide BookOpen/Trophy/Sparkles 路径与手复制值一致后执行置换。
**重要发现**：lucide 0.525 的 Trophy 路径（`M10 14.66v1.626...`）与手复制值（`M6 9H4.5...`）**不同**——Trophy 在 0.475→0.525 间被重新设计！手复制常量正是为了钉住 live 的旧版路径。验证 BookOpen。
**审计修正**：BookOpen 和 Trophy 在 lucide 0.475→0.525 间被上游重新设计（路径不同）——手复制 SVG 正是钉住 live 旧版路径的手段（session-8 探测值），**不能换成 lucide 导入**（会破坏 e2e 图标 pin 并产生视觉偏差）。Brain/Sparkles 路径未变但保持同一模式。修订 R4：删除死 LESSON_ICON + 参数化去重 + 加说明注释。
重写图标块：4 个参数化本地组件 + 保留 6 个使用常量 + 删除死 LESSON_ICON + 添加 lucide 版本漂移说明。
R4 完成。现在 R5：onboarding 有效性阈值去重。
需定义 `pendingInputsValid` helper。在组件外添加模块级函数。
R5 完成。现在 R6（challenge overlay 死类）+ R7（dashboard-app 死 null-object）。
R6 完成。现在 R7：dashboard-app 死 null-object 清理。
实施 AppHeader 类型加宽 + dashboard-app 诚实传参。
第一个 edit 已生效（prop 类型已加宽）。现在修复剩余两处（letter 计算与黄色头部条件）。
现在应用真正的守卫条件修改。
现在更新 dashboard-app 的传参。
Phase 3 完成。运行快速 gate 验证（lint + typecheck + unit）。
全部通过。现在编写 **Phase 4 e2e pins**。先看现有 spec 的模式。
auth.spec 已有结构 pin（click 版）。hasTouch 真实 tap pin 需独立文件（Trap 9 doctrine）。编写两个 spec 文件。
按 Trap 9 doctrine（storageState 文件级作用域），登出态测试需独立文件。重构为两个文件。
构建并运行新增 specs。
卡片已渲染但 xpath 取到了内层透明 div（非卡片本体）。改用 rounded-[16px] 类选择器。
session9-parity 4/4 通过。现在运行完整 e2e 套件检查回归。
**FULL GATE GREEN：lint ✓ typecheck ✓ 91 unit ✓ build ✓ 69 e2e ✓**。核对新测试计数（预期 64+6=70，实际 69）。
实际新增 5 测试（3+2），64+5=69 ✓。现在启动 dev server 截图（R11）。先看已有截图脚本模式。
编写 session-9 截图脚本。先确认 AI fallback 的 correctIndex（用于驱动 8 题正确）。
fallback correctIndex=0（可确定性驱动 8 题正确）。编写截图脚本并启动 dev server 一次性捕获。
截图已捕获。快速验证 74 号截图确实包含 "Level Up!" 与 "9/8" 状态。
验证脚本未达成 Level-Up——调试当前课程内容的正确项。
发现问题：截图脚本的等待时序错过 interstitial（完成 POST + 1200ms 延迟后才渲染）。核心验证已成功（1/8→2/8 未钳制公式 ✓），但需修正 74 号截图的驱动时序。
**"9/8" 运行时验证成功**——interstitial 期间标签读 "9/8" ✓，截图已重拍。将修正逻辑合并回 capture-s9-shots.mjs 并清理临时脚本。
Dev server 已停止。现在执行 **R10 文档对齐**。先勾选修复计划的 TODO。
更新计划 R4 文本以反映实际执行（lucide 版本漂移发现）。
修正 session-8 计划的 R1 陈旧文本（S9-F7a）。
现在更新 AGENTS.md 的不变量与计数。
更新 AGENTS.md 公共面模型（补 Sign In pill from_url 契约）。
现在更新 CLAUDE.md（计数 + 精简不变量）。
现在更新 README.md（计数 + session-9 段落）。
现在更新 PAD v1.8（[S9] revision block + testing table）。
现在更新 SKILL.md 至 v1.8.0。
trap 锚点未匹配。检查 trap 26 的精确文本。
现在重写 docs/session_9.md 为格式化的 session 总结。
文档对齐完成。最终预提交验证——检查变更集。
变更集完整。最终快速验证后提交。
提交 `ef3fb18` 已创建。现在按 runbook 通过 SSH wrapper 推送。
需要部署 paramiko shim（无 ssh 二进制、无 paramiko）。读取 Appendix A 完整代码。
部署环境：安装 paramiko、创建 shim、物化密钥。
Shim 部署完成。物化 SSH 密钥并验证。
Dry-run 成功（认证通过，`9eb54e9..ef3fb18`）。执行真实推送。
Wrapper 已验证 remote ref == HEAD。做一次独立复核（带密钥直连）。
**推送验证成功**（remote main == HEAD `ef3fb18`）。销毁所有密钥材料。
所有密钥材料已销毁，repo 树干净。按既有模式补最后的 session log 提交（勾选 R12）。
**Session 9 完成** ✅ — 已推送到 `main`（`ef3fb18` + 日志提交 `dc3ca15`，远端已验证 == HEAD，所有密钥材料已销毁，工作树干净）。

## 本轮核心成果

1. **首次将 live 站课程流程驱动到终态**——观察到 "9/8" 未钳制进度标签（Lesson Progress 卡在 8 题正确时显示 `answered+1`，克隆原为钳制 8/8 → 已用 unit-pinned 的 `lessonProgressLabel`/`lessonProgressPct` 修复）
2. **解码出 live 的 hub 死胡同机制**——侧边栏 `activeLessonIndex` 永不推进、`levelUp` 只写入无人消费的 StudySession；克隆的推进式流程确认为文档化的“修复并钉住”方案
3. **发现新陷阱类别：lucide 跨版本重设计**——BookOpen/Trophy 在 0.475→0.525 间改了路径，手复制 SVG 常量是正确钉法（已加注释防误“清理”）
4. **桌面 Sign In pill 补上 from_url**（`navigateToLogin` 解码）+ `/demo` 补 `force-dynamic` + 图标/阈值/死代码清理
5. **level-2/3 课程面首次获得 e2e 覆盖**（tan Real-World / lilac Final Boss 卡片，经 `?lesson=2|4` 直达）

**Gate：91 unit + 69 e2e 全绿**（82+64 → 91+69），截图 71-74 已入库，全部文档对齐（PAD v1.8、SKILL v1.8.0 含陷阱 27-29）。

**后续建议**：可考虑 a11y 加固 pass（focus ring / 键盘导航）、K-3 课程内容持久化，或下一 session 继续审计 Nori chat 的深层面。
