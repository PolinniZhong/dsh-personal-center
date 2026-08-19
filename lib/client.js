/**
 * dsh-personal-center — 浏览器端。
 *
 * v0.1:在设置面板注册「个性化」分区(settings.section),内含「自定义指令」
 * 多行文本框 + 保存按钮。内容通过 settingsScope 读写宿主设置命名空间
 * `custom-instructions`,保存后由宿主端注入每个请求的系统提示词。
 *
 * v0.2(路线图):「个人中心」面板 — 在此注册第二个 settings.section
 * (或侧边栏入口),消费宿主统计 RPC 渲染 Token/工具/MCP 使用图表。
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
			".dsh-ci-section{display:flex;flex-direction:column;gap:12px;padding:0 4px 20px}" +
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
				"nav": "个性化",
				"title": "自定义指令",
				"hint": "向此主机上的所有聊天提供额外的说明和上下文。保存后,每个新请求都会带上这段指令。",
				"placeholder": "输入你的自定义指令……",
				"save": "保存",
				"saved": "已保存",
				"clear": "清空",
				"readOnly": "当前部署的配置文件为只读,无法保存。"
			},
			en: {
				"nav": "Personalization",
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

		//#region section
		const NS = "custom-instructions";

		/**
		 * 个性化 → 自定义指令 设置分区。
		 * @param {{ t: (key: string) => string, scope: import('@deepseek-ai/dsh-client-ui-settings').SettingsScopeController }} props
		 */
		function CustomInstructionsSection({ t, scope }) {
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

			return react.createElement("div", { className: "dsh-ci-section" },
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

		//#region plugin
		/** 所需客户端服务:slots(插槽注册)、locale(文案)、settingsScope(设置读写)。 */
		const inject = ["slots", "locale", "settingsScope"];

		/**
		 * 客户端插件主体:注册设置分区并绑定命名空间作用域。
		 * @param {import('@deepseek-ai/cordis').Context} ctx
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), "personal-center: copy dictionaries");
			const scope = ctx.settingsScope.bind({ namespace: NS });
			const t = ctx.locale.bind(LOCALE_NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "custom-instructions",
				order: 30,
				label: () => t("nav"),
				inject: () => ({ t, scope })
			}, CustomInstructionsSection));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
