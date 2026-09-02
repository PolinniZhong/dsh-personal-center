# SDD(软件设计文档)· dsh-personal-center

> 本文件是「个人配置」插件的模块规格与边界契约。改代码前先看 §2 对号入座,**严禁跨模块改错**。
> 与 `AGENTS.md` §1 的模块地图互为备份;两者不一致时以本文件为准。

## 1. 架构概述

- 插件形态:DSH 客户端 bundle(单文件 `lib/client.js`,手写、无 JSX、`react.createElement`)+ 宿主 `lib/index.js`。
- 分区外壳 `PersonalCenterSection`:顶部 Tab 栏,4 个 tab —— **Token 用量 / 个性化 / 外观 / 宠物**。
- 原则:**事件驱动优先(能订阅不轮询)**;纯本地零网络零新依赖;UI 只走 DSH 主题令牌(见 `docs/common/DESIGN-SYSTEM.md`)。

## 2. 模块职责与边界

### Token 用量(`.dsh-pc-profile-*`)
- 组件:`ProfileTab`(子 tab 概览/常用工具/成本)、`TokenActivity`(日/周/累计热力图)、`StatCard`、`CostEditor`。
- 数据:`GET /personal-center/stats`(统计)、`GET/POST /personal-center/pricing`(价格)。
- 边界:**只读聚合数字,不读会话正文**。

### 个性化(`.dsh-pc-pers-*`)
- 组件:`PersonalizationTab`(全局 / 按工作区 / 模板库 / 注入预览)。
- 数据:`/personal-center/instructions`、`/current-workspace`、`/workspaces`;注入走 `system-prompt/assemble` 事件(宿主)。
- 边界:只用 `system-prompt/assemble` 通道,**禁用 `systemPrompt` 服务**(0.7.0 起会阻塞启动)。

### 外观(`.dsh-pc-appear-*`)
- 组件:`AppearanceTab`(全局字号步进器)+ 全局字号引擎 `UI_FONT_*`(注入 `<style>` 覆盖层)。
- 数据:`localStorage`(`dsh-personal-center.uiFont`)。
- 边界:**只做全局字号偏移**,不触碰其它模块的版式。

### 宠物(`.dsh-pc-pet-*` / `.dsh-pc-petstatus-*` / `.dsh-pet-*` / `.dsh-pet-status-*` / `.dsh-pet-vector-*`)
- 组件:
  - 设置卡:`PetPanel`(4 张皮肤卡:位图 黑鲸/蓝鲸 + 矢量 小黑/小蓝)、`PetStatusConfig`(会话状态开关卡,前缀 `petstatus`)、`PetSection`(单页容器);
  - 浮层:`PetWidget`(位图,动画 WebP)/`VectorPetWidget`(矢量,纯 DOM 鼠标跟随)、`PetStatusPanel`(会话状态概览浮层)。
- 皮肤:位图 `black-whale` / `blue-whale`(动画 WebP);矢量 `black-vector` / `blue-vector`(纯 DOM,无素材,类前缀 `.dsh-pet-vector-*`)。
- 数据:`/personal-center/pet`(宠物配置)、`ctx.get("sessions")`(会话状态)、`/stats`(用量情绪)。
- 边界:**会话状态概览只用平台 `sessions` 投影,零轮询**;`sessionStatus` 关闭时隐藏状态按钮 + 停用情绪同步;矢量皮肤无情绪动画(情绪接口 no-op),位图↔矢量切换需销毁重建实例(类不同)。

### 共享外壳(`.dsh-pc-*` 通用)
- `PersonalCenterSection`、`TabButton`、`PillTabButton`、以及 `.dsh-pc-section/heading/intro/tabs/tab/panel/group/mock` 等布局原语。被所有模块复用,不属于任何单一模块。

## 3. 运行逻辑 / 数据流

1. `PersonalCenterSection` 用 `react.useState("profile")` 记住当前 tab,`TabButton` 切换渲染对应模块组件。
2. 各模块自行拉取数据(见 §2 数据源),状态变化走订阅/轮询驱动重渲染。
3. 宠物情绪:常驻同步器订阅 `sessions.list`,实时映射 thinking/waiting/celebrate;无会话活动时解锁交回 `stats` 用量情绪。

## 4. 类名前缀契约(治理关键)

- 每个模块**唯一类名前缀**,见 §2 标题括号;**新增模块必须新起前缀,禁止复用**。
- 类名变更 = 功能变更,必须同步改 `AGENTS.md` §1 模块地图 + 本文件。
- 历史教训:旧 `.dsh-pc-ss-*` 被「外观」和「宠物·会话状态」共用,导致 AI 改错模块;现已拆成 `.dsh-pc-appear-*` 与 `.dsh-pc-petstatus-*`。

## 5. 易混淆点(防再犯)

1. **外观 vs 宠物**:外观=字号步进器(`.dsh-pc-appear-*`);宠物·会话状态卡=开关(`.dsh-pc-petstatus-*` + `.dsh-pc-pet-switch`)。两者都长成“带边框设置卡”,但前缀不同。
2. **Token 用量 vs 成本**:成本(`CostEditor`)属 Token 用量模块,前缀 `.dsh-pc-profile-*`。
3. **宠物设置卡 vs 宠物浮层**:前者 `.dsh-pc-pet-*`,后者 `.dsh-pet-*`/`.dsh-pet-status-*`(浮层 DOM)。
4. **位图皮肤 vs 矢量皮肤**:位图 `black-whale`/`blue-whale` 用 `PetWidget` + WebP(`/personal-center/pet/assets/*`);矢量 `black-vector`/`blue-vector` 用 `VectorPetWidget` + 纯 DOM(`.dsh-pet-vector-*`),无素材、无情绪动画。两者实例类不同,切换需销毁重建。

## 6. 新增模块 SOP

1. 起唯一类名前缀;2. `client.js` 加组件 + `//#region 模块: xxx`;3. `PersonalCenterSection` 注册 tab;4. 更新本文件 §2 + `AGENTS.md` §1 模块地图(缺一不可)。

## 7. 文件/组件映射

| 文件 | 职责 |
|---|---|
| `lib/index.js` | 宿主:设置命名空间 + assemble 注入 + 环回路由(stats/instructions/pricing/pet/workspaces)+ 素材托管 |
| `lib/client.js` | 浏览器:分区外壳 + 4 模块组件 + 宠物浮层运行时 + 外观字号引擎(单 bundle) |
| `lib/pet-assets/<skin>/` | 位图宠物动画 WebP(宿主托管;矢量皮肤 `black-vector`/`blue-vector` 无素材) |
| `cordis.patch.yml` | 插入插件行(客户端半部经 `exports.client` + `dsh.client` 自动加载) |
