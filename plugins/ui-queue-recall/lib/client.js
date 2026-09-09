window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-queue-recall",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-queue-recall\src\client\QueueDock.module.css.mjs
		const css = "._1hb8UG_dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));max-width:calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px);padding:0 var(--dsh-composer-dock-inset);flex:none}._1hb8UG_panel{background:var(--dsw-specific-tip);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:12px 12px 0 0;width:100%;padding:2px 0;position:relative;overflow:hidden}._1hb8UG_panel:after{border:.5px solid var(--dsw-alias-border-l1);border-radius:inherit;content:\"\";pointer-events:none;border-bottom:none;position:absolute;inset:0}._1hb8UG_header{box-sizing:border-box;width:100%;height:36px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;border-radius:8px;align-items:center;gap:10px;padding:4px 12px;display:flex}._1hb8UG_header:focus-visible{outline:2px solid var(--dsw-alias-label-tertiary);outline-offset:-2px}._1hb8UG_header:disabled{cursor:default}._1hb8UG_lead{color:var(--dsw-alias-label-tertiary);flex:none;place-items:center;display:grid}._1hb8UG_count{min-width:0;font-family:Inter, var(--dsw-font-family);flex:auto;font-size:13px;font-weight:500;line-height:24px}._1hb8UG_chevron{width:14px;height:14px;color:var(--dsw-alias-label-tertiary);flex:none;place-items:center;display:grid}._1hb8UG_list{max-height:180px;margin:0;padding:0;list-style:none;overflow-y:auto}._1hb8UG_row{box-sizing:border-box;border-radius:8px;align-items:center;gap:10px;width:100%;height:36px;padding:4px 5px 4px 12px;display:flex}._1hb8UG_row+._1hb8UG_row{box-shadow:inset 0 1px 0 var(--dsw-alias-border-l1)}._1hb8UG_thumbs{flex:none;gap:4px;display:flex}._1hb8UG_thumb{border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);object-fit:cover;border-radius:4px;width:24px;height:24px}._1hb8UG_preview{min-width:0;color:var(--dsw-alias-label-primary-dimmed);font:var(--dsw-font-xs-13);font-family:Inter, var(--dsw-font-family);text-overflow:ellipsis;white-space:nowrap;word-break:break-word;flex:auto;overflow:hidden}._1hb8UG_actions{flex:none;align-items:center;gap:10px;display:flex}._1hb8UG_action{corner-shape:round;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:none;place-items:center;padding:0;display:grid}._1hb8UG_action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}._1hb8UG_action:focus-visible{outline:2px solid var(--dsw-alias-label-tertiary);outline-offset:-2px}._1hb8UG_action:disabled{cursor:default;opacity:.45}";
		const tagId = "@deepseek-ai/dsh-client-ui-queue-recall/QueueDock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-queue-recall";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var QueueDock_module_css_default = {
			"action": "_1hb8UG_action",
			"actions": "_1hb8UG_actions",
			"chevron": "_1hb8UG_chevron",
			"count": "_1hb8UG_count",
			"dock": "_1hb8UG_dock",
			"header": "_1hb8UG_header",
			"lead": "_1hb8UG_lead",
			"list": "_1hb8UG_list",
			"panel": "_1hb8UG_panel",
			"preview": "_1hb8UG_preview",
			"row": "_1hb8UG_row",
			"thumb": "_1hb8UG_thumb",
			"thumbs": "_1hb8UG_thumbs"
		};
		//#endregion
		//#region src/client/QueueDock.tsx
		/**
		* Durable references carried by one queued row. Queue frames are wire data
		* despite their typed face, so an image block without a reference is skipped
		* rather than trusted.
		*/
		function queueImageRefs(content) {
			return content.flatMap((block) => {
				if (block.type !== "image") return [];
				const { attachment } = block;
				return attachment === void 0 ? [] : [attachment];
			});
		}
		/** One durable queued image as a fixed-size thumbnail; a load failure keeps the empty placeholder. */
		function QueueThumb({ attachment, loadImage, label }) {
			const [url, setUrl] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let alive = true;
				loadImage(attachment).then((resolved) => {
					if (alive) setUrl(resolved);
				}, () => {});
				return () => {
					alive = false;
				};
			}, [attachment, loadImage]);
			return url === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: QueueDock_module_css_default.thumb,
				"aria-hidden": true
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				className: QueueDock_module_css_default.thumb,
				src: url,
				alt: label
			});
		}
		/**
		* Custom Queue dock: one item renders directly; multiple items default to a
		* collapsible count header; an empty queue renders nothing.
		* Clicking the edit button directly recalls the message to the composer draft.
		*/
		function QueueDock({ useSession, useInput, inputActions, updateQueue, notify, loadImage, t }) {
			const inbox = useSession((s) => s.queue);
			const queue = (0, react.useMemo)(() => inbox.filter((row) => row.placement === "queued"), [inbox]);
			const pendingSubmissions = useSession((s) => s.pendingSubmissions);
			const pendingQueue = (0, react.useMemo)(() => {
				const admitted = new Set(queue.flatMap((row) => row.rpcId === void 0 ? [] : [row.rpcId]));
				return pendingSubmissions.filter((submission) => submission.placement === "queued" && !admitted.has(submission.requestId));
			}, [pendingSubmissions, queue]);
			const rowCount = queue.length + pendingQueue.length;
			const running = useSession((s) => s.running);
			const queueMutable = useSession((s) => s.subagent === null);
			const draft = useInput((s) => s.draft);
			const [busy, setBusy] = (0, react.useState)(null);
			const [collapsed, setCollapsed] = (0, react.useState)(true);
			const listId = (0, react.useId)();
			(0, react.useEffect)(() => {
				if (rowCount === 0 && !collapsed) setCollapsed(true);
			}, [collapsed, rowCount]);
			if (rowCount === 0) return null;
			const interactionActive = queueMutable && busy !== null;
			const expanded = !collapsed || interactionActive;
			const listVisible = rowCount === 1 || expanded;
			const applyAction = async (itemId, action, failure) => {
				setBusy(itemId);
				try {
					await updateQueue(itemId, action);
					return true;
				} catch {
					notify("error", failure);
					return false;
				} finally {
					setBusy((current) => current === itemId ? null : current);
				}
			};
			const handleRecall = async (row) => {
				if (row.text === null) return;
				const currentDraft = (draft ?? "").trim();
				const nextDraft = currentDraft === "" ? row.text : `${currentDraft}\n${row.text}`;
				inputActions.setDraft(nextDraft);
				await applyAction(row.id, { kind: "remove" }, t("queue.recallFailed"));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: QueueDock_module_css_default.dock,
				"data-queue-dock": "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: QueueDock_module_css_default.panel,
					children: [rowCount > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: QueueDock_module_css_default.header,
						"aria-controls": listId,
						"aria-expanded": expanded,
						disabled: interactionActive,
						onClick: () => {
							setCollapsed((value) => !value);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: QueueDock_module_css_default.lead,
								"aria-hidden": true,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutline14, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: QueueDock_module_css_default.count,
								children: t("queue.count", { n: rowCount })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: QueueDock_module_css_default.chevron,
								"aria-hidden": true,
								children: expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutline14, {})
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
						id: listId,
						className: QueueDock_module_css_default.list,
						hidden: !listVisible,
						children: [listVisible && queue.map((row) => {
							const imageRefs = queueImageRefs(row.content);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: QueueDock_module_css_default.row,
								children: [
									rowCount === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.lead,
										"aria-hidden": true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutline14, {})
									}),
									imageRefs.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.thumbs,
										children: imageRefs.map((attachment, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QueueThumb, {
											attachment,
											loadImage,
											label: t("queue.image")
										}, `${attachment.attachmentId}:${index}`))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.preview,
										children: (0, _deepseek_ai_dsh_client_ui_primitives.projectUserText)(row.preview, [])
									}),
									queueMutable && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: QueueDock_module_css_default.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												label: t("queue.recall"),
												side: "bottom",
												delayMs: 500,
												disabled: row.text === null,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: QueueDock_module_css_default.action,
													"aria-label": t("queue.recall"),
													title: row.text === null ? t("queue.recall.unsupported") : void 0,
													disabled: busy !== null || row.text === null,
													onClick: () => {
														handleRecall(row);
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, { size: 14 })
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												label: t("queue.remove"),
												side: "bottom",
												delayMs: 500,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: QueueDock_module_css_default.action,
													"aria-label": t("queue.remove"),
													disabled: busy !== null,
													onClick: () => {
														applyAction(row.id, { kind: "remove" }, t("queue.removeFailed"));
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, { size: 14 })
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												label: t("queue.steer"),
												side: "bottom",
												delayMs: 500,
												disabled: !running,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: QueueDock_module_css_default.action,
													"aria-label": t("queue.steer"),
													title: running ? void 0 : t("queue.steer.unavailable"),
													disabled: busy !== null || !running,
													onClick: () => {
														applyAction(row.id, { kind: "steer" }, t("queue.steerFailed"));
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSendOutline14, {})
												})
											})
										]
									})
								]
							}, row.id);
						}), listVisible && pendingQueue.map((submission) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: QueueDock_module_css_default.row,
							"data-submission-echo": "",
							children: [
								rowCount === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: QueueDock_module_css_default.lead,
									"aria-hidden": true,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutline14, {})
								}),
								submission.images.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: QueueDock_module_css_default.thumbs,
									children: submission.images.map((image, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
										className: QueueDock_module_css_default.thumb,
										src: image.previewUrl,
										alt: t("queue.image")
									}, `${image.previewUrl}:${index}`))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: QueueDock_module_css_default.preview,
									children: (0, _deepseek_ai_dsh_client_ui_primitives.projectUserText)(submission.text, [])
								})
							]
						}, submission.requestId))]
					})]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "queueRecall";
		const zh = {
			"queue.count": "{n} 条排队消息",
			"queue.image": "排队消息图片",
			"queue.recall": "撤回至输入框",
			"queue.recall.unsupported": "包含非文本内容，暂不支持撤回",
			"queue.recallFailed": "撤回排队消息失败",
			"queue.remove": "删除排队消息",
			"queue.removeFailed": "删除失败：这条消息可能已经开始发送。",
			"queue.steer": "插话发送",
			"queue.steer.unavailable": "仅运行中可插话发送",
			"queue.steerFailed": "插话发送失败，请重试。"
		};
		const en = {
			"queue.count": "{n} queued messages",
			"queue.image": "Queued message image",
			"queue.recall": "Recall to draft",
			"queue.recall.unsupported": "Contains non-text content; recall is not supported yet",
			"queue.recallFailed": "Failed to recall queued message",
			"queue.remove": "Remove queued message",
			"queue.removeFailed": "Removal failed: this message may have already started sending.",
			"queue.steer": "Steer queued message",
			"queue.steer.unavailable": "Steering is available only while the agent is running",
			"queue.steerFailed": "Steering failed. Try again."
		};
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"conversation",
			"sessions",
			"uiConversation",
			"locale"
		];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-queue-recall: dictionaries");
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "queue",
				priority: -5,
				order: 20,
				locale: NS,
				inject: (sessionId) => {
					const actx = ctx.sessions.scope(sessionId);
					if (actx === void 0) throw new Error(`queue dock: session "${sessionId}" resolved no scope`);
					const conversation = actx.get("conversation");
					if (conversation === void 0) throw new Error("queue dock: conversation service unavailable");
					return {
						updateQueue: (itemId, action) => conversation.updateQueue(itemId, action),
						notify: (level, text) => {
							conversation.input.for(actx).notify(level, text);
						},
						loadImage: (attachment) => ctx.uiConversation.imageUrl(sessionId, attachment)
					};
				}
			}, QueueDock));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map