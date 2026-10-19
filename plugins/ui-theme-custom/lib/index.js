import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { zstdDecompressSync } from "node:zlib";
//#region lib/types/host/usage-fold.js
const BUCKET_KEYS = [
	"input",
	"output",
	"cacheRead",
	"cacheWrite"
];
const SESSION_LOG = /^session(?:\.v([1-9][0-9]*))?\.jsonl(?:\.zstd)?$/i;
const ZSTD_MAGIC = globalThis.Buffer?.from([
	40,
	181,
	47,
	253
]) ?? Buffer.from([
	40,
	181,
	47,
	253
]);
function emptyBuckets() {
	return {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		calls: 0
	};
}
function addBuckets(target, buckets, sign) {
	if (!buckets) return;
	for (const key of BUCKET_KEYS) {
		const value = Number(buckets[key]);
		if (Number.isFinite(value) && value !== 0) target[key] += sign * value;
	}
	const calls = Number(buckets.calls);
	if (Number.isFinite(calls)) target.calls += sign * calls;
}
function dayKey(time) {
	const date = new Date(time);
	if (!Number.isFinite(date.getTime())) return null;
	const pad = (v) => String(v).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function usageOf(event) {
	const data = event?.data;
	if (!data || typeof data !== "object") return void 0;
	if (event.type === "assistant/message" && data.usage !== void 0) return data.usage;
	if (event.type !== "assistant/message" && event.type !== "assistant/attempt") return void 0;
	const stream = data.stream;
	if (!Array.isArray(stream)) return void 0;
	for (let index = stream.length - 1; index >= 0; index -= 1) {
		const record = stream[index];
		if (record?.type === "chunk" && record.chunk?.type === "usage") return record.chunk.usage;
	}
}
function bucketsFrom(usage) {
	const count = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
	return {
		input: count(usage?.inputTokens),
		output: count(usage?.outputTokens),
		cacheRead: count(usage?.cacheReadTokens),
		cacheWrite: count(usage?.cacheWriteTokens),
		calls: 1
	};
}
function modelOf(event) {
	const model = event?.data?.message?.source?.model;
	return typeof model === "string" && model !== "" ? model : null;
}
function foldSession(events) {
	const days = /* @__PURE__ */ new Map();
	const hours = new Array(24).fill(0);
	const bump = (day, hour, buckets, sign, model) => {
		hours[hour] += sign;
		let target = days.get(day);
		if (!target) {
			if (sign < 0) return;
			const fresh = emptyBuckets();
			fresh.hours = new Array(24).fill(0);
			fresh.models = /* @__PURE__ */ new Map();
			days.set(day, fresh);
			target = fresh;
		}
		const targetHours = target.hours ?? (target.hours = new Array(24).fill(0));
		targetHours[hour] += sign;
		addBuckets(target, buckets, sign);
		if (model !== null) {
			const models = target.models ?? (target.models = /* @__PURE__ */ new Map());
			let cell = models.get(model);
			if (!cell && sign > 0) {
				cell = emptyBuckets();
				models.set(model, cell);
			}
			if (cell) {
				addBuckets(cell, buckets, sign);
				if (sign < 0 && BUCKET_KEYS.every((k) => cell[k] === 0) && cell.calls === 0) models.delete(model);
			}
		}
		if (sign < 0 && BUCKET_KEYS.every((k) => target[k] === 0) && target.calls === 0) days.delete(day);
	};
	let last = null;
	for (const event of events) {
		const type = event?.type;
		if (type === "llm/retry-started") {
			const data = event.data;
			if (last !== null && last.turn === data?.turn && last.step === data?.step) last = null;
			continue;
		}
		if (type !== "assistant/message" && type !== "assistant/attempt") continue;
		const usage = usageOf(event);
		if (!usage) continue;
		if (typeof event.time !== "number") continue;
		const day = dayKey(event.time);
		if (!day) continue;
		const hour = new Date(event.time).getHours();
		const buckets = bucketsFrom(usage);
		const model = modelOf(event);
		const turn = event.data?.turn;
		const step = event.data?.step;
		const replacing = last !== null && last.turn === turn && last.step === step;
		if (replacing && last !== null && BUCKET_KEYS.every((k) => last.buckets[k] === buckets[k])) continue;
		if (replacing && last !== null) bump(last.day, last.hour, last.buckets, -1, last.model);
		bump(day, hour, buckets, 1, model);
		last = {
			turn,
			step,
			buckets,
			day,
			hour,
			model
		};
	}
	return {
		days,
		hours
	};
}
function newestLog(dir) {
	let best = null;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isFile()) continue;
		const match = SESSION_LOG.exec(entry.name);
		if (!match) continue;
		const version = Number(match[1] ?? 0);
		const compressed = /\.zstd$/i.test(entry.name);
		if (best === null || version > best.version || version === best.version && Number(compressed) > Number(best.compressed)) best = {
			name: entry.name,
			version,
			compressed
		};
	}
	if (!best) return null;
	const path = join(dir, best.name);
	const stat = statSync(path);
	return {
		path,
		size: stat.size,
		mtimeMs: stat.mtimeMs,
		...best
	};
}
function listSessionLogs(root) {
	const out = [];
	if (!existsSync(root)) return out;
	for (const project of readdirSync(root, { withFileTypes: true })) {
		if (!project.isDirectory()) continue;
		const projectDir = join(root, project.name);
		for (const session of readdirSync(projectDir, { withFileTypes: true })) {
			if (!session.isDirectory()) continue;
			const log = newestLog(join(projectDir, session.name));
			if (!log) continue;
			out.push({
				id: session.name,
				...log
			});
		}
	}
	return out;
}
function decompressZstd(buf) {
	let out = "";
	let pos = 0;
	while (pos < buf.length) {
		const idx = buf.indexOf(ZSTD_MAGIC, pos);
		if (idx < 0) break;
		const next = buf.indexOf(ZSTD_MAGIC, idx + 4);
		const end = next < 0 ? buf.length : next;
		try {
			out += zstdDecompressSync(buf.subarray(idx, end)).toString("utf8");
		} catch {
			break;
		}
		pos = end;
	}
	return out;
}
function readEventsFromFile(logPath) {
	try {
		const buf = readFileSync(logPath);
		const lines = (logPath.endsWith(".zstd") ? decompressZstd(buf) : buf.toString("utf8")).split("\n");
		const events = [];
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line) continue;
			try {
				const j = JSON.parse(line);
				if (j && typeof j === "object") events.push(j);
			} catch {}
		}
		return events;
	} catch {
		return null;
	}
}
async function readEvents(ctx, sessionId, logPath) {
	const query = ctx.get?.("sessionQuery");
	if (query && typeof query.readSession === "function") try {
		const snapshot = await query.readSession(sessionId);
		if (Array.isArray(snapshot?.events)) {
			if (snapshot.events.length > 0) return snapshot.events;
		}
	} catch {}
	if (logPath && existsSync(logPath)) return readEventsFromFile(logPath);
	return null;
}
//#endregion
//#region lib/types/host/usage-cache.js
const CACHE_VERSION = 1;
function cacheFile(home) {
	return join(home, "cache", "ui-theme-custom", "usage.json");
}
function hoursFrom(raw) {
	return Array.isArray(raw) && raw.length === 24 ? raw.map((v) => Number.isFinite(Number(v)) ? Number(v) : 0) : new Array(24).fill(0);
}
function daysToObject(days) {
	const out = {};
	for (const [day, buckets] of days) {
		const entry = {
			...buckets,
			models: void 0,
			sessions: void 0
		};
		if (buckets.models) {
			const cells = {};
			for (const [model, cell] of buckets.models) cells[model] = cell;
			entry.models = cells;
		}
		out[day] = entry;
	}
	return out;
}
function daysFromObject(raw) {
	const days = /* @__PURE__ */ new Map();
	if (!raw || typeof raw !== "object") return days;
	for (const [day, stored] of Object.entries(raw)) {
		if (!stored || typeof stored !== "object") continue;
		const clean = emptyBuckets();
		addBuckets(clean, stored, 1);
		clean.hours = hoursFrom(stored.hours);
		if (stored.models && typeof stored.models === "object") {
			const models = /* @__PURE__ */ new Map();
			for (const [model, cell] of Object.entries(stored.models)) {
				if (!cell || typeof cell !== "object") continue;
				const into = emptyBuckets();
				addBuckets(into, cell, 1);
				models.set(model, into);
			}
			clean.models = models;
		}
		days.set(day, clean);
	}
	return days;
}
function readCache(_ctx, home) {
	const file = cacheFile(home);
	if (!existsSync(file)) return /* @__PURE__ */ new Map();
	let parsed;
	try {
		parsed = JSON.parse(readFileSync(file, "utf8"));
	} catch {
		return /* @__PURE__ */ new Map();
	}
	if (!parsed || typeof parsed !== "object" || parsed.version !== CACHE_VERSION) return /* @__PURE__ */ new Map();
	const sessions = /* @__PURE__ */ new Map();
	const rawSessions = parsed.sessions;
	if (!rawSessions || typeof rawSessions !== "object") return sessions;
	for (const [id, value] of Object.entries(rawSessions)) {
		if (!value || typeof value !== "object") continue;
		if (!Number.isFinite(value.size) || !Number.isFinite(value.mtimeMs)) continue;
		sessions.set(id, {
			size: Number(value.size),
			mtimeMs: Number(value.mtimeMs),
			days: daysFromObject(value.days),
			hours: hoursFrom(value.hours)
		});
	}
	return sessions;
}
function writeCache(_ctx, home, sessions) {
	const file = cacheFile(home);
	const dir = dirname(file);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	const document = {
		version: CACHE_VERSION,
		computedAt: Date.now(),
		sessions: {}
	};
	for (const [id, entry] of sessions) document.sessions[id] = {
		size: entry.size,
		mtimeMs: entry.mtimeMs,
		days: daysToObject(entry.days),
		hours: entry.hours
	};
	const temp = `${file}.${process.pid ?? 0}.tmp`;
	try {
		writeFileSync(temp, JSON.stringify(document), "utf8");
		renameSync(temp, file);
	} catch {}
}
//#endregion
//#region lib/types/host/usage-summary.js
function bucketTotal(buckets) {
	let total = 0;
	for (const key of BUCKET_KEYS) total += Number(buckets?.[key]) || 0;
	return total;
}
function mergeSessions(sessions) {
	const days = /* @__PURE__ */ new Map();
	const hours = new Array(24).fill(0);
	const seen = /* @__PURE__ */ new Set();
	for (const [id, entry] of sessions) {
		seen.add(id);
		if (Array.isArray(entry.hours)) for (let h = 0; h < 24; h++) hours[h] = (hours[h] ?? 0) + (Number(entry.hours[h]) || 0);
		for (const [day, buckets] of entry.days) {
			let target = days.get(day);
			if (!target) {
				target = emptyBuckets();
				target.sessions = /* @__PURE__ */ new Set();
				target.hours = new Array(24).fill(0);
				days.set(day, target);
			}
			addBuckets(target, buckets, 1);
			if (target.sessions instanceof Set) target.sessions.add(id);
			const targetHours = target.hours ?? (target.hours = new Array(24).fill(0));
			for (let h = 0; h < 24; h++) targetHours[h] = (targetHours[h] ?? 0) + ((buckets.hours ?? [])[h] ?? 0);
			if (!buckets.models) continue;
			for (const [model, cell] of buckets.models) {
				if (!target.models) target.models = /* @__PURE__ */ new Map();
				let into = target.models.get(model);
				if (!into) {
					into = emptyBuckets();
					target.models.set(model, into);
				}
				addBuckets(into, cell, 1);
			}
		}
	}
	for (const day of days.values()) {
		const behind = day.sessions instanceof Set ? [...day.sessions].sort() : [];
		day.sessionIds = behind;
		day.sessions = behind.length;
	}
	return {
		days,
		sessionCount: seen.size,
		hours
	};
}
function summarize(days, sessionCount, source, hours, extra) {
	const list = [...days.entries()].map(([date, buckets]) => ({
		date,
		input: buckets.input,
		output: buckets.output,
		cacheRead: buckets.cacheRead,
		cacheWrite: buckets.cacheWrite,
		calls: buckets.calls,
		sessions: typeof buckets.sessions === "number" ? buckets.sessions : 0,
		sessionIds: Array.isArray(buckets.sessionIds) ? buckets.sessionIds : [],
		models: buckets.models ? Object.fromEntries([...buckets.models].map(([id, cell]) => [id, bucketTotal(cell)])) : void 0,
		modelDetails: buckets.models ? Object.fromEntries([...buckets.models].map(([id, cell]) => [id, {
			input: cell.input,
			output: cell.output,
			cacheRead: cell.cacheRead,
			cacheWrite: cell.cacheWrite,
			tokens: bucketTotal(cell)
		}])) : void 0,
		hours: buckets.hours
	})).sort((a, b) => a.date < b.date ? -1 : 1);
	const totals = emptyBuckets();
	const byModel = /* @__PURE__ */ new Map();
	for (const [, buckets] of days) {
		addBuckets(totals, buckets, 1);
		if (!buckets.models) continue;
		for (const [id, cell] of buckets.models) {
			let into = byModel.get(id);
			if (!into) {
				into = emptyBuckets();
				byModel.set(id, into);
			}
			addBuckets(into, cell, 1);
		}
	}
	const models = [...byModel.entries()].map(([id, cell]) => ({
		id,
		input: cell.input,
		output: cell.output,
		cacheRead: cell.cacheRead,
		cacheWrite: cell.cacheWrite,
		tokens: bucketTotal(cell)
	})).sort((a, b) => b.tokens - a.tokens);
	const first = list[0];
	const last = list[list.length - 1];
	return {
		source,
		computedAt: Date.now(),
		days: list,
		models,
		firstDay: first ? first.date : null,
		lastDay: last ? last.date : null,
		model: models[0]?.id ?? void 0,
		...hours ? { hours } : {},
		totals: {
			input: totals.input,
			output: totals.output,
			cacheRead: totals.cacheRead,
			cacheWrite: totals.cacheWrite,
			calls: totals.calls,
			sessions: extra?.sessionIds ? extra.sessionIds.size : sessionCount,
			activeDays: list.length
		}
	};
}
//#endregion
//#region lib/types/host/usage.js
function getHarnessHome(ctx) {
	const resolvePath = ctx.get("dshHomePath");
	if (typeof resolvePath === "function") return resolvePath();
	return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}
