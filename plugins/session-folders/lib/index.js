// dsh-session-folders host half: a Cordis plug-in that persists feature
// folders (one level of named folders per workspace) in its own storage
// domain and serves the folder CRUD/move/reorder/pin, unarchive, and
// open-folder API to the web client over
// the dsh webServer. The workspace registry owns the durable workspace/session
// accounting; we hold only folder records and read the registry for every
// validation (workspace existence, session membership).
//
// Wire contract: requests and responses are JSON. Success payloads are
// route-specific ({ folders }, { id }, { ok: true }); failures always have
// the shape { error: <code> } with a non-2xx status. Routes are same-origin
// and unauthenticated (dsh-session-manager precedent), so every input is
// validated server-side.

import { defineDomain } from "@deepseek-ai/dsh-storage-domain";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { hasNameConflict, isExactIdSet, parseFolderName } from "./folder-utils.js";
import schemastery from "@deepseek-ai/schemastery";

/** Plug-in identity used by the cordis loader. */
const name = "dsh-session-folders";
/**
* Host services this plug-in consumes. Note: 'logger' is NOT a service —
* ctx.logger is a built-in Context property and must never be injected;
* only these three real services are needed.
*/
const inject = ["webServer", "storageDomain", "workspaceRegistry", "sessions", "sessionTitle", "llm", "sessionPersistence"];



/** Route prefix; all routes live under it (duplicate (kind, path) registrations throw). */
const ROUTE_PREFIX = "/dsh-session-folders-custom";
/** Cap on request body size, mirroring the dsh-session-manager wire discipline. */
const MAX_BODY_BYTES = 65536;
/** Session ids arrive as bare UUIDs or with the 'session-' prefix. */
const SESSION_ID_RE = /^(session-)?[0-9a-fA-F-]+$/;
/** Folder ids are always server-issued UUIDs. */
const FOLDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Sessions with an auto-rename model stream already running (concurrency guard). */
const autoRenameInFlight = new Set();

const folderSchema = z.object({
	id: z.string(),
	workspaceId: z.string(),
	name: z.string(),
	sessionIds: z.array(z.string()),
	// Display order within the workspace; legacy records carry no index and
	// sort last (falling back to name order) until first reordered.
	sortIndex: z.number().int().min(0).optional(),
	// Sessions pinned at the top of this folder, in pin order.
	pinnedSessionIds: z.array(z.string()).optional()
});

/**
* The plug-in's own storage domain: one global record holding every folder.
* Orphaned folder records (workspace deleted) are filtered at list time —
* there is no workspace-delete hook, so records are never proactively
* removed; they simply stop being served. Sessions are never stored here:
* membership rides the folder records only, and a session not listed in any
* folder is loose by definition.
*/
const foldersDomainSpec = defineDomain({
	name: "dsh_session_folders_custom",
	version: 1,
	global: {
		schema: z.object({
			folders: z.array(folderSchema),
			// Display order of workspace ids, maintained by reorder-workspaces.
			workspaceOrder: z.array(z.string()).optional(),
			// Sessions pinned at the top of a workspace's loose bucket, per workspace.
			pinnedLooseByWorkspace: z.record(z.string(), z.array(z.string())).optional()
		}),
		initial: { folders: [], workspaceOrder: [], pinnedLooseByWorkspace: {} }
	},
	tables: {}
});

/** Accumulate the raw request body with a size guard. */
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
			if (data.length > MAX_BODY_BYTES) {
				req.destroy();
				const err = new Error("request body too large");
				err.clientError = true;
				reject(err);
			}
		});
		req.on("end", () => {
			if (data.length === 0) return resolve({});
			try {
				resolve(JSON.parse(data));
			} catch {
				const err = new Error("invalid JSON body");
				err.clientError = true;
				reject(err);
			}
		});
		req.on("error", reject);
	});
}

/** Write a JSON response with an explicit content-length. */
function respond(res, status, payload) {
	const body = JSON.stringify(payload);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": Buffer.byteLength(body)
	});
	res.end(body);
}

/**
* Resolve the workspace entity that currently owns a session, using the
* registry's canonical-cwd-filtered sessionIds view. A session whose path no
* longer canonicalizes to its workspace is unaccounted (lives in the
* Ungrouped bucket) — moving it into a folder is impossible by contract.
* @param ctx - cordis context (workspaceRegistry service).
* @param sessionId - session to look up.
* @returns the owning workspace entity, or undefined when unaccounted.
*/
function owningWorkspace(ctx, sessionId) {
	return ctx.workspaceRegistry.list().find((workspace) => workspace.sessionIds.includes(sessionId));
}

/** Cordis plug-in entry: open the domain, register the routes. */
function apply(ctx, config) {
	// Cordis re-runs apply before the previous fiber unloads, and the facility
	// keeps the name reserved until that handle closes. Take the stale handle
	// down first instead of failing fatal on 'already-open'. Closing is
	// idempotent, so the old fiber's own disposer may still run it again.
	const stale = ctx.storageDomain.get?.(foldersDomainSpec.name);
	return Promise.resolve(stale?.close()).then(() => ctx.storageDomain.open(foldersDomainSpec)).then((foldersDomain) => {
		const getFolders = () => foldersDomain.global.get().folders;
		/**
		* Persist a new folder record set. The domain's write chain guarantees
		* durability-first ordering per write; the in-process tail below
		* additionally serializes the read-modify-write of the shared global
		* record across routes, so two browsers cannot lose each other's write.
		*/
		/** Read the shared global record (inside the mutation lock only). */
		const readRecord = () => foldersDomain.global.get();
		/** Persist the record with every optional field defaulted. */
		const writeRecord = (record) => foldersDomain.global.set({
			folders: record.folders,
			workspaceOrder: record.workspaceOrder ?? [],
			pinnedLooseByWorkspace: record.pinnedLooseByWorkspace ?? {}
		});
		/** Serialize every folder mutation through one promise tail. */
		let mutationTail = Promise.resolve();
		const withMutationLock = (operation) => {
			const result = mutationTail.then(operation, operation);
			mutationTail = result.then(() => void 0, () => void 0);
			return result;
		};
		const ws = ctx.webServer;
		/** Serve one POST route: same-origin JSON in, JSON response out, uniform error shape. */
		const route = (path, handler) => {
			ws.register({
				kind: "exact",
				path: ROUTE_PREFIX + "/" + path,
				handler: async (req, res) => {
					if (req.method !== "POST") return respond(res, 405, { error: "method-not-allowed" });
					// CSRF hardening: JSON-only bodies, no cross-site fetches, and an
					// Origin/Host match when a browser sends Origin. Requests without
					// Origin (curl, scripts) stay allowed.
					const contentType = String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
					if (contentType !== "application/json") return respond(res, 400, { error: "bad-request" });
					if (req.headers["sec-fetch-site"] === "cross-site") return respond(res, 403, { error: "cross-origin-denied" });
					const origin = req.headers["origin"];
					if (typeof origin === "string" && origin.length > 0) {
						try {
							if (new URL(origin).host !== req.headers.host) return respond(res, 403, { error: "cross-origin-denied" });
						} catch {
							return respond(res, 403, { error: "cross-origin-denied" });
						}
					}
					try {
						const body = await readJsonBody(req);
						await handler(body, res);
					} catch (error) {
						if (error.clientError === true) {
							return respond(res, 400, { error: "bad-request" });
						}
						ctx.logger.warn("[dsh-session-folders] route failed:", error);
						respond(res, 500, { error: "internal-error" });
					}
				}
			});
		};

		route("list", async (body, res) => {
			const alive = new Set(ctx.workspaceRegistry.list().map((workspace) => workspace.id));
			const record = readRecord();
			respond(res, 200, {
				folders: record.folders.filter((folder) => alive.has(folder.workspaceId)),
				workspaceOrder: record.workspaceOrder ?? [],
				pinnedLoose: record.pinnedLooseByWorkspace ?? {}
			});
		});

		route("create", async (body, res) => {
			const workspaceId = body?.workspaceId;
			const folderName = parseFolderName(body);
			if (typeof workspaceId !== "string" || workspaceId.length === 0 || folderName === void 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			if (!ctx.workspaceRegistry.list().some((workspace) => workspace.id === workspaceId)) {
				return respond(res, 404, { error: "workspace-not-found" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				if (hasNameConflict(folders, workspaceId, folderName)) {
					return respond(res, 409, { error: "name-conflict" });
				}
				let id;
				do {
					id = randomUUID();
				} while (folders.some((folder) => folder.id === id));
				const maxIndex = folders
					.filter((folder) => folder.workspaceId === workspaceId)
					.reduce((max, folder) => Math.max(max, folder.sortIndex ?? 0), 0);
				const record = readRecord();
				await writeRecord({ ...record, folders: [...record.folders, { id, workspaceId, name: folderName, sessionIds: [], sortIndex: maxIndex + 1 }] });
				respond(res, 200, { id });
			});
		});

		route("rename", async (body, res) => {
			const folderId = body?.folderId;
			const folderName = parseFolderName(body);
			if (typeof folderId !== "string" || folderId.length === 0 || folderName === void 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				const folder = folders.find((candidate) => candidate.id === folderId);
				if (folder === void 0) return respond(res, 404, { error: "folder-not-found" });
				if (hasNameConflict(folders, folder.workspaceId, folderName, folderId)) {
					return respond(res, 409, { error: "name-conflict" });
				}
				const record = readRecord();
				await writeRecord({ ...record, folders: record.folders.map((candidate) =>
					candidate.id === folderId ? { ...candidate, name: folderName } : candidate
				) });
				respond(res, 200, { ok: true });
			});
		});

		route("delete", async (body, res) => {
			const folderId = body?.folderId;
			if (typeof folderId !== "string" || folderId.length === 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				if (!folders.some((folder) => folder.id === folderId)) {
					return respond(res, 404, { error: "folder-not-found" });
				}
				// Drop the record: its sessions become loose in that workspace.
				// Pins of the deleted folder die with it (loose again, unpinned).
				const record = readRecord();
				await writeRecord({ ...record, folders: record.folders.filter((folder) => folder.id !== folderId) });
				respond(res, 200, { ok: true });
			});
		});

		route("move", async (body, res) => {
			// Session ids are canonical in the "session-<uuid>" form: the
			// workspace registry keys sessions by the full prefixed id. Use the
			// id exactly as sent — any normalization would break membership.
			const sessionId = body?.sessionId;
			const folderId = body?.folderId;
			if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
				return respond(res, 400, { error: "bad-request" });
			}
			if (folderId !== null && (typeof folderId !== "string" || !FOLDER_ID_RE.test(folderId))) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const record = readRecord();
				// Pin state follows the session across a move: remember whether
				// it was pinned in its current location, strip it from every
				// pinned list, then restore it at the top of the target list.
				const owner = owningWorkspace(ctx, sessionId);
				const sessionWorkspaceId = owner?.id;
				const wasPinned = record.folders.some((folder) => (folder.pinnedSessionIds ?? []).includes(sessionId)) ||
					(sessionWorkspaceId !== void 0 && record.pinnedLooseByWorkspace[sessionWorkspaceId]?.includes(sessionId) === true);
				// The session is always removed from every folder first; the
				// inbox target (folderId null) is just that removal.
				const without = record.folders.map((folder) => ({
					...folder,
					sessionIds: folder.sessionIds.filter((id) => id !== sessionId),
					pinnedSessionIds: (folder.pinnedSessionIds ?? []).filter((id) => id !== sessionId)
				}));
				const pinnedLoose = Object.fromEntries(Object.entries(record.pinnedLooseByWorkspace ?? {}).map(([key, ids]) => [key, ids.filter((id) => id !== sessionId)]));
				if (folderId === null) {
					const nextLoose = wasPinned && sessionWorkspaceId !== void 0
						? { ...pinnedLoose, [sessionWorkspaceId]: [sessionId, ...(pinnedLoose[sessionWorkspaceId] ?? [])] }
						: pinnedLoose;
					await writeRecord({ ...record, folders: without, pinnedLooseByWorkspace: nextLoose });
					return respond(res, 200, { ok: true });
				}
				const target = without.find((folder) => folder.id === folderId);
				if (target === void 0) return respond(res, 404, { error: "folder-not-found" });
				// Cross-workspace moves are impossible: the target folder must
				// be the workspace that currently owns the session. A session
				// outside every workspace (canonical-cwd strays) can never
				// match any folder's workspace.
				if (owner === void 0 || owner.id !== target.workspaceId) {
					return respond(res, 409, { error: "session-not-in-workspace" });
				}
				await writeRecord({
					...record,
					folders: without.map((folder) =>
						folder.id === folderId
							? { ...folder, sessionIds: [sessionId, ...folder.sessionIds], pinnedSessionIds: wasPinned ? [sessionId, ...(folder.pinnedSessionIds ?? [])] : folder.pinnedSessionIds }
							: folder
					),
					pinnedLooseByWorkspace: pinnedLoose
				});
				respond(res, 200, { ok: true });
			});
		});

		route("reorder-folders", async (body, res) => {
			const workspaceId = body?.workspaceId;
			const orderedIds = body?.orderedIds;
			if (typeof workspaceId !== "string" || workspaceId.length === 0 || !Array.isArray(orderedIds)) {
				return respond(res, 400, { error: "bad-request" });
			}
			if (!orderedIds.every((id) => typeof id === "string" && id.length > 0)) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				if (!ctx.workspaceRegistry.list().some((workspace) => workspace.id === workspaceId)) {
					return respond(res, 404, { error: "workspace-not-found" });
				}
				// The client must submit exactly the workspace's folder id set:
				// no missing ids (would drop folders from the order), no extras,
				// no duplicates.
				const owned = folders.filter((folder) => folder.workspaceId === workspaceId);
				const ownedIds = new Set(owned.map((folder) => folder.id));
				if (!isExactIdSet(orderedIds, ownedIds)) {
					return respond(res, 400, { error: "bad-request" });
				}
				const indexOf = new Map(orderedIds.map((id, index) => [id, index]));
				const record = readRecord();
				await writeRecord({ ...record, folders: record.folders.map((folder) =>
					folder.workspaceId === workspaceId ? { ...folder, sortIndex: indexOf.get(folder.id) } : folder
				) });
				respond(res, 200, { ok: true });
			});
		});

		route("reorder-workspaces", async (body, res) => {
			const orderedIds = body?.orderedIds;
			if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === "string" && id.length > 0)) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				// The client must submit the full live workspace id set exactly.
				const live = ctx.workspaceRegistry.list().map((workspace) => workspace.id);
				const liveSet = new Set(live);
				if (!isExactIdSet(orderedIds, liveSet)) {
					return respond(res, 400, { error: "bad-request" });
				}
				const record = readRecord();
				await writeRecord({ ...record, workspaceOrder: orderedIds });
				respond(res, 200, { ok: true });
			});
		});

		route("pin", async (body, res) => {
			const sessionId = body?.sessionId;
			const pinned = body?.pinned;
			if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId) || typeof pinned !== "boolean") {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const record = readRecord();
				// A session in a folder pins inside that folder; a loose session
				// pins at the top of its workspace's loose bucket. Either case
				// is idempotent: re-pinning or unpinning a non-pinned session is
				// a no-op that still succeeds.
				const holder = record.folders.find((folder) => folder.sessionIds.includes(sessionId));
				if (holder !== void 0) {
					const current = holder.pinnedSessionIds ?? [];
					if (pinned && !current.includes(sessionId)) {
						await writeRecord({ ...record, folders: record.folders.map((folder) =>
							folder.id === holder.id ? { ...folder, pinnedSessionIds: [sessionId, ...current] } : folder
						) });
					} else if (!pinned && current.includes(sessionId)) {
						await writeRecord({ ...record, folders: record.folders.map((folder) =>
							folder.id === holder.id ? { ...folder, pinnedSessionIds: current.filter((id) => id !== sessionId) } : folder
						) });
					}
					return respond(res, 200, { ok: true });
				}
				// A session outside every workspace (Ungrouped) cannot be pinned.
				const owner = owningWorkspace(ctx, sessionId);
				if (owner === void 0) return respond(res, 409, { error: "session-not-in-workspace" });
				const current = (record.pinnedLooseByWorkspace ?? {})[owner.id] ?? [];
				if (pinned && !current.includes(sessionId)) {
					await writeRecord({ ...record, pinnedLooseByWorkspace: { ...record.pinnedLooseByWorkspace, [owner.id]: [sessionId, ...current] } });
				} else if (!pinned && current.includes(sessionId)) {
					await writeRecord({ ...record, pinnedLooseByWorkspace: { ...record.pinnedLooseByWorkspace, [owner.id]: current.filter((id) => id !== sessionId) } });
				}
				respond(res, 200, { ok: true });
			});
		});


		route("auto-rename", async (body, res) => {
			const sessionId = body?.sessionId;
			if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
				return respond(res, 400, { error: "bad-request" });
			}
			// One model stream per session at a time: a second concurrent
			// auto-rename would race the first on the pinned title.
			if (autoRenameInFlight.has(sessionId)) return respond(res, 409, { error: "auto-rename-in-progress" });
			autoRenameInFlight.add(sessionId);
			try {
				ctx.logger.info("[dsh-session-folders] auto-rename: entry", sessionId);
				const session = ctx.sessions?.get(sessionId) ?? null;
				if (session === null) {
					return respond(res, 409, { error: "session-not-live" });
				}
				// Delegate to the built-in session-title service which has a
				// working prompt and configuration (session-title-first-prompt-llm).
				const snapshot = await ctx.sessionTitle.refresh(session);
				if (snapshot === undefined) {
					return respond(res, 502, { error: "empty-title" });
				}
				// Pin as a user title so automatic updates don't overwrite it.
				ctx.sessionTitle.rename(session, snapshot.title);
				respond(res, 200, { title: snapshot.title });
			} catch (error) {
				respond(res, 502, { error: "auto-rename-failed", message: String(error?.message ?? error ?? "unknown") });
			} finally {
				autoRenameInFlight.delete(sessionId);
			}
		});

		route("session-path", async (body, res) => {
			const sessionId = body?.sessionId;
			if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
				return respond(res, 400, { error: "bad-request" });
			}
			// Live session: header is already in memory.
			const live = ctx.sessions?.get(sessionId) ?? null;
			const header = live !== null ? live.header : (await ctx.sessionPersistence.list()).find((h) => h.id === sessionId);
			if (header === undefined) {
				return respond(res, 404, { error: "session-not-found" });
			}
			const location = ctx.sessionPersistence.locate?.(header);
			if (location === undefined) {
				return respond(res, 404, { error: "path-not-found" });
			}
			respond(res, 200, { path: location.path });
		});

		route("unarchive", async (body, res) => {
			const sessionId = body?.sessionId;
			if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
				return respond(res, 400, { error: "bad-request" });
			}
			// The archive set is a registry-global record in the "workspace"
			// storage domain. There is no public unarchive API (dsh-session-
			// manager precedent): filter the id out of the durable record and
			// poke the registry's private state cache so the next
			// archiveSession() call sees the truth instead of idempotently
			// skipping on the stale set. The whole read-filter-write-poke runs
			// inside the registry's operation queue when available, so a
			// concurrent archive from another browser cannot lose our write;
			// without the queue this degrades to a direct write with a warning.
			const registry = ctx.workspaceRegistry;
			const enqueue = typeof registry?.enqueueOperation === "function"
				? (operation) => registry.enqueueOperation(operation)
				: (operation) => {
					ctx.logger.warn("[dsh-session-folders] unarchive: registry queue unavailable, direct write fallback");
					return operation();
				};
			await enqueue(async () => {
				const workspace = ctx.storageDomain.get("workspace");
				const state = workspace?.global.get();
				if (workspace === void 0 || !Array.isArray(state?.archivedSessionIds)) {
					return respond(res, 500, { error: "workspace-internals-changed" });
				}
				if (!state.archivedSessionIds.includes(sessionId)) return respond(res, 200, { ok: true });
				const next = {
					...state,
					archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
				};
				await workspace.global.set(next);
				if ("state" in registry) registry.state = next;
				respond(res, 200, { ok: true });
			});
		});

		route("open-folder", async (body, res) => {
			// Only registered workspace directories are openable: the path must
			// match a registry entity exactly, so the route cannot launch
			// arbitrary local paths.
			const path = body?.path;
			if (typeof path !== "string" || path.length === 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			if (!ctx.workspaceRegistry.list().some((workspace) => workspace.path === path)) {
				return respond(res, 404, { error: "workspace-not-found" });
			}
			const info = await stat(path).catch(() => null);
			if (info === null || !info.isDirectory()) {
				return respond(res, 404, { error: "workspace-not-found" });
			}
			// Explorer and xdg-open report success unreliably; answer once the
			// child exists instead of waiting for its exit code.
			const command = process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open";
			const child = spawn(command, [path], { detached: true, stdio: "ignore" });
			const spawnError = await new Promise((resolve) => {
				child.once("error", (error) => resolve(error));
				child.once("spawn", () => resolve(null));
				child.unref();
			});
			if (spawnError !== null) {
				ctx.logger.warn("[dsh-session-folders] open-folder spawn failed:", spawnError);
				return respond(res, 500, { error: "internal-error" });
			}
			respond(res, 200, { ok: true });
		});

		// Dispose the domain when the fiber unloading closes it; the routes die
		// with the webServer registrations (fiber-scoped), so no extra cleanup.
		try { registerTitleProvider(ctx, config); } catch (error) { ctx.logger?.warn?.("[dsh-session-folders] title provider registration failed:", error); }
		return () => foldersDomain.close();
	});
}


/* ===================== merged from dsh-session-title-gen (Node half) ===================== */


/**
 * Defaults are the single source of truth: the schema below restates them so a
 * missing settings service still runs the plugin on exactly these values.
 */
const DEFAULT_MODEL_ITEM = Object.freeze({
  id: '1',
  provider: 'deepseek-official',
  model: 'deepseek-flash',
  reasoningEffort: 'off',
})

const DEFAULTS = Object.freeze({
  enabled: true,
  models: [DEFAULT_MODEL_ITEM],
  provider: 'deepseek-official',
  model: 'deepseek-flash',
  /** 'off' = 显式关闭思考（默认）；'' = 跟随模型自身默认档位（不传该字段）。 */
  reasoningEffort: 'off',
  /**
   * 512 = 「关闭思考时绰绰有余」+「万一模型仍产生 reasoning 也留足余量」。
   *
   * 历史值 96 在 reasoningEffort=off 时实测只花 4–6 tokens，本身够用；但一旦
   * 档位被模型拒绝、回退到「跟随模型默认」（见 isEffortRejection 的丢档重试），
   * 96 极易被 reasoning 吃光 → finish=max-tokens 且 content 为空串 → 插件抛
   * `empty output from model` → 整条托底链全灭 → 宿主静默退回内置标题
   * （表现为「自动命名操作失败」）。512 是这一场景的安全余量。
   *
   * 仍不足时**不改代码**：错误文案会带出 finish=max-tokens 与当前 maxTokens
   * 数值，经 session-folders 的提示条原样透传给用户，由其调高本值或关闭思考。
   */
  maxTokens: 512,
  maxInputChars: 2000,
  timeoutMs: 30000,
  maxTitleLength: 80,
})

