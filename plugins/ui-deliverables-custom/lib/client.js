window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-deliverables-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region E:/vibeCoding/deepseek-harness/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-deliverables-custom\src\client\DiffBlock.module.css.mjs
		const css$2 = ".IuSoiG_block{--dsl-diff-radius:12px;--dsl-diff-line-height:22px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-markdown-code-block);border-radius:var(--dsl-diff-radius);margin:16px 0;position:relative}.IuSoiG_copyButton{z-index:1;color:var(--dsw-alias-label-secondary);cursor:pointer;font:var(--dsw-font-xs-13);background-color:#0000;border:none;margin:0;padding:0;position:absolute;top:8px;right:12px}.IuSoiG_body{font:var(--dsw-font-markdown-code-block);padding:12px 14px;overflow:auto hidden}.IuSoiG_line{min-height:var(--dsl-diff-line-height);white-space:pre}.IuSoiG_path{color:var(--dsw-alias-label-primary);padding-right:56px;font-weight:600}.IuSoiG_gap{color:var(--dsw-alias-label-tertiary)}.IuSoiG_del:before{content:\"- \";color:var(--dsw-alias-state-error-primary)}.IuSoiG_del{color:var(--dsw-alias-state-error-primary)}.IuSoiG_add:before{content:\"+ \";color:var(--dsw-alias-state-success-primary)}.IuSoiG_add{color:var(--dsw-alias-state-success-primary)}.IuSoiG_expand{width:100%;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;text-align:left;background-color:#0000;border:none;padding:0;display:block}.IuSoiG_expand:hover{color:var(--dsw-alias-label-secondary)}.IuSoiG_footer{font:var(--dsw-font-markdown-code-block);color:var(--dsw-alias-label-tertiary);padding:0 14px 12px}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-deliverables-custom/DiffBlock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-deliverables-custom";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var DiffBlock_module_css_default = {
			"add": "IuSoiG_add",
			"block": "IuSoiG_block",
			"body": "IuSoiG_body",
			"copyButton": "IuSoiG_copyButton",
			"del": "IuSoiG_del",
			"expand": "IuSoiG_expand",
			"footer": "IuSoiG_footer",
			"gap": "IuSoiG_gap",
			"line": "IuSoiG_line",
			"path": "IuSoiG_path"
		};
		/** Local exhaustiveness helper — this package does not depend on `dsh-llm`. */
		/* v8 ignore next 3 -- closed-union backstop; only reached if a row kind is forged */
		function assertNever(value) {
			throw new Error(`unreachable diff row kind: ${String(value)}`);
		}
		/** The dim class per row kind (path/gap chrome vs the diff's own +/- colors). */
		const ROW_CLASS = {
			path: DiffBlock_module_css_default.path,
			del: DiffBlock_module_css_default.del,
			add: DiffBlock_module_css_default.add,
			gap: DiffBlock_module_css_default.gap
		};
		/**
		* Flatten the hunks into the body's rows plus the footer counts. A path header
		* opens each new file; a same-file second hunk (a scattered edit) opens with a
		* `⋯` gap instead of repeating the path. In headerless mode (ChangePanel),
		* same-file second hunks also separate with a `⋯` gap so non-adjacent edits
		* never appear contiguous. Each hunk's sides compare through {@link diffLines},
		* which interleaves -/+ at change sites and inserts `⋯` gaps across untouched lines.
		* @param diffs - the hunks to render.
		* @param showPathHeaders - whether path and gap rows join the body.
		* @returns the body rows, the +/- totals, and the distinct-file count.
		*/
		function buildRows(diffs, showPathHeaders) {
			const rows = [];
			const paths = /* @__PURE__ */ new Set();
			let added = 0;
			let removed = 0;
			let prevPath;
			for (let i = 0; i < diffs.length; i++) {
				const diff = diffs[i];
				paths.add(diff.path);
				if (showPathHeaders) {
					if (diff.path !== prevPath) rows.push({
						kind: "path",
						text: diff.path
					});
					else if (rows.length > 0 && rows[rows.length - 1]?.kind !== "gap") rows.push({
						kind: "gap",
						text: "⋯"
					});
				} else if (i > 0 && rows.length > 0 && rows[rows.length - 1]?.kind !== "gap") rows.push({
					kind: "gap",
					text: "⋯"
				});
				prevPath = diff.path;
				const change = diffLines(diff.oldText, diff.newText);
				for (const row of change.rows) {
					if (row.kind === "gap" && rows.length > 0 && rows[rows.length - 1]?.kind === "gap") continue;
					rows.push(row);
				}
				added += change.added.length;
				removed += change.removed.length;
			}
			while (rows.length > 0 && rows[rows.length - 1]?.kind === "gap") rows.pop();
			return {
				rows,
				added,
				removed,
				files: paths.size
			};
		}
		/**
		* Normalize a line for similarity matching: strip trailing punctuation (comma, semicolon)
		* and trailing whitespace, keeping context lines from falsely reporting as additions/deletions.
		*/
		function normalizeLine(line) {
			const stripped = line.trimEnd().replace(/[,;]+$/, "").trimEnd();
			return stripped === "" ? line.trim() : stripped;
		}
		function matchWeight(a, b, allowNormalized) {
			if (a === b) return 2;
			if (allowNormalized) {
				const na = normalizeLine(a);
				const nb = normalizeLine(b);
				if (na !== "" && na === nb) return 1;
			}
			return 0;
		}
		function computeLcsDiff(oldMid, newMid, allowNormalized) {
			const m = oldMid.length;
			const n = newMid.length;
			if (m * n > 25e4) {
				const rows = [...oldMid.map((text) => ({
					kind: "del",
					text
				})), ...newMid.map((text) => ({
					kind: "add",
					text
				}))];
				return {
					removed: [...oldMid],
					added: [...newMid],
					rows
				};
			}
			const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
			for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
				const w = matchWeight(oldMid[i - 1], newMid[j - 1], allowNormalized);
				if (w > 0) dp[i][j] = dp[i - 1][j - 1] + w;
				else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
			const ops = [];
			let i = m;
			let j = n;
			while (i > 0 || j > 0) {
				if (i > 0 && j > 0) {
					const w = matchWeight(oldMid[i - 1], newMid[j - 1], allowNormalized);
					if (w > 0 && dp[i][j] === dp[i - 1][j - 1] + w) {
						ops.unshift({
							type: "match",
							oldText: oldMid[i - 1],
							newText: newMid[j - 1]
						});
						i--;
						j--;
						continue;
					}
				}
				if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
					ops.unshift({
						type: "add",
						text: newMid[j - 1]
					});
					j--;
				} else if (i > 0) {
					ops.unshift({
						type: "del",
						text: oldMid[i - 1]
					});
					i--;
				}
			}
			const rows = [];
			const removed = [];
			const added = [];
			let currentBlockDel = [];
			let currentBlockAdd = [];
			const flushBlock = () => {
				if (currentBlockDel.length === 0 && currentBlockAdd.length === 0) return;
				if (rows.length > 0 && rows[rows.length - 1]?.kind !== "gap") rows.push({
					kind: "gap",
					text: "⋯"
				});
				for (const text of currentBlockDel) {
					rows.push({
						kind: "del",
						text
					});
					removed.push(text);
				}
				for (const text of currentBlockAdd) {
					rows.push({
						kind: "add",
						text
					});
					added.push(text);
				}
				currentBlockDel = [];
				currentBlockAdd = [];
			};
			for (const op of ops) if (op.type === "match") flushBlock();
			else if (op.type === "del") currentBlockDel.push(op.text);
			else if (op.type === "add") currentBlockAdd.push(op.text);
			flushBlock();
			return {
				removed,
				added,
				rows
			};
		}
		/**
		* Pair the two sides of one hunk into its changed lines: common-prefix and
		* common-suffix trim over the content lines, followed by LCS alignment over
		* the middle. Tolerates trailing punctuation / comma shifts on boundary context
		* lines to eliminate phantom deletion/re-addition pairs. Disjoint change sites
		* interleave del/add blocks separated by `⋯` gaps. Identical sides yield zero
		* rows — a no-op write draws nothing for its hunk. `null` oldText (a new file)
		* puts every new line on the added side.
		* @param oldText - prior content, or `null` for a new file.
		* @param newText - content after the change.
		* @returns the removed and added content lines along with the structured rows.
		*/
		function diffLines(oldText, newText) {
			if (oldText === null) {
				const added = contentLines(newText);
				return {
					removed: [],
					added,
					rows: added.map((text) => ({
						kind: "add",
						text
					}))
				};
			}
			const oldSide = contentLines(oldText);
			const newSide = contentLines(newText);
			let start = 0;
			const shortest = Math.min(oldSide.length, newSide.length);
			while (start < shortest && oldSide[start] === newSide[start]) start++;
			let endOld = oldSide.length;
			let endNew = newSide.length;
			while (endOld > start && endNew > start && oldSide[endOld - 1] === newSide[endNew - 1]) {
				endOld--;
				endNew--;
			}
			const oldMid = oldSide.slice(start, endOld);
			const newMid = newSide.slice(start, endNew);
			if (oldMid.length === 0 && newMid.length === 0) return {
				removed: [],
				added: [],
				rows: []
			};
			if (oldMid.length === 0) {
				const added = newMid;
				return {
					removed: [],
					added,
					rows: added.map((text) => ({
						kind: "add",
						text
					}))
				};
			}
			if (newMid.length === 0) {
				const removed = oldMid;
				return {
					removed,
					added: [],
					rows: removed.map((text) => ({
						kind: "del",
						text
					}))
				};
			}
			const result = computeLcsDiff(oldMid, newMid, true);
			if (result.removed.length === 0 && result.added.length === 0 && (oldMid.length > 0 || newMid.length > 0)) return computeLcsDiff(oldMid, newMid, false);
			return result;
		}
		/**
		* Split a side's text into its content lines. Empty text is zero lines (a full
		* deletion's `newText` or a create's absent `oldText` side draws nothing), and a
		* single trailing newline is a line terminator rather than an extra empty line —
		* the same terminator rule TerminalBlock applies to command output. An interior
		* blank line (a genuine `\n\n`) survives.
		* @param text - the removed or added side's text.
		* @returns the content lines, without the terminating newline.
		*/
		function contentLines(text) {
			if (text === "") return [];
			return (text.endsWith("\n") ? text.slice(0, -1) : text).split("\n");
		}
		/**
		* The diff text a reader copies: each row's `-`/`+`/path/gap prefix and its
		* content, exactly what the card shows. The removed and added blocks are the
		* change; the path headers keep a multi-file copy attributable.
		* @param rows - the flattened body rows.
		* @returns the diff as plain text.
		*/
		function copyText(rows) {
			return rows.map((row) => {
				switch (row.kind) {
					case "del": return `- ${row.text}`;
					case "add": return `+ ${row.text}`;
					case "path": return row.text;
					case "gap": return row.text;
					/* v8 ignore next -- closed-union backstop; only reached if a row kind is forged */
					default: return assertNever(row.kind);
				}
			}).join("\n");
		}
		/**
		* Render a file mutation as an inline diff surface.
		* @param props - see {@link DiffBlockProps}.
		* @returns the diff block element.
		*/
		function DiffBlock({ diffs, maxLines = 16, className, showPathHeaders = true, showFooter = true }) {
			const { rows, added, removed, files } = (0, react.useMemo)(() => buildRows(diffs, showPathHeaders), [diffs, showPathHeaders]);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [copied, setCopied] = (0, react.useState)(false);
			const onCopy = (0, react.useCallback)(() => {
				if (copied) return;
				(0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(copyText(rows)).then((ok) => {
					if (!ok) return;
					setCopied(true);
					window.setTimeout(() => {
						setCopied(false);
					}, 1e3);
				});
			}, [copied, rows]);
			const onToggle = (0, react.useCallback)(() => {
				setExpanded((value) => !value);
			}, []);
			if (rows.length === 0) return null;
			const hidden = rows.length - maxLines;
			const capped = hidden > 0 && !expanded;
			const headLines = Math.ceil(maxLines / 2);
			const tailLines = maxLines - headLines;
			const head = capped ? rows.slice(0, headLines) : rows;
			const tail = capped ? rows.slice(rows.length - tailLines) : [];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(DiffBlock_module_css_default.block, className),
				"data-diff": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: DiffBlock_module_css_default.copyButton,
						onClick: onCopy,
						children: copied ? "复制成功" : "复制"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: DiffBlock_module_css_default.body,
						children: [
							head.map((row, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: clsx(DiffBlock_module_css_default.line, ROW_CLASS[row.kind]),
								children: row.text
							}, index)),
							hidden > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: DiffBlock_module_css_default.expand,
								"aria-expanded": expanded,
								"aria-label": expanded ? "收起差异" : `展开其余 ${hidden} 行差异`,
								onClick: onToggle,
								children: expanded ? "收起" : `… 其余 ${hidden} 行`
							}),
							tail.map((row, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: clsx(DiffBlock_module_css_default.line, ROW_CLASS[row.kind]),
								children: row.text
							}, index))
						]
					}),
					showFooter && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: DiffBlock_module_css_default.footer,
						children: [
							"└ +",
							added,
							" -",
							removed,
							" · ",
							files,
							" file",
							files === 1 ? "" : "s"
						]
					})
				]
			});
		}
		//#endregion
		//#region ../../node_modules/@deepseek-ai/dsh-session/lib/types/surface.js
		/** Runtime counterpart of the message-producing event union. */
		const SURFACE_EVENT_TYPES = new Set([
			"user/message",
			"assistant/message",
			"tool/result"
		]);
		/**
		* Narrow an event to a surface-eligible event carrying its required marker.
		* @param event - event to test.
		* @returns true when both the type and marker identify a surface event.
		*/
		function isSurfaceEvent(event) {
			if (!SURFACE_EVENT_TYPES.has(event.type)) return false;
			return event.surfaceOp !== void 0;
		}
		/**
		* Narrow an event to an append-origin surface event: one that entered the
		* surface at its own log position and was never itself a replacement copy.
		*
		* The model-visible surface deliberately shadows replaced ranges, so it is the
		* wrong source for a human transcript — a landed replacement would erase
		* conversation the user already saw. Append-origin events are that transcript's
		* durable source material; replacement copies stay model-only.
		* @param event - event to test.
		* @returns true when the event appended to the surface tail.
		*/
		function isAppendSurfaceEvent(event) {
			return isSurfaceEvent(event) && event.surfaceOp === "append";
		}
		//#endregion
		//#region src/client/turn-deliverables.ts
		/**
		* Turn-scoped produced-file Definition and readers. Client-only and
		* model-free: the vocabulary is the mutation tools' own follow-along
		* `arguments` (write/edit/str_replace_editor), never the closing prose.
		* Alongside the turn's produced paths, each Turn publishes two change-history
		* maps:
		* - `history` — conversation-cumulative (chained across Turns), drives
		*   the chip badge's `+N -M` totals.
		* - `turnHunks` — this Turn only (fresh each start), drives the
		*   expandable diff panel so a collapsed turn never shows accumulated
		*   changes from earlier Turns.
		*
		* Applied hunks come from the tool/result `meta`: first-party mutation tools
		* attach their result-time contextual diff as an opaque JSON payload on the
		* result event (`dsh-tool-fs` publishes `{ diffs: FileDiff[] }`). The payload
		* is tool-private, so this module narrows it defensively — malformed or
		* absent metadata yields no hunks (the path still lists; only the badge and
		* the expandable change stay silent).
		*/
		/**
		* Extract the path from a supported first-party mutation call. Session
		* `tool/call` events are root calls; Code Dispatch children do not enter this
		* Definition independently.
		* @param name - wire tool name.
		* @param argsRaw - model-produced JSON arguments.
		* @returns the mutation path, or null when the call is not a supported mutation.
		*/
		function mutationPath(name, argsRaw) {
			let args;
			try {
				args = JSON.parse(argsRaw);
			} catch {
				return null;
			}
			if (!isRecord(args)) return null;
			switch (name) {
				case "write": return typeof args.content === "string" ? pathValue(args.file_path) : null;
				case "edit": return validEditArgs(args) ? pathValue(args.file_path) : null;
				case "str_replace_editor": return editorMutationPath(args);
				default: return null;
			}
		}
		/** Validate the fields that an `edit` execution requires. */
		function validEditArgs(args) {
			return typeof args.old_string === "string" && args.old_string.length > 0 && typeof args.new_string === "string" && args.old_string !== args.new_string && (args.replace_all === void 0 || typeof args.replace_all === "boolean");
		}
		/** Extract a path only from a complete mutating editor command. */
		function editorMutationPath(args) {
			const path = pathValue(args.path);
			if (path === null) return null;
			switch (args.command) {
				case "create": return typeof args.file_text === "string" ? path : null;
				case "str_replace": return typeof args.old_str === "string" && args.old_str.length > 0 && (args.new_str === void 0 || typeof args.new_str === "string") ? path : null;
				case "insert": return typeof args.insert_line === "number" && Number.isInteger(args.insert_line) && args.insert_line >= 0 && typeof args.new_str === "string" ? path : null;
				default: return null;
			}
		}
		/** A non-blank path preserves the exact spelling supplied to the tool. */
		function pathValue(value) {
			return typeof value === "string" && value.trim().length > 0 ? value : null;
		}
		/** Narrow parsed JSON to an argument object. */
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/**
		* Argument-derived applied-change hunks for a recognized mutation call:
		* the model's old/new text is the change itself (write's whole content is a
		* new-file/overwrite hunk; edit and str_replace_editor replace old with new).
		* Mirror of the tools' call-time diff card — no result metadata involved,
		* because tool/result events never persist it.
		*/
		function mutationHunks(name, argsRaw) {
			let args;
			try {
				args = JSON.parse(argsRaw);
			} catch {
				return [];
			}
			if (!isRecord(args)) return [];
			switch (name) {
				case "write": return typeof args.content === "string" && args.content.length > 0 ? [{
					oldText: null,
					newText: args.content
				}] : [];
				case "edit": return typeof args.old_string === "string" && typeof args.new_string === "string" ? [{
					oldText: args.old_string,
					newText: args.new_string
				}] : [];
				case "str_replace_editor": {
					const view = args.view;
					if (view === "create" && typeof args.new_str === "string" && args.new_str.length > 0) return [{
						oldText: null,
						newText: args.new_str
					}];
					if (view === "str_replace" && typeof args.old_str === "string" && typeof args.new_str === "string") return [{
						oldText: args.old_str,
						newText: args.new_str
					}];
					if (view === "insert" && typeof args.new_str === "string" && args.new_str.length > 0) return [{
						oldText: null,
						newText: args.new_str
					}];
					return [];
				}
				default: return [];
			}
		}
		/**
		* Files produced by one Turn data value.
		*
		* The source is the arguments of successful `write`, `edit`, and mutating
		* `str_replace_editor` calls, not the closing prose: a produced file must be
		* listed whether or not the model remembered to name it. A mutation is
		* recognized by tool name — the first-party mutation vocabulary — so a new
		* mutation tool joins by declaring what it does. Reads contribute nothing
		* (looking at a file does not produce it), and neither do deletes (there is
		* nothing left to open) or failed calls. Paths keep first-seen order and
		* appear once, so a file written and then edited in the same turn is one
		* entry.
		*
		* The Conversation Location index owns turn membership before this function
		* runs, so paths cannot spill across turns and this derivation does not infer
		* boundaries from neighboring presentation Nodes.
		* @param data - engine-published Deliverables data for one Turn.
		* @param seq - closing Assistant seq; later Tool settlements are excluded.
		* @returns Produced paths in first-seen order; empty when the turn wrote nothing.
		*/
		function producedForClosing(data, seq = Number.POSITIVE_INFINITY) {
			if (data === void 0) return [];
			const paths = [];
			const seen = /* @__PURE__ */ new Set();
			for (const produced of data.produced) {
				if (produced.seq > seq || seen.has(produced.path)) continue;
				seen.add(produced.path);
				paths.push(produced.path);
			}
			return paths;
		}
		/**
		* Claim the turn-tail chain only when its closing turn produced files.
		* @param owner - Turn-tail owner currency for the closing assistant.
		* @returns Produced matches (path plus conversation history) as the component's
		* input, or null to decline before mount.
		*/
		function selectProducedFiles(owner) {
			const data = owner.turn.data.get("deliverables");
			const paths = producedForClosing(data, owner.seq);
			if (paths.length === 0) return null;
			const history = data?.history;
			const turnHunks = data?.turnHunks;
			return paths.map((path) => ({
				path,
				hunks: turnHunks?.get(path) ?? [],
				totalHunks: history?.get(path) ?? []
			}));
		}
		/**
		* Added/removed line totals for one path's conversation history, with the
		* same counting the diff primitive draws: each hunk's sides pair through the
		* common-prefix/suffix trim, so unchanged lines count on neither side.
		* @param hunks - the path's accumulated applied hunks.
		* @returns the `+added -removed` totals the chip badge shows.
		*/
		function diffStats(hunks) {
			let added = 0;
			let removed = 0;
			for (const hunk of hunks) {
				const change = diffLines(hunk.oldText, hunk.newText);
				added += change.added.length;
				removed += change.removed.length;
			}
			return {
				added,
				removed
			};
		}
		/** Turn-local successful mutation accumulator; it publishes no view Node. */
		const deliverablesDefinition = {
			kind: "deliverables",
			match: (event) => {
				if (event.type === "turn/start") return {
					id: String(event.data.turn),
					role: "start"
				};
				if (event.type === "tool/call") return {
					id: String(event.data.turn),
					role: "update"
				};
				if (event.type === "tool/result" && isAppendSurfaceEvent(event)) return {
					id: String(event.data.turn),
					role: "update"
				};
				return null;
			},
			start: (_context, match, reader) => {
				if (match.event.type !== "turn/start") throw new Error("deliverables start requires turn/start");
				const previous = reader.previous("deliverables");
				return {
					turn: match.event.data.turn,
					calls: /* @__PURE__ */ new Map(),
					produced: [],
					history: new Map(previous?.state.history ?? []),
					turnHunks: /* @__PURE__ */ new Map()
				};
			},
			update: (context, match) => {
				if (match.event.type === "tool/call") {
					const calls = new Map(context.state.calls);
					calls.set(String(match.event.data.callId), {
						path: mutationPath(match.event.data.name, match.event.data.arguments),
						hunks: mutationHunks(match.event.data.name, match.event.data.arguments)
					});
					return {
						...context.state,
						calls
					};
				}
				if (match.event.type !== "tool/result") return context.state;
				if (match.event.data.message.content[0].isError === true) return context.state;
				const callId = String(match.event.data.message.source.callId);
				const call = context.state.calls.get(callId);
				const path = call?.path;
				if (path === void 0 || path === null) return context.state;
				const additions = [{
					seq: match.event.seq,
					path
				}];
				const hunks = call?.hunks ?? [];
				const history = new Map(context.state.history);
				const turnHunks = new Map(context.state.turnHunks);
				if (hunks.length > 0) {
					history.set(path, [...history.get(path) ?? [], ...hunks]);
					turnHunks.set(path, [...turnHunks.get(path) ?? [], ...hunks]);
				}
				return {
					...context.state,
					produced: [...context.state.produced, ...additions],
					history,
					turnHunks
				};
			},
			buildLocationData: (context, scope) => scope !== "turn" || context.state === void 0 ? null : {
				kind: "turn",
				turn: context.state.turn,
				key: "deliverables",
				value: {
					produced: context.state.produced,
					history: context.state.history,
					turnHunks: context.state.turnHunks
				}
			}
		};
		/**
		* Trailing path segment, the part that identifies the file at a glance.
		* @param path - Slash- or backslash-separated path.
		* @returns The final segment, or the whole string when separator-free.
		*/
		function basename(path) {
			const at = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
			return at === -1 ? path : path.slice(at + 1);
		}
		/**
		* Leading path segments, the location that sets a deep path apart.
		* @param path - Slash- or backslash-separated path.
		* @returns The segments before the final one, or the empty string when separator-free.
		*/
		function dirname(path) {
			const at = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
			return at === -1 ? "" : path.slice(0, at);
		}
		/**
		* File-mention vocabulary over one turn's produced paths, for the closing
		* message's prose: an inline-code token opens the file it names. A token
		* resolves by exact path, or by being exactly the basename of exactly one
		* produced path — a basename two paths share stays inert rather than
		* guessing, so a mention link can never open the wrong file or 404.
		* @param paths - The turn's produced paths (tool order, already deduped).
		* @param openFile - The chat view's file opener.
		* @param label - Localizes the accessible open-label for a resolved path.
		* @returns The resolver MarkdownText consumes; the full path rides `title`,
		* the same disambiguator the row's chips carry.
		*/
		function producedFileMentions(paths, openFile, label) {
			return { resolve(value) {
				const path = paths.includes(value) ? value : onlyPathWithBasename(paths, value);
				if (path === void 0) return void 0;
				return {
					open: () => {
						openFile(path);
					},
					label: label(path),
					title: path
				};
			} };
		}
		/** The single produced path whose basename is exactly `value`, else undefined. */
		function onlyPathWithBasename(paths, value) {
			const matches = paths.filter((path) => basename(path) === value);
			return matches.length === 1 ? matches[0] : void 0;
		}
		//#endregion
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-deliverables-custom\src\client\ProducedFiles.module.css.mjs
		const css$1 = ".GwCMNq_root{grid-template-columns:max-content minmax(0,1fr);align-items:center;gap:6px 8px;margin-top:16px;font-size:13px;line-height:22px;display:grid;position:relative}.GwCMNq_label{color:var(--dsw-alias-label-tertiary);grid-area:1/1}.GwCMNq_row{flex-wrap:wrap;grid-area:1/2;align-items:center;gap:8px;min-width:0;display:flex}.GwCMNq_chip{background:var(--dsw-alias-interactive-bg-hover);border-radius:6px;flex:none;align-items:center;display:inline-flex}.GwCMNq_file{text-overflow:ellipsis;white-space:nowrap;max-width:320px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:none;flex:none;margin:0;padding:0 6px 0 8px;overflow:hidden}.GwCMNq_file:hover{color:var(--dsw-alias-label-primary);text-decoration:underline}.GwCMNq_file:focus-visible,.GwCMNq_toggle:focus-visible,.GwCMNq_showFolder:focus-visible,.GwCMNq_diffPath:focus-visible,.GwCMNq_diffCollapse:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}.GwCMNq_stats{flex:none;gap:3px;font-size:12px;line-height:22px;display:inline-flex}.GwCMNq_added{color:var(--dsw-alias-state-success-primary)}.GwCMNq_removed{color:var(--dsw-alias-state-error-primary)}.GwCMNq_toggle{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;flex:none;align-items:center;margin:0;padding:0 8px 0 2px;display:inline-flex}.GwCMNq_toggle:hover{color:var(--dsw-alias-label-secondary)}.GwCMNq_diff{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-markdown-code-block);border-radius:12px;grid-area:2/2;min-width:0;animation:.16s ease-out GwCMNq_produced-diff-in;overflow:hidden}.GwCMNq_diffHeader{background:var(--dsw-alias-interactive-bg-hover);border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:6px 6px 6px 12px;line-height:24px;display:flex}.GwCMNq_diffPath{min-width:0;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;flex:auto;align-items:baseline;gap:6px;margin:0;padding:0;display:inline-flex}.GwCMNq_diffPath:hover{color:var(--dsw-alias-label-primary)}.GwCMNq_diffName{color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;flex:0 auto;font-weight:600;overflow:hidden}.GwCMNq_diffDir{min-width:0;color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;flex:auto;overflow:hidden}.GwCMNq_diffCollapse{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;flex:none;align-items:center;margin:0;padding:0 6px;display:inline-flex}.GwCMNq_diffCollapse:hover{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover)}.GwCMNq_diffBody{margin:0}@keyframes GwCMNq_produced-diff-in{0%{opacity:0;transform:translateY(-4px)}}@media (prefers-reduced-motion:reduce){.GwCMNq_diff{animation:none}}.GwCMNq_more{white-space:nowrap;color:var(--dsw-alias-label-tertiary);flex:none}.GwCMNq_showFolder{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:4px;grid-column:2;justify-self:start;margin:0;padding:0 2px;line-height:20px}.GwCMNq_showFolder:hover{color:var(--dsw-alias-label-secondary);text-decoration:underline}.GwCMNq_measure{visibility:hidden;pointer-events:none;contain:strict;width:0;height:0;position:absolute;overflow:hidden}.GwCMNq_probe{width:max-content;position:absolute;inset:0 auto auto 0}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-deliverables-custom/ProducedFiles.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-deliverables-custom";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ProducedFiles_module_css_default = {
			"added": "GwCMNq_added",
			"chip": "GwCMNq_chip",
			"diff": "GwCMNq_diff",
			"diffBody": "GwCMNq_diffBody",
			"diffCollapse": "GwCMNq_diffCollapse",
			"diffDir": "GwCMNq_diffDir",
			"diffHeader": "GwCMNq_diffHeader",
			"diffName": "GwCMNq_diffName",
			"diffPath": "GwCMNq_diffPath",
			"file": "GwCMNq_file",
			"label": "GwCMNq_label",
			"measure": "GwCMNq_measure",
			"more": "GwCMNq_more",
			"probe": "GwCMNq_probe",
			"produced-diff-in": "GwCMNq_produced-diff-in",
			"removed": "GwCMNq_removed",
			"root": "GwCMNq_root",
			"row": "GwCMNq_row",
			"showFolder": "GwCMNq_showFolder",
			"stats": "GwCMNq_stats",
			"toggle": "GwCMNq_toggle"
		};
		//#endregion
		//#region src/client/ProducedFiles.tsx
		/** Cap for produced-file chips. The row wraps to multiple lines, so this
		*  limit exists mainly to bound measurement and prevent pathological counts;
		*  30 covers all realistic single-turn file sets. */
		const SHOWN_LIMIT = 30;
		function moreLabel(t, count) {
			return count === 1 ? t("produced.moreOne") : t("produced.more", { count: String(count) });
		}
		/** The `+A -R` badge of one chip's conversation totals. */
		function Stats({ added, removed }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: ProducedFiles_module_css_default.stats,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: ProducedFiles_module_css_default.added,
					children: ["+", added]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: ProducedFiles_module_css_default.removed,
					children: ["-", removed]
				})]
			});
		}
		/**
		* The expanded change below the row: one card, a title bar over the diff
		* primitive's body. The bar carries the path (name plus dimmed directory, both
		* ellipsized; like every path in this row it opens the file), the +/- totals,
		* and its own collapse control; the primitive's path headers and footer stay
		* off inside the panel.
		*/
		function ChangePanel({ match, openFile, t, close }) {
			const stats = diffStats(match.hunks);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ProducedFiles_module_css_default.diff,
				"data-produced-diff": true,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: ProducedFiles_module_css_default.diffHeader,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ProducedFiles_module_css_default.diffPath,
							title: match.path,
							"aria-label": t("produced.open", { name: match.path }),
							onClick: () => {
								openFile(match.path);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ProducedFiles_module_css_default.diffName,
								children: basename(match.path)
							}), dirname(match.path) !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ProducedFiles_module_css_default.diffDir,
								children: dirname(match.path)
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stats, {
							added: stats.added,
							removed: stats.removed
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ProducedFiles_module_css_default.diffCollapse,
							"aria-label": t("produced.collapsePanel"),
							onClick: close,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutline14, { size: 12 })
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DiffBlock, {
					diffs: match.hunks.map((hunk) => ({
						path: match.path,
						...hunk
					})),
					showPathHeaders: false,
					showFooter: false,
					className: ProducedFiles_module_css_default.diffBody
				})]
			});
		}
		/**
		* Render one turn's produced files as openable chips.
		* @param props - selector-matched paths, the chat view's file opener, and the locale seat.
		* @returns The produced-files row.
		*/
		function ProducedFiles({ matched: paths, openFile, isLoopback, ensureWorkspacePathOpen, useWorkspacePathOpen, t }) {
			(0, react.useEffect)(() => {
				ensureWorkspacePathOpen();
			}, [ensureWorkspacePathOpen]);
			const hostCanOpenPath = useWorkspacePathOpen((available) => available === true);
			const canOpenPath = isLoopback && hostCanOpenPath;
			const [expandedPath, setExpandedPath] = (0, react.useState)(null);
			const shown = paths.slice(0, SHOWN_LIMIT);
			const hidden = paths.length - shown.length;
			const expanded = paths.find((match) => match.path === expandedPath) ?? null;
			const chip = (match) => {
				const { path, hunks, totalHunks } = match;
				const stats = totalHunks.length === 0 ? null : diffStats(totalHunks);
				const open = expandedPath === path;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: ProducedFiles_module_css_default.chip,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ProducedFiles_module_css_default.file,
						title: path,
						"aria-label": t("produced.open", { name: path }),
						onClick: () => {
							openFile(path);
						},
						children: basename(path)
					}), stats !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Stats, {
						added: stats.added,
						removed: stats.removed
					}), hunks.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ProducedFiles_module_css_default.toggle,
						"aria-expanded": open,
						"aria-label": t(open ? "produced.collapse" : "produced.expand", { name: path }),
						onClick: () => {
							setExpandedPath(open ? null : path);
						},
						children: open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutline14, { size: 12 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 12 })
					})] })]
				}, path);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ProducedFiles_module_css_default.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ProducedFiles_module_css_default.label,
						children: t("produced.label")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ProducedFiles_module_css_default.row,
						"data-produced-files-row": true,
						children: [shown.map(chip), hidden > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ProducedFiles_module_css_default.more,
							children: moreLabel(t, hidden)
						})]
					}),
					expanded !== null && expanded.hunks.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChangePanel, {
						match: expanded,
						openFile,
						t,
						close: () => {
							setExpandedPath(null);
						}
					}),
					paths.length > 0 && canOpenPath && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ProducedFiles_module_css_default.showFolder,
						onClick: () => {
							openFile(".");
						},
						children: t("produced.showInFolder")
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-deliverables-custom\src\client\ToolMutationRow.module.css.mjs
		const css = ".p9W_JG_root{flex-direction:column;display:flex}.p9W_JG_row{position:relative;overflow:hidden}.p9W_JG_root[data-state=running] .p9W_JG_row:after{content:\"\";background:linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--dsw-alias-bg-base) 60%, transparent) 55%, transparent 100%);pointer-events:none;width:300px;animation:2.6s ease-out infinite p9W_JG_dsh-tool-row-sweep;position:absolute;top:0;bottom:0;left:0}@keyframes p9W_JG_dsh-tool-row-sweep{0%{left:-300px}90%,to{left:100%}}.p9W_JG_leading{flex-shrink:0}.p9W_JG_chevron{color:var(--dsw-alias-label-secondary)}.p9W_JG_title{font-weight:400}.p9W_JG_sep{background:var(--dsw-alias-label-caption);border-radius:1px;flex:none;width:2px;height:2px;margin:0 8px}.p9W_JG_summary{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));color:var(--dsw-alias-label-tertiary);flex:auto;overflow:hidden}.p9W_JG_fileLink{text-overflow:ellipsis;white-space:nowrap;min-width:0;font:inherit;text-align:left;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));color:var(--dsw-alias-label-secondary);text-decoration:underline dotted;text-decoration-color:var(--dsw-alias-label-tertiary);text-underline-offset:3px;cursor:pointer;background:0 0;border:none;flex:0 auto;margin:0;padding:0;text-decoration-thickness:1px;overflow:hidden}.p9W_JG_fileLink:hover{color:var(--dsw-alias-label-primary);text-decoration-color:currentColor}.p9W_JG_diffStat{white-space:nowrap;font-family:var(--ds-font-family-code);font-size:calc(var(--dsh-content-font-size-secondary,13px) - 2px);color:var(--dsw-alias-label-caption);flex:none;margin-left:10px;transform:translateY(.5px)}.p9W_JG_errorSummary{color:var(--dsw-alias-state-error-primary)}.p9W_JG_bodyWrap{flex-direction:column;display:flex}.p9W_JG_diffBody{margin:4px 0 8px}.p9W_JG_errorBody{background:var(--dsw-alias-markdown-code-block);color:var(--dsw-alias-state-error-primary);font-family:var(--ds-font-family-code);white-space:pre-wrap;word-break:break-all;border-radius:8px;margin:4px 0 8px;padding:8px 12px;font-size:12px}.p9W_JG_inspectButton{border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:0;border-radius:999px;align-self:flex-start;align-items:center;gap:4px;margin:4px 0 2px 4px;padding:2px 8px;font-size:11px;line-height:16px;transition:opacity .1s;display:inline-flex}.p9W_JG_root:hover .p9W_JG_inspectButton,.p9W_JG_inspectButton:focus-visible{opacity:1}.p9W_JG_inspectButton:hover{background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary)}";
		const tagId = "@deepseek-ai/dsh-client-ui-deliverables-custom/ToolMutationRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-deliverables-custom";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ToolMutationRow_module_css_default = {
			"bodyWrap": "p9W_JG_bodyWrap",
			"chevron": "p9W_JG_chevron",
			"diffBody": "p9W_JG_diffBody",
			"diffStat": "p9W_JG_diffStat",
			"dsh-tool-row-sweep": "p9W_JG_dsh-tool-row-sweep",
			"errorBody": "p9W_JG_errorBody",
			"errorSummary": "p9W_JG_errorSummary",
			"fileLink": "p9W_JG_fileLink",
			"inspectButton": "p9W_JG_inspectButton",
			"leading": "p9W_JG_leading",
			"root": "p9W_JG_root",
			"row": "p9W_JG_row",
			"sep": "p9W_JG_sep",
			"summary": "p9W_JG_summary",
			"title": "p9W_JG_title"
		};
		//#endregion
		//#region src/client/ToolMutationRow.tsx
		function leadingFor(state, icon) {
			switch (state) {
				case "error": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" });
				case "stopped": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "warning" });
				default: return icon;
			}
		}
		function relativizePath(path, cwd) {
			if (!cwd) return path;
			const normalizedCwd = cwd.replace(/\\/g, "/").replace(/\/$/, "");
			const normalizedPath = path.replace(/\\/g, "/");
			if (normalizedPath.startsWith(`${normalizedCwd}/`)) return normalizedPath.slice(normalizedCwd.length + 1);
			return path;
		}
		function firstLine(text) {
			const newline = text.indexOf("\n");
			return newline === -1 ? text : text.slice(0, newline);
		}
		function ToolMutationRow({ toolName, block, cwd, openFile, inspect, t }) {
			const [expanded, setExpanded] = (0, react.useState)(false);
			const done = block.kind !== void 0;
			const isInterrupted = done && block.error?.code === "interrupted";
			const isError = done && Boolean(block.isError);
			const state = !done ? "running" : isInterrupted ? "stopped" : isError ? "error" : "ok";
			const argsRaw = (done ? block.call?.argsRaw : block.argsRaw) ?? "";
			const args = (0, react.useMemo)(() => {
				try {
					return JSON.parse(argsRaw) ?? {};
				} catch {
					return {};
				}
			}, [argsRaw]);
			const filePath = typeof args.file_path === "string" && args.file_path.trim().length > 0 ? args.file_path : void 0;
			const outputText = done ? block.resultText ?? null : null;
			const errorSummary = isError && outputText !== null ? firstLine(outputText) : null;
			const diffs = (0, react.useMemo)(() => {
				if (isError) return [];
				if (done) {
					const metaDiffs = block.meta?.diffs;
					if (Array.isArray(metaDiffs) && metaDiffs.length > 0) return metaDiffs;
				}
				if (!filePath) return [];
				if (toolName === "write" && typeof args.content === "string") return [{
					path: filePath,
					oldText: null,
					newText: args.content
				}];
				if (toolName === "edit" && typeof args.old_string === "string" && typeof args.new_string === "string") return [{
					path: filePath,
					oldText: args.old_string,
					newText: args.new_string
				}];
				return [];
			}, [
				done,
				isError,
				block,
				filePath,
				toolName,
				args
			]);
			const stats = (0, react.useMemo)(() => diffStats(diffs), [diffs]);
			const diffStat = (0, react.useMemo)(() => {
				if (stats.added === 0 && stats.removed === 0) return null;
				return `+${stats.added} -${stats.removed}`;
			}, [stats]);
			const summaryText = errorSummary ?? (filePath ? relativizePath(filePath, cwd) : block.callId);
			const title = t === void 0 ? toolName === "write" ? "写入" : "编辑" : t(`tool.title.${toolName}`);
			const fileLink = filePath !== void 0 && errorSummary === null;
			const expandable = diffs.length > 0 || outputText !== null;
			const open = expanded && expandable;
			const toggleExpand = () => {
				setExpanded((v) => !v);
			};
			const handleOpenFile = (event) => {
				event.stopPropagation();
				if (filePath !== void 0) openFile(filePath);
			};
			const handleLinkKeyDown = (event) => {
				if (event.key === "Enter" || event.key === " ") event.stopPropagation();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: ToolMutationRow_module_css_default.root,
				"data-variant": toolName,
				"data-tool": toolName,
				"data-state": state,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
					rowClassName: ToolMutationRow_module_css_default.row,
					leadingClassName: ToolMutationRow_module_css_default.leading,
					titleClassName: ToolMutationRow_module_css_default.title,
					chevronClassName: ToolMutationRow_module_css_default.chevron,
					icon: leadingFor(state, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, { size: 14 })),
					title,
					open,
					expandable,
					expandOnRowClick: true,
					keepContentWhenOpen: true,
					onToggle: toggleExpand,
					collapsedContent: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ToolMutationRow_module_css_default.sep,
							"aria-hidden": true
						}),
						fileLink ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ToolMutationRow_module_css_default.fileLink,
							onClick: handleOpenFile,
							onKeyDown: handleLinkKeyDown,
							title: filePath,
							children: summaryText
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: clsx(ToolMutationRow_module_css_default.summary, errorSummary !== null && ToolMutationRow_module_css_default.errorSummary),
							children: summaryText
						}),
						diffStat !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: ToolMutationRow_module_css_default.diffStat,
							children: diffStat
						})
					] }),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ToolMutationRow_module_css_default.bodyWrap,
						children: [isError && outputText !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ToolMutationRow_module_css_default.errorBody,
							children: outputText
						}) : diffs.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DiffBlock, {
							diffs,
							maxLines: 8,
							showPathHeaders: false,
							showFooter: true,
							className: ToolMutationRow_module_css_default.diffBody
						}) : null, inspect !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ToolMutationRow_module_css_default.inspectButton,
							onClick: inspect,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconInspectOutline12, { size: 12 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t === void 0 ? "查看" : t("row.inspect") })]
						})]
					})
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `deliverables` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "deliverables";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"produced.label": "本次产物",
			"produced.moreOne": "+ 1 个文件",
			"produced.more": "+ {count} 个文件",
			"produced.open": "打开 {name}",
			"produced.showInFolder": "在文件夹中显示",
			"produced.expand": "展开 {name} 的修改内容",
			"produced.collapse": "收起 {name} 的修改内容",
			"produced.collapsePanel": "收起修改面板"
		};
		/** English dictionary (same key set). */
		const en = {
			"produced.label": "Produced",
			"produced.moreOne": "+ 1 file",
			"produced.more": "+ {count} files",
			"produced.open": "Open {name}",
			"produced.showInFolder": "Show in folder",
			"produced.expand": "Show changes to {name}",
			"produced.collapse": "Hide changes to {name}",
			"produced.collapsePanel": "Collapse changes"
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services for the tail-slot registration and its dictionaries. */
		const inject = [
			"slots",
			"locale",
			"uiConversation",
			"remote",
			"remote.session"
		];
		/**
		* Client plugin body: register the dictionaries and the turn-tail entry.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const workspacePathOpen = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(void 0);
			let requestedWorkspacePathOpen = false;
			let capabilityRevision = 0;
			let pendingCapability;
			const loadWorkspacePathOpen = () => {
				if (pendingCapability !== void 0) return;
				const revision = capabilityRevision;
				const pending = ctx.remote.session.canOpenWorkspacePath().then((result) => {
					if (revision === capabilityRevision) workspacePathOpen.set(result.ok && result.value);
				}).finally(() => {
					if (pendingCapability === pending) pendingCapability = void 0;
				});
				pendingCapability = pending;
			};
			const ensureWorkspacePathOpen = () => {
				requestedWorkspacePathOpen = true;
				if (workspacePathOpen.getSnapshot() === void 0) loadWorkspacePathOpen();
			};
			ctx.on("connection/reset", () => {
				capabilityRevision++;
				pendingCapability = void 0;
				workspacePathOpen.set(void 0);
				if (requestedWorkspacePathOpen) loadWorkspacePathOpen();
			});
			ctx.uiConversation.events.register(deliverablesDefinition);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-deliverables-custom: dictionaries");
			ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
				name: "conversation.chat.turnTail",
				select: selectProducedFiles,
				priority: -5,
				locale: NS,
				inject: () => ({
					isLoopback: ctx.remote.$host.isLoopback,
					ensureWorkspacePathOpen,
					hooks: { workspacePathOpen }
				})
			}, ProducedFiles));
			ctx.slots.inject("tool.call.toolview", function* () {
				yield ctx.slots.register({
					name: "tool.call.toolview",
					key: "edit",
					priority: -5,
					locale: "conversation"
				}, ToolMutationRow);
				yield ctx.slots.register({
					name: "tool.call.toolview",
					key: "write",
					priority: -5,
					locale: "conversation"
				}, ToolMutationRow);
			});
			const t = ctx.locale.bind(NS);
			ctx.provide("chatFileMentions", { forClosing(owner) {
				const paths = producedForClosing(owner.turn.data.get("deliverables"), owner.seq);
				if (paths.length === 0) return void 0;
				return producedFileMentions(paths, owner.openFile, (path) => t("produced.open", { name: path }));
			} });
		}
		//#endregion
		exports.ProducedFiles = ProducedFiles;
		exports.ToolMutationRow = ToolMutationRow;
		exports.apply = apply;
		exports.inject = inject;
		exports.producedForClosing = producedForClosing;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map