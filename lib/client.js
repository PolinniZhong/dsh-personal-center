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
				"topTools": "常用工具",
				"byModelTitle": "按模型分布",
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
				"topTools": "Top tools",
				"byModelTitle": "By model",
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
					StatCard(t("totalSessions"), fmtNumber(m.total?.sessions))
				),
				react.createElement(TokenActivity, { t, weeks, monthly }),
				react.createElement("h3", { className: "dsh-pc-group" }, t("byModelTitle")),
				react.createElement("div", { className: "dsh-pc-tools" },
					byModel.map((row) => react.createElement("div", { key: row.provider + ":" + row.model, className: "dsh-pc-tool-row" },
						react.createElement("div", { className: "dsh-pc-model" },
							react.createElement("span", { className: "dsh-pc-tool-name" }, row.model),
							react.createElement("span", { className: "dsh-pc-model-sub" }, row.provider)
						),
						react.createElement("span", { className: "dsh-pc-tool-calls" },
							fmtNumber(row.tokens) + " " + t("tokensUnit") + " · " + fmtNumber(row.requests) + " " + t("toolsCount")
						)
					))
				),
				react.createElement("h3", { className: "dsh-pc-group" }, t("topTools")),
				react.createElement("div", { className: "dsh-pc-tools" },
					tools.map((tool) => react.createElement("div", { key: tool.name, className: "dsh-pc-tool-row" },
						react.createElement("span", { className: "dsh-pc-tool-name" }, tool.name),
						react.createElement("span", { className: "dsh-pc-tool-calls" }, fmtNumber(tool.calls) + " " + t("toolsCount"))
					))
				)
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