/** Settings schema served to the 会话标题 tab; ranges mirror its client-side validation. */
function buildSchema() {
  // 兼容：部分宿主 schemastery（如 3.18.1）无链式 .volatile()，有则用、无则原样返回。
  const vol = (schema) => (typeof schema.volatile === "function" ? schema.volatile() : schema);
  return schemastery.object({
    enabled: vol(schemastery.boolean().default(DEFAULTS.enabled)),
    models: vol(schemastery.array(schemastery.object({
      id: schemastery.string(),
      provider: schemastery.string(),
      model: schemastery.string(),
      reasoningEffort: schemastery.string().default("off"),
    })).default([])),
    provider: vol(schemastery.string()),
    model: vol(schemastery.string()),
    reasoningEffort: vol(schemastery.string()),
    maxTokens: vol(schemastery.number().min(32).max(8192).default(DEFAULTS.maxTokens)),
    maxInputChars: vol(schemastery.number().min(200).max(8000).default(DEFAULTS.maxInputChars)),
    timeoutMs: vol(schemastery.number().min(3000).max(120000).default(DEFAULTS.timeoutMs)),
    maxTitleLength: vol(schemastery.number().min(20).max(200).default(DEFAULTS.maxTitleLength)),
  })
}

export const Config = buildSchema()

