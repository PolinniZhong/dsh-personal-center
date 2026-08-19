# 设置导航「个人」图标补丁(核心文件,非插件内)

## 背景

DSH 设置面板的导航图标由核心壳插件硬编码(`dsh-client-ui-settings-general` 的
`navIcon(id)`):只有 `models` / `agent-presets` / `plugins` 三个分区有专属图标,
**其余分区一律回退到齿轮图标**——目前没有"插件注册自定义导航图标"的 API。

因此要给「个人」分区换图标,需要在核心壳文件里打一个小补丁(约 20 行)。

## 补丁位置

```
<DSH_HOME>/dependencies/dsh/node_modules/@deepseek-ai/dsh-client-ui-settings-general/lib/client.js
```

即本机:
```
~/Library/Application Support/io.github.hairyf.deepseek-harness-desktop/dependencies/dsh/
  node_modules/@deepseek-ai/dsh-client-ui-settings-general/lib/client.js
```

在 `navIcon(id)` 函数中、齿轮回退 `return ...IconSettingsOutline16` **之前**,插入:

```js
/* dsh-personal-center patch: 个人分区导航图标(用户提供 SVG,currentColor 深浅色自适应) */
if (id === "personal-center") return (0, react_jsx_runtime.jsx)("svg", {
    className: SettingsRoot_module_css_default.navIcon,
    width: 16,
    height: 16,
    viewBox: "0 0 40 40",
    fill: "none",
    children: [(0, react_jsx_runtime.jsx)("path", {
        fillRule: "evenodd",
        clipRule: "evenodd",
        d: "M20 36C28.8366 36 36 28.8366 36 20C36 11.1634 28.8366 4 20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36Z",
        stroke: "currentColor",
        strokeWidth: 3.5,
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }), (0, react_jsx_runtime.jsx)("path", {
        d: "M20 19C22.2091 19 24 17.2091 24 15C24 12.7909 22.2091 11 20 11C17.7909 11 16 12.7909 16 15C16 17.2091 17.7909 19 20 19Z",
        stroke: "currentColor",
        strokeWidth: 3.5,
        strokeLinejoin: "round"
    }), (0, react_jsx_runtime.jsx)("path", {
        d: "M9.5166 31.749C9.77438 27.8405 13.0263 24.75 17.0001 24.75H23.0001C26.9687 24.75 30.2173 27.8323 30.4826 31.7335",
        stroke: "currentColor",
        strokeWidth: 3.5,
        strokeLinecap: "round",
        strokeLinejoin: "round"
    })]
});
```

## 深浅色适配说明

- 图标描边用 **`stroke="currentColor"`**,颜色继承导航项的文字色
  (`--dsw-alias-label-primary`),该令牌在浅色/深色主题下自动切换,
  因此无需为两种模式分别指定色值;
- 原始 SVG 的 `#8A8C93` 已弃用,由 currentColor 接管。

## 注意事项

1. 这是**核心包文件的直接修改**;`dependencies/dsh/` 由桌面应用从
   `hairyf/deepseek-harness-pkg` 发布源**下载**,应用升级(如 rc.6 → rc.7)
   会整树覆盖,**补丁丢失**——需在每次升级后按本文档重打;
2. 重打后**刷新页面**即可生效(客户端 bundle 由 `/plugins` 提供);
3. 验证是否被覆盖:`grep -c "personal-center" <该文件>` 应 ≥ 1;若为 0 说明被覆盖了;
4. 补丁只影响 `personal-center` 一个分区 id,其它分区行为不变;
5. 语法校验:`node --check <该文件>` 应通过。

## 后续(根治)

- 短期:等 DSH 官方为设置分区提供"自定义导航图标"注册机制(如
  `settings.section` 的 `icon` 选项或图标槽位)后,移除本补丁、改为插件内声明;
- 长期:若想让图标随应用升级自动保留,需向 `hairyf/deepseek-harness-pkg`
  发布源提交 patch(与本仓库无关,此处仅记录思路)。
