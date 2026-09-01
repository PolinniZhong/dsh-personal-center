/**
 * dsh-personal-center — 浏览器端。
 *
 * 设置里「个人配置」分区,版式与配色交互完全参考「插件」分区:
 *   顶栏标题「个人配置」→ 描述 → Tab 栏(Token 用量 / 个性化 / 外观 / 宠物)切换内容。
 *
 * ── 模块索引(改代码前先对号入座,勿跨模块改错)─────────────────────────
 * 模块        | 关键组件                     | 类名前缀                     | 数据源
 * Token 用量 | ProfileTab / TokenActivity   | .dsh-pc-profile-*           | /personal-center/stats
 *            | CostEditor(成本子tab)        |                              | /personal-center/pricing
 * 个性化     | PersonalizationTab           | .dsh-pc-pers-*              | /personal-center/instructions 等
 * 外观       | AppearanceTab + 字号引擎     | .dsh-pc-appear-*             | localStorage(uiFont)
 * 宠物       | PetPanel/PetSection          | .dsh-pc-pet-*               | /personal-center/pet
 *            | PetStatusConfig(会话状态卡)  | .dsh-pc-petstatus-*          | ctx.get("sessions")
 *            | PetWidget/PetStatusPanel浮层 | .dsh-pet-* / .dsh-pet-status-* | ctx.get("sessions") + /stats
 * 共享外壳   | PersonalCenterSection/Tab     | .dsh-pc-section/tabs/tab/panel/group/heading/intro/mock
 * ──────────────────────────────────────────────────────────────────────
 * 新增模块请同步:唯一类名前缀 + 上面的索引 + AGENTS.md 模块地图 + docs/SDD.md。
 */
