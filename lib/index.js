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

/** 价格配置命名空间(prices 为 JSON 字符串,键 = "provider::model")。 */
const PRICING_NS = settingsNamespace("personal-center-pricing");

/** 命名空间 schema:一个可空的多行文本字段。 */
const CustomInstructionsSchema = z.object({ text: z.string().default("") });

/** 价格命名空间 schema:prices 存 JSON 字符串。 */
const PricingSchema = z.object({ prices: z.string().default("{}") });

/** 解析价格配置(容错:坏 JSON 返回空)。 */
function parsePrices(settings) {
	const raw = settings?.get(PRICING_NS)?.prices;
	if (typeof raw !== "string" || raw === "") return {};
	try {
		const obj = JSON.parse(raw);
		return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
	} catch {
		return {};
	}
}

/** 判断时间戳是否落在北京时间高峰窗口(9:00-12:00、14:00-18:00)。 */
function isBeijingPeak(timeMs) {
	const d = new Date(timeMs + 8 * 3600000);
	const h = d.getUTCHours();
	return (h >= 9 && h < 12) || (h >= 14 && h < 18);
}

/** 单次请求(一次 usage)的成本,按是否高峰选用价格组。 */
function usageCost(u, price, peak) {
	const p = price.peak && peak ? price.peak : price;
	const miss = ((u.inputTokens ?? 0) / 1e6) * (p.inputMiss ?? 0);
	const hit = ((u.cacheReadTokens ?? 0) / 1e6) * (p.inputHit ?? p.inputMiss ?? 0);
	const out = ((u.outputTokens ?? 0) / 1e6) * (p.output ?? 0);
	const reason = ((u.reasoningTokens ?? 0) / 1e6) * (p.reasoning ?? p.output ?? 0);
	return miss + hit + out + reason;
}

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

