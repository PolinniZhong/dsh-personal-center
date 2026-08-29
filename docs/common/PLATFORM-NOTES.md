# DSH 平台要点与坑(PLATFORM-NOTES)

> 本文件沉淀开发本插件时踩过的坑、验证过的限制与可用的扩展点。**每条都是实测结论**,不是推断。

## 1. 插件结构(宿主 + 客户端)

一个 DSH 插件 = 一个 npm 包,`package.json` 里:

```json
{
  "type": "module",
  "main": "./lib/index.js",
  "exports": { ".": "./lib/index.js", "./client": "./lib/client.js", "./package.json": "./package.json" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web", "inject": ["...客户端依赖包..."] }
  }
}
```

- **宿主端** `lib/index.js`:导出 `apply(ctx)`,用 `ctx.inject(["服务名"], cb)` 拿服务;
- **浏览器端** `lib/client.js`:手写的 `window.__ModuleLoader__.load({ id, factory })`,工厂内 `require("react")`、`require("@deepseek-ai/dsh-client-runtime/client")` 等;
- `cordis.patch.yml`:`- insert: [{id, name}]` 插入 Loader 行;包进 `dsh.profile.bundles` 后其 patch 自动生效;
- 客户端自动加载靠 `exports["./client"]` + `dsh.client.platform: "web"`。

## 2. 设置白名单(重要:自定义设置写不进 Web)

api 网关(`dsh-host-apiproxy`)只向 Web 客户端暴露一个**硬编码白名单** `WEB_SETTINGS_NAMESPACES`(`agent-loop/shell/locale/permission/ui-conversation/ui-theme/web-search-deepseek` + 少数产品命名空间)。自定义命名空间即使 `settings.register` 了,客户端读会拿不到、写会报 `settings-not-exposed`。

框架注释明确:让插件自行暴露命名空间是 **deferred work**。

**对策(本插件采用)**:不用 `settingsScope`,改走**自有环回路由**直接调宿主 `ctx.settings` 读写。见 `lib/index.js` 的 `GET/POST /personal-center/custom-instructions`。

## 3. zstd 多帧解压

会话日志 `session.jsonl.zstd` 是**追加式多帧拼接**。`node:zlib` 的 `zstdDecompressSync` / `createZstdDecompress` 流式都**只解第一帧**。

**对策**:按 zstd 帧结构手动扫描帧边界(`scanZstdFrames`,魔数 `0xFD2FB528`),再逐帧 `zstdDecompressSync(subarray)`。实现见 `lib/index.js`。

## 4. 核心包改动不持久(升级覆盖)

`<AppSupport>/dependencies/dsh/` 由桌面应用从 `hairyf/deepseek-harness-pkg` 发布源**整树下载**,应用升级(rc.6→rc.7、0.6.x→0.7.0 均实测)会覆盖整个依赖树。

**结论**:任何对 `dependencies/dsh/node_modules/**` 的手动改动都会在升级后丢失。本插件的图标补丁因此需要升级后重打(见 [nav-icon-patch.md](nav-icon-patch.md),2026-08-22 的 0.7.0 升级后已再次重打)。插件本体放在 profile 的 `<home>/profiles/web/**`(用户数据),不受影响。

## 5. 设置导航图标无法插件化

设置壳(`dsh-client-ui-settings-general`)的 `navIcon(id)` 是**硬编码**的(models/agent-presets/plugins → 图标,其余回退齿轮),**没有**插件注册自定义图标的接口。要自定义只能改核心文件(见第 4 条的限制)。

## 6. 环回路由与请求体

宿主端注册环回路由(参考 plugin-console):

```js
ctx.inject(["webServer"], (c) => c.effect(() => c.webServer.register({
  kind: "prefix", path: "/personal-center",
  handler: async (req, res) => { /* isLoopback 校验 + sendJson */ }
})));
```

- `isLoopback`:检查 `remoteAddress` ∈ `127.0.0.1 / ::1 / ::ffff:127.0.0.1`;
- 读请求体:`for await (const chunk of req)` 累积后 `JSON.parse`(上限 64KB);
- 客户端用 `fetch("/personal-center/...")` 调用(同源)。

## 7. 路径与目录(0.7.0 实测)

