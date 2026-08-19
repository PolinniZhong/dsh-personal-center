# 设计规范(DESIGN-SYSTEM)

> 「个人」分区的视觉规范,全部取自 DSH 设计系统的实测值(从 `dsh-web-frontend` 与各设置分区组件提取)。改 UI 时遵守,保持与原生一致。

## 0. 铁律

1. **颜色只用 `--dsw-alias-*` 主题令牌**(随 `body[data-ds-dark-theme]` 自动切深浅色);`--dsw-static-*` 仅用于品牌强调色;
2. 图标描边用 `currentColor`(继承导航文字色,深浅色自适应);
3. 图表(热力图/柱状)纯 SVG/CSS 自绘,不引重依赖。

## 1. 字号与字重

| 用途 | 值 |
|---|---|
| 统计大数字 | 20px / 600 |
| 分区标题(个人) | 18px / 600 |
| 导航标题(设置壳) | 16px / 500 |
| 组标题(今日概览/累计/按模型…) | 14px / 500 |
| tab / 正文 / 工具名 | 13px(工具名用等宽字体) |
| 标签 / 描述 / 提供方小字 | 12px |
| 按钮 / 月份标签 / 胶囊 | 11px |

## 2. 间距与留白

| 场景 | 值 |
|---|---|
| 分区根纵向 gap | 12px |
| 模块标题(组)上间距 | 20px(首个 12px) |
| 统计卡片 grid 间距 | 16px |
| 列表(工具/模型)行距 | 10px |
| 卡片内边距 | 14px × 16px |
| tab 栏 → 内容 | 6px |
| 按钮高度 | 24px |

## 3. 圆角

| 组件 | 值 |
|---|---|
| 卡片 / 文本框 | 12px |
| 保存按钮(胶囊) | 12px(全圆) |
| 小按钮(清空) | 6px |
| 热力图格子 | 2px |
| tab | 0(下划线指示) |

## 4. 色值令牌(常用)

| 语义 | 令牌 |
|---|---|
| 主文字 | `--dsw-alias-label-primary` |
| 次要文字 | `--dsw-alias-label-secondary` |
| 弱化文字 | `--dsw-alias-label-tertiary` |
| 边框 | `--dsw-alias-border-l2` |
| 卡片/输入底 | `--dsw-alias-bg-module-platform` / `bg-layer-2/3` |
| 悬浮/选中底 | `--dsw-alias-interactive-bg-hover` / `-active` |
| 主按钮填充 | `--dsw-alias-button-primary-fill` / `-hover` + `label-primary-foreground` |
| 焦点环 | `--dsw-alias-state-business-primary` |
| 热力图蓝色阶 | `--dsw-static-deepseek-100/200/300/400/500`(0 档用 `interactive-bg-hover`) |

## 5. 组件范式

- **设置分区**:`max-width:760px`;标题 18/600 → 描述 12/secondary → tab 栏(border-bottom + 2px 下划线 + gap 22)→ 内容;
- **统计卡片**:grid `minmax(170px,1fr)` + gap 16;label 12/secondary、value 20/600、sub 12/secondary;
- **按钮对**:主按钮胶囊填充、次按钮(清空)6px 圆角 + `interactive-bg-hover` 底、无边框;高 24px、字 11px;
- **切换器(每日/每周/累计)**:纯文字、无边框无背景、gap 16、选中 `label-primary` + 500。

## 6. 深色模式

- 全部 `--dsw-alias-*` 令牌在 `body[data-ds-dark-theme]` 下由设计系统自动重定义,**无需写暗色覆盖**;
- 图标 `currentColor` 继承 `label-primary`,同样自动适配;
- 唯一静态色:文本框聚焦边框 `--dsw-static-neutral-bluish-400`(中性色,深浅皆宜)。
