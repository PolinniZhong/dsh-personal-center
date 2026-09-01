# 项目知识地图

`dsh-personal-center` 的知识与设计文档索引。按需阅读,不要一次读完。

## 一句话

给 DeepSeek Harness(DSH)加「个人配置」分区(设置 → 个人配置),四个 tab:**Token 用量统计**(Token/工具/按模型/Token 活动 + 模型成本估算)+ **个性化分层指令**(全局 + 按工作区 + 模板库 + 注入预览)+ **外观(全局字号 11–16)** + **桌面宠物(数据驱动情绪的黑鲸 + 会话状态概览)**。纯本地、插件化、不联网。

## 文档导航(按模块分组)

| 文档 | 回答什么问题 | 何时读 |
|---|---|---|
| [../AGENTS.md](../AGENTS.md) | **项目长期记忆**:已确认需求约定 + 关键实现事实(每次必读) | 任何开发/修改前 |
| [SDD.md](SDD.md) | **模块规格与边界契约**:类前缀 / 易混淆点 / 新增模块 SOP | 改代码前对号入座 |
| [MODULE-MAP.md](MODULE-MAP.md) | **模块地图**:功能 → 代码/路由 → 文档 → 素材 的完整映射 | 想定位某个功能归哪个文件 |

**📊 Token 用量(统计/成本)** — `personal-profile/`
| [personal-profile/DATA-MODEL.md](personal-profile/DATA-MODEL.md) | 会话日志格式、统计数据从哪来 | 改统计逻辑 |
| [personal-profile/COST-ESTIMATION.md](personal-profile/COST-ESTIMATION.md) | 成本估算口径(峰谷/分币种/预设价) | 改成本计算 |

**✏️ 个性化(全局/按工作区/模板库/注入)** — `personalization/`
| [personalization/个性化指令增强-PRD.md](personalization/个性化指令增强-PRD.md) | 分层指令(全局+按工作区+模板库+预览)的产品需求与验证结论 | 维护/扩展个性化功能 |

**🎨 外观(全局字号)** — 规格见 `SDD.md` §2「外观」
| [SDD.md](SDD.md) | 外观模块职责/边界、全局字号引擎 `UI_FONT_*`(11–16、默认 14) | 改外观/字号 |

**🐋 宠物(浮层/情绪/状态概览)** — `pet/`
| [pet/DESKTOP-PET.md](pet/DESKTOP-PET.md) | 桌面宠物方案与落地记录(形态/情绪/阈值校准/已知限制) | 维护宠物功能 |
| [pet/宠物状态概览-设计规格与交接.md](pet/宠物状态概览-设计规格与交接.md) | 会话状态概览的交互/视觉/轻量约束规格 + 交接提示词 | 实现/维护会话状态概览 |

**🛠 公共(架构/平台/设计/发布)** — `common/`
| [common/DESIGN.md](common/DESIGN.md) | 整体架构、各层机制、隐私边界、宠物设计决策 | 想理解插件怎么工作 |
| [common/PLAN.md](common/PLAN.md) | 里程碑、决策点、发布状态与剩余项 | 想推进下一阶段 |
| [common/PROMOTION.md](common/PROMOTION.md) | 推广写作底稿:定位/卖点/事实/语气/角度/短句 | 要写文章、发帖推广 |
| [common/PLATFORM-NOTES.md](common/PLATFORM-NOTES.md) | DSH 平台的坑、限制、扩展点(血泪经验) | 改宿主端/客户端、遇到诡异 bug |
| [common/DESIGN-SYSTEM.md](common/DESIGN-SYSTEM.md) | 间距/字号/色值/组件规范 + 宠物 UI + 会话状态面板规范 | 改 UI |
| [common/nav-icon-patch.md](common/nav-icon-patch.md) | 个人导航图标补丁怎么打、何时重打 | DSH 升级后图标变回齿轮 |
| [common/发布手册.md](common/发布手册.md) | 四口径发布流程(GitHub/npm/awesome-dsh-plugin/官方展示帖)+ 踩坑记录 | 发版、交接 |
| [common/已发布平台.md](common/已发布平台.md) | 插件发布在哪些平台、PR 状态、待办 | 交接、查看发布进度 |
| [common/竞争力分析.md](common/竞争力分析.md) | 个人工作台生态位、竞品地图、推广策略 | 写推广、做定位决策 |

