# 设计文档:DSH 个人中心

## 1. 目标

给 DeepSeek Harness 提供一个"个人中心"性质的本地插件:

- **v0.1 自定义指令**:设置面板里像 ChatGPT/Codex 桌面端一样编辑全局指令,对所有聊天生效。
- **v0.2 使用统计**:Token 用量、工具调用、MCP 使用分布的可视化仪表盘。

## 2. 架构

DSH 插件 = 一个 npm 包,同时含 **宿主端**(Node,运行在 DSH 进程内)与 **浏览器端**(`exports["./client"]` 指向的 ModuleLoader bundle):

```
package.json  dsh.bundle.patch → cordis.patch.yml(插入 Loader 行)
              dsh.client.platform: web(浏览器自动加载 client bundle)
lib/index.js  宿主:服务注册、RPC、日志聚合
lib/client.js 浏览器:设置分区 UI、统计面板 UI
```

安装方式(二选一):

1. `dsh plugin --profile web add github:<owner>/dsh-personal-center`(发布后);
2. 本地开发:profile `package.json` 加 `link:` 依赖 + `bundles` 列表 + `node_modules` 软链接。

## 3. v0.1 自定义指令 —— 已实现

| 层 | 机制 |
|---|---|
| 设置存储 | 命名空间 `custom-instructions`(schema `{ text: string }`),宿主 `ctx.settings.register` 注册;浏览器端经**环回路由** `GET/POST /personal-center/custom-instructions` 读写,持久化进 `settings.yaml` |
| 系统提示词 | 宿主注册段 `custom-instructions`(order 10,紧随 persona 之后)+ 变量 `{{customInstructions}}`,变量提供方每次组装时读设置 → 保存即对所有会话下次请求生效;空文本渲染为空段被丢弃 |
| 设置 UI | 浏览器注册 `settings.section` 分区(id `personal-center`,order 30,标签「个人」),tab 内多行文本框 + 保存/清空/失败反馈 |

> **为何不走 `settingsScope`**:DSH 的 api 网关有一个 Web 设置命名空间白名单
> (`WEB_SETTINGS_NAMESPACES`),自定义命名空间不在其中会得到 `settings-not-exposed`
> (读不到也写不进)。框架尚未开放"插件自行暴露命名空间",故本插件用自有环回路由
> 直接调宿主 `ctx.settings` 读写,绕开白名单。

KV 缓存提示:修改指令文本会使系统提示词前缀从该段起失效,属预期行为。

## 4. v0.2 使用统计 —— 方案

### 4.1 数据来源(已确认存在)

- 会话日志:`<DSH_HOME>/data/dsh/sessions/<workspace>/session-<uuid>/session.jsonl.zstd`(zstd 压缩 JSONL,读写能力在 `@deepseek-ai/dsh-session-persistence-jsonl`);
- **Token 用量**:请求头事件携带 usage(输入/输出/缓存读/缓存写),聊天统计行已经用 `tokenUsage` 投影展示(每会话);
- **工具调用**:日志中的 tool start / settle 事件,含工具名与参数;
- **MCP**:工具注册名为 `mcp__<serverName>__<rawName>`,可按 serverName 前缀聚合;
- **会话元数据**:工作区路径、创建时间、标题(在持久化 header 中)。

### 4.2 宿主端聚合服务

- 提供 RPC(走现有 api-gateway / `connection.api` 通道,环回):
  - `personal-center/stats?range=today|7d|30d`
  - 返回 `{ byDay: [{date, inputTokens, outputTokens, cachedTokens, turns}], byModel: [{provider, model, tokens, requests, cachedTokens}], tools: [{name, calls}], mcp: [{server, calls, tools}] }`;
- **按模型 / 提供方分组**:请求路由记录 provider+model,按二者分组求和即可;
  「估算成本」列为可选,单价(每百万 token)由用户在设置里自行配置,宿主
  **不硬编码任何价格**(各厂商定价易变,避免背书错误成本);
- 实现:按需扫描会话日志目录,聚合后**进程内缓存 + 按天快照**;避免每次打开面板全量重扫;
- **隐私边界:只聚合数字,不读取对话正文内容**;对外导出也不包含正文。

### 4.3 浏览器端面板

- 注册第二个 `settings.section`(id `personal-center`,order 40,标签「个人中心」)或侧边栏入口;
- 渲染:今日卡片(Token / 轮次 / 工具调用)、近 7 天柱状图、**Token 活动热力图
  (每日/每周/累计 三态切换:每日 = GitHub 风格周×星期格子、每周 = 52 个周格、
  累计 = 12 个月累计柱)**,按模型占比、工具 Top 列表、MCP 服务器分布;
