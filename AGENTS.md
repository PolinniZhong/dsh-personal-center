# AGENTS.md — dsh-personal-center 项目记忆(每次会话必读)

> 本文件是**项目级长期记忆**:任何开发/修改前必须通读,遵守其中"已确认需求约定",
> 避免反复返工。修改 UI/交互后必须自查交互是否真实可用(见 §3)。

## 0. 项目位置与工作区结构(新对话先看这里)

- **本插件(项目)绝对路径**:`/Users/zhongwentuo/DeepSeek Harness Native/02_dsh-personal-center_个人配置/DSH 个人中心`
  (git 仓库;推送走代理 `127.0.0.1:7897`;旧目录名 `03_日常对话`,2026-08-29 更名)
- **所在工作区结构**(`02_dsh-personal-center_个人配置/`):
  - `DSH 个人中心/` = **本插件**(代码 `lib/`、文档 `docs/`、项目记忆本文件);
  - `AI桌面宠物/` = **宠物素材源**(皮肤版本 gif + 脚本 + 规格),合成 WebP 进 `lib/pet-assets/`;
  - 工作区根另有一份 `AGENTS.md`(**工作区导览**,供人读;DSH 自动加载的是本文件,以本文件为准)。
- **当前进行中任务(如有)**:见本文件 §1 模块地图 + `docs/SDD.md`;模块开发按 §1「新增模块 SOP」执行。

## 1. 项目概况与模块地图(改代码前必读)

- **dsh-personal-center**:DeepSeek Harness 个人中心插件(设置 → 个人配置),4 个 tab:
  **Token 用量 / 个性化 / 外观 / 宠物**。
- 宿主:`lib/index.js`;客户端:`lib/client.js`(手写单 bundle,无 JSX,`react.createElement`)。

### 模块地图(类名前缀唯一;改代码先对号入座,勿跨模块改错)

| 模块 | 关键组件 | 类名前缀 | 数据源 |
|---|---|---|---|
| Token 用量 | `ProfileTab` / `TokenActivity` / `CostEditor`(成本子 tab) | `.dsh-pc-profile-*` | `/personal-center/stats`、`/personal-center/pricing` |
| 个性化 | `PersonalizationTab` | `.dsh-pc-pers-*` | `/personal-center/instructions`、`/current-workspace`、`/workspaces` |
| 外观 | `AppearanceTab` + 全局字号引擎 `UI_FONT_*` | `.dsh-pc-appear-*` | `localStorage`(uiFont) |
| 宠物 | `PetPanel`/`PetSection`;`PetStatusConfig`(会话状态卡);`PetWidget`(位图浮层)/`VectorPetWidget`(矢量浮层);`PetStatusPanel` | `.dsh-pc-pet-*`、`.dsh-pc-petstatus-*`、`.dsh-pet-*`、`.dsh-pet-status-*`、`.dsh-pet-vector-*` | `/personal-center/pet`、`ctx.get("sessions")`、`/stats` |
| 共享外壳 | `PersonalCenterSection` / `TabButton` / `PillTabButton` | `.dsh-pc-section/tabs/tab/panel/group/heading/intro/mock` | — |

### 运行逻辑(分区怎么跑起来)

1. `PersonalCenterSection` 是分区外壳:`TabButton` 在 4 个 tab 间切换,`react.useState("profile")` 决定渲染哪个模块组件。
2. **事件驱动优先,能订阅就不轮询**:宠物情绪订阅 `sessions.list`(零轮询);仅统计/宠物用量走 30s 轮询。
3. 宠物是「纯 DOM 浮层 + 单页设置卡」;会话状态概览直接读平台 `ctx.get("sessions")`(list + per-session subscribe),零轮询。

### 新增模块 SOP(强制,否则视为未完成)

1. 起一个**唯一类名前缀**(如 `.dsh-pc-xxx-*`),不得复用其它模块前缀;
2. 在 `client.js` 加组件 + 对应 `//#region 模块: xxx` 区;
3. 在 `PersonalCenterSection` 注册 tab;
4. 同步更新**本文件模块地图** + **`docs/SDD.md`**。

- 事实源文档:`docs/personalization/个性化指令增强-PRD.md`、`docs/common/PLATFORM-NOTES.md`、`docs/common/DESIGN-SYSTEM.md`、`docs/SDD.md`。

## 2. 关键实现事实(勿再探索/勿改)

- **提示词注入通道(0.7.0)**:唯一可用 = `ctx.on("system-prompt/assemble", (assembly, context, next) => …)`
  事件,在 `result.sections` 插入 `{name:"custom-instructions", text:<合并文本>}`(splice 在 index 1)。
  **严禁**用 `systemPrompt.section/variable` 注册或 `ctx.get("systemPrompt")`(0.7.0 已收进 agent scope,
  前者不生效、后者会抛错阻塞 Harness 启动)。详情 PLATFORM-NOTES §14。
- **设置命名空间**(settings.yaml):`custom-instructions`(全局文本)、`personal-center-instructions`
  (JSON:workspaces + templates)、`personal-center-pricing`、`personal-center-pet`。
  全部用 `safeRegister` 逐个注册(任一失败不连累其它)。`custom-instructions` 数据**永不迁移**。
- **工作区发现**:`/personal-center/workspaces` 必须从各会话日志 `session.cwd` 收集**真实路径**去重
  (已实现 `discoverWorkspaces`);**禁止**返回会话目录名(`--Users-…--` 模糊编码,会与真实路径 key 重复)。
