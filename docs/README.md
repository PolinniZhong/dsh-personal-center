# 项目知识地图

`dsh-personal-center` 的知识与设计文档索引。按需阅读,不要一次读完。

## 一句话

给 DeepSeek Harness(DSH)加「个人」分区:个人资料统计(Token/工具/按模型/Token 活动)+ 全局自定义指令 + 模型成本估算 + **桌面宠物(数据驱动情绪的黑鲸)**。纯本地、插件化、不联网。

## 文档导航

| 文档 | 回答什么问题 | 何时读 |
|---|---|---|
| [DESIGN.md](DESIGN.md) | 整体架构、各层机制、隐私边界、宠物设计决策 | 想理解插件怎么工作 |
| [PLAN.md](PLAN.md) | 里程碑、决策点、发布状态(v0.4.15)与剩余项 | 想推进下一阶段 |
| [PROMOTION.md](PROMOTION.md) | 推广写作底稿:定位/卖点/事实/语气/角度/短句 | 要写文章、发帖推广 |
| [DESKTOP-PET.md](DESKTOP-PET.md) | 桌面宠物方案与落地记录(形态/情绪/阈值校准/已知限制) | 维护宠物功能 |
| [PLATFORM-NOTES.md](PLATFORM-NOTES.md) | DSH 平台的坑、限制、扩展点(血泪经验) | 改宿主端/客户端、遇到诡异 bug |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | 间距/字号/色值/组件规范 + 宠物 UI 规范 | 改 UI |
| [DATA-MODEL.md](DATA-MODEL.md) | 会话日志格式、统计数据从哪来 | 改统计逻辑 |
| [nav-icon-patch.md](nav-icon-patch.md) | 个人导航图标补丁怎么打、何时重打 | DSH 升级后图标变回齿轮 |

## 关键结论速查

| 主题 | 结论 | 详见 |
|---|---|---|
| 为什么不用 `settingsScope` 写设置 | api 网关白名单 `WEB_SETTINGS_NAMESPACES`,自定义命名空间报 `settings-not-exposed` | PLATFORM-NOTES |
| 统计读日志为何要自写 zstd 帧扫描 | `node:zlib` 只解第一帧,追加式日志是多帧拼接 | PLATFORM-NOTES / DATA-MODEL |
| 图标补丁为何会消失 | `dependencies/dsh` 由发布源整树下载,升级覆盖 | nav-icon-patch |
| 深浅色怎么适配 | 全用 `--dsw-alias-*` 主题令牌,图标用 `currentColor` | DESIGN-SYSTEM |
| 个性化数据存哪 | `settings.yaml` 的 `custom-instructions.text`,经自有路由读写 | DESIGN.md |
| 统计隐私边界 | 只聚合数字,不读正文;路由仅回环 | DESIGN.md / PRIVACY.md |
| 宠物为什么平时静止 | 参考 Codex 宠物规范:idle 待机=静止,情绪变化/逗弄时才播放动画 | DESKTOP-PET |
| 宠物为什么不能全屏移动 | 桌面端是 Tauri 宿主 + iframe,dsh 应用与宿主跨源、无 Tauri API;插件无法出窗口 | PLATFORM-NOTES |
| 宠物素材怎么生产 | RGBA 帧 → 动画 WebP(gif2webp.py),animations/ 动作 + idle/ 待机 | DESKTOP-PET |

## 修改守则(改代码前读)

1. **宿主端改动**要重启应用生效;**客户端改动**刷新页面即可。
2. 客户端是手写的 `window.__ModuleLoader__.load({id, factory})` 格式,`require` 只认 `react`、`@deepseek-ai/dsh-client-*` 等已注入模块。
3. 改完必跑:`node --check` + 冒烟(见仓库历史里的临时 `.pc-smoke.cjs` 写法)。
4. 涉及核心包(`dependencies/dsh/node_modules/**`)的改动**不持久**,升级会覆盖。
5. 统计聚合只取 `assistant/message.data.usage` 与 `tool/call.data.name` 等数字字段,禁止读正文。
6. 宠物素材改动:重新跑 `AI桌面宠物/black-whale-petblack-whale-pet-圆滚滚小黑鲸 V1/scripts/gif2webp.py` 生成 `lib/pet-assets/<skin>/{animations,idle}/` 的 WebP,再提交产物。
