window.__ModuleLoader__.load({
	id: "dsh-kanye-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\kanye-pet\src\client\KanyeCard.module.css.mjs
		const css = "._6zwYNW_section{gap:12px;display:grid}._6zwYNW_heading{gap:2px;display:grid}._6zwYNW_cardTitle{color:var(--dsw-alias-label-primary,inherit);margin:0;font-size:14px;font-weight:600}._6zwYNW_cardDescription{color:var(--dsw-alias-label-tertiary,#00000080);margin:0;font-size:12px;line-height:1.5}._6zwYNW_row{border-bottom:1px solid var(--dsw-alias-border-l2,#00000014);justify-content:space-between;align-items:center;gap:16px;padding:10px 0;display:flex}._6zwYNW_rowLabel{gap:2px;min-width:0;display:grid}._6zwYNW_rowTitle{color:var(--dsw-alias-label-primary,inherit);font-size:13px;font-weight:500}._6zwYNW_rowHint{color:var(--dsw-alias-label-tertiary,#00000080);font-size:12px;line-height:1.4}._6zwYNW_switch{background:var(--dsw-alias-border-l3,#0000002e);cursor:pointer;border:0;border-radius:12px;flex-shrink:0;width:42px;height:24px;transition:background-color .2s cubic-bezier(.4,0,.2,1);position:relative}._6zwYNW_switch[data-on=true]{background:var(--dsw-alias-brand-primary,#5686fe)}._6zwYNW_switch:after{content:\"\";background:#fff;border-radius:50%;width:18px;height:18px;transition:transform .2s cubic-bezier(.4,0,.2,1);position:absolute;top:3px;left:3px;box-shadow:0 1px 3px #00000040}._6zwYNW_switch[data-on=true]:after{transform:translate(18px)}._6zwYNW_switch:disabled{opacity:.4;cursor:not-allowed}._6zwYNW_fieldRow{border-bottom:1px solid var(--dsw-alias-border-l2,#00000014);grid-template-columns:1fr auto;align-items:center;gap:4px 16px;padding:10px 0;display:grid}._6zwYNW_fieldLabel{gap:2px;min-width:0;display:grid}._6zwYNW_fieldControl{align-items:center;gap:8px;display:flex}._6zwYNW_fieldInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l3,#00000029);background-color:var(--dsw-alias-bg-layer-3,#0000000a);width:96px;color:var(--dsw-alias-label-primary,inherit);font:inherit;border-radius:8px;padding:6px 10px;font-size:13px;line-height:1.5;transition:border-color .15s,box-shadow .15s,background-color .15s}._6zwYNW_fieldInput:hover:not(:disabled){border-color:var(--dsw-alias-border-l4,#00000042)}._6zwYNW_fieldInput:focus-visible{border-color:var(--dsw-alias-brand-primary,#5686fe);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary,#5686fe) 25%, transparent);outline:none}._6zwYNW_fieldInput:disabled{opacity:.5;cursor:not-allowed}._6zwYNW_fieldInput[aria-invalid=true]{border-color:var(--dsw-alias-label-error,#ff6b6b)}._6zwYNW_selectInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l3,#00000029);background-color:var(--dsw-alias-bg-layer-3,#0000000a);min-width:160px;max-width:260px;color:var(--dsw-alias-label-primary,inherit);font:inherit;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;border-radius:8px;padding:6px 28px 6px 10px;font-size:13px;line-height:1.5;transition:border-color .15s,box-shadow .15s,background-color .15s;overflow:hidden}._6zwYNW_selectInput option{background-color:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#000)}._6zwYNW_selectInput:hover:not(:disabled){border-color:var(--dsw-alias-border-l4,#00000042)}._6zwYNW_selectInput:focus-visible{border-color:var(--dsw-alias-brand-primary,#5686fe);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary,#5686fe) 25%, transparent);outline:none}._6zwYNW_selectInput:disabled{opacity:.5;cursor:not-allowed}._6zwYNW_resetButton{border:1px solid var(--dsw-alias-border-l2,#0000001f);font:inherit;cursor:pointer;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap;border-radius:6px;padding:5px 10px;font-size:12px;line-height:1.5;transition:color .15s,border-color .15s,background-color .15s}._6zwYNW_resetButton:hover:not(:disabled){color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l4,#00000038);background:var(--dsw-alias-interactive-bg-hover,#0000000a)}._6zwYNW_resetButton:disabled{opacity:.35;cursor:not-allowed}._6zwYNW_fieldError{color:var(--dsw-alias-label-error,#ff6b6b);grid-column:1/-1;margin-top:2px;font-size:12px}._6zwYNW_actions{justify-content:flex-end;gap:10px;padding-top:8px;display:flex}._6zwYNW_button{border:1px solid var(--dsw-alias-border-l3,#00000026);font:inherit;cursor:pointer;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-primary,inherit);border-radius:8px;padding:6px 16px;font-size:13px;font-weight:500;line-height:1.5;transition:all .15s}._6zwYNW_button:hover:not(:disabled){color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l4,#00000040);background:var(--dsw-alias-interactive-bg-hover,#0000000a)}._6zwYNW_button[data-tone=primary]{background:var(--dsw-alias-brand-primary,#5686fe);color:#fff;border-color:#0000}._6zwYNW_button[data-tone=primary]:hover:not(:disabled){opacity:.9}._6zwYNW_button:disabled{opacity:.5;cursor:not-allowed;border-color:var(--dsw-alias-border-l2,#0000001a)}._6zwYNW_button[data-tone=primary]:disabled{background:color-mix(in srgb, var(--dsw-alias-brand-primary,#5686fe) 18%, transparent);color:var(--dsw-alias-brand-primary,#5686fe);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary,#5686fe) 25%, transparent);opacity:1}";
		const tagId = "dsh-kanye-pet/KanyeCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-kanye-pet";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var KanyeCard_module_css_default = {
			"actions": "_6zwYNW_actions",
			"button": "_6zwYNW_button",
			"cardDescription": "_6zwYNW_cardDescription",
			"cardTitle": "_6zwYNW_cardTitle",
			"fieldControl": "_6zwYNW_fieldControl",
			"fieldError": "_6zwYNW_fieldError",
			"fieldInput": "_6zwYNW_fieldInput",
			"fieldLabel": "_6zwYNW_fieldLabel",
			"fieldRow": "_6zwYNW_fieldRow",
			"heading": "_6zwYNW_heading",
			"resetButton": "_6zwYNW_resetButton",
			"row": "_6zwYNW_row",
			"rowHint": "_6zwYNW_rowHint",
			"rowLabel": "_6zwYNW_rowLabel",
			"rowTitle": "_6zwYNW_rowTitle",
			"section": "_6zwYNW_section",
			"selectInput": "_6zwYNW_selectInput",
			"switch": "_6zwYNW_switch"
		};
		//#endregion
		//#region src/client/KanyeCard.tsx
		/** One numeric field row with a reset control. */
		function NumberField({ id, label, hint, value, disabled, onEdit, onReset, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: KanyeCard_module_css_default.fieldRow,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: KanyeCard_module_css_default.fieldLabel,
						htmlFor: id,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: KanyeCard_module_css_default.rowTitle,
							children: label
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: KanyeCard_module_css_default.rowHint,
							children: hint
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KanyeCard_module_css_default.fieldControl,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							id,
							className: KanyeCard_module_css_default.fieldInput,
							type: "text",
							inputMode: "decimal",
							value: value.text,
							disabled,
							"aria-invalid": value.invalid,
							onChange: (event) => {
								onEdit(event.target.value);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KanyeCard_module_css_default.resetButton,
							disabled,
							onClick: onReset,
							children: t("reset")
						})]
					}),
					value.invalid ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: KanyeCard_module_css_default.fieldError,
						children: t("invalidNumber")
					}) : null
				]
			});
		}
		/** Render the kanye-pet card. */
		function KanyeCard(props) {
			const { t } = props;
			const state = props.useKanyeCard((snapshot) => snapshot);
			const disabled = !state.writable;
			if (!state.available) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: KanyeCard_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KanyeCard_module_css_default.heading,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
							className: KanyeCard_module_css_default.cardTitle,
							children: t("cardTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: KanyeCard_module_css_default.cardDescription,
							children: t("cardDescription")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KanyeCard_module_css_default.row,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: KanyeCard_module_css_default.rowLabel,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowTitle,
								children: t("desktopPet")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowHint,
								children: t("desktopPetHint")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KanyeCard_module_css_default.switch,
							"data-on": String(state.desktopPetEnabled),
							"aria-pressed": state.desktopPetEnabled,
							disabled,
							onClick: props.toggleDesktopPet
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KanyeCard_module_css_default.row,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: KanyeCard_module_css_default.rowLabel,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowTitle,
								children: t("desktopNotification")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowHint,
								children: t("desktopNotificationHint")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KanyeCard_module_css_default.switch,
							"data-on": String(state.desktopNotificationEnabled),
							"aria-pressed": state.desktopNotificationEnabled,
							disabled,
							onClick: props.toggleDesktopNotification
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KanyeCard_module_css_default.row,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: KanyeCard_module_css_default.rowLabel,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowTitle,
								children: t("character")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowHint,
								children: t("characterHint")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
							className: KanyeCard_module_css_default.selectInput,
							value: state.character,
							disabled: disabled || !state.charactersLoaded || state.characters.length === 0,
							onChange: (event) => {
								props.edit("character", event.target.value);
							},
							children: state.charactersLoaded && state.characters.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: state.character,
								children: state.character
							}) : state.characters.map((ch) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: ch.id,
								children: ch.name
							}, ch.id))
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
						id: "plugin-config-kanye-size",
						label: t("size"),
						hint: t("sizeHint"),
						value: state.size,
						disabled,
						onEdit: (text) => {
							props.edit("size", text);
						},
						onReset: () => {
							props.edit("size", "150");
						},
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumberField, {
						id: "plugin-config-kanye-opacity",
						label: t("opacity"),
						hint: t("opacityHint"),
						value: state.opacity,
						disabled,
						onEdit: (text) => {
							props.edit("opacity", text);
						},
						onReset: () => {
							props.edit("opacity", "1");
						},
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KanyeCard_module_css_default.actions,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KanyeCard_module_css_default.button,
							"data-tone": "primary",
							disabled: disabled || !state.dirty || state.invalid || state.saving,
							onClick: props.save,
							children: state.saving ? "..." : t("save")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KanyeCard_module_css_default.button,
							disabled: disabled || !state.dirty && !state.saving,
							onClick: props.discard,
							children: t("discard")
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/kanye-card-controller.ts
		/** Namespace of the kanye-pet capability (matches the host plugin). */
		const KANYE_NS = "kanye-pet";
		/** Bridges the `kanye-pet` scope onto the card's staged form. */
		var KanyeCardController = class {
			scope;
			staged = /* @__PURE__ */ new Map();
			store;
			saving = false;
			characters = [];
			charactersLoaded = false;
			constructor(scope) {
				this.scope = scope;
				this.store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(this.projection());
				scope.subscribe(() => {
					this.store.set(this.projection());
				});
				this.loadCharacters();
			}
			async loadCharacters() {
				try {
					const res = await fetch("/kanye-pet/assets/manifest.json");
					if (!res.ok) return;
					const manifest = await res.json();
					this.characters = Object.entries(manifest.characters).map(([id, ch]) => ({
						id,
						name: ch.name ?? id
					}));
				} catch {} finally {
					this.charactersLoaded = true;
					this.store.set(this.projection());
				}
			}
			snapshot() {
				return this.scope.getSnapshot();
			}
			value() {
				return this.snapshot().value;
			}
			field(field) {
				const staged = this.staged.get(field);
				if (staged === void 0) {
					const value = this.value()?.[field];
					return {
						text: typeof value === "number" ? String(value) : "",
						invalid: false
					};
				}
				const trimmed = staged.text.trim();
				if (trimmed === "" || !Number.isFinite(Number(trimmed))) return {
					text: staged.text,
					invalid: trimmed !== ""
				};
				const num = Number(trimmed);
				if (field === "size" && (num < 100 || num > 300)) return {
					text: staged.text,
					invalid: true
				};
				if (field === "opacity" && (num < 0 || num > 1)) return {
					text: staged.text,
					invalid: true
				};
				return {
					text: staged.text,
					invalid: false
				};
			}
			projection() {
				const snapshot = this.snapshot();
				const value = this.value();
				const size = this.field("size");
				const opacity = this.field("opacity");
				const dirty = this.staged.size > 0;
				return {
					available: snapshot.status === "ready",
					writable: snapshot.writable,
					enabled: value?.enabled !== false,
					desktopPetEnabled: value?.desktopPetEnabled !== false,
					desktopNotificationEnabled: value?.desktopNotificationEnabled !== false,
					size,
					opacity,
					character: value?.character ?? "kanye",
					characters: this.characters,
					charactersLoaded: this.charactersLoaded,
					dirty,
					invalid: (size.invalid || opacity.invalid) && dirty,
					saving: this.saving
				};
			}
			/**
			* The face the card's slot entry injects from this controller.
			* @returns the registration-side face bridging the staged form onto the settings scope.
			*/
			inject() {
				return {
					toggleEnabled: () => {
						const next = this.value()?.enabled !== false ? false : true;
						this.scope.set("enabled", next);
					},
					toggleDesktopPet: () => {
						const next = this.value()?.desktopPetEnabled !== false ? false : true;
						this.scope.set("desktopPetEnabled", next);
					},
					toggleDesktopNotification: () => {
						const next = this.value()?.desktopNotificationEnabled !== false ? false : true;
						this.scope.set("desktopNotificationEnabled", next);
					},
					edit: (field, text) => {
						if (field === "character") {
							this.scope.set("character", text);
							return;
						}
						this.staged.set(field, { text });
						this.store.set(this.projection());
					},
					save: () => {
						if (this.saving) return;
						const size = this.staged.get("size");
						const opacity = this.staged.get("opacity");
						if (size === void 0 && opacity === void 0) return;
						const writes = [];
						for (const field of ["size", "opacity"]) {
							const staged = this.staged.get(field);
							if (staged === void 0) continue;
							const trimmed = staged.text.trim();
							if (trimmed === "") continue;
							const parsed = Number(trimmed);
							if (!Number.isFinite(parsed)) return;
							writes.push({
								field,
								value: parsed
							});
						}
						if (writes.length === 0) return;
						this.saving = true;
						this.store.set(this.projection());
						(async () => {
							for (const write of writes) await this.scope.set(write.field, write.value);
							this.saving = false;
							this.staged.clear();
							this.store.set(this.projection());
						})();
					},
					discard: () => {
						this.staged.clear();
						this.store.set(this.projection());
					},
					hooks: { kanyeCard: this.store }
				};
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/** Chinese dictionary; its key set defines KanyeLocaleKey. */
		const zh = {
			tab: "桌宠",
			cardTitle: "桌宠",
			cardDescription: "桌面右下角悬浮的 Kanye 宠物：可拖拽、可配置角色/尺寸/透明度。",
			desktopPet: "显示桌宠",
			desktopPetHint: "在操作系统桌面显示透明置顶的桌宠窗口（可拖拽）。",
			desktopNotification: "桌面端通知",
			desktopNotificationHint: "任务完成或需要操作时，发送系统桌面通知（Windows Toast）。",
			character: "角色",
			characterHint: "选择宠物形象。",
			size: "尺寸",
			sizeHint: "桌宠大小（像素，100–300）。",
			opacity: "透明度",
			opacityHint: "常态透明度（0.2–1）。",
			overridden: "已覆盖",
			reset: "重置",
			invalidNumber: "必须是数字",
			save: "保存",
			discard: "放弃"
		};
		/** English dictionary checked against the Chinese key set. */
		const en = {
			tab: "Pet",
			cardTitle: "Pet",
			cardDescription: "Kanye desktop pet: draggable, configurable character/size/opacity.",
			desktopPet: "Show pet",
			desktopPetHint: "Show a transparent always-on-top pet window on the OS desktop (draggable).",
			desktopNotification: "Desktop notifications",
			desktopNotificationHint: "Show system desktop notifications (Windows Toast) on turn end or actions.",
			character: "Character",
			characterHint: "Choose the pet look.",
			size: "Size",
			sizeHint: "Pet size in pixels (100–300).",
			opacity: "Opacity",
			opacityHint: "Steady-state opacity (0.2–1).",
			overridden: "Overridden",
			reset: "Reset",
			invalidNumber: "Must be a number",
			save: "Save",
			discard: "Discard"
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "kanye-pet";
		/** Services required by the kanye-pet tab. */
		const inject = [
			"slots",
			"locale",
			"configForms"
		];
		/**
		* Contribute the kanye-pet tab to the Plugins settings section. The tab reads and
		* writes the `kanye-pet` settings namespace; the renderer consumes it through
		* configForms and the tab owns its own card.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-kanye-pet: dictionaries");
			const t = ctx.locale.bind(NS);
			const controller = new KanyeCardController(ctx.configForms.get(KANYE_NS));
			ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({
				name: "settings.plugins.tab",
				id: "pet",
				order: 50,
				label: () => t("tab"),
				locale: NS,
				inject: () => controller.inject()
			}, KanyeCard));
			ctx.effect(() => {
				const onOpenSession = (event) => {
					const sessionId = event.detail?.sessionId;
					if (typeof sessionId !== "string" || sessionId === "") return;
					try {
						const workspace = ctx.get("uiWorkspace");
						if (typeof workspace?.openSession === "function") {
							workspace.openSession(sessionId);
							return;
						}
						ctx.get("sessions")?.open?.(sessionId);
					} catch (error) {
						console.warn(`[ui-kanye-pet] open session ${sessionId} failed:`, error);
					}
				};
				window.addEventListener("dsh:open-session", onOpenSession);
				return () => {
					window.removeEventListener("dsh:open-session", onOpenSession);
				};
			}, "ui-kanye-pet: dsh:open-session jump");
			ctx.effect(() => {
				const RawNotification = window.Notification;
				if (typeof RawNotification !== "function") return () => {};
				const readPetConfig = () => fetch("/kanye-pet/config", { cache: "no-store" }).then(async (r) => {
					const b = await r.json();
					return b?.config ?? b ?? {};
				});
				function DynamicNotification(title, options) {
					const bridge = window.__dshNotifyBridge;
					if (!bridge?.fire) {
						readPetConfig().then((cfg) => {
							if (cfg.desktopPetEnabled === true) return;
							new RawNotification(title, options);
						}).catch(() => {
							new RawNotification(title, options);
						});
						return this;
					}
					const payload = {
						type: "dsh-notification",
						title,
						body: options?.body || "",
						tag: options?.tag || "",
						sessionId: options?.sessionId || "",
						requireInteraction: Boolean(options?.requireInteraction),
						force: true
					};
					readPetConfig().then((cfg) => {
						if (cfg.desktopNotificationEnabled !== false) bridge.fire?.(payload);
					}).catch(() => {
						bridge.fire?.(payload);
					});
					return this;
				}
				DynamicNotification.permission = "granted";
				DynamicNotification.requestPermission = () => Promise.resolve("granted");
				window.Notification = DynamicNotification;
				return () => {
					window.Notification = RawNotification;
				};
			}, "ui-kanye-pet: dynamic notification shim");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map