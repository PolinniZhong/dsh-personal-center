# 成本估算 + 每模型缓存命中率 —— 设计方案(v0.3)

> 目标:在「个人资料」里把 Token 用量换算成**成本(钱)**,并展示每个模型的**缓存命中率**。
> 本文只讨论方案,不涉及代码。

## 1. 核心难点

模型价格存在三类变动/差异,决定了"价格输入格式"必须通用:

1. **时间变动**:DeepSeek 于 2026-08-17 调价,涨幅最高 1100%,且引入**峰谷分时计价**(高峰时段价格翻倍)——价格不是常量;
2. **结构差异**:各家分档方式不同(见 §2),但绝大多数都能收敛到"输入/输出 每百万 token";
3. **币种差异**:国内模型(¥)、国外模型($)。

## 2. 各家计价结构调研(2026-08,以官方 API 文档为准)

| 厂商 | 计价维度 | 币种 | 官方文档 |
|---|---|---|---|
| DeepSeek(V4-Flash / V4-Pro) | 输入(缓存命中)、输入(缓存未命中)、输出 × **峰谷分时**(高峰为北京时间 9:00-12:00、14:00-18:00,空闲=高峰一半) | ¥/百万 tokens | [api-docs.deepseek.com/zh-cn/quick_start/pricing](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/) |
| OpenAI(GPT-5.x 等) | 输入、**缓存输入**、输出(推理模型另计推理 token) | $/百万 tokens | [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing) |
| Google Gemini(2.5/3.x) | 输入、输出;**按上下文长度分档**;另有缓存存储价 | $/百万 tokens | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Kimi(Moonshot) | 输入、输出、**缓存优惠** | ¥/百万 tokens | [platform.kimi.com/docs/pricing/chat](https://platform.kimi.com/docs/pricing/chat) |
| 豆包(Doubao-Seed) | 输入、输出 | ¥/百万 tokens | [volcengine.com/product/doubao](https://www.volcengine.com/product/doubao) |
| 千问(Qwen/百炼) | 输入、输出(部分含缓存档) | ¥/百万 tokens | [help.aliyun.com/zh/model-studio/models](https://help.aliyun.com/zh/model-studio/models) |

> 已抓取官方页面原文验证:DeepSeek 价格表(输入命中 0.05-0.15 元/高峰 0.10-0.30、未命中 1.5-4.5/高峰 3.0-9.0、输出 4.5-13.5/高峰 9.0-27.0,单位百万 tokens)、Kimi 官方文档(计费单元=token,含缓存优惠)、千问百炼官方计费页。Gemini/OpenAI 页面为 JS 渲染,以官方 URL 为准。

**结论**:所有主流模型的公共最小结构 = **输入价 + 输出价(每百万 token)**,外加可选的 **缓存命中输入价**;币种 ¥ / $ 两种。峰谷(DeepSeek)、上下文分档(Gemini)是少数模型的特殊维度——设计为**可选扩展**,不影响公共格式。

## 3. 通用价格格式(核心设计)

### 3.1 一个模型一条价格记录(核心 = 4 个数字 + 币种)

```jsonc
{
  "deepseek-official::deepseek-v4-flash": {
    "currency": "cny",              // 币种: cny | usd
    "inputMiss": 1.5,               // 输入-未命中缓存:¥/$ 每百万 token
    "inputHit": 0.05,               // 输入-命中缓存(可选;缺省 = inputMiss)
    "output": 4.5,                  // 输出:每百万 token
    "reasoning": null,              // 可选:推理输出单独价(缺省 = output)
    "peak": null,                   // 可选扩展:峰谷计价(DeepSeek),见 3.4
    "note": "2026-08 官方价,取空闲档" // 可选备注
  }
}
```

### 3.4 峰谷计价(可选扩展,针对 DeepSeek)

DeepSeek 官方为峰谷分时:高峰(北京 9:00-12:00、14:00-18:00)= 空闲×2。日志里**每次请求都有时间戳**,所以可按北京时区逐请求判断峰/谷。格式上只需给可选的第二组价格:

```jsonc
"peak": { "inputMiss": 3.0, "inputHit": 0.1, "output": 9.0 }  // 高峰价
```

- 不填 `peak`:按 `inputMiss/inputHit/output` 统一计;
- 填了 `peak`:凌晨-高峰窗口内请求用 `peak` 价,其余用基础价。

**v1 建议**:先做"单组价 + note 说明"(用户在 DeepSeek 换价/峰谷后改数字即可);`peak` 字段与分时计算列为 v1.1,因它只影响 DeepSeek 一个厂商、且 UI 复杂度翻倍。

### 3.2 成本计算式

```
成本 = inputMiss/1e6 × inputMiss价
     + inputHit/1e6  × inputHit价
     + output/1e6    × output价
     + (可选)reasoning/1e6 × reasoning价
```

- 所用 Token 字段与统计口径一致:`inputTokens`(未命中)、`cacheReadTokens`(命中)、`outputTokens`、`reasoningTokens`;
- 结果四舍五入到两位小数,单位 = 该模型配置的币种。

### 3.3 为什么这个格式"兼容性最强"

| 特殊计价 | 本格式如何覆盖 |
|---|---|
| 缓存命中折扣(DeepSeek/OpenAI/Kimi/Qwen) | `inputHit` 字段直接表达 |
| 峰谷分时(DeepSeek) | v1:填**当前适用档**+`note`;v1.1:可选 `peak` 价组按北京时间逐请求分时计 |
| 上下文分档(Gemini) | 填**标准档(≤200k)**,`note` 说明;不做按长度分档(v1) |
| 推理 token 单独计价(GPT/DeepSeek) | 可选 `reasoning` 字段;不填则并入 output |
| 币种 | `currency` 字段;汇总时**按币种分别合计**,避免汇率歧义 |

> 设计原则:**把"价格"当作用户维护的数据,插件只做乘加**。不内置"自动联网拉价"(价格时效性无法背书、也违背纯本地原则),只提供预设目录 + 修改入口 + "以官方为准"提示。

## 4. 数据存储与接口

- 沿用既有"自有环回路由"模式(避开设置白名单,与 custom-instructions 一致):
  - `GET/POST /personal-center/pricing` 读写价格记录;
  - 落盘:`settings.yaml` 的 `personal-center-pricing` 命名空间(用户数据,可打开配置文件直接编辑);
- 价格记录 key = `provider::model`(与统计的 byModel key 一致,天然对齐);
- 未配置价格的模型:成本列显示 "—",不影响其它统计。

## 5. UI 方案(个人资料)

1. 「概览」tab 的累计数据卡片区加一张 **「估算成本」** 卡(本周/本月/累计,按币种分组显示);
2. 「按模型分布」每行加 **成本列**(该模型配置了价格才显示)+ **每模型缓存命中率** 列(见 §6);
3. 「成本」tab 的「成本估算」编辑器(常显,模型行间距 24px):
   - 每模型一行:模型名 + 币种下拉 + `输入/命中/输出(/推理)` 四个数字框;
   - 底部:**本周 / 本月 / 累计成本汇总**(按币种);
   - **内置预设目录**(下表,来自官方文档,标注"价格随官方变动,以官网为准,可自行修改");
   - 「添加自定义模型」「删除」按钮。

### 5.1 预设目录(2026-08,官方核实)

| 模型 | 币种 | 输入未命中 | 输入命中 | 输出 | 高峰价(可选) | 官方来源 |
|---|---|---|---|---|---|---|
| deepseek-v4-flash | cny | 1.5 | 0.05 | 4.5 | miss 3.0 / hit 0.10 / out 9.0 | [DeepSeek 官方](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/) |
| deepseek-v4-pro | cny | 4.5 | 0.15 | 13.5 | miss 9.0 / hit 0.30 / out 27.0 | 同上 |
| kimi-k2.5 | cny | 4.00 | 0.70 | 21.00 | — | [Kimi 官方](https://platform.kimi.com/docs/pricing/chat-k25.md) |
| gemini-2.5-pro | usd | 1.25 | (同未命中) | 10.00 | — | [Gemini 官方](https://ai.google.dev/gemini-api/docs/pricing) |
| gemini-2.5-flash | usd | 0.30 | (同未命中) | 2.50 | — | 同上 |
| gpt-5 | usd | 1.25 | 0.125 | 10.00 | — | [OpenAI 官方](https://developers.openai.com/api/docs/pricing) |
| gpt-5-mini | usd | 0.25 | 0.025 | 2.00 | — | 同上 |

> 豆包/千问:官方控制台为 JS 渲染、本机未能可靠抓取数值,暂不入预设(用户可在折叠区自行添加;官方入口 [豆包](https://www.volcengine.com/product/doubao)、[千问/百炼](https://help.aliyun.com/zh/model-studio/models))。预设价会过时,务必以官网为准。

## 6. 每模型缓存命中率(顺带,低开销)

- 数据已有:`byModel` 聚合里再累加每个模型的 `input(未命中)` 与 `cacheRead(命中)` 即可;
- 展示:按模型分布每行加 `缓存命中率`(如 `98.4%`),整体命中率卡片已有;
- 价值:直接看出哪个模型缓存收益最大、哪个模型的"输入重复度高"(适合用长上下文缓存)。

## 7. 决策(已确认,2026-08-20)

- [x] a) **币种:分币种分别合计**(不提供汇率换算)——DSH 是全球开源产品,多国用户,避免汇率歧义;
- [x] b) **峰谷:做分时计算**——配置了 `peak` 价组的模型(如 DeepSeek)按北京时间逐请求判断峰/谷计费,不做"只填当前档"的简化;
- [x] c) **预设目录:内置**,但每个默认价必须来自**官方 API 模型与价格文档**(见 §8),标注"价格随官方变动,以官网为准";
- [x] d) **入口:累计数据加「估算成本」卡 + 折叠区详情**;
- [x] e) **展示:本周 / 本月 / 累计**三个数字(去掉"今日"——用户关心的是中长期用量);周=本周一 00:00 起(本地时区),月=本月 1 日起。

> 峰值窗口(北京时间):9:00-12:00、14:00-18:00(空闲=高峰一半,官方定义)。

## 8. 参考来源(官方 API 文档)

- DeepSeek 模型与价格(官方,已抓取验证):https://api-docs.deepseek.com/zh-cn/quick_start/pricing/
- OpenAI API Pricing(官方):https://developers.openai.com/api/docs/pricing
- Google Gemini API Pricing(官方):https://ai.google.dev/gemini-api/docs/pricing
- Kimi API 模型推理价格说明(官方):https://platform.kimi.com/docs/pricing/chat
- 豆包大模型(官方):https://www.volcengine.com/product/doubao
- 千问/阿里云百炼 模型计费(官方):https://help.aliyun.com/zh/model-studio/models