## 关键结论速查

| 主题 | 结论 | 详见 |
|---|---|---|
| 为什么不用 `settingsScope` 写设置 | api 网关白名单 `WEB_SETTINGS_NAMESPACES`,自定义命名空间报 `settings-not-exposed` | PLATFORM-NOTES |
| 统计读日志为何要自写 zstd 帧扫描 | `node:zlib` 只解第一帧,追加式日志是多帧拼接 | PLATFORM-NOTES / DATA-MODEL |
| 图标补丁为何会消失 | `dependencies/dsh` 由发布源整树下载,升级覆盖 | nav-icon-patch |
| 深浅色怎么适配 | 全用 `--dsw-alias-*` 主题令牌,图标用 `currentColor` | DESIGN-SYSTEM |
| 个性化数据存哪 | `settings.yaml`:全局 `custom-instructions.text`;工作区+模板 `personal-center-instructions`(JSON) | DESIGN.md / AGENTS.md |
| 个性化指令怎么注入 | 0.7.0 关闭 `systemPrompt` 服务注册后,走 `system-prompt/assemble` 事件在组装结果里插段;**勿用 systemPrompt 服务注册** | PLATFORM-NOTES §14 |
| 统计隐私边界 | 只聚合数字,不读正文;路由仅回环 | DESIGN.md / PRIVACY.md |
| 宠物为什么平时静止 | 参考 Codex 宠物规范:idle 待机=静止,情绪变化/逗弄时才播放动画 | DESKTOP-PET |
| 宠物为什么不能全屏移动 | 桌面端是 Tauri 宿主 + iframe,dsh 应用与宿主跨源、无 Tauri API;插件无法出窗口 | PLATFORM-NOTES |
| 宠物素材怎么生产 | RGBA 帧 → 动画 WebP(gif2webp.py),animations/ 动作 + idle/ 待机 | DESKTOP-PET |
| 改素材为什么看不到 | 宿主 immutable 缓存 + 素材路径不变 → 浏览器沿用旧图;素材 URL 需带 `?v=` 版本参数并递增 | PLATFORM-NOTES / DESKTOP-PET |
| 会话状态概览数据从哪来 | 平台已有 `sessions` 投影(useSessions),事件驱动、零轮询;失败如实标红,绝不伪装成功 | DESIGN / DESKTOP-PET |
| 会话状态面板视觉规范 | 毛玻璃浮层(同气泡配方 v0.4.20)+ 状态色板(蓝/红/绿/灰)+ 点面板外或 ESC 关闭 | DESIGN-SYSTEM |

## 修改守则(改代码前读)

1. **宿主端改动**要重启应用生效;**客户端改动**刷新页面即可。
2. 客户端是手写的 `window.__ModuleLoader__.load({id, factory})` 格式,`require` 只认 `react`、`@deepseek-ai/dsh-client-*` 等已注入模块。
3. 改完必跑:`node --check` + 冒烟(见仓库历史里的临时 `.pc-smoke.cjs` 写法)。
4. 涉及核心包(`dependencies/dsh/node_modules/**`)的改动**不持久**,升级会覆盖。
5. 统计聚合只取 `assistant/message.data.usage` 与 `tool/call.data.name` 等数字字段,禁止读正文。
6. 宠物素材改动:重新跑 `AI桌面宠物/black-whale-petblack-whale-pet-圆滚滚小黑鲸 V1/scripts/gif2webp.py` 生成 `lib/pet-assets/<skin>/{animations,idle}/` 的 WebP,再提交产物。