function hoursOf(days) {
	const hours = new Array(24).fill(0);
	for (const buckets of days.values()) {
		if (!buckets.hours) continue;
		for (let h = 0; h < 24; h++) hours[h] = (hours[h] ?? 0) + (Number(buckets.hours[h]) || 0);
	}
	return hours;
}
function createUsage(ctx) {
	const home = () => getHarnessHome(ctx);
	let state = null;
	let pending = null;
	let disposed = false;
	async function computeLocal(logs) {
		const cache = readCache(ctx, home());
		const sessions = /* @__PURE__ */ new Map();
		let read = 0;
		let failed = 0;
		for (const log of logs) {
			const cached = cache.get(log.id);
			if (cached && cached.size === log.size && cached.mtimeMs === log.mtimeMs) {
				sessions.set(log.id, cached);
				continue;
			}
			const events = await readEvents(ctx, log.id, log.path);
			if (!events) {
				failed += 1;
				if (cached) sessions.set(log.id, cached);
				continue;
			}
			const folded = foldSession(events);
			sessions.set(log.id, {
				size: log.size,
				mtimeMs: log.mtimeMs,
				days: folded.days,
				hours: folded.hours
			});
			read += 1;
		}
		writeCache(ctx, home(), sessions);
		const rolled = mergeSessions(sessions);
		const summary = summarize(rolled.days, rolled.sessionCount, "local", rolled.days.size === 0 ? void 0 : hoursOf(rolled.days));
		if (sessions.size === 0 && failed > 0) return {
			...summary,
			unavailable: true,
			reason: "session-query-unavailable"
		};
		return {
			...summary,
			read,
			failed
		};
	}
	async function compute() {
		const logs = listSessionLogs(resolve(join(home(), "sessions")));
		if (logs.length === 0) return summarize(/* @__PURE__ */ new Map(), 0, "local", new Array(24).fill(0));
		return await computeLocal(logs);
	}
	function refresh() {
		if (disposed) return Promise.resolve(null);
		if (pending !== null) return pending;
		state = state === null ? {
			value: null,
			computing: true
		} : {
			...state,
			computing: true
		};
		pending = compute().then((value) => {
			pending = null;
			if (disposed) return value;
			state = {
				value,
				computing: false
			};
			return value;
		}, (error) => {
			pending = null;
			if (!disposed) state = {
				value: state?.value ?? null,
				computing: false,
				error: String(error?.message ?? error)
			};
			return null;
		});
		return pending;
	}
	return {
		snapshot() {
			return state === null ? {
				ok: true,
				value: null,
				computing: false
			} : {
				ok: true,
				value: state.value,
				computing: state.computing === true,
				error: state.error
			};
		},
		refresh,
		dispose() {
			disposed = true;
			state = null;
			pending = null;
		}
	};
}
//#endregion
//#region lib/types/host/routes.js
const USAGE_PATH = "/ui-theme-custom/usage";
const USAGE_TTL_MS = 3e3;
function refusalOf(ctx, req) {
	const connection = ctx.get("connection");
	if (typeof connection?.requestRejection === "function") return connection.requestRejection(req);
	const host = req.headers?.host;
	if (host !== void 0) {
		if (!URL.canParse(`http://${host}`)) return 403;
		const name = new URL(`http://${host}`).hostname;
		if (name !== "localhost" && name !== "[::1]" && !/^127\.\d+\.\d+\.\d+$/.test(name)) return 403;
	}
	const site = req.headers?.["sec-fetch-site"];
	if (site !== void 0 && site !== "same-origin" && site !== "none") return 403;
	const origin = req.headers?.origin;
	if (origin === void 0) return void 0;
	if (!URL.canParse(origin)) return 403;
	return new URL(origin).host === host ? void 0 : 403;
}
function sendJson(res, status, payload) {
	const body = (globalThis.Buffer ?? Buffer).from(JSON.stringify(payload));
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": String(body.byteLength),
		"cache-control": "no-store"
	});
	res.end(body);
}
function registerRoutes(ctx, scope) {
	const usage = createUsage(ctx);
	const disposers = [];
	const methodRefused = (req, res, methods) => {
		if (req.method !== void 0 && methods.includes(req.method)) return false;
		res.writeHead(405, { allow: methods.join(", ") });
		res.end();
		return true;
	};
	const fenceRefused = (req, res) => {
		const refused = refusalOf(ctx, req);
		if (refused === void 0) return false;
		sendJson(res, refused, {
			ok: false,
			error: refused === 401 ? "unauthorized" : "forbidden"
		});
		return true;
	};
	const register = (route) => {
		try {
			const disposer = scope.webServer?.register(route);
			if (typeof disposer === "function") disposers.push(disposer);
		} catch (error) {
			ctx.logger?.warn?.(`ui-theme-custom: route unavailable: ${error?.message ?? String(error)}`);
		}
	};
	register({
		kind: "exact",
		path: USAGE_PATH,
		handler: (req, res) => {
			if (methodRefused(req, res, ["GET", "HEAD"])) return;
			if (fenceRefused(req, res)) return;
			let snapshot = usage.snapshot();
			if (snapshot.value === null || snapshot.computing === true || Date.now() - (snapshot.value?.computedAt ?? 0) > USAGE_TTL_MS) {
				usage.refresh();
				snapshot = usage.snapshot();
			}
			sendJson(res, 200, {
				ok: true,
				value: snapshot.value,
				computing: snapshot.computing === true,
				...snapshot.error !== void 0 ? { error: snapshot.error } : {}
			});
		}
	});
	return () => {
		usage.dispose();
		for (const dispose of disposers) try {
			dispose();
		} catch {}
	};
}
//#endregion
//#region lib/types/client/sequoia.js
const SEQUOIA_TOKENS = Object.freeze({
	"--dsw-alias-bg-app-image": "none",
	"--dsw-alias-glass-blur": "blur(64px) saturate(200%)",
	"--dsw-alias-surface-glass-blur": "blur(56px) saturate(190%)",
	"--dsw-alias-bg-base": "rgb(245, 245, 247)",
	"--dsw-alias-surface-glass-spot": "transparent",
	"--dsw-alias-bg-layer-1": "rgba(255, 255, 255, 0.88)",
	"--dsw-alias-bg-layer-2": "rgba(245, 245, 247, 0.90)",
	"--dsw-alias-bg-layer-3": "rgba(235, 235, 238, 0.94)",
	"--dsw-specific-sidebar-fill": "rgba(245, 245, 247, 0.66)",
	"--dsw-alias-bg-module-platform": "rgb(240, 240, 243)",
	"--dsw-alias-bg-multi-select": "rgb(230, 230, 235)",
	"--dsw-alias-bg-overlay": "rgba(255, 255, 255, 0.94)",
	"--dsw-alias-bg-skeleton": "rgba(0, 0, 0, 0.05)",
	"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.15)",
	"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.08)",
	"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.35)",
	"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.75)",
	"--dsw-alias-bg-mask-drop": "rgba(255, 255, 255, 0.85)",
	"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.65)",
	"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.85)",
	"--dsw-alias-border-l1": "rgba(0, 0, 0, 0.06)",
	"--dsw-alias-border-l2-darkmode-thin": "rgba(0, 0, 0, 0.08)",
	"--dsw-alias-border-l2": "rgba(0, 0, 0, 0.10)",
	"--dsw-alias-border-l3": "rgba(0, 0, 0, 0.16)",
	"--dsw-alias-border-l4": "rgba(0, 0, 0, 0.22)",
	"--dsw-alias-brand-primary": "#147ce5",
	"--dsw-alias-brand-primary-invert": "#ffffff",
	"--dsw-alias-brand-primary-new-colorprimary-new-color": "#0d6ecc",
	"--dsw-alias-brand-text": "#147ce5",
	"--dsw-alias-button-contrast-fill": "#1d1d1f",
	"--dsw-alias-button-elevated-fill": "rgba(255, 255, 255, 0.90)",
	"--dsw-alias-button-floating-fill": "rgba(255, 255, 255, 0.85)",
	"--dsw-alias-button-floating-hover": "rgba(255, 255, 255, 0.95)",
	"--dsw-alias-button-ghost-active-border": "rgba(20, 124, 229, 0.30)",
	"--dsw-alias-button-ghost-active-fill": "rgba(20, 124, 229, 0.08)",
	"--dsw-alias-button-ghost-active-hover": "rgba(20, 124, 229, 0.12)",
	"--dsw-alias-button-info-fill": "rgb(0, 102, 212)",
	"--dsw-alias-button-info-hover": "#005bb5",
	"--dsw-alias-button-info-bg": "linear-gradient(180deg, rgba(56, 152, 252, 0.90), rgba(20, 124, 229, 0.85))",
	"--dsw-alias-button-info-bg-hover": "linear-gradient(180deg, rgba(77, 165, 255, 0.95), rgba(40, 139, 242, 0.90))",
	"--dsw-alias-button-radius": "14px",
	"--dsw-alias-button-radius-sm": "8px",
	"--dsw-alias-button-primary-bg": "linear-gradient(180deg, #3898fc 0%, #147ce5 100%)",
	"--dsw-alias-button-primary-bg-hover": "linear-gradient(180deg, #4da5ff 0%, #288bf2 100%)",
	"--dsw-alias-button-primary-bg-size": "100% 100%",
	"--dsw-alias-button-primary-motion": "none",
	"--dsw-alias-button-glow": "0 2px 8px rgba(20, 124, 229, 0.20)",
	"--dsw-alias-button-glow-hover": "0 4px 12px rgba(20, 124, 229, 0.30)",
	"--dsw-alias-button-press-shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.20)",
	"--dsw-alias-button-press-shift": "translate(0, 1px)",
	"--dsw-alias-button-outline-glow": "0 0 0 2px rgba(20, 124, 229, 0.20)",
	"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
	"--dsw-alias-button-primary-dimmed": "rgba(20, 124, 229, 0.12)",
	"--dsw-alias-button-primary-fill": "#147ce5",
	"--dsw-alias-button-primary-hover": "#288bf2",
	"--dsw-alias-button-tool-bar-fill": "rgba(0, 0, 0, 0.04)",
	"--dsw-alias-button-tool-bar-fill-invisible": "transparent",
	"--dsw-alias-button-tool-bar-hover": "rgba(0, 0, 0, 0.08)",
	"--dsw-alias-interactive-bg-active": "rgba(0, 0, 0, 0.08)",
	"--dsw-alias-interactive-bg-hover": "rgba(0, 0, 0, 0.04)",
	"--dsw-alias-interactive-bg-hover-accent": "rgba(0, 113, 227, 0.08)",
	"--dsw-alias-interactive-bg-hover-danger": "rgba(255, 59, 48, 0.08)",
	"--dsw-alias-interactive-bg-hover-solid": "rgb(242, 242, 245)",
	"--dsw-alias-label-primary": "#1d1d1f",
	"--dsw-alias-label-secondary": "#6e6e73",
	"--dsw-alias-label-caption": "#86868b",
	"--dsw-alias-label-dimmed": "#a1a1a6",
	"--dsw-alias-label-primary-bluish": "#1d1d1f",
	"--dsw-alias-label-primary-dimmed": "#424245",
	"--dsw-alias-label-primary-foreground": "#ffffff",
	"--dsw-alias-label-primary-inverted": "#ffffff",
	"--dsw-alias-label-tertiary": "#86868b",
	"--dsw-alias-markdown-citation": "rgba(0, 0, 0, 0.04)",
	"--dsw-alias-markdown-code-block-banner": "rgb(240, 242, 245)",
	"--dsw-alias-markdown-code-block": "#f6f8fa",
	"--dsw-alias-markdown-code-segment-selected": "rgba(0, 113, 227, 0.12)",
	"--dsw-alias-markdown-code-segment-unselected": "rgba(0, 0, 0, 0.03)",
	"--dsw-alias-markdown-inline-code": "rgba(0, 0, 0, 0.05)",
	"--dsw-alias-markdown-placeholder": "rgba(0, 0, 0, 0.03)",
	"--dsw-alias-markdown-tag": "rgba(0, 0, 0, 0.05)",
	"--dsw-alias-scrollbar-bg-l1": "rgba(0, 0, 0, 0.12)",
	"--dsw-alias-scrollbar-bg-l2": "rgba(0, 0, 0, 0.18)",
	"--dsw-alias-scrollbar-hover-l1": "rgba(0, 0, 0, 0.24)",
	"--dsw-alias-scrollbar-hover-l2": "rgba(0, 0, 0, 0.32)",
	"--dsw-alias-state-business-primary": "#0071e3",
	"--dsw-alias-state-business-tertiary": "rgba(0, 113, 227, 0.10)",
	"--dsw-alias-toast-bg": "rgba(30, 30, 35, 0.88)",
	"--dsw-alias-tooltip-bg": "rgba(30, 30, 35, 0.90)",
	"--dsw-specific-bubble-highlight": "rgba(255, 255, 255, 0.97)",
	"--dsw-specific-bubble": "rgba(255, 255, 255, 0.93)",
	"--dsw-specific-input-major": "rgba(255, 255, 255, 0.93)",
	"--dsw-specific-login-input": "rgba(255, 255, 255, 0.96)",
	"--dsw-specific-selector": "rgba(245, 245, 247, 0.94)",
	"--dsw-specific-tip": "rgba(245, 245, 247, 0.92)",
	"--dsw-specific-sidebar-nav-item-active-accent": "rgb(234, 238, 246)",
	"--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.93)",
	"--dsw-specific-sidebar-nav-item-hover": "rgba(0, 0, 0, 0.04)",
	"--dsw-code-bg": "#f6f8fa",
	"--dsw-code-fg": "#24292f",
	"--dsw-code-border": "#d0d7de",
	"--dsw-code-comment": "#6e7781",
	"--dsw-code-keyword": "#cf222e",
	"--dsw-code-string": "#0a3069",
	"--dsw-code-function": "#8250df",
	"--dsh-chart-rank-0": "#147ce5",
	"--dsh-chart-rank-1": "#2b8cf0",
	"--dsh-chart-rank-2": "#4fa2f6",
	"--dsh-chart-rank-3": "#73b6f8",
	"--dsh-chart-rank-4": "#98c9fa",
	"--dsh-chart-rank-5": "#bddcfc",
	"--dsh-chart-rank-6": "#d5e9fd",
	"--dsh-chart-rank-7": "#e7f2fe",
	"--dsh-heat-step-1": "rgba(20, 124, 229, 0.18)",
	"--dsh-heat-step-2": "rgba(20, 124, 229, 0.38)",
	"--dsh-heat-step-3": "rgba(20, 124, 229, 0.65)",
	"--dsh-heat-step-4": "rgba(20, 124, 229, 0.92)"
});
//#endregion
//#region lib/types/client/sonoma.js
const SONOMA_TOKENS = Object.freeze({
	"--dsw-alias-bg-app-image": "radial-gradient(ellipse 950px 560px at 15% 18%, rgba(140, 70, 240, 0.18) 0%, transparent 68%),radial-gradient(ellipse 880px 620px at 85% 85%, rgba(41, 151, 255, 0.16) 0%, transparent 68%),radial-gradient(circle at 50% 50%, rgba(255, 75, 140, 0.08) 0%, transparent 62%),linear-gradient(180deg, rgba(12, 13, 17, 0.94) 0%, rgba(16, 18, 24, 0.97) 100%)",
	"--dsw-alias-glass-blur": "blur(50px) saturate(180%)",
	"--dsw-alias-surface-glass-blur": "blur(34px) saturate(160%)",
	"--dsw-alias-bg-base": "rgb(22, 24, 30)",
	"--dsw-alias-surface-glass-spot": "rgba(140, 70, 240, 0.18)",
	"--dsw-alias-bg-layer-1": "rgba(28, 32, 40, 0.78)",
	"--dsw-alias-bg-layer-2": "rgba(34, 38, 48, 0.85)",
	"--dsw-alias-bg-layer-3": "rgba(42, 46, 58, 0.92)",
	"--dsw-specific-sidebar-fill": "rgba(18, 20, 25, 0.55)",
	"--dsw-alias-bg-module-platform": "rgb(26, 29, 36)",
	"--dsw-alias-bg-multi-select": "rgb(36, 40, 52)",
	"--dsw-alias-bg-overlay": "rgba(20, 22, 28, 0.95)",
	"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.05)",
	"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.45)",
	"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.25)",
	"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.65)",
	"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.85)",
	"--dsw-alias-bg-mask-drop": "rgba(16, 18, 24, 0.90)",
	"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.14)",
	"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.20)",
	"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.06)",
	"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.08)",
	"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.10)",
	"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
	"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.26)",
	"--dsw-alias-brand-primary": "#2997ff",
	"--dsw-alias-brand-primary-invert": "#ffffff",
	"--dsw-alias-brand-primary-new-colorprimary-new-color": "#1f80e6",
	"--dsw-alias-brand-text": "#2997ff",
	"--dsw-alias-button-contrast-fill": "#2997ff",
	"--dsw-alias-button-elevated-fill": "rgb(34, 38, 48)",
	"--dsw-alias-button-floating-fill": "rgba(34, 38, 48, 0.85)",
	"--dsw-alias-button-floating-hover": "rgb(42, 46, 58)",
	"--dsw-alias-button-ghost-active-border": "rgba(41, 151, 255, 0.40)",
	"--dsw-alias-button-ghost-active-fill": "rgba(41, 151, 255, 0.12)",
	"--dsw-alias-button-ghost-active-hover": "rgba(41, 151, 255, 0.18)",
	"--dsw-alias-button-info-fill": "rgb(41, 151, 255)",
	"--dsw-alias-button-info-hover": "#1f80e6",
	"--dsw-alias-button-info-bg": "linear-gradient(180deg, rgba(58, 160, 255, 0.60), rgba(41, 151, 255, 0.38))",
	"--dsw-alias-button-info-bg-hover": "linear-gradient(180deg, rgba(77, 169, 255, 0.72), rgba(58, 160, 255, 0.48))",
	"--dsw-alias-button-radius": "14px",
	"--dsw-alias-button-radius-sm": "8px",
	"--dsw-alias-button-primary-bg": "linear-gradient(180deg, #3aa0ff 0%, #2997ff 100%)",
	"--dsw-alias-button-primary-bg-hover": "linear-gradient(180deg, #4da9ff 0%, #3aa0ff 100%)",
	"--dsw-alias-button-primary-bg-size": "100% 100%",
	"--dsw-alias-button-primary-motion": "none",
	"--dsw-alias-button-glow": "0 0 12px rgba(41, 151, 255, 0.32)",
	"--dsw-alias-button-glow-hover": "0 0 18px rgba(41, 151, 255, 0.48)",
	"--dsw-alias-button-press-shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.50)",
	"--dsw-alias-button-press-shift": "translate(0, 1px)",
	"--dsw-alias-button-outline-glow": "0 0 0 2px rgba(41, 151, 255, 0.35)",
	"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
	"--dsw-alias-button-primary-dimmed": "rgba(41, 151, 255, 0.18)",
	"--dsw-alias-button-primary-fill": "#2997ff",
	"--dsw-alias-button-primary-hover": "#3aa0ff",
	"--dsw-alias-button-tool-bar-fill": "rgba(255, 255, 255, 0.06)",
	"--dsw-alias-button-tool-bar-fill-invisible": "transparent",
	"--dsw-alias-button-tool-bar-hover": "rgba(255, 255, 255, 0.12)",
	"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.12)",
	"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.07)",
	"--dsw-alias-interactive-bg-hover-accent": "rgba(41, 151, 255, 0.16)",
	"--dsw-alias-interactive-bg-hover-danger": "rgba(255, 69, 58, 0.15)",
	"--dsw-alias-interactive-bg-hover-solid": "rgb(34, 38, 48)",
	"--dsw-alias-label-primary": "#f5f5f7",
	"--dsw-alias-label-secondary": "#a1a1a6",
	"--dsw-alias-label-caption": "#86868b",
	"--dsw-alias-label-dimmed": "#6e6e73",
	"--dsw-alias-label-primary-bluish": "#f5f5f7",
	"--dsw-alias-label-primary-dimmed": "#d1d1d6",
	"--dsw-alias-label-primary-foreground": "#ffffff",
	"--dsw-alias-label-primary-inverted": "#1c1c1e",
	"--dsw-alias-label-tertiary": "#86868b",
	"--dsw-alias-markdown-citation": "rgb(24, 27, 34)",
	"--dsw-alias-markdown-code-block-banner": "rgb(16, 18, 23)",
	"--dsw-alias-markdown-code-block": "#14161b",
	"--dsw-alias-markdown-code-segment-selected": "rgb(36, 40, 52)",
	"--dsw-alias-markdown-code-segment-unselected": "#14161b",
	"--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.08)",
	"--dsw-alias-markdown-placeholder": "rgb(20, 22, 28)",
	"--dsw-alias-markdown-tag": "rgb(28, 32, 40)",
	"--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.10)",
	"--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.16)",
	"--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.22)",
	"--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.28)",
	"--dsw-alias-state-business-primary": "#2997ff",
	"--dsw-alias-state-business-tertiary": "rgba(41, 151, 255, 0.15)",
	"--dsw-alias-toast-bg": "rgba(28, 32, 40, 0.90)",
	"--dsw-alias-tooltip-bg": "rgba(34, 38, 48, 0.92)",
	"--dsw-specific-bubble-highlight": "rgba(34, 38, 48, 0.88)",
	"--dsw-specific-bubble": "rgba(28, 32, 40, 0.82)",
	"--dsw-specific-input-major": "rgba(22, 24, 30, 0.82)",
	"--dsw-specific-login-input": "rgb(20, 22, 28)",
	"--dsw-specific-selector": "rgba(28, 32, 40, 0.85)",
	"--dsw-specific-tip": "rgba(24, 27, 34, 0.80)",
	"--dsw-specific-sidebar-nav-item-active-accent": "rgb(36, 40, 56)",
	"--dsw-specific-sidebar-nav-item-active": "rgba(42, 46, 58, 0.85)",
	"--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.05)",
	"--dsw-code-bg": "#14161b",
	"--dsw-code-fg": "#e6edf3",
	"--dsw-code-border": "rgba(255, 255, 255, 0.12)",
	"--dsw-code-comment": "#7d8590",
	"--dsw-code-keyword": "#ff7b72",
	"--dsw-code-string": "#a5d6ff",
	"--dsw-code-function": "#d2a8ff",
	"--dsh-chart-rank-0": "#2997ff",
	"--dsh-chart-rank-1": "#1f80e6",
	"--dsh-chart-rank-2": "#3aa0ff",
	"--dsh-chart-rank-3": "#52afff",
	"--dsh-chart-rank-4": "#70bfff",
	"--dsh-chart-rank-5": "#94d0ff",
	"--dsh-chart-rank-6": "#b8e0ff",
	"--dsh-chart-rank-7": "#dcf0ff",
	"--dsh-heat-step-1": "rgba(41, 151, 255, 0.20)",
	"--dsh-heat-step-2": "rgba(41, 151, 255, 0.42)",
	"--dsh-heat-step-3": "rgba(41, 151, 255, 0.68)",
	"--dsh-heat-step-4": "rgba(41, 151, 255, 0.95)"
});
//#endregion
//#region lib/types/client/void.js
/** Alias-token overrides for the void theme. */
const VOID_TOKENS = Object.freeze({
	"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(212, 210, 220, 0.12), rgba(212, 210, 220, 0) 24%),radial-gradient(560px 420px at 88% 18%, rgba(228, 222, 238, 0.35), transparent 55%),radial-gradient(540px 420px at 3% 42%, rgba(200, 192, 214, 0.42), transparent 52%)",
	"--dsw-alias-glass-blur": "blur(24px) saturate(1.05)",
	"--dsw-alias-surface-glass-blur": "blur(12px) saturate(1.0)",
	"--dsw-alias-bg-base": "rgb(13, 13, 16)",
	"--dsw-alias-surface-glass-spot": "rgba(228, 222, 238, 0.28)",
	"--dsw-alias-bg-layer-1": "rgb(24, 24, 28)",
	"--dsw-alias-bg-layer-2": "rgb(30, 30, 34)",
	"--dsw-alias-bg-layer-3": "rgb(36, 36, 42)",
	"--dsw-alias-bg-module-platform": "rgb(30, 30, 36)",
	"--dsw-alias-bg-multi-select": "rgb(28, 28, 32)",
	"--dsw-alias-bg-overlay": "rgb(48, 48, 56)",
	"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.06)",
	"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.26)",
	"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.20)",
	"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
	"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
	"--dsw-alias-bg-mask-drop": "rgba(9, 9, 12, 0.70)",
	"--dsw-alias-border-inverted": "rgba(200, 198, 204, 0.08)",
	"--dsw-alias-border-inverted2": "rgba(200, 198, 204, 0.10)",
	"--dsw-alias-border-l1": "rgba(200, 198, 204, 0.08)",
	"--dsw-alias-border-l2-darkmode-thin": "rgba(200, 198, 204, 0.08)",
	"--dsw-alias-border-l2": "rgba(200, 198, 204, 0.14)",
	"--dsw-alias-border-l3": "rgba(200, 198, 204, 0.18)",
	"--dsw-alias-border-l4": "rgba(200, 198, 204, 0.24)",
	"--dsw-alias-brand-primary": "rgb(196, 194, 202)",
	"--dsw-alias-brand-primary-invert": "rgb(240, 238, 244)",
	"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(168, 166, 176)",
	"--dsw-alias-brand-text": "rgb(196, 194, 202)",
	"--dsw-alias-button-contrast-fill": "rgb(196, 194, 202)",
	"--dsw-alias-button-elevated-fill": "rgb(22, 22, 27)",
	"--dsw-alias-button-floating-fill": "rgb(22, 22, 27)",
	"--dsw-alias-button-floating-hover": "rgb(28, 28, 34)",
	"--dsw-alias-button-ghost-active-border": "rgb(122, 120, 130)",
	"--dsw-alias-button-ghost-active-fill": "rgb(28, 28, 34)",
	"--dsw-alias-button-ghost-active-hover": "rgb(34, 34, 40)",
	"--dsw-alias-button-info-fill": "rgb(168, 166, 176)",
	"--dsw-alias-button-info-hover": "rgb(150, 148, 160)",
	"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(168, 166, 176, 0.48), rgba(138, 136, 148, 0.30) 55%, rgba(158, 156, 168, 0.40))",
	"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(182, 180, 190, 0.60), rgba(152, 150, 162, 0.38) 55%, rgba(172, 170, 182, 0.52))",
	"--dsw-alias-button-radius": "10px",
	"--dsw-alias-button-radius-sm": "8px",
	"--dsw-alias-button-primary-bg": "linear-gradient(135deg, rgba(168, 166, 176, 0.55), rgba(140, 138, 150, 0.35) 50%, rgba(158, 156, 168, 0.45))",
	"--dsw-alias-button-primary-bg-hover": "linear-gradient(135deg, rgba(182, 180, 190, 0.65), rgba(154, 152, 164, 0.45) 50%, rgba(172, 170, 182, 0.55))",
	"--dsw-alias-button-primary-bg-size": "200% 100%",
	"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
	"--dsw-alias-button-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0 0 1px rgba(196, 194, 202, 0.20),0 0 12px rgba(168, 166, 176, 0.24), 0 8px 28px rgba(134, 132, 144, 0.20)",
	"--dsw-alias-button-glow-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 0 0 1px rgba(210, 208, 218, 0.34),0 0 18px rgba(184, 182, 194, 0.36), 0 12px 36px rgba(148, 146, 158, 0.32)",
	"--dsw-alias-button-press-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px rgba(196, 194, 202, 0.12),0 4px 12px rgba(134, 132, 144, 0.14)",
	"--dsw-alias-button-press-shift": "translate(0, 1px)",
	"--dsw-alias-button-outline-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 0 1px rgba(196, 194, 202, 0.24),0 6px 18px rgba(134, 132, 144, 0.12)",
	"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
	"--dsw-alias-button-primary-dimmed": "rgb(34, 34, 42)",
	"--dsw-alias-button-primary-fill": "rgb(140, 138, 150)",
	"--dsw-alias-button-primary-hover": "rgb(154, 152, 164)",
	"--dsw-alias-button-tool-bar-fill": "rgba(34, 34, 42, 0.64)",
	"--dsw-alias-button-tool-bar-fill-invisible": "rgba(26, 26, 32, 0.42)",
	"--dsw-alias-button-tool-bar-hover": "rgba(34, 34, 42, 0.72)",
	"--dsw-alias-interactive-bg-active": "rgba(200, 198, 204, 0.10)",
	"--dsw-alias-interactive-bg-hover": "rgba(200, 198, 204, 0.06)",
	"--dsw-alias-interactive-bg-hover-accent": "rgba(168, 166, 176, 0.16)",
	"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.12)",
	"--dsw-alias-interactive-bg-hover-solid": "rgb(28, 28, 34)",
	"--dsw-alias-label-caption": "rgb(140, 138, 150)",
	"--dsw-alias-label-dimmed": "rgb(96, 94, 106)",
	"--dsw-alias-label-primary-bluish": "rgb(238, 236, 242)",
	"--dsw-alias-label-primary-dimmed": "rgb(232, 230, 238)",
	"--dsw-alias-label-primary-foreground": "rgb(248, 246, 252)",
	"--dsw-alias-label-primary-inverted": "rgb(18, 18, 22)",
	"--dsw-alias-label-primary": "rgb(242, 240, 246)",
	"--dsw-alias-label-secondary": "rgb(196, 194, 204)",
	"--dsw-alias-label-tertiary": "rgb(152, 150, 162)",
	"--dsw-alias-markdown-citation": "rgb(24, 24, 30)",
	"--dsw-alias-markdown-code-block-banner": "rgb(12, 12, 16)",
	"--dsw-alias-markdown-code-block": "rgb(14, 14, 18)",
	"--dsw-alias-markdown-code-segment-selected": "rgb(34, 34, 42)",
	"--dsw-alias-markdown-code-segment-unselected": "rgb(14, 14, 18)",
	"--dsw-alias-markdown-inline-code": "rgb(24, 24, 30)",
	"--dsw-alias-markdown-placeholder": "rgb(20, 20, 26)",
	"--dsw-alias-markdown-tag": "rgb(24, 24, 30)",
	"--dsw-alias-scrollbar-bg-l1": "rgb(40, 40, 50)",
	"--dsw-alias-scrollbar-bg-l2": "rgb(50, 50, 62)",
	"--dsw-alias-scrollbar-hover-l1": "rgb(50, 50, 62)",
	"--dsw-alias-scrollbar-hover-l2": "rgb(60, 60, 74)",
	"--dsw-alias-state-business-primary": "rgb(168, 166, 176)",
	"--dsw-alias-state-business-tertiary": "rgb(34, 34, 42)",
	"--dsw-alias-toast-bg": "rgba(46, 46, 56, 0.88)",
	"--dsw-alias-tooltip-bg": "rgba(54, 54, 66, 0.90)",
	"--dsw-specific-bubble-highlight": "rgba(40, 40, 50, 0.84)",
	"--dsw-specific-bubble": "rgba(26, 26, 32, 0.76)",
	"--dsw-specific-input-major": "rgba(21, 21, 26, 0.70)",
	"--dsw-specific-login-input": "rgb(12, 12, 16)",
	"--dsw-specific-selector": "rgba(29, 29, 36, 0.80)",
	"--dsw-specific-sidebar-fill": "rgb(22, 22, 28)",
	"--dsw-specific-sidebar-nav-item-active-accent": "rgb(33, 33, 40)",
	"--dsw-specific-sidebar-nav-item-active": "rgb(29, 29, 36)",
	"--dsw-specific-sidebar-nav-item-hover": "rgb(24, 24, 30)",
	"--dsw-specific-tip": "rgba(24, 24, 30, 0.78)",
	"--dsh-chart-rank-0": "rgb(196, 194, 202)",
	"--dsh-chart-rank-1": "rgb(168, 166, 176)",
	"--dsh-chart-rank-2": "rgb(146, 144, 154)",
	"--dsh-chart-rank-3": "rgb(126, 124, 134)",
	"--dsh-chart-rank-4": "rgb(108, 106, 116)",
	"--dsh-chart-rank-5": "rgb(90, 88, 98)",
	"--dsh-chart-rank-6": "rgb(74, 72, 82)",
	"--dsh-chart-rank-7": "rgb(58, 56, 66)",
	"--dsh-heat-step-1": "rgba(196, 194, 202, 0.18)",
	"--dsh-heat-step-2": "rgba(196, 194, 202, 0.38)",
	"--dsh-heat-step-3": "rgba(196, 194, 202, 0.65)",
	"--dsh-heat-step-4": "rgba(196, 194, 202, 0.92)"
});
//#endregion
//#region lib/types/client/jade.js
/** Alias-token overrides for the 银曜 (Argent / Cool Titanium Stone) light theme. */
const JADE_TOKENS = Object.freeze({
	"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(236, 239, 245, 0.80), rgba(226, 228, 233, 0) 24%),radial-gradient(560px 420px at 85% 15%, rgba(240, 243, 248, 0.65), transparent 55%),radial-gradient(540px 420px at 8% 45%, rgba(205, 211, 222, 0.45), transparent 52%)",
	"--dsw-alias-glass-blur": "blur(20px) saturate(1.20)",
	"--dsw-alias-surface-glass-blur": "blur(12px)",
	"--dsw-alias-bg-base": "rgb(226, 228, 233)",
	"--dsw-alias-surface-glass-spot": "rgba(238, 241, 247, 0.65)",
	"--dsw-alias-bg-layer-1": "rgba(235, 237, 242, 0.88)",
	"--dsw-alias-bg-layer-2": "rgba(228, 231, 237, 0.92)",
	"--dsw-alias-bg-layer-3": "rgba(220, 223, 230, 0.96)",
	"--dsw-alias-bg-module-platform": "rgb(224, 227, 234)",
	"--dsw-alias-bg-multi-select": "rgb(218, 221, 228)",
	"--dsw-alias-bg-overlay": "rgba(238, 241, 247, 0.98)",
	"--dsw-alias-bg-skeleton": "rgba(15, 23, 42, 0.06)",
	"--dsw-alias-bg-mask-1": "rgba(15, 23, 42, 0.22)",
	"--dsw-alias-bg-mask-2": "rgba(15, 23, 42, 0.10)",
	"--dsw-alias-bg-mask-3": "rgba(15, 23, 42, 0.40)",
	"--dsw-alias-bg-mask-photo": "rgba(15, 23, 42, 0.85)",
	"--dsw-alias-bg-mask-drop": "rgba(235, 238, 244, 0.82)",
	"--dsw-alias-border-inverted": "rgba(0, 0, 0, 0.06)",
	"--dsw-alias-border-inverted2": "rgba(0, 0, 0, 0.08)",
	"--dsw-alias-border-l1": "rgba(15, 23, 42, 0.06)",
	"--dsw-alias-border-l2-darkmode-thin": "rgba(15, 23, 42, 0.09)",
	"--dsw-alias-border-l2": "rgba(15, 23, 42, 0.10)",
	"--dsw-alias-border-l3": "rgba(15, 23, 42, 0.14)",
	"--dsw-alias-border-l4": "rgba(15, 23, 42, 0.20)",
	"--dsw-alias-brand-primary": "rgb(20, 22, 28)",
	"--dsw-alias-brand-primary-invert": "rgb(240, 242, 247)",
	"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(36, 40, 50)",
	"--dsw-alias-brand-text": "rgb(20, 22, 28)",
	"--dsw-alias-button-contrast-fill": "rgb(20, 22, 28)",
	"--dsw-alias-button-elevated-fill": "rgb(238, 240, 245)",
	"--dsw-alias-button-floating-fill": "rgba(238, 240, 245, 0.88)",
	"--dsw-alias-button-floating-hover": "rgb(232, 235, 241)",
	"--dsw-alias-button-ghost-active-border": "rgb(196, 202, 212)",
	"--dsw-alias-button-ghost-active-fill": "rgb(226, 229, 235)",
	"--dsw-alias-button-ghost-active-hover": "rgb(220, 223, 230)",
	"--dsw-alias-button-info-fill": "rgb(20, 22, 28)",
	"--dsw-alias-button-info-hover": "rgb(42, 46, 56)",
	"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(240, 242, 247, 0.95), rgba(222, 226, 234, 0.85))",
	"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(245, 247, 252, 1), rgba(228, 232, 240, 0.90))",
	"--dsw-alias-button-radius": "10px",
	"--dsw-alias-button-radius-sm": "8px",
	"--dsw-alias-button-primary-bg": "linear-gradient(145deg, rgba(240, 242, 247, 0.95) 0%, rgba(230, 233, 240, 0.88) 45%, rgba(216, 220, 228, 0.82) 100%)",
	"--dsw-alias-button-primary-bg-hover": "linear-gradient(145deg, rgba(245, 247, 252, 1) 0%, rgba(235, 238, 245, 0.92) 45%, rgba(222, 226, 234) 100%)",
	"--dsw-alias-button-primary-bg-size": "200% 100%",
	"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
	"--dsw-alias-button-glow": "inset 0 1px 1px rgba(255, 255, 255, 0.80), inset 0 0 0 1px rgba(255, 255, 255, 0.40), 0 0 0 1px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.08), 0 6px 16px rgba(15, 23, 42, 0.05)",
	"--dsw-alias-button-glow-hover": "inset 0 1px 1.5px rgba(255, 255, 255, 0.90), inset 0 0 0 1px rgba(255, 255, 255, 0.60), 0 0 0 1px rgba(15, 23, 42, 0.14), 0 3px 10px rgba(15, 23, 42, 0.12), 0 8px 20px rgba(15, 23, 42, 0.06)",
	"--dsw-alias-button-press-shadow": "inset 0 1px 2px rgba(15, 23, 42, 0.14), inset 0 0 0 1px rgba(15, 23, 42, 0.09), 0 1px 3px rgba(15, 23, 42, 0.06)",
	"--dsw-alias-button-press-shift": "translate(0, 1px)",
	"--dsw-alias-button-outline-glow": "inset 0 1px 1px rgba(255, 255, 255, 0.70), 0 0 0 1px rgba(15, 23, 42, 0.11)",
	"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
	"--dsw-alias-button-primary-dimmed": "rgb(218, 222, 230)",
	"--dsw-alias-button-primary-fill": "rgb(20, 22, 28)",
	"--dsw-alias-button-primary-hover": "rgb(42, 46, 56)",
	"--dsw-alias-button-tool-bar-fill": "rgba(235, 238, 244, 0.70)",
	"--dsw-alias-button-tool-bar-fill-invisible": "rgba(235, 238, 244, 0.35)",
	"--dsw-alias-button-tool-bar-hover": "rgba(240, 242, 248, 0.88)",
	"--dsw-alias-interactive-bg-active": "rgba(15, 23, 42, 0.09)",
	"--dsw-alias-interactive-bg-hover": "rgba(15, 23, 42, 0.05)",
	"--dsw-alias-interactive-bg-hover-accent": "rgba(15, 23, 42, 0.08)",
	"--dsw-alias-interactive-bg-hover-danger": "rgba(236, 19, 19, 0.08)",
	"--dsw-alias-interactive-bg-hover-solid": "rgb(226, 229, 236)",
	"--dsw-alias-label-caption": "rgb(136, 144, 156)",
	"--dsw-alias-label-dimmed": "rgb(168, 175, 186)",
	"--dsw-alias-label-primary-bluish": "rgb(20, 22, 28)",
	"--dsw-alias-label-primary-dimmed": "rgb(36, 40, 50)",
	"--dsw-alias-label-primary-foreground": "rgb(240, 242, 247)",
	"--dsw-alias-label-primary-inverted": "rgb(240, 242, 247)",
	"--dsw-alias-label-primary": "rgb(20, 22, 28)",
	"--dsw-alias-label-secondary": "rgb(68, 76, 88)",
	"--dsw-alias-label-tertiary": "rgb(112, 120, 134)",
	"--dsw-alias-markdown-citation": "rgb(224, 227, 234)",
	"--dsw-alias-markdown-code-block-banner": "rgb(222, 225, 232)",
	"--dsw-alias-markdown-code-block": "rgb(226, 229, 236)",
	"--dsw-alias-markdown-code-segment-selected": "rgb(238, 240, 245)",
	"--dsw-alias-markdown-code-segment-unselected": "rgb(222, 225, 232)",
	"--dsw-alias-markdown-inline-code": "rgb(222, 225, 232)",
	"--dsw-alias-markdown-placeholder": "rgb(226, 229, 236)",
	"--dsw-alias-markdown-tag": "rgb(222, 225, 232)",
	"--dsw-alias-scrollbar-bg-l1": "rgba(15, 23, 42, 0.13)",
	"--dsw-alias-scrollbar-bg-l2": "rgba(15, 23, 42, 0.18)",
	"--dsw-alias-scrollbar-hover-l1": "rgba(15, 23, 42, 0.24)",
	"--dsw-alias-scrollbar-hover-l2": "rgba(15, 23, 42, 0.30)",
	"--dsw-alias-state-business-primary": "rgb(20, 22, 28)",
	"--dsw-alias-state-business-tertiary": "rgb(222, 225, 232)",
	"--dsw-alias-toast-bg": "rgb(26, 28, 36)",
	"--dsw-alias-tooltip-bg": "rgb(20, 22, 28)",
	"--dsw-specific-bubble-highlight": "rgba(228, 232, 238, 0.90)",
	"--dsw-specific-bubble": "rgba(235, 238, 243, 0.92)",
	"--dsw-specific-input-major": "rgba(235, 238, 243, 0.92)",
	"--dsw-specific-login-input": "rgb(235, 238, 243)",
	"--dsw-specific-selector": "rgba(228, 232, 238, 0.90)",
	"--dsw-specific-sidebar-fill": "rgba(224, 227, 234, 0.70)",
	"--dsw-specific-sidebar-nav-item-active-accent": "rgb(212, 216, 224)",
	"--dsw-specific-sidebar-nav-item-active": "rgba(238, 241, 246, 0.90)",
	"--dsw-specific-sidebar-nav-item-hover": "rgba(15, 23, 42, 0.05)",
	"--dsw-specific-tip": "rgba(226, 229, 236, 0.85)",
	"--dsh-chart-rank-0": "rgb(20, 22, 28)",
	"--dsh-chart-rank-1": "rgb(42, 46, 56)",
	"--dsh-chart-rank-2": "rgb(68, 76, 88)",
	"--dsh-chart-rank-3": "rgb(96, 106, 120)",
	"--dsh-chart-rank-4": "rgb(124, 134, 148)",
	"--dsh-chart-rank-5": "rgb(154, 162, 176)",
	"--dsh-chart-rank-6": "rgb(184, 190, 202)",
	"--dsh-chart-rank-7": "rgb(208, 212, 222)",
	"--dsh-heat-step-1": "rgba(20, 22, 28, 0.14)",
	"--dsh-heat-step-2": "rgba(20, 22, 28, 0.35)",
	"--dsh-heat-step-3": "rgba(20, 22, 28, 0.62)",
	"--dsh-heat-step-4": "rgba(20, 22, 28, 0.90)"
});
//#endregion
//#region lib/types/client/solar.js
/** Alias-token overrides for the solar theme. */
const SOLAR_TOKENS = Object.freeze({
	"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(240, 180, 90, 0.08), rgba(240, 180, 90, 0) 24%),radial-gradient(560px 420px at 92% 22%, rgba(252, 200, 114, 0.26), transparent 55%),radial-gradient(540px 420px at 5% 32%, rgba(240, 180, 90, 0.22), transparent 52%)",
	"--dsw-alias-glass-blur": "blur(20px) saturate(1.20)",
	"--dsw-alias-surface-glass-blur": "blur(12px) saturate(1.0)",
	"--dsw-alias-bg-base": "rgb(18, 14, 16)",
	"--dsw-alias-surface-glass-spot": "rgba(252, 200, 114, 0.28)",
	"--dsw-alias-bg-layer-1": "rgb(38, 28, 24)",
	"--dsw-alias-bg-layer-2": "rgb(44, 32, 30)",
	"--dsw-alias-bg-layer-3": "rgb(50, 38, 36)",
	"--dsw-alias-bg-module-platform": "rgb(44, 34, 34)",
	"--dsw-alias-bg-multi-select": "rgb(38, 30, 30)",
	"--dsw-alias-bg-overlay": "rgba(58, 46, 48, 0.86)",
	"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.06)",
	"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.26)",
	"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.20)",
	"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
	"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
	"--dsw-alias-bg-mask-drop": "rgba(16, 12, 14, 0.70)",
	"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.08)",
	"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.10)",
	"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.08)",
	"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.08)",
	"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.14)",
	"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
	"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.24)",
	"--dsw-alias-brand-primary": "rgb(240, 180, 90)",
	"--dsw-alias-brand-primary-invert": "rgb(250, 234, 210)",
	"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(220, 156, 60)",
	"--dsw-alias-brand-text": "rgb(240, 180, 90)",
	"--dsw-alias-button-contrast-fill": "rgb(240, 180, 90)",
	"--dsw-alias-button-elevated-fill": "rgb(38, 30, 32)",
	"--dsw-alias-button-floating-fill": "rgb(38, 30, 32)",
	"--dsw-alias-button-floating-hover": "rgb(46, 36, 40)",
	"--dsw-alias-button-ghost-active-border": "rgb(160, 118, 56)",
	"--dsw-alias-button-ghost-active-fill": "rgb(46, 36, 40)",
	"--dsw-alias-button-ghost-active-hover": "rgb(54, 42, 46)",
	"--dsw-alias-button-info-fill": "rgb(220, 156, 60)",
	"--dsw-alias-button-info-hover": "rgb(204, 140, 44)",
	"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(230, 170, 70, 0.50), rgba(190, 130, 40, 0.32) 55%, rgba(210, 150, 50, 0.44))",
	"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(240, 182, 84, 0.62), rgba(204, 144, 52, 0.40) 55%, rgba(222, 164, 64, 0.54))",
	"--dsw-alias-button-radius": "10px",
	"--dsw-alias-button-radius-sm": "8px",
	"--dsw-alias-button-primary-bg": "linear-gradient(135deg, rgba(220, 156, 60, 0.34), rgba(180, 120, 36, 0.18) 50%, rgba(200, 142, 50, 0.30))",
	"--dsw-alias-button-primary-bg-hover": "linear-gradient(135deg, rgba(232, 170, 76, 0.44), rgba(194, 134, 48, 0.26) 50%, rgba(214, 156, 64, 0.38))",
	"--dsw-alias-button-primary-bg-size": "200% 100%",
	"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
	"--dsw-alias-button-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 0 0 1px rgba(240, 180, 90, 0.22),0 0 14px rgba(220, 160, 70, 0.30), 0 8px 28px rgba(180, 120, 36, 0.28)",
	"--dsw-alias-button-glow-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.34), 0 0 0 1px rgba(248, 198, 110, 0.36),0 0 20px rgba(234, 174, 84, 0.44), 0 12px 36px rgba(194, 134, 48, 0.40)",
	"--dsw-alias-button-press-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 0 1px rgba(240, 180, 90, 0.14),0 4px 12px rgba(180, 120, 36, 0.18)",
	"--dsw-alias-button-press-shift": "translate(0, 1px)",
	"--dsw-alias-button-outline-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(240, 180, 90, 0.26),0 6px 18px rgba(180, 120, 36, 0.16)",
	"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
	"--dsw-alias-button-primary-dimmed": "rgb(46, 36, 40)",
	"--dsw-alias-button-primary-fill": "rgb(180, 120, 36)",
	"--dsw-alias-button-primary-hover": "rgb(194, 134, 48)",
	"--dsw-alias-button-tool-bar-fill": "rgba(46, 36, 38, 0.64)",
	"--dsw-alias-button-tool-bar-fill-invisible": "rgba(34, 28, 30, 0.42)",
	"--dsw-alias-button-tool-bar-hover": "rgba(46, 36, 38, 0.72)",
	"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.10)",
	"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.06)",
	"--dsw-alias-interactive-bg-hover-accent": "rgba(240, 180, 90, 0.16)",
	"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.14)",
	"--dsw-alias-interactive-bg-hover-solid": "rgb(46, 36, 40)",
	"--dsw-alias-label-caption": "rgb(180, 156, 128)",
	"--dsw-alias-label-dimmed": "rgb(130, 108, 82)",
	"--dsw-alias-label-primary-bluish": "rgb(248, 240, 230)",
	"--dsw-alias-label-primary-dimmed": "rgb(244, 234, 222)",
	"--dsw-alias-label-primary-foreground": "rgb(252, 248, 244)",
	"--dsw-alias-label-primary-inverted": "rgb(38, 28, 24)",
	"--dsw-alias-label-primary": "rgb(248, 242, 236)",
	"--dsw-alias-label-secondary": "rgb(210, 196, 182)",
	"--dsw-alias-label-tertiary": "rgb(172, 156, 142)",
	"--dsw-alias-markdown-citation": "rgb(38, 30, 32)",
	"--dsw-alias-markdown-code-block-banner": "rgb(22, 18, 20)",
	"--dsw-alias-markdown-code-block": "rgb(24, 20, 22)",
	"--dsw-alias-markdown-code-segment-selected": "rgb(46, 36, 40)",
	"--dsw-alias-markdown-code-segment-unselected": "rgb(24, 20, 22)",
	"--dsw-alias-markdown-inline-code": "rgb(38, 30, 32)",
	"--dsw-alias-markdown-placeholder": "rgb(30, 24, 26)",
	"--dsw-alias-markdown-tag": "rgb(38, 30, 32)",
	"--dsw-alias-scrollbar-bg-l1": "rgb(56, 44, 46)",
	"--dsw-alias-scrollbar-bg-l2": "rgb(68, 54, 56)",
	"--dsw-alias-scrollbar-hover-l1": "rgb(68, 54, 56)",
	"--dsw-alias-scrollbar-hover-l2": "rgb(82, 66, 68)",
	"--dsw-alias-state-business-primary": "rgb(220, 156, 60)",
	"--dsw-alias-state-business-tertiary": "rgb(46, 36, 40)",
	"--dsw-alias-toast-bg": "rgba(58, 46, 48, 0.88)",
	"--dsw-alias-tooltip-bg": "rgba(66, 54, 56, 0.90)",
	"--dsw-specific-bubble-highlight": "rgba(52, 42, 44, 0.84)",
	"--dsw-specific-bubble": "rgba(40, 32, 34, 0.78)",
	"--dsw-specific-input-major": "rgba(30, 24, 26, 0.74)",
	"--dsw-specific-login-input": "rgb(22, 18, 20)",
	"--dsw-specific-selector": "rgba(38, 30, 32, 0.82)",
	"--dsw-specific-sidebar-fill": "rgb(36, 26, 22)",
	"--dsw-specific-sidebar-nav-item-active-accent": "rgb(50, 38, 42)",
	"--dsw-specific-sidebar-nav-item-active": "rgb(46, 36, 40)",
	"--dsw-specific-sidebar-nav-item-hover": "rgb(38, 30, 32)",
	"--dsw-specific-tip": "rgba(38, 30, 32, 0.80)",
	"--dsh-chart-rank-0": "rgb(240, 180, 90)",
	"--dsh-chart-rank-1": "rgb(220, 156, 60)",
	"--dsh-chart-rank-2": "rgb(204, 136, 48)",
	"--dsh-chart-rank-3": "rgb(186, 116, 38)",
	"--dsh-chart-rank-4": "rgb(168, 96, 32)",
	"--dsh-chart-rank-5": "rgb(148, 80, 28)",
	"--dsh-chart-rank-6": "rgb(128, 64, 24)",
	"--dsh-chart-rank-7": "rgb(108, 52, 22)",
	"--dsh-heat-step-1": "rgba(240, 180, 90, 0.18)",
	"--dsh-heat-step-2": "rgba(240, 180, 90, 0.40)",
	"--dsh-heat-step-3": "rgba(240, 180, 90, 0.68)",
	"--dsh-heat-step-4": "rgba(240, 180, 90, 0.95)"
});
//#endregion
//#region lib/types/client/parchment.js
const PARCHMENT_TOKENS = Object.freeze({
	"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(34, 28, 24, 0.035) 0%, rgba(230, 224, 212, 0) 26%),radial-gradient(ellipse 960px 580px at 90% 16%, rgba(34, 28, 24, 0.045) 0%, transparent 68%),radial-gradient(ellipse 820px 480px at 8% 68%, rgba(38, 32, 28, 0.040) 0%, transparent 64%)",
	"--dsw-alias-glass-blur": "none",
	"--dsw-alias-surface-glass-blur": "none",
	"--dsw-alias-bg-base": "rgb(230, 224, 212)",
	"--dsw-alias-surface-glass-spot": "transparent",
	"--dsw-alias-bg-layer-1": "rgba(238, 232, 220, 0.88)",
	"--dsw-alias-bg-layer-2": "rgba(232, 225, 212, 0.92)",
	"--dsw-alias-bg-layer-3": "rgba(224, 216, 202, 0.95)",
	"--dsw-alias-bg-module-platform": "rgb(226, 219, 206)",
	"--dsw-alias-bg-multi-select": "rgb(220, 213, 200)",
	"--dsw-alias-bg-overlay": "rgb(236, 230, 218)",
	"--dsw-alias-bg-skeleton": "rgba(34, 28, 24, 0.05)",
	"--dsw-alias-bg-mask-1": "rgba(34, 28, 24, 0.22)",
	"--dsw-alias-bg-mask-2": "rgba(34, 28, 24, 0.10)",
	"--dsw-alias-bg-mask-3": "rgba(34, 28, 24, 0.40)",
	"--dsw-alias-bg-mask-photo": "rgba(34, 28, 24, 0.85)",
	"--dsw-alias-bg-mask-drop": "rgba(238, 232, 220, 0.80)",
	"--dsw-alias-border-inverted": "rgba(0, 0, 0, 0.05)",
	"--dsw-alias-border-inverted2": "rgba(0, 0, 0, 0.07)",
	"--dsw-alias-border-l1": "rgba(38, 32, 28, 0.07)",
	"--dsw-alias-border-l2-darkmode-thin": "rgba(38, 32, 28, 0.09)",
	"--dsw-alias-border-l2": "rgba(38, 32, 28, 0.10)",
	"--dsw-alias-border-l3": "rgba(38, 32, 28, 0.15)",
	"--dsw-alias-border-l4": "rgba(38, 32, 28, 0.20)",
	"--dsw-alias-brand-primary": "rgb(156, 48, 28)",
	"--dsw-alias-brand-primary-invert": "rgb(252, 246, 240)",
	"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(142, 40, 22)",
	"--dsw-alias-brand-text": "rgb(156, 48, 28)",
	"--dsw-alias-button-contrast-fill": "rgb(34, 28, 24)",
	"--dsw-alias-button-elevated-fill": "rgb(238, 232, 220)",
	"--dsw-alias-button-floating-fill": "rgba(238, 232, 220, 0.88)",
	"--dsw-alias-button-floating-hover": "rgb(242, 236, 226)",
	"--dsw-alias-button-ghost-active-border": "rgb(204, 194, 180)",
	"--dsw-alias-button-ghost-active-fill": "rgb(226, 218, 205)",
	"--dsw-alias-button-ghost-active-hover": "rgb(218, 210, 196)",
	"--dsw-alias-button-info-fill": "rgb(156, 48, 28)",
	"--dsw-alias-button-info-hover": "rgb(138, 38, 20)",
	"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(242, 236, 225, 0.95), rgba(228, 220, 208, 0.85))",
	"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(246, 241, 232, 1), rgba(232, 225, 212, 0.90))",
	"--dsw-alias-button-radius": "5px",
	"--dsw-alias-button-radius-sm": "4px",
	"--dsw-alias-button-primary-bg": "linear-gradient(145deg, rgb(165, 52, 32) 0%, rgb(148, 42, 24) 100%)",
	"--dsw-alias-button-primary-bg-hover": "linear-gradient(145deg, rgb(176, 58, 36) 0%, rgb(158, 46, 26) 100%)",
	"--dsw-alias-button-primary-bg-size": "100% 100%",
	"--dsw-alias-button-primary-motion": "none",
	"--dsw-alias-button-glow": "0 0 0 1px rgba(156, 48, 28, 0.35), inset 0 0 0 1px rgba(255, 240, 230, 0.30), 0 2px 4px rgba(34, 28, 24, 0.12)",
	"--dsw-alias-button-glow-hover": "0 0 0 1.5px rgba(156, 48, 28, 0.50), inset 0 0 0 1px rgba(255, 240, 230, 0.45), 0 3px 8px rgba(156, 48, 28, 0.25)",
	"--dsw-alias-button-press-shadow": "inset 0 2px 4px rgba(34, 28, 24, 0.25)",
	"--dsw-alias-button-press-shift": "translate(0, 1px)",
	"--dsw-alias-button-outline-glow": "0 0 0 1px rgba(156, 48, 28, 0.25)",
	"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
	"--dsw-alias-button-primary-dimmed": "rgb(225, 217, 204)",
	"--dsw-alias-button-primary-fill": "rgb(156, 48, 28)",
	"--dsw-alias-button-primary-hover": "rgb(138, 38, 20)",
	"--dsw-alias-button-tool-bar-fill": "rgba(238, 232, 220, 0.70)",
	"--dsw-alias-button-tool-bar-fill-invisible": "rgba(238, 232, 220, 0.35)",
	"--dsw-alias-button-tool-bar-hover": "rgba(242, 236, 225, 0.88)",
	"--dsw-alias-interactive-bg-active": "rgba(34, 28, 24, 0.08)",
	"--dsw-alias-interactive-bg-hover": "rgba(34, 28, 24, 0.04)",
	"--dsw-alias-interactive-bg-hover-accent": "rgba(156, 48, 28, 0.08)",
	"--dsw-alias-interactive-bg-hover-danger": "rgba(220, 38, 38, 0.08)",
	"--dsw-alias-interactive-bg-hover-solid": "rgb(226, 219, 206)",
	"--dsw-alias-label-caption": "rgb(142, 130, 120)",
	"--dsw-alias-label-dimmed": "rgb(172, 160, 148)",
	"--dsw-alias-label-primary-bluish": "rgb(34, 28, 24)",
	"--dsw-alias-label-primary-dimmed": "rgb(52, 44, 38)",
	"--dsw-alias-label-primary-foreground": "rgb(252, 246, 240)",
	"--dsw-alias-label-primary-inverted": "rgb(252, 246, 240)",
	"--dsw-alias-label-primary": "rgb(34, 28, 24)",
	"--dsw-alias-label-secondary": "rgb(82, 72, 64)",
	"--dsw-alias-label-tertiary": "rgb(132, 120, 110)",
	"--dsw-alias-markdown-citation": "rgb(224, 217, 204)",
	"--dsw-alias-markdown-code-block-banner": "rgb(218, 210, 196)",
	"--dsw-alias-markdown-code-block": "rgb(224, 217, 204)",
	"--dsw-alias-markdown-code-segment-selected": "rgb(240, 235, 224)",
	"--dsw-alias-markdown-code-segment-unselected": "rgb(218, 210, 196)",
	"--dsw-alias-markdown-inline-code": "rgba(34, 28, 24, 0.06)",
	"--dsw-alias-markdown-placeholder": "rgb(224, 217, 204)",
	"--dsw-alias-markdown-tag": "rgb(218, 210, 196)",
	"--dsw-alias-scrollbar-bg-l1": "rgba(34, 28, 24, 0.10)",
	"--dsw-alias-scrollbar-bg-l2": "rgba(34, 28, 24, 0.15)",
	"--dsw-alias-scrollbar-hover-l1": "rgba(34, 28, 24, 0.20)",
	"--dsw-alias-scrollbar-hover-l2": "rgba(34, 28, 24, 0.25)",
	"--dsw-alias-state-business-primary": "rgb(156, 48, 28)",
	"--dsw-alias-state-business-tertiary": "rgb(224, 217, 204)",
	"--dsw-alias-toast-bg": "rgb(34, 28, 24)",
	"--dsw-alias-tooltip-bg": "rgb(34, 28, 24)",
	"--dsw-specific-bubble-highlight": "rgba(232, 225, 212, 0.90)",
	"--dsw-specific-bubble": "rgba(238, 232, 220, 0.92)",
	"--dsw-specific-input-major": "rgba(238, 232, 220, 0.92)",
	"--dsw-specific-login-input": "rgb(238, 232, 220)",
	"--dsw-specific-selector": "rgba(232, 225, 212, 0.90)",
	"--dsw-specific-sidebar-fill": "rgb(226, 219, 206)",
	"--dsw-specific-sidebar-nav-item-active-accent": "rgb(214, 206, 192)",
	"--dsw-specific-sidebar-nav-item-active": "rgba(242, 236, 225, 0.90)",
	"--dsw-specific-sidebar-nav-item-hover": "rgba(34, 28, 24, 0.04)",
	"--dsw-specific-tip": "rgba(228, 221, 208, 0.80)",
	"--dsh-chart-rank-0": "rgb(156, 48, 28)",
	"--dsh-chart-rank-1": "rgb(176, 68, 44)",
	"--dsh-chart-rank-2": "rgb(196, 92, 64)",
	"--dsh-chart-rank-3": "rgb(212, 120, 92)",
	"--dsh-chart-rank-4": "rgb(142, 110, 84)",
	"--dsh-chart-rank-5": "rgb(168, 138, 112)",
	"--dsh-chart-rank-6": "rgb(194, 168, 144)",
	"--dsh-chart-rank-7": "rgb(216, 196, 176)",
	"--dsh-heat-step-1": "rgba(156, 48, 28, 0.16)",
	"--dsh-heat-step-2": "rgba(156, 48, 28, 0.35)",
	"--dsh-heat-step-3": "rgba(156, 48, 28, 0.62)",
	"--dsh-heat-step-4": "rgba(156, 48, 28, 0.90)"
});
//#endregion
//#region lib/types/boot-spinner-css.js
/**
* Boot-page spinner correction shared by both halves.
*
* The official spinner pairs `corner-shape: round` with its 50% radius on the
* element, but the `::after` arc that paints the ring only inherits the radius
* — the theme's universal `*::after { corner-shape: superellipse(1.5) }` then
* deforms that circle into a squircle. At 20px the ring also cuts both arc ends
* along a radius, so at 1x each end lands as a 2px square block and the whole
* ring reads as a bracketed square. Restore the circular curve and cap the arc
* ends with 1px round heads, keeping the official 2px stroke width (softening
* the mask instead thins the ring and loses its weight).
*
* The extra `[data-dsh-boot]` ancestor keeps these declarations above the
* plugin-injected theme sheet; the ring stays round regardless of injection
* order. Round caps need CSS trigonometry and degrade to the official arc
* elsewhere, where only the corner-shape pairing applies.
*
* The node half injects this into the served index head, so a fresh page is
* correct from the first paint. The client half re-injects it once the bundle
* activates, so a page served by an older node half still corrects itself.
*/
const BOOT_SPINNER_CSS = `[data-dsh-boot] [data-dsh-boot-spinner],
[data-dsh-boot] [data-dsh-boot-spinner]::after {
  corner-shape: round;
}
@supports (width: calc(1px * sin(1deg))) {
  [data-dsh-boot] [data-dsh-boot-spinner]::after {
    background:
      radial-gradient(circle at 50% calc(50% - 11px), var(--dsw-alias-brand-primary, var(--dsh-boot-brand, #1f6feb)) 0 1px, transparent 1.2px),
      radial-gradient(circle at calc(50% + 11px * sin(var(--dsh-boot-arc, 72deg))) calc(50% - 11px * cos(var(--dsh-boot-arc, 72deg))), var(--dsw-alias-brand-primary, var(--dsh-boot-brand, #1f6feb)) 0 1px, transparent 1.2px),
      conic-gradient(var(--dsw-alias-brand-primary, var(--dsh-boot-brand, #1f6feb)) var(--dsh-boot-arc, 72deg), transparent 0);
  }
}`;
//#endregion
//#region lib/types/index.js
const BOOT_SCRIPT = `(function(){
try {
  var s = typeof localStorage !== 'undefined' && localStorage.getItem('dsh-theme-preference');
  if (!s || s === 'light' || s === 'dark' || s === 'system') return;
  var id = s.split('|')[0];
  var tokens = ${JSON.stringify({
	sequoia: SEQUOIA_TOKENS,
	sonoma: SONOMA_TOKENS,
	void: VOID_TOKENS,
	jade: JADE_TOKENS,
	solar: SOLAR_TOKENS,
	parchment: PARCHMENT_TOKENS
})}[id];
  if (!tokens) return;
  var scheme = ${JSON.stringify({
	sequoia: "light",
	sonoma: "dark",
	void: "dark",
	jade: "light",
	solar: "dark",
	parchment: "light"
})}[id] || 'dark';
  var apply = function () {
    document.documentElement.style.colorScheme = scheme;
    document.body.toggleAttribute('data-ds-dark-theme', scheme === 'dark');
    document.body.setAttribute('data-ds-custom-theme', id);
    var html = document.documentElement;
    var body = document.body;
    for (var k in tokens) {
      html.style.setProperty(k, tokens[k]);
      body.style.setProperty(k, tokens[k]);
    }
  };
  apply();
  // Re-assert every frame until the browser half signals live, so the
  // ThemePresenter's boot-time built-in adopt cannot repaint the page
  // with the default palette before the plugin bundle loads.
  var n = 0;
  var tick = function () {
    if (window.__dshCustomThemeLive) return;
    apply();
    if (++n < 600) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} catch (e) {}
})()`;
/**
* Inject the boot script after the official ui-theme boot script so it
* overrides the host-persisted preference when a custom theme was saved.
* @param ctx - Host context.
*/
function apply(ctx) {
	ctx.on("webserver/index-inject", (table) => {
		table.push({
			kind: "script",
			placement: "body",
			text: BOOT_SCRIPT
		});
		table.push({
			kind: "style",
			text: BOOT_SPINNER_CSS
		});
	});
	ctx.inject(["webServer"], (scope) => {
		const dispose = registerRoutes(ctx, scope);
		scope.effect(() => dispose);
	});
}
//#endregion
export { apply };
