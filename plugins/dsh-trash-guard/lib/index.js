import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
//#region src/index.ts
/**
* dsh-trash-guard — 删除守卫。
*
* DSH 的 ctx.fs 契约里没有删除原语，删除只可能发生在 shell 命令里
* （rm / Remove-Item / del / rmdir / rd）。本插件在 tools/pre-execute
* 钩子上检查 bash 与 pwsh 的 command 字符串：命中显式删除就拒绝，并引导
* 模型改用 trash_move，把文件移进全局回收站而不是硬删。
*
* 回收站落在 D 盘，按项目分子目录，7 天后由定时器自动过期清理。
* 显式拒绝、不做命令改写：复合命令（rm -rf x && npm run build）改写的语义
* 无法保证，宁可多一轮往返。
*/
/**
* 本地最小 defineTool：只把参数 DSL 折成 JSON Schema 并原样回传定义。
* 不 import @deepseek-ai/dsh-tools，这样插件零运行时依赖——profile 的
* node_modules 里没有 @deepseek-ai/*，直接 import 会 ERR_MODULE_NOT_FOUND。
*/
function defineTool(options) {
	const properties = {};
	const required = [];
	for (const [key, node] of Object.entries(options.parameters)) {
		const { required: isRequired, ...schema } = node;
		properties[key] = schema.type === "json" ? {} : schema;
		if (isRequired === true) required.push(key);
	}
	const parameters = {
		type: "object",
		properties
	};
	if (required.length > 0) parameters.required = required;
	const outputSchema = options.output.schema;
	return {
		...options,
		parameters,
		output: {
			...options.output,
			schema: outputSchema?.type === "json" ? {} : outputSchema
		}
	};
}
/** D 盘上的回收站根目录；可用 config.trashRoot 覆盖。 */
const DEFAULT_TRASH_ROOT = "D:\\dsh-trash";
/** 默认保留天数。 */
const DEFAULT_RETENTION_DAYS = 7;
/** 默认容量上限：50 GiB。 */
const DEFAULT_MAX_BYTES = 50 * 1024 ** 3;
/**
* 从 shell 命令里找出显式删除。只做词法判断，覆盖绝大多数写法；有意不处理
* 变量展开与子 shell 求值，那类写法由模型自觉遵守系统提示词。
* @param command - 交给 bash / pwsh 的原始命令字符串。
* @returns 命中的第一条删除片段；没有命中返回 undefined。
*/
function findExplicitDelete(command) {
	const stripped = command.replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\s*\1/g, " ").replace(/(^|\s)#[^\n]*/g, " ");
	for (const re of [
		/(^|[;&|\n]{1,2}|\(|\{)\s*(rm|unlink|srm)\s+[^;&|)\n]*/i,
		/(^|[;&|\n]{1,2}|\(|\{)\s*(del|erase|rd|rmdir)\s+[^;&|)\n]*/i,
		/\b(remove-item)\b\s+[^;&|)\n]*/i,
		/\bfind\b[^;&|\n]*?\s-(delete|exec\s+rm)\b/i,
		/\bgit\s+clean\b[^;&|\n]*\s-[a-z]*[dfx][a-z]*/i,
		/\b(os\.remove|os\.unlink|os\.rmdir|shutil\.rmtree|fs\.rm|fs\.rmSync|fs\.unlink|fs\.unlinkSync|fs\.rmdir|Deno\.remove)\b/i
	]) {
		const m = re.exec(stripped);
		if (m !== null) return m[0].trim().slice(0, 200);
	}
}
/** 递归统计路径字节数；无权限的子树按 0 计。 */
function sizeOf(path) {
	let st;
	try {
		st = statSync(path);
	} catch {
		return 0;
	}
	if (!st.isDirectory()) return st.size;
	let total = 0;
	let children = [];
	try {
		children = readdirSync(path);
	} catch {
		return 0;
	}
	for (const child of children) total += sizeOf(join(path, child));
	return total;
}
/** 把 cwd 折成一个可用作目录名的项目 slug。 */
function projectSlug(cwd) {
	const slug = cwd.replace(/^[A-Za-z]:[\\/]?/, "").replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "");
	return slug.length > 0 ? slug : "_no-project";
}
/** 通配符转正则，只支持 * 与 ?。 */
function globToRegExp(pattern) {
	const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
	return new RegExp("^" + escaped + "$");
}
function apply(ctx, config) {
	const cfg = {
		trashRoot: config?.trashRoot ?? process.env.DSH_TRASH_ROOT ?? DEFAULT_TRASH_ROOT,
		retentionDays: config?.retentionDays ?? DEFAULT_RETENTION_DAYS,
		maxBytes: config?.maxBytes ?? DEFAULT_MAX_BYTES,
		checkIntervalMinutes: config?.checkIntervalMinutes ?? 60,
		blockShellDelete: config?.blockShellDelete ?? true
	};
	const indexPath = join(cfg.trashRoot, "index.json");
	/** 读索引；损坏时按空索引继续，绝不因为索引坏了挡住正常删除。 */
	function readIndex() {
		try {
			const parsed = JSON.parse(readFileSync(indexPath, "utf8"));
			if (Array.isArray(parsed?.entries)) return parsed;
		} catch {}
		return { entries: [] };
	}
	function writeIndex(index) {
		mkdirSync(cfg.trashRoot, { recursive: true });
		writeFileSync(indexPath, JSON.stringify(index, null, 1), "utf8");
	}
	/** 把路径移进回收站并返回逐条结果。 */
	function moveToTrash(paths, options) {
		const index = readIndex();
		const project = projectSlug(options.cwd);
		const projectDir = join(cfg.trashRoot, project);
		const results = [];
		const used = index.entries.reduce((sum, entry) => sum + entry.bytes, 0);
		let incoming = 0;
		for (const target of paths) {
			const absolute = isAbsolute(target) ? target : resolve(options.cwd, target);
			let st;
			try {
				st = statSync(absolute);
			} catch {
				results.push({
					path: absolute,
					ok: false,
					reason: "路径不存在"
				});
				continue;
			}
			if (st.isDirectory() && !options.recursive) {
				results.push({
					path: absolute,
					ok: false,
					reason: "目录需要 recursive: true"
				});
				continue;
			}
			const bytes = sizeOf(absolute);
			if (used + incoming + bytes > cfg.maxBytes) {
				results.push({
					path: absolute,
					ok: false,
					reason: "回收站已达容量上限，先用 trash_purge 清理"
				});
				continue;
			}
			const id = randomUUID().slice(0, 8);
			const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:T]/g, "").slice(0, 14);
			const stored = join(projectDir, stamp + "__" + id + "__" + basename(absolute));
			try {
				mkdirSync(dirname(stored), { recursive: true });
				try {
					renameSync(absolute, stored);
				} catch {
					cpSync(absolute, stored, { recursive: true });
					rmSync(absolute, {
						recursive: true,
						force: true
					});
				}
				index.entries.push({
					id,
					originalPath: absolute,
					storedPath: stored,
					deletedAt: Date.now(),
					bytes,
					project,
					sessionId: options.sessionId,
					isDirectory: st.isDirectory()
				});
				incoming += bytes;
				results.push({
					path: absolute,
					ok: true,
					id
				});
			} catch (error) {
				results.push({
					path: absolute,
					ok: false,
					reason: "移动失败: " + error.message
				});
			}
		}
		writeIndex(index);
		return results;
	}
	/** 删掉超过保留期的条目。 */
	function sweepExpired() {
		const index = readIndex();
		const cutoff = Date.now() - cfg.retentionDays * 24 * 3600 * 1e3;
		let removed = 0;
		let bytes = 0;
		const kept = [];
		for (const entry of index.entries) if (entry.deletedAt <= cutoff) {
			try {
				rmSync(entry.storedPath, {
					recursive: true,
					force: true
				});
			} catch {}
			removed += 1;
			bytes += entry.bytes;
		} else kept.push(entry);
		if (removed > 0) writeIndex({ entries: kept });
		return {
			removed,
			bytes
		};
	}
	if (cfg.blockShellDelete) ctx.on("tools/pre-execute", (exec, next) => {
		const name = exec?.name;
		if (name !== "bash" && name !== "pwsh") return next();
		const command = exec?.arguments?.command;
		if (typeof command !== "string" || command.length === 0) return next();
		if (command.includes("DSH_FORCE_DELETE")) return next();
		const hit = findExplicitDelete(command);
		if (hit === void 0) return next();
		String.fromCharCode(36) + "";
		return Promise.resolve({
			kind: "deny",
			reason: [
				"[trash-guard] 拦截删除命令：" + hit,
				"删除在 DSH 里必须先移进回收站（" + cfg.trashRoot + "），保留 " + cfg.retentionDays + " 天后自动清除。",
				"改用 trash_move 工具：",
				"  - 文件：trash_move({ paths: [\"相对或绝对路径\"] })",
				"  - 目录：trash_move({ paths: [\"dir\"], recursive: true })",
				"确需永久删除：bash 前加 DSH_FORCE_DELETE=1，pwsh 前加 $env:DSH_FORCE_DELETE=1;"
			].join("\n")
		});
	});
	ctx.inject(["tools"], (scope) => {
		ctx.tools.register(defineTool({
			name: "trash_move",
			description: "把文件或目录移进回收站（可恢复）。DSH 里的删除一律走这里，7 天内可用 trash_restore 还原。",
			parameters: {
				paths: {
					type: "array",
					items: { type: "string" },
					required: true,
					description: "要移入回收站的路径，相对路径以会话 cwd 为基准"
				},
				recursive: {
					type: "boolean",
					description: "目录必须显式传 true"
				}
			},
			output: {
				schema: { type: "object" },
				render: (_args, value) => [{
					type: "text",
					text: JSON.stringify(value, null, 1)
				}]
			},
			execute(args, exec) {
				const cwd = typeof exec?.agent?.cwd === "string" ? exec.agent.cwd : process.cwd();
				return {
					results: moveToTrash(args.paths, {
						cwd,
						recursive: args.recursive === true,
						sessionId: typeof exec?.agent?.id === "string" ? exec.agent.id : void 0
					}),
					trashRoot: cfg.trashRoot,
					retentionDays: cfg.retentionDays
				};
			}
		}));
		ctx.tools.register(defineTool({
			name: "trash_list",
			description: "列出回收站里的条目，可按通配符过滤。",
			parameters: {
				pattern: {
					type: "string",
					description: "如 *.tmp，省略表示全部"
				},
				limit: {
					type: "number",
					description: "最多返回条数，默认 50"
				}
			},
			output: {
				schema: { type: "object" },
				render: (_args, value) => [{
					type: "text",
					text: JSON.stringify(value, null, 1)
				}]
			},
			execute(args) {
				const index = readIndex();
				const matcher = typeof args.pattern === "string" ? globToRegExp(args.pattern) : void 0;
				const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 50;
				return {
					entries: index.entries.filter((entry) => matcher === void 0 || matcher.test(basename(entry.originalPath))).sort((a, b) => b.deletedAt - a.deletedAt).slice(0, limit).map((entry) => ({
						id: entry.id,
						originalPath: entry.originalPath,
						deletedAt: new Date(entry.deletedAt).toISOString(),
						expiresInHours: Math.max(0, Math.round((entry.deletedAt + cfg.retentionDays * 864e5 - Date.now()) / 36e5)),
						bytes: entry.bytes,
						project: entry.project
					})),
					total: index.entries.length,
					trashRoot: cfg.trashRoot
				};
			}
		}));
		ctx.tools.register(defineTool({
			name: "trash_restore",
			description: "把回收站里的条目还原回原路径。",
			parameters: {
				ids: {
					type: "array",
					items: { type: "string" },
					description: "条目 id 列表"
				},
				pattern: {
					type: "string",
					description: "按通配符批量还原"
				},
				onConflict: {
					type: "string",
					description: "rename（默认）/ skip / overwrite"
				}
			},
			output: {
				schema: { type: "object" },
				render: (_args, value) => [{
					type: "text",
					text: JSON.stringify(value, null, 1)
				}]
			},
			execute(args) {
				const index = readIndex();
				const onConflict = typeof args.onConflict === "string" ? args.onConflict : "rename";
				const ids = Array.isArray(args.ids) ? args.ids : void 0;
				const matcher = typeof args.pattern === "string" ? globToRegExp(args.pattern) : void 0;
				const results = [];
				const remaining = [];
				for (const entry of index.entries) {
					if (!(ids !== void 0 && ids.includes(entry.id) || matcher !== void 0 && matcher.test(basename(entry.originalPath)))) {
						remaining.push(entry);
						continue;
					}
					let target = entry.originalPath;
					try {
						let exists = false;
						try {
							statSync(target);
							exists = true;
						} catch {}
						if (exists) {
							if (onConflict === "skip") {
								results.push({
									id: entry.id,
									path: target,
									ok: false,
									reason: "目标已存在，跳过"
								});
								remaining.push(entry);
								continue;
							}
							if (onConflict === "rename") {
								const base = target.replace(/(\.[^.\\/]+)?$/, "");
								const ext = target.slice(base.length);
								let n = 1;
								for (;;) {
									const candidate = base + ".restored-" + n + ext;
									let taken = false;
									try {
										statSync(candidate);
										taken = true;
									} catch {}
									if (!taken) {
										target = candidate;
										break;
									}
									n += 1;
								}
							} else rmSync(target, {
								recursive: true,
								force: true
							});
						}
						mkdirSync(dirname(target), { recursive: true });
						try {
							renameSync(entry.storedPath, target);
						} catch {
							cpSync(entry.storedPath, target, { recursive: true });
							rmSync(entry.storedPath, {
								recursive: true,
								force: true
							});
						}
						results.push({
							id: entry.id,
							path: target,
							ok: true
						});
					} catch (error) {
						results.push({
							id: entry.id,
							path: target,
							ok: false,
							reason: error.message
						});
						remaining.push(entry);
					}
				}
				writeIndex({ entries: remaining });
				return {
					results,
					restored: results.filter((item) => item.ok).length
				};
			}
		}));
		ctx.tools.register(defineTool({
			name: "trash_purge",
			description: "永久删除回收站条目（不可恢复）。",
			parameters: {
				ids: {
					type: "array",
					items: { type: "string" },
					description: "条目 id 列表"
				},
				all: {
					type: "boolean",
					description: "清空整个回收站"
				}
			},
			output: {
				schema: { type: "object" },
				render: (_args, value) => [{
					type: "text",
					text: JSON.stringify(value, null, 1)
				}]
			},
			execute(args) {
				const index = readIndex();
				const ids = Array.isArray(args.ids) ? args.ids : void 0;
				const purgeAll = args.all === true;
				let removed = 0;
				let bytes = 0;
				const remaining = index.entries.filter((entry) => {
					if (!purgeAll && !(ids !== void 0 && ids.includes(entry.id))) return true;
					try {
						rmSync(entry.storedPath, {
							recursive: true,
							force: true
						});
					} catch {}
					removed += 1;
					bytes += entry.bytes;
					return false;
				});
				writeIndex({ entries: remaining });
				return {
					removed,
					bytes,
					remaining: remaining.length
				};
			}
		}));
	});
	try {
		sweepExpired();
	} catch {}
	const timer = setInterval(() => {
		try {
			sweepExpired();
		} catch {}
	}, cfg.checkIntervalMinutes * 60 * 1e3);
	timer.unref?.();
	ctx.effect(() => () => clearInterval(timer));
	ctx.inject(["systemPrompt"], (scope) => {
		scope.systemPrompt.section({
			name: "trash-guard",
			order: 1950,
			text: [
				"删除文件或目录时不要用 rm / Remove-Item / del，改用 trash_move 工具：",
				"它们会被移进回收站，7 天内可以用 trash_restore 还原，到期自动清除。",
				"查回收站用 trash_list，确需永久删除用 trash_purge。"
			].join("\n")
		});
	});
}
//#endregion
export { apply, findExplicitDelete };
