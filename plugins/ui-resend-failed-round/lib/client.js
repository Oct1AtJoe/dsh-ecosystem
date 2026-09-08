window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-resend-failed-round",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-resend-failed-round\src\client\ResendAction.module.css.mjs
		const css = ".kN-T1W_button{border:1px solid var(--dsw-alias-border-secondary);height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border-radius:12px;align-items:center;gap:5px;padding:0 10px;font-size:12px;line-height:24px;display:inline-flex}.kN-T1W_button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-border-primary)}";
		const tagId = "@deepseek-ai/dsh-client-ui-resend-failed-round/ResendAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-resend-failed-round";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ResendAction_module_css_default = { "button": "kN-T1W_button" };
		//#endregion
		//#region src/client/ResendAction.tsx
		/**
		* Failed-round resend action: a re-run entry in the turn-tail zone of a turn
		* that ended terminally (turn-error or turn-max-tokens). Rendered in the
		* turn's tail chain; clicking re-sends the failed round's user text as a new
		* queued turn through the session-scoped conversation service. The chain
		* elects the entry on terminal turn ends; the component declines again when
		* a newer round superseded the failure, so the tail renders nothing extra.
		* @module @deepseek-ai/dsh-client-ui-resend-failed-round/client/ResendAction
		*/
		/**
		* The failed round's re-send text: the last user message preceding this
		* turn's terminal failure. Null when a later user message superseded the
		* round or no user message exists. Re-sends the message's plain text
		* (images are not replayed).
		* @param order - stable Chat row order; changes only on row enter/leave/move.
		* @param nodes - live per-key Chat node readers.
		* @param turn - the failed turn this tail belongs to.
		* @returns the plain text to re-send, or null when the round is gone.
		*/
		function failedRoundTarget(order, nodes, turn) {
			let text = null;
			let failed = false;
			for (const key of order) {
				const node = nodes.get(key);
				if (node === void 0) continue;
				if (node.kind === "user") {
					if (failed) return null;
					let joined = "";
					for (const block of node.data.content) if (block.type === "text") joined += block.text;
					text = joined;
				} else if ((node.kind === "turn-error" || node.kind === "turn-max-tokens") && node.data.turn === turn) failed = true;
			}
			return failed ? text : null;
		}
		/**
		* One failed round's re-run control in the turn-tail zone.
		* @param props - the tail's owner share, the elected reason, the injected
		*   send verb, and the locale seat.
		* @returns the re-run button, or null when a newer round superseded the failure.
		*/
		function ResendAction({ turn, send, t, useChat }) {
			const order = useChat((s) => s.order);
			const nodes = useChat((s) => s.nodes);
			const latestTurn = useChat((s) => s.timeline.turnOrder.at(-1));
			const target = (0, react.useMemo)(() => latestTurn === turn.turn ? failedRoundTarget(order, nodes, turn.turn) : null, [
				order,
				nodes,
				latestTurn,
				turn.turn
			]);
			if (target === null) return null;
			const label = t("action.resend");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label,
				side: "top",
				delayMs: 500,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ResendAction_module_css_default.button,
					"aria-label": label,
					onClick: () => {
						send(target);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `resend` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "resend";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = { "action.resend": "重新发起" };
		/** English dictionary (same key set). */
		const en = { "action.resend": "Re-run" };
		//#endregion
		//#region src/client/slots.ts
		/**
		* Elect the entry on a turn that ended terminally. Pure over the owner
		* props: the turn/end reason rides the tail owner's TurnLocation. Whether
		* this is still the latest failed round, and the round's user text, are the
		* component's chat-snapshot scan.
		* @param owner - tail owner currency for the closing turn.
		* @returns the elected reason, or null to decline.
		*/
		const resendSelect = (owner) => {
			const end = owner.turn.end;
			if (end === void 0) return null;
			const reason = end.data.reason;
			return reason.kind === "error" || reason.kind === "max-tokens" ? { reason: reason.kind } : null;
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services: the slot registry, the session scope index, and the copy. */
		const inject = [
			"slots",
			"sessions",
			"locale"
		];
		/**
		* Client plugin body: the failed-round re-run entry in the turn-tail chain.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-resend-failed-round: dictionaries");
			ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
				name: "conversation.chat.turnTail",
				priority: -10,
				select: resendSelect,
				locale: NS,
				inject: (sessionId) => ({ send: (text) => {
					const conversation = ctx.sessions.scope(sessionId)?.get("conversation");
					if (conversation !== void 0) conversation.send(text);
				} })
			}, ResendAction));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map