- **当前工作区**:`/personal-center/current-workspace` = 最近活动会话 cwd(一次性读取,非轮询)。
- **环回路由**:`/personal-center/*`(loopback 校验 + `ctx.get("settings")` 直读写,绕开 Web 白名单)。

## 3. 已确认需求约定(用户拍板,违反即返工)

1. **下拉交互必须"点击即弹出列表"**:禁止用 `datalist`(DSH 设置面板 iframe 中不触发下拉,
   用户无法使用,已返工一次)。用自定义弹出层(picker + caret + menu);**箭头必须用 SVG
   chevron-down 图标,禁止用文本字符(⌄)当图标**(用户明确说丑)。
2. **添加工作区 = 下拉选择已有路径**,输入框预填当前会话路径;**无「新建路径」按钮、
   无独立「添加工作区」按钮**(选择即纳入列表,`ensureWs`)。
3. **模板行按钮只保留「应用」**(应用到当前工作区,应用后文本进上方工作区输入框 + 「✓ 已保存」);
   **无「应用到全局」**(多工作区各自适配,全局统一下发概念不成立)。
4. **注入预览**:不做独立大块;在**当前工作区条目的操作行左侧**放一行「指令应用示例」标签
   (与清空/保存同行、左对齐),点击展开内联紧凑预览(全局 + 工作区文本);不占模板库视野。
5. **模板库每个模板独立描边框**(一格一框,像绘画库),不用一条线分隔。
6. **工作区路径短显示**「… 名称」,点击路径本身展开;**无独立 expand(点点点)按钮**。
   **目录名 key 也要短显示**(显示层兜底:key 无斜杠时按 `-` 取末段,如
   `--Users-…--` → 「… 02_dsh-personal-center_个人配置」);**客户端加载时自动清理目录名 key**
   (以 `--` 开头/结尾,清理并持久化)——三层防御:发现返回真实路径 + 显示兜底 + 自动清理。
7. **状态标签清淡**:无胶囊背景;**「当前会话工作区」文字标签已删除**(与路径重复);
   **工作区条目无外层描边框**(避免与输入框边框叠加成双层,参考全局配置:
   输入框自带边框 + 下方操作按钮);当前条目用**路径文字主题色**清淡区分;
   「已配置」= 中性色;**「回退全局」= 淡灰文字**。
8. **工作区选择器**:下拉箭头**内嵌输入框右端**(SVG chevron,无独立下拉按钮;
   输入框 padding-right 留位),点击输入框/箭头弹列表。**关闭逻辑必须用
   document mousedown 监听 + picker ref contains 判断**(点外部立即关闭);
   **禁止用 onBlur+setTimeout**(会与打开竞争:点 caret 打开后 150ms 又闪关、
   点外部延迟关闭不可靠——已对抗式审查确认并返工,见 §3.10)。
9. **避免重复控件**(同一区域出现两个相同功能的输入框/按钮 = bug,通常是 key 冲突/发现逻辑问题)。
10. **修改后自查交互是否真实可用**:不只跑语法/冒烟,还要代入用户视角检查"点击是否真的能弹出、
   文本是否真的落到用户能看到的地方";不确定时在回复中说明如何验证。

## 4. 红线(不变)

不改核心依赖 / 纯本地零网络零新依赖 / 未配置工作区时行为与 v0.5.1 一致 /
`custom-instructions` 数据无缝延续 / README+CHANGELOG+PRIVACY 同步 / 版本号按语义化递增。

## 5. 版本状态

- 已发布 **v1.1.0**(2026-09-03):新增矢量桌宠皮肤「圆滚滚小黑 / 圆滚滚小蓝」(皮肤 id `black-vector` / `blue-vector`),纯 DOM 鼠标跟随(眼睛/头位移/上下"驼"形变/渐变光源四层 + 转向透视 + 靠近眨眼/点眼眯线/点身挠痒/随机放大),**非 WebP**;与位图皮肤(`black-whale`/`blue-whale`,动画 WebP)并存、互斥。宿主皮肤白名单扩为 4 个 + `PET_BITMAP_SKINS` 区分素材路由。
- 已发布 **v1.0.0**(2026-09-01):新增「外观」tab(全局字号引擎 `UI_FONT_*`,默认 14、11–16)+ 设置头部 sticky/毛玻璃 + i18n 模板库本地化 + 模块类名唯一化治理(4 模块前缀 + `docs/SDD.md`)——见本文件 §1。
- 已发布 **v0.9.0**(2026-08-29):「个人 → 个人配置」「个人资料 → Token 用量」改名;宠物改单页(会话状态卡 + 黑鲸/蓝鲸两卡)+ `sessionStatus` 开关;会话状态修复(运行中置顶/双击进入/悬停稳定/0 值隐藏)+ 归档/子代理过滤;i18n 补全;宠物随窗口按比例跟随。
- 前置版本:v0.8.1(README GIF/话题/npm keywords)、v0.8.0(桌宠 5 动作 + 会话状态情绪实时驱动)、v0.7.0(个性化指令增强)。
- 桌宠素材管线:豆包生成 GIF → `AI桌面宠物/<skin>/assets/animations/<action>/frames_processed/` → `gif2webp-new-actions.py` 合成 WebP → 插件 `lib/pet-assets/<skin>/{animations,idle}/`;新动作规格见 `AI桌面宠物/桌宠v0.7-新增4动作-素材生成规格.md`。
- 后续候选:条件注入(按模型/任务/文件/时段)、模板导入导出、桌宠更多情绪。
- 发布节奏:功能验证通过后提交推送 GitHub(代理 127.0.0.1:7897)+ 更新官方 Discussions #3449;npm 发布需用户确认。