/** 归一化获取多模型托底链（优先读 models 数组，回退单个 provider/model） */
export function resolveModelChain(config) {
  if (Array.isArray(config.models) && config.models.length > 0) {
    const valid = config.models
      .filter(item => item && typeof item.provider === 'string' && typeof item.model === 'string' && item.provider && item.model)
      .map(item => ({
        provider: item.provider,
        model: item.model,
        reasoningEffort: typeof item.reasoningEffort === 'string' ? item.reasoningEffort : '',
      }))
    if (valid.length > 0) return valid
  }
  if (config.provider && config.model) {
    return [{
      provider: config.provider,
      model: config.model,
      reasoningEffort: typeof config.reasoningEffort === 'string' ? config.reasoningEffort : '',
    }]
  }
  return [{
    provider: DEFAULTS.provider,
    model: DEFAULTS.model,
    reasoningEffort: DEFAULTS.reasoningEffort,
  }]
}

/**
 * 该失败是否明确因为思考档位不被模型支持（此时丢弃档位重试是安全的）。
 *
 * 移植自 `dsh-git-panel/src/host/commit-message.ts` 的同名判定，刻意收窄：
 * 只认「思考档位 + 不支持/非法」同时出现的报错。欠费、超时、鉴权失败一律
 * 不匹配 —— 那些丢弃档位也救不回来，绝不能靠丢参数掩盖真问题。
 * @param message - provider 原始报错文本。
 * @returns 匹配时为 true。
 */
