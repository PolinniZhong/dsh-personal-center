/**
 * dsh-personal-center — 宿主端。
 *
 * v0.1:自定义指令
 *   1. 注册用户设置命名空间 `custom-instructions`(字段 `text`,多行文本),
 *      由设置界面(浏览器端)读写,持久化进 settings.yaml。
 *   2. 向系统提示词注册一个 `custom-instructions` 段(order 10,紧跟 deployment
 *      persona 之后),段文本引用提示词变量 `{{customInstructions}}`;该变量的
 *      取值来自设置命名空间的 `text`,每次组装时求值,因此:
 *        - 保存后,所有会话的下一次请求立即带上新指令;
 *        - 文本为空时渲染为空的段落,被 renderPrompt 丢弃(不占 token)。
 *      替换值不再二次扫描,所以用户文本里出现字面 `{{` 是安全的。
 *
 * v0.2(路线图):个人使用统计
 *   计划在此挂一个宿主侧服务,暴露 RPC:
 *     - 读取会话日志(见 @deepseek-ai/dsh-session-persistence-jsonl)中的
 *       request/header(含 tokenUsage)、tool 事件(含 mcp__<server>__<tool>
 *       限定名),聚合出按天/按模型/按工具的统计;
 *     - 浏览器端「个人中心」面板消费该 RPC 渲染图表。
 *   注意:统计只聚合数字,不读取对话正文,避免隐私敏感内容上屏。
 */
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

export const name = "dsh-personal-center";

/** 设置命名空间(与浏览器端约定一致;v0.1 起即固定,便于数据延续)。 */
const NS = settingsNamespace("custom-instructions");

/** 命名空间 schema:一个可空的多行文本字段。 */
const CustomInstructionsSchema = z.object({ text: z.string().default("") });

export function apply(ctx) {
	// 设置命名空间注册(可选服务:无 settings 提供方时该注册自动跳过)。
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(NS, CustomInstructionsSchema);
	});

	// 系统提示词注入(可选服务:无 systemPrompt 时跳过)。
	ctx.inject(["systemPrompt", "settings"], (promptCtx) => {
		promptCtx.systemPrompt.section({
			name: "custom-instructions",
			order: 10,
			text: "{{customInstructions}}"
		});
		promptCtx.systemPrompt.variable("customInstructions", () => {
			const section = promptCtx.settings.get(NS);
			const text = section?.text ?? "";
			return text.trim() === "" ? "" : text;
		});
	});
}
