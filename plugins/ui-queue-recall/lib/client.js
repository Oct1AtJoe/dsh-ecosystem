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
		const css = "._1hb8UG_dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));max-width:calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto calc(0px - var(--dsh-composer-stack-gap) - 3px);padding:0 var(--dsh-composer-dock-inset);flex:none}._1hb8UG_panel{isolation:isolate;border-radius:var(--dsw-radius-lg) var(--dsw-radius-lg) 0 0;--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);width:100%;padding:2px 0;position:relative;overflow:hidden}._1hb8UG_panel:before{z-index:-1;border-radius:inherit;background:var(--dsw-specific-menu);backdrop-filter:var(--dsw-menu-backdrop-filter);content:\"\";pointer-events:none;position:absolute;inset:0}._1hb8UG_panel:after{border:.5px solid var(--dsw-alias-border-l1);border-radius:inherit;content:\"\";pointer-events:none;border-bottom:none;position:absolute;inset:0}._1hb8UG_header{box-sizing:border-box;border-radius:var(--dsw-radius-md);width:100%;height:36px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;align-items:center;gap:10px;padding:4px 12px;display:flex}._1hb8UG_header:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}._1hb8UG_header:disabled{cursor:default}._1hb8UG_lead{color:var(--dsw-alias-label-tertiary);flex:none;place-items:center;display:grid}._1hb8UG_count{min-width:0;font-family:Inter, var(--dsw-font-family);flex:auto;font-size:13px;font-weight:500;line-height:24px}._1hb8UG_chevron{width:14px;height:14px;color:var(--dsw-alias-label-tertiary);flex:none;place-items:center;display:grid}._1hb8UG_list{max-height:180px;margin:0;padding:0;list-style:none;overflow-y:auto}._1hb8UG_row{box-sizing:border-box;border-radius:var(--dsw-radius-md);align-items:center;gap:10px;width:100%;min-height:36px;padding:4px 5px 4px 12px;display:flex}._1hb8UG_row+._1hb8UG_row{box-shadow:inset 0 1px 0 var(--dsw-alias-border-l1)}._1hb8UG_attachments{flex:none;gap:4px;min-width:0;max-width:55%;display:flex;overflow:hidden}._1hb8UG_pendingRow ._1hb8UG_attachments{flex-shrink:1}._1hb8UG_file{border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-base);box-sizing:border-box;flex:0 180px;align-items:center;gap:4px;min-width:74px;height:24px;padding:0 6px;display:inline-flex;overflow:hidden}._1hb8UG_fileIcon{flex:none;width:16px;height:16px;display:inline-flex}._1hb8UG_fileName{min-width:0;color:var(--dsw-alias-label-primary-dimmed);font:var(--dsw-font-xs-13);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._1hb8UG_fileSize{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;font-size:10px}._1hb8UG_thumb{border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-base);object-fit:cover;width:24px;height:24px}._1hb8UG_preview{min-width:0;font:var(--dsw-font-xs-13);font-family:Inter, var(--dsw-font-family);color:var(--dsw-alias-label-primary-dimmed);flex:auto}._1hb8UG_actions{flex:none;align-items:center;gap:10px;display:flex}._1hb8UG_status{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xs-13);white-space:nowrap;flex:none}._1hb8UG_action{corner-shape:round;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:none;place-items:center;padding:0;display:grid}._1hb8UG_action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}._1hb8UG_action:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}._1hb8UG_action:disabled{cursor:default;opacity:.45}";
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
			"attachments": "_1hb8UG_attachments",
			"chevron": "_1hb8UG_chevron",
			"count": "_1hb8UG_count",
			"dock": "_1hb8UG_dock",
			"file": "_1hb8UG_file",
			"fileIcon": "_1hb8UG_fileIcon",
			"fileName": "_1hb8UG_fileName",
			"fileSize": "_1hb8UG_fileSize",
			"header": "_1hb8UG_header",
			"lead": "_1hb8UG_lead",
			"list": "_1hb8UG_list",
			"panel": "_1hb8UG_panel",
			"pendingRow": "_1hb8UG_pendingRow",
			"preview": "_1hb8UG_preview",
			"row": "_1hb8UG_row",
			"status": "_1hb8UG_status",
			"thumb": "_1hb8UG_thumb"
		};
		//#endregion
		//#region src/client/QueueDock.tsx
		const EMPTY_QUEUE = [];
		/**
		* Facts applied to the queue preview. The composer's own user-text widget
		* carries the full chip/mention rendering, so the dock reuses it instead of
		* re-implementing a text projection.
		*/
		const QUEUE_TEXT_FACTS = {
			collapseWhitespace: true,
			trimWhitespace: true
		};
		/**
		* Plain text of one queued row, or `null` when it carries non-text blocks.
		* Recall merges the text into the composer draft, so an image-only row has
		* nothing to hand over and keeps the action disabled.
		*/
		function textOf(content) {
			if (!content.every((block) => block.type === "text")) return null;
			return content.map((block) => block.text).join("");
		}
		/**
		* Durable references carried by one queued row. Inbox projections are wire
		* data despite their typed face, so an image or file block without a
		* reference is skipped rather than trusted.
		*/
		function queueAttachments(content) {
			const attachments = [];
			for (const block of content) {
				if (block.type === "image") {
					const { attachment } = block;
					if (attachment !== void 0) attachments.push({
						type: "image",
						attachment
					});
				}
				if (block.type === "file") {
					const { attachment } = block;
					if (attachment !== void 0) attachments.push({
						type: "file",
						attachment
					});
				}
			}
			return attachments;
		}
		/** Compact file identity used beside queue thumbnails. */
		function QueueFile({ attachment, label }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: QueueDock_module_css_default.file,
				"aria-label": label,
				title: attachment.name,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: QueueDock_module_css_default.fileIcon,
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FileTypeIcon, {
							path: attachment.name,
							size: 16
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: QueueDock_module_css_default.fileName,
						children: attachment.name
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: QueueDock_module_css_default.fileSize,
						children: (0, _deepseek_ai_dsh_client_ui_primitives.fileSizeText)(attachment.bytes ?? 0)
					})
				]
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
		* Queue strip: one item renders directly; multiple items default to a
		* collapsible count header; an empty queue renders nothing. Local queued
		* submissions show sending status and disabled actions until their Host queue
		* rows arrive.
		*
		* Divergence from the shipped dock: the edit action recalls the row into the
		* composer draft (existing draft preserved, joined with a newline) and removes
		* it from the queue, instead of editing it in place. Recalling lets a user
		* merge queued text with new input before sending; in-place editing cannot.
		*/
		function QueueDock({ useSession, useInput, useProjection, inputActions, updateQueue, notify, loadImage, renderFactorySlot, t }) {
			const inbox = useProjection("inbox");
			const pendingSubmissions = useSession((s) => s.pendingSubmissions);
			const queue = (0, react.useMemo)(() => {
				const rows = inbox?.["next-turn"] ?? EMPTY_QUEUE;
				const inChat = new Set(pendingSubmissions.filter((item) => item.placement === "transcript").map((item) => item.requestId));
				return inChat.size === 0 ? rows : rows.filter(({ source }) => source.kind !== "user" || !("rpcId" in source) || !inChat.has(source.rpcId));
			}, [inbox, pendingSubmissions]);
			const pendingQueue = (0, react.useMemo)(() => {
				const admitted = new Set(queue.flatMap(({ source }) => source.kind === "user" && "rpcId" in source ? [source.rpcId] : []));
				return pendingSubmissions.filter((submission) => submission.placement === "queued" && !admitted.has(submission.requestId));
			}, [pendingSubmissions, queue]);
			const rowCount = queue.length + pendingQueue.length;
			const running = useSession((s) => s.running);
			const queueMutable = useSession((s) => s.subagent === null || s.subagent.address.mode === "continuable");
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
			/**
			* Hand one queued row back to the composer. The draft is replaced first so a
			* refused removal still leaves the text recoverable in the input; the queue
			* row then leaves through the same remove action the delete button uses.
			*/
			const handleRecall = async (row) => {
				const text = textOf(row.content);
				if (text === null) return;
				const currentDraft = (draft ?? "").trim();
				inputActions.setDraft(currentDraft === "" ? text : `${currentDraft}\n${text}`);
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
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutlineRegular, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: QueueDock_module_css_default.count,
								children: t("queue.count", { n: rowCount })
							}),
							!listVisible && pendingQueue.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: QueueDock_module_css_default.status,
								role: "status",
								children: t("queue.sending")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: QueueDock_module_css_default.chevron,
								"aria-hidden": true,
								children: expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutlineRegular, {})
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
						id: listId,
						className: QueueDock_module_css_default.list,
						hidden: !listVisible,
						children: [listVisible && queue.map((row) => {
							const attachments = queueAttachments(row.content);
							const text = textOf(row.content);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: QueueDock_module_css_default.row,
								children: [
									rowCount === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.lead,
										"aria-hidden": true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutlineRegular, {})
									}),
									attachments.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.attachments,
										children: attachments.map((item, index) => item.type === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QueueThumb, {
											attachment: item.attachment,
											loadImage,
											label: t("queue.image")
										}, `${item.attachment.attachmentId}:${index}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QueueFile, {
											attachment: item.attachment,
											label: t("queue.file", { name: item.attachment.name })
										}, `${item.attachment.attachmentId}:${item.attachment.name}:${index}`))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.preview,
										children: renderFactorySlot("conversation.user.text", {
											text: row.content.filter((block) => block.type === "text").map((block) => block.text).join(""),
											facts: QUEUE_TEXT_FACTS,
											interactive: false,
											ellipsis: true
										})
									}),
									queueMutable && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: QueueDock_module_css_default.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												portal: true,
												label: t("queue.recall"),
												side: "bottom",
												delayMs: 500,
												disabled: text === null,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: QueueDock_module_css_default.action,
													"aria-label": t("queue.recall"),
													title: text === null ? t("queue.recall.unsupported") : void 0,
													disabled: busy !== null || text === null,
													onClick: () => {
														handleRecall(row);
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, { size: 14 })
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												portal: true,
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
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, { size: 14 })
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												portal: true,
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
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSendOutlineRegular, {})
												})
											})
										]
									})
								]
							}, row.id);
						}), listVisible && pendingQueue.map((submission) => {
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: `${QueueDock_module_css_default.row} ${QueueDock_module_css_default.pendingRow}`,
								"data-submission-echo": "",
								children: [
									rowCount === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.lead,
										"aria-hidden": true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQueueOutlineRegular, {})
									}),
									submission.attachments.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.attachments,
										children: submission.attachments.map((attachment, index) => attachment.type === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											className: QueueDock_module_css_default.thumb,
											src: attachment.value.previewUrl,
											alt: t("queue.image")
										}, `${attachment.value.previewUrl}:${index}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(QueueFile, {
											attachment: attachment.value,
											label: t("queue.file", { name: attachment.value.name })
										}, `${attachment.value.attachmentId}:${attachment.value.name}:${index}`))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.preview,
										children: renderFactorySlot("conversation.user.text", {
											text: submission.text,
											facts: QUEUE_TEXT_FACTS,
											interactive: false,
											ellipsis: true
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: QueueDock_module_css_default.status,
										role: "status",
										children: t("queue.sending")
									}),
									queueMutable && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: QueueDock_module_css_default.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: QueueDock_module_css_default.action,
												"aria-label": t("queue.recall"),
												title: t("queue.sending"),
												disabled: true,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineRegular, { size: 14 })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: QueueDock_module_css_default.action,
												"aria-label": t("queue.remove"),
												title: t("queue.sending"),
												disabled: true,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, { size: 14 })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: QueueDock_module_css_default.action,
												"aria-label": t("queue.steer"),
												title: t("queue.sending"),
												disabled: true,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSendOutlineRegular, {})
											})
										]
									})
								]
							}, submission.requestId);
						})]
					})]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "queueRecall";
		const zh = {
			"queue.count": "{n} 条排队消息",
			"queue.sending": "发送中…",
			"queue.image": "排队消息图片",
			"queue.file": "排队文件 {name}",
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
			"queue.sending": "Sending…",
			"queue.image": "Queued message image",
			"queue.file": "Queued file {name}",
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
		/**
		* Shadow the shipped queue strip with the recall variant.
		*
		* Same slot id and order as `@deepseek-ai/dsh-client-ui-conversation`'s own
		* `conversation-queue-dock`, with a negative priority so this entry wins the
		* list-slot shadow: the shipped entry registers at the default 0.
		*/
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