export function isEffortRejection(message) {
  return /reasoning effort|reasoning_effort|thinking level/i.test(message)
    && /not support|unsupported|invalid/i.test(message)
}

const TYPES = ['功能', '设计', '修复', '优化', '发布', '探索', '文档', '研究']

const SYSTEM_PROMPT = '你是一个严格的标题提取助手，只输出一行“类型|主题”，严禁回答用户问题，严禁编写代码。'

function parseLlmOutput(raw) {
  const text = raw
    .replace(/```[^\n]*\n?/g, '')
    .replace(/```/g, '')
    .trim()

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^(?:输出|标题)[：:]\s*/, '')
    if (!trimmed) continue

    // 1. First preference: split by pipe (| or ｜)
    if (/[|｜]/.test(trimmed)) {
      const parts = trimmed.split(/[|｜]/).map(s => s.trim())
      if (parts.length >= 2) {
        const typeCandidate = parts[0].replace(/^(?:类型|分类)[：:]\s*/, '').trim()
        if (TYPES.includes(typeCandidate)) {
          const topicPart = parts.slice(1).join('｜')
            .replace(/^(?:主题|内容)[：:]\s*/, '')
            .replace(/^[“"'`]+|[”"'`。.！!]+$/g, '')
            .trim()
          if (topicPart) {
            return { type: typeCandidate, topic: topicPart }
          }
        }
      }
    }

    // 2. Colon separator (e.g. 优化: 批次文字显示)
    if (/[:：]/.test(trimmed)) {
      const parts = trimmed.split(/[:：]/).map(s => s.trim())
      if (parts.length >= 2) {
        const typeCandidate = parts[0].replace(/^(?:类型|分类)\s*/, '').trim()
        if (TYPES.includes(typeCandidate)) {
          const topicPart = parts.slice(1).join('：')
            .replace(/^(?:主题|内容)[：:]\s*/, '')
            .replace(/^[“"'`]+|[”"'`。.！!]+$/g, '')
            .trim()
          if (topicPart) {
            return { type: typeCandidate, topic: topicPart }
          }
        }
      }
    }

    // 3. Bracket / Space pattern (e.g. 【优化】批次文字显示)
    const match = trimmed.match(/^[【\[]?\s*(功能|设计|修复|优化|发布|探索|文档|研究)\s*[】\]\s\-—_]+\s*(.+)$/)
    if (match) {
      const topicPart = match[2]
        .replace(/^[“"'`]+|[”"'`。.！!]+$/g, '')
        .trim()
      if (topicPart) {
        return { type: match[1], topic: topicPart }
      }
    }
  }

  throw new Error(`dsh-session-title-gen: cannot parse title from "${raw}"`)
}

/** loader 交给 apply 的 Config 是 volatile 包装（取值要 `.get()`）；展开成普通对象。 */
function unwrapConfig(value) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    return unwrapConfig(value.get())
  }
  if (Array.isArray(value)) return value.map(unwrapConfig)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, unwrapConfig(child)]))
  }
  return value
}

