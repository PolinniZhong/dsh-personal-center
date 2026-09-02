# 模块地图(MODULE-MAP)

> 一张表说清「DSH 个人中心」每个功能归哪个代码文件、哪条路由、哪份文档、哪个素材目录。
> 想定位"某个功能在哪改"先查这里;更多平台知识见 [common/PLATFORM-NOTES.md](common/PLATFORM-NOTES.md)。

## 功能 → 代码/路由/文档 映射

| 功能模块 | 宿主代码(`lib/index.js`) | 客户端代码(`lib/client.js`) | 路由(宿主) | 文档 | 素材/数据 |
|---|---|---|---|---|---|
| **个人资料 · 统计** | `computeStats()` / `getStats()` / `scanZstdFrames` / `listSessionFiles` | `ProfileTab`(概览/回顾/模型)+ 统计卡片组件 | `GET /personal-center/stats` | [personal-profile/DATA-MODEL.md](personal-profile/DATA-MODEL.md) | `~/.dsh/sessions/**/session.jsonl.zstd` |
| **个人资料 · 成本** | `usageCost()` / `parsePrices` / `isBeijingPeak` | `CostEditor`(价格编辑器) | `GET/POST /personal-center/pricing` | [personal-profile/COST-ESTIMATION.md](personal-profile/COST-ESTIMATION.md) | 命名空间 `personal-center-pricing` |
| **个性化 · 全局指令** | assemble 事件注入(读 `custom-instructions` 命名空间) | `PersonalizationTab` 全局子区(textarea + 保存) | `GET/POST /personal-center/custom-instructions` | [personalization/个性化指令增强-PRD.md](personalization/个性化指令增强-PRD.md) | 命名空间 `custom-instructions`(永不迁移) |
| **个性化 · 按工作区 + 模板库** | `matchWorkspace`(cwd 最长前缀)/ `matchRules` / assemble 合并 | `PersonalizationTab` 工作区子区(选择器/列表/模板库/指令应用示例) | `GET/POST /personal-center/instructions`、`/current-workspace`、`/workspaces` | [personalization/个性化指令增强-PRD.md](personalization/个性化指令增强-PRD.md) | 命名空间 `personal-center-instructions`(JSON:workspaces/templates/rules) |
| **宠物 · 浮层/配置** | pet 路由 + 素材托管(仅位图) | `PetSection`(单页)+ `PetStatusConfig`(会话状态卡)+ `PetPanel`(4 皮肤卡)+ `PetWidget`(位图浮层)/`VectorPetWidget`(矢量浮层) | `GET/POST /personal-center/pet`、`GET /personal-center/pet/assets/*`(仅位图) | [pet/DESKTOP-PET.md](pet/DESKTOP-PET.md) | 命名空间 `personal-center-pet`;位图素材 `lib/pet-assets/<skin>/`;矢量皮肤纯 DOM 无素材 |
| **宠物 · 会话状态概览** | 数据来自平台 `sessions` 投影(客户端直取,零 host) | `PetStatusPanel`(毛玻璃面板,事件驱动,双击进入会话) | —(无专用路由) | [pet/宠物状态概览-设计规格与交接.md](pet/宠物状态概览-设计规格与交接.md) | 平台 `ctx.get("sessions")` |
| **注入通道(公共)** | `ctx.on("system-prompt/assemble")` 事件插入 custom-instructions 段 | — | — | [common/PLATFORM-NOTES.md](common/PLATFORM-NOTES.md) §14 | — |

## 关键文件速查

| 文件 | 职责 |
|---|---|
| `lib/index.js` | 宿主:设置命名空间注册 / assemble 注入 / 环回路由(stats·instructions·pricing·pet·workspaces) |
| `lib/client.js` | 客户端:`PersonalCenterSection` 外壳 + `ProfileTab` + `PersonalizationTab` + `PetPanel/PetOverlay`(手写 bundle,无 JSX) |
| `lib/pet-assets/<skin>/{animations,idle}/` | 宠物动画 WebP(宿主托管) |
| `AGENTS.md` | 项目长期记忆(需求约定 + 实现事实,每次必读) |
| `docs/README.md` | 知识地图(本文件的索引入口) |
| `docs/screenshots/` | 发布截图(README 引用) |

## 模块边界(改动前确认归属)

- **个人资料** 只读会话日志聚合数字,**不读正文**;
- **个性化** 走 `system-prompt/assemble` 事件注入,**严禁**用 `systemPrompt` 服务注册(0.7.0 起会阻塞启动);
- **宠物** 纯客户端浮层 + 宿主素材托管;状态概览用平台 `sessions` 投影,**零轮询**;
- 红线:不改核心依赖、纯本地零网络、`custom-instructions` 数据永不迁移。
