window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-subagent-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
		//#region src/client/subagent-lineage.ts
		/**
		* Index uninterrupted subagent descendants under each ancestor.
		* @param summaries - Session summaries keyed by id.
		* @returns descendant totals keyed by possible parent id.
		*/
		function indexSubagentDescendants(summaries) {
			const indexed = /* @__PURE__ */ new Map();
			for (const descendant of Object.values(summaries)) {
				if (descendant.origin !== "subagent") continue;
				const seen = /* @__PURE__ */ new Set();
				let current = descendant;
				while (current?.origin === "subagent" && current.parentId !== void 0 && !seen.has(current.id)) {
					seen.add(current.id);
					const aggregate = indexed.get(current.parentId);
					if (aggregate === void 0) indexed.set(current.parentId, {
						count: 1,
						runningCount: descendant.running ? 1 : 0
					});
					else {
						aggregate.count += 1;
						if (descendant.running) aggregate.runningCount += 1;
					}
					current = summaries[current.parentId];
				}
			}
			return indexed;
		}
		//#endregion
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-subagent-custom\src\client\SubagentComposerAction.module.css.mjs
		const css = ".JTtqZG_button{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex;position:relative}.JTtqZG_button:hover:not(:disabled),.JTtqZG_button:focus-visible:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.JTtqZG_button:disabled{opacity:.5;cursor:default}.JTtqZG_avatar{justify-content:center;align-items:center;display:inline-flex}.JTtqZG_live{color:var(--dsw-static-deepseek-450)}.JTtqZG_badge{box-sizing:border-box;background:var(--dsw-static-deepseek-500);min-width:15px;height:15px;color:var(--dsw-static-neutral-bluish-00);font-variant-numeric:tabular-nums;border-radius:999px;justify-content:center;align-items:center;padding:0 3px;font-size:10px;font-weight:600;line-height:15px;display:inline-flex;position:absolute;top:-4px;right:-5px}";
		const tagId = "@deepseek-ai/dsh-client-ui-subagent-custom/SubagentComposerAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-subagent-custom";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SubagentComposerAction_module_css_default = {
			"avatar": "JTtqZG_avatar",
			"badge": "JTtqZG_badge",
			"button": "JTtqZG_button",
			"live": "JTtqZG_live"
		};
		//#endregion
		//#region src/client/SubagentComposerAction.tsx
		/**
		* Subagent composer action: the tool-row button next to the send button
		* (official `conversation.input.right` list seat). Renders the robot avatar
		* with a live running-subagent count badge; clicking opens the sidebar's
		* subagent tab through the dsh-better-sidebar service (`ctx.betterSidebar`),
		* which owns the subagent topology view. Without that service (plugin not
		* mounted) the button renders but the click is a no-op. Reads only the
		* session-list snapshot (zero RPC), same as the official header lineage.
		*/
		const NO_DESCENDANTS = {
			count: 0,
			runningCount: 0
		};
		/** 16px robot head: the subagent button avatar. */
		function RobotIcon({ className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 16 16",
				width: "16",
				height: "16",
				className,
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M8 1.4c.55 0 1 .45 1 1v1.05c1.7.35 2.95 1.8 3.08 3.55h.42c.83 0 1.5.67 1.5 1.5v3.5c0 .83-.67 1.5-1.5 1.5H3.5c-.83 0-1.5-.67-1.5-1.5V8.5c0-.83.67-1.5 1.5-1.5h.42c.13-1.75 1.38-3.2 3.08-3.55V2.4c0-.55.45-1 1-1Z",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.1",
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "5.7",
						cy: "9.1",
						r: "0.9",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "10.3",
						cy: "9.1",
						r: "0.9",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M5.4 11.6h5.2",
						stroke: "currentColor",
						strokeWidth: "1.1",
						strokeLinecap: "round"
					})
				]
			});
		}
		/**
		* Render the subagent affordance in the composer tool row.
		* @param props - session standard kit, the injected sidebar-tab opener, and
		* the plugin's localized copy.
		* @returns the button.
		*/
		function SubagentComposerAction({ sessionId, useSessions, openSubagentTab, t }) {
			const byId = useSessions((state) => state.byId);
			const running = (0, react.useMemo)(() => indexSubagentDescendants(byId).get(sessionId) ?? NO_DESCENDANTS, [sessionId, byId]).runningCount;
			const label = running > 0 ? t(running === 1 ? "button.running.one" : "button.running.other", { count: running }) : t("button.open");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label,
				side: "top",
				delayMs: 500,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: clsx(SubagentComposerAction_module_css_default.button, running > 0 && SubagentComposerAction_module_css_default.live),
					"aria-label": label,
					onClick: () => openSubagentTab(),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: SubagentComposerAction_module_css_default.avatar,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RobotIcon, {})
					}), running > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: SubagentComposerAction_module_css_default.badge,
						children: running
					})]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `subagent-composer` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin (distinct from official ui-subagent's `subagent`). */
		const NS = "subagent-composer";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"button.open": "查看子智能体工作过程",
			"button.running.one": "{count} 个子智能体运行中，点击查看",
			"button.running.other": "{count} 个子智能体运行中，点击查看"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en = {
			"button.open": "View subagent work",
			"button.running.one": "{count} subagent running, click to view",
			"button.running.other": "{count} subagents running, click to view"
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services for the input-seat registration and its dictionaries. */
		const inject = ["slots", "locale"];
		/**
		* Client plugin body: register the dictionaries and the composer tool-row
		* entry.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-subagent-custom: dictionaries");
			ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
				name: "conversation.input.right",
				id: "subagent-activity",
				order: 10,
				locale: NS,
				inject: () => ({ openSubagentTab: () => {
					ctx.get("betterSidebar")?.openTab({ type: "subagent" });
				} })
			}, SubagentComposerAction));
			ctx.inject(["inputTriggers"], (scope) => {
				const inputTriggers = scope.get("inputTriggers");
				if (inputTriggers && !inputTriggers.live?.sources?.some((s) => s.name === "reference")) {
					scope.effect(() => inputTriggers.registerSource({
						trigger: "@",
						name: "reference",
						showGroupTitle: false,
						candidates: () => Promise.resolve([]),
						codec: {
							clipboardText: (ref) => ref,
							serialize: (ref) => Promise.resolve(ref)
						}
					}), "ui-subagent-custom: compat reference serializer");
				}
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map