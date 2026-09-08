window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-kanye-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-kanye-pet\src\client\KanyeCard.module.css.mjs
		const css = ".Pih3tG_section{gap:12px;display:grid}.Pih3tG_heading{gap:2px;display:grid}.Pih3tG_cardTitle{margin:0;font-size:14px;font-weight:700}.Pih3tG_cardDescription{opacity:.7;margin:0;font-size:12px}.Pih3tG_row{border-bottom:1px solid #ffffff0f;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;display:flex}.Pih3tG_rowLabel{gap:2px;display:grid}.Pih3tG_rowTitle{font-size:13px;font-weight:600}.Pih3tG_rowHint{opacity:.6;font-size:11px}.Pih3tG_switch{cursor:pointer;background:#ffffff26;border:0;border-radius:11px;width:40px;height:22px;transition:background .15s;position:relative}.Pih3tG_switch[data-on=true]{background:#5686fed9}.Pih3tG_switch:after{content:\"\";background:#fff;border-radius:9px;width:18px;height:18px;transition:transform .15s;position:absolute;top:2px;left:2px}.Pih3tG_switch[data-on=true]:after{transform:translate(18px)}.Pih3tG_fieldRow{border-bottom:1px solid #ffffff0f;grid-template-columns:1fr auto;align-items:center;gap:4px 12px;padding:8px 0;display:grid}.Pih3tG_fieldLabel{gap:2px;display:grid}.Pih3tG_fieldControl{align-items:center;gap:6px;display:flex}.Pih3tG_fieldInput{width:88px;color:inherit;background:#ffffff0f;border:1px solid #ffffff26;border-radius:6px;padding:4px 8px;font-size:12px}.Pih3tG_fieldError{color:#ff6b6b;grid-column:1/-1;font-size:11px}.Pih3tG_actions{justify-content:flex-end;gap:8px;display:flex}.Pih3tG_button{cursor:pointer;color:inherit;background:#ffffff24;border:0;border-radius:8px;padding:6px 12px;font-size:12px}.Pih3tG_button[data-tone=primary]{background:#5686fed9}.Pih3tG_button:disabled{opacity:.4;cursor:default}";
		const tagId = "@deepseek-ai/dsh-client-ui-kanye-pet/KanyeCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-kanye-pet";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var KanyeCard_module_css_default = {
			"actions": "Pih3tG_actions",
			"button": "Pih3tG_button",
			"cardDescription": "Pih3tG_cardDescription",
			"cardTitle": "Pih3tG_cardTitle",
			"fieldControl": "Pih3tG_fieldControl",
			"fieldError": "Pih3tG_fieldError",
			"fieldInput": "Pih3tG_fieldInput",
			"fieldLabel": "Pih3tG_fieldLabel",
			"fieldRow": "Pih3tG_fieldRow",
			"heading": "Pih3tG_heading",
			"row": "Pih3tG_row",
			"rowHint": "Pih3tG_rowHint",
			"rowLabel": "Pih3tG_rowLabel",
			"rowTitle": "Pih3tG_rowTitle",
			"section": "Pih3tG_section",
			"switch": "Pih3tG_switch"
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
							className: KanyeCard_module_css_default.button,
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
								children: t("character")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KanyeCard_module_css_default.rowHint,
								children: t("characterHint")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
							className: KanyeCard_module_css_default.fieldInput,
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
			"settingsScope"
		];
		/**
		* Contribute the kanye-pet tab to the Plugins settings section. The tab reads and
		* writes the `kanye-pet` settings namespace; the renderer consumes it through
		* settingsScope and the tab owns its own card.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-kanye-pet: dictionaries");
			const t = ctx.locale.bind(NS);
			const controller = new KanyeCardController(ctx.settingsScope.bind({ namespace: KANYE_NS }));
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
					const sessions = ctx.get("sessions");
					try {
						sessions?.open?.(sessionId);
					} catch (error) {
						console.warn(`[ui-kanye-pet] open session ${sessionId} failed:`, error);
					}
				};
				window.addEventListener("dsh:open-session", onOpenSession);
				return () => {
					window.removeEventListener("dsh:open-session", onOpenSession);
				};
			}, "ui-kanye-pet: dsh:open-session jump");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map