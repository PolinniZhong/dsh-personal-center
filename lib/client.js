/**
 * dsh-personal-center — 浏览器端。
 *
 * v0.2(UI 预览版):设置里「个人」分区,版式与配色交互完全参考「插件」分区:
 *   顶栏标题「个人」→ 描述 → Tab 栏(个人资料 / 个性化设置)切换内容:
 *   - 「个人资料」:累计 Token / 最长聊天时长 / 常用工具 等统计卡片。
 *     当前为【示例数据】,统计 RPC 接入后显示真实用量(见 docs/PLAN.md M2/M3);
 *   - 「个性化设置」:自定义指令多行文本框(原「个性化」功能迁入,数据不丢)。
 *
 * 预留:未来 Omi 等插件可停靠「语音」tab(本期不做)。
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
			".dsh-pc-group:first-of-type{margin-top:12px}" +
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
			".dsh-ci-button{cursor:pointer;border:none;border-radius:4px;height:24px;padding:0 12px;font-size:13px;line-height:22px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center}" +
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
				"title": "自定义指令",
				"hint": "向此主机上的所有聊天提供额外的说明和上下文。保存后,每个新请求都会带上这段指令。",
				"placeholder": "输入你的自定义指令……",
				"save": "保存",
				"saved": "已保存",
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
				"title": "Custom Instructions",
				"hint": "Provide additional instructions and context for all chats on this host. Every new request includes them after you save.",
				"placeholder": "Type your custom instructions…",
				"save": "Save",
				"saved": "Saved",
				"clear": "Clear",
				"readOnly": "The settings document is read-only in this deployment."
			}
		};
		//#endregion

		//#region helpers
		const NS = "custom-instructions";

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
		//#endregion

		//#region mock data(UI 预览用;接入统计 RPC 后替换)
		const MOCK_STATS = {
			today: { tokens: 128456, sessions: 6, toolCalls: 47 },
			total: { tokens: 3402156, sessions: 128, longestChatMs: 8100000 },
			byModel: [
				{ provider: "deepseek-official", model: "deepseek-v4-flash", tokens: 2410500, requests: 342 },
				{ provider: "deepseek-official", model: "deepseek-r1", tokens: 680000, requests: 58 },
				{ provider: "anthropic", model: "claude-sonnet-4-5", tokens: 311656, requests: 24 }
			],
			tools: [
				{ name: "bash", calls: 342 },
				{ name: "read", calls: 210 },
				{ name: "write", calls: 156 },
				{ name: "edit", calls: 98 },
				{ name: "web_search", calls: 41 },
				{ name: "mcp__github__search", calls: 35 }
			]
		};
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
		 * 「个人资料」tab:统计概览(示例数据)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function ProfileTab({ t }) {
			const m = MOCK_STATS;
			return react.createElement("div", { className: "dsh-pc-panel" },
				react.createElement("p", { className: "dsh-pc-mock" }, t("mockHint")),
				react.createElement("h3", { className: "dsh-pc-group" }, t("todayTitle")),
				react.createElement("div", { className: "dsh-pc-grid" },
					StatCard(t("tokens"), fmtNumber(m.today.tokens), "今日"),
					StatCard(t("sessions"), fmtNumber(m.today.sessions), "今日"),
					StatCard(t("toolCalls"), fmtNumber(m.today.toolCalls), "今日")
				),
				react.createElement("h3", { className: "dsh-pc-group" }, t("totalTitle")),
				react.createElement("div", { className: "dsh-pc-grid" },
					StatCard(t("totalTokens"), fmtNumber(m.total.tokens)),
					StatCard(t("longestChat"), fmtDuration(m.total.longestChatMs)),
					StatCard(t("totalSessions"), fmtNumber(m.total.sessions))
				),
				react.createElement("h3", { className: "dsh-pc-group" }, t("byModelTitle")),
				react.createElement("div", { className: "dsh-pc-tools" },
					m.byModel.map((row) => react.createElement("div", { key: row.provider + ":" + row.model, className: "dsh-pc-tool-row" },
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
					m.tools.map((tool) => react.createElement("div", { key: tool.name, className: "dsh-pc-tool-row" },
						react.createElement("span", { className: "dsh-pc-tool-name" }, tool.name),
						react.createElement("span", { className: "dsh-pc-tool-calls" }, fmtNumber(tool.calls) + " " + t("toolsCount"))
					))
				)
			);
		}
		//#endregion

		//#region personalization tab(迁入自 v0.1)
		/**
		 * 「个性化设置」tab:自定义指令文本框。
		 * @param {{ t: (key: string) => string, scope: import('@deepseek-ai/dsh-client-ui-settings').SettingsScopeController }} props
		 */
		function PersonalizationTab({ t, scope }) {
			const snapshot = react.useSyncExternalStore(
				scope.subscribe.bind(scope),
				scope.getSnapshot.bind(scope)
			);
			const persisted = snapshot && snapshot.value && typeof snapshot.value.text === "string"
				? snapshot.value.text
				: "";
			const [draft, setDraft] = react.useState(persisted);
			const [state, setState] = react.useState("idle"); // idle | saving | saved
			react.useEffect(() => {
				setDraft(persisted);
			}, [persisted]);

			const dirty = draft !== persisted;
			const writable = snapshot ? snapshot.writable !== false : true;

			const onSave = () => {
				if (!writable || state === "saving") return;
				setState("saving");
				scope.set("text", draft).then(() => {
					setState("saved");
					setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1600);
				});
			};
			const onClear = () => {
				if (!writable) return;
				setDraft("");
				scope.unset("text");
			};

			return react.createElement("div", { className: "dsh-pc-panel" },
				react.createElement("div", { className: "dsh-ci-header" },
					react.createElement("h2", { className: "dsh-ci-title" }, t("title")),
					react.createElement("div", { className: "dsh-ci-actions" },
						draft !== "" && react.createElement("button", {
							className: "dsh-ci-button dsh-ci-secondary",
							disabled: !writable,
							onClick: onClear
						}, t("clear")),
						react.createElement("button", {
							className: "dsh-ci-button dsh-ci-primary",
							disabled: !writable || state === "saving" || !dirty,
							onClick: onSave
						}, state === "saved" ? t("saved") : t("save"))
					)
				),
				react.createElement("p", { className: "dsh-ci-hint" }, t("hint")),
				react.createElement("textarea", {
					className: "dsh-ci-textarea",
					value: draft,
					disabled: !writable,
					spellCheck: false,
					placeholder: t("placeholder"),
					onChange: (e) => {
						setDraft(e.target.value);
						if (state === "saved") setState("idle");
					}
				}),
				!writable && react.createElement("p", { className: "dsh-ci-readonly" }, t("readOnly"))
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
		 * 「个人」分区:标题 + 描述 + Tab 栏(个人资料 / 个性化设置)。
		 * @param {{ t: (key: string) => string, scope: import('@deepseek-ai/dsh-client-ui-settings').SettingsScopeController }} props
		 */
		function PersonalCenterSection({ t, scope }) {
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
						: react.createElement(PersonalizationTab, { t, scope })
				)
			);
		}
		//#endregion

		//#region plugin
		/** 所需客户端服务:slots(插槽注册)、locale(文案)、settingsScope(设置读写)。 */
		const inject = ["slots", "locale", "settingsScope"];

		/**
		 * 客户端插件主体:注册「个人」分区。
		 * @param {import('@deepseek-ai/cordis').Context} ctx
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "personal-center: copy dictionaries");
			const scope = ctx.settingsScope.bind({ namespace: NS });
			const t = ctx.locale.bind(LOCALE_NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "personal-center",
				order: 30,
				label: () => t("nav"),
				inject: () => ({ t, scope })
			}, PersonalCenterSection));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
