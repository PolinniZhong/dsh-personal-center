/**
 * dsh-personal-center — 浏览器端。
 *
 * v0.2(UI 预览版):设置里「个人」分区,版式参考「插件」分区:
 *   顶栏标题「个人」→ 描述 → 卡片列表(每张卡片可展开):
 *   - 「个人资料」:累计 Token / 最长聊天时长 / 常用工具 等统计卡片。
 *     当前为【示例数据】,统计 RPC 接入后显示真实用量(见 docs/PLAN.md M2/M3);
 *   - 「个性化设置」:自定义指令多行文本框(原「个性化」功能迁入,数据不丢)。
 *
 * 预留:未来 Omi 等插件可停靠「语音」卡片(本期不做)。
 */
window.__ModuleLoader__.load({
	id: "dsh-personal-center",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		//#region styles
		const css = "" +
			/* 分区骨架:标题 + 描述 + 卡片列表(参考插件分区版式) */
			".dsh-pc-section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}" +
			".dsh-pc-heading{margin:0;font-size:18px;font-weight:600}" +
			".dsh-pc-intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px}" +
			".dsh-pc-cards{flex-direction:column;gap:10px;margin:0;padding:0;list-style:none;display:flex}" +
			/* 卡片(展开/收起,参考插件卡片) */
			".dsh-pc-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}" +
			".dsh-pc-card:hover{border-color:var(--dsw-alias-label-dimmed)}" +
			".dsh-pc-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}" +
			".dsh-pc-card-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}" +
			".dsh-pc-card-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}" +
			".dsh-pc-card-headtext{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}" +
			".dsh-pc-card-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}" +
			".dsh-pc-card-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}" +
			".dsh-pc-chevron{width:8px;height:8px;border-right:2px solid var(--dsw-alias-label-tertiary);border-bottom:2px solid var(--dsw-alias-label-tertiary);flex:none;transform:rotate(45deg);transition:transform .16s}" +
			".dsh-pc-chevron-open{transform:rotate(225deg)}" +
			".dsh-pc-card-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:16px 0 12px}" +
			/* 统计卡片 */
			".dsh-pc-group{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:8px 0 10px}" +
			".dsh-pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}" +
			".dsh-pc-card-stat{background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px}" +
			".dsh-pc-card-stat-label{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			".dsh-pc-card-stat-value{color:var(--dsw-alias-label-primary);font-size:22px;font-weight:600;line-height:30px;font-variant-numeric:tabular-nums}" +
			".dsh-pc-card-stat-sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}" +
			/* 常用工具列表 */
			".dsh-pc-tools{display:flex;flex-direction:column;gap:10px}" +
			".dsh-pc-tool{display:flex;flex-direction:column;gap:6px}" +
			".dsh-pc-tool-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}" +
			".dsh-pc-tool-name{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}" +
			".dsh-pc-tool-calls{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px;font-variant-numeric:tabular-nums}" +
			".dsh-pc-bar{height:6px;border-radius:3px;background:var(--dsw-alias-interactive-bg-hover);overflow:hidden}" +
			".dsh-pc-bar-fill{height:100%;background:var(--dsw-static-neutral-bluish-400);border-radius:3px}" +
			/* 示例数据提示 */
			".dsh-pc-mock{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0}" +
			/* 自定义指令(个性化卡片,沿用 v0.1) */
			".dsh-ci-title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:500;line-height:24px;margin:0}" +
			".dsh-ci-hint{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;margin:0}" +
			".dsh-ci-textarea{box-sizing:border-box;width:100%;min-height:260px;resize:vertical;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:14px;line-height:22px}" +
			".dsh-ci-textarea:focus{outline:none;border-color:var(--dsw-static-neutral-bluish-400)}" +
			".dsh-ci-textarea:disabled{opacity:.6}" +
			".dsh-ci-actions{display:flex;gap:8px;align-items:center}" +
			".dsh-ci-button{cursor:pointer;border:none;border-radius:10px;padding:8px 18px;font-size:14px;line-height:20px;font-family:inherit}" +
			".dsh-ci-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}" +
			".dsh-ci-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}" +
			".dsh-ci-secondary{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:0 0}" +
			".dsh-ci-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}" +
			".dsh-ci-button:disabled{opacity:.5;cursor:default}" +
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
				"profileName": "个人资料",
				"profileDesc": "累计 Token、最长聊天时长、常用工具等使用统计",
				"personalizationName": "个性化设置",
				"personalizationDesc": "全局自定义指令,对这台主机上的所有聊天生效",
				"expand": "展开",
				"collapse": "收起",
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
				"profileName": "Profile",
				"profileDesc": "Total tokens, longest chat, top tools and other usage stats",
				"personalizationName": "Personalization",
				"personalizationDesc": "Global custom instructions applied to every chat on this host",
				"expand": "Expand",
				"collapse": "Collapse",
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

		//#region profile content
		/**
		 * 统计卡片。
		 * @param {string} label 卡片标签
		 * @param {string} value 主数值
		 * @param {string} [sub] 副文案
		 */
		function StatCard(label, value, sub) {
			return react.createElement("div", { className: "dsh-pc-card-stat" },
				react.createElement("div", { className: "dsh-pc-card-stat-label" }, label),
				react.createElement("div", { className: "dsh-pc-card-stat-value" }, value),
				sub !== void 0 && react.createElement("div", { className: "dsh-pc-card-stat-sub" }, sub)
			);
		}

		/**
		 * 「个人资料」卡片内容:统计概览(示例数据)。
		 * @param {{ t: (key: string) => string }} props
		 */
		function ProfileContent({ t }) {
			const m = MOCK_STATS;
			const maxCalls = m.tools.length > 0 ? m.tools[0].calls : 1;
			return react.createElement("div", { className: "dsh-pc-section" },
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
				react.createElement("h3", { className: "dsh-pc-group" }, t("topTools")),
				react.createElement("div", { className: "dsh-pc-tools" },
					m.tools.map((tool) => react.createElement("div", { key: tool.name, className: "dsh-pc-tool" },
						react.createElement("div", { className: "dsh-pc-tool-row" },
							react.createElement("span", { className: "dsh-pc-tool-name" }, tool.name),
							react.createElement("span", { className: "dsh-pc-tool-calls" }, fmtNumber(tool.calls) + " " + t("toolsCount"))
						),
						react.createElement("div", { className: "dsh-pc-bar" },
							react.createElement("div", { className: "dsh-pc-bar-fill", style: { width: (tool.calls / maxCalls) * 100 + "%" } })
						)
					))
				)
			);
		}
		//#endregion

		//#region personalization content(迁入自 v0.1)
		/**
		 * 「个性化设置」卡片内容:自定义指令文本框。
		 * @param {{ t: (key: string) => string, scope: import('@deepseek-ai/dsh-client-ui-settings').SettingsScopeController }} props
		 */
		function PersonalizationContent({ t, scope }) {
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

			return react.createElement("div", { className: "dsh-pc-section" },
				react.createElement("h2", { className: "dsh-ci-title" }, t("title")),
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
				react.createElement("div", { className: "dsh-ci-actions" },
					react.createElement("button", {
						className: "dsh-ci-button dsh-ci-primary",
						disabled: !writable || state === "saving" || !dirty,
						onClick: onSave
					}, state === "saved" ? t("saved") : t("save")),
					draft !== "" && react.createElement("button", {
						className: "dsh-ci-button dsh-ci-secondary",
						disabled: !writable,
						onClick: onClear
					}, t("clear"))
				),
				!writable && react.createElement("p", { className: "dsh-ci-readonly" }, t("readOnly"))
			);
		}
		//#endregion

		//#region personal center section(标题 + 描述 + 卡片列表,参考插件分区版式)
		/**
		 * 可展开卡片。
		 * @param {object} props
		 * @param {string} props.name 卡片标题
		 * @param {string} props.desc 卡片描述
		 * @param {boolean} props.open 是否展开
		 * @param {() => void} props.onToggle 切换展开
		 * @param {any} props.children 展开后的内容
		 * @param {{ t: (key: string) => string }} props.t
		 */
		function Card({ name, desc, open, onToggle, children, t }) {
			return react.createElement("li", { className: "dsh-pc-card" + (open ? " dsh-pc-card-open" : "") },
				react.createElement("button", {
					className: "dsh-pc-card-header",
					"aria-expanded": open,
					"aria-label": (open ? t("collapse") : t("expand")) + ": " + name,
					onClick: onToggle
				},
					react.createElement("div", { className: "dsh-pc-card-headtext" },
						react.createElement("div", { className: "dsh-pc-card-name" }, name),
						react.createElement("div", { className: "dsh-pc-card-desc" }, desc)
					),
					react.createElement("div", { className: "dsh-pc-chevron" + (open ? " dsh-pc-chevron-open" : "") })
				),
				open && react.createElement("div", { className: "dsh-pc-card-body" }, children)
			);
		}

		/**
		 * 「个人」分区:标题 + 描述 + 卡片列表(个人资料 / 个性化设置)。
		 * @param {{ t: (key: string) => string, scope: import('@deepseek-ai/dsh-client-ui-settings').SettingsScopeController }} props
		 */
		function PersonalCenterSection({ t, scope }) {
			const [openProfile, setOpenProfile] = react.useState(true);
			const [openPersonalization, setOpenPersonalization] = react.useState(false);
			return react.createElement("div", { className: "dsh-pc-section" },
				react.createElement("h2", { className: "dsh-pc-heading" }, t("heading")),
				react.createElement("p", { className: "dsh-pc-intro" }, t("intro")),
				react.createElement("ul", { className: "dsh-pc-cards" },
					react.createElement(Card, {
						name: t("profileName"),
						desc: t("profileDesc"),
						open: openProfile,
						onToggle: () => setOpenProfile((v) => !v),
						t
					}, react.createElement(ProfileContent, { t })),
					react.createElement(Card, {
						name: t("personalizationName"),
						desc: t("personalizationDesc"),
						open: openPersonalization,
						onToggle: () => setOpenPersonalization((v) => !v),
						t
					}, react.createElement(PersonalizationContent, { t, scope }))
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