> **0.7.0 起用户数据根(DH 数据 home)由 `dsh-home-paths.resolveDshHome` 解析:
> `$DSH_HOME` 环境变量 > `~/.dsh`,所有用户数据都在这一单根下。**
> 旧版(≤0.6.x)数据在 `<AppSupport>/data/dsh/`,0.7.0 升级后该目录是**空壳**——
> 在那里查不到数据不代表丢失,先看 `~/.dsh`(2026-08-22 实测踩坑,险些误判"数据全丢")。

| 项 | 路径(0.7.0) |
|---|---|
| 数据根(home) | `$DSH_HOME` 或 `~/.dsh` |
| 会话日志 | `<home>/sessions/<workspace>/session-<uuid>/session.jsonl.zstd` |
| 用户设置 | `<home>/settings.yaml` |
| profile 配置 | `<home>/profiles/web/`(cordis.patch.yml / package.json / node_modules) |
| 运行时状态 | `<home>/.harness.pid`、`<home>/storages/`、`<home>/.credentials.yaml` |
| 核心依赖(升级被覆盖) | `<AppSupport>/dependencies/dsh/node_modules/**` |

**取 home**:`ctx.get("settings").documentPath` 的 `dirname`(0.7.0 = `~/.dsh`),会话目录 = `join(dirname(documentPath), "sessions")`(本插件 stats 即如此,`dsh-settings-file` 的 `resolveSpec` 与之一致)。

## 8. 生效方式

- **宿主端改动**(`lib/index.js`、路由、命名空间)→ **重启应用**;
- **客户端改动**(`lib/client.js`)→ **刷新页面**;
- 改了 `dependencies/dsh/node_modules/**`(如图标补丁)→ 刷新页面即可,但升级会丢;
- **应用自动升级**会重启 harness 并**重跑插件注册**——升级后务必复查:① 核心补丁(nav-icon)是否被冲掉;② 设置命名空间是否注册成功(见第 12 条,失败时无日志、表现是"设置被清空")。

## 9. 客户端模块与 require 白名单

客户端 `factory(require)` 只认已注入的模块:`"react"`、`"react/jsx-runtime"`、`"@deepseek-ai/cordis"`、`"@deepseek-ai/dsh-client-runtime/client"`、`"@deepseek-ai/dsh-client-ui-primitives"`、`"@deepseek-ai/dsh-client-ui-slots"`、`"@deepseek-ai/dsh-client-web-react"`、`"@deepseek-ai/dsh-client-schema-form"` 等。`require` 一个未注入的模块会抛错。

## 10. 设置分区注册

浏览器端往设置面板加分区:

```js
ctx.slots.inject("settings.section", () => ctx.slots.register({
  name: "settings.section", id: "personal-center", order: 30,
  label: () => t("nav"), inject: () => ({ t })
}, Component));
```

导航图标由 `navIcon(id)` 按 `id` 决定(见第 5 条)。分区内容组件用 `role=tab/tablist/tabpanel` 自绘 tab(参考「插件」分区)。

## 11. 桌面端架构(Tauri + iframe)与宠物边界(实测 2026-08-20)