- 图表可用轻量 SVG 自绘(避免引入重依赖,保持客户端 bundle 体积小)。

### 4.4 性能与正确性

- 聚合在宿主端一次完成并缓存;日志目录大时可加"增量索引"(只扫增量段);
- 直接读权威日志,不引入第二份数据源,保证数字与聊天统计行一致。

## 5. v0.4 桌面宠物 —— 已实现

> 一只由真实用量驱动情绪的浮游黑鲸,浮在 DSH 界面右下角;纯 DOM、零依赖。素材与交互规范详见 [DESKTOP-PET.md](DESKTOP-PET.md)。

### 5.1 定位与行为(参考 Codex 宠物规范)

- **常驻显示,平时静止不打扰**:待机只显示单帧静态表情(`idle/*.webp`),无常驻循环动画;情绪变化时播放一次对应动画后回到静止;
- **逗弄才动**:鼠标悬停或点击时,按当前情绪播放一次动作动画(`animations/*.webp`,约 2.2s)后回到待机;
- **自由拖拽**:拖到哪停哪,松手把 `{left, top}` 持久化到配置,刷新后恢复;窗口内钳制;
- **5 种数据驱动情绪**,30s 轮询 `/personal-center/stats`,优先级:钱包痛 > 疲惫 > 忙碌 > 打盹 > 开心(阈值按本机真实数据校准,见 DESKTOP-PET §5)。

### 5.2 架构

| 项 | 机制 |
|---|---|
| 素材 | 宿主托管:`lib/pet-assets/{animations,idle}/*.webp`(真 alpha),环回路由 `/personal-center/pet/assets/*`(regex 白名单 + immutable 缓存) |
| 组件 | PetWidget 内联进 `lib/client.js` factory 作用域(纯 DOM,不用 react-dom);启动按配置在 `document.body` 挂 `position:fixed` 浮层 |
| 数据 | 30s 轮询 stats → 情绪判定;宿主 `computeStats` 新增 `cost.today` 桶驱动「钱包痛」 |
| 配置 | 命名空间 `personal-center-pet`(`{enabled, opacity, posOverride}`),环回路由 `GET/POST /personal-center/pet`;**客户端持久化串行队列**,避免并发 POST 在宿主"读-改-写"下互相覆盖 |
| 面板 | 两张宠物卡片(预览 + 宠物名 + ⓘ 提示 + 今日统计 + 不透明度档位 + 开关,互斥);左边形象交替随机动画 + 启用唤醒;尺寸固定 S |

### 5.3 关键决策(与宠物素材仓库的约定)

1. **cost_today 口径**:宿主加今日成本桶(精确匹配 PRD「今日成本」;未配置价格时为空对象,情绪自然降级);
2. **素材格式:动画 WebP** 替代 GIF(GIF 二值透明有白边);由 `AI桌面宠物/black-whale-pet/scripts/gif2webp.py` 从 RGBA 帧合成,产物提交进插件仓库;
3. **集成方式:宿主托管素材**(懒加载、bundle 保持轻量),而非 base64 内联;
4. **情绪判定顺序**:打盹先于开心(否则高缓存命中率用户永不入睡)。

## 6. 发布

1. `git init` + 提交,推送到 GitHub;
2. README 顶部放截图;
3. 仓库加 `dsh-plugin` topic(让 dsh-plugin-hub 索引收录,社区可发现);
4. 在 README 提供 `dsh plugin add github:<owner>/dsh-personal-center` 一行安装命令。

## 7. 已知边界

- 统计只覆盖本机(DSH 数据在本机);若未来支持多机同步,需引入外部存储,暂不考虑;
- DSH 0.1.0-rc.6 兼容;上游 breaking 升级(0.2/1.0)后需按 seam 变更适配;
- 客户端 bundle 手写(ModuleLoader 格式),不依赖构建链,改动即生效(刷新页面);
- **宠物全屏移动不可行**:桌面端是 Tauri 宿主 + iframe,dsh 应用无 Tauri API、与宿主跨源,插件无法出窗口(详见 PLATFORM-NOTES §11);要全屏需 DSH 官方浮层能力或独立小应用;
- 宠物「钱包痛」阈值(¥10)以人民币计,USD 币种配置下语义不匹配(本机为 CNY);