/** 读取已归档会话 id 集合(从 workspace.json 的 global.archivedSessionIds)。 */
function readArchivedSessionIds(sessionsDir) {
	try {
		const f = join(dirname(sessionsDir), "storages", "workspace.json");
		const doc = JSON.parse(readFileSync(f, "utf8"));
		const arr = doc?.global?.archivedSessionIds;
		return Array.isArray(arr) ? new Set(arr) : new Set();
	} catch {
		return new Set();
	}
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
 * @param {Record<string, any>} [prices] 价格配置,键 = "provider::model"
 */
export function computeStats(sessionsDir, prices = {}) {
	const files = listSessionFiles(sessionsDir);
	const archived = readArchivedSessionIds(sessionsDir);
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	// 本周一 00:00(本地)
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
	weekStart.setHours(0, 0, 0, 0);
	const weekStartMs = weekStart.getTime();
	// 本月 1 日 00:00(本地)
	const monthStartMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

	const byModel = new Map(); // "provider::model" -> {provider, model, tokens, requests, input, cacheRead, output, reasoning, cost, currency}
	const toolCounts = new Map(); // name -> calls
	const daily = new Map(); // "YYYY-MM-DD" -> tokens
	const sessions = []; // 逐会话回顾
	// 成本汇总:按币种 × 周期
	const costTotals = { week: {}, month: {}, all: {} };
	let totalTokens = 0;
	let todayTokens = 0;
	let todaySessions = 0;
	let todayToolCalls = 0;
	let totalToolCalls = 0;
	let longestChatMs = 0;
	let totalInput = 0; // 未命中缓存输入
	let totalCacheRead = 0; // 命中缓存输入

	for (const file of files) {
		const events = readEvents(file);
		if (events.length === 0) continue;
		let createdAt = null;
		let lastTime = null;
		let provider = null;
		let model = null;
		let sessionToday = false;
		let sessionId = null;
		let sessionTitle = null;
		let sessionCwd = null;
		let sessionTokens = 0;
		let sessionInput = 0;
		let sessionCacheRead = 0;
		let sessionRequests = 0;
		let sessionToolCalls = 0;

		for (const ev of events) {
			const t = ev.type;
			const time = typeof ev.time === "number" ? ev.time : null;
			if (time) lastTime = lastTime === null ? time : Math.max(lastTime, time);

			if (t === "session") {
				createdAt = ev.createdAt ?? ev.data?.createdAt ?? null;
				sessionId = ev.id ?? null;
				sessionCwd = ev.cwd ?? null;
			} else if (t === "session/title") {
				if (ev.data && typeof ev.data.title === "string") sessionTitle = ev.data.title;
			} else if (t === "request/header") {
				const c = ev.data?.header?.config;
				if (c) {
					if (c.provider) provider = c.provider;
					if (c.model) model = c.model;
				}
			} else if (t === "assistant/message") {
				const u = ev.data?.usage;
				if (u) {
					const input = u.inputTokens ?? 0;
					const cache = u.cacheReadTokens ?? 0;
					const toks = input + (u.outputTokens ?? 0) + cache;
					totalTokens += toks;
					totalInput += input;
					totalCacheRead += cache;
					sessionTokens += toks;
					sessionInput += input;
					sessionCacheRead += cache;
					sessionRequests += 1;
					if (time && time >= todayStart) {
						todayTokens += toks;
						sessionToday = true;
					}
					if (provider && model) {
						const key = provider + "::" + model;
						const rec = byModel.get(key) ?? {
							provider,
							model,
							tokens: 0,
							requests: 0,
							input: 0,
							cacheRead: 0,
							output: 0,
							reasoning: 0,
							cost: 0,
							currency: null
						};
						rec.tokens += toks;
						rec.requests += 1;
						rec.input += input;
						rec.cacheRead += cache;
						rec.output += u.outputTokens ?? 0;
						rec.reasoning += u.reasoningTokens ?? 0;
						// 成本(按模型价格,含峰谷分时)
						const price = prices[key];
						if (price && typeof price.output === "number") {
							const cost = usageCost(u, price, isBeijingPeak(time ?? Date.now()));
							rec.cost += cost;
							rec.currency = price.currency === "usd" ? "usd" : "cny";
							const add = (bucket, cur) => { bucket[cur] = (bucket[cur] ?? 0) + cost; };
							add(costTotals.all, rec.currency);
							if (time !== null) {
								if (time >= weekStartMs) add(costTotals.week, rec.currency);
								if (time >= monthStartMs) add(costTotals.month, rec.currency);
							}
						}
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
					sessionToolCalls += 1;
					if (time && time >= todayStart) todayToolCalls += 1;
				}
			}
		}

		if (sessionToday) todaySessions += 1;
		if (createdAt && lastTime !== null) {
			const dur = lastTime - createdAt;
			if (dur > longestChatMs) longestChatMs = dur;
		}
		// 逐会话回顾(缓存命中率 = cacheRead / (cacheRead + input))
		const cacheBase = sessionInput + sessionCacheRead;
		sessions.push({
			id: sessionId,
			title: sessionTitle,
			cwd: sessionCwd,
			createdAt,
			lastTime,
			durationMs: createdAt && lastTime !== null ? lastTime - createdAt : null,
			tokens: sessionTokens,
			requests: sessionRequests,
			toolCalls: sessionToolCalls,
			cacheHitRate: cacheBase > 0 ? sessionCacheRead / cacheBase : null
		});
	}

	const byModelArr = [...byModel.values()]
		.map((rec) => ({
			provider: rec.provider,
			model: rec.model,
			tokens: rec.tokens,
			requests: rec.requests,
			cacheHitRate: rec.input + rec.cacheRead > 0 ? rec.cacheRead / (rec.input + rec.cacheRead) : null,
			cost: rec.cost > 0 ? Math.round(rec.cost * 100) / 100 : null,
			currency: rec.currency
		}))
		.sort((a, b) => b.tokens - a.tokens)
		.slice(0, 12);
	const toolsArr = [...toolCounts.entries()]
		.map(([toolName, calls]) => ({ name: toolName, calls }))
		.sort((a, b) => b.calls - a.calls)
		.slice(0, 12);
	const cacheBaseAll = totalInput + totalCacheRead;
	const roundCur = (obj) => {
		const out = {};
		for (const [cur, v] of Object.entries(obj)) out[cur] = Math.round(v * 100) / 100;
		return out;
	};

	return {
		today: { tokens: todayTokens, sessions: todaySessions, toolCalls: todayToolCalls },
		total: {
			tokens: totalTokens,
			sessions: files.length,
			toolCalls: totalToolCalls,
			longestChatMs,
			cacheHitRate: cacheBaseAll > 0 ? totalCacheRead / cacheBaseAll : null
		},
		byModel: byModelArr,
		tools: toolsArr,
		sessions: sessions
			.filter((s) => !(s.id && archived.has(s.id))) // 会话回顾不列已归档
			.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0))
			.slice(0, 30),
		cost: {
			byModel: byModelArr.filter((m) => m.cost !== null).map((m) => ({ provider: m.provider, model: m.model, cost: m.cost, currency: m.currency })),
			totals: { week: roundCur(costTotals.week), month: roundCur(costTotals.month), all: roundCur(costTotals.all) }
		},
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
	const prices = parsePrices(ctx.get("settings"));
	statsCache = computeStats(dir, prices);
	statsCachedAt = nowMs;
	return statsCache;
}

function sendJson(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
	res.end(payload);
}

/** 读取 JSON 请求体(与插件控制台一致,上限 64KB)。 */
async function readBody(req, maxBytes = 64 * 1024) {
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		total += chunk.length;
		if (total > maxBytes) throw new Error("请求体过大");
		chunks.push(chunk);
	}
	if (chunks.length === 0) return {};
	try {
		return JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new Error("请求体不是合法 JSON");
	}
}

