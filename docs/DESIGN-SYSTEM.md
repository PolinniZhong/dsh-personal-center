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
| 胶囊子 tab | 高 20px;左右内边距 6px;选中 = `interactive-bg-hover` 全圆角背景(去下划线) |

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
- **切换器(每日/每周/累计)**:纯文字、无边框无背景、gap 16、选中 `label-primary` + 500;
- **胶囊子 tab(概览/常用工具/成本)**:高 20px、左右内边距 6px、`border-radius:999px`;选中 = `interactive-bg-hover` 背景 + `label-primary` + 500,未选中空白(与上层下划线 tab 区分);
- **成本编辑器**:每个模型两行 —— 第一行模型名(等宽字体)+ 删除,第二行价格配置(币种下拉 + 未命中/命中/输出 数字框 + 峰谷);模型间 24px、行内 8px;输入框仅描边(`border-l2`)、无填充背景、高 24px、字 12px。

## 6. 深色模式

- 全部 `--dsw-alias-*` 令牌在 `body[data-ds-dark-theme]` 下由设计系统自动重定义,**无需写暗色覆盖**;
- 图标 `currentColor` 继承 `label-primary`,同样自动适配;
- 唯一静态色:文本框聚焦边框 `--dsw-static-neutral-bluish-400`(中性色,深浅皆宜)。

## 7. 桌面宠物 UI 规范(v0.4)

### 7.1 宠物面板(「宠物」tab,极简单卡片)

```
┌──────────────────────────────────────────────────┐
│ [🐳 预览56px] 宠物名 ⓘ               [启用开关]   │
│              今日:Token X · 工具 Y 次 · 缓存 Z%      │
│  [黑鲸完整配置卡]  [蓝鲸完整配置卡](开关互斥) │
└──────────────────────────────────────────────────┘
```

- 卡片容器:`dsh-pc-pet-card`(复用统计卡片范式:12px 圆角、`border-l2`、`bg-layer-3`、内边距 16×18、flex 垂直居中);
- 预览图:56px 圆形裁切(当前情绪静态表情);信息区 flex:1;
- 标题行:14px/600 + ⓘ(16px 圆形小按钮,`interactive-bg-hover` 底 + `label-tertiary`,`cursor:help`);
- **ⓘ 提示 popover**:悬停/聚焦显示,230px、`bg-layer-3` + `border-l2` + 10px 圆角 + 阴影,12px/secondary 文字;用于收纳说明(平时静止/情绪变化动画/逗弄/拖拽/右键);
- 统计行:12px/secondary,`tabular-nums`;
- **宠物列表**:小黑鲸/小蓝鲸**各一张完整配置卡**(预览图 56px 方形(无圆角裁切,动画帧角色位移不产生边框感)+ 标题(宠物名 + ⓘ)+ 今日统计 + 不透明度档位 + 开关),`grid minmax(300px,1fr)` 并排;**开关互斥只能启用一只**;交互只靠开关(卡片无 hover/选中视觉);左边形象图面板打开期间**交替随机动画**(每 10s 轮换一只,启用瞬间播放唤醒动画);未启用卡静态(固定表情 + 占位统计);
- 不透明度档位:三枚小胶囊按钮(11px、`border-l2` 描边透明底;选中 = `interactive-bg-hover` 底 + `label-primary` + 500,去边框);
- **启用开关**:见 7.2;面板无其他设置项(尺寸固定 S、位置随拖拽)。

### 7.2 开关(Toggle)规范

DSH 客户端没有现成 Switch 组件(实测检索),按交互色系自绘:

| 部件 | 规范 |
|---|---|
| 尺寸 | 36 × 20px,圆钮 16px(轨道 2px 边距) |
| 轨道·关 | `--dsw-alias-interactive-bg-hover` |
| 轨道·开 | `--dsw-alias-brand-primary`(品牌主色,与会话库 skb-switch 一致) |
| 圆钮 | `--dsw-alias-label-primary-foreground`(主按钮前景白)+ `box-shadow: 0 1px 2px rgba(0,0,0,.28)`;位移 `translateX(16px)` |
| 交互 | 原生 checkbox 隐藏(absolute/opacity:0),CSS 兄弟选择器驱动轨道/圆钮;200ms ease |

> 不要用 `label-primary` 做圆钮(浅色主题下是黑色,在蓝轨道上突兀——已踩坑)。

### 7.3 宠物浮层(全局)

- `position:fixed`,`z-index:2147483000`(低于模态);拖拽时 2147483647;
- 默认 S 尺寸 = 80×80px 容器;素材 384×384 WebP(object-fit:contain);
- **深色可见性**:`.dsh-pet-img.active` 加 `drop-shadow(0 0 3px rgba(140,190,255,.32))` 冷色描边光(`prefers-color-scheme:dark`);
- 气泡:**毛玻璃**(v0.4.20):半透明 `rgba(255,255,255,.45)`(深色 `rgba(28,30,36,.45)`)+ `backdrop-filter:blur(14px) saturate(1.5)`(-webkit- 前缀)+ 半透明描边 `rgba(255,255,255,.55)`,小尾巴同色;**无 box-shadow**;贴顶翻转(`.below`);容器**不设 overflow:hidden**(否则裁掉小尾巴);
- 拖拽:`.dragging` 暂停动作、`scale(1.06) rotate(-3deg)` 拎起反馈、`touch-action:none`。

### 7.4 动画规范(行为即设计)

| 状态 | 规则 |
|---|---|
| 待机 | **完全静止**(单帧静态表情),无常驻循环动画——不打扰工作(参考 Codex 宠物 idle 行) |
| 情绪切换 | 切换时播放一次对应情绪动画(~2.2s,6 帧 WebP)后回待机;opacity .4s 交叉淡入淡出;3s 防抖 |
| 悬停/点击 | 按当前情绪播放一次动作动画(~2.2s,6 帧 WebP)后回待机 |
| 桌面端浮层待机 | **睡觉(dozing)**(v0.4.19):启动后宠物静止时统一显示打盹表情,动的时候才按情绪播动画(设置面板列表仍显示当前情绪静态图) |
| 动作素材 | `animations/<emo>.webp`(循环);待机素材 `idle/<emo>.webp`(单帧,每张 ~14KB) |
| 无障碍 | `prefers-reduced-motion` 关闭全部动画 |
