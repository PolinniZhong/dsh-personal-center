/**
 * dsh-personal-center — 浏览器端。
 *
 * 设置里「个人」分区,版式与配色交互完全参考「插件」分区:
 *   顶栏标题「个人」→ 描述 → Tab 栏(个人资料 / 个性化)切换内容:
 *   - 「个人资料」:Token 消耗 / 会话 / 工具调用 / Token 活动(每日·每周·累计)
 *     / 按模型分布 / 常用工具 —— 数据来自宿主端环回路由 /personal-center/stats;
 *   - 「个性化」:自定义指令多行文本框(全局注入,见宿主端)。
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
			/* 成本估算编辑器 */
			".dsh-pc-cost{display:flex;flex-direction:column;gap:8px;margin-top:2px}" +
			".dsh-pc-cost-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
			".dsh-pc-cost-key{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);min-width:200px;flex:1}" +
			".dsh-pc-cost input[type=number],.dsh-pc-cost select{box-sizing:border-box;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;height:24px;padding:0 6px;font-size:12px;font-family:inherit;outline:none}" +
			".dsh-pc-cost input[type=number]{width:72px}" +
			".dsh-pc-cost input:focus,.dsh-pc-cost select:focus{border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-pc-cost label{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px;white-space:nowrap}" +
			".dsh-pc-cost-addrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
			".dsh-pc-cost-addrow input{box-sizing:border-box;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;height:24px;padding:0 8px;font-size:12px;font-family:inherit;outline:none;width:180px}" +
			".dsh-pc-cost-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}" +
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
			".dsh-ci-actions{display:flex;gap:8px;align-items:center}" +
			".dsh-ci-button{cursor:pointer;border:none;border-radius:6px;height:24px;padding:0 12px;font-size:11px;line-height:18px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center}" +
			".dsh-ci-button:disabled{opacity:.5;cursor:default}" +
			".dsh-ci-primary{border-radius:12px;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}" +
			".dsh-ci-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}" +
			".dsh-ci-primary:disabled{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);opacity:1}" +
			".dsh-ci-secondary{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}" +
			".dsh-ci-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}" +
			".dsh-ci-readonly{color:var(--dsw-alias-label-secondary);font-size:13px;margin:0}";
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
				"costPeak": "峰谷",
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
		 * 「个人资料」tab:统计概览(真实数据,来自 /personal-center/stats)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function ProfileTab({ t }) {
			const { state, reload } = useStats();

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

			return react.createElement("div", { className: "dsh-pc-panel" },
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
				),
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
				),
				react.createElement(CostEditor, { t })
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
		function CostEditor({ t }) {
			const [open, setOpen] = react.useState(false);
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
					const found = Object.entries(PRICE_PRESETS).find(([k, p]) => k === r.key || k.endsWith("::" + r.model));
					if (!found) return r;
					const [k, p] = found;
					const [provider] = k.split("::");
					return {
						...r, provider, key: provider + "::" + r.model,
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
				}).catch(() => setSaving(false));
			};

			const cur = (c) => (c === "usd" ? t("costCurUsd") : t("costCurCny"));

			return react.createElement("div", { className: "dsh-pc-cost" },
				react.createElement("div", { className: "dsh-pc-activity-head" },
					react.createElement("h3", { className: "dsh-pc-group dsh-pc-activity-title" }, t("costEditorTitle")),
					react.createElement("button", {
						className: "dsh-ci-button dsh-ci-secondary",
						onClick: () => setOpen((v) => !v)
					}, open ? "▲" : "▼")
				),
				open && react.createElement(react.Fragment, null,
					react.createElement("p", { className: "dsh-pc-cost-hint" }, t("costHint")),
					rows.length === 0 && react.createElement("p", { className: "dsh-pc-cost-hint" }, t("costNoModels")),
					rows.map((r, i) => react.createElement("div", { key: r.key, className: "dsh-pc-cost-row" },
						react.createElement("span", { className: "dsh-pc-cost-key" }, r.key),
						react.createElement("select", { value: r.currency, onChange: (e) => update(i, { currency: e.target.value }) },
							react.createElement("option", { value: "cny" }, "¥ CNY"),
							react.createElement("option", { value: "usd" }, "$ USD")
						),
						react.createElement("label", null, t("costInputMiss"),
							react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.inputMiss, onChange: (e) => update(i, { inputMiss: e.target.value }) })
						),
						react.createElement("label", null, t("costInputHit"),
							react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.inputHit, onChange: (e) => update(i, { inputHit: e.target.value }) })
						),
						react.createElement("label", null, t("costOutput"),
							react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.output, onChange: (e) => update(i, { output: e.target.value }) })
						),
						react.createElement("label", null, t("costPeak"),
							react.createElement("input", { type: "checkbox", checked: r.peak, onChange: (e) => update(i, { peak: e.target.checked }) })
						),
						r.peak && react.createElement(react.Fragment, null,
							react.createElement("label", null, "P" + t("costInputMiss"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.peakMiss, onChange: (e) => update(i, { peakMiss: e.target.value }) })
							),
							react.createElement("label", null, "P" + t("costInputHit"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.peakHit, onChange: (e) => update(i, { peakHit: e.target.value }) })
							),
							react.createElement("label", null, "P" + t("costOutput"),
								react.createElement("input", { type: "number", step: "0.01", min: "0", value: r.peakOut, onChange: (e) => update(i, { peakOut: e.target.value }) })
							)
						),
						react.createElement("button", { className: "dsh-ci-button dsh-ci-secondary", onClick: () => setRows((rs) => rs.filter((_, idx) => idx !== i)) }, t("costDelete"))
					)),
					react.createElement("div", { className: "dsh-pc-cost-addrow" },
						react.createElement("input", { placeholder: t("costProvider"), value: addProvider, onChange: (e) => setAddProvider(e.target.value) }),
						react.createElement("input", { placeholder: t("costModel"), value: addModel, onChange: (e) => setAddModel(e.target.value) }),
						react.createElement("button", { className: "dsh-ci-button dsh-ci-secondary", onClick: addRow }, t("costAdd"))
					),
					react.createElement("div", { className: "dsh-ci-actions" },
						react.createElement("button", { className: "dsh-ci-button dsh-ci-secondary", onClick: applyPresets }, t("costPreset")),
						react.createElement("button", { className: "dsh-ci-button dsh-ci-primary", disabled: saving, onClick: save },
							saved ? t("costSaved") : t("costSave"))
					)
				)
			);
		}
		//#endregion

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
		 * 「个人」分区:标题 + 描述 + Tab 栏(个人资料 / 个性化)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function PersonalCenterSection({ t }) {
			const [tab, setTab] = react.useState("profile");
			return react.createElement("div", { className: "dsh-pc-section" },
				react.createElement("h2", { className: "dsh-pc-heading" }, t("heading")),
				react.createElement("p", { className: "dsh-pc-intro" }, t("intro")),
				react.createElement("div", { className: "dsh-pc-tabs", role: "tablist" },
					TabButton("profile", t("tabProfile"), tab, setTab),
					TabButton("personalization", t("tabPersonalization"), tab, setTab)
				),
				react.createElement("div", { className: "dsh-pc-panel", role: "tabpanel" },
					tab === "profile"
						? react.createElement(ProfileTab, { t })
						: react.createElement(PersonalizationTab, { t })
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
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "personal-center",
				order: 30,
				label: () => t("nav"),
				inject: () => ({ t })
			}, PersonalCenterSection));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
