#!/usr/bin/env node
/**
 * dsh-personal-center — 设置导航「个人」图标补丁(一键检测 + 重打)。
 *
 * 背景:DSH 设置导航图标由核心壳插件硬编码(dsh-client-ui-settings-general 的
 * navIcon(id)),非 models/agent-presets/plugins 的分区一律回退齿轮;没有插件
 * 注册图标的 API。`dependencies/dsh` 由桌面应用整树下载,每次升级都会覆盖
 * 本补丁,导致「个人」图标变回齿轮——升级后跑一次本脚本即可恢复。
 *
 * 用法:
 *   node scripts/patch-nav-icon.mjs
 *
 * 行为:幂等——已打过补丁则直接退出;未打则插入 `navIcon(id)` 的
 * personal-center 分支(用户提供 SVG,currentColor 深浅色自适应),并做语法校验。
 * 生效:核心包改动 → 刷新页面即可。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

// 目标文件(与 PLATFORM-NOTES §4 一致:dependencies/dsh 由发布源下载)。
// 注意:DSH_HOME 环境变量指向 <AppSupport>/data/dsh,而 dependencies/dsh 在
// <AppSupport>/dependencies/dsh(DSH_HOME 上两级的兄弟目录),故 dirname×2。
function targetFile() {
	if (process.env.DSH_HOME) {
		return join(dirname(dirname(process.env.DSH_HOME)), "dependencies", "dsh", "node_modules", "@deepseek-ai", "dsh-client-ui-settings-general", "lib", "client.js");
	}
	return join(homedir(), "Library", "Application Support", "io.github.hairyf.deepseek-harness-desktop", "dependencies", "dsh", "node_modules", "@deepseek-ai", "dsh-client-ui-settings-general", "lib", "client.js");
}

/** 补丁块(与 docs/nav-icon-patch.md 保持一致)。 */
const PATCH_BLOCK = `\t\t\t/* dsh-personal-center patch: 个人分区导航图标(用户提供 SVG,currentColor 深浅色自适应) */
\t\t\tif (id === "personal-center") return (0, react_jsx_runtime.jsx)("svg", {
\t\t\t\tclassName: SettingsRoot_module_css_default.navIcon,
\t\t\t\twidth: 16,
\t\t\t\theight: 16,
\t\t\t\tviewBox: "0 0 40 40",
\t\t\t\tfill: "none",
\t\t\t\tchildren: [(0, react_jsx_runtime.jsx)("path", {
\t\t\t\t\tfillRule: "evenodd",
\t\t\t\t\tclipRule: "evenodd",
\t\t\t\t\td: "M20 36C28.8366 36 36 28.8366 36 20C36 11.1634 28.8366 4 20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36Z",
\t\t\t\t\tstroke: "currentColor",
\t\t\t\t\tstrokeWidth: 3.5,
\t\t\t\t\tstrokeLinecap: "round",
\t\t\t\t\tstrokeLinejoin: "round"
\t\t\t\t}), (0, react_jsx_runtime.jsx)("path", {
\t\t\t\t\td: "M20 19C22.2091 19 24 17.2091 24 15C24 12.7909 22.2091 11 20 11C17.7909 11 16 12.7909 16 15C16 17.2091 17.7909 19 20 19Z",
\t\t\t\t\tstroke: "currentColor",
\t\t\t\t\tstrokeWidth: 3.5,
\t\t\t\t\tstrokeLinejoin: "round"
\t\t\t\t}), (0, react_jsx_runtime.jsx)("path", {
\t\t\t\t\td: "M9.5166 31.749C9.77438 27.8405 13.0263 24.75 17.0001 24.75H23.0001C26.9687 24.75 30.2173 27.8323 30.4826 31.7335",
\t\t\t\t\tstroke: "currentColor",
\t\t\t\t\tstrokeWidth: 3.5,
\t\t\t\t\tstrokeLinecap: "round",
\t\t\t\t\tstrokeLinejoin: "round"
\t\t\t\t})]
\t\t\t});
`;

function main() {
	const file = targetFile();
	if (!existsSync(file)) {
		console.error("✗ 找不到核心文件:", file);
		console.error("  请确认 DSH 桌面端已安装(或设置 DSH_HOME 环境变量后重试)。");
		process.exit(1);
	}
	let src = readFileSync(file, "utf8");

	if (src.includes('id === "personal-center"')) {
		console.log("✓ 补丁已存在,无需重打:", file);
		return;
	}

	// 插入点:齿轮回退返回之前
	const marker = 'return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutline16';
	const idx = src.indexOf(marker);
	if (idx < 0) {
		console.error("✗ 未找到 navIcon 的齿轮回退分支,核心文件结构可能已变(版本升级)。");
		console.error("  请人工对照 docs/nav-icon-patch.md 检查 navIcon(id) 函数。");
		process.exit(1);
	}
	src = src.slice(0, idx) + PATCH_BLOCK + src.slice(idx);
	writeFileSync(file, src);

	// 语法校验
	try {
		execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
	} catch (e) {
		console.error("✗ 补丁后语法校验失败,已写回文件但请勿刷新使用。请人工检查:", file);
		console.error(String(e.stderr || e));
		process.exit(1);
	}
	console.log("✓ 补丁已写入并通过 node --check:", file);
	console.log("  刷新页面即可生效(核心包改动,客户端 bundle 由 /plugins 提供)。");
}

main();
