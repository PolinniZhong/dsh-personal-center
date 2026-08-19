/**
 * dsh-personal-center — 宿主端。
 *
 * 功能:
 *  1. 自定义指令(全局注入):注册设置命名空间 `custom-instructions`,并通过
 *     系统提示词段 + 变量把文本注入每个请求(order 10,紧跟 persona 之后)。
 *  2. 个人资料统计:扫描会话日志聚合 Token / 会话 / 工具 / 按模型 / Token 活动,
 *     经环回路由 `/personal-center/stats` 暴露给浏览器端。
 *
 * 隐私边界:只聚合数字,不读取对话正文内容。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { zstdDecompressSync } from "node:zlib";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

export const name = "dsh-personal-center";

/** 设置命名空间(与浏览器端约定一致)。 */
const NS = settingsNamespace("custom-instructions");

/** 命名空间 schema:一个可空的多行文本字段。 */
const CustomInstructionsSchema = z.object({ text: z.string().default("") });

// ── 统计服务 ──────────────────────────────────────────────────────────────

/** 会话日志文件后缀。 */
const LOG_SUFFIX = "session.jsonl.zstd";

/** 环回校验(与插件控制台一致)。 */
function isLoopback(address) {
	return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function pad(n) {
	return n < 10 ? "0" + n : String(n);
}

function dayKey(t) {
	const d = new Date(t);
	return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/** 列出会话日志文件。 */
function listSessionFiles(sessionsDir) {
	const files = [];
	let workspaces;
	try {
		workspaces = readdirSync(sessionsDir);
	} catch {
		return files;
	}
	for (const ws of workspaces) {
		const wsDir = join(sessionsDir, ws);
		let sids;
		try {
			sids = readdirSync(wsDir);
		} catch {
			continue;
		}
		for (const sid of sids) {
			const f = join(wsDir, sid, LOG_SUFFIX);
			try {
				if (statSync(f).isFile()) files.push(f);
			} catch {
				/* 忽略 */
			}
		}
	}
	return files;
}

/** 解压并解析一个会话日志为事件数组(容错:坏行/坏帧跳过)。 */
const ZSTD_MAGIC = 0xfd2fb528;

/** 定位拼接容器中的完整 zstd 帧(追加式日志 = 多帧拼接)。 */
function scanZstdFrames(buffer) {
	const frames = [];
	let offset = 0;
	while (offset < buffer.length) {
		const start = offset;
		if (buffer.length - offset < 4) return frames;
		if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) return frames;
		offset += 4;
		if (offset >= buffer.length) return frames;
		const descriptor = buffer.readUInt8(offset);
		offset += 1;
		if ((descriptor & 24) !== 0) return frames;
		const contentSizeFlag = descriptor >>> 6;
		const singleSegment = (descriptor & 32) !== 0;
		const checksum = (descriptor & 4) !== 0;
		const dictionaryFlag = descriptor & 3;
		const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
		const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag;
		const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
		if (buffer.length - offset < remainingHeaderBytes) return frames;
		offset += remainingHeaderBytes;
		for (;;) {
			if (buffer.length - offset < 3) return frames;
			const blockHeader = buffer.readUIntLE(offset, 3);
			offset += 3;
			const lastBlock = (blockHeader & 1) !== 0;
			const blockType = (blockHeader >>> 1) & 3;
			const blockSize = blockHeader >>> 3;
			if (blockType === 3) return frames;
			const payloadBytes = blockType === 1 ? 1 : blockSize;
			if (buffer.length - offset < payloadBytes) return frames;
			offset += payloadBytes;
			if (lastBlock) break;
		}
		if (checksum) {
			if (buffer.length - offset < 4) return frames;
			offset += 4;
		}
		frames.push({ start, end: offset });
	}
	return frames;
}

function readEvents(file) {
	let buf;
	try {
		buf = readFileSync(file);
	} catch {
		return [];
	}
	const frames = scanZstdFrames(buf);
	if (frames.length === 0) return [];
	const events = [];
	for (const fr of frames) {
		let text;
		try {
			text = zstdDecompressSync(buf.subarray(fr.start, fr.end)).toString("utf8");
		} catch {
			continue;
		}
		for (const line of text.split("\n")) {
			if (!line.trim()) continue;
			try {
				events.push(JSON.parse(line));
			} catch {
				/* 忽略坏行 */
			}
		}
	}
	return events;
}

/**
 * 聚合全部会话统计。
 * @param {string} sessionsDir 会话日志根目录
 */
export function computeStats(sessionsDir) {
	const files = listSessionFiles(sessionsDir);
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

	const byModel = new Map(); // "provider::model" -> {provider, model, tokens, requests}
	const toolCounts = new Map(); // name -> calls
	const daily = new Map(); // "YYYY-MM-DD" -> tokens
	let totalTokens = 0;
	let todayTokens = 0;
	let todaySessions = 0;
	let todayToolCalls = 0;
	let totalToolCalls = 0;
	let longestChatMs = 0;

	for (const file of files) {
		const events = readEvents(file);
		if (events.length === 0) continue;
		let createdAt = null;
		let lastTime = null;
		let provider = null;
		let model = null;
		let sessionToday = false;

		for (const ev of events) {
			const t = ev.type;
			const time = typeof ev.time === "number" ? ev.time : null;
			if (time) lastTime = lastTime === null ? time : Math.max(lastTime, time);

			if (t === "session") {
				createdAt = ev.createdAt ?? ev.data?.createdAt ?? null;
			} else if (t === "request/header") {
				const c = ev.data?.header?.config;
				if (c) {
					if (c.provider) provider = c.provider;
					if (c.model) model = c.model;
				}
			} else if (t === "assistant/message") {
				const u = ev.data?.usage;
				if (u) {
					const toks = (u.inputTokens ?? 0) + (u.outputTokens ?? 0) + (u.cacheReadTokens ?? 0);
					totalTokens += toks;
					if (time && time >= todayStart) {
						todayTokens += toks;
						sessionToday = true;
					}
					if (provider && model) {
						const key = provider + "::" + model;
						const rec = byModel.get(key) ?? { provider, model, tokens: 0, requests: 0 };
						rec.tokens += toks;
						rec.requests += 1;
						byModel.set(key, rec);
					}
					if (time) {
						const dk = dayKey(time);
						daily.set(dk, (daily.get(dk) ?? 0) + toks);
					}
				}
			} else if (t === "tool/call") {
				const toolName = ev.data?.name;
				if (toolName) {
					toolCounts.set(toolName, (toolCounts.get(toolName) ?? 0) + 1);
					totalToolCalls += 1;
					if (time && time >= todayStart) todayToolCalls += 1;
				}
			}
		}

		if (sessionToday) todaySessions += 1;
		if (createdAt && lastTime !== null) {
			const dur = lastTime - createdAt;
			if (dur > longestChatMs) longestChatMs = dur;
		}
	}

	const byModelArr = [...byModel.values()].sort((a, b) => b.tokens - a.tokens).slice(0, 12);
	const toolsArr = [...toolCounts.entries()]
		.map(([toolName, calls]) => ({ name: toolName, calls }))
		.sort((a, b) => b.calls - a.calls)
		.slice(0, 12);

	return {
		today: { tokens: todayTokens, sessions: todaySessions, toolCalls: todayToolCalls },
		total: {
			tokens: totalTokens,
			sessions: files.length,
			toolCalls: totalToolCalls,
			longestChatMs
		},
		byModel: byModelArr,
		tools: toolsArr,
		activity: buildActivityWeeks(daily),
		monthly: buildMonthlyCumulative(daily)
	};
}

/** 最近 52 周每日强度(0..5),近期为空则自然偏淡。 */
function buildActivityWeeks(daily) {
	const totalDays = 52 * 7;
	const end = new Date();
	end.setHours(0, 0, 0, 0);
	// 求最大单日 token,归一化到 5 档
	let max = 0;
	for (const v of daily.values()) if (v > max) max = v;
	const levelOf = (toks) => (toks <= 0 || max === 0 ? 0 : Math.max(1, Math.min(5, Math.ceil((toks / max) * 5))));

	const weeks = [];
	for (let w = 0; w < 52; w++) {
		const weekStart = new Date(end.getTime() - (51 - w) * 7 * 86400000);
		const days = [];
		for (let d = 0; d < 7; d++) {
			const day = new Date(weekStart.getTime() + d * 86400000);
			days.push(levelOf(daily.get(dayKey(day.getTime())) ?? 0));
		}
		weeks.push({ month: weekStart.getMonth(), days });
	}
	return weeks;
}

/** 最近 12 个自然月的累计 token。 */
function buildMonthlyCumulative(daily) {
	const now = new Date();
	const months = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		months.push({ year: d.getFullYear(), month: d.getMonth() });
	}
	const totals = [];
	let cum = 0;
	for (const m of months) {
		let monthTokens = 0;
		for (const [dk, toks] of daily) {
			const y = Number(dk.slice(0, 4));
			const mo = Number(dk.slice(5, 7));
			if (y === m.year && mo === m.month + 1) monthTokens += toks;
		}
		cum += monthTokens;
		totals.push(cum);
	}
	return { months, totals };
}

