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
| 设置存储 | 命名空间 `custom-instructions`(schema `{ text: string }`),宿主 `ctx.settings.register` 注册,浏览器 `settingsScope.bind` 读写,持久化进 `settings.yaml` |
| 系统提示词 | 宿主注册段 `custom-instructions`(order 10,紧随 persona 之后)+ 变量 `{{customInstructions}}`,变量提供方每次组装时读设置 → 保存即对所有会话下次请求生效;空文本渲染为空段被丢弃 |
| 设置 UI | 浏览器注册 `settings.section` 分区(id `custom-instructions`,order 30,标签「个性化」),多行文本框 + 保存/清空 + 已保存反馈 |

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
  - 返回 `{ byDay: [{date, inputTokens, outputTokens, cachedTokens, turns}], byModel: [...], tools: [{name, calls}], mcp: [{server, calls, tools}] }`;
- 实现:按需扫描会话日志目录,聚合后**进程内缓存 + 按天快照**;避免每次打开面板全量重扫;
- **隐私边界:只聚合数字,不读取对话正文内容**;对外导出也不包含正文。

### 4.3 浏览器端面板

- 注册第二个 `settings.section`(id `personal-center`,order 40,标签「个人中心」)或侧边栏入口;
- 渲染:今日卡片(Token / 轮次 / 工具调用)、近 7 天柱状图、按模型占比、工具 Top 列表、MCP 服务器分布;
- 图表可用轻量 SVG 自绘(避免引入重依赖,保持客户端 bundle 体积小)。

### 4.4 性能与正确性

- 聚合在宿主端一次完成并缓存;日志目录大时可加"增量索引"(只扫增量段);
- 直接读权威日志,不引入第二份数据源,保证数字与聊天统计行一致。

## 5. 发布

1. `git init` + 提交,推送到 GitHub;
2. README 顶部放截图;
3. 仓库加 `dsh-plugin` topic(让 dsh-plugin-hub 索引收录,社区可发现);
4. 在 README 提供 `dsh plugin add github:<owner>/dsh-personal-center` 一行安装命令。

## 6. 已知边界

- 统计只覆盖本机(DSH 数据在本机);若未来支持多机同步,需引入外部存储,暂不考虑;
- DSH 0.1.0-rc.6 兼容;上游 breaking 升级(0.2/1.0)后需按 seam 变更适配;
- 客户端 bundle 手写(ModuleLoader 格式),不依赖构建链,改动即生效(刷新页面)。
