# AGENTS.md — dsh-personal-center 项目记忆(每次会话必读)

> 本文件是**项目级长期记忆**:任何开发/修改前必须通读,遵守其中"已确认需求约定",
> 避免反复返工。修改 UI/交互后必须自查交互是否真实可用(见 §3)。

## 1. 项目概况

- **dsh-personal-center**:DeepSeek Harness 个人中心插件(设置 → 个人):
  个人资料统计 / 成本估算 / 个性化(全局+按工作区+模板库+注入预览)/ 桌面宠物。
- 宿主:`lib/index.js`;客户端:`lib/client.js`(手写 bundle,无 JSX,`react.createElement`)。
- 事实源文档:`docs/个性化指令增强-PRD.md`、`docs/PLATFORM-NOTES.md`、`docs/DESIGN-SYSTEM.md`。

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
6. **工作区路径短显示**「…/名称」,点击路径本身展开;**无独立 expand(点点点)按钮**(路径可点即不重复)。
7. **状态标签清淡**:无胶囊背景;**「当前会话工作区」= 主题色纯文字**;**「已配置」= 中性色**
   (禁用绿色胶囊——与背景难分辨,用户反馈看不清/太突出)。
8. **避免重复控件**(同一区域出现两个相同功能的输入框/按钮 = bug,通常是 key 冲突/发现逻辑问题)。
9. **修改后自查交互是否真实可用**:不只跑语法/冒烟,还要代入用户视角检查"点击是否真的能弹出、
   文本是否真的落到用户能看到的地方";不确定时在回复中说明如何验证。

## 4. 红线(不变)

不改核心依赖 / 纯本地零网络零新依赖 / 未配置工作区时行为与 v0.5.1 一致 /
`custom-instructions` 数据无缝延续 / README+CHANGELOG+PRIVACY 同步 / 版本号按语义化递增。

## 5. 版本状态

- 当前主线 v0.7(个性化指令增强,事件通道注入,已实测生效);v0.8 候选:条件注入、模板导入导出。
- 发布节奏:功能验证通过后提交推送 GitHub(代理 127.0.0.1:7897)+ 更新官方 Discussions #3449。
