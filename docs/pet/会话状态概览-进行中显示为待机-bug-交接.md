# Bug 交接:宠物「会话状态概览」进行中显示为 0(全待机)

> 目标:在会话 **session-250b12c3-6397-4b08-9562-9cb5892fb543** 中修复。
> 本文档自包含,无需回到原对话上下文。修复后回填结论到本文档底部。

## 1. Bug 现象(用户报告,2026-08-29)

点宠物(右下角)上的「会话状态」按钮打开面板:
- 摘要显示:**进行中 0 / 失败 0 / 完成 2**;
- 列表 5 条全部标「**待机**」;
- 但用户确认**实际有正在进行的会话**(运行中),面板没显示出来。

截图见原对话(灰字:进行中 0、完成 2,列表全"待机")。

## 2. 已确认的代码事实(原对话诊断到这一步,勿重复)

**状态面板判定**(`lib/client.js` `StatusOverview._project()`,约 2300-2333 行):
```
status 优先级:failed(lastAgentError) > running(entry.running) > completed > idle
running 子状态:waiting(pending>0) > thinking(无工具调用) > working(有动作文案)
```
**关键:running 完全依赖 `sessions.list.getSnapshot().byId[id].running`**(平台 sessions 投影的 entry.running 字段)。

**另一处同源消费**:常驻会话情绪同步器 `petStatusEmotionOf()`(约 2493-2518 行)同样读 `entry.running` 决定宠物情绪(等待/思考/忙碌)。如果它也没触发,宠物情绪同步也可能受影响——**两处共享同一数据源**。

**订阅机制**(`StatusOverview._subscribe()`,约 2230-2270 行):
- `this.sessions.list.subscribe(() => this._render())`(list 变化重渲染);
- 对每个 session id:`this.sessions.manager.get(id).subscribe(() => this._render())`(per-session 变化重渲染)。

**数据源注入**:`apply()` 里 `petStatusSessions = ctx.get("sessions")`(约 2483 行)。

## 3. 诊断方向(按可能性排序,先查再改)

1. **`entry.running` 为什么是 false**——这是核心。在"有会话正在运行"时,打开面板/断点看 `sessions.list.getSnapshot().byId[<运行中id>].running` 的实际值:
   - 如果 running 本身就是 false → 平台 projections 的 running 语义/更新时机问题(可能运行中的是子代理/后台会话,或 running 判定依赖某事件未触发);
   - 如果 running 为 true 但面板仍显示待机 → `_project()` 或 `_render()` 的过滤/订阅问题(比如 `entry.blank` 误判、快照引用未更新)。
2. **最近 v0.8 桌宠改动是否引入**:AGENTS.md §5 记录 v0.8.0「会话状态情绪实时驱动(常驻同步器、情绪锁仲裁 stats 不覆盖、完成庆祝走 running 下降沿、持续情绪不回落)」——检查这些改动是否改了 sessions 订阅/`entry.running` 的消费方式(比如情绪同步器与面板共享订阅、或 running 判定被新逻辑短路)。
3. **订阅是否断**:list 快照的 `running` 变化是否会触发 `list.subscribe`(若 running 只在 per-session 快照变、list 快照不重建,则 `_render` 可能不重跑——验证 per-session subscribe 是否覆盖 running 变化)。

## 4. 复现与验证

- 复现:让一个会话真正运行中(发消息等回复),点宠物「会话状态」→ 面板应显示「进行中 ≥1」;
- 修后验证:进行中显示正确 + 列表第一条动作文案(thinking/working/waiting)正确 + 摘要计数对;
- 回归:失败标红、完成绿、待机灰;宠物情绪同步(运行中 → busy/waiting/thinking)不受影响。

## 5. 相关文档与红线

- 规格:`docs/pet/宠物状态概览-设计规格与交接.md`、`docs/pet/宠物状态概览-动作级实时状态-设计规格.md`;
- 项目记忆:根 `AGENTS.md`(约定必读)、`docs/MODULE-MAP.md`(模块地图);
- 红线:不改核心依赖、纯本地、状态概览用平台 `sessions` 投影**零轮询**、失败如实显示(绝不伪装成功)。

## 6. 修复回填(已完成并实机取证,2026-08-29)

- [x] **根因(已用真实运行数据确认)**:真正在跑的会话**能被检测为「运行中」**(摘要「进行中 N」正确),但它排在 `sessions.list` 快照 `snap.ids` 的靠后位置,而列表用 `rows.slice(0, 5)` 只渲染前 5 条——运行中会话被**截断不可见**。于是出现「摘要进行中 1 / 失败 0 / 完成 0,但列表 5 条全待机」的不一致。实测:本会话 `session-250b12c3`(0829 版本会话状态)有 `openStep`(正在跑),投影 `sessionStats.openStep` 非空、`pendingCalls:{}`;用户所述的 `session-f70b2944`(理解项目并规划接手) `openStep:null`、末轮 `completed`,**其实未在运行**。
- [x] **修复**:`lib/client.js` 两处:
  1. `PetStatusPanel._render()` 在 `rows.slice(0,5)` 前按状态优先级排序(`running:0 > failed:1 > done:2 > idle:3`),让运行中/失败会话置顶、必落在可见的 5 条内;排序不影响摘要计数。
  2. 新增回落判定 `petSessionActive(s)`(per-session 快照 `pending>0` 或 `runningCalls>0` 视为运行中),用于 `entry.running` 未置位但有活跃工作的场景;与 `entry.running` 一起在 `_project()` 与 `petStatusEmotionOf()` 生效,状态优先级 失败>运行中>已完成>待机 不变。
- [x] **验证**:以 `~/.dsh/storages/session_projcache.json` 真实数据重建 `_project()`+排序逻辑——修复前 `slice(0,5)` 里运行中会话不可见且摘要却为「进行中 1」;修复后该运行中会话排到 index 0、运行中可见。需实机确认面板首条显示「运行中/思考中」、其余回归(失败红/完成绿/待机灰、宠物情绪)。
- [ ] **残余**:`petSessionActive` 只覆盖 waiting/working;**纯「thinking」(无 pending、无 runningCalls、`entry.running` 也为 false)仍依赖 `entry.running`**。若 `entry.running` 对当前运行中会话长期为 false,需按 §3 断点确认 byId 字段与 `session/status` 触发,判断是否字段改名(如 `status`/`active`)——本次实例中 `entry.running` 实测为 true(进行中 1),故非本次主因。
