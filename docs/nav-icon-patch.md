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
        d: "M20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35Z",
        stroke: "currentColor",
        strokeWidth: 3.5,
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }), (0, react_jsx_runtime.jsx)("path", {
        d: "M20 19.25C22.071 19.25 23.75 17.571 23.75 15.5C23.75 13.4289 22.071 11.75 20 11.75C17.9289 11.75 16.25 13.4289 16.25 15.5C16.25 17.571 17.9289 19.25 20 19.25Z",
        stroke: "currentColor",
        strokeWidth: 3.5,
        strokeLinejoin: "round"
    }), (0, react_jsx_runtime.jsx)("path", {
        d: "M9.5166 30.749C9.77438 26.8405 13.0263 23.75 17.0001 23.75H23.0001C26.9687 23.75 30.2173 26.8323 30.4826 30.7335",
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

1. 这是**核心包文件的直接修改**,DSH 升级(重装依赖)后**会丢失**,需按本文档重打;
2. 补丁只影响 `personal-center` 一个分区 id,其它分区行为不变;
3. 语法校验:`node --check <该文件>` 应通过。

## 后续(根治)

等 DSH 官方为设置分区提供"自定义导航图标"注册机制(如 `settings.section` 的
`icon` 选项或图标槽位)后,应移除本补丁,改为插件内声明,以兼容所有用户。