window.__ModuleLoader__.load({
	id: "dsh-personal-center",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		//#region styles(配色/交互参考插件分区:pbvGtq_*)
		const css = "" +
			/* 分区骨架:--dsh-pc-tabs-h=主 Tab 栏高(36px 按钮+1px 底边);
			 * --dsh-pc-gap=主/子 Tab 静止间距(分区 gap 12px+外层 tabpanel padding 6px+内层模块 padding 6px)。
			 * 毛玻璃(与「会话状态/会话概览」弹窗一致):半透明白+backdrop 模糊。
			 * 缝隙遮挡:子 Tab 栏 margin-top:-gap + padding-top:gap,毛玻璃 box 顶从 61→37 上移盖住缝隙;
			 * -24 与 +24 抵消,胶囊位置与下方内容不变,缝隙由子 Tab 栏自带 blur 连续覆盖。 */
			".dsh-pc-section{--dsh-pc-tabs-h:37px;--dsh-pc-gap:24px;--dsh-glass-bg:rgba(255,255,255,.45);--dsh-glass-blur:blur(7px) saturate(.75);--dsh-glass-border:rgba(255,255,255,.55);max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}" +
			"body[data-ds-dark-theme] .dsh-pc-section{--dsh-glass-bg:rgba(28,30,36,.45);--dsh-glass-border:rgba(255,255,255,.14)}" +
			".dsh-pc-heading{margin:0;font-size:18px;font-weight:600}" +
			".dsh-pc-intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}" +
			/* Tab 栏(与插件分区完全一致) */
			".dsh-pc-tabs{border-bottom:1px solid var(--dsh-glass-border);align-items:flex-end;gap:22px;margin-top:2px;display:flex;position:sticky;top:0;z-index:10;background:var(--dsh-glass-bg);-webkit-backdrop-filter:var(--dsh-glass-blur);backdrop-filter:var(--dsh-glass-blur)}" +
			".dsh-pc-tab{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;padding:7px 1px 9px;font-size:13px;line-height:20px;position:relative}" +
			".dsh-pc-tab:hover,.dsh-pc-tab[data-active=true]{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-tab[data-active=true]:after,.dsh-pc-tab:focus-visible:after{background:var(--dsw-alias-label-primary);content:\"\";border-radius:2px 2px 0 0;height:2px;position:absolute;bottom:-1px;left:0;right:0}" +
			".dsh-pc-tab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;color:var(--dsw-alias-label-primary);border-radius:2px}" +
			".dsh-pc-panel{min-width:0;padding-top:6px}" +
			/* 子 tab(胶囊样式:选中淡圆角背景,未选中空白,与上层下划线 tab 区分) */
			".dsh-pc-profile-pill-tabs{display:flex;gap:8px;position:sticky;top:var(--dsh-pc-tabs-h);z-index:9;margin-top:calc(0px - var(--dsh-pc-gap));padding-top:var(--dsh-pc-gap);background:var(--dsh-glass-bg);-webkit-backdrop-filter:var(--dsh-glass-blur);backdrop-filter:var(--dsh-glass-blur);border-bottom:1px solid var(--dsh-glass-border);padding-bottom:8px}" +
			".dsh-pc-profile-pill-tab{border:0;background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-size:13px;line-height:16px;padding:2px 10px;border-radius:999px}" +
			".dsh-pc-profile-pill-tab:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-profile-pill-tab[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:500}" +
			/* 统计卡片 */
			".dsh-pc-group{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:20px 0 10px}" +
			".dsh-pc-panel > .dsh-pc-group:first-of-type{margin-top:12px}" +
			".dsh-pc-profile-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}" +
			".dsh-pc-profile-stat{background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px}" +
			".dsh-pc-profile-stat-label{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			".dsh-pc-profile-stat-value{color:var(--dsw-alias-label-primary);font-size:20px;font-weight:600;line-height:28px;font-variant-numeric:tabular-nums}" +
			".dsh-pc-profile-stat-sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			/* 常用工具列表(无进度条,节省空间) */
			".dsh-pc-profile-tools{display:flex;flex-direction:column;gap:10px}" +
			".dsh-pc-profile-tool-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}" +
			".dsh-pc-profile-tool-name{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}" +
			".dsh-pc-profile-tool-calls{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px;font-variant-numeric:tabular-nums}" +
			/* 按模型分布 */
			".dsh-pc-profile-model{display:flex;flex-direction:column;gap:2px;min-width:0}" +
			".dsh-pc-profile-model-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}" +
			/* 会话回顾 */
			".dsh-pc-profile-session{display:flex;flex-direction:column;gap:2px;min-width:0}" +
			".dsh-pc-profile-session-title{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
			".dsh-pc-profile-session-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}" +
			/* 成本估算编辑器(每个模型 = 两行:名称行 + 价格行) */
			".dsh-pc-profile-cost{display:flex;flex-direction:column;gap:8px;margin-top:2px}" +
			".dsh-pc-profile-cost-model{display:flex;flex-direction:column;gap:8px}" +
			".dsh-pc-profile-cost-model + .dsh-pc-profile-cost-model{margin-top:16px}" +
			".dsh-pc-profile-cost-model-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}" +
			".dsh-pc-profile-cost-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
			".dsh-pc-profile-cost-key{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary);min-width:0;flex:1;word-break:break-all}" +
			".dsh-pc-profile-cost-tier{display:inline-flex;align-items:center;gap:4px;min-width:64px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-profile-cost input[type=number],.dsh-pc-profile-cost select{box-sizing:border-box;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;height:24px;padding:0 6px;font-size:12px;font-family:inherit;outline:none}" +
			".dsh-pc-profile-cost input[type=number]{width:72px}" +
			".dsh-pc-profile-cost input:focus,.dsh-pc-profile-cost select:focus{border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-profile-cost label{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-profile-cost-addrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:16px}" +
			".dsh-pc-profile-cost-addrow input{box-sizing:border-box;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;height:24px;padding:0 8px;font-size:12px;font-family:inherit;outline:none;width:180px}" +
			".dsh-pc-profile-cost-addbtn{margin-left:auto}" +
			".dsh-pc-profile-cost-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}" +
			/* 桌面宠物入口 */
			".dsh-pc-pet-card{display:flex;align-items:center;gap:16px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:16px 18px}" +
			".dsh-pc-pet-preview{width:56px;height:56px;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover);display:flex;align-items:center;justify-content:center;font-size:28px;flex:none}" +
			".dsh-pc-pet-info{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}" +
			".dsh-pc-pet-badge{color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:0 10px;font-size:11px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-pet-opts{display:flex;flex-direction:column;gap:8px;margin-top:20px}" +
			".dsh-pc-pet-opt{display:flex;align-items:center;justify-content:space-between;gap:8px}" +
			".dsh-pc-pet-opt-label{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}" +
			/* Token 活动(每日/每周/累计) */
			".dsh-pc-profile-activity{display:flex;flex-direction:column;gap:8px;margin-top:2px}" +
			".dsh-pc-profile-activity-head{display:flex;align-items:center;justify-content:space-between;gap:12px}" +
			".dsh-pc-profile-activity-title{margin-bottom:0}" +
			".dsh-pc-profile-activity-toggle{display:inline-flex;gap:16px;align-items:center}" +
			".dsh-pc-profile-activity-mode{border:0;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-family:inherit;font-size:12px;line-height:20px;padding:0}" +
			".dsh-pc-profile-activity-mode:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-profile-activity-mode[data-active=true]{color:var(--dsw-alias-label-primary);font-weight:500}" +
			".dsh-pc-profile-heat{display:flex;flex-direction:column;gap:4px;width:100%}" +
			".dsh-pc-profile-heat-grid{display:grid;gap:3px;width:100%}" +
			".dsh-pc-profile-heat-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden}" +
			".dsh-pc-profile-heat-cell{aspect-ratio:1/1;width:100%;border-radius:2px;background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pc-profile-heat-cell[data-level='1']{background:var(--dsw-static-deepseek-100)}" +
			".dsh-pc-profile-heat-cell[data-level='2']{background:var(--dsw-static-deepseek-200)}" +
			".dsh-pc-profile-heat-cell[data-level='3']{background:var(--dsw-static-deepseek-300)}" +
			".dsh-pc-profile-heat-cell[data-level='4']{background:var(--dsw-static-deepseek-400)}" +
			".dsh-pc-profile-heat-cell[data-level='5']{background:var(--dsw-static-deepseek-500)}" +
			".dsh-pc-profile-cum{display:flex;align-items:flex-end;gap:6px;height:90px;margin-top:6px}" +
			".dsh-pc-profile-cum-col{flex:1;display:flex;flex-direction:column;gap:4px;align-items:center;min-width:0}" +
			".dsh-pc-profile-cum-bar{width:100%;border-radius:3px 3px 0 0;background:var(--dsw-static-deepseek-400);min-height:2px}" +
			".dsh-pc-profile-cum-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}" +
			/* 示例数据提示 */
			".dsh-pc-mock{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0 0 2px}" +
			/* 自定义指令(个性化 tab,沿用 v0.1) */
			".dsh-pc-pers-header{display:flex;align-items:center;justify-content:space-between;gap:12px}" +
			".dsh-pc-pers-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:0}" +
			".dsh-pc-pers-hint{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;margin:8px 0 0}" +
			".dsh-pc-pers-textarea{box-sizing:border-box;width:100%;min-height:260px;margin-top:16px;resize:vertical;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:14px;line-height:22px}" +
			".dsh-pc-pers-textarea:focus{outline:none;border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-pers-textarea:disabled{opacity:.6}" +
			".dsh-pc-pers-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end}" +
			".dsh-pc-pers-button{cursor:pointer;border:none;border-radius:6px;height:24px;padding:0 12px;font-size:11px;line-height:18px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center}" +
			".dsh-pc-pers-button:disabled{opacity:.5;cursor:default}" +
			".dsh-pc-pers-primary{border-radius:12px;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}" +
			".dsh-pc-pers-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}" +
			".dsh-pc-pers-primary:disabled{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);opacity:1}" +
			".dsh-pc-pers-secondary{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pers-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}" +
			".dsh-pc-pers-readonly{color:var(--dsw-alias-label-secondary);font-size:13px;margin:0}" +
			/* 个性化指令增强(v0.7):子 tab + 工作区 + 模板库 + 注入预览 */
			".dsh-pc-pers-subtabs{display:flex;gap:2px;position:sticky;top:var(--dsh-pc-tabs-h);z-index:9;margin-top:calc(0px - var(--dsh-pc-gap));padding-top:var(--dsh-pc-gap);background:var(--dsh-glass-bg);-webkit-backdrop-filter:var(--dsh-glass-blur);backdrop-filter:var(--dsh-glass-blur);border-bottom:1px solid var(--dsh-glass-border);padding-bottom:8px}" +
			".dsh-pc-pers-subtab{border:0;background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:12px;line-height:20px;padding:2px 12px;border-radius:999px}" +
			".dsh-pc-pers-subtab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pers-subtab[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}" +
			".dsh-pc-pers-section{display:none}" +
			".dsh-pc-pers-section[data-active=true]{display:block;margin-top:8px}" +
			".dsh-pc-pers-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0 0 10px}" +
			".dsh-pc-pers-textarea{box-sizing:border-box;width:100%;min-height:200px;resize:vertical;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:13px;line-height:20px}" +
			".dsh-pc-pers-textarea:focus{outline:none;border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-pers-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:8px}" +
			".dsh-pc-pers-btn{cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:8px;height:24px;padding:0 12px;font-size:11px;line-height:18px;font-family:inherit;color:var(--dsw-alias-label-primary);display:inline-flex;align-items:center;justify-content:center}" +
			".dsh-pc-pers-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pc-pers-btn:disabled{opacity:.5;cursor:default}" +
			".dsh-pc-pers-btn-primary{background:var(--dsw-alias-button-primary-fill);border-color:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}" +
			".dsh-pc-pers-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}" +
			".dsh-pc-pers-saved{color:var(--dsw-alias-state-success-primary);font-size:11px;line-height:18px;opacity:0;transition:opacity .3s}" +
			".dsh-pc-pers-saved.show{opacity:1}" +
			/* 工作区列表 */
			".dsh-pc-pers-ws{display:flex;flex-direction:column;gap:10px}" +
			/* 工作区条目:无外层描边框(参考全局配置:输入框自带边框 + 下方操作),当前用路径主题色区分 */
			".dsh-pc-pers-ws-item{padding:10px 0}" +
			".dsh-pc-pers-ws-item[data-current=true] .dsh-pc-pers-ws-path{color:var(--dsw-alias-state-business-primary)}" +
			".dsh-pc-pers-ws-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}" +
			".dsh-pc-pers-ws-path{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary);min-width:0;flex:1;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}" +
			".dsh-pc-pers-ws-path:hover{color:var(--dsw-alias-state-business-primary)}" +
			/* 状态标签:无胶囊背景、清淡;当前工作区 = 主题色文字,已配置 = 中性色 */
			".dsh-pc-pers-ws-tag{font-size:10.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;margin-left:4px}" +
			".dsh-pc-pers-ws-tag[data-current=true]{color:var(--dsw-alias-state-business-primary);font-weight:600}" +
			".dsh-pc-pers-ws-tag[data-configured=true]{color:var(--dsw-alias-label-secondary)}" +
			".dsh-pc-pers-ws textarea{box-sizing:border-box;width:100%;min-height:56px;resize:vertical;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:12.5px;line-height:18px}" +
			".dsh-pc-pers-ws textarea:focus{outline:none;border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-pers-ws-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px}" +
			/* 指令应用示例(内联在操作行左侧,点击展开紧凑预览) */
			".dsh-pc-pers-preview-tag{border:0;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-family:inherit;font-size:11px;line-height:18px;padding:0;margin-right:auto;display:inline-flex;align-items:center;gap:3px}" +
			".dsh-pc-pers-preview-tag:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pers-preview-tag svg{flex:none}" +
			".dsh-pc-pers-preview-inline{border-top:1px solid var(--dsw-alias-border-l2);margin-top:8px;padding-top:8px}" +
			".dsh-pc-pers-preview-title{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-bottom:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
			".dsh-pc-pers-preview-tokens{margin-left:auto;color:var(--dsw-alias-label-tertiary)}" +
			".dsh-pc-pers-preview-box{font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.6;white-space:pre-wrap;color:var(--dsw-alias-label-secondary);max-height:80px;overflow-y:auto;margin-bottom:4px}" +
			".dsh-pc-pers-preview-empty{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;margin-bottom:4px}" +
			".dsh-pc-pers-preview-ws{font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.6;white-space:pre-wrap;color:var(--dsw-alias-state-business-primary);max-height:80px;overflow-y:auto}" +
			/* 工作区选择器:点击即下拉(自定义,替代 datalist);箭头内嵌输入框右端 */
			".dsh-pc-pers-ws-picker{position:relative;margin-top:12px;min-width:0}" +
			".dsh-pc-pers-ws-picker input{box-sizing:border-box;width:100%;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;height:28px;padding:0 30px 0 10px;font-size:12px;font-family:inherit;outline:none}" +
			".dsh-pc-pers-ws-picker input:focus{border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-pers-ws-caret{position:absolute;top:50%;right:6px;transform:translateY(-50%);border:0;background:none;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:4px;display:inline-flex;align-items:center;justify-content:center}" +
			".dsh-pc-pers-ws-caret:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pers-ws-menu{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:50;background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;max-height:200px;overflow-y:auto;box-shadow:var(--dsw-shadow-lv3);padding:4px}" +
			".dsh-pc-pers-ws-opt{display:block;width:100%;text-align:left;background:none;border:none;cursor:pointer;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:7px 8px;border-radius:6px;word-break:break-all}" +
			".dsh-pc-pers-ws-opt:hover{background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pc-pers-ws-pick{display:flex;gap:6px;align-items:center;flex-wrap:wrap}" +
			".dsh-pc-pers-empty{padding:14px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px}" +
			/* 模板库:每个模板一个独立描边框(像绘画库,一眼区分) */
			".dsh-pc-pers-tpl-list{display:flex;flex-direction:column}" +
			".dsh-pc-pers-tpl-row{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;align-items:center;gap:10px;padding:12px 14px;display:flex;margin-bottom:8px}" +
			".dsh-pc-pers-tpl-row:last-child{margin-bottom:0}" +
			".dsh-pc-pers-tpl-row-text{flex-direction:column;flex:1;gap:3px;min-width:0;display:flex}" +
			".dsh-pc-pers-tpl-row-head{display:flex;align-items:center;gap:6px}" +
			".dsh-pc-pers-tpl-row-name{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}" +
			".dsh-pc-pers-tpl-row-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}" +
			".dsh-pc-pers-tpl-row-actions{display:flex;gap:6px;align-items:center;flex:none}" +
			".dsh-pc-pers-tpl-badge{font-size:10px;padding:0 6px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary)}" +
			".dsh-pc-pers-tpl-text{display:none;font-size:11.5px;color:var(--dsw-alias-label-secondary);line-height:1.6;white-space:pre-wrap;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px 10px;max-height:96px;overflow-y:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}" +
			".dsh-pc-pers-tpl-text[data-open=true]{display:block;margin-top:4px}" +
			".dsh-pc-pers-tpl-save{display:flex;gap:8px;align-items:center;margin-top:14px;flex-wrap:wrap}" +
			".dsh-pc-pers-tpl-save input{box-sizing:border-box;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;height:26px;padding:0 10px;font-size:12px;font-family:inherit;outline:none;min-width:140px}" +
			".dsh-pc-pers-tpl-save input:focus{border-color:var(--dsw-static-neutral-bluish-400)}" +
			/* 注入预览(与上层输入框一致的描边;默认只显示工作区指令,全局折叠) */
			".dsh-pc-pers-preview{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;margin-top:14px;background:transparent}" +
			".dsh-pc-pers-preview-title{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-bottom:5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
			".dsh-pc-pers-preview-title b{color:var(--dsw-alias-state-business-primary);font-weight:600}" +
			".dsh-pc-pers-preview-tokens{margin-left:auto;color:var(--dsw-alias-label-tertiary)}" +
			".dsh-pc-pers-preview-box{font-size:11.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.6;white-space:pre-wrap;color:var(--dsw-alias-label-secondary);max-height:64px;overflow-y:auto;margin-bottom:6px}" +
			".dsh-pc-pers-preview-empty{color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:18px;margin-bottom:6px}" +
			".dsh-pc-pers-preview-toggle{border:0;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-family:inherit;font-size:11px;line-height:18px;padding:0;margin-bottom:4px}" +
			".dsh-pc-pers-preview-toggle:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pers-preview-global{font-size:11.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.6;white-space:pre-wrap;color:var(--dsw-alias-label-tertiary);max-height:110px;overflow-y:auto;border-top:1px solid var(--dsw-alias-border-l2);padding-top:6px;margin-bottom:6px}" +
			".dsh-pc-pers-preview-note{font-size:11px;color:var(--dsw-alias-label-tertiary);margin:0}" +
			/* 桌面宠物:全局浮层(纯 DOM,素材为宿主托管的动画 WebP) */
			".dsh-pet-container{position:fixed;z-index:2147483000;width:120px;height:120px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;transition:opacity .3s ease}" +
			".dsh-pet-container.dragging{cursor:grabbing;z-index:2147483647}" +
			".dsh-pet-container.hidden{opacity:0;pointer-events:none}" +
			".dsh-pet-wrapper{width:100%;height:100%;position:relative}" +
			".dsh-pet-img{width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;opacity:0;transition:opacity .4s ease;pointer-events:none;-webkit-user-drag:none}" +
			".dsh-pet-img.active{opacity:1;filter:drop-shadow(0 4px 12px rgba(0,0,0,.05)) drop-shadow(0 0 2px rgba(255,255,255,.03))}" +
			/* 常驻显示,平时静止:无常驻循环动画(参考 Codex 宠物规范:待机不打扰,情绪变化/逗弄时才播放动画) */
			".dsh-pet-container.dragging,.dsh-pet-container.dragging .dsh-pet-wrapper{animation:none!important}" +
			".dsh-pet-container.dragging .dsh-pet-wrapper{transform:scale(1.06) rotate(-3deg);transition:transform .15s ease}" +
			".dsh-pet-container.clicked .dsh-pet-wrapper{animation:dsh-pet-click-bounce .3s cubic-bezier(.34,1.56,.64,1)}" +
			"@keyframes dsh-pet-click-bounce{0%{transform:scale(1)}40%{transform:scale(.9)}70%{transform:scale(1.05)}100%{transform:scale(1)}}" +
			/* 数据气泡:毛玻璃(半透明 + 背景模糊,参考 Codex/苹果;深浅主题各一套);靠右对齐宠物(视觉与菜单/按钮统一) */
			".dsh-pet-bubble{position:absolute;bottom:calc(100% + 12px);right:0;transform:translateY(8px);background:rgba(255,255,255,.45);-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);color:var(--dsw-alias-label-primary);border:1px solid rgba(255,255,255,.55);padding:10px 16px;border-radius:16px;font-size:13px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;max-width:min(280px,60vw)}" +
			".dsh-pet-bubble.visible{opacity:1;transform:translateY(0)}" +
			".dsh-pet-bubble::after{content:\"\";position:absolute;top:100%;right:24px;transform:translateX(0);border:6px solid transparent;border-top-color:rgba(255,255,255,.45)}" +
			".dsh-pet-bubble.below{bottom:auto;top:calc(100% + 12px)}" +
			".dsh-pet-bubble.below::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:rgba(255,255,255,.45)}" +
			/* 深色主题毛玻璃 */
			"body[data-ds-dark-theme] .dsh-pet-bubble{background:rgba(28,30,36,.45);border-color:rgba(255,255,255,.14)}" +
			"body[data-ds-dark-theme] .dsh-pet-bubble::after{border-top-color:rgba(28,30,36,.45)}" +
			"body[data-ds-dark-theme] .dsh-pet-bubble.below::after{border-bottom-color:rgba(28,30,36,.45)}" +
			".dsh-pet-container.size-small{width:80px;height:80px}" +
			".dsh-pet-container.size-medium{width:120px;height:120px}" +
			".dsh-pet-container.size-large{width:160px;height:160px}" +
			/* 右上角「会话状态」入口按钮:悬停宠物才显示,点它展开状态面板(在宠物区域内,鼠标移向它不会消失) */
			".dsh-pet-status-btn{position:absolute;top:-2px;right:-2px;z-index:3;display:none;align-items:center;justify-content:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;line-height:16px;white-space:nowrap;cursor:pointer;background:rgba(255,255,255,.5);-webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4);color:var(--dsw-alias-label-primary);border:1px solid rgba(255,255,255,.55)}" +
			"body[data-ds-dark-theme] .dsh-pet-status-btn{background:rgba(28,30,36,.55);border-color:rgba(255,255,255,.16)}" +
			".dsh-pet-status-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pet-container:hover .dsh-pet-status-btn{display:inline-flex}" +
			".dsh-pet-container.pet-status-off .dsh-pet-status-btn{display:none}" +
			/* 深色主题:黑鲸加柔和冷色描边光,避免融入背景(P1) */
			"@media (prefers-color-scheme:dark){.dsh-pet-img.active{filter:drop-shadow(0 4px 12px rgba(0,0,0,.07)) drop-shadow(0 0 3px rgba(140,190,255,.06))}}" +
			/* 右键快捷菜单(毛玻璃,与数据气泡/状态面板同款;深浅各一套) */
			".dsh-pet-menu{position:fixed;z-index:2147483646;background:rgba(255,255,255,.45);-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);border:1px solid rgba(255,255,255,.55);border-radius:16px;padding:2px;width:fit-content;box-shadow:0 8px 24px rgba(0,0,0,.08);display:none}" +
			"body[data-ds-dark-theme] .dsh-pet-menu{background:rgba(28,30,36,.45);border-color:rgba(255,255,255,.14)}" +
			".dsh-pet-menu.open{display:block}" +
			".dsh-pet-menu-item{display:flex;align-items:center;justify-content:center;text-align:center;padding:6px 10px;border-radius:10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap}" +
			".dsh-pet-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pet-menu-item .dsh-pet-menu-sizes{display:inline-flex;gap:4px}" +
			".dsh-pet-menu-item .dsh-pet-menu-size{min-width:22px;text-align:center;padding:1px 6px;border-radius:6px;color:var(--dsw-alias-label-secondary)}" +
			".dsh-pet-menu-item .dsh-pet-menu-size[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:500}" +
			"@media (prefers-reduced-motion:reduce){.dsh-pet-container,.dsh-pet-wrapper{animation:none!important}.dsh-pet-img{transition:none}}" +
			/* 宠物配置面板 */
			/* 预览图:无背景、无圆角裁切(动画帧角色会位移/缩放,圆形裁剪会产生"边框"感);透明区与卡片底色融合 */
			".dsh-pc-pet-preview-img{width:56px;height:56px;object-fit:contain;flex:none}" +
			".dsh-pc-pet-toggle{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;cursor:pointer}" +
			".dsh-pc-pet-toggle input{accent-color:var(--dsw-static-deepseek-400);width:14px;height:14px}" +
			".dsh-pc-pet-range{width:140px;accent-color:var(--dsw-static-deepseek-400)}" +
			".dsh-pc-pet-emotion{display:flex;align-items:center;gap:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:12px 14px;margin-top:14px}" +
			".dsh-pc-pet-emotion-img{width:48px;height:48px;border-radius:50%;object-fit:contain;background:var(--dsw-alias-interactive-bg-hover);flex:none}" +
			".dsh-pc-pet-emotion-name{font-size:14px;font-weight:500;line-height:22px;color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pet-emotion-sub{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);margin:0}" +
			".dsh-pc-pet-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:8px 0 0}" +
			".dsh-pc-pet-thresholds{display:flex;flex-direction:column;gap:4px;margin-top:4px}" +
			".dsh-pc-pet-threshold{display:flex;justify-content:space-between;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}" +
			".dsh-pc-pet-threshold b{font-weight:500;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}" +
			/* 极简面板:卡片标题行 + 提示 popover + 统计 + 不透明度档位 + 今日情绪气泡 + 开关 */
			".dsh-pc-pet-title-row{display:flex;align-items:center;gap:6px}" +
			".dsh-pc-pet-title{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary);margin:0}" +
			".dsh-pc-pet-tip{position:relative;display:inline-flex;align-items:center}" +
			".dsh-pc-pet-tip-btn{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);cursor:help;background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pc-pet-tip-pop{position:absolute;left:0;top:calc(100% + 6px);width:230px;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:8px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);z-index:20;display:none;white-space:normal}" +
			".dsh-pc-pet-tip:hover .dsh-pc-pet-tip-pop,.dsh-pc-pet-tip:focus-within .dsh-pc-pet-tip-pop{display:block}" +
			".dsh-pc-pet-stats{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);margin:0;font-variant-numeric:tabular-nums}" +
			".dsh-pc-pet-sub{display:flex;align-items:center;gap:6px;margin-top:6px}" +
			".dsh-pc-pet-sub-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}" +
			/* 宠物列表:黑鲸/蓝鲸各一张完整配置卡,并排;启用状态只由开关表达,卡片无选中/hover 反馈(符合 DSH 规范) */
			".dsh-pc-pet-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}" +
			/* 外观卡(带边框:标题+步进器一行,说明在下) */
			".dsh-pc-appear-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;margin-bottom:16px}" +
			".dsh-pc-appear-row{display:flex;align-items:center;justify-content:space-between;gap:12px}" +
			".dsh-pc-appear-title{margin:0;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:20px}" +
			/* 宠物·会话状态卡(带边框:标题+说明在左、开关在右,整卡垂直居中) */
			".dsh-pc-petstatus-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;margin-bottom:16px}" +
			".dsh-pc-petstatus-flex{display:flex;align-items:center;gap:16px}" +
			".dsh-pc-petstatus-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}" +
			".dsh-pc-petstatus-title{margin:0;color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:20px}" +
			".dsh-pc-petstatus-desc{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			".dsh-pc-pet-opacity-btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;line-height:16px;cursor:pointer;font-family:inherit}" +
			".dsh-pc-pet-opacity-btn:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pet-opacity-btn.active{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:500;border-color:transparent}" +
			".dsh-pc-pet-emo-bubble{display:flex;align-items:center;gap:6px;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:3px 10px 3px 3px;flex:none}" +
			".dsh-pc-pet-emo-img{width:24px;height:24px;border-radius:50%;object-fit:contain;background:var(--dsw-alias-interactive-bg-hover);flex:none}" +
			".dsh-pc-pet-emo-name{font-size:12px;line-height:16px;color:var(--dsw-alias-label-primary);white-space:nowrap}" +
			".dsh-pc-pet-switch{position:relative;width:36px;height:20px;flex:none;align-self:center;cursor:pointer}" +
			".dsh-pc-pet-switch input{position:absolute;opacity:0;width:0;height:0}" +
			/* 开关视觉与会话库一致:启用态=品牌主色(brand-primary)轨道+白色圆钮,关闭态=浅灰轨道(参考 skb-switch) */
			".dsh-pc-pet-switch-track{position:absolute;inset:0;background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;transition:background .2s ease}" +
			".dsh-pc-pet-switch-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);box-shadow:0 1px 2px rgba(0,0,0,.28);transition:transform .2s ease}" +
			".dsh-pc-pet-switch input:checked ~ .dsh-pc-pet-switch-track{background:var(--dsw-alias-brand-primary)}" +
			".dsh-pc-pet-switch input:checked ~ .dsh-pc-pet-switch-thumb{transform:translateX(16px)}" +
			".dsh-pc-pet-switch input:disabled{cursor:not-allowed}" +
			".dsh-pc-pet-switch input:disabled ~ .dsh-pc-pet-switch-track{background:var(--dsw-alias-interactive-bg-hover);opacity:.5}" +
			".dsh-pc-pet-switch input:disabled ~ .dsh-pc-pet-switch-thumb{opacity:.5}" +
			".dsh-pc-pet-custom{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;margin:4px 0 0}" +
			/* 宠物状态概览:毛玻璃浮层(复用气泡配方),锚定宠物上方/下方,懒挂载;投影减半 */
			".dsh-pet-status{position:fixed;z-index:2147483001;width:256px;max-width:calc(100vw - 24px);background:rgba(255,255,255,.45);-webkit-backdrop-filter:blur(7px) saturate(.75);backdrop-filter:blur(7px) saturate(.75);color:var(--dsw-alias-label-primary);border:1px solid rgba(255,255,255,.55);border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,.04);overflow:hidden;display:none}" +
			"body[data-ds-dark-theme] .dsh-pet-status{background:rgba(28,30,36,.45);border-color:rgba(255,255,255,.14)}" +
			".dsh-pet-status.open{display:block;animation:dsh-pet-status-pop .18s ease}" +
			"@keyframes dsh-pet-status-pop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}" +
			".dsh-pet-status-head{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.35);font-size:14px;font-weight:500;line-height:20px}" +
			"body[data-ds-dark-theme] .dsh-pet-status-head{border-bottom-color:rgba(255,255,255,.1)}" +
			".dsh-pet-status-head .dsh-pet-status-title{flex:1;min-width:0}" +
			".dsh-pet-status-sum{display:flex;align-items:center;gap:12px;margin-left:auto;flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}" +
			".dsh-pet-status-sum b{margin-left:3px;font-size:11px;font-weight:600;line-height:16px;font-variant-numeric:tabular-nums}" +
			".dsh-pet-status-sum .running b{color:var(--dsw-alias-state-business-primary)}" +
			".dsh-pet-status-sum .failed b{color:var(--dsw-alias-state-error-primary)}" +
			".dsh-pet-status-sum .done b{color:var(--dsw-alias-state-success-primary)}" +
			".dsh-pet-status-list{box-sizing:border-box;max-height:178px;overflow-y:auto;padding:6px 10px 12px}" +
			".dsh-pet-status-item{display:flex;align-items:center;gap:8px;padding:7px 8px;height:32px;box-sizing:border-box;border-radius:8px;font-size:12px;line-height:18px;cursor:pointer}" +
			".dsh-pet-status-item:hover{background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pet-status-dot{width:8px;height:8px;border-radius:50%;flex:none}" +
			".dsh-pet-status-name{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary)}" +
			".dsh-pet-status-action{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}" +
			".dsh-pet-status-st{flex:none;font-size:11px;line-height:16px;padding:1px 8px;border-radius:9px}" +
			".dsh-pet-status-st.running{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}" +
			".dsh-pet-status-st.failed{background:var(--dsw-alias-state-error-secondary);color:var(--dsw-alias-state-error-primary)}" +
			".dsh-pet-status-st.done{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}" +
			".dsh-pet-status-st.idle{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary)}" +
			".dsh-pet-status-empty{padding:18px 16px 20px;text-align:center;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}" +
			"@media (prefers-reduced-motion:reduce){.dsh-pet-status.open{animation:none}}" +
			/* 外观-字号卡片(参考会话状态卡:左侧标题+描述竖排、右侧控件,整行垂直居中 → 控件相对整卡居中) */
			".dsh-pc-appear-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}" +
			".dsh-pc-appear-ctl{display:flex;align-items:center;gap:6px;flex:none}" +
			".dsh-pc-appear-desc{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			/* 一个整体控件:左侧数字输入 + 右侧上下箭头(共享同一边框盒)。
			   box-sizing:border-box 使 height:28px 含边框 → 总高 28px(比原 20px 加高 8px),
			   行内 align-items:center 与标题垂直居中;数字用 line-height 与内容区一致,严格居中 */
			".dsh-pc-appear-font-step{display:flex;align-items:center;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:8px;height:28px;overflow:hidden}" +
			".dsh-pc-appear-font-step:focus-within{border-color:var(--dsw-alias-state-business-primary)}" +
			".dsh-pc-appear-font-input{box-sizing:border-box;width:52px;height:100%;line-height:26px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;text-align:center;padding:0;outline:none;-webkit-appearance:none;-moz-appearance:textfield;appearance:textfield}" +
			".dsh-pc-appear-font-input::-webkit-inner-spin-button,.dsh-pc-appear-font-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}" +
			/* 右侧箭头列垂直铺满控件高度,每个按钮各占一半、内部居中(解决堆上方) */
			".dsh-pc-appear-font-arrows{display:flex;flex-direction:column;align-self:stretch;width:20px;border-left:1px solid var(--dsw-alias-border-l2);flex:none}" +
			".dsh-pc-appear-font-arrow{display:flex;align-items:center;justify-content:center;flex:1;border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;font-size:8px;line-height:1;padding:0}" +
			".dsh-pc-appear-font-arrow:first-child{border-bottom:1px solid var(--dsw-alias-border-l2)}" +
			".dsh-pc-appear-font-arrow:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-appear-font-arrow:disabled{opacity:.35;cursor:default}" +
			".dsh-pc-appear-font-unit{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}";
		const tagId = "dsh-personal-center/styles";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-personal-center";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region copy
		const LOCALE_NS = "dsh-personal-center";
		const dictionaries = {
			zh: {
				"nav": "个人配置",
				"heading": "个人配置",
				"intro": "管理你的 Token 用量、个性化与桌面宠物。",
				"tabProfile": "Token 用量",
				"tabPersonalization": "个性化",
				"tabAppearance": "外观",
				"appearanceTitle": "字号大小",
				"appearanceDesc": "调整整界面使用的基础字号，全局生效；改动即时预览。",
				"appearanceUnit": "px",
				"appearanceMin": "最小",
				"appearanceMax": "最大",
				"subOverview": "概览",
				"subActivity": "活动",
				"subModels": "模型",
				"subSessions": "会话",
				"subTools": "回顾",
				"subCost": "模型成本",
				"subPet": "宠物",
				"petTitle": "桌面宠物",
				"petComing": "设计中 · 即将到来",
				"petDesc": "一只由你的真实用量驱动的浮游宠物:忙碌时冒汗、省钱时开心、点击它会说出今日数据。方案见 docs/pet/DESKTOP-PET.md。",
				"petEnable": "启用宠物",
				"petSkin": "皮肤",
				"petSkinBlack": "黑鲸",
				"petSkinBlue": "蓝鲸",
				"petNameBlack": "圆滚滚小黑鲸",
				"petNameBlue": "圆滚滚小蓝鲸",
				"petPosition": "位置",
				"petDev": "开发中",
				"petSize": "尺寸",
				"petOpacity": "不透明度",
				"petPosBr": "右下",
				"petPosBl": "左下",
				"petPosTr": "右上",
				"petPosTl": "左上",
				"petMenuSize": "尺寸",
				"petMenuHide": "隐藏宠物",
				"petMenuSizeSmall": "小",
				"petMenuSizeMedium": "中",
				"petMenuSizeLarge": "大",
				"petPosCustom": "已拖拽到自定义位置",
				"petResetPos": "重置到右下角",
				"petIdleHint": "平时静止不打扰;情绪变化时会播放对应动画;鼠标悬停或点击也会做个小动作。拖住它可以移动到任意位置。",
				"petTip": "常驻显示,平时静止不打扰;情绪变化时会播放对应动画。鼠标悬停或点击也会做个小动作;拖住它可以移动到任意位置;右键可隐藏宠物。",
				"petServiceDown": "宠物服务未就绪:请重启应用使宿主改动生效,再刷新本页。",
				"petStatusOn": "已启用",
				"petStatusOff": "未启用",
				"petSaved": "已保存",
				"petRestartHint": "宠物配置与动画素材由宿主端环回路由提供:首次启用前需重启应用使宿主改动生效,之后改动刷新页面即可。",
				"petNoPriceHint": "未配置模型价格(设置 → 个人配置 → 模型成本),今日成本为空,「钱包痛」不会触发。",
				"petToday": "今日情绪",
				"petTodayStats": "今日:Token {tokens} · 工具 {tools} 次 · 缓存 {rate}",
				"petThresholdsTitle": "情绪阈值(内置,基于本机数据校准)",
				"petThresholdHappy": "开心:缓存命中率 ≥ {v}",
				"petThresholdBusy": "忙碌:今日工具调用 ≥ {v} 次",
				"petThresholdExhausted": "疲惫:今日 Token ≥ {v}",
				"petThresholdMoneyPain": "钱包痛:今日成本 ≥ ¥{v}(需已配置价格)",
				"petThresholdDozing": "打盹:无活动 ≥ {v} 分钟",
				"petEmotionHappy": "开心",
				"petEmotionBusy": "忙碌",
				"petEmotionExhausted": "疲惫",
				"petEmotionMoneyPain": "钱包痛",
				"petEmotionDozing": "打盹",
				"petEmotionThinking": "思考中",
				"petEmotionWaiting": "等你回复",
				"petEmotionCelebrate": "庆祝",
				"petBubbleTokens": "今天用了 {tokens} Tokens",
				"petBubbleCache": "缓存命中 {rate}%，省了一笔！",
				"petBubbleTools": "你今天最常用的工具是 {tool}",
				"petBubbleCost": "今日花费 ¥{cost}",
				"petBubbleCostUsd": "今日花费 ${cost}",
				"petBubbleIdle": "今天还没开始干活呢～",
				"petBubbleLoading": "正在加载数据…",
				"petStatusTitle": "会话概览",
				"petStatusBtn": "会话状态",
				"petSubMain": "宠物",
				"petSubStatus": "会话状态",
				"petStatusLabel": "在宠物上启用会话状态",
				"petStatusDesc": "在宠物上显示会话状态概览(进行中 / 失败 / 完成),并据此实时驱动宠物情绪。",
				"petStatusNeedPet": "需先启用宠物",
				"petStatusOpenHint": "双击进入该会话",
				"petStatusRunning": "运行中",
				"petStatusFailed": "失败",
				"petStatusDone": "已完成",
				"petStatusReady": "就绪",
				"petStatusIdle": "待机",
				"petStatusSumRunning": "进行中",
				"petStatusSumFailed": "失败",
				"petStatusSumDone": "完成",
				"petStatusEmpty": "暂无会话",
				"petStatusActionRead": "正在读取 {file}",
				"petStatusActionWrite": "正在写入 {file}",
				"petStatusActionEdit": "正在编辑 {file}",
				"petStatusActionBash": "正在执行命令 {cmd}…",
				"petStatusActionSearch": "正在搜索",
				"petStatusActionUnknown": "正在调用 {tool}",
				"petStatusBubbleFail": "{n} 个对话失败 · {m} 个进行中",
				"petStatusBubbleRun": "{m} 个对话进行中",
				"petStatusBubbleDone": "全部完成",
				"mockHint": "示例数据 · 统计服务接入后显示真实用量。",
				"loadingHint": "正在统计…",
				"errorHint": "统计加载失败,请确认已重启应用使统计服务生效。",
				"retry": "重试",
				"todayTitle": "今日概览",
				"totalTitle": "累计数据",
				"tokens": "Token 消耗",
				"sessions": "会话",
				"toolCalls": "工具调用",
				"totalTokens": "累计 Token",
				"longestChat": "最长聊天时长",
				"totalSessions": "会话总数",
				"cacheRate": "缓存命中率",
				"estCost": "估算成本",
				"costWeek": "本周",
				"costMonth": "本月",
				"costNotConfigured": "未配置价格",
				"costEditorTitle": "成本估算",
				"costHint": "价格为每百万 token 单价(单位:币种)。峰谷=高峰时段(北京 9-12、14-18)另计价。预设价来自官方文档,可能过时,请以官网为准。",
				"costPreset": "应用官方预设",
				"costAdd": "添加",
				"costSave": "保存价格",
				"costSaved": "已保存",
				"costDelete": "删除",
				"costPeak": "高峰",
				"costOffpeak": "闲时",
				"costCurrency": "币种",
				"costCurCny": "¥",
				"costCurUsd": "$",
				"costInputMiss": "未命中",
				"costInputHit": "命中",
				"costOutput": "输出",
				"costReasoning": "推理",
				"costProvider": "提供方",
				"costModel": "模型名",
				"costNoModels": "暂无模型,可添加或应用预设。",
				"topTools": "常用工具",
				"statToday": "今日",
				"numYi": "亿",
				"numWan": "万",
				"tplDefaultName": "自定义指令",
				"byModelTitle": "按模型分布",
				"sessionsTitle": "会话回顾",
				"cacheShort": "缓存",
				"unnamed": "未命名会话",
				"tokensUnit": "Tokens",
				"toolsCount": "次",
				"activityTitle": "Token 活动",
				"activityDaily": "每日",
				"activityWeekly": "每周",
				"activityCumulative": "累计",
				"months": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
				"title": "自定义指令",
				"hint": "向此主机上的所有聊天提供额外的说明和上下文。保存后,每个新请求都会带上这段指令。",
				"placeholder": "输入你的自定义指令……",
				"save": "保存",
				"saved": "已保存",
				"saveFailed": "保存失败,重试",
				"clear": "清空",
				"readOnly": "当前部署的配置文件为只读,无法保存。",
				"ciSubGlobal": "全局指令",
				"ciSubWs": "按工作区",
				"ciSubTpl": "模板库",
				"ciGlobalDesc": "身份基线:对所有会话生效;未配置工作区指令时,这是唯一注入的指令。",
				"ciWsDesc": "项目适配:自动按会话所在工作区注入;未配置的工作区回退用全局指令。",
				"ciTplDesc": "把常用人设存成模板,一键应用到全局或指定工作区。",
				"ciWsCurrent": "当前会话工作区",
				"ciWsFallback": "回退全局",
				"ciWsConfigured": "已配置",
				"ciWsEmpty": "未配置任何工作区指令,所有会话使用全局指令。",
				"ciWsAdd": "＋ 添加工作区",
				"ciWsPathPlaceholder": "选择或输入工作区路径(如 /Users/…/MyProject)",
				"ciWsTextPlaceholder": "该工作区的指令(留空 = 使用全局指令)",
				"ciWsPick": "选用",
				"ciWsNew": "新建路径",
				"ciTplApplyGlobal": "应用到全局",
				"ciTplApplyWs": "应用",
				"ciTplView": "查看",
				"ciTplCollapse": "收起",
				"ciTplSaveAs": "存为模板",
				"ciTplName": "模板名",
				"ciTplDescPh": "一句话描述(可选)",
				"ciTplCustom": "自定义",
				"ciTplDelete": "删除",
				"ciPreviewTitle": "注入预览({{ws}} 会话将收到)",
				"ciPreviewTag": "指令应用示例",
				"ciPreviewTokens": "≈ {{n}} tokens",
				"ciPreviewNote": "按会话所在工作区自动注入;无匹配时仅注入全局指令。",
				"ciGlobalToggle": "⋯ 查看全局指令",
				"ciGlobalToggleOpen": "⋯ 收起全局指令",
				"ciWsToggle": "⋯ 查看工作区指令",
				"ciWsToggleOpen": "⋯ 收起工作区指令",
				"ciWsNoRule": "未配置工作区指令,该工作区将使用全局指令",
				"ciGlobalEmpty": "未配置全局指令",
				"ciSourceGlobal": "指令:全局",
				"ciSourceWs": "指令:工作区",
				"ciSavedShort": "✓ 已保存"
			},
			en: {
				"nav": "Personal Config",
				"heading": "Personal Config",
				"intro": "Manage your Token usage, personalization, and desktop pet.",
				"tabProfile": "Token usage",
				"tabPersonalization": "Personalization",
				"tabAppearance": "Appearance",
				"appearanceTitle": "Font size",
				"appearanceDesc": "Base font size for the whole UI, applied globally; live preview.",
				"appearanceUnit": "px",
				"appearanceMin": "Min",
				"appearanceMax": "Max",
				"subOverview": "Overview",
				"subActivity": "Activity",
				"subModels": "Models",
				"subSessions": "Sessions",
				"subTools": "Review",
				"subCost": "Model cost",
				"subPet": "Pet",
				"petTitle": "Desktop Pet",
				"petComing": "In design · coming soon",
				"petDesc": "A floating pet driven by your real usage: sweats when busy, cheers when saving, speaks your daily stats when clicked. Plan: docs/pet/DESKTOP-PET.md.",
				"petEnable": "Enable pet",
				"petSkin": "Skin",
				"petSkinBlack": "Black whale",
				"petSkinBlue": "Blue whale",
				"petNameBlack": "Black Whale",
				"petNameBlue": "Blue Whale",
				"petPosition": "Position",
				"petDev": "In development",
				"petSize": "Size",
				"petOpacity": "Opacity",
				"petPosBr": "Bottom-right",
				"petPosBl": "Bottom-left",
				"petPosTr": "Top-right",
				"petPosTl": "Top-left",
				"petMenuSize": "Size",
				"petMenuHide": "Hide pet",
				"petMenuSizeSmall": "S",
				"petMenuSizeMedium": "M",
				"petMenuSizeLarge": "L",
				"petPosCustom": "Dragged to a custom position",
				"petResetPos": "Reset to bottom-right",
				"petIdleHint": "Calm while idle; plays the matching animation on mood change; hover or click also makes a small move. Drag to place it anywhere.",
				"petTip": "Always visible, calm while idle; plays the matching animation when its mood changes. Hover or click also triggers a small move; drag to place it anywhere; right-click to hide.",
				"petServiceDown": "Pet service not ready: restart the app so host changes take effect, then refresh.",
				"petStatusOn": "Enabled",
				"petStatusOff": "Disabled",
				"petSaved": "Saved",
				"petRestartHint": "Pet config and animations are served by the host loopback routes: restart the app once so host changes take effect; afterwards a page refresh is enough.",
				"petNoPriceHint": "No model prices configured (Settings → Personal → Model cost), so today's cost is empty and \"money pain\" never triggers.",
				"petToday": "Today's mood",
				"petTodayStats": "Today: {tokens} tokens · {tools} tool calls · {rate} cache",
				"petThresholdsTitle": "Emotion thresholds (built-in, calibrated on local data)",
				"petThresholdHappy": "Happy: cache hit rate ≥ {v}",
				"petThresholdBusy": "Busy: today's tool calls ≥ {v}",
				"petThresholdExhausted": "Exhausted: today's tokens ≥ {v}",
				"petThresholdMoneyPain": "Money pain: today's cost ≥ ¥{v} (requires configured prices)",
				"petThresholdDozing": "Dozing: idle ≥ {v} min",
				"petEmotionHappy": "Happy",
				"petEmotionBusy": "Busy",
				"petEmotionExhausted": "Exhausted",
				"petEmotionMoneyPain": "Money pain",
				"petEmotionDozing": "Dozing",
				"petEmotionThinking": "Thinking",
				"petEmotionWaiting": "Waiting for you",
				"petEmotionCelebrate": "Celebrating",
				"petBubbleTokens": "Used {tokens} tokens today",
				"petBubbleCache": "Cache hit {rate}% — saving money!",
				"petBubbleTools": "Top tool today: {tool}",
				"petBubbleCost": "Spent ¥{cost} today",
				"petBubbleCostUsd": "Spent ${cost} today",
				"petBubbleIdle": "Nothing yet today~",
				"petBubbleLoading": "Loading data…",
				"petStatusTitle": "Session overview",
				"petStatusBtn": "Session status",
				"petSubMain": "Pet",
				"petSubStatus": "Session status",
				"petStatusLabel": "Show session status on pet",
				"petStatusDesc": "Show a live session overview (running / failed / completed) on the pet and drive its mood from it in real time.",
				"petStatusNeedPet": "Enable the pet first",
				"petStatusOpenHint": "Double-click to open this session",
				"petStatusRunning": "Running",
				"petStatusFailed": "Failed",
				"petStatusDone": "Completed",
				"petStatusReady": "Ready",
				"petStatusIdle": "Idle",
				"petStatusSumRunning": "Running",
				"petStatusSumFailed": "Failed",
				"petStatusSumDone": "Done",
				"petStatusActionRead": "Reading {file}",
				"petStatusActionWrite": "Writing {file}",
				"petStatusActionEdit": "Editing {file}",
				"petStatusActionBash": "Running {cmd}…",
				"petStatusActionSearch": "Searching",
				"petStatusActionUnknown": "Calling {tool}",
				"petStatusEmpty": "No sessions",
				"petStatusBubbleFail": "{n} failed · {m} running",
				"petStatusBubbleRun": "{m} running",
				"petStatusBubbleDone": "All done",
				"mockHint": "Sample data · real usage appears once the stats service is wired in.",
				"loadingHint": "Computing stats…",
				"errorHint": "Failed to load stats. Restart the app so the stats service is active.",
				"retry": "Retry",
				"todayTitle": "Today",
				"totalTitle": "All time",
				"tokens": "Tokens",
				"sessions": "Sessions",
				"toolCalls": "Tool calls",
				"totalTokens": "Total tokens",
				"longestChat": "Longest chat",
				"totalSessions": "Total sessions",
				"cacheRate": "Cache hit rate",
				"estCost": "Est. cost",
				"costWeek": "This week",
				"costMonth": "This month",
				"costNotConfigured": "No pricing configured",
				"costEditorTitle": "Cost estimation",
				"costHint": "Prices are per 1M tokens (in the selected currency). Peak = Beijing 9-12 / 14-18. Presets come from official docs and may be outdated — always check the provider's site.",
				"costPreset": "Apply official presets",
				"costAdd": "Add",
				"costSave": "Save prices",
				"costSaved": "Saved",
				"costDelete": "Remove",
				"costPeak": "Peak",
				"costOffpeak": "Off-peak",
				"costCurrency": "Currency",
				"costCurCny": "¥",
				"costCurUsd": "$",
				"costInputMiss": "Miss",
				"costInputHit": "Hit",
				"costOutput": "Output",
				"costReasoning": "Reasoning",
				"costProvider": "Provider",
				"costModel": "Model",
				"costNoModels": "No models yet — add one or apply presets.",
				"topTools": "Top tools",
				"statToday": "Today",
				"numYi": "M",
				"numWan": "k",
				"tplDefaultName": "Custom instructions",
				"byModelTitle": "By model",
				"sessionsTitle": "Recent sessions",
				"cacheShort": "cached",
				"unnamed": "Untitled session",
				"tokensUnit": "tokens",
				"toolsCount": "calls",
				"activityTitle": "Token Activity",
				"activityDaily": "Daily",
				"activityWeekly": "Weekly",
				"activityCumulative": "Cumulative",
				"months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
				"title": "Custom Instructions",
				"hint": "Provide additional instructions and context for all chats on this host. Every new request includes them after you save.",
				"placeholder": "Type your custom instructions…",
				"save": "Save",
				"saved": "Saved",
				"saveFailed": "Save failed — retry",
				"clear": "Clear",
				"readOnly": "The settings document is read-only in this deployment.",
				"ciSubGlobal": "Global",
				"ciSubWs": "Per-workspace",
				"ciSubTpl": "Templates",
				"ciGlobalDesc": "Identity baseline: applies to every chat. When no workspace rule is set, this is the only injected instruction.",
				"ciWsDesc": "Project adaptation: auto-injected by the chat's workspace; workspaces without a rule fall back to the global instruction.",
				"ciTplDesc": "Save common personas as templates and apply them to the global scope or a workspace with one click.",
				"ciWsCurrent": "Current chat workspace",
				"ciWsFallback": "Falls back to global",
				"ciWsConfigured": "Configured",
				"ciWsEmpty": "No per-workspace rules configured — all chats use the global instruction.",
				"ciWsAdd": "＋ Add workspace",
				"ciWsPathPlaceholder": "Pick or type a workspace path (e.g. /Users/…/MyProject)",
				"ciWsTextPlaceholder": "Instructions for this workspace (leave empty = use global)",
				"ciWsPick": "Pick",
				"ciWsNew": "New path",
				"ciTplApplyGlobal": "Apply to global",
				"ciTplApplyWs": "Apply",
				"ciTplView": "View",
				"ciTplCollapse": "Collapse",
				"ciTplSaveAs": "Save as template",
				"ciTplName": "Template name",
				"ciTplDescPh": "One-line description (optional)",
				"ciTplCustom": "Custom",
				"ciTplDelete": "Delete",
				"ciPreviewTitle": "Injection preview ({{ws}} chats will receive)",
				"ciPreviewTag": "Injection example",
				"ciPreviewTokens": "≈ {{n}} tokens",
				"ciPreviewNote": "Auto-injected by the chat's workspace; falls back to the global instruction when unmatched.",
				"ciGlobalToggle": "⋯ View global rule",
				"ciGlobalToggleOpen": "⋯ Collapse global rule",
				"ciWsToggle": "⋯ View workspace rule",
				"ciWsToggleOpen": "⋯ Collapse workspace rule",
				"ciWsNoRule": "No workspace rule — this workspace falls back to the global instruction",
				"ciGlobalEmpty": "No global instruction configured",
				"ciSourceGlobal": "Rule: global",
				"ciSourceWs": "Rule: workspace",
				"ciSavedShort": "✓ Saved"
			}
		};
		//#endregion

		//#region helpers
		/** 数字千分位格式化。 */
		function fmtNumber(n) {
			return typeof n === "number" ? n.toLocaleString("en-US") : String(n ?? "—");
		}

		/** 毫秒 → 可读时长(如 2h 15m / 45m / 30s)。 */
		function fmtDuration(ms) {
			if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";
			const totalMin = Math.round(ms / 60000);
			if (totalMin >= 60) {
				const h = Math.floor(totalMin / 60);
				const m = totalMin % 60;
				return m === 0 ? h + "h" : h + "h " + m + "m";
			}
			if (totalMin >= 1) return totalMin + "m";
			return Math.max(1, Math.round(ms / 1000)) + "s";
		}

		/** 比例(0..1)→ 百分比字符串;null → "—"。 */
		function fmtPct(rate) {
			if (typeof rate !== "number" || !Number.isFinite(rate)) return "—";
			return (rate * 100).toFixed(1) + "%";
		}

		/** 时间戳 → 短日期(按语言:8月19日 / Aug 19)。 */
		function fmtDate(ts, months) {
			if (typeof ts !== "number" || !Number.isFinite(ts)) return "";
			const d = new Date(ts);
			const m = Array.isArray(months) ? months[d.getMonth()] : "";
			return m.endsWith("月") ? m + d.getDate() + "日" : m + " " + d.getDate();
		}

		/** 币种汇总对象 {cny, usd} → "¥167.28 / $10.00"。 */
		function fmtCost(currencies) {
			if (!currencies || typeof currencies !== "object") return "—";
			const parts = [];
			if (typeof currencies.cny === "number" && currencies.cny > 0) parts.push("¥" + currencies.cny.toFixed(2));
			if (typeof currencies.usd === "number" && currencies.usd > 0) parts.push("$" + currencies.usd.toFixed(2));
			return parts.length ? parts.join(" / ") : "—";
		}

		/** 单值价格(数值+币种)→ "¥51.69"。 */
		function fmtPrice(cost, currency) {
			if (typeof cost !== "number" || !Number.isFinite(cost) || cost <= 0) return "";
			return (currency === "usd" ? "$" : "¥") + cost.toFixed(2);
		}

		/** 官方预设价格目录(2026-08,来源见 docs/personal-profile/COST-ESTIMATION.md §5.1)。 */
		const PRICE_PRESETS = {
			"deepseek-official::deepseek-v4-flash": { currency: "cny", inputMiss: 1.5, inputHit: 0.05, output: 4.5, reasoning: null, peak: { inputMiss: 3.0, inputHit: 0.1, output: 9.0 } },
			"deepseek-official::deepseek-v4-pro": { currency: "cny", inputMiss: 4.5, inputHit: 0.15, output: 13.5, reasoning: null, peak: { inputMiss: 9.0, inputHit: 0.3, output: 27.0 } },
			"moonshot::kimi-k2.5": { currency: "cny", inputMiss: 4.0, inputHit: 0.7, output: 21.0, reasoning: null, peak: null },
			"google::gemini-2.5-pro": { currency: "usd", inputMiss: 1.25, inputHit: null, output: 10.0, reasoning: null, peak: null },
			"google::gemini-2.5-flash": { currency: "usd", inputMiss: 0.3, inputHit: null, output: 2.5, reasoning: null, peak: null },
			"openai::gpt-5": { currency: "usd", inputMiss: 1.25, inputHit: 0.125, output: 10.0, reasoning: null, peak: null },
			"openai::gpt-5-mini": { currency: "usd", inputMiss: 0.25, inputHit: 0.025, output: 2.0, reasoning: null, peak: null }
		};

		/**
		 * 添加模型的联想建议(仅作提示,模型名以官方文档为准;匹配不到则返回全部常用模型)。
		 */
		const PROVIDER_MODEL_SUGGESTIONS = [
			{ match: /deepseek/, models: ["deepseek-v4-flash", "deepseek-v4-pro"] },
			{ match: /kimi|moonshot/, models: ["kimi-k2.7", "kimi-k2.5", "kimi-k2.3"] },
			{ match: /openai|gpt/, models: ["gpt-5.5", "gpt-5.4", "gpt-5", "gpt-5-mini", "gpt-5-nano"] },
			{ match: /google|gemini/, models: ["gemini-3-pro", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"] },
			{ match: /anthropic|claude/, models: ["claude-opus", "claude-sonnet", "claude-haiku"] },
			{ match: /doubao|volcengine|ark|byte/, models: ["doubao-seed-2.0", "doubao-seed-1.8", "doubao-seed-1.6"] },
			{ match: /qwen|aliyun|bailian|dashscope/, models: ["qwen3-max", "qwen3-235b-a22b", "qwen3-coder"] }
		];
		const KNOWN_PROVIDERS = ["deepseek", "deepseek-official", "kimi", "moonshot", "openai", "google", "anthropic", "claude", "doubao", "volcengine", "qwen", "aliyun"];

		/** 全部建议模型(去重)。 */
		const ALL_MODELS = [...new Set(PROVIDER_MODEL_SUGGESTIONS.flatMap((s) => s.models))];

		/** 根据输入的提供方返回建议模型列表;提供方为空/未匹配时返回全部。 */
		function suggestModels(provider) {
			const p = (provider || "").toLowerCase().trim();
			if (!p) return ALL_MODELS;
			const hit = PROVIDER_MODEL_SUGGESTIONS.find((s) => s.match.test(p));
			return hit ? hit.models : ALL_MODELS;
		}

		/**
		 * 拉取统计(环回路由 /personal-center/stats)。
		 * @returns {{ state: {status: string, data?: any, error?: string}, reload: (refresh?: boolean) => void }}
		 */
		function useStats() {
			const [state, setState] = react.useState({ status: "loading", data: null });
			const load = react.useCallback((refresh) => {
				setState((s) => ({ status: "loading", data: s.data }));
				fetch("/personal-center/stats" + (refresh ? "?refresh=1" : ""))
					.then((r) => {
						if (!r.ok) throw new Error("HTTP " + r.status);
						return r.json();
					})
					.then((d) => {
						if (d && d.ok === false) throw new Error(d.error || "failed");
						setState({ status: "ready", data: d });
					})
					.catch((e) => setState({ status: "error", error: e && e.message ? e.message : String(e) }));
			}, []);
			react.useEffect(() => {
				load(false);
			}, [load]);
			return { state, reload: () => load(true) };
		}

		/**
		 * 读取/保存自定义指令(环回路由 /personal-center/custom-instructions,
		 * 绕开 Web 设置白名单)。
		 * @returns {{ text: string, save: (value: string) => Promise<void> }}
		 */
		function useCustomInstructions() {
			const [text, setText] = react.useState("");
			react.useEffect(() => {
				fetch("/personal-center/custom-instructions")
					.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
					.then((d) => {
						if (d && d.ok !== false && typeof d.text === "string") setText(d.text);
					})
					.catch(() => { /* 读取失败按空处理 */ });
			}, []);
			const save = (value) => fetch("/personal-center/custom-instructions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ text: value })
			}).then((r) => r.json()).then((d) => {
				if (!d || d.ok === false) throw new Error(d && d.error ? d.error : "failed");
				setText(value);
			});
			return { text, save };
		}
		//#endregion

		//#region token activity(每日/每周/累计;数据来自统计服务)
		/**
		 * 计算热力图月份标签的列跨度。
		 * @param {Array<{month: number}>} weeks
		 * @returns {Array<{col: number, end: number, month: number}>}
		 */
		function monthSpans(weeks) {
			const spans = [];
			let start = 0;
			for (let w = 1; w <= weeks.length; w++) {
				const m = w < weeks.length ? weeks[w].month : -1;
				if (w === weeks.length || m !== weeks[w - 1].month) {
					spans.push({ col: start, end: w, month: weeks[start].month });
					start = w;
				}
			}
			return spans;
		}

		/** 每日/每周/累计 切换按钮。 */
		function ActivityModeToggle({ t, mode, setMode }) {
			const modes = [
				["daily", t("activityDaily")],
				["weekly", t("activityWeekly")],
				["cumulative", t("activityCumulative")]
			];
			return react.createElement("div", { className: "dsh-pc-profile-activity-toggle", role: "tablist" },
				modes.map(([id, label]) => react.createElement("button", {
					key: id,
					className: "dsh-pc-profile-activity-mode",
					role: "tab",
					"data-active": mode === id,
					"aria-selected": mode === id,
					onClick: () => setMode(id)
				}, label))
			);
		}

		/** 每日:GitHub 风格热力图(列为周,行为星期)。 */
		function ActivityDaily({ t, weeks }) {
			const W = weeks.length;
			const gridStyle = { gridTemplateColumns: "repeat(" + W + ", 1fr)" };
			const cells = [];
			for (let d = 0; d < 7; d++) {
				for (let w = 0; w < W; w++) {
					cells.push(react.createElement("div", { key: w + "-" + d, className: "dsh-pc-profile-heat-cell", "data-level": weeks[w].days[d] }));
				}
			}
			return react.createElement("div", { className: "dsh-pc-profile-heat" },
				react.createElement("div", { className: "dsh-pc-profile-heat-grid", style: gridStyle },
					monthSpans(weeks).map((s) => react.createElement("div", {
						key: s.col,
						className: "dsh-pc-profile-heat-label",
						style: { gridColumn: (s.col + 1) + " / " + (s.end + 1) }
					}, t("months")[s.month]))
				),
				react.createElement("div", { className: "dsh-pc-profile-heat-grid", style: gridStyle }, cells)
			);
		}

		/** 每周:52 个周格,按周总量着色。 */
		function ActivityWeekly({ t, weeks }) {
			const W = weeks.length;
			const sums = weeks.map((wk) => wk.days.reduce((a, b) => a + b, 0));
			const maxSum = Math.max.apply(null, sums) || 1;
			const gridStyle = { gridTemplateColumns: "repeat(" + W + ", 1fr)" };
			const cells = sums.map((s, w) => react.createElement("div", {
				key: w,
				className: "dsh-pc-profile-heat-cell",
				"data-level": s === 0 ? 0 : Math.max(1, Math.min(5, Math.round((s / maxSum) * 5)))
			}));
			return react.createElement("div", { className: "dsh-pc-profile-heat" },
				react.createElement("div", { className: "dsh-pc-profile-heat-grid", style: gridStyle },
					monthSpans(weeks).map((s) => react.createElement("div", {
						key: s.col,
						className: "dsh-pc-profile-heat-label",
						style: { gridColumn: (s.col + 1) + " / " + (s.end + 1) }
					}, t("months")[s.month]))
				),
				react.createElement("div", { className: "dsh-pc-profile-heat-grid", style: gridStyle }, cells)
			);
		}

		/** 累计:最近 12 个月的累计柱状图。 */
		function ActivityCumulative({ t, monthly }) {
			const max = Math.max.apply(null, monthly.totals) || 1;
			return react.createElement("div", { className: "dsh-pc-profile-cum" },
				monthly.months.map((m, i) => react.createElement("div", { key: m.year + "-" + m.month, className: "dsh-pc-profile-cum-col" },
					react.createElement("div", {
						className: "dsh-pc-profile-cum-bar",
						style: { height: Math.max(2, Math.round((monthly.totals[i] / max) * 78)) + "px" }
					}),
					react.createElement("div", { className: "dsh-pc-profile-cum-label" }, t("months")[m.month])
				))
			);
		}

		/** Token 活动容器:标题行(标题+切换)+ 每日/每周/累计内容。 */
		function TokenActivity({ t, weeks, monthly }) {
			const [mode, setMode] = react.useState("daily");
			return react.createElement("div", { className: "dsh-pc-profile-activity" },
				react.createElement("div", { className: "dsh-pc-profile-activity-head" },
					react.createElement("h3", { className: "dsh-pc-group dsh-pc-profile-activity-title" }, t("activityTitle")),
					react.createElement(ActivityModeToggle, { t, mode, setMode })
				),
				mode === "daily" ? react.createElement(ActivityDaily, { t, weeks })
					: mode === "weekly" ? react.createElement(ActivityWeekly, { t, weeks })
					: react.createElement(ActivityCumulative, { t, monthly })
			);
		}
		//#endregion

		//#region 模块: Token 用量(ProfileTab)
		/**
		 * 统计卡片。
		 * @param {string} label 卡片标签
		 * @param {string} value 主数值
		 * @param {string} [sub] 副文案
		 */
		function StatCard(label, value, sub) {
			return react.createElement("div", { className: "dsh-pc-profile-stat" },
				react.createElement("div", { className: "dsh-pc-profile-stat-label" }, label),
				react.createElement("div", { className: "dsh-pc-profile-stat-value" }, value),
				sub !== void 0 && react.createElement("div", { className: "dsh-pc-profile-stat-sub" }, sub)
			);
		}

		/**
		 * 「个人资料」tab:子 tab(概览/常用工具/成本)拆分长页面。
		 * @param {{ t: (key: string) => string }} props
		 */
		function ProfileTab({ t }) {
			const { state, reload } = useStats();
			const [sub, setSub] = react.useState("overview");

			if (state.status === "loading") {
				return react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("p", { className: "dsh-pc-mock" }, t("loadingHint"))
				);
			}
			if (state.status === "error") {
				return react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("p", { className: "dsh-pc-mock" }, t("errorHint") + (state.error ? "(" + state.error + ")" : "")),
					react.createElement("button", { className: "dsh-pc-pers-button dsh-pc-pers-primary", onClick: reload }, t("retry"))
				);
			}

			const m = state.data;
			const weeks = Array.isArray(m.activity) ? m.activity : [];
			const monthly = m.monthly || { months: [], totals: [] };
			const byModel = Array.isArray(m.byModel) ? m.byModel : [];
			const tools = Array.isArray(m.tools) ? m.tools : [];
			const sessions = Array.isArray(m.sessions) ? m.sessions : [];
			const months = t("months");

			const block = sub === "overview" ? react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("h3", { className: "dsh-pc-group" }, t("todayTitle")),
					react.createElement("div", { className: "dsh-pc-profile-grid" },
						StatCard(t("tokens"), fmtNumber(m.today?.tokens), t("statToday")),
						StatCard(t("sessions"), fmtNumber(m.today?.sessions), t("statToday")),
						StatCard(t("toolCalls"), fmtNumber(m.today?.toolCalls), t("statToday"))
					),
					react.createElement("h3", { className: "dsh-pc-group" }, t("totalTitle")),
					react.createElement("div", { className: "dsh-pc-profile-grid" },
						StatCard(t("totalTokens"), fmtNumber(m.total?.tokens)),
						StatCard(t("longestChat"), fmtDuration(m.total?.longestChatMs)),
						StatCard(t("totalSessions"), fmtNumber(m.total?.sessions)),
						StatCard(t("cacheRate"), fmtPct(m.total?.cacheHitRate)),
						StatCard(t("estCost"), fmtCost(m.cost && m.cost.totals ? m.cost.totals.all : null),
							(m.cost && m.cost.totals && (m.cost.totals.week.cny || m.cost.totals.week.usd))
								? t("costWeek") + " " + fmtCost(m.cost.totals.week) + " · " + t("costMonth") + " " + fmtCost(m.cost.totals.month)
								: t("costNotConfigured"))
					),
					react.createElement(TokenActivity, { t, weeks, monthly }),
					react.createElement("h3", { className: "dsh-pc-group" }, t("byModelTitle")),
					react.createElement("div", { className: "dsh-pc-profile-tools" },
						byModel.map((row) => react.createElement("div", { key: row.provider + ":" + row.model, className: "dsh-pc-profile-tool-row" },
							react.createElement("div", { className: "dsh-pc-profile-model" },
								react.createElement("span", { className: "dsh-pc-profile-tool-name" }, row.model),
								react.createElement("span", { className: "dsh-pc-profile-model-sub" },
									row.provider + (row.cacheHitRate !== null ? " · " + fmtPct(row.cacheHitRate) + " " + t("cacheShort") : "")
								)
							),
							react.createElement("span", { className: "dsh-pc-profile-tool-calls" },
								fmtNumber(row.tokens) + " " + t("tokensUnit") + " · " + fmtNumber(row.requests) + " " + t("toolsCount") +
								(row.cost !== null && row.cost !== undefined ? " · " + fmtPrice(row.cost, row.currency) : "")
							)
						))
					)
				)
				: sub === "tools" ? react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("h3", { className: "dsh-pc-group" }, t("topTools")),
					react.createElement("div", { className: "dsh-pc-profile-tools" },
						tools.map((tool) => react.createElement("div", { key: tool.name, className: "dsh-pc-profile-tool-row" },
							react.createElement("span", { className: "dsh-pc-profile-tool-name" }, tool.name),
							react.createElement("span", { className: "dsh-pc-profile-tool-calls" }, fmtNumber(tool.calls) + " " + t("toolsCount"))
						))
					),
					react.createElement("h3", { className: "dsh-pc-group" }, t("sessionsTitle")),
					react.createElement("div", { className: "dsh-pc-profile-tools" },
						sessions.length === 0
							? react.createElement("p", { className: "dsh-pc-mock" }, t("unnamed"))
							: sessions.map((s) => react.createElement("div", { key: s.id || s.createdAt, className: "dsh-pc-profile-tool-row" },
								react.createElement("div", { className: "dsh-pc-profile-session" },
									react.createElement("span", { className: "dsh-pc-profile-session-title" }, s.title || t("unnamed")),
									react.createElement("span", { className: "dsh-pc-profile-session-sub" },
										(s.createdAt ? fmtDate(s.createdAt, months) : "") +
										(s.durationMs ? " · " + fmtDuration(s.durationMs) : "")
									)
								),
								react.createElement("span", { className: "dsh-pc-profile-tool-calls" },
									fmtNumber(s.tokens) + " " + t("tokensUnit") + " · " + fmtPct(s.cacheHitRate) + " " + t("cacheShort")
								)
							))
					)
				)
				: react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement(CostEditor, { t, onSaved: reload })
				);

			return react.createElement("div", { className: "dsh-pc-panel" },
				react.createElement("div", { className: "dsh-pc-profile-pill-tabs", role: "tablist" },
					PillTabButton("overview", t("subOverview"), sub, setSub),
					PillTabButton("tools", t("subTools"), sub, setSub),
					PillTabButton("cost", t("subCost"), sub, setSub)
				),
				block
			);
		}
		//#endregion

		//#region 模块: 个性化(PersonalizationTab)
		/**
		 * 内置指令模板的英文版(名称/描述/指令正文)。
		 * 内置模板数据由宿主以中文下发,UI 为英文时按 builtin id 映射为英文显示
		 * (自定义模板为用户内容,不做翻译)。UI 语言由 <html lang> 反映
		 * (locale 插件切换时同步更新)。
		 */
		const BUILTIN_TPL_EN = {
			"builtin-pm": {
				name: "Product Manager",
				desc: "Conclusion first, weigh value × cost × risk, structured PRD with priorities",
				text: "You are a senior AI product manager. Answer with the conclusion first, then the rationale; analyze by value × cost × risk; write documents in structured Markdown with priorities."
			},
			"builtin-dev": {
				name: "Developer",
				desc: "Engineering detail, runnable code + verification steps, compatibility, known pitfalls",
				text: "You are a senior engineer. Provide runnable code with verification steps, note compatibility and known pitfalls, and keep the language concise."
			},
			"builtin-writer": {
				name: "Writing",
				desc: "Structured writing, concise, no fluff",
				text: "You are a professional writer. Output clear, structured, and impactful copy; avoid clichés and filler; adjust the tone to the target reader."
			},
			"builtin-translator": {
				name: "Translator",
				desc: "Chinese–English translation, preserve formatting, keep terminology consistent",
				text: "You are a professional translator. Translate between Chinese and English, preserve the original formatting and terminology consistency, and include the original for proper nouns on first mention."
			},
			"builtin-general": {
				name: "General Assistant",
				desc: "Pragmatic, concise, conclusion first",
				text: "You are a pragmatic, reliable general assistant. Answer with the conclusion first, then only the necessary reasoning; be concise and direct, no filler."
			}
		};
		/** 当前 UI 是否为英文(locale 插件会把活动语言同步到 <html lang>)。 */
		function isEnLocale() {
			return document.documentElement.lang === "en";
		}

		/**
		 * 「个性化」tab(v0.7):三子区(全局 / 按工作区 / 模板库)+ 底部注入预览。
		 * 数据走环回路由:/personal-center/custom-instructions(全局文本)、
		 * /personal-center/instructions(工作区映射 + 模板库)、
		 * /personal-center/current-workspace(当前工作区)、/personal-center/workspaces(自动发现)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function PersonalizationTab({ t }) {
			const { text: persisted, save } = useCustomInstructions();
			const [sub, setSub] = react.useState("global"); // global | ws | tpl
			const [draft, setDraft] = react.useState("");
			const [state, setState] = react.useState("idle"); // idle | saving | saved | failed
			// 用户是否正在编辑:只在"未编辑"时才允许外部持久值覆盖 draft,
			// 避免异步读取落地时把用户刚输入的内容清空。
			const dirtyRef = react.useRef(false);
			react.useEffect(() => {
				if (!dirtyRef.current) setDraft(persisted);
			}, [persisted]);

			// 分层配置状态(工作区映射 + 模板库 + 当前工作区 + 自动发现)
			const [wsMap, setWsMap] = react.useState({});
			const [templates, setTemplates] = react.useState([]);
			const [currentWs, setCurrentWs] = react.useState("");
			const [discovered, setDiscovered] = react.useState([]);
			const [loading, setLoading] = react.useState(true);
			const [wsDrafts, setWsDrafts] = react.useState({});
			const [wsSaving, setWsSaving] = react.useState(false);
			const [wsSavedKey, setWsSavedKey] = react.useState("");
			const [addPath, setAddPath] = react.useState("");
			const [tplName, setTplName] = react.useState("");
			const [expandedPaths, setExpandedPaths] = react.useState(new Set());
			const [openTpls, setOpenTpls] = react.useState(new Set());
			const [openWs, setOpenWs] = react.useState(false);
			const [wsOpen, setWsOpen] = react.useState(false);
			const pickerRef = react.useRef(null);
			// 下拉打开时,点击选择器外部(document mousedown + contains)立即关闭。
			// 不用 onBlur+setTimeout(与打开竞争会闪关/延迟关,见 AGENTS.md §3.10 审查记录)。
			react.useEffect(() => {
				if (!wsOpen) return;
				const onDocMouseDown = (e) => {
					const el = pickerRef.current;
					if (el && typeof el.contains === "function" && !el.contains(e.target)) setWsOpen(false);
				};
				document.addEventListener("mousedown", onDocMouseDown);
				return () => document.removeEventListener("mousedown", onDocMouseDown);
			}, [wsOpen]);
			const [tplSaved, setTplSaved] = react.useState(false);

			react.useEffect(() => {
				let alive = true;
				Promise.all([
					fetch("/personal-center/instructions").then((r) => r.json()),
					fetch("/personal-center/current-workspace").then((r) => r.json()),
					fetch("/personal-center/workspaces").then((r) => r.json())
				]).then(([ins, cur, disc]) => {
					if (!alive) return;
					if (ins && ins.ok !== false) {
						if (ins.workspaces && typeof ins.workspaces === "object") {
							// 自动清理目录名形式的 key(--Users-…--,模糊编码,与真实路径重复)并持久化
							const cleanWs = {};
							let hadDirKey = false;
							for (const k of Object.keys(ins.workspaces)) {
								if (k.startsWith("--") || k.endsWith("--")) { hadDirKey = true; continue; }
								cleanWs[k] = ins.workspaces[k];
							}
							setWsMap(cleanWs);
							const drafts = {};
							for (const k of Object.keys(cleanWs)) drafts[k] = cleanWs[k];
							setWsDrafts(drafts);
							if (hadDirKey) {
								fetch("/personal-center/instructions", {
									method: "POST",
									headers: { "content-type": "application/json" },
									body: JSON.stringify({ workspaces: cleanWs, templates: Array.isArray(ins.templates) ? ins.templates : [] })
								}).catch(() => { /* 清理失败不阻塞 */ });
							}
						}
						if (Array.isArray(ins.templates)) setTemplates(ins.templates);
						if (typeof ins.global === "string" && !dirtyRef.current) setDraft(ins.global);
					}
					if (cur && typeof cur.cwd === "string") {
						setCurrentWs(cur.cwd);
						// 预填当前会话工作区路径:免去用户手动找文件夹复制(若尚未配置)
						setAddPath((prev) => (prev === "" ? cur.cwd : prev));
					}
					if (disc && Array.isArray(disc.workspaces)) setDiscovered(disc.workspaces);
					setLoading(false);
				}).catch(() => setLoading(false));
				return () => { alive = false; };
			}, []);

			/** 当前工作区最长前缀匹配(与宿主 matchWorkspace 同算法,仅返回 key)。 */
			const currentWsKey = (() => {
				let best = "";
				let bestLen = -1;
				for (const k of Object.keys(wsMap)) {
					if (currentWs.startsWith(k) && k.length > bestLen) { bestLen = k.length; best = k; }
				}
				return best;
			})();
			const currentWsText = wsMap[currentWsKey] ?? "";
			/** 合并文本(与宿主 mergeInstructions 一致)。 */
			const merged = (() => {
				const g = (draft ?? "").trim();
				const w = (currentWsText ?? "").trim();
				if (w === "") return draft ?? "";
				return g === "" ? currentWsText : g + "\n\n" + currentWsText;
			})();
			const mergedTokens = Math.ceil(merged.length / 4);

			/** 持久化分层配置(工作区 + 模板,整体保存)。 */
			const persistLayer = (nextWs, nextTpl) => fetch("/personal-center/instructions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ workspaces: nextWs, templates: nextTpl })
			}).then((r) => r.json()).then((d) => {
				if (!d || d.ok === false) throw new Error(d && d.error ? d.error : "failed");
			});

			const saveWorkspaces = (nextWs) => {
				setWsSaving(true);
				persistLayer(nextWs, templates).then(() => {
					setWsMap(nextWs);
					setWsSaving(false);
				}).catch(() => setWsSaving(false));
			};

			// ── 全局区(沿用 v0.1 逻辑)──
			const dirty = draft !== persisted;
			const onSaveGlobal = () => {
				if (state === "saving") return;
				setState("saving");
				save(draft).then(() => {
					dirtyRef.current = false;
					setState("saved");
					setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1600);
				}).catch(() => setState("failed"));
			};
			const onClearGlobal = () => {
				dirtyRef.current = false;
				setDraft("");
				setState("idle");
				save("").catch(() => setState("failed"));
			};

			// ── 工作区区 ──
			const wsKeys = Object.keys(wsMap);
			const onSaveWs = (key) => {
				const next = { ...wsMap, [key]: wsDrafts[key] ?? "" };
				saveWorkspaces(next);
				setWsSavedKey(key);
				setTimeout(() => setWsSavedKey((k) => (k === key ? "" : k)), 1500);
			};
			const onClearWs = (key) => {
				const next = { ...wsMap };
				delete next[key];
				const drafts = { ...wsDrafts };
				delete drafts[key];
				setWsDrafts(drafts);
				saveWorkspaces(next);
			};
			/** 选中/输入工作区路径后自动纳入列表(选择即添加,无需独立「添加」按钮)。 */
			const ensureWs = (path) => {
				const p = (path || "").trim();
				if (!p || wsMap[p] !== undefined) return;
				const next = { ...wsMap, [p]: "" };
				setWsDrafts({ ...wsDrafts, [p]: "" });
				setWsMap(next);
				saveWorkspaces(next);
			};

			// ── 模板区 ──
			const onApplyTpl = (text, target) => {
				if (target === "global") {
					dirtyRef.current = false;
					setDraft(text);
					setSub("global"); // 应用后切过去,用户可直接看到/编辑
					save(text).then(() => setState("saved")).catch(() => setState("failed"));
				} else {
					const key = currentWsKey || currentWs;
					if (!key) return;
					const next = { ...wsMap, [key]: text };
					setWsDrafts({ ...wsDrafts, [key]: text });
					setSub("ws"); // 应用后切到工作区,用户可直接看到/编辑
					setWsSavedKey(key); // 「✓ 已保存」反馈,明确已落到该工作区
					setTimeout(() => setWsSavedKey((k) => (k === key ? "" : k)), 1500);
					saveWorkspaces(next);
				}
			};
			const onSaveAsTpl = () => {
				const text = draft.trim();
				if (!text) return;
				const name = tplName.trim() || t("tplDefaultName");
				const id = "custom-" + Date.now().toString(36);
				const nextTpl = [...templates, { id, name, desc: "", text }];
				persistLayer(wsMap, nextTpl).then(() => {
					setTemplates(nextTpl);
					setTplName("");
					setTplSaved(true);
					setTimeout(() => setTplSaved(false), 1500);
				}).catch(() => {});
			};
			const onDeleteTpl = (id) => {
				const nextTpl = templates.filter((tpl) => tpl.id !== id);
				persistLayer(wsMap, nextTpl).then(() => setTemplates(nextTpl)).catch(() => {});
			};

			const subtabs = [
				["global", t("ciSubGlobal")],
				["ws", t("ciSubWs")]
			];
			const btn = (cls, label, onClick, disabled) => react.createElement("button", { className: cls, onClick, disabled }, label);

			return react.createElement("div", { className: "dsh-pc-panel" },
				// 子 tab(胶囊)
				react.createElement("div", { className: "dsh-pc-pers-subtabs", role: "tablist" },
					subtabs.map(([id, label]) => react.createElement("button", {
						key: id,
						role: "tab",
						"data-active": sub === id,
						"aria-selected": sub === id,
						className: "dsh-pc-pers-subtab",
						onClick: () => setSub(id)
					}, label))
				),
				// ── 全局指令 ──
				react.createElement("div", { className: "dsh-pc-pers-section", "data-active": sub === "global" },
					react.createElement("p", { className: "dsh-pc-pers-desc" }, t("ciGlobalDesc")),
					react.createElement("textarea", {
						className: "dsh-pc-pers-textarea",
						value: draft,
						spellCheck: false,
						placeholder: t("placeholder"),
						onChange: (e) => {
							dirtyRef.current = true;
							setDraft(e.target.value);
							if (state === "saved" || state === "failed") setState("idle");
						}
					}),
					react.createElement("div", { className: "dsh-pc-pers-actions" },
						draft !== "" && btn("dsh-pc-pers-button dsh-pc-pers-secondary", t("clear"), onClearGlobal),
						btn("dsh-pc-pers-button dsh-pc-pers-primary", state === "saved" ? t("saved") : state === "failed" ? t("saveFailed") : t("save"), onSaveGlobal, state === "saving" || !dirty)
					)
				),
				// ── 按工作区(含模板库:添加工作区后直接选模板,无需切换 tab)──
				react.createElement("div", { className: "dsh-pc-pers-section", "data-active": sub === "ws" },
					react.createElement("p", { className: "dsh-pc-pers-desc" }, t("ciWsDesc")),
					loading
						? react.createElement("div", { className: "dsh-pc-pers-empty" }, "…")
						: wsKeys.length === 0
							? react.createElement("div", { className: "dsh-pc-pers-empty" }, t("ciWsEmpty"))
							: react.createElement("div", { className: "dsh-pc-pers-ws" },
								wsKeys.map((key) => {
									const isCurrent = key === currentWsKey || (currentWsKey === "" && key === currentWs);
									const expanded = expandedPaths.has(key);
									// 短名称:真实路径取最后一段;目录名形式(--Users-…--,无斜杠)按 - 取末段,
									// 保证目录名 key 也短显示为「… 名称」(显示层兜底,见 AGENTS.md §3.6/§2)
									const base = (() => {
										const clean = String(key).replace(/^--/, "").replace(/--$/, "");
										const seg = clean.split(/[\\/]/).filter(Boolean).pop();
										if (seg && seg !== clean) return seg;
										const parts = clean.split("-").filter(Boolean);
										return parts[parts.length - 1] || clean;
									})();
									const short = base === key ? key : "… " + base;
									const togglePath = () => {
										const next = new Set(expandedPaths);
										if (next.has(key)) next.delete(key); else next.add(key);
										setExpandedPaths(next);
									};
									return react.createElement("div", { key, className: "dsh-pc-pers-ws-item", "data-current": isCurrent },
										react.createElement("div", { className: "dsh-pc-pers-ws-head" },
											react.createElement("span", { className: "dsh-pc-pers-ws-path", title: key, onClick: togglePath }, expanded ? key : short),
											!isCurrent && react.createElement("span", { className: "dsh-pc-pers-ws-tag" }, t("ciWsFallback")),
											(wsMap[key] || "") !== "" && react.createElement("span", { className: "dsh-pc-pers-ws-tag", "data-configured": true }, t("ciWsConfigured"))
										),
										react.createElement("textarea", {
											value: wsDrafts[key] ?? "",
											spellCheck: false,
											placeholder: t("ciWsTextPlaceholder"),
											onChange: (e) => setWsDrafts({ ...wsDrafts, [key]: e.target.value })
										}),
										// 指令应用示例(仅当前工作区条目;点击展开紧凑预览)
										isCurrent && openWs && react.createElement("div", { className: "dsh-pc-pers-preview-inline" },
											react.createElement("div", { className: "dsh-pc-pers-preview-title" },
												react.createElement("span", null, t("ciPreviewTag") + " · " + (currentWs ? currentWs.split("/").pop() : "")),
												react.createElement("span", { className: "dsh-pc-pers-preview-tokens" }, t("ciPreviewTokens").replace("{{n}}", String(mergedTokens)))
											),
											(draft || "").trim() !== ""
												? react.createElement("div", { className: "dsh-pc-pers-preview-box" }, draft)
												: react.createElement("div", { className: "dsh-pc-pers-preview-empty" }, t("ciGlobalEmpty")),
											currentWsText && react.createElement("div", { className: "dsh-pc-pers-preview-ws" }, currentWsText)
										),
										react.createElement("div", { className: "dsh-pc-pers-ws-actions" },
											isCurrent && btn("dsh-pc-pers-preview-tag", t("ciPreviewTag") + (openWs ? " ▴" : " ▾"), () => setOpenWs(!openWs)),
											react.createElement("span", { className: "dsh-pc-pers-saved" + (wsSavedKey === key ? " show" : "") }, t("ciSavedShort")),
											btn("dsh-pc-pers-btn", t("clear"), () => onClearWs(key)),
											btn("dsh-pc-pers-btn dsh-pc-pers-btn-primary", t("save"), () => onSaveWs(key), wsSaving)
										)
									);
								})
							),
					// 工作区选择器:点击输入框/箭头即下拉;点外部(document mousedown + contains)立即关闭
					react.createElement("div", { className: "dsh-pc-pers-ws-picker", ref: pickerRef },
						react.createElement("input", {
							value: addPath,
							placeholder: t("ciWsPathPlaceholder"),
							onChange: (e) => setAddPath(e.target.value),
							onClick: () => setWsOpen(!wsOpen),
							onKeyDown: (e) => { if (e.key === "Enter") { setWsOpen(false); ensureWs(addPath); } }
						}),
						react.createElement("span", { className: "dsh-pc-pers-ws-caret", onClick: () => setWsOpen(!wsOpen) },
							react.createElement("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
								react.createElement("path", { d: "m6 9 6 6 6-6" })
							)
						),
						wsOpen && react.createElement("div", { className: "dsh-pc-pers-ws-menu" },
							discovered.map((p) => react.createElement("button", {
								key: p,
								className: "dsh-pc-pers-ws-opt",
								onClick: () => { setAddPath(p); setWsOpen(false); ensureWs(p); }
							}, p))
						)
					),
					// 指令模板库(并入本子区:添加/配置工作区时下方直接选模板)
					react.createElement("div", null,
						react.createElement("h3", { className: "dsh-pc-group" }, t("ciSubTpl")),
						react.createElement("p", { className: "dsh-pc-pers-desc" }, t("ciTplDesc")),
						react.createElement("div", { className: "dsh-pc-pers-tpl-list" },
							templates.map((tpl) => {
								const isBuiltin = String(tpl.id || "").startsWith("builtin-");
								// 内置模板按 UI 语言显示(英文 UI 下用英文版,其余用宿主下发内容)
								const en = isBuiltin && isEnLocale() ? BUILTIN_TPL_EN[tpl.id] : null;
								const name = en ? en.name : (tpl.name || "—");
								const desc = en ? en.desc : (tpl.desc || "");
								const text = en ? en.text : (tpl.text || "");
								const open = openTpls.has(tpl.id);
								return react.createElement("div", { key: tpl.id, className: "dsh-pc-pers-tpl-row" },
									react.createElement("div", { className: "dsh-pc-pers-tpl-row-text" },
										react.createElement("div", { className: "dsh-pc-pers-tpl-row-head" },
											react.createElement("span", { className: "dsh-pc-pers-tpl-row-name" }, name),
											!isBuiltin && react.createElement("span", { className: "dsh-pc-pers-tpl-badge" }, t("ciTplCustom"))
										),
										react.createElement("div", { className: "dsh-pc-pers-tpl-row-desc" }, desc),
										react.createElement("div", { className: "dsh-pc-pers-tpl-text", "data-open": open }, text)
									),
									react.createElement("div", { className: "dsh-pc-pers-tpl-row-actions" },
										btn("dsh-pc-pers-btn", open ? t("ciTplCollapse") : t("ciTplView"), () => {
											const next = new Set(openTpls);
											if (next.has(tpl.id)) next.delete(tpl.id); else next.add(tpl.id);
											setOpenTpls(next);
										}),
										btn("dsh-pc-pers-btn dsh-pc-pers-btn-primary", t("ciTplApplyWs"), () => onApplyTpl(text, "ws")),
										!isBuiltin && btn("dsh-pc-pers-btn", t("ciTplDelete"), () => onDeleteTpl(tpl.id))
									)
								);
							})
						),
						// 存为模板
						react.createElement("div", { className: "dsh-pc-pers-tpl-save" },
							react.createElement("input", {
								value: tplName,
								placeholder: t("ciTplName"),
								onChange: (e) => setTplName(e.target.value)
							}),
							btn("dsh-pc-pers-btn dsh-pc-pers-btn-primary", t("ciTplSaveAs"), onSaveAsTpl, !draft.trim()),
							tplSaved && react.createElement("span", { className: "dsh-pc-pers-saved show" }, t("saved"))
						)
					)
				)
			);
		}
		//#endregion

		//#region 模块: Token 用量·成本(CostEditor)
		function numOrNull(v) {
			if (v === "" || v === undefined || v === null) return null;
			const n = Number(v);
			return Number.isFinite(n) ? n : null;
		}

		/**
		 * 成本估算编辑器:每模型价格输入 + 峰谷 + 官方预设 + 增删保存。
		 * @param {{ t: (key: string) => string }} props
		 */
		function CostEditor({ t, onSaved }) {
			const [rows, setRows] = react.useState([]);
			const [saving, setSaving] = react.useState(false);
			const [saved, setSaved] = react.useState(false);
			const [addProvider, setAddProvider] = react.useState("");
			const [addModel, setAddModel] = react.useState("");

			react.useEffect(() => {
				Promise.all([
					fetch("/personal-center/pricing").then((r) => r.json()),
					fetch("/personal-center/stats").then((r) => r.json())
				]).then(([p, s]) => {
					const configured = p && p.prices && typeof p.prices === "object" ? p.prices : {};
					const used = Array.isArray(s && s.byModel) ? s.byModel : [];
					const map = new Map();
					for (const m of used) map.set(m.provider + "::" + m.model, { key: m.provider + "::" + m.model, provider: m.provider, model: m.model });
					for (const key of Object.keys(configured)) {
						if (!map.has(key)) {
							const [provider, model] = key.split("::");
							map.set(key, { key, provider, model });
						}
					}
					const out = [];
					for (const r of map.values()) {
						const cfg = configured[r.key];
						out.push({
							key: r.key, provider: r.provider, model: r.model,
							currency: cfg ? (cfg.currency === "usd" ? "usd" : "cny") : "cny",
							inputMiss: cfg && cfg.inputMiss !== null && cfg.inputMiss !== undefined ? String(cfg.inputMiss) : "",
							inputHit: cfg && cfg.inputHit !== null && cfg.inputHit !== undefined ? String(cfg.inputHit) : "",
							output: cfg && cfg.output !== null && cfg.output !== undefined ? String(cfg.output) : "",
							reasoning: cfg && cfg.reasoning !== null && cfg.reasoning !== undefined ? String(cfg.reasoning) : "",
							peak: !!(cfg && cfg.peak),
							peakMiss: cfg && cfg.peak && cfg.peak.inputMiss != null ? String(cfg.peak.inputMiss) : "",
							peakHit: cfg && cfg.peak && cfg.peak.inputHit != null ? String(cfg.peak.inputHit) : "",
							peakOut: cfg && cfg.peak && cfg.peak.output != null ? String(cfg.peak.output) : ""
						});
					}
					setRows(out);
				}).catch(() => {});
			}, []);

			const update = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

			const applyPresets = () => {
				setRows((rs) => rs.map((r) => {
					const found = Object.entries(PRICE_PRESETS).find(([k]) => k === r.key || k.endsWith("::" + r.model));
					if (!found) return r;
					const p = found[1];
					// 只填价格,不改用户的 provider/key(避免把 kimi 错改成 moonshot 等)
					return {
						...r,
						currency: p.currency,
						inputMiss: p.inputMiss != null ? String(p.inputMiss) : "",
						inputHit: p.inputHit != null ? String(p.inputHit) : "",
						output: p.output != null ? String(p.output) : "",
						reasoning: p.reasoning != null ? String(p.reasoning) : "",
						peak: !!p.peak,
						peakMiss: p.peak ? String(p.peak.inputMiss) : "",
						peakHit: p.peak ? String(p.peak.inputHit) : "",
						peakOut: p.peak ? String(p.peak.output) : ""
					};
				}));
			};

			const addRow = () => {
				const provider = addProvider.trim();
				const model = addModel.trim();
				if (!provider || !model) return;
				const key = provider + "::" + model;
				if (rows.some((r) => r.key === key)) return;
				setRows((rs) => [...rs, {
					key, provider, model, currency: "cny",
					inputMiss: "", inputHit: "", output: "", reasoning: "",
					peak: false, peakMiss: "", peakHit: "", peakOut: ""
				}]);
				setAddProvider("");
				setAddModel("");
			};

			const save = () => {
				const prices = {};
				for (const r of rows) {
					prices[r.key] = {
						currency: r.currency,
						inputMiss: numOrNull(r.inputMiss),
						inputHit: numOrNull(r.inputHit),
						output: numOrNull(r.output),
						reasoning: numOrNull(r.reasoning),
						peak: r.peak && numOrNull(r.peakMiss) !== null
							? { inputMiss: numOrNull(r.peakMiss), inputHit: numOrNull(r.peakHit), output: numOrNull(r.peakOut) }
							: null
					};
				}
				setSaving(true);
				fetch("/personal-center/pricing", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ prices })
				}).then((r) => r.json()).then((d) => {
					if (d && d.ok === false) throw new Error(d.error || "failed");
					setSaving(false);
					setSaved(true);
					setTimeout(() => setSaved(false), 1600);
					if (onSaved) onSaved(); // 价格变更后刷新统计(成本卡立即更新)
				}).catch(() => setSaving(false));
			};

			const cur = (c) => (c === "usd" ? t("costCurUsd") : t("costCurCny"));

			return react.createElement("div", { className: "dsh-pc-profile-cost" },
				react.createElement("p", { className: "dsh-pc-profile-cost-hint" }, t("costHint")),
				rows.length === 0 && react.createElement("p", { className: "dsh-pc-profile-cost-hint" }, t("costNoModels")),
				rows.map((r, i) => react.createElement("div", { key: r.key, className: "dsh-pc-profile-cost-model" },
						react.createElement("div", { className: "dsh-pc-profile-cost-model-head" },
							react.createElement("span", { className: "dsh-pc-profile-cost-key" }, r.key),
							react.createElement("button", { className: "dsh-pc-pers-button dsh-pc-pers-secondary", onClick: () => setRows((rs) => rs.filter((_, idx) => idx !== i)) }, t("costDelete")),
							react.createElement("label", null, t("costCurrency"),
								react.createElement("select", { value: r.currency, onChange: (e) => update(i, { currency: e.target.value }) },
									react.createElement("option", { value: "cny" }, "¥ CNY"),
									react.createElement("option", { value: "usd" }, "$ USD")
								)
							)
						),
						react.createElement("div", { className: "dsh-pc-profile-cost-row" },
							react.createElement("span", { className: "dsh-pc-profile-cost-tier" }, t("costOffpeak")),
							react.createElement("label", null, t("costInputMiss"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.inputMiss, onChange: (e) => update(i, { inputMiss: e.target.value }) })
							),
							react.createElement("label", null, t("costInputHit"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.inputHit, onChange: (e) => update(i, { inputHit: e.target.value }) })
							),
							react.createElement("label", null, t("costOutput"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.output, onChange: (e) => update(i, { output: e.target.value }) })
							)
						),
						react.createElement("div", { className: "dsh-pc-profile-cost-row" },
							react.createElement("label", { className: "dsh-pc-profile-cost-tier" },
								react.createElement("input", { type: "checkbox", checked: r.peak, onChange: (e) => update(i, { peak: e.target.checked }) }),
								t("costPeak")
							),
							react.createElement("label", null, t("costInputMiss"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.peakMiss, onChange: (e) => update(i, { peakMiss: e.target.value }) })
							),
							react.createElement("label", null, t("costInputHit"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.peakHit, onChange: (e) => update(i, { peakHit: e.target.value }) })
							),
							react.createElement("label", null, t("costOutput"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.peakOut, onChange: (e) => update(i, { peakOut: e.target.value }) })
							)
						)
					)),
					react.createElement("div", { className: "dsh-pc-profile-cost-addrow" },
						react.createElement("input", { list: "dsh-pc-provider-list", placeholder: t("costProvider"), value: addProvider, onChange: (e) => setAddProvider(e.target.value) }),
						react.createElement("datalist", { id: "dsh-pc-provider-list" },
							KNOWN_PROVIDERS.map((p) => react.createElement("option", { key: p, value: p }))
						),
						react.createElement("input", { list: "dsh-pc-profile-model-list", placeholder: t("costModel"), value: addModel, onChange: (e) => setAddModel(e.target.value) }),
						react.createElement("datalist", { id: "dsh-pc-profile-model-list" },
							suggestModels(addProvider).map((m) => react.createElement("option", { key: m, value: m }))
						),
						react.createElement("button", { className: "dsh-pc-pers-button dsh-pc-pers-secondary dsh-pc-profile-cost-addbtn", onClick: addRow }, t("costAdd"))
					),
					react.createElement("div", { className: "dsh-pc-pers-actions" },
						react.createElement("button", { className: "dsh-pc-pers-button dsh-pc-pers-secondary", onClick: applyPresets }, t("costPreset")),
						react.createElement("button", { className: "dsh-pc-pers-button dsh-pc-pers-primary", disabled: saving, onClick: save },
							saved ? t("costSaved") : t("costSave"))
					)
			);
		}
		//#endregion

		//#region 模块: 宠物(运行时 PetWidget/PetStatusPanel + 面板 PetPanel)
		// 行为参考 Codex 宠物规范:默认待机静止(单帧静态表情,不循环),悬停/点击才按当前情绪
		// 播放一次动作动画;拖拽自由定位并持久化;透明度实时可调。
		const PET_ASSET_BASE = "/personal-center/pet/assets/";
		const PET_SKINS = ["black-whale", "blue-whale"];
		/**
		 * 素材版本参数:素材更新(如黑鲸 V1→V2)时递增,URL 变化强制浏览器绕过
		 * immutable 缓存重新拉取(素材路径不变、内容变了,靠 ?v= 失效旧缓存)。
		 */
		const PET_ASSET_VER = "v5";
		/** 拼接素材 URL(带版本参数)。 */
		function petAsset(skin, kind, emotion) {
			return PET_ASSET_BASE + skin + "/" + kind + "/" + emotion + ".webp?v=" + PET_ASSET_VER;
		}
		/** enabled 归一化:旧 boolean 配置迁移为皮肤 id / 空("" = 全部关闭,互斥只能开一只)。 */
		function petNormalizeEnabled(v) {
			if (typeof v === "boolean") return v ? "black-whale" : "";
			return PET_SKINS.indexOf(v) >= 0 ? v : "";
		}
		const PET_EMOTIONS = ["happy", "busy", "exhausted", "money-pain", "dozing", "thinking", "waiting", "celebrate", "drag", "wave"];
		/** 动作动画播放时长(ms):6 帧 × (90~250ms) ≈ 0.7~1.5s/圈,播约 1.5~3 圈后回待机。 */
		const PET_ACTION_MS = 2200;
		/**
		 * 情绪阈值(内置,基于本机真实数据校准,见 docs/pet/DESKTOP-PET.md):
		 * 本机典型日 Token 0.1~5.1 亿、工具调用 88~1494 次、缓存命中 92~99.7%,
		 * 占位阈值(10万/50次)低 100~5000 倍会让鲸鱼永远「疲惫/忙碌」,故上调。
		 */
		const PET_THRESHOLDS = {
			happy_cache_rate: 0.7, // 缓存命中率 ≥70% → 开心(兜底基线;本机 92%+)
			busy_tool_calls: 400, // 今日工具调用 ≥400 次 → 忙碌(典型日 p50≈611)
			exhausted_tokens: 200000000, // 今日 Token ≥2 亿 → 疲惫(典型重活日 5 亿+)
			money_pain_cost: 10, // 今日成本 ≥¥10 → 钱包痛(需已配置价格)
			dozing_idle_minutes: 10 // 无活动 ≥10 分钟 → 打盹(PRD 原值)
		};

		/**
		 * 情绪判定。优先级:钱包痛 > 疲惫 > 忙碌 > 打盹 > 开心(兜底)。
		 * 注意:打盹先于开心判定——否则缓存命中率高的用户永远不睡(原组件 bug,移植时修正)。
		 */
		function petDetermineEmotion(stats, thresholds) {
			const t = { ...PET_THRESHOLDS, ...thresholds };
			const now = Date.now();
			if (stats.cost_today != null && stats.cost_today >= t.money_pain_cost) return "money-pain";
			if (stats.tokens_today != null && stats.tokens_today >= t.exhausted_tokens) return "exhausted";
			if (stats.tool_calls_today != null && stats.tool_calls_today >= t.busy_tool_calls) return "busy";
			if (stats.last_activity_at != null && (now - stats.last_activity_at) / 60000 >= t.dozing_idle_minutes) return "dozing";
			return "happy";
		}

		/** 情绪状态机(3 秒防抖,轮询 30s 时极少触发切换抖动)。
		 * 会话状态情绪(thinking/waiting/celebrate/...)优先级高于 stats 用量推断:
		 * 有会话活动时锁定,stats 的 update() 不覆盖;无会话活动时解锁,交回 stats 驱动。 */
		class PetEmotionMachine {
			constructor(thresholds, debounceMs) {
				this.thresholds = { ...PET_THRESHOLDS, ...thresholds };
				this.debounceMs = debounceMs;
				this.currentEmotion = "happy";
				this.pendingEmotion = null;
				this.debounceTimer = null;
				this.listeners = [];
				this.sessionEmotion = null; // 会话状态情绪(非空=锁定,stats 不覆盖)
			}
			update(stats) {
				// 会话状态情绪锁定期间,stats 轮询不覆盖(会话实时状态优先于用量推断)
				if (this.sessionEmotion !== null) return;
				const next = petDetermineEmotion(stats, this.thresholds);
				if (next === this.currentEmotion) {
					this.pendingEmotion = null;
					if (this.debounceTimer) {
						clearTimeout(this.debounceTimer);
						this.debounceTimer = null;
					}
					return;
				}
				if (next === this.pendingEmotion) return;
				this.pendingEmotion = next;
				if (this.debounceTimer) clearTimeout(this.debounceTimer);
				this.debounceTimer = setTimeout(() => {
					this.currentEmotion = this.pendingEmotion;
					this.pendingEmotion = null;
					this.debounceTimer = null;
					this._notify();
				}, this.debounceMs);
			}
			setEmotion(emotion) {
				if (PET_EMOTIONS.indexOf(emotion) < 0) return;
				if (this.debounceTimer) {
					clearTimeout(this.debounceTimer);
					this.debounceTimer = null;
				}
				this.pendingEmotion = null;
				this.currentEmotion = emotion;
				this._notify();
			}
			/** 会话状态情绪驱动:emo 非空 = 锁定(会话实时状态优先,stats 不覆盖);null = 解锁交回 stats。 */
			setSessionEmotion(emo) {
				if (emo === null) {
					this.sessionEmotion = null;
					return;
				}
				if (PET_EMOTIONS.indexOf(emo) < 0) return;
				this.sessionEmotion = emo;
				this.setEmotion(emo);
			}
			getCurrent() { return this.currentEmotion; }
			onChange(listener) {
				this.listeners.push(listener);
				return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
			}
			destroy() {
				if (this.debounceTimer) clearTimeout(this.debounceTimer);
				this.listeners = [];
			}
			_notify() {
				for (const l of this.listeners) {
					try { l(this.currentEmotion); } catch (e) { console.error("[dsh-pet] listener error:", e); }
				}
			}
		}

		/** 数字格式化(亿/万)。 */
		function petFmtNum(n, t) {
			if (typeof n !== "number" || !Number.isFinite(n)) return "0";
			const yi = t ? t("numYi") : "亿";
			const wan = t ? t("numWan") : "万";
			if (n >= 1e8) return (n / 1e8).toFixed(1) + yi;
			if (n >= 1e4) return (n / 1e4).toFixed(1) + wan;
			return String(n);
		}

		/**
		 * 黑鲸 PetWidget:常驻显示,平时静止待机(单帧静态表情);情绪变化/悬停/点击播放一次动作动画,
		 * 拖拽自由定位(拖到哪停哪,松手持久化)。纯 DOM 零依赖。
		 */
		class PetWidget {
			/**
			 * @param {Object} o
			 * @param {HTMLElement} o.container 挂载容器
			 * @param {string} o.position 默认角落:bottom-right 等(拖拽后由 posOverride 覆盖)
			 * @param {string} o.skin 皮肤:black-whale(黑鲸)/ blue-whale(蓝鲸)
			 * @param {Object} o.offset 角落偏移 {x, y}
			 * @param {string} o.size small/medium/large
			 * @param {number} o.opacity 0.3-1
			 * @param {Object} o.thresholds 阈值覆盖
			 * @param {number} o.debounceMs 情绪切换防抖
			 * @param {Object} o.posOverride 拖拽位置覆盖 {left, top}
			 * @param {(pos: {left:number, top:number}) => void} o.onPosChange 拖拽结束回调(持久化)
			 * @param {(key: string, vars?: Object) => string} o.bubbleT 气泡文案
			 * @param {(key: string) => string} o.t 文案(右键菜单用)
			 * @param {() => void} o.onHide 右键菜单隐藏
			 */
			constructor(o = {}) {
				this.options = {
					container: document.body,
					position: "bottom-right",
					skin: "black-whale",
					offset: { x: 32, y: 32 },
					size: "small",
					opacity: 1,
					thresholds: {},
					debounceMs: 3000,
					posOverride: null,
					onPosChange: null,
					bubbleT: (k) => k,
					t: (k) => k,
					onHide: null,
					onStatusToggle: null,
					onDrag: null,
					...o
				};
				this._machine = new PetEmotionMachine(this.options.thresholds, this.options.debounceMs);
				this._currentEmotion = null;
				this._acting = false; // 是否正在播动作动画
				this._actionTimer = null;
				this._imgKind = {}; // emotion -> "idle" | "animations"
				this._lastStats = {};
				this._hasStats = false;
				this._bubbleTimer = null;
				this._dragState = null;
				this._positionOverride = this.options.posOverride || null;
				this._overrideViewport = null; // 记录拖拽时的视口尺寸,用于窗口缩放时按比例跟随
				this._destroyed = false;
				this._buildDOM();
				this._buildMenu();
				this._bindEvents();
				this._applyPosition();
				this._machine.onChange((emotion) => this._switchEmotion(emotion));
				this._switchEmotion("happy");
			}

			updateState(stats) {
				if (this._destroyed) return;
				this._lastStats = { ...stats };
				this._hasStats = true;
				this._machine.update(stats);
			}

			setEmotion(emotion) {
				if (this._destroyed) return;
				this._machine.setEmotion(emotion);
			}

			/** 会话状态情绪驱动(锁定/解锁):非空锁定,stats 不覆盖;null 解锁。 */
			setSessionEmotion(emo) {
				if (this._destroyed) return;
				this._machine.setSessionEmotion(emo);
				// 解锁(会话空闲)时立即用最近 stats 恢复情绪(走 setEmotion 立即生效,不等 debounce/30s 轮询)
				if (emo === null && this._hasStats) {
					const next = petDetermineEmotion(this._lastStats, this._machine.thresholds);
					this._machine.setEmotion(next);
				}
			}

			/** 播放一次当前情绪的动作动画(悬停/点击触发),结束后回待机(睡觉)。 */
			playAction() {
				if (this._destroyed || !this._currentEmotion) return;
				this._acting = true;
				this._showImg(this._currentEmotion, "animations");
				if (this._actionTimer) clearTimeout(this._actionTimer);
				this._actionTimer = setTimeout(() => this._endAction(), PET_ACTION_MS);
			}

			/** 即时触发动画(如 wave 点击打招呼 / drag 拖拽):播指定动画后回待机,不动情绪机。 */
			playOnce(emotion) {
				if (this._destroyed) return;
				this._acting = true;
				this._showImg(emotion, "animations");
				if (this._actionTimer) clearTimeout(this._actionTimer);
				this._actionTimer = setTimeout(() => this._endAction(), PET_ACTION_MS);
			}

			_endAction() {
				this._actionTimer = null;
				this._acting = false;
				// 持续情绪(thinking/waiting/celebrate):播完动画保持对应 idle 帧;
				// 其余情绪:静止 = 睡觉(dozing)
				const emo = this._currentEmotion;
				const persistent = emo === "thinking" || emo === "waiting" || emo === "celebrate";
				this._showImg(persistent ? emo : "dozing", "idle");
			}

			showBubble(message, duration = 3000) {
				if (this._destroyed) return;
				this._bubbleEl.textContent = message;
				// 宠物靠近屏幕顶部时气泡翻到下方,避免溢出
				const rect = this._containerEl.getBoundingClientRect();
				this._bubbleEl.classList.toggle("below", rect.top < 110);
				this._bubbleEl.classList.add("visible");
				if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
				this._bubbleTimer = setTimeout(() => this._bubbleEl.classList.remove("visible"), duration);
			}

			hideBubble() {
				if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
				this._bubbleEl.classList.remove("visible");
			}

			/** 选角落(清掉拖拽位置);重置位置用 setPosition + 清 override。 */
			setPosition(position, offset) {
				if (position) this.options.position = position;
				if (offset) this.options.offset = { ...this.options.offset, ...offset };
				this._positionOverride = null;
				this._applyPosition();
			}

			setSize(size) {
				this._containerEl.classList.remove("size-small", "size-medium", "size-large");
				this._containerEl.classList.add("size-" + size);
				this.options.size = size;
			}

			setOpacity(opacity) {
				this._containerEl.style.opacity = opacity;
				this.options.opacity = opacity;
			}

			/** 会话状态开关:关闭时隐藏右上角「会话状态」按钮(无状态概览入口)。 */
			setSessionStatus(on) {
				this._containerEl.classList.toggle("pet-status-off", !on);
			}

			/** 切换皮肤(重载素材,保持待机/动作状态:动作中重载当前情绪动画,否则显示睡觉)。 */
			setSkin(skin) {
				if (PET_SKINS.indexOf(skin) < 0) return;
				this.options.skin = skin;
				this._imgKind = {}; // 强制按新皮肤重新加载
				if (this._acting && this._currentEmotion) this._showImg(this._currentEmotion, "animations");
				else this._showImg("dozing", "idle");
			}

			show() { this._containerEl.classList.remove("hidden"); }
			hide() { this._containerEl.classList.add("hidden"); }
			getCurrentEmotion() { return this._currentEmotion; }

			destroy() {
				if (this._destroyed) return;
				this._destroyed = true;
				if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
				if (this._actionTimer) clearTimeout(this._actionTimer);
				this._machine.destroy();
				this._unbindEvents();
				if (this._menuEl && this._menuEl.parentNode) this._menuEl.parentNode.removeChild(this._menuEl);
				if (this._containerEl.parentNode) this._containerEl.parentNode.removeChild(this._containerEl);
			}

			_buildDOM() {
				this._containerEl = document.createElement("div");
				this._containerEl.className = "dsh-pet-container size-" + this.options.size;
				this._containerEl.style.opacity = this.options.opacity;
				this._wrapperEl = document.createElement("div");
				this._wrapperEl.className = "dsh-pet-wrapper";
				this._imgEls = {};
				for (const emotion of PET_EMOTIONS) {
					const img = document.createElement("img");
					img.className = "dsh-pet-img";
					img.dataset.emotion = emotion;
					img.alt = emotion;
					img.draggable = false;
					// src 由 _setImg 按待机/动作切换
					this._wrapperEl.appendChild(img);
					this._imgEls[emotion] = img;
				}
				this._bubbleEl = document.createElement("div");
				this._bubbleEl.className = "dsh-pet-bubble";
				this._containerEl.appendChild(this._bubbleEl);
				this._containerEl.appendChild(this._wrapperEl);
				// 右上角「会话状态」入口按钮:悬停显示,点击展开状态面板(不触发宠物整体点击/拖拽)
				this._statusBtnEl = document.createElement("div");
				this._statusBtnEl.className = "dsh-pet-status-btn";
				this._statusBtnEl.textContent = this.options.t("petStatusBtn");
				this._containerEl.appendChild(this._statusBtnEl);
				this.options.container.appendChild(this._containerEl);
			}

			/** 右键快捷菜单(隐藏宠物;尺寸已固定为 S,不再提供)。 */
			_buildMenu() {
				const t = this.options.t;
				const menu = document.createElement("div");
				menu.className = "dsh-pet-menu";
				const hide = document.createElement("div");
				hide.className = "dsh-pet-menu-item";
				hide.textContent = t("petMenuHide");
				hide.addEventListener("click", () => {
					this._closeMenu();
					if (this.options.onHide) this.options.onHide();
				});
				menu.appendChild(hide);
				this._menuEl = menu;
				document.body.appendChild(this._menuEl);
			}

			_openMenu(x, y) {
				if (!this._menuEl) return;
				// 先显示再量宽(display:none 时 offsetWidth 为 0),确保右缘精确对齐宠物右缘
				this._menuEl.classList.add("open");
				this._repositionMenu();
			}

			/** 按宠物当前位置重定位右键菜单(打开时 + 拖拽中,菜单跟随宠物)。 */
			_repositionMenu() {
				if (!this._menuEl || !this._menuEl.classList.contains("open")) return;
				const rect = this._containerEl.getBoundingClientRect();
				const menuW = this._menuEl.offsetWidth || 88;
				this._menuEl.style.left = Math.max(0, Math.min(rect.right - menuW, window.innerWidth - menuW)) + "px";
				// 菜单紧贴宠物容器底边下 2px(不压身体、不远离)
				this._menuEl.style.top = Math.max(0, Math.min(rect.bottom + 2, window.innerHeight - 60)) + "px";
			}

			_closeMenu() {
				if (this._menuEl) this._menuEl.classList.remove("open");
			}

			_bindEvents() {
				this._onClick = (e) => {
					if (this._dragState && this._dragState.moved) return;
					this._containerEl.classList.add("clicked");
					setTimeout(() => this._containerEl.classList.remove("clicked"), 300);
					this.playOnce("wave");
					// 点宠物本体:只播动作;面板打开时不弹数据气泡(聚焦会话概览),关闭时才弹
					if (!petStatusPanel) this.showBubble(this._pickBubble());
				};
				this._containerEl.addEventListener("click", this._onClick);
				// 右上角「会话状态」按钮:点击展开状态面板,不触发宠物整体点击/拖拽
				this._onStatusBtnClick = (e) => {
					e.stopPropagation();
					e.preventDefault();
					if (this.options.onStatusToggle) {
						const wasOpen = !!petStatusPanel;
						this.options.onStatusToggle();
						if (wasOpen) {
							// 关闭面板:恢复数据气泡
							this.showBubble(this._pickBubble());
						} else {
							// 打开面板:隐藏 Token 气泡,聚焦会话概览(底边对齐原气泡位置)
							this.hideBubble();
						}
					}
				};
				this._statusBtnEl.addEventListener("click", this._onStatusBtnClick);
				// 悬停逗弄:进入时按当前情绪播一次动作(参考 Codex:逗它才动)
				this._onEnter = () => this.playAction();
				this._containerEl.addEventListener("pointerenter", this._onEnter);
				this._onContextMenu = (e) => {
					e.preventDefault();
					e.stopPropagation();
					this._openMenu(e.clientX, e.clientY);
				};
				this._containerEl.addEventListener("contextmenu", this._onContextMenu);
				this._onDocClick = () => this._closeMenu();
				document.addEventListener("click", this._onDocClick);
				if (this.options.draggable !== false) {
					this._onPointerDown = (e) => this._startDrag(e);
					this._containerEl.addEventListener("pointerdown", this._onPointerDown);
				}
				// 窗口尺寸变化 → 重新应用定位(拖拽过的宠物被重新钳回视口内,避免缩窗后被裁掉/找不到)
				this._onResize = () => this._applyPosition();
				window.addEventListener("resize", this._onResize);
			}

			_unbindEvents() {
				this._containerEl.removeEventListener("click", this._onClick);
				if (this._onStatusBtnClick) this._statusBtnEl.removeEventListener("click", this._onStatusBtnClick);
				if (this._onEnter) this._containerEl.removeEventListener("pointerenter", this._onEnter);
				if (this._onContextMenu) this._containerEl.removeEventListener("contextmenu", this._onContextMenu);
				if (this._onDocClick) document.removeEventListener("click", this._onDocClick);
				if (this._onPointerDown) this._containerEl.removeEventListener("pointerdown", this._onPointerDown);
				if (this._onPointerMove) document.removeEventListener("pointermove", this._onPointerMove);
				if (this._onPointerUp) document.removeEventListener("pointerup", this._onPointerUp);
				if (this._onPointerCancel) document.removeEventListener("pointercancel", this._onPointerCancel);
				if (this._onResize) window.removeEventListener("resize", this._onResize);
			}

			_pickBubble() {
				if (!this._hasStats) return this.options.bubbleT("petBubbleLoading");
				const s = this._lastStats;
				const pool = [];
				if (typeof s.tokens_today === "number") pool.push(this.options.bubbleT("petBubbleTokens", { tokens: petFmtNum(s.tokens_today, this.options.bubbleT) }));
				if (typeof s.cache_hit_rate === "number") pool.push(this.options.bubbleT("petBubbleCache", { rate: Math.round(s.cache_hit_rate * 100) }));
				if (s.top_tool) pool.push(this.options.bubbleT("petBubbleTools", { tool: s.top_tool }));
				if (typeof s.cost_today === "number" && s.cost_today > 0) pool.push(this.options.bubbleT(s.cost_currency === "usd" ? "petBubbleCostUsd" : "petBubbleCost", { cost: s.cost_today.toFixed(2) }));
				if (pool.length === 0) return this.options.bubbleT("petBubbleIdle");
				return pool[Math.floor(Math.random() * pool.length)];
			}

			_startDrag(e) {
				e.preventDefault();
				// 拖拽时:停动作计时器,播 drag 动画并保持(拖拽过程持续显示)
				if (this._actionTimer) {
					clearTimeout(this._actionTimer);
					this._actionTimer = null;
				}
				this._acting = true;
				this._showImg("drag", "animations");
				const rect = this._containerEl.getBoundingClientRect();
				this._dragState = {
					startX: e.clientX,
					startY: e.clientY,
					offsetX: e.clientX - rect.left,
					offsetY: e.clientY - rect.top,
					moved: false
				};
				this._containerEl.classList.add("dragging");
				this._onPointerMove = (ev) => this._onDrag(ev);
				this._onPointerUp = () => this._endDrag();
				this._onPointerCancel = () => this._endDrag();
				document.addEventListener("pointermove", this._onPointerMove);
				document.addEventListener("pointerup", this._onPointerUp);
				document.addEventListener("pointercancel", this._onPointerCancel);
			}

			_onDrag(e) {
				if (!this._dragState) return;
				const dx = e.clientX - this._dragState.startX;
				const dy = e.clientY - this._dragState.startY;
				if (Math.abs(dx) > 4 || Math.abs(dy) > 4) this._dragState.moved = true;
				const w = this._containerEl.offsetWidth;
				const h = this._containerEl.offsetHeight;
				const x = Math.max(0, Math.min(window.innerWidth - w, e.clientX - this._dragState.offsetX));
				const y = Math.max(0, Math.min(window.innerHeight - h, e.clientY - this._dragState.offsetY));
				this._positionOverride = { left: x, top: y };
				this._overrideViewport = { w: window.innerWidth, h: window.innerHeight };
				this._applyPosition();
				// 拖拽中同步通知外部(会话概览面板跟随宠物移动)+ 右键菜单跟随
				if (this.options.onDrag) this.options.onDrag();
				this._repositionMenu();
			}

			_endDrag() {
				if (!this._dragState) return;
				this._containerEl.classList.remove("dragging");
				document.removeEventListener("pointermove", this._onPointerMove);
				document.removeEventListener("pointerup", this._onPointerUp);
				document.removeEventListener("pointercancel", this._onPointerCancel);
				this._dragState = null;
				// 拖拽结束:持续情绪(thinking/waiting)回对应 idle 帧;其余回待机(睡觉)
				this._acting = false;
				const emo = this._currentEmotion;
				const persistent = emo === "thinking" || emo === "waiting";
				this._showImg(persistent ? emo : "dozing", "idle");
				if (this._positionOverride && this.options.onPosChange) {
					this.options.onPosChange({ left: this._positionOverride.left, top: this._positionOverride.top });
				}
			}

			_applyPosition() {
				this._containerEl.style.bottom = "";
				this._containerEl.style.top = "";
				this._containerEl.style.left = "";
				this._containerEl.style.right = "";
				if (this._positionOverride) {
					// 按比例跟随窗口:以拖拽时的视口尺寸为基准,resize 时按比例缩放,
					// 缩小/拉大都跟随(不再用钳制值覆盖原始位置导致拉大后固定)。
					const vp = this._overrideViewport || { w: window.innerWidth, h: window.innerHeight };
					const sx = vp.w > 0 ? window.innerWidth / vp.w : 1;
					const sy = vp.h > 0 ? window.innerHeight / vp.h : 1;
					const w = this._containerEl.offsetWidth;
					const h = this._containerEl.offsetHeight;
					const left = Math.max(0, Math.min(window.innerWidth - w, this._positionOverride.left * sx));
					const top = Math.max(0, Math.min(window.innerHeight - h, this._positionOverride.top * sy));
					this._containerEl.style.left = left + "px";
					this._containerEl.style.top = top + "px";
					return;
				}
				const { position, offset } = this.options;
				const [vertical, horizontal] = position.split("-");
				this._containerEl.style[vertical] = offset.y + "px";
				this._containerEl.style[horizontal] = offset.x + "px";
			}

			/** 设置某情绪的图源:kind = "idle"(静态待机)| "animations"(动作动画)。按当前皮肤取素材。 */
			_setImg(emotion, kind) {
				const img = this._imgEls[emotion];
				if (!img || this._imgKind[emotion] === kind) return;
				this._imgKind[emotion] = kind;
				img.src = petAsset(this.options.skin, kind, emotion);
			}

			/** 激活指定情绪的 img 并设置图源;其余 img 取消激活。 */
			_showImg(emotion, kind) {
				for (const key of Object.keys(this._imgEls)) {
					this._imgEls[key].classList.toggle("active", key === emotion);
				}
				this._setImg(emotion, kind);
			}

			_switchEmotion(emotion) {
				if (emotion === this._currentEmotion) return;
				const prev = this._currentEmotion;
				this._currentEmotion = emotion;
				// 持续情绪(thinking/waiting/celebrate):静止时保持对应 idle 帧,不被拉回睡觉;
				// 其余情绪:静止显示睡觉(dozing),动作时播对应动画
				const persistent = emotion === "thinking" || emotion === "waiting" || emotion === "celebrate";
				this._showImg(this._acting ? emotion : (persistent ? emotion : "dozing"), this._acting ? "animations" : "idle");
				this._containerEl.classList.remove("emotion-" + prev);
				this._containerEl.classList.add("emotion-" + emotion);
				// 持续情绪:播一次动画后保持 idle 帧;瞬时情绪:播完回睡觉
				this.playAction();
			}
		}

		/** HTML 转义(会话标题来自外部,防注入)。 */
		function petEscHtml(s) {
			return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
		}

		/** 取文件路径末段(「a/b/new-work.md」→「new-work.md」)。 */
		function petBaseName(p) {
			if (!p) return "";
			const s = String(p).replace(/\\/g, "/");
			return s.split("/").pop() || s;
		}

		/**
		 * 回落「运行中」判定:list 投影 byId 的 entry.running 是规格指定的唯一运行来源,
		 * 但实测对真正在跑的会话(尤其子代理/后台会话)可能未置位/未及时更新,导致
		 * 面板与情绪同步器把正在跑的会话判成待机。per-session 快照的 pending(等你响应)
		 * 与 runningCalls(工具执行中)是可靠的活跃信号,且 per-session subscribe 已驱动
		 * 重渲染——据此作为 entry.running 之外的回落。注意:「thinking」(无 pending 且无
		 * runningCalls)仍依赖 entry.running。
		 */
		function petSessionActive(s) {
			if (!s) return false;
			const snap = s.getSnapshot();
			if (!snap) return false;
			if (Array.isArray(snap.pending) && snap.pending.length > 0) return true;
			if (Array.isArray(snap.runningCalls) && snap.runningCalls.length > 0) return true;
			return false;
		}

		/**
		 * 宠物状态概览:毛玻璃浮层面板。点宠物 toggle,点面板外/ESC 关闭,无关闭按钮。
		 * 数据全部来自平台已有投影(ctx.get("sessions") 的 list + per-session notifier),
		 * 事件驱动订阅,零轮询;关闭即退订并销毁 DOM(轻量约束)。
		 * 状态判定优先级:失败(lastAgentError 真实失败)> 运行中 > 已完成 > 待机,
		 * 失败绝不伪装成功。状态变化时弹气泡(3.5s)并映射宠物情绪(失败>运行中>完成>空闲)。
		 */
		class PetStatusPanel {
			constructor(o) {
				this.sessions = o.sessions; // SessionRuntime(ctx.get("sessions"))
				this.t = o.t;
				this.pet = o.pet; // petWidget
				this.el = null;
				this.listUnsub = null;
				this.sessionUnsubs = new Map(); // sessionId -> unsub
				this.docUnsubs = [];
				this.lastKey = null;
				this.lastListHtml = null;
				this._build();
				this._subscribe();
				this._render();
			}

			_build() {
				const t = this.t;
				const el = document.createElement("div");
				el.className = "dsh-pet-status open";
				el.innerHTML =
					'<div class="dsh-pet-status-head">' +
					'<span class="dsh-pet-status-title">' + t("petStatusTitle") + "</span>" +
					'<div class="dsh-pet-status-sum">' +
					'<span class="running">' + t("petStatusSumRunning") + "<b>0</b></span>" +
					'<span class="failed">' + t("petStatusSumFailed") + "<b>0</b></span>" +
					'<span class="done">' + t("petStatusSumDone") + "<b>0</b></span>" +
					"</div></div><div class=\"dsh-pet-status-list\"></div>";
				document.body.appendChild(el);
				this.el = el;
				this.sumEls = {
					running: el.querySelector(".running"),
					failed: el.querySelector(".failed"),
					done: el.querySelector(".done")
				};
				this.listEl = el.querySelector(".dsh-pet-status-list");
				// 注:不在此定位 —— _render() 填充列表后统一调 position(),避免用未渲染的高度误定位
			}

			/** 锚定宠物:优先上方(底边对齐气泡底边),放不下则下方,均钳制在屏幕内。 */
			position() {
				if (!this.el || !this.pet) return;
				const rect = this.pet._containerEl.getBoundingClientRect();
				const w = this.el.offsetWidth || 256;
				// 靠右对齐宠物(右缘对齐宠物右缘),与气泡/右键菜单统一
				const left = Math.max(8, Math.min(window.innerWidth - w - 8, rect.right - w));
				this.el.style.left = left + "px";
				const h = this.el.offsetHeight || 0;
				this.el.style.bottom = "auto";
				// 上方:面板底边 = 宠物顶部往上 12px(对齐原 Token 气泡底边)
				if (rect.top - 12 - h >= 8) {
					this.el.style.top = rect.top - 12 - h + "px";
				} else {
					// 下方:面板顶部 = 宠物底部往下 12px,并钳制不超出屏幕底部
					const topBelow = Math.min(rect.bottom + 12, window.innerHeight - h - 8);
					this.el.style.top = Math.max(8, topBelow) + "px";
				}
			}

			_subscribe() {
				this.listUnsub = this.sessions.list.subscribe(() => {
					this._resyncSessions();
					this._render();
				});
				this._resyncSessions();
				// 打开面板:点外部关闭、ESC 关闭(无关闭按钮)
				this._onDocPointer = (e) => {
					const inPet = this.pet && this.pet._containerEl.contains(e.target);
					const inPanel = this.el.contains(e.target);
					if (!inPet && !inPanel) petStatusClose();
				};
				this._onKey = (e) => { if (e.key === "Escape") petStatusClose(); };
				document.addEventListener("pointerdown", this._onDocPointer, true);
				document.addEventListener("keydown", this._onKey);
				// 双击会话行 → 切换到对应会话(复用平台 sessions.open,与左侧工作区点会话一致),然后关闭面板
				this._onListDblClick = (e) => {
					const row = e.target && e.target.closest ? e.target.closest(".dsh-pet-status-item") : null;
					if (!row) return;
					const sid = row.getAttribute("data-sid");
					if (!sid) return;
					try {
						if (typeof this.sessions.open === "function") this.sessions.open(sid);
					} catch (err) { /* 未知/异常会话:忽略 */ }
					petStatusClose();
				};
				this.listEl.addEventListener("dblclick", this._onListDblClick);
				this.docUnsubs = [
					() => document.removeEventListener("pointerdown", this._onDocPointer, true),
					() => document.removeEventListener("keydown", this._onKey),
					() => this.listEl.removeEventListener("dblclick", this._onListDblClick)
				];
			}

			/** 会话集合变化(list 更新)时,同步 per-session 订阅(新会话订阅、消失的退订)。 */
			_resyncSessions() {
				const snap = this.sessions.list.getSnapshot();
				const ids = new Set(snap.ids || []);
				for (const [id, unsub] of this.sessionUnsubs) {
					if (!ids.has(id)) { unsub(); this.sessionUnsubs.delete(id); }
				}
				for (const id of ids) {
					if (this.sessionUnsubs.has(id)) continue;
					const s = this.sessions.manager.get(id);
					if (!s) continue;
					this.sessionUnsubs.set(id, s.subscribe(() => this._render()));
					// 关键:open() 拉取历史组装 nodes(含 tool-call 动作),否则 nodes 恒为空、
					// 动作文案永不出现。幂等,且不动 UI 当前选中会话。
					if (typeof s.open === "function") s.open();
				}
			}

			/** 从 runningCalls 提取最后一条运行中工具的动作文案(如「正在读取 new-work.md」)。
			 * 真实结构:getSnapshot().runningCalls 是数组,元素 {name, argsRaw, callId, ...};
			 * 运行中的工具在 runningCalls(已完成才进 nodes),故必须读 runningCalls。 */
			_actionOf(s) {
				if (!s) return null;
				const snap = s.getSnapshot();
				const calls = (snap && snap.runningCalls) || [];
				if (calls.length === 0) return null;
				const last = calls[calls.length - 1];
				const t = this.t;
				const name = last.name || "";
				let args = {};
				try { args = typeof last.argsRaw === "string" ? JSON.parse(last.argsRaw) : (last.argsRaw || {}); } catch (e) { /* 参数解析失败:回落调用中 */ }
				const file = args.file_path || args.path;
				if (name === "read") return { text: t("petStatusActionRead", { file: petBaseName(file) }), raw: name };
				if (name === "write") return { text: t("petStatusActionWrite", { file: petBaseName(file) }), raw: name };
				if (name === "edit") return { text: t("petStatusActionEdit", { file: petBaseName(file) }), raw: name };
				if (name === "bash") {
					const cmd = String(args.command || "").slice(0, 24);
					return { text: t("petStatusActionBash", { cmd }), raw: name };
				}
				if (name === "web_search") return { text: t("petStatusActionSearch"), raw: name };
				return { text: t("petStatusActionUnknown", { tool: name }), raw: name };
			}

			/** 标题截断:最多 8 个字符,超出加省略号。 */
			_shortTitle(t) {
				const s = String(t || "");
				return s.length > 8 ? s.slice(0, 8) + "…" : s;
			}

			/** 投影:失败(lastAgentError)> 运行中(带动作文案)> 已完成 > 待机。 */
			_project() {
				const snap = this.sessions.list.getSnapshot();
				// 归档会话不展示(与左侧工作区一致);一次性构建 Set,避免每行重复读取
				const archived = petArchivedSet();
				const rows = [];
				for (const id of snap.ids || []) {
					const entry = snap.byId[id];
					if (!entry) continue;
					// 子代理子会话不展示(与左侧工作区一致:session.origin !== "subagent"),
					// 它们无法用 sessions.open 直接跳转,列出会误导
					if (entry.origin === "subagent") continue;
					if (archived.has(id)) continue;
					// 空白会话(无内容)不展示:其 displayTitle 会兜底成项目目录名(如「02_dsh-personal-center_个人配置」),
					// 观感像把项目当成对话,过滤之。
					if (entry.blank) continue;
					const s = this.sessions.manager.get(id);
					const failed = !!(s && s.getSnapshot().lastAgentError);
					let status = "idle";
					if (failed) status = "failed";
					else if (entry.running || petSessionActive(s)) status = "running";
					else if (entry.completed) status = "done";
					// running 子状态:waiting(等你响应)> thinking(思考中,无工具调用)> working(工具执行中)
					let subStatus = null;
					if (status === "running" && s) {
						const snap = s.getSnapshot();
						if (snap && Array.isArray(snap.pending) && snap.pending.length > 0) subStatus = "waiting";
						else if (this._actionOf(s) === null) subStatus = "thinking";
						else subStatus = "working";
					}
					rows.push({
						id,
						title: this._shortTitle(entry.displayTitle || id),
						status,
						subStatus,
						action: status === "running" ? this._actionOf(s) : null
					});
				}
				return rows;
			}

			_render() {
				if (!this.el) return;
				const rows = this._project();
				// 列表渲染全部(非归档)会话,容器限高 220px 内滚动;先按状态优先级排序:
				// 运行中/失败置顶,保证活跃会话始终在可见区。排序只影响展示顺序,不影响摘要计数。
				const rank = { running: 0, failed: 1, done: 2, idle: 3 };
				rows.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
				const run = rows.filter((r) => r.status === "running").length;
				const fail = rows.filter((r) => r.status === "failed").length;
				const done = rows.filter((r) => r.status === "done").length;
				this.sumEls.running.querySelector("b").textContent = run;
				this.sumEls.failed.querySelector("b").textContent = fail;
				this.sumEls.done.querySelector("b").textContent = done;
				// 数值为 0 的摘要项不显示(进行中/失败/完成只露有值的),避免 0 干扰用户
				this.sumEls.running.style.display = run > 0 ? "" : "none";
				this.sumEls.failed.style.display = fail > 0 ? "" : "none";
				this.sumEls.done.style.display = done > 0 ? "" : "none";
				const t = this.t;
				const html = rows.length === 0
					? '<div class="dsh-pet-status-empty">' + t("petStatusEmpty") + "</div>"
					: rows.map((r) =>
						'<div class="dsh-pet-status-item" data-sid="' + r.id + '" title="' + t("petStatusOpenHint") + '"><span class="dsh-pet-status-dot" style="background:' +
						(r.status === "running" ? "var(--dsw-alias-state-business-primary)" : r.status === "failed" ? "var(--dsw-alias-state-error-primary)" : r.status === "done" ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-tertiary)") +
						'"></span><span class="dsh-pet-status-name">' + petEscHtml(r.title) + "</span>" +
						(r.action ? '<span class="dsh-pet-status-action">' + petEscHtml(r.action.text) + "</span>" : "") +
						'<span class="dsh-pet-status-st ' + r.status + '">' +
						(r.status === "running" ? t("petStatusRunning") : r.status === "failed" ? t("petStatusFailed") : r.status === "done" ? t("petStatusReady") : t("petStatusIdle")) +
						"</span></div>"
					).join("");
				// 列表内容没变则不重建 innerHTML,避免鼠标悬停的背景因 DOM 反复替换而闪烁
				if (html !== this.lastListHtml) {
					this.lastListHtml = html;
					this.listEl.innerHTML = html;
				}
				// 状态分布变化 → 情绪映射
				const waiting = rows.filter((r) => r.subStatus === "waiting").length;
				const thinking = rows.filter((r) => r.subStatus === "thinking").length;
				const key = fail + ":" + run + ":" + done + ":" + waiting + ":" + thinking;
				if (key !== this.lastKey) {
					this.lastKey = key;
					this._announce(fail, run, done, { waiting, thinking });
				}
				this.position();
			}

			_announce(fail, run, done, sub) {
				// 状态已在面板列表内完整展示,不再额外弹状态气泡。
				// 情绪映射已由常驻同步器(petStatusEmotionSync)统一驱动,面板内不再重复设置,
				// 避免与 stats 轮询/会话锁产生竞争。
			}

			destroy() {
				if (this.listUnsub) this.listUnsub();
				for (const unsub of this.sessionUnsubs.values()) unsub();
				this.sessionUnsubs.clear();
				for (const off of this.docUnsubs) off();
				this.docUnsubs = [];
				if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
				this.el = null;
			}
		}

		// 宠物全局控制器(工厂作用域共享:启动挂载 + 设置面板调用)
		let petWidget = null;
		let petPollTimer = null;
		let petConfig = { enabled: "black-whale", skin: "black-whale", size: "medium", position: "bottom-right", posOverride: null, opacity: 1, sessionStatus: true };
		let petLastStats = null;
		let petBubbleT = (k) => k;

		// 宠物配置持久化串行队列:宿主端 POST 是"读-改-写",并发会互相覆盖字段
		// (如面板 opacity 归一 + 拖拽 posOverride 同时发生)。排队串行保证不丢。
		let petPersistQueue = Promise.resolve();

		function petPersist(patch) {
			const task = petPersistQueue.then(() => fetch("/personal-center/pet", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(patch)
			}).then((r) => r.json()).then((d) => {
				if (!d || d.ok === false) throw new Error(d && d.error ? d.error : "failed");
			}));
			petPersistQueue = task.catch(() => {});
			return task;
		}

		/** stats → 宠物字段(只取聚合数字,不读正文)。 */
		function petMapStats(d) {
			const today = d.today || {};
			const total = d.total || {};
			const cost = (d.cost && d.cost.today) || {};
			return {
				cache_hit_rate: typeof total.cacheHitRate === "number" ? total.cacheHitRate : null,
				tool_calls_today: today.toolCalls || 0,
				tokens_today: today.tokens || 0,
				cost_today: cost.cny != null ? cost.cny : cost.usd != null ? cost.usd : null,
				cost_currency: cost.cny != null ? "cny" : cost.usd != null ? "usd" : "cny",
				last_activity_at: d.sessions && d.sessions.length ? d.sessions[0].lastTime : null,
				top_tool: d.tools && d.tools.length ? d.tools[0].name : null
			};
		}

		/** 拉取统计并喂给宠物;接口失败保留上一状态(验收标准)。 */
		function petFetchStats() {
			if (!petWidget) return;
			fetch("/personal-center/stats")
				.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
				.then((d) => {
					if (!d || d.ok === false) return;
					const mapped = petMapStats(d);
					petLastStats = mapped;
					petWidget.updateState(mapped);
				})
				.catch(() => { /* 静默:保留上一状态 */ });
		}

		function petMount() {
			if (petWidget || !petConfig.enabled) return;
			petWidget = new PetWidget({
				container: document.body,
				position: "bottom-right",
				skin: petConfig.enabled, // 启用的宠物即当前皮肤(互斥:只会有一只)
				size: "small",
				opacity: petConfig.opacity,
				posOverride: petConfig.posOverride,
				onPosChange: (pos) => {
					petConfig.posOverride = pos;
					petPersist({ posOverride: pos }).catch(() => {});
				},
				bubbleT: petBubbleT,
				t: petBubbleT,
				onHide: petHide,
				onStatusToggle: petStatusToggle,
				onDrag: () => { if (petStatusPanel) petStatusPanel.position(); }
			});
			petFetchStats();
			petPollTimer = setInterval(petFetchStats, 30000);
			// 按「会话状态」开关应用:是否显示状态概览按钮 + 常驻会话情绪同步(thinking/waiting/celebrate 不依赖面板打开)
			petApplySessionStatus();
		}

		function petUnmount() {
			if (petPollTimer) {
				clearInterval(petPollTimer);
				petPollTimer = null;
			}
			if (petStatusEmotionUnsub) {
				petStatusEmotionUnsub();
				petStatusEmotionUnsub = null;
			}
			if (petWidget) {
				petWidget.destroy();
				petWidget = null;
			}
			petStatusClose();
		}

		// 状态概览控制器:点宠物 toggle,关闭即销毁(轻量约束:空闲零开销)
		let petStatusPanel = null;
		let petStatusSessions = null; // apply 时注入的 sessions 服务(状态概览数据源)
		let petStatusWorkspaces = null; // apply 时注入的 workspaces 服务(归档集合来源)

		/** 归档会话 id 集合(workspaces.list 维护;面板列表与宠物情绪同步据此排除归档会话)。 */
		function petArchivedSet() {
			const ws = petStatusWorkspaces;
			const snap = ws && ws.list && typeof ws.list.getSnapshot === "function" ? ws.list.getSnapshot() : null;
			return new Set((snap && snap.archivedSessionIds) || []);
		}

		// 常驻会话情绪同步器:宠物启用时订阅 sessions.list,实时映射情绪喂给宠物
		// (thinking/waiting/celebrate 不依赖面板打开,脱离 _announce 的面板专属触发)。
		let petStatusEmotionUnsub = null;
		let petPrevRunning = new Map(); // sessionId -> 上一帧 running 状态(检测完成下降沿)

		/** 计算当前会话状态应驱动的宠物情绪(失败 > 等你响应 > 思考中 > 忙碌)。
		 * 注:celebrate(完成庆祝)不在此返回 —— completed 标志对「当前选中会话」不置位,
		 * 改为由 running 下降沿(running true→false)在 sync 里瞬时触发。 */
		function petStatusEmotionOf() {
			if (!petStatusSessions) return null;
			const snap = petStatusSessions.list.getSnapshot();
			const rows = snap.ids || [];
			const archived = petArchivedSet(); // 归档会话不驱动宠物情绪
			let failed = 0, running = 0, waiting = 0, thinking = 0;
			for (const id of rows) {
				const entry = snap.byId[id];
				if (!entry || entry.blank) continue;
				if (archived.has(id)) continue;
				const s = petStatusSessions.manager.get(id);
				const ssnap = s && s.getSnapshot();
				if (entry.running || petSessionActive(s)) {
					running += 1;
					if (ssnap && Array.isArray(ssnap.pending) && ssnap.pending.length > 0) waiting += 1;
					else {
						const calls = (ssnap && ssnap.runningCalls) || [];
						if (calls.length === 0) thinking += 1;
					}
				}
				if (ssnap && ssnap.lastAgentError) failed += 1;
			}
			if (failed > 0) return "exhausted";
			if (waiting > 0) return "waiting";
			if (thinking > 0) return "thinking";
			if (running > 0) return "busy";
			return null; // 无会话活动:解锁,交回 stats 用量驱动
		}

		/** 订阅/退订常驻会话情绪同步。宠物挂载时启用,卸载时清理。
		 * 有会话活动 → setSessionEmotion 锁定(会话实时状态优先,stats 不覆盖);
		 * 无会话活动 → setSessionEmotion(null) 解锁;
		 * running 下降沿(prev=true→now=false 且无 failed)→ playOnce("celebrate") 瞬时庆祝。 */
		function petStatusEmotionSync() {
			if (petStatusEmotionUnsub) { petStatusEmotionUnsub(); petStatusEmotionUnsub = null; }
			petPrevRunning = new Map();
			if (!petStatusSessions || !petWidget) return;
			const apply = () => {
				const snap = petStatusSessions.list.getSnapshot();
				const ids = snap.ids || [];
				const archived = petArchivedSet(); // 归档会话不参与情绪/庆祝下降沿
				const nowRunning = new Map();
				let celebrate = false; // 完成下降沿(延后到最后播,避免被 setSessionEmotion 立即覆盖)
				for (const id of ids) {
					const entry = snap.byId[id];
					if (!entry || entry.blank) continue;
					if (archived.has(id)) continue;
					const s = petStatusSessions.manager.get(id);
					const ssnap = s && s.getSnapshot();
					const isRunning = !!entry.running;
					const wasRunning = petPrevRunning.get(id) === true;
					// 完成下降沿:上一帧 running、这一帧已停止,且无 agent 失败 → 播庆祝
					if (wasRunning && !isRunning && !(ssnap && ssnap.lastAgentError)) {
						celebrate = true;
					}
					nowRunning.set(id, isRunning);
				}
				petPrevRunning = nowRunning;
				// 先算情绪设锁(解锁时恢复 stats),再播 celebrate 瞬时动画(避免被覆盖)
				const emo = petStatusEmotionOf();
				petWidget.setSessionEmotion(emo);
				if (celebrate) petWidget.playOnce("celebrate");
			};
			apply();
			petStatusEmotionUnsub = petStatusSessions.list.subscribe(() => apply());
		}

		/** 应用「会话状态」开关:关闭 → 隐藏右上角状态概览按钮 + 停用常驻情绪同步(解锁交回 stats 用量驱动);开启 → 启用。 */
		function petApplySessionStatus() {
			const on = petConfig.sessionStatus !== false;
			if (petWidget) petWidget.setSessionStatus(on);
			if (!on) {
				if (petStatusEmotionUnsub) { petStatusEmotionUnsub(); petStatusEmotionUnsub = null; }
				if (petWidget) petWidget.setSessionEmotion(null);
			} else {
				petStatusEmotionSync();
			}
		}

		function petStatusToggle() {
			if (petStatusPanel) { petStatusClose(); return; }
			if (!petWidget || !petStatusSessions) return;
			petStatusPanel = new PetStatusPanel({ sessions: petStatusSessions, t: petBubbleT, pet: petWidget });
		}

		function petStatusClose() {
			if (petStatusPanel) {
				petStatusPanel.destroy();
				petStatusPanel = null;
			}
		}

		/** 应用配置(面板改动):enabled(互斥开关)+ skin(选中卡)+ opacity。持久化由调用方负责。 */
		function petApplyConfig(cfg) {
			const prev = petConfig;
			petConfig = { ...petConfig, ...cfg };
			if (cfg.enabled !== undefined) petConfig.enabled = petNormalizeEnabled(cfg.enabled);
			if (!petConfig.enabled) {
				petUnmount();
				return;
			}
			if (!petWidget) {
				petMount();
				return;
			}
			if (cfg.opacity !== undefined) petWidget.setOpacity(cfg.opacity);
			// 启用的宠物变化(互斥切换)或选中皮肤变化 → 切换素材
			const target = cfg.enabled !== undefined ? petConfig.enabled : cfg.skin;
			if (target && target !== petWidget.options.skin) petWidget.setSkin(target);
			// 「会话状态」开关变化 → 刷新状态概览按钮与常驻情绪同步
			if (cfg.sessionStatus !== undefined) petApplySessionStatus();
		}

		/** 右键菜单「隐藏宠物」(乐观应用:先本地隐藏,再异步持久化,与面板开关一致)。 */
		function petHide() {
			petApplyConfig({ enabled: "" });
			petPersist({ enabled: "" }).catch(() => {});
		}

		/**
		 * 桌面宠物面板(极简):单卡片 = 预览 + 信息(标题/今日统计/不透明度档位)
		 * + 右侧今日情绪气泡 + 启用开关。尺寸固定 S,位置随拖拽,无其他设置项。
		 * @param {{ t: (key: string) => string, petCtl: Object }} props
		 */
		function PetPanel({ t, petCtl }) {
			const [cfg, setCfg] = react.useState(null);
			const [stats, setStats] = react.useState(null);
			const [emotion, setEmotion] = react.useState(null);
			const [serviceDown, setServiceDown] = react.useState(false);
			react.useEffect(() => {
				let alive = true;
				petCtl.getConfig().then((c) => {
					if (!alive) return;
					setServiceDown(false);
					// 旧版可能存了任意 opacity(如 0.5):就近归一档位并持久化,保证 UI 与宠物一致
					const PRESETS = [0.3, 0.6, 1];
					const cur = typeof c.opacity === "number" ? c.opacity : 1;
					const norm = PRESETS.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a), PRESETS[0]);
					if (Math.abs(norm - cur) > 0.001) {
						c.opacity = norm;
						petCtl.applyConfig({ opacity: norm }).catch(() => {});
					}
					setCfg(c);
				}).catch(() => {
					// 宿主未重启/接口不可用:回退默认值,面板仍可打开并给出提示
					if (!alive) return;
					setServiceDown(true);
					setCfg({ enabled: "black-whale", skin: "black-whale", size: "small", position: "bottom-right", posOverride: null, opacity: 1, sessionStatus: true });
				});
				const sync = () => {
					setStats(petCtl.getStats());
					setEmotion(petCtl.getEmotion());
				};
				sync();
				const id = setInterval(sync, 3000);
				return () => { alive = false; clearInterval(id); };
			}, []);
			// 卡片形象随机表情动画:面板打开期间,黑鲸/蓝鲸**交替**播放小表情动画(~2.2s)——每次只动一张,
			// 这张动完(间隔)换另一张动;与消耗数据无关(纯随机),代表"宠物是活的";离开面板即停,省资源。
			const [anim, setAnim] = react.useState({});
			react.useEffect(() => {
				let alive = true;
				const timers = [];
				let turn = 0;
				const playNext = () => {
					if (!alive) return;
					const id = PET_SKINS[turn % PET_SKINS.length];
					turn += 1;
					const emo = PET_EMOTIONS[Math.floor(Math.random() * PET_EMOTIONS.length)];
					setAnim({ [id]: emo });
					timers.push(setTimeout(() => { if (alive) setAnim({}); }, PET_ACTION_MS));
				};
				playNext(); // 用户进来先动一张,代表"活的"
				const iv = setInterval(playNext, 10000); // 每 10s 换一张动(交替)
				return () => {
					alive = false;
					clearInterval(iv);
					timers.forEach((t) => clearTimeout(t));
				};
			}, []);
			// 唤醒反馈:宠物从「未启用 → 启用」时,左边大形象图播一次随机动画(用户知道被唤醒了)
			const prevEnabled = react.useRef(undefined);
			react.useEffect(() => {
				if (!cfg) return;
				const cur = cfg.enabled;
				const prev = prevEnabled.current;
				prevEnabled.current = cur;
				if (prev !== undefined && cur && cur !== prev) {
					const emo = PET_EMOTIONS[Math.floor(Math.random() * PET_EMOTIONS.length)];
					setAnim({ [cur]: emo });
					const t = setTimeout(() => setAnim({}), PET_ACTION_MS);
					return () => clearTimeout(t);
				}
			}, [cfg && cfg.enabled]);
			if (!cfg) {
				return react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("p", { className: "dsh-pc-mock" }, t("loadingHint"))
				);
			}
			const update = (patch) => {
				setCfg((c) => ({ ...c, ...patch }));
				petCtl.applyConfig(patch).catch(() => {});
			};
			const interp = (key, vars) => {
				let s = t(key);
				if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
				return s;
			};
			// 今日情绪气泡(按当前皮肤取素材)
			// 今日统计
			const statTokens = stats ? petFmtNum(stats.tokens_today, t) : "—";
			const statTools = stats ? String(stats.tool_calls_today) : "—";
			const statRate = stats && typeof stats.cache_hit_rate === "number" ? Math.round(stats.cache_hit_rate * 100) + "%" : "—";
			// 不透明度档位(30% / 60% / 100%),就近高亮
			const OPACITY_PRESETS = [0.3, 0.6, 1];
			const curOpacity = typeof cfg.opacity === "number" ? cfg.opacity : 1;
			const nearest = OPACITY_PRESETS.reduce((a, b) => (Math.abs(b - curOpacity) < Math.abs(a - curOpacity) ? b : a), OPACITY_PRESETS[0]);
			const opacityBtn = (v) => react.createElement("button", {
				className: "dsh-pc-pet-opacity-btn" + (nearest === v ? " active" : ""),
				onClick: () => update({ opacity: v })
			}, Math.round(v * 100) + "%");
			// 宠物列表:黑鲸/蓝鲸各一张完整配置卡。启用卡走实时数据;未启用卡静态展示。
			// 左边形象图:面板打开期间每 10s 随机动一次(代表"活的");启用瞬间播一次(唤醒反馈)。
			const petCard = (id) => {
				const isEnabled = cfg.enabled === id;
				const cardEmotion = isEnabled ? emotion : null;
				const animEmo = anim[id];
				const staticAsset = cardEmotion
					? petAsset(id, "idle", cardEmotion)
					: petAsset(id, "idle", "happy");
				const asset = animEmo ? petAsset(id, "animations", animEmo) : staticAsset;
				return react.createElement("div", {
					className: "dsh-pc-pet-card"
				},
					react.createElement("img", { className: "dsh-pc-pet-preview-img", src: asset, alt: "" }),
					react.createElement("div", { className: "dsh-pc-pet-info" },
						react.createElement("div", { className: "dsh-pc-pet-title-row" },
							react.createElement("span", { className: "dsh-pc-pet-title" }, id === "black-whale" ? t("petNameBlack") : t("petNameBlue")),
							// 悬停标题旁的 ℹ 弹提示(DSH 主题化 popover)
							react.createElement("span", { className: "dsh-pc-pet-tip", role: "tooltip" },
								react.createElement("span", { className: "dsh-pc-pet-tip-btn", "aria-label": t("petTip") }, "ⓘ"),
								react.createElement("span", { className: "dsh-pc-pet-tip-pop" }, t("petTip"))
							)
						),
						react.createElement("p", { className: "dsh-pc-pet-stats" },
							interp("petTodayStats", {
								tokens: isEnabled ? statTokens : "—",
								tools: isEnabled ? statTools : "—",
								rate: isEnabled ? statRate : "—"
							})),
						react.createElement("div", { className: "dsh-pc-pet-sub", onClick: (e) => e.stopPropagation() },
							react.createElement("span", { className: "dsh-pc-pet-sub-label" }, t("petOpacity")),
							opacityBtn(0.3),
							opacityBtn(0.6),
							opacityBtn(1)
						)
					),
					react.createElement("label", { className: "dsh-pc-pet-switch", title: cfg.enabled ? t("petStatusOn") : t("petStatusOff"), onClick: (e) => e.stopPropagation() },
						react.createElement("input", { type: "checkbox", checked: cfg.enabled === id, onChange: (e) => { const on = e.target.checked; update(on ? { skin: id, enabled: id } : { enabled: "" }); } }),
						react.createElement("span", { className: "dsh-pc-pet-switch-track" }),
						react.createElement("span", { className: "dsh-pc-pet-switch-thumb" })
					)
				);
			};

			return react.createElement("div", { className: "dsh-pc-panel" },
				react.createElement("div", { className: "dsh-pc-pet-list" },
					petCard("black-whale"),
					petCard("blue-whale")
				),
				// 宿主服务未就绪(未重启)时给出明确提示,避免"开了没反应"
				serviceDown ? react.createElement("p", { className: "dsh-pc-pet-hint" }, t("petServiceDown")) : null
			);
		}

		//#region 共享外壳 + 外观/宠物会话状态子组件(PersonalCenterSection/Tab/AppearanceTab/PetStatusConfig/PetSection)
		/**
		 * Tab 按钮(与插件分区 Tab 完全一致的交互:下划线指示 + data-active)。
		 * @param {string} id
		 * @param {string} label
		 * @param {string} active
		 * @param {(id: string) => void} setTab
		 */
		function TabButton(id, label, active, setTab) {
			return react.createElement("button", {
				className: "dsh-pc-tab",
				role: "tab",
				"data-active": active === id,
				"aria-selected": active === id,
				onClick: () => setTab(id)
			}, label);
		}

		/**
		 * 胶囊式 tab 按钮(子 tab 用:选中淡圆角背景,未选中空白)。
		 * @param {string} id
		 * @param {string} label
		 * @param {string} active
		 * @param {(id: string) => void} setTab
		 */
		function PillTabButton(id, label, active, setTab) {
			return react.createElement("button", {
				className: "dsh-pc-profile-pill-tab",
				role: "tab",
				"data-active": active === id,
				"aria-selected": active === id,
				onClick: () => setTab(id)
			}, label);
		}

		/**
		 * 「会话状态」设置卡(带边框:标题 + 开关一行,说明在下方),控制是否在宠物上启用会话状态概览。
		 * 宠物关闭时开关置灰 + 提示(避免「没开宠物却开会话状态」的矛盾)。
		 * @param {{ t: (key: string) => string, petCtl: Object }} props
		 */
		function PetStatusConfig({ t, petCtl }) {
			const [cfg, setCfg] = react.useState(null);
			react.useEffect(() => {
				let alive = true;
				petCtl.getConfig()
					.then((c) => { if (alive) setCfg(c); })
					.catch(() => { if (alive) setCfg({ enabled: "", sessionStatus: true }); });
				return () => { alive = false; };
			}, []);
			if (!cfg) {
				return react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("p", { className: "dsh-pc-mock" }, t("loadingHint"))
				);
			}
			const petOn = !!cfg.enabled;
			const statusOn = cfg.sessionStatus !== false;
			const update = (on) => {
				setCfg((c) => ({ ...c, sessionStatus: on }));
				petCtl.applyConfig({ sessionStatus: on }).catch(() => {});
			};
			return react.createElement("div", { className: "dsh-pc-petstatus-card" },
				react.createElement("div", { className: "dsh-pc-petstatus-flex" },
					react.createElement("div", { className: "dsh-pc-petstatus-info" },
						react.createElement("span", { className: "dsh-pc-petstatus-title" }, t("petSubStatus")),
						react.createElement("p", { className: "dsh-pc-petstatus-desc" }, t("petStatusDesc"))
					),
					react.createElement("label", {
						className: "dsh-pc-pet-switch",
						title: petOn ? (statusOn ? t("petStatusOn") : t("petStatusOff")) : t("petStatusNeedPet"),
						onClick: (e) => e.stopPropagation()
					},
						react.createElement("input", {
							type: "checkbox",
							checked: statusOn,
							disabled: !petOn,
							onChange: (e) => update(e.target.checked)
						}),
						react.createElement("span", { className: "dsh-pc-pet-switch-track" }),
						react.createElement("span", { className: "dsh-pc-pet-switch-thumb" })
					)
				),
				!petOn ? react.createElement("p", { className: "dsh-pc-pet-hint" }, t("petStatusNeedPet")) : null
			);
		}

		/**
		 * 「宠物」tab:单页自上而下 = 会话状态设置卡 + 宠物两张配置卡(不再二级 tab,一屏看清)。
		 * @param {{ t: (key: string) => string, petCtl: Object }} props
		 */
		function PetSection({ t, petCtl }) {
			return react.createElement(react.Fragment, null,
				react.createElement(PetStatusConfig, { t, petCtl }),
				react.createElement(PetPanel, { t, petCtl })
			);
		}

		/**
		 * 「外观」tab:全局字号卡片(带边框:标题+步进器一行,说明在下)。
		 * 步进器 11–18、默认 14;改动即时全局生效并持久化到 localStorage。
		 * @param {{ t: (key: string) => string }} props
		 */
		function AppearanceTab({ t }) {
			const [val, setVal] = react.useState(uiFontValue);
			const commit = (nv) => {
				const c = uiFontClamp(nv);
				setVal(c);
				uiFontSet(c);
			};
			const bump = (d) => commit(val + d);
			return react.createElement("div", { className: "dsh-pc-appear-card" },
				react.createElement("div", { className: "dsh-pc-appear-row" },
					react.createElement("div", { className: "dsh-pc-appear-info" },
						react.createElement("span", { className: "dsh-pc-appear-title" }, t("appearanceTitle")),
						react.createElement("p", { className: "dsh-pc-appear-desc" }, t("appearanceDesc"))
					),
					react.createElement("div", { className: "dsh-pc-appear-ctl" },
						react.createElement("div", { className: "dsh-pc-appear-font-step" },
							react.createElement("input", {
								className: "dsh-pc-appear-font-input",
								type: "number",
								min: UI_FONT_MIN,
								max: UI_FONT_MAX,
								value: val,
								"aria-label": t("appearanceTitle"),
								onChange: (e) => commit(e.target.value)
							}),
							react.createElement("span", { className: "dsh-pc-appear-font-arrows" },
								react.createElement("button", {
									type: "button",
									className: "dsh-pc-appear-font-arrow",
									"aria-label": t("appearanceMax"),
									disabled: val >= UI_FONT_MAX,
									onClick: () => bump(1)
								}, "▲"),
								react.createElement("button", {
									type: "button",
									className: "dsh-pc-appear-font-arrow",
									"aria-label": t("appearanceMin"),
									disabled: val <= UI_FONT_MIN,
									onClick: () => bump(-1)
								}, "▼")
							)
						),
						react.createElement("span", { className: "dsh-pc-appear-font-unit" }, t("appearanceUnit"))
					)
				)
			);
		}

		/**
		 * 「个人配置」分区:标题 + 描述 + Tab 栏(Token 用量 / 个性化 / 外观 / 宠物)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function PersonalCenterSection({ t, petCtl }) {
			const [tab, setTab] = react.useState("profile");
			return react.createElement("div", { className: "dsh-pc-section" },
				react.createElement("h2", { className: "dsh-pc-heading" }, t("heading")),
				react.createElement("p", { className: "dsh-pc-intro" }, t("intro")),
				react.createElement("div", { className: "dsh-pc-tabs", role: "tablist" },
					TabButton("profile", t("tabProfile"), tab, setTab),
					TabButton("personalization", t("tabPersonalization"), tab, setTab),
					TabButton("appearance", t("tabAppearance"), tab, setTab),
					TabButton("pet", t("subPet"), tab, setTab)
				),
				react.createElement("div", { className: "dsh-pc-panel", role: "tabpanel" },
					tab === "profile"
						? react.createElement(ProfileTab, { t })
						: tab === "personalization"
							? react.createElement(PersonalizationTab, { t })
							: tab === "appearance"
								? react.createElement(AppearanceTab, { t })
								: react.createElement(PetSection, { t, petCtl })
				)
			);
		}
		//#endregion

		//#region 模块: 外观(全局字号引擎 UI_FONT_*)
		/**
		 * 全局字号偏移引擎(精简版)。
		 *
		 * DSH 组件字号大量硬编码 px,且走 --dsw-font-* token(CSS 变量)。要让
		 * 「调一个基准字号、全界面文字统一变化」在 DSH 里成立,唯一办法是:
		 *   1) 遍历所有可读样式表,收集 token 声明(--dsw-font-* 的 px 值)与
		 *      非 token 的硬编码 font-size/font 简写规则;
		 *   2) 按 delta(=基准值-14)重建 CSS:token 在 body 级重声明(覆盖 :root
		 *      的继承链),硬编码规则用 !important 逐条覆盖;
		 *   3) 注入一个 <style> 覆盖层,改动时刷新 textContent。
		 * 原理参考 dsh-ui-font(warmwine)已验证的算法,此处去掉 per-plugin/per-token
		 * 微调维度,只保留全局统一偏移。
		 */
		const UI_FONT_BASE = 14;
		const UI_FONT_MIN = 11;
		const UI_FONT_MAX = 16;
		const UI_FONT_LS_KEY = "dsh-personal-center.uiFont";
		const UI_FONT_STYLE_ID = "dsh-personal-center/ui-font-overrides";
		/* 各 family 的默认字号(与官方 base.css 对齐),用于 token 声明缺省时兜底 */
		const UI_FONT_STOCK = {
			"markdown-base": 16, "markdown-base-strong": 16, "markdown-base-italic": 16, "markdown-base-strong-italic": 16,
			"markdown-h1": 24, "markdown-h2": 22, "markdown-h3": 20, "markdown-h4": 16,
			"markdown-code": 14, "markdown-code-block": 13, "markdown-code-block-small": 12,
			"markdown-small": 12, "markdown-table": 14, "markdown-table-head": 14,
			"xxxs-11": 11, "xxxs-strong-11": 11, "xxs-12": 12, "xxs-strong-12": 12,
			"xs-13": 13, "xs-strong-13": 13, "s-14": 14, "s-strong-14": 14,
			"base-16": 16, "base-strong-16": 16, "m-18": 16, "l-20": 20, "xl-24": 24
		};

		let uiFontValue = UI_FONT_BASE;
		let uiFontStyleTag = null;

		function uiFontClamp(v) {
			const n = Math.round(v);
			return Math.min(UI_FONT_MAX, Math.max(UI_FONT_MIN, isNaN(n) ? UI_FONT_BASE : n));
		}

		function uiFontRead() {
			try {
				const v = parseInt(localStorage.getItem(UI_FONT_LS_KEY), 10);
				if (!isNaN(v)) uiFontValue = uiFontClamp(v);
			} catch (e) { /* localStorage 不可用:保持默认 */ }
		}

		function uiFontPersist() {
			try { localStorage.setItem(UI_FONT_LS_KEY, String(uiFontValue)); } catch (e) { /* ignore */ }
		}

		/** 收集所有可读样式表里的 token 声明(family -> {size,lh,raw}) 与硬编码规则(selector -> {size,lh})。 */
		function uiFontScan() {
			const tokenDecls = new Map(); /* "--dsw-font-X" -> 原始声明文本 */
			const rules = new Map();      /* selector -> {size,lh} */
			const isSelfSheet = (sheet) => {
				const n = sheet.ownerNode;
				return n !== null && n !== undefined && n.dataset !== undefined && n.dataset.pluginCss === UI_FONT_STYLE_ID;
			};
			const readTokenText = (cssText) => {
				const open = cssText.indexOf("{");
				const close = cssText.lastIndexOf("}");
				if (open === -1 || close <= open) return;
				const body = cssText.slice(open + 1, close);
				for (const m of body.matchAll(/(--dsw-font-[a-z0-9-]+|--dsl-[a-z0-9-]+)\s*:\s*([^;}]+)/g)) {
					tokenDecls.set(m[1], m[2].trim());
				}
			};
			const walk = (list) => {
				for (const r of Array.from(list)) {
					if (r.type === 1) { /* CSSStyleRule */
						const text = r.cssText || "";
						if (text.indexOf("--dsw-font-") !== -1 || text.indexOf("--dsl-") !== -1) readTokenText(text);
						const decls = r.style;
						if (decls === null || decls.length === 0) continue;
						let size = null, lh = null;
						const fsRaw = decls.getPropertyValue("font-size").trim();
						if (/^[\d.]+px$/.test(fsRaw)) {
							size = parseFloat(fsRaw);
							const lhv = decls.getPropertyValue("line-height").trim();
							if (/^[\d.]+px$/.test(lhv)) lh = parseFloat(lhv);
						} else {
							const sh = decls.getPropertyValue("font").trim().match(/(?:^|\s)(\d+(?:\.\d+)?)px(?:\s*\/\s*(\d+(?:\.\d+)?)px)?/);
							if (sh !== null) { size = parseFloat(sh[1]); if (sh[2] !== undefined) lh = parseFloat(sh[2]); }
						}
						/* token 驱动的规则(var(--dsw-font-*))交给 token 通道,不当作硬编码规则;否则会双重缩放 */
						if (/^[\d.]+px$/.test(fsRaw)) {
							if (/font[^;:}]*:\s*[^;}]*var\(--(?:dsw-font|dsl-)[a-z0-9-]+\)/.test(text)) size = null;
						}
						if (size === null) continue;
						const sel = (r.selectorText || "").replace(/\s+/g, " ").trim();
						if (sel === "" || /xterm/i.test(sel) || /::(-webkit-)?scrollbar/.test(sel)) continue;
						const prev = rules.get(sel);
						if (prev === undefined || prev.size < size) rules.set(sel, { size, lh });
					} else if (r.type === 4 || r.type === 12) { /* media / supports */
						try { walk(r.cssRules); } catch (e) { /* skip */ }
					}
				}
			};
			for (const sheet of Array.from(document.styleSheets)) {
				if (isSelfSheet(sheet)) continue;
				try { walk(sheet.cssRules); } catch (e) { /* cross-origin / detached */ }
			}
			/* 解析每个 family 的 stock size/lh */
			const famSize = {};
			const famLh = {};
			for (const entry of Array.from(tokenDecls.entries())) {
				const m = entry[0].match(/^--dsw-font-(.+?)(?:-font-size|-line-height)?$/);
				if (m === null) continue;
				const fam = m[1];
				const v = entry[1];
				const sh = v.match(/^([\d.]+)px(?:\s*\/\s*([\d.]+)px)?/);
				if (sh !== null) { famSize[fam] = parseFloat(sh[1]); if (sh[2] !== undefined) famLh[fam] = parseFloat(sh[2]); }
				else if (entry[0].endsWith("-font-size")) {
					const fs = v.match(/^([\d.]+)px$/);
					if (fs !== null) famSize[fam] = parseFloat(fs[1]);
				}
			}
			for (const k of Object.keys(UI_FONT_STOCK)) {
				if (famSize[k] === undefined) famSize[k] = UI_FONT_STOCK[k];
				if (famLh[k] === undefined && famSize[k] !== undefined) famLh[k] = Math.round(famSize[k] * 1.6);
			}
			return { tokenDecls, rules, famSize, famLh };
		}

		/** 重建覆盖 CSS:token 通道(body 级重声明)+ 硬编码规则通道(!important)。 */
		function uiFontBuildCss(delta, scan) {
			const out = [];
			/* 1) token 通道:在 body 上重声明所有含 px 的 --dsw-font-* 属性,按比例缩放 size/line-height/shorthand */
			const tlines = ["body{"];
			for (const entry of Array.from(scan.tokenDecls.entries())) {
				const prop = entry[0];
				const value = entry[1];
				if (value.indexOf("px") === -1) continue;
				const m = prop.match(/^--dsw-font-(.+?)(?:-font-size|-line-height)?$/);
				if (m === null) continue;
				const fam = m[1];
				const stock = scan.famSize[fam];
				if (stock === undefined) continue;
				const ratio = (stock + delta) / stock;
				if (prop.endsWith("-line-height")) {
					const lh = parseFloat(value);
					if (!isNaN(lh)) tlines.push(prop + ":" + Math.round(lh * ratio) + "px;");
				} else if (prop.endsWith("-font-size")) {
					tlines.push(prop + ":" + Math.round((stock + delta) * 10) / 10 + "px;");
				} else {
					const scaled = value.replace(/(\d+(?:\.\d+)?)px(?:\s*\/\s*(\d+(?:\.\d+)?)px)?/, (all, a, b) => {
						const na = Math.round(parseFloat(a) * ratio * 10) / 10;
						if (b === undefined) return na + "px";
						return na + "px/" + (Math.round(parseFloat(b) * ratio * 10) / 10) + "px";
					});
					tlines.push(prop + ":" + scaled + ";");
				}
			}
			tlines.push("}");
			if (tlines.length > 2) out.push(tlines.join(""));
			/* 2) 硬编码规则通道:逐条覆盖 font-size(连带按比例的行高) */
			for (const entry of Array.from(scan.rules.entries())) {
				const sel = entry[0], info = entry[1];
				const n = Math.round((info.size + delta) * 10) / 10;
				const nl = info.lh !== null && info.size > 0 ? Math.round(info.lh * n / info.size) : null;
				out.push(sel + "{font-size:" + n + "px!important;" + (nl !== null ? "line-height:" + nl + "px!important;" : "") + "}");
			}
			return out.join("\n");
		}

		function uiFontEnsureTag() {
			if (uiFontStyleTag !== null && document.head.contains(uiFontStyleTag)) return uiFontStyleTag;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-personal-center";
			tag.dataset.pluginCss = UI_FONT_STYLE_ID;
			document.head.appendChild(tag);
			uiFontStyleTag = tag;
			return tag;
		}

		/** 应用当前基准值:delta=0(默认)时清空覆盖层,界面回到原样。 */
		function uiFontApply() {
			try {
				const delta = uiFontValue - UI_FONT_BASE;
				if (delta === 0) {
					if (uiFontStyleTag !== null) uiFontStyleTag.textContent = "";
					return;
				}
				uiFontEnsureTag().textContent = uiFontBuildCss(delta, uiFontScan());
			} catch (e) { /* 单次失败不阻断 */ }
		}

		function uiFontSet(v) {
			uiFontValue = uiFontClamp(v);
			uiFontPersist();
			uiFontApply();
		}

		function uiFontInit() {
			uiFontRead();
			uiFontApply();
		}

		function uiFontCleanup() {
			if (uiFontStyleTag !== null) {
				uiFontStyleTag.textContent = "";
				uiFontStyleTag = null;
			}
		}
		//#endregion

		//#region plugin
		/** 所需客户端服务:slots(插槽注册)、locale(文案)、sessions(会话投影,状态概览数据源)。 */
		const inject = ["slots", "locale", "sessions", "workspaces"];

		/**
		 * 客户端插件主体:注册「个人」分区。
		 * @param {import('@deepseek-ai/cordis').Context} ctx
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "personal-center: copy dictionaries");
			const t = ctx.locale.bind(LOCALE_NS);
			// 全局字号引擎:启动即读 localStorage 并应用;卸载/停用清理覆盖层(恢复默认)。
			ctx.effect(() => {
				uiFontInit();
				return uiFontCleanup;
			}, "personal-center: ui font scale");
			// 气泡文案(带 {var} 插值;DSH locale 的插值语法不确定,手动替换保险)
			petBubbleT = (key, vars) => {
				let s = t(key);
				if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
				return s;
			};
			// 状态概览数据源:平台已有投影(sessions 服务,已通过 inject 声明保证时序就绪)。
			petStatusSessions = ctx.get("sessions") || null;
			// 归档集合来源(workspaces 服务):面板/情绪同步排除归档会话。
			petStatusWorkspaces = ctx.get("workspaces") || null;
			const petCtl = {
				// 乐观应用:先本地生效(开关/透明度即时反馈),再异步持久化;持久化失败静默
				// (宿主未重启时配置不落盘,刷新后回宿主值,但交互不卡死)。
				applyConfig: (patch) => {
					petApplyConfig(patch);
					return petPersist(patch).catch(() => {});
				},
				getConfig: () => fetch("/personal-center/pet")
					.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
					.then((d) => {
						if (d && d.ok !== false) {
							petConfig = {
								enabled: petNormalizeEnabled(d.enabled),
								skin: PET_SKINS.indexOf(d.skin) >= 0 ? d.skin : "black-whale",
								size: d.size || "medium",
								position: d.position || "bottom-right",
								posOverride: d.posOverride || null,
								opacity: typeof d.opacity === "number" ? d.opacity : 1,
								sessionStatus: d.sessionStatus ?? true
							};
						}
						return { ...petConfig };
					}),
				getStats: () => petLastStats,
				getEmotion: () => (petWidget ? petWidget.getCurrentEmotion() : null)
			};
			// 宠物全局浮层:启动即按配置挂载,不依赖设置面板是否打开。
			// enabled:false 时不创建 DOM、不轮询(验收标准)。
			ctx.effect(() => {
				let disposed = false;
				fetch("/personal-center/pet")
					.then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
					.then((d) => {
						if (disposed || !d || d.ok === false) return;
						petConfig = {
							enabled: petNormalizeEnabled(d.enabled),
							skin: PET_SKINS.indexOf(d.skin) >= 0 ? d.skin : "black-whale",
							size: d.size || "medium",
							position: d.position || "bottom-right",
							posOverride: d.posOverride || null,
							opacity: typeof d.opacity === "number" ? d.opacity : 1,
							sessionStatus: d.sessionStatus ?? true
						};
						petApplyConfig({});
					})
					.catch(() => { /* 宿主未重启/接口不可用:静默不挂载 */ });
				return () => {
					disposed = true;
					petUnmount();
				};
			}, "personal-center: pet overlay");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "personal-center",
				order: 30,
				label: () => t("nav"),
				inject: () => ({ t, petCtl })
			}, PersonalCenterSection));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