// ── 插件入口 ──────────────────────────────────────────────────────────────

export function apply(ctx) {
	// 设置命名空间注册(可选服务:无 settings 提供方时该注册自动跳过)。
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(NS, CustomInstructionsSchema);
		settingsCtx.settings.register(PRICING_NS, PricingSchema);
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

	// 环回路由:统计 + 自定义指令读写(绕开 Web 设置白名单,直接走 ctx.settings)。
	ctx.inject(["webServer", "settings"], (webCtx) => {
		const route = {
			kind: "prefix",
			path: "/personal-center",
			handler: async (req, res) => {
				if (!isLoopback(req.socket?.remoteAddress ?? "")) {
					sendJson(res, 403, { ok: false, error: "仅允许本机访问" });
					return;
				}
				const url = new URL(req.url ?? "/", "http://x");
				const method = req.method ?? "GET";
				try {
					if (method === "GET" && url.pathname === "/personal-center/stats") {
						sendJson(res, 200, { ok: true, ...getStats(webCtx, url.searchParams.get("refresh") === "1") });
						return;
					}
					if (url.pathname === "/personal-center/custom-instructions") {
						const settings = webCtx.get("settings");
						if (method === "GET") {
							const text = settings ? settings.get(NS)?.text ?? "" : "";
							sendJson(res, 200, { ok: true, text });
							return;
						}
						if (method === "POST") {
							const body = await readBody(req);
							if (typeof body.text !== "string") {
								sendJson(res, 400, { ok: false, error: "text 字段必须是字符串" });
								return;
							}
							if (!settings) {
								sendJson(res, 500, { ok: false, error: "settings 服务不可用" });
								return;
							}
							await settings.update(NS, { text: body.text });
							sendJson(res, 200, { ok: true });
							return;
						}
					}
					if (url.pathname === "/personal-center/pricing") {
						const settings = webCtx.get("settings");
						if (method === "GET") {
							sendJson(res, 200, { ok: true, prices: parsePrices(settings) });
							return;
						}
						if (method === "POST") {
							const body = await readBody(req);
							const prices = body.prices;
							if (!prices || typeof prices !== "object" || Array.isArray(prices)) {
								sendJson(res, 400, { ok: false, error: "prices 字段必须是对象" });
								return;
							}
							if (!settings) {
								sendJson(res, 500, { ok: false, error: "settings 服务不可用" });
								return;
							}
							await settings.update(PRICING_NS, { prices: JSON.stringify(prices) });
							statsCachedAt = 0; // 价格变更,失效统计缓存
							sendJson(res, 200, { ok: true });
							return;
						}
					}
					sendJson(res, 404, { ok: false, error: "not found" });
				} catch (error) {
					sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
				}
			}
		};
		webCtx.effect(() => webCtx.webServer.register(route), "personal-center: routes");
	});
}
