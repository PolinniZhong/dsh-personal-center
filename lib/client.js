/**
 * dsh-personal-center — 浏览器端。
 *
 * 设置里「个人」分区,版式与配色交互完全参考「插件」分区:
 *   顶栏标题「个人」→ 描述 → Tab 栏(个人资料 / 个性化 / 宠物)切换内容:
 *   - 「个人资料」:Token 消耗 / 会话 / 工具调用 / Token 活动(每日·每周·累计)
 *     / 按模型分布 / 常用工具 / 成本 —— 数据来自宿主端环回路由 /personal-center/stats;
 *   - 「个性化」:自定义指令多行文本框(全局注入,见宿主端);
 *   - 「宠物」:黑鲸配置面板 + 全局浮层(纯 DOM 零依赖,素材为宿主托管的动画 WebP,
 *     30s 轮询 stats 驱动 5 情绪;点击气泡/拖拽位置记忆/右键菜单)。
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
			/* 分区骨架 */
			".dsh-pc-section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}" +
			".dsh-pc-heading{margin:0;font-size:18px;font-weight:600}" +
			".dsh-pc-intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}" +
			/* Tab 栏(与插件分区完全一致) */
			".dsh-pc-tabs{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:flex-end;gap:22px;margin-top:2px;display:flex}" +
			".dsh-pc-tab{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;padding:7px 1px 9px;font-size:13px;line-height:20px;position:relative}" +
			".dsh-pc-tab:hover,.dsh-pc-tab[data-active=true]{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-tab[data-active=true]:after,.dsh-pc-tab:focus-visible:after{background:var(--dsw-alias-label-primary);content:\"\";border-radius:2px 2px 0 0;height:2px;position:absolute;bottom:-1px;left:0;right:0}" +
			".dsh-pc-tab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;color:var(--dsw-alias-label-primary);border-radius:2px}" +
			".dsh-pc-panel{min-width:0;padding-top:6px}" +
			/* 子 tab(胶囊样式:选中淡圆角背景,未选中空白,与上层下划线 tab 区分) */
			".dsh-pc-pill-tabs{display:inline-flex;gap:8px}" +
			".dsh-pc-pill-tab{border:0;background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-size:13px;line-height:16px;padding:2px 10px;border-radius:999px}" +
			".dsh-pc-pill-tab:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pill-tab[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:500}" +
			/* 统计卡片 */
			".dsh-pc-group{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:20px 0 10px}" +
			".dsh-pc-panel > .dsh-pc-group:first-of-type{margin-top:12px}" +
			".dsh-pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}" +
			".dsh-pc-stat{background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px}" +
			".dsh-pc-stat-label{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			".dsh-pc-stat-value{color:var(--dsw-alias-label-primary);font-size:20px;font-weight:600;line-height:28px;font-variant-numeric:tabular-nums}" +
			".dsh-pc-stat-sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			/* 常用工具列表(无进度条,节省空间) */
			".dsh-pc-tools{display:flex;flex-direction:column;gap:10px}" +
			".dsh-pc-tool-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}" +
			".dsh-pc-tool-name{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}" +
			".dsh-pc-tool-calls{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px;font-variant-numeric:tabular-nums}" +
			/* 按模型分布 */
			".dsh-pc-model{display:flex;flex-direction:column;gap:2px;min-width:0}" +
			".dsh-pc-model-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}" +
			/* 会话回顾 */
			".dsh-pc-session{display:flex;flex-direction:column;gap:2px;min-width:0}" +
			".dsh-pc-session-title{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
			".dsh-pc-session-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}" +
			/* 成本估算编辑器(每个模型 = 两行:名称行 + 价格行) */
			".dsh-pc-cost{display:flex;flex-direction:column;gap:8px;margin-top:2px}" +
			".dsh-pc-cost-model{display:flex;flex-direction:column;gap:8px}" +
			".dsh-pc-cost-model + .dsh-pc-cost-model{margin-top:16px}" +
			".dsh-pc-cost-model-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}" +
			".dsh-pc-cost-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
			".dsh-pc-cost-key{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary);min-width:0;flex:1;word-break:break-all}" +
			".dsh-pc-cost-tier{display:inline-flex;align-items:center;gap:4px;min-width:64px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-cost input[type=number],.dsh-pc-cost select{box-sizing:border-box;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;height:24px;padding:0 6px;font-size:12px;font-family:inherit;outline:none}" +
			".dsh-pc-cost input[type=number]{width:72px}" +
			".dsh-pc-cost input:focus,.dsh-pc-cost select:focus{border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-cost label{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-cost-addrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:16px}" +
			".dsh-pc-cost-addrow input{box-sizing:border-box;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;height:24px;padding:0 8px;font-size:12px;font-family:inherit;outline:none;width:180px}" +
			".dsh-pc-cost-addbtn{margin-left:auto}" +
			".dsh-pc-cost-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}" +
			/* 桌面宠物入口 */
			".dsh-pc-pet-card{display:flex;align-items:center;gap:16px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:16px 18px}" +
			".dsh-pc-pet-preview{width:56px;height:56px;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover);display:flex;align-items:center;justify-content:center;font-size:28px;flex:none}" +
			".dsh-pc-pet-info{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}" +
			".dsh-pc-pet-badge{color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:0 10px;font-size:11px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-pet-opts{display:flex;flex-direction:column;gap:8px;margin-top:20px}" +
			".dsh-pc-pet-opt{display:flex;align-items:center;justify-content:space-between;gap:8px}" +
			".dsh-pc-pet-opt-label{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}" +
			/* Token 活动(每日/每周/累计) */
			".dsh-pc-activity{display:flex;flex-direction:column;gap:8px;margin-top:2px}" +
			".dsh-pc-activity-head{display:flex;align-items:center;justify-content:space-between;gap:12px}" +
			".dsh-pc-activity-title{margin-bottom:0}" +
			".dsh-pc-activity-toggle{display:inline-flex;gap:16px;align-items:center}" +
			".dsh-pc-activity-mode{border:0;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-family:inherit;font-size:12px;line-height:20px;padding:0}" +
			".dsh-pc-activity-mode:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-activity-mode[data-active=true]{color:var(--dsw-alias-label-primary);font-weight:500}" +
			".dsh-pc-heat{display:flex;flex-direction:column;gap:4px;width:100%}" +
			".dsh-pc-heat-grid{display:grid;gap:3px;width:100%}" +
			".dsh-pc-heat-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden}" +
			".dsh-pc-heat-cell{aspect-ratio:1/1;width:100%;border-radius:2px;background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pc-heat-cell[data-level='1']{background:var(--dsw-static-deepseek-100)}" +
			".dsh-pc-heat-cell[data-level='2']{background:var(--dsw-static-deepseek-200)}" +
			".dsh-pc-heat-cell[data-level='3']{background:var(--dsw-static-deepseek-300)}" +
			".dsh-pc-heat-cell[data-level='4']{background:var(--dsw-static-deepseek-400)}" +
			".dsh-pc-heat-cell[data-level='5']{background:var(--dsw-static-deepseek-500)}" +
			".dsh-pc-cum{display:flex;align-items:flex-end;gap:6px;height:90px;margin-top:6px}" +
			".dsh-pc-cum-col{flex:1;display:flex;flex-direction:column;gap:4px;align-items:center;min-width:0}" +
			".dsh-pc-cum-bar{width:100%;border-radius:3px 3px 0 0;background:var(--dsw-static-deepseek-400);min-height:2px}" +
			".dsh-pc-cum-label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}" +
			/* 示例数据提示 */
			".dsh-pc-mock{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0 0 2px}" +
			/* 自定义指令(个性化 tab,沿用 v0.1) */
			".dsh-ci-header{display:flex;align-items:center;justify-content:space-between;gap:12px}" +
			".dsh-ci-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:0}" +
			".dsh-ci-hint{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;margin:8px 0 0}" +
			".dsh-ci-textarea{box-sizing:border-box;width:100%;min-height:260px;margin-top:16px;resize:vertical;background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:14px;line-height:22px}" +
			".dsh-ci-textarea:focus{outline:none;border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-ci-textarea:disabled{opacity:.6}" +
			".dsh-ci-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end}" +
			".dsh-ci-button{cursor:pointer;border:none;border-radius:6px;height:24px;padding:0 12px;font-size:11px;line-height:18px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center}" +
			".dsh-ci-button:disabled{opacity:.5;cursor:default}" +
			".dsh-ci-primary{border-radius:12px;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}" +
			".dsh-ci-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}" +
			".dsh-ci-primary:disabled{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);opacity:1}" +
			".dsh-ci-secondary{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}" +
			".dsh-ci-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}" +
			".dsh-ci-readonly{color:var(--dsw-alias-label-secondary);font-size:13px;margin:0}" +
			/* 桌面宠物:全局浮层(纯 DOM,素材为宿主托管的动画 WebP) */
			".dsh-pet-container{position:fixed;z-index:2147483000;width:120px;height:120px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;transition:opacity .3s ease}" +
			".dsh-pet-container.dragging{cursor:grabbing;z-index:2147483647}" +
			".dsh-pet-container.hidden{opacity:0;pointer-events:none}" +
			".dsh-pet-wrapper{width:100%;height:100%;position:relative}" +
			".dsh-pet-img{width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;opacity:0;transition:opacity .4s ease;pointer-events:none;-webkit-user-drag:none}" +
			".dsh-pet-img.active{opacity:1;filter:drop-shadow(0 4px 12px rgba(0,0,0,.25)) drop-shadow(0 0 2px rgba(255,255,255,.16))}" +
			/* 常驻显示,平时静止:无常驻循环动画(参考 Codex 宠物规范:待机不打扰,情绪变化/逗弄时才播放动画) */
			".dsh-pet-container.dragging,.dsh-pet-container.dragging .dsh-pet-wrapper{animation:none!important}" +
			".dsh-pet-container.dragging .dsh-pet-wrapper{transform:scale(1.06) rotate(-3deg);transition:transform .15s ease}" +
			".dsh-pet-container.clicked .dsh-pet-wrapper{animation:dsh-pet-click-bounce .3s cubic-bezier(.34,1.56,.64,1)}" +
			"@keyframes dsh-pet-click-bounce{0%{transform:scale(1)}40%{transform:scale(.9)}70%{transform:scale(1.05)}100%{transform:scale(1)}}" +
			".dsh-pet-bubble{position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%) translateY(8px);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);padding:10px 16px;border-radius:16px;font-size:13px;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;max-width:min(280px,60vw);overflow:hidden;text-overflow:ellipsis}" +
			".dsh-pet-bubble.visible{opacity:1;transform:translateX(-50%) translateY(0)}" +
			".dsh-pet-bubble::after{content:\"\";position:absolute;top:100%;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--dsw-alias-bg-layer-3)}" +
			".dsh-pet-bubble.below{bottom:auto;top:calc(100% + 12px)}" +
			".dsh-pet-bubble.below::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:var(--dsw-alias-bg-layer-3)}" +
			".dsh-pet-container.size-small{width:80px;height:80px}" +
			".dsh-pet-container.size-medium{width:120px;height:120px}" +
			".dsh-pet-container.size-large{width:160px;height:160px}" +
			/* 深色主题:黑鲸加柔和冷色描边光,避免融入背景(P1) */
			"@media (prefers-color-scheme:dark){.dsh-pet-img.active{filter:drop-shadow(0 4px 12px rgba(0,0,0,.35)) drop-shadow(0 0 3px rgba(140,190,255,.32))}}" +
			/* 右键快捷菜单 */
			".dsh-pet-menu{position:fixed;z-index:2147483646;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:4px;min-width:120px;box-shadow:0 8px 28px rgba(0,0,0,.28);display:none}" +
			".dsh-pet-menu.open{display:block}" +
			".dsh-pet-menu-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 10px;border-radius:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap}" +
			".dsh-pet-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-pet-menu-item .dsh-pet-menu-sizes{display:inline-flex;gap:4px}" +
			".dsh-pet-menu-item .dsh-pet-menu-size{min-width:22px;text-align:center;padding:1px 6px;border-radius:6px;color:var(--dsw-alias-label-secondary)}" +
			".dsh-pet-menu-item .dsh-pet-menu-size[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:500}" +
			"@media (prefers-reduced-motion:reduce){.dsh-pet-container,.dsh-pet-wrapper{animation:none!important}.dsh-pet-img{transition:none}}" +
			/* 宠物配置面板 */
			".dsh-pc-pet-preview-img{width:56px;height:56px;border-radius:50%;object-fit:contain;background:var(--dsw-alias-interactive-bg-hover);flex:none}" +
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
			".dsh-pc-pet-opacity-btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;line-height:16px;cursor:pointer;font-family:inherit}" +
			".dsh-pc-pet-opacity-btn:hover{color:var(--dsw-alias-label-primary)}" +
			".dsh-pc-pet-opacity-btn.active{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:500;border-color:transparent}" +
			".dsh-pc-pet-emo-bubble{display:flex;align-items:center;gap:6px;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:3px 10px 3px 3px;flex:none}" +
			".dsh-pc-pet-emo-img{width:24px;height:24px;border-radius:50%;object-fit:contain;background:var(--dsw-alias-interactive-bg-hover);flex:none}" +
			".dsh-pc-pet-emo-name{font-size:12px;line-height:16px;color:var(--dsw-alias-label-primary);white-space:nowrap}" +
			".dsh-pc-pet-switch{position:relative;width:36px;height:20px;flex:none;cursor:pointer}" +
			".dsh-pc-pet-switch input{position:absolute;opacity:0;width:0;height:0}" +
			/* 开关视觉参考 DSH 交互色系:启用态=品牌蓝轨道+白色圆钮,关闭态=浅灰轨道+白色圆钮(避免黑色圆钮突兀) */
			".dsh-pc-pet-switch-track{position:absolute;inset:0;background:var(--dsw-alias-interactive-bg-hover);border-radius:999px;transition:background .2s ease}" +
			".dsh-pc-pet-switch-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);box-shadow:0 1px 2px rgba(0,0,0,.28);transition:transform .2s ease}" +
			".dsh-pc-pet-switch input:checked ~ .dsh-pc-pet-switch-track{background:var(--dsw-static-deepseek-400)}" +
			".dsh-pc-pet-switch input:checked ~ .dsh-pc-pet-switch-thumb{transform:translateX(16px)}" +
			".dsh-pc-pet-custom{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;margin:4px 0 0}";
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
				"nav": "个人",
				"heading": "个人",
				"intro": "管理你的个人资料与个性化偏好,仅对本机生效。",
				"tabProfile": "个人资料",
				"tabPersonalization": "个性化",
				"subOverview": "概览",
				"subActivity": "活动",
				"subModels": "模型",
				"subSessions": "会话",
				"subTools": "回顾",
				"subCost": "模型成本",
				"subPet": "宠物",
				"petTitle": "桌面宠物",
				"petComing": "设计中 · 即将到来",
				"petDesc": "一只由你的真实用量驱动的浮游宠物:忙碌时冒汗、省钱时开心、点击它会说出今日数据。方案见 docs/DESKTOP-PET.md。",
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
				"petNoPriceHint": "未配置模型价格(设置 → 个人 → 模型成本),今日成本为空,「钱包痛」不会触发。",
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
				"petBubbleTokens": "今天用了 {tokens} Tokens",
				"petBubbleCache": "缓存命中 {rate}%，省了一笔！",
				"petBubbleTools": "你今天最常用的工具是 {tool}",
				"petBubbleCost": "今日花费 ¥{cost}",
				"petBubbleCostUsd": "今日花费 ${cost}",
				"petBubbleIdle": "今天还没开始干活呢～",
				"petBubbleLoading": "正在加载数据…",
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
				"readOnly": "当前部署的配置文件为只读,无法保存。"
			},
			en: {
				"nav": "Personal",
				"heading": "Personal",
				"intro": "Manage your profile and personalization preferences. Local to this host.",
				"tabProfile": "Profile",
				"tabPersonalization": "Personalization",
				"subOverview": "Overview",
				"subActivity": "Activity",
				"subModels": "Models",
				"subSessions": "Sessions",
				"subTools": "Review",
				"subCost": "Model cost",
				"subPet": "Pet",
				"petTitle": "Desktop Pet",
				"petComing": "In design · coming soon",
				"petDesc": "A floating pet driven by your real usage: sweats when busy, cheers when saving, speaks your daily stats when clicked. Plan: docs/DESKTOP-PET.md.",
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
				"petBubbleTokens": "Used {tokens} tokens today",
				"petBubbleCache": "Cache hit {rate}% — saving money!",
				"petBubbleTools": "Top tool today: {tool}",
				"petBubbleCost": "Spent ¥{cost} today",
				"petBubbleCostUsd": "Spent ${cost} today",
				"petBubbleIdle": "Nothing yet today~",
				"petBubbleLoading": "Loading data…",
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
				"readOnly": "The settings document is read-only in this deployment."
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

		/** 官方预设价格目录(2026-08,来源见 docs/COST-ESTIMATION.md §5.1)。 */
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
			return react.createElement("div", { className: "dsh-pc-activity-toggle", role: "tablist" },
				modes.map(([id, label]) => react.createElement("button", {
					key: id,
					className: "dsh-pc-activity-mode",
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
					cells.push(react.createElement("div", { key: w + "-" + d, className: "dsh-pc-heat-cell", "data-level": weeks[w].days[d] }));
				}
			}
			return react.createElement("div", { className: "dsh-pc-heat" },
				react.createElement("div", { className: "dsh-pc-heat-grid", style: gridStyle },
					monthSpans(weeks).map((s) => react.createElement("div", {
						key: s.col,
						className: "dsh-pc-heat-label",
						style: { gridColumn: (s.col + 1) + " / " + (s.end + 1) }
					}, t("months")[s.month]))
				),
				react.createElement("div", { className: "dsh-pc-heat-grid", style: gridStyle }, cells)
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
				className: "dsh-pc-heat-cell",
				"data-level": s === 0 ? 0 : Math.max(1, Math.min(5, Math.round((s / maxSum) * 5)))
			}));
			return react.createElement("div", { className: "dsh-pc-heat" },
				react.createElement("div", { className: "dsh-pc-heat-grid", style: gridStyle },
					monthSpans(weeks).map((s) => react.createElement("div", {
						key: s.col,
						className: "dsh-pc-heat-label",
						style: { gridColumn: (s.col + 1) + " / " + (s.end + 1) }
					}, t("months")[s.month]))
				),
				react.createElement("div", { className: "dsh-pc-heat-grid", style: gridStyle }, cells)
			);
		}

		/** 累计:最近 12 个月的累计柱状图。 */
		function ActivityCumulative({ t, monthly }) {
			const max = Math.max.apply(null, monthly.totals) || 1;
			return react.createElement("div", { className: "dsh-pc-cum" },
				monthly.months.map((m, i) => react.createElement("div", { key: m.year + "-" + m.month, className: "dsh-pc-cum-col" },
					react.createElement("div", {
						className: "dsh-pc-cum-bar",
						style: { height: Math.max(2, Math.round((monthly.totals[i] / max) * 78)) + "px" }
					}),
					react.createElement("div", { className: "dsh-pc-cum-label" }, t("months")[m.month])
				))
			);
		}

		/** Token 活动容器:标题行(标题+切换)+ 每日/每周/累计内容。 */
		function TokenActivity({ t, weeks, monthly }) {
			const [mode, setMode] = react.useState("daily");
			return react.createElement("div", { className: "dsh-pc-activity" },
				react.createElement("div", { className: "dsh-pc-activity-head" },
					react.createElement("h3", { className: "dsh-pc-group dsh-pc-activity-title" }, t("activityTitle")),
					react.createElement(ActivityModeToggle, { t, mode, setMode })
				),
				mode === "daily" ? react.createElement(ActivityDaily, { t, weeks })
					: mode === "weekly" ? react.createElement(ActivityWeekly, { t, weeks })
					: react.createElement(ActivityCumulative, { t, monthly })
			);
		}
		//#endregion

		//#region profile tab
		/**
		 * 统计卡片。
		 * @param {string} label 卡片标签
		 * @param {string} value 主数值
		 * @param {string} [sub] 副文案
		 */
		function StatCard(label, value, sub) {
			return react.createElement("div", { className: "dsh-pc-stat" },
				react.createElement("div", { className: "dsh-pc-stat-label" }, label),
				react.createElement("div", { className: "dsh-pc-stat-value" }, value),
				sub !== void 0 && react.createElement("div", { className: "dsh-pc-stat-sub" }, sub)
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
					react.createElement("button", { className: "dsh-ci-button dsh-ci-primary", onClick: reload }, t("retry"))
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
					react.createElement("div", { className: "dsh-pc-grid" },
						StatCard(t("tokens"), fmtNumber(m.today?.tokens), "今日"),
						StatCard(t("sessions"), fmtNumber(m.today?.sessions), "今日"),
						StatCard(t("toolCalls"), fmtNumber(m.today?.toolCalls), "今日")
					),
					react.createElement("h3", { className: "dsh-pc-group" }, t("totalTitle")),
					react.createElement("div", { className: "dsh-pc-grid" },
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
					react.createElement("div", { className: "dsh-pc-tools" },
						byModel.map((row) => react.createElement("div", { key: row.provider + ":" + row.model, className: "dsh-pc-tool-row" },
							react.createElement("div", { className: "dsh-pc-model" },
								react.createElement("span", { className: "dsh-pc-tool-name" }, row.model),
								react.createElement("span", { className: "dsh-pc-model-sub" },
									row.provider + (row.cacheHitRate !== null ? " · " + fmtPct(row.cacheHitRate) + " " + t("cacheShort") : "")
								)
							),
							react.createElement("span", { className: "dsh-pc-tool-calls" },
								fmtNumber(row.tokens) + " " + t("tokensUnit") + " · " + fmtNumber(row.requests) + " " + t("toolsCount") +
								(row.cost !== null && row.cost !== undefined ? " · " + fmtPrice(row.cost, row.currency) : "")
							)
						))
					)
				)
				: sub === "tools" ? react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement("h3", { className: "dsh-pc-group" }, t("topTools")),
					react.createElement("div", { className: "dsh-pc-tools" },
						tools.map((tool) => react.createElement("div", { key: tool.name, className: "dsh-pc-tool-row" },
							react.createElement("span", { className: "dsh-pc-tool-name" }, tool.name),
							react.createElement("span", { className: "dsh-pc-tool-calls" }, fmtNumber(tool.calls) + " " + t("toolsCount"))
						))
					),
					react.createElement("h3", { className: "dsh-pc-group" }, t("sessionsTitle")),
					react.createElement("div", { className: "dsh-pc-tools" },
						sessions.length === 0
							? react.createElement("p", { className: "dsh-pc-mock" }, t("unnamed"))
							: sessions.map((s) => react.createElement("div", { key: s.id || s.createdAt, className: "dsh-pc-tool-row" },
								react.createElement("div", { className: "dsh-pc-session" },
									react.createElement("span", { className: "dsh-pc-session-title" }, s.title || t("unnamed")),
									react.createElement("span", { className: "dsh-pc-session-sub" },
										(s.createdAt ? fmtDate(s.createdAt, months) : "") +
										(s.durationMs ? " · " + fmtDuration(s.durationMs) : "")
									)
								),
								react.createElement("span", { className: "dsh-pc-tool-calls" },
									fmtNumber(s.tokens) + " " + t("tokensUnit") + " · " + fmtPct(s.cacheHitRate) + " " + t("cacheShort")
								)
							))
					)
				)
				: react.createElement("div", { className: "dsh-pc-panel" },
					react.createElement(CostEditor, { t, onSaved: reload })
				);

			return react.createElement("div", { className: "dsh-pc-panel" },
				react.createElement("div", { className: "dsh-pc-pill-tabs", role: "tablist" },
					PillTabButton("overview", t("subOverview"), sub, setSub),
					PillTabButton("tools", t("subTools"), sub, setSub),
					PillTabButton("cost", t("subCost"), sub, setSub)
				),
				block
			);
		}
		//#endregion

		//#region personalization tab(自定义指令)
		/**
		 * 「个性化」tab:自定义指令文本框(读写走 /personal-center/custom-instructions)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function PersonalizationTab({ t }) {
			const { text: persisted, save } = useCustomInstructions();
			const [draft, setDraft] = react.useState("");
			const [state, setState] = react.useState("idle"); // idle | saving | saved | failed
			// 用户是否正在编辑:只在"未编辑"时才允许外部持久值覆盖 draft,
			// 避免异步读取落地时把用户刚输入的内容清空。
			const dirtyRef = react.useRef(false);
			react.useEffect(() => {
				if (!dirtyRef.current) setDraft(persisted);
			}, [persisted]);

			const dirty = draft !== persisted;

			const onSave = () => {
				if (state === "saving") return;
				setState("saving");
				save(draft).then(() => {
					dirtyRef.current = false;
					setState("saved");
					setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1600);
				}).catch(() => {
					setState("failed");
				});
			};
			const onClear = () => {
				dirtyRef.current = false;
				setDraft("");
				setState("idle");
				save("").catch(() => setState("failed"));
			};
			const onChange = (e) => {
				dirtyRef.current = true;
				setDraft(e.target.value);
				if (state === "saved" || state === "failed") setState("idle");
			};

			return react.createElement("div", { className: "dsh-pc-panel" },
				react.createElement("div", { className: "dsh-ci-header" },
					react.createElement("h2", { className: "dsh-ci-title" }, t("title")),
					react.createElement("div", { className: "dsh-ci-actions" },
						draft !== "" && react.createElement("button", {
							className: "dsh-ci-button dsh-ci-secondary",
							onClick: onClear
						}, t("clear")),
						react.createElement("button", {
							className: "dsh-ci-button dsh-ci-primary",
							disabled: state === "saving" || !dirty,
							onClick: onSave
						}, state === "saved" ? t("saved") : state === "failed" ? t("saveFailed") : t("save"))
					)
				),
				react.createElement("p", { className: "dsh-ci-hint" }, t("hint")),
				react.createElement("textarea", {
					className: "dsh-ci-textarea",
					value: draft,
					spellCheck: false,
					placeholder: t("placeholder"),
					onChange: onChange
				})
			);
		}
		//#endregion

		//#region cost editor(成本估算折叠区)
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

			return react.createElement("div", { className: "dsh-pc-cost" },
				react.createElement("p", { className: "dsh-pc-cost-hint" }, t("costHint")),
				rows.length === 0 && react.createElement("p", { className: "dsh-pc-cost-hint" }, t("costNoModels")),
				rows.map((r, i) => react.createElement("div", { key: r.key, className: "dsh-pc-cost-model" },
						react.createElement("div", { className: "dsh-pc-cost-model-head" },
							react.createElement("span", { className: "dsh-pc-cost-key" }, r.key),
							react.createElement("button", { className: "dsh-ci-button dsh-ci-secondary", onClick: () => setRows((rs) => rs.filter((_, idx) => idx !== i)) }, t("costDelete")),
							react.createElement("label", { className: "dsh-pc-cost-cur" }, t("costCurrency"),
								react.createElement("select", { value: r.currency, onChange: (e) => update(i, { currency: e.target.value }) },
									react.createElement("option", { value: "cny" }, "¥ CNY"),
									react.createElement("option", { value: "usd" }, "$ USD")
								)
							)
						),
						react.createElement("div", { className: "dsh-pc-cost-row" },
							react.createElement("span", { className: "dsh-pc-cost-tier" }, t("costOffpeak")),
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
						react.createElement("div", { className: "dsh-pc-cost-row" },
							react.createElement("label", { className: "dsh-pc-cost-tier" },
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
					react.createElement("div", { className: "dsh-pc-cost-addrow" },
						react.createElement("input", { list: "dsh-pc-provider-list", placeholder: t("costProvider"), value: addProvider, onChange: (e) => setAddProvider(e.target.value) }),
						react.createElement("datalist", { id: "dsh-pc-provider-list" },
							KNOWN_PROVIDERS.map((p) => react.createElement("option", { key: p, value: p }))
						),
						react.createElement("input", { list: "dsh-pc-model-list", placeholder: t("costModel"), value: addModel, onChange: (e) => setAddModel(e.target.value) }),
						react.createElement("datalist", { id: "dsh-pc-model-list" },
							suggestModels(addProvider).map((m) => react.createElement("option", { key: m, value: m }))
						),
						react.createElement("button", { className: "dsh-ci-button dsh-ci-secondary dsh-pc-cost-addbtn", onClick: addRow }, t("costAdd"))
					),
					react.createElement("div", { className: "dsh-ci-actions" },
						react.createElement("button", { className: "dsh-ci-button dsh-ci-secondary", onClick: applyPresets }, t("costPreset")),
						react.createElement("button", { className: "dsh-ci-button dsh-ci-primary", disabled: saving, onClick: save },
							saved ? t("costSaved") : t("costSave"))
					)
			);
		}
		//#endregion

		//#region desktop pet(纯 DOM 浮层;素材为宿主托管的动画 WebP,阈值经本机真实数据校准)
		// 行为参考 Codex 宠物规范:默认待机静止(单帧静态表情,不循环),悬停/点击才按当前情绪
		// 播放一次动作动画;拖拽自由定位并持久化;透明度实时可调。
		const PET_ASSET_BASE = "/personal-center/pet/assets/";
		const PET_SKINS = ["black-whale", "blue-whale"];
		/** enabled 归一化:旧 boolean 配置迁移为皮肤 id / 空("" = 全部关闭,互斥只能开一只)。 */
		function petNormalizeEnabled(v) {
			if (typeof v === "boolean") return v ? "black-whale" : "";
			return PET_SKINS.indexOf(v) >= 0 ? v : "";
		}
		const PET_EMOTIONS = ["happy", "busy", "exhausted", "money-pain", "dozing"];
		/** 动作动画播放时长(ms):6 帧 × (90~250ms) ≈ 0.7~1.5s/圈,播约 1.5~3 圈后回待机。 */
		const PET_ACTION_MS = 2200;
		/**
		 * 情绪阈值(内置,基于本机真实数据校准,见 docs/DESKTOP-PET.md):
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

		/** 情绪状态机(3 秒防抖,轮询 30s 时极少触发切换抖动)。 */
		class PetEmotionMachine {
			constructor(thresholds, debounceMs) {
				this.thresholds = { ...PET_THRESHOLDS, ...thresholds };
				this.debounceMs = debounceMs;
				this.currentEmotion = "happy";
				this.pendingEmotion = null;
				this.debounceTimer = null;
				this.listeners = [];
			}
			update(stats) {
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
		function petFmtNum(n) {
			if (typeof n !== "number" || !Number.isFinite(n)) return "0";
			if (n >= 1e8) return (n / 1e8).toFixed(1) + "亿";
			if (n >= 1e4) return (n / 1e4).toFixed(1) + "万";
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

			/** 播放一次当前情绪的动作动画(悬停/点击触发),结束后回待机静止。 */
			playAction() {
				if (this._destroyed || !this._currentEmotion) return;
				this._acting = true;
				this._setImg(this._currentEmotion, "animations");
				if (this._actionTimer) clearTimeout(this._actionTimer);
				this._actionTimer = setTimeout(() => this._endAction(), PET_ACTION_MS);
			}

			_endAction() {
				this._actionTimer = null;
				this._acting = false;
				if (this._currentEmotion) this._setImg(this._currentEmotion, "idle");
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

			/** 切换皮肤(重载当前情绪的素材,保持待机/动作状态)。 */
			setSkin(skin) {
				if (PET_SKINS.indexOf(skin) < 0) return;
				this.options.skin = skin;
				this._imgKind = {}; // 强制按新皮肤重新加载
				if (this._currentEmotion) this._setImg(this._currentEmotion, this._acting ? "animations" : "idle");
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
				this._menuEl.style.left = Math.max(0, Math.min(x, window.innerWidth - 140)) + "px";
				this._menuEl.style.top = Math.max(0, Math.min(y, window.innerHeight - 80)) + "px";
				this._menuEl.classList.add("open");
			}

			_closeMenu() {
				if (this._menuEl) this._menuEl.classList.remove("open");
			}

			_bindEvents() {
				this._onClick = (e) => {
					if (this._dragState && this._dragState.moved) return;
					this._containerEl.classList.add("clicked");
					setTimeout(() => this._containerEl.classList.remove("clicked"), 300);
					this.playAction();
					this.showBubble(this._pickBubble());
				};
				this._containerEl.addEventListener("click", this._onClick);
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
			}

			_unbindEvents() {
				this._containerEl.removeEventListener("click", this._onClick);
				if (this._onEnter) this._containerEl.removeEventListener("pointerenter", this._onEnter);
				if (this._onContextMenu) this._containerEl.removeEventListener("contextmenu", this._onContextMenu);
				if (this._onDocClick) document.removeEventListener("click", this._onDocClick);
				if (this._onPointerDown) this._containerEl.removeEventListener("pointerdown", this._onPointerDown);
				if (this._onPointerMove) document.removeEventListener("pointermove", this._onPointerMove);
				if (this._onPointerUp) document.removeEventListener("pointerup", this._onPointerUp);
				if (this._onPointerCancel) document.removeEventListener("pointercancel", this._onPointerCancel);
			}

			_pickBubble() {
				if (!this._hasStats) return this.options.bubbleT("petBubbleLoading");
				const s = this._lastStats;
				const pool = [];
				if (typeof s.tokens_today === "number") pool.push(this.options.bubbleT("petBubbleTokens", { tokens: petFmtNum(s.tokens_today) }));
				if (typeof s.cache_hit_rate === "number") pool.push(this.options.bubbleT("petBubbleCache", { rate: Math.round(s.cache_hit_rate * 100) }));
				if (s.top_tool) pool.push(this.options.bubbleT("petBubbleTools", { tool: s.top_tool }));
				if (typeof s.cost_today === "number" && s.cost_today > 0) pool.push(this.options.bubbleT(s.cost_currency === "usd" ? "petBubbleCostUsd" : "petBubbleCost", { cost: s.cost_today.toFixed(2) }));
				if (pool.length === 0) return this.options.bubbleT("petBubbleIdle");
				return pool[Math.floor(Math.random() * pool.length)];
			}

			_startDrag(e) {
				e.preventDefault();
				// 拖拽时停止动作,回待机静止
				if (this._actionTimer) {
					clearTimeout(this._actionTimer);
					this._actionTimer = null;
				}
				this._acting = false;
				if (this._currentEmotion) this._setImg(this._currentEmotion, "idle");
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
				this._applyPosition();
			}

			_endDrag() {
				if (!this._dragState) return;
				this._containerEl.classList.remove("dragging");
				document.removeEventListener("pointermove", this._onPointerMove);
				document.removeEventListener("pointerup", this._onPointerUp);
				document.removeEventListener("pointercancel", this._onPointerCancel);
				this._dragState = null;
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
					// 视口内钳制:窗口缩放后不丢宠物
					const w = this._containerEl.offsetWidth;
					const h = this._containerEl.offsetHeight;
					const left = Math.max(0, Math.min(window.innerWidth - w, this._positionOverride.left || 0));
					const top = Math.max(0, Math.min(window.innerHeight - h, this._positionOverride.top || 0));
					this._positionOverride = { left, top };
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
				img.src = PET_ASSET_BASE + this.options.skin + "/" + kind + "/" + emotion + ".webp";
			}

			_switchEmotion(emotion) {
				if (emotion === this._currentEmotion) return;
				const prev = this._currentEmotion;
				if (prev && this._imgEls[prev]) this._imgEls[prev].classList.remove("active");
				this._currentEmotion = emotion;
				const img = this._imgEls[emotion];
				img.classList.add("active");
				this._setImg(emotion, this._acting ? "animations" : "idle");
				this._containerEl.classList.remove("emotion-" + prev);
				this._containerEl.classList.add("emotion-" + emotion);
				// 情绪变化时播放一次对应动画(让变化可见),播完回待机静止;逗弄中则沿用正在播的动画
				this.playAction();
			}
		}

		// 宠物全局控制器(工厂作用域共享:启动挂载 + 设置面板调用)
		let petWidget = null;
		let petPollTimer = null;
		let petConfig = { enabled: "black-whale", skin: "black-whale", size: "medium", position: "bottom-right", posOverride: null, opacity: 1 };
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
				onHide: petHide
			});
			petFetchStats();
			petPollTimer = setInterval(petFetchStats, 30000);
		}

		function petUnmount() {
			if (petPollTimer) {
				clearInterval(petPollTimer);
				petPollTimer = null;
			}
			if (petWidget) {
				petWidget.destroy();
				petWidget = null;
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
					setCfg({ enabled: "black-whale", skin: "black-whale", size: "small", position: "bottom-right", posOverride: null, opacity: 1 });
				});
				const sync = () => {
					setStats(petCtl.getStats());
					setEmotion(petCtl.getEmotion());
				};
				sync();
				const id = setInterval(sync, 3000);
				return () => { alive = false; clearInterval(id); };
			}, []);
			// 卡片形象随机表情动画:面板打开期间,每 10s 随机播放一个小表情动画(~2.2s),
			// 与消耗数据无关(纯随机),代表"宠物是活的";离开面板即停,省资源。
			const [anim, setAnim] = react.useState({});
			react.useEffect(() => {
				let alive = true;
				const timers = [];
				const playRandom = () => {
					if (!alive) return;
					const next = {};
					for (const s of PET_SKINS) {
						next[s] = PET_EMOTIONS[Math.floor(Math.random() * PET_EMOTIONS.length)];
					}
					setAnim(next);
					timers.push(setTimeout(() => { if (alive) setAnim({}); }, PET_ACTION_MS));
				};
				playRandom(); // 用户进来先动一下,代表"活的"
				const iv = setInterval(playRandom, 10000);
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
			const statTokens = stats ? petFmtNum(stats.tokens_today) : "—";
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
					? PET_ASSET_BASE + id + "/idle/" + cardEmotion + ".webp"
					: PET_ASSET_BASE + id + "/idle/happy.webp";
				const asset = animEmo ? PET_ASSET_BASE + id + "/animations/" + animEmo + ".webp" : staticAsset;
				return react.createElement("div", {
					className: "dsh-pc-pet-card dsh-pc-pet-pick"
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

		//#region personal center section(标题 + 描述 + Tab 切换,参考插件分区)
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
				className: "dsh-pc-pill-tab",
				role: "tab",
				"data-active": active === id,
				"aria-selected": active === id,
				onClick: () => setTab(id)
			}, label);
		}

		/**
		 * 「个人」分区:标题 + 描述 + Tab 栏(个人资料 / 个性化)。
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
					TabButton("pet", t("subPet"), tab, setTab)
				),
				react.createElement("div", { className: "dsh-pc-panel", role: "tabpanel" },
					tab === "profile"
						? react.createElement(ProfileTab, { t })
						: tab === "personalization"
							? react.createElement(PersonalizationTab, { t })
							: react.createElement(PetPanel, { t, petCtl })
				)
			);
		}
		//#endregion

		//#region plugin
		/** 所需客户端服务:slots(插槽注册)、locale(文案)。 */
		const inject = ["slots", "locale"];

		/**
		 * 客户端插件主体:注册「个人」分区。
		 * @param {import('@deepseek-ai/cordis').Context} ctx
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "personal-center: copy dictionaries");
			const t = ctx.locale.bind(LOCALE_NS);
			// 气泡文案(带 {var} 插值;DSH locale 的插值语法不确定,手动替换保险)
			petBubbleT = (key, vars) => {
				let s = t(key);
				if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
				return s;
			};
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
								opacity: typeof d.opacity === "number" ? d.opacity : 1
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
							opacity: typeof d.opacity === "number" ? d.opacity : 1
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