- DSH 桌面端(`Deepseek Harness Desktop.app`)是 **Tauri 应用**(Rust,Mach-O,非 Electron):顶部导航栏在 Tauri 宿主,主应用跑在 **iframe** 内(`http://127.0.0.1:<port>`,如 3080);
- 宿主 ↔ iframe 通过 postMessage 协议(`dsh-tauri` 插件桥):仅侧边栏/后退/前进命令与状态回报,**无通用消息通道**;
- iframe 与 Tauri 宿主**跨源**(http://127.0.0.1 vs tauri://),iframe 内插件**无法访问父文档**;
- dsh 运行环境**无 Tauri JS API**(无 `@tauri-apps`、无 `window.__TAURI__`)、**无 Electron**;
- **结论:任何插件都无法把元素放到 DSH 应用窗口之外**(如全屏桌面宠物)。要全屏浮层,需 DSH 官方在 Tauri 侧提供透明置顶窗口能力,或另做独立小应用;
- **DSH 客户端无现成 Switch/Toggle 组件**(检索全部 UI 包确认):设置页用分段按钮/自绘控件;自绘开关规范见 DESIGN-SYSTEM §7.2(白色圆钮 `label-primary-foreground` + 品牌蓝轨道,勿用 `label-primary` 做圆钮——浅色下为黑色,在蓝轨道上突兀)。

## 12. 设置命名空间注册:一个失败,整批回滚(0.7.0 实测)

`dsh-settings` 的 `settings.register(ns, schema)` 在同一个 `ctx.inject(["settings"])` 回调里按**同一 fiber** 提交:任一 `register()` 抛错(最常见:存量 section 校验失败),**整批注册全部失效**——其它命名空间也读不到(取值返回默认值),UI 表现"设置被清空"、系统提示词注入静默不生效,且**无任何报错日志**(2026-08-22 实测:custom-instructions / personal-center-pricing / personal-center-pet 三个命名空间因宠物旧值 `enabled: true`(布尔)被 `z.string()` 拒绝而全部消失)。

触发条件:0.7.0 的 schemastery 校验**变严格**(旧版对 `true`→string 宽容或强转),应用升级重启、插件重新注册时才爆雷——存量旧值能一直潜伏到升级。

对策:
- **schema 对历史值宽容**:如 `enabled: z.union([z.string(), z.boolean()])` 兼容旧布尔,显示层仍归一化;
- **逐个注册并隔离失败**:`safeRegister` 包 try/catch + `console.warn`,任一命名空间的脏值只跳过自己,不再连累 `custom-instructions`;
- 升级后若"设置被清空",先核对 `~/.dsh/settings.yaml` 存量值是否与当前 schema 不符。

## 13. 桌面端自动升级与启动失败(0.7.0 实测)

- 桌面端会**自动下载并安装新版**(`<AppSupport>/updates/` 下可见 .dmg),随后自动重启 harness;
- 升级后 profile 依赖可能尚未解析,启动报 `cannot resolve profile bundle "xxx" ... run 'dsh plugin --profile web install'`——桌面端会自动补装(实测 0.6.x→0.7.0 时 dsh-session-kb 反复启动失败后自动恢复);
- **宿主端插件在每次启动时重新注册命名空间**,升级=新核心代码+新校验规则,是存量数据问题集中暴露的时刻(见第 12 条);
- 排查路径:启动失败栈在 `logs/desktop.log`(带 `dsh:` 前缀的 stderr)与 `logs/dsh-web.log`(.1/.2 轮转);`lsof -p <harness pid>` 可确认进程实际打开的 settings.yaml;`~/.dsh/.harness.pid` 记录当前 pid 与端口。

## 14. 第三方注入系统提示词:只有 assemble 事件通道(0.7.0 实测)

**0.7.0 关闭了第三方注册通道**:
- `systemPrompt` 服务被收进 **agent scope**(`dsh-persona` 源码注释:apply ctx 必须是 agent scope context);profile 层插件:
  - `ctx.inject(["systemPrompt", ...])` 回调**永不执行**(provider 从未被调用,实测);
  - `ctx.get("systemPrompt")`(strict)与 `ctx.systemPrompt` 属性访问在 apply 时**抛错** → 插件加载失败 → **阻塞 Harness 启动**(实测两次,勿再使用)。
- 官方 `{{cwd}}`/`{{provider}}` 等 variable 由 agent-loop 在 **agent scope ctx** 注册(`ctx.systemPrompt.variable(...)`,其 ctx = agent 会话 scope),第三方无法照抄。

**唯一可用通道:`system-prompt/assemble` waterfall 事件**(竞品 dsh-prompt-persona 同款,实测生效):

```js
ctx.on("system-prompt/assemble", async (assembly, context, next) => {
  const result = await next();                       // 先走完其它监听器
  // result.sections = [{name, text}, ...](已按 order 排序,无 order 字段)
  // 直接插入/更新自己的 section(写最终文本,勿用 {{变量}} 模板——无变量注册会插值失败)
  // context.agent.session.header.cwd 与官方 {{cwd}} 同源,可做 cwd 匹配
  return result;
});
```

要点:
- **untagged 全局监听器覆盖所有 agent scope**(scopeTarget 放行),profile 层可监听 agent 组装;
- 插入位置:`splice(1, 0, section)`(紧跟第一个身份段之后);空文本直接不插入/移除;
- **失效预案**:监听器内 try/catch + 空值短路,通道失效时自动降级为"不注入",不影响其它功能;
- **风险**:waterfall 事件可能随内核调整再次失效(0.6→0.7 已变过一次);失效后需重新寻找通道或等官方 agent 级插件机制;竞品 dsh-prompt-persona / dsh-forge(运行时注入器)同在验证此通道。