function registerTitleProvider(ctx, config) {
  // 0.2.1 起宿主不再有 settings.register：配置由 loader 按本插件导出的 Config 解析后
  // 作为 apply 的第二参数给出（写面落在 profile 的 cordis.patch.yml 的 config 字段）。
  // ⚠️ volatile 字段是**稳定引用**：设置写入只改 ref 的值、不重跑 apply，所以每次取值
  // 都要重新 `.get()`。apply 时快照成普通对象会永远停在启动时的配置（2026-10-18 踩坑）。
  // 未配置的字段回退 DEFAULTS，headless 组合不服务设置页也照常工作。
  const currentConfig = () => ({ ...DEFAULTS, ...unwrapConfig(config) })

  // 设置页已自带自定义卡片：抑制宿主为同一 loader 条目自动生成的通用表单。
  ctx.inject?.(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })

  ctx.sessionTitle.register({
    id: 'dsh-session-title-gen', // 必填：未传会导致 validateProvider 抛错
    automatic: 'first-prompt',
    async generate(request) {
      const { createUserMessage, BlockAssembler } = await import("@deepseek-ai/dsh-llm");
      const { normalizeSessionTitle } = await import("@deepseek-ai/dsh-session-title");
      const { session, messages, signal: incoming } = request
      const first = messages[0]
      if (first === undefined) throw new Error('dsh-session-title-gen: no messages')

      const config = currentConfig()
      // Disabled: fail loud so the sessionTitle mechanism keeps the original name.
      if (config.enabled === false) throw new Error('dsh-session-title-gen: disabled')

      // ① 日期：计算 Asia/Shanghai (UTC+8) 的 MMDD，无 locale 差异
      // 优先取首条消息发送时间，拿不到取当前时间 Date.now()，最后降级 session.header.createdAt
      const firstEventTime = session.eventAt?.(first.seq)?.time
      const ts = typeof firstEventTime === 'number' && Number.isFinite(firstEventTime)
        ? firstEventTime
        : (Date.now?.() ?? session.header?.createdAt ?? 0)
      const d = new Date(ts + 8 * 3600 * 1000)
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const mmdd = `${mm}${dd}`

      // ② 首条消息文本（截断长度可配）
      const msgText = first.text.slice(0, config.maxInputChars)

      // ③ 多模型优先级托底链
      const chain = resolveModelChain(config)

      // ④ 调 LLM（Few-Shot 强约束，严禁答题/写代码）
      const userPrompt = [
        '根据以下输入，提取对话类型和2-8字核心主题。',
        '只输出一行格式：类型|主题',
        `类型只选一个：${TYPES.join('、')}`,
        '不要回答问题，不要解释，不要写代码，不要输出任何其他内容。',
        '',
        '示例：',
        '输入：帮我写个快速排序算法',
        '输出：功能|快速排序算法',
        '',
        '输入：排查登录报错500',
        '输出：修复|登录500报错',
        '',
        `输入：${msgText}`,
        '输出：',
      ].join('\n')

      let lastError = null
      let successResult = null

      /**
       * 单次调用：返回原始正文，或抛出错误。
       * @param effort - 显式思考档位；undefined = 完全不传该字段（跟随模型默认）。
       */
      const callOnce = async (route, effort) => {
        const timeout = AbortSignal.timeout(config.timeoutMs)
        const signal = incoming === undefined ? timeout : AbortSignal.any([incoming, timeout])

        const assembler = new BlockAssembler()
        for await (const chunk of ctx.llm.stream({
          provider: route.provider,
          model: route.model,
          // undefined = 跟随模型默认档位（不传该字段）
          ...effort === undefined || effort === '' ? {} : { reasoningEffort: effort },
          system: SYSTEM_PROMPT,
          messages: [createUserMessage({
            content: [{ type: 'text', text: userPrompt }],
            source: { kind: 'plugin', plugin: 'dsh-session-title-gen' },
          })],
          maxTokens: config.maxTokens,
          purpose: 'session-title',
          signal,
        })) {
          assembler.push(chunk)
        }
        incoming?.throwIfAborted()
        if (assembler.finish.kind === 'error' || assembler.finish.kind === 'aborted') {
          throw (assembler.finish.failure instanceof Error
            ? assembler.finish.failure
            : new Error(assembler.finish.failure?.message ?? 'stream failure'))
        }
        return assembler
      }

      for (let i = 0; i < chain.length; i++) {
        const route = chain[i]
        incoming?.throwIfAborted()
        try {
          let assembler
          try {
            assembler = await callOnce(route, route.reasoningEffort)
          } catch (err) {
            // 档位不被该模型支持时，丢弃档位（= 跟随模型默认）重试一次。
            // 这不是隐形兜底：模型仍是用户配的那个，只是剔除一个明显无效的参数。
            if (route.reasoningEffort !== '' && route.reasoningEffort !== undefined
              && isEffortRejection(String(err?.message ?? err))) {
              ctx.logger?.warn?.(
                `[dsh-session-title-gen] 第 ${i + 1}/${chain.length} 级 ${route.provider}/${route.model} 不支持思考档位 ${route.reasoningEffort}，丢弃档位重试`,
              )
              assembler = await callOnce(route, undefined)
            } else {
              throw err
            }
          }

          // 提取 LLM 输出并解析
          const raw = assembler.blocks()
            .filter(b => b.type === 'text')
            .map(b => b.text).join(' ')
            .trim()
          if (!raw) {
            // 空正文最常见的原因是「输出预算被推理吃光」：此时宿主 finish 为
            // {kind:'max-tokens'} 且没有任何正文块。把这个信号带进错误里，否则
            // 只会看到无信息量的 empty output，排查时完全看不出是预算问题。
            const finishKind = assembler.finish?.kind
            const hint = finishKind === 'max-tokens'
              ? `（finish=max-tokens：maxTokens=${config.maxTokens} 被推理耗尽、正文为空。请到「设置 → 会话标题与git提交」把最大输出 Tokens 调高，或把思考档位设为 off）`
              : (finishKind === undefined ? '' : `（finish=${finishKind}，正文为空）`)
            throw new Error(`empty output from model${hint}`)
          }

          let type, topic
          try {
            const parsed = parseLlmOutput(raw)
            type = parsed.type
            topic = parsed.topic
          } catch (err) {
            ctx.logger?.warn?.('[dsh-session-title-gen] parse failed for raw output:', raw, err)
            type = '探索'
            topic = raw.replace(/^[“"'`]+|[”"'`。.！!]+$/g, '').slice(0, 10).trim() || msgText.slice(0, 8)
          }

          // 组装最终标题：全角统一 MMDD｜类型｜主题
          const finalTitle = `${mmdd}｜${type}｜${topic}`

          // 安全清洗与截断（长度可配）
          const title = normalizeSessionTitle(finalTitle, config.maxTitleLength)
          if (title.length === 0) throw new Error('dsh-session-title-gen: empty after normalize')

          successResult = {
            title,
            messageSeqs: [first.seq],
            model: route,
          }
          if (i > 0) {
            // 成功但发生过降级：明确记下最终用的是哪一级，便于排查
            ctx.logger?.info?.(`[dsh-session-title-gen] 第 ${i + 1}/${chain.length} 级成功：${route.provider}/${route.model}`)
          }
          break // 某级成功即退出托底链
        } catch (err) {
          lastError = err
          // 会话命名是后台静默行为，没有前端流式通道，因此把降级过程落到日志：
          // 明确指出「哪个模型失败 → 正改用哪一个」，否则只会表现为莫名变慢。
          const next = i + 1 < chain.length ? chain[i + 1] : undefined
          const nextLabel = next !== undefined ? ` → 正改用 ${next.provider}/${next.model}` : '（已无后备模型）'
          ctx.logger?.warn?.(
            `[dsh-session-title-gen] 第 ${i + 1}/${chain.length} 级模型 ${route.provider}/${route.model} 报错：${err?.message ?? err}${nextLabel}`,
          )
        }
      }

      if (!successResult) {
        throw (lastError ?? new Error('all fallback models failed'))
      }

      return successResult
    },
  })
}


export { apply, inject, name, parseLlmOutput };
