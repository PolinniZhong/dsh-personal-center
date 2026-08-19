# 会话日志数据模型(DATA-MODEL)

> 统计数据的来源与会话日志事件结构(实测自 `session.jsonl.zstd` 解压)。改统计逻辑前读。

## 1. 日志位置与格式

- 路径:`<DSH_HOME>/data/dsh/sessions/<workspace>/session-<uuid>/session.jsonl.zstd`;
- 格式:**zstd 多帧拼接的 JSONL**(见 [PLATFORM-NOTES](PLATFORM-NOTES.md) 第 3 条),每行一个 JSON 事件;
- 每行字段:`type`(事件类型)、`seq`(序号)、`time`(毫秒时间戳)、`data`(负载),部分事件还有 `sourceEventSeqs` / `surfaceOp`。

## 2. 事件类型(统计相关)

| 事件 | 关键字段 | 用途 |
|---|---|---|
| `session` | `id`, `createdAt`, `cwd` | 会话创建时间(时长起点) |
| `request/header` | `data.header.config.{provider,model}` | 本次请求的**模型路由**(按模型分布) |
| `assistant/message` | `data.usage.{inputTokens,outputTokens,cacheReadTokens,reasoningTokens}` | **每步 token 用量**(累计/今日/活动) |
| `tool/call` | `data.name` | **工具调用**(常用工具;MCP 为 `mcp__<server>__<tool>`) |
| `turn/start` / `turn/end` | `data.turn` | 轮次边界(可选,时长细化用) |
| `assistant/chunk` | `data.chunk.type==="usage"` | 流式过程中的用量**碎片**(不要累计,会重复) |

其它事件:`user/message`、`step/start`、`step/end`、`todo/write`、`approval/*`、`sandbox/mode` 等(统计暂不用)。

## 3. 统计口径

| 统计项 | 算法 | 注意 |
|---|---|---|
| Token 消耗 | `inputTokens + outputTokens + cacheReadTokens`,只累加 `assistant/message` 的 `usage` | 不累加 `assistant/chunk`(会重复计) |
| 按模型分布 | 遍历时用最近的 `request/header` 的 provider+model 给后续 `assistant/message` 归属 | 一个 step 对应一次请求 |
| 今日 / 累计 | 按事件 `time` 与本地零点比较 | 累计=全部 |
| 会话数 | 会话文件数 | 也用于「今日会话」= 有今日事件的会话 |
| 最长聊天时长 | `max(lastTime - session.createdAt)` | **墙钟跨度**,含挂机,非活跃时长 |
| 常用工具 | `tool/call.data.name` 计数 | MCP 按 `mcp__` 前缀可再归类 |
| Token 活动 | 按 `time` 归 `YYYY-MM-DD` → 52 周(每周 7 天强度 0-5)→ 12 月累计 | 强度按单日最大 token 归一 |

## 4. 实现位置

- 宿主端 `lib/index.js`:`computeStats(sessionsDir)` 全量聚合;`scanZstdFrames` + `zstdDecompressSync` 解压;60 秒进程内缓存;
- 暴露:`GET /personal-center/stats?refresh=1` → `{today,total,byModel,tools,activity,monthly}`;
- 浏览器端 `lib/client.js`:fetch 该路由渲染,loading/error/retry 三态。

## 5. 隐私边界

统计**只读数字字段**,不读 `user/message`、`assistant/message` 的正文 `content`,不读工具结果 `tool/result` 内容;路由仅回环。见 [PRIVACY.md](../PRIVACY.md)。
