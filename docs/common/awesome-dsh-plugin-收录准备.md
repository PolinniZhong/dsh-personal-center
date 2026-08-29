# awesome-dsh-plugin 收录 · 提交准备（只准备，未提交）

| 项 | 内容 |
|---|---|
| 日期 | 2026-08-22 |
| 目标 | 让 dsh-personal-center 进入 awesome-dsh-plugin 精选目录（10k+★，dsh-market 数据源） |
| 状态 | **准备完成，待用户确认后自行提交**（本文档不代为提交） |
| 规则来源 | https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md |

---

## 一、资格核查（全部通过 ✅）

| 硬性条件 | 要求 | 我们 | 结果 |
|---|---|---|---|
| `dsh.bundle` manifest | package.json 声明 `dsh.bundle.patch`（仅 `dsh.client` 会被拒） | ✅ `bundle.patch: ./cordis.patch.yml` + `client` | 通过 |
| `cordis.patch.yml` | 仓库根存在 | ✅ 存在 | 通过 |
| 仓库年龄 | ≥ 1 天 | ✅ 2026-08-19 创建 | 通过 |
| 提交数 | ≥ 10 | ✅ **89 commits** | 通过 |
| 活跃维护 | 未归档/未停更 | ✅ 2026-08-22 有推送 | 通过 |
| `dsh-plugin` topic | 仓库必须加 | ✅ 已有 | 通过 |
| 真实可运行代码 | 非占位/README-only | ✅ | 通过 |
| 描述属实 | 无营销词、与代码一致 | 见下方描述（只写已实现功能） | 待提交时自查 |

## 二、提交内容（YAML，一个插件一个文件）

> 状态更新（2026-08-22）：**v0.5.1 已发布（含会话状态概览）**，且 **npm 已发布**（`dsh-personal-center@0.5.1`，repository 已指回本仓库）——描述可如实写入新功能。

文件路径：`data/plugins/PolinniZhong__dsh-personal-center.yml`

```yaml
url: https://github.com/PolinniZhong/dsh-personal-center
name: PolinniZhong/dsh-personal-center
category: usage
description:
  en: 'Personal center for DeepSeek Harness: cross-session usage statistics, per-model cost estimation, global custom instructions, a data-driven desktop pet, and a conversation status overview, all local and offline.'
  zh: 'DeepSeek Harness 个人中心：跨会话用量统计、按模型成本估算、全局自定义指令、数据驱动的桌面宠物与会话状态概览，纯本地离线运行。'
```

要点：
- `category: usage`（核心是用量统计/成本；不符维护者会改，不会打回）；
- 描述**只写已实现功能**（v0.5.1：统计/成本/自定义指令/宠物/会话状态概览，全部真实可核对）；**不得写未实现的功能**（夸大是主要打回原因）；
- `description.en` 必填且以句号结尾；`zh` 可选（维护者会补，但我们也写上）；
- 含 `: ` 需加引号——已加。

## 三、可选：商店截图（推荐）

在 `data/screenshots.json` 加一条（key = GitHub URL，图片须 GitHub 托管）：

```json
{
  "https://github.com/PolinniZhong/dsh-personal-center": [
    "https://raw.githubusercontent.com/PolinniZhong/dsh-personal-center/main/docs/screenshots/light-profile.png",
    "https://raw.githubusercontent.com/PolinniZhong/dsh-personal-center/main/docs/screenshots/dark-pet.png",
    "https://raw.githubusercontent.com/PolinniZhong/dsh-personal-center/main/docs/screenshots/pet-emotions.gif",
    "https://raw.githubusercontent.com/PolinniZhong/dsh-personal-center/main/docs/screenshots/dark-model-cost.png"
  ]
}
```

（截图已在仓库 `docs/screenshots/` 且被 git 跟踪，URL 可直接用。）

## 四、提交流程（何时提交，按此步骤）

> ⚠️ 以下步骤是"如何提交"的说明——**当前只准备，不执行**。

1. **Fork** https://github.com/awesome-dsh-plugin/awesome-dsh-plugin；
2. 克隆 fork，建分支：`git checkout -b add/personal-center`；
3. 新建 `data/plugins/PolinniZhong__dsh-personal-center.yml`（内容见上）；
4. （可选）在 `data/screenshots.json` 加入截图条目；
5. **重新生成 README**（必须，README 是脚本生成、勿手改）：
   ```sh
   npm ci
   node scripts/generate-readme.mjs
   ```
6. 提交「YAML + 重新生成的 READMEs +（可选）screenshots.json」，push 到 fork；
7. 向 `main` 开 PR（**1 条即可**，上限 3 条）；
8. CI 自动检查：条目数 → dsh.bundle → 仓库年龄/提交数 → awesome-lint + 站点构建；失败按提示改后推同一分支即可；
9. 维护者会读源码核对描述，通过后合并；合并后官网自动重建。

## 五、注意事项

| 项 | 说明 |
|---|---|
| **dsh-market 同步** | **dsh-market（桌面端预置的市场插件）数据源就是 awesome-dsh-plugin** → 收录后自动出现，无需额外提交；**2BingLing/dsh-market** 是独立收集（自带 plugins.json），如需收录走它自己的渠道（可选） |
| **npm 下载量** | 已发布 npm → 市场可显示下载量排序；`repository` 已指回仓库 ✓，**不要**在 YAML 里写 `npm:`（写了会被拒） |
| PR 数量 | 我们只有 1 条，符合"最多 3 条/PR"；**会话库 dsh-session-kb 若要收录，另开一个 PR**（等它发布后） |
| 描述更新 | 后续新功能上线后，**再开 PR 更新描述**（保持与代码一致） |
| 多个插件 | 规则建议"拆分并挑选"，别一次堆；我们按 1 条/PR 走 |

---

> 提交人：用户自行操作（如需我协助核对 CI 报错或调整描述，随时可以）。
