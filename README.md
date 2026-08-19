# DSH 个人中心 (dsh-personal-center)

> DeepSeek Harness 的个人中心插件:设置 → **个性化 → 自定义指令**,以及(路线图中)个人使用统计。

一个面向 DeepSeek Harness(DSH)桌面端 / Web 端的本地插件仓库。当前 v0.1 提供 **全局自定义指令**(等价于 ChatGPT / Codex 桌面端的「个性化 → 自定义指令」),并规划了 **个人使用统计**(Token 用量、工具调用、MCP 使用分布)。

---

## ✨ v0.1 功能:全局自定义指令

在 DSH 设置面板新增「**个性化**」分区,内含「自定义指令」多行文本框:

- 输入对你有用的身份 / 工作原则 / 回答偏好,点击**保存**;
- 保存后,**本机所有会话(含已存在的)的下一次请求立即带上这段指令**;
- 支持清空;清空后指令从系统提示词中消失,不占 token;
- 文案中英文双语,样式复用 DSH 设计令牌,与原生设置一致。

实现原理:宿主端注册 `custom-instructions` 设置命名空间,并通过系统提示词变量把文本注入每个请求的 `deployment:persona` 之后的段落(order 10)。见 [docs/DESIGN.md](docs/DESIGN.md)。

## 🛠 安装

### 方式一:插件控制台 / CLI(推荐,适用于发布后)

```sh
dsh plugin --profile web add github:<你的用户名>/dsh-personal-center
```

或打开 Web GUI → 设置 → 插件 → 插件控制台,搜索安装。

### 方式二:本地开发(link 依赖,和 dsh-omi-voice 同款)

1. 克隆本仓库到本地任意目录(例如 `~/DeepSeek Harness Native/03_日常对话/DSH 个人中心`);
2. 在 profile 的 `package.json` 中加入依赖:

   ```json
   "dsh-personal-center": "link:/绝对路径/DSH 个人中心"
   ```

3. 在 profile 的 `dsh.profile.bundles` 列表中加入 `"dsh-personal-center"`;
4. 重启 DSH 应用。

> 注:重启后,若 `node_modules` 中没有该包,可手动建立软链接:
> `ln -s /绝对路径/DSH 个人中心 <DSH_HOME>/profiles/web/node_modules/dsh-personal-center`

### 卸载

设置 → 插件 → 插件控制台,停用 / 删除 `dsh-personal-center`;或删除 `package.json` 中的依赖与 `bundles` 条目。

## 🗺 路线图

| 版本 | 内容 | 状态 |
|---|---|---|
| v0.1 | 个性化 → 自定义指令(全局注入) | ✅ 可用 |
| v0.2 | 个人中心统计面板:今日 / 近 7 天 Token 用量(按模型、按会话)、工具调用 Top、MCP 服务器使用分布 | 🚧 规划中 |
| v0.3 | 用量导出(JSON/CSV)、月度成本估算、聊天回顾(仅统计,不含正文) | 💡 构想 |

## 🤔 为什么做这个(立项评审摘要)

1. **技术可行**:DSH 是插件化架构(宿主插件 + 浏览器 bundle),本仓库即是范例;会话日志(`<DSH_HOME>/data/dsh/sessions/**/session.jsonl.zstd`)记录了每次请求的 token 用量与工具调用事件,`@deepseek-ai/dsh-session-persistence-jsonl` 提供读取能力,MCP 工具以 `mcp__<server>__<tool>` 命名可直接归类。统计所需数据**全部已存在**。
2. **符合用户心理**:
   - **量化反馈**:用户乐于看到"今天用了多少 Token / 工具",类似 GitHub 贡献图、WakaTime、Duolingo 的打卡心理;
   - **成本透明**:DeepSeek 按 Token 计费,"今天烧了多少"是真实痛点;
   - **差异化**:官方桌面端目前没有个人中心/全局统计,插件社区(500+ 插件)证明用户愿意装插件补足官方空白;
   - **隐私友好**:统计只聚合数字、不展示对话正文,天然规避隐私敏感。
3. **风险与对策**:
   - 安装门槛 → 提供 `dsh plugin add github:...` 一键安装与插件控制台安装;
   - 数据准确性 → 统计直接读权威日志,不引入第二份数据源;
   - 性能 → 聚合走宿主端一次性计算 + 缓存,浏览器端只渲染结果。

## 📁 仓库结构

```
DSH 个人中心/
├── package.json        # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml    # 插入插件行
├── lib/
│   ├── index.js        # 宿主:设置命名空间 + 系统提示词注入(未来 + 统计 RPC)
│   └── client.js       # 浏览器:个性化设置分区(未来 + 个人中心面板)
├── docs/DESIGN.md      # 设计文档与统计功能方案
├── README.md
└── LICENSE             # MIT
```

## 📄 许可

[MIT](LICENSE)

## 🙏 致谢

架构参考 [dsh-omi-voice](https://github.com/)(link 依赖 + bundle patch 模式)与 [dsh-plugin-hub](https://github.com/Noob-stupid/dsh-plugin-hub)(插件控制台安装通道)。