// 进程内缓存(60 秒 TTL),避免每次打开面板全量扫描。
let statsCache = null;
let statsCachedAt = 0;

/** 解析会话日志根目录。优先取设置文档目录(data/dsh)下,回退 ~/.dsh。 */
function resolveSessionsDir(ctx) {
	const settings = ctx.get("settings");
	if (settings && typeof settings.documentPath === "string" && settings.documentPath) {
		return join(dirname(settings.documentPath), "sessions");
	}
	return join(homedir(), ".dsh", "sessions");
}

/** 读取统计(带缓存;?refresh=1 强制重算)。 */
function getStats(ctx, force) {
	const nowMs = Date.now();
	if (!force && statsCache && nowMs - statsCachedAt < 60000) return statsCache;
	const dir = resolveSessionsDir(ctx);
	statsCache = computeStats(dir);
	statsCachedAt = nowMs;
	return statsCache;
}

function sendJson(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
	res.end(payload);
}

// ── 插件入口 ──────────────────────────────────────────────────────────────

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

	// 统计环回路由。
	ctx.inject(["webServer"], (webCtx) => {
		const route = {
			kind: "prefix",
			path: "/personal-center",
			handler: (req, res) => {
				if (!isLoopback(req.socket?.remoteAddress ?? "")) {
					sendJson(res, 403, { ok: false, error: "仅允许本机访问" });
					return;
				}
				const url = new URL(req.url ?? "/", "http://x");
				if ((req.method ?? "GET") === "GET" && url.pathname === "/personal-center/stats") {
					try {
						sendJson(res, 200, { ok: true, ...getStats(webCtx, url.searchParams.get("refresh") === "1") });
					} catch (error) {
						sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
					}
					return;
				}
				sendJson(res, 404, { ok: false, error: "not found" });
			}
		};
		webCtx.effect(() => webCtx.webServer.register(route), "personal-center: stats routes");
	});
}
