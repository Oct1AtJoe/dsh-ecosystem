window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-theme-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/aurora.ts
		/** Alias-token overrides for the aurora theme (single values per token; the
		* theme pins its own color scheme, so one value per token is sufficient). */
		const AURORA_TOKENS = Object.freeze({
			"--dsw-alias-bg-base": "rgb(22, 19, 30)",
			"--dsw-alias-surface-glass-spot": "rgba(198, 184, 250, 0.25)",
			"--dsw-alias-bg-layer-1": "rgb(36, 28, 52)",
			"--dsw-alias-bg-layer-2": "rgb(42, 34, 60)",
			"--dsw-alias-bg-layer-3": "rgb(50, 40, 72)",
			"--dsw-alias-bg-module-platform": "rgb(40, 32, 56)",
			"--dsw-alias-bg-multi-select": "rgb(36, 28, 50)",
			"--dsw-alias-bg-overlay": "rgb(62, 50, 90)",
			"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.5)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.2)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(28, 22, 44, 0.7)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.1)",
			"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.14)",
			"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.18)",
			"--dsw-alias-brand-primary": "rgb(198, 184, 250)",
			"--dsw-alias-brand-primary-invert": "rgb(237, 233, 251)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(155, 138, 245)",
			"--dsw-alias-brand-text": "rgb(198, 184, 250)",
			"--dsw-alias-button-contrast-fill": "rgb(198, 184, 250)",
			"--dsw-alias-button-elevated-fill": "rgb(42, 34, 60)",
			"--dsw-alias-button-floating-fill": "rgb(42, 34, 60)",
			"--dsw-alias-button-floating-hover": "rgb(50, 40, 72)",
			"--dsw-alias-button-ghost-active-border": "rgb(111, 101, 149)",
			"--dsw-alias-button-ghost-active-fill": "rgb(43, 38, 64)",
			"--dsw-alias-button-ghost-active-hover": "rgb(51, 44, 76)",
			"--dsw-alias-button-info-fill": "rgb(155, 138, 245)",
			"--dsw-alias-button-info-hover": "rgb(136, 119, 235)",
			"--dsw-alias-button-primary-dimmed": "rgb(43, 36, 64)",
			"--dsw-alias-button-primary-fill": "rgb(198, 184, 250)",
			"--dsw-alias-button-primary-hover": "rgb(180, 163, 247)",
			"--dsw-alias-button-tool-bar-fill": "rgba(40, 33, 64, 0.5)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(31, 31, 31, 0.36)",
			"--dsw-alias-button-tool-bar-hover": "rgba(40, 33, 64, 0.6)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.12)",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.07)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(155, 138, 245, 0.2)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.15)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(43, 38, 64)",
			"--dsw-alias-label-caption": "rgb(136, 128, 159)",
			"--dsw-alias-label-dimmed": "rgb(92, 84, 115)",
			"--dsw-alias-label-primary-bluish": "rgb(239, 235, 249)",
			"--dsw-alias-label-primary-dimmed": "rgb(233, 228, 247)",
			"--dsw-alias-label-primary-foreground": "rgb(20, 16, 34)",
			"--dsw-alias-label-primary-inverted": "rgb(30, 26, 48)",
			"--dsw-alias-label-primary": "rgb(242, 239, 250)",
			"--dsw-alias-label-secondary": "rgb(191, 183, 214)",
			"--dsw-alias-label-tertiary": "rgb(148, 140, 176)",
			"--dsw-alias-markdown-citation": "rgb(36, 31, 51)",
			"--dsw-alias-markdown-code-block-banner": "rgb(24, 20, 33)",
			"--dsw-alias-markdown-code-block": "rgb(26, 22, 38)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(43, 38, 64)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(26, 22, 38)",
			"--dsw-alias-markdown-inline-code": "rgb(36, 31, 51)",
			"--dsw-alias-markdown-placeholder": "rgb(32, 28, 44)",
			"--dsw-alias-markdown-tag": "rgb(36, 31, 51)",
			"--dsw-alias-scrollbar-bg-l1": "rgb(46, 40, 64)",
			"--dsw-alias-scrollbar-bg-l2": "rgb(57, 50, 81)",
			"--dsw-alias-scrollbar-hover-l1": "rgb(57, 50, 81)",
			"--dsw-alias-scrollbar-hover-l2": "rgb(74, 64, 112)",
			"--dsw-alias-state-business-primary": "rgb(155, 138, 245)",
			"--dsw-alias-state-business-tertiary": "rgb(44, 36, 64)",
			"--dsw-alias-toast-bg": "rgb(56, 48, 82)",
			"--dsw-alias-tooltip-bg": "rgb(62, 54, 96)",
			"--dsw-specific-bubble-highlight": "rgb(53, 45, 80)",
			"--dsw-specific-bubble": "rgb(38, 33, 51)",
			"--dsw-specific-input-major": "rgb(29, 25, 41)",
			"--dsw-specific-login-input": "rgb(26, 22, 38)",
			"--dsw-specific-selector": "rgb(34, 29, 48)",
			"--dsw-specific-sidebar-fill": "rgb(30, 22, 48)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(43, 36, 64)",
			"--dsw-specific-sidebar-nav-item-active": "rgb(38, 32, 50)",
			"--dsw-specific-sidebar-nav-item-hover": "rgb(31, 26, 45)",
			"--dsw-specific-tip": "rgb(31, 27, 44)"
		});
		//#endregion
		//#region src/client/nebula.ts
		/** Alias-token overrides for the nebula theme. */
		const NEBULA_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(148, 163, 255, 0.1), rgba(148, 163, 255, 0) 26%),radial-gradient(1100px 560px at 88% -12%, rgba(91, 108, 255, 0.28), transparent 62%),radial-gradient(1000px 560px at 4% 34%, rgba(139, 92, 246, 0.3), transparent 60%),radial-gradient(900px 520px at 50% 46%, rgba(122, 108, 255, 0.26), transparent 62%),radial-gradient(900px 500px at 52% 96%, rgba(79, 70, 229, 0.2), transparent 62%)",
			"--dsw-alias-glass-blur": "blur(20px) saturate(1.25)",
			"--dsw-alias-bg-base": "rgb(11, 13, 25)",
			"--dsw-alias-surface-glass-spot": "rgba(139, 92, 246, 0.28)",
			"--dsw-alias-bg-layer-1": "rgb(28, 32, 60)",
			"--dsw-alias-bg-layer-2": "rgb(34, 38, 68)",
			"--dsw-alias-bg-layer-3": "rgb(40, 44, 78)",
			"--dsw-alias-bg-module-platform": "rgb(30, 36, 64)",
			"--dsw-alias-bg-multi-select": "rgba(24, 27, 51, 0.8)",
			"--dsw-alias-bg-overlay": "rgb(52, 58, 100)",
			"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.26)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.2)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(12, 13, 26, 0.7)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.1)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.12)",
			"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.1)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.1)",
			"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.16)",
			"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.2)",
			"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.26)",
			"--dsw-alias-brand-primary": "rgb(168, 190, 255)",
			"--dsw-alias-brand-primary-invert": "rgb(232, 238, 255)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(122, 144, 255)",
			"--dsw-alias-brand-text": "rgb(168, 190, 255)",
			"--dsw-alias-button-contrast-fill": "rgb(168, 190, 255)",
			"--dsw-alias-button-elevated-fill": "rgb(24, 27, 51)",
			"--dsw-alias-button-floating-fill": "rgb(24, 27, 51)",
			"--dsw-alias-button-floating-hover": "rgb(31, 34, 63)",
			"--dsw-alias-button-ghost-active-border": "rgb(106, 118, 190)",
			"--dsw-alias-button-ghost-active-fill": "rgb(31, 34, 63)",
			"--dsw-alias-button-ghost-active-hover": "rgb(37, 41, 76)",
			"--dsw-alias-button-info-fill": "rgb(122, 144, 255)",
			"--dsw-alias-button-info-hover": "rgb(104, 128, 246)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(110, 120, 255, 0.6), rgba(76, 94, 246, 0.38) 55%, rgba(139, 92, 246, 0.5))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(126, 134, 255, 0.72), rgba(92, 110, 255, 0.46) 55%, rgba(150, 104, 255, 0.6))",
			"--dsw-alias-button-radius": "10px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(135deg, rgba(122, 144, 255, 0.4), rgba(91, 106, 245, 0.2) 50%, rgba(139, 92, 246, 0.36))",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(135deg, rgba(134, 156, 255, 0.5), rgba(104, 118, 255, 0.3) 50%, rgba(150, 104, 255, 0.44))",
			"--dsw-alias-button-primary-bg-size": "200% 100%",
			"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
			"--dsw-alias-button-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 1px rgba(168, 190, 255, 0.3),0 0 18px rgba(104, 118, 255, 0.45), 0 8px 28px rgba(91, 106, 245, 0.4)",
			"--dsw-alias-button-glow-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 1px rgba(196, 210, 255, 0.45),0 0 24px rgba(122, 144, 255, 0.6), 0 12px 36px rgba(104, 118, 255, 0.55)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(168, 190, 255, 0.18),0 4px 12px rgba(91, 106, 245, 0.25)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0 0 1px rgba(168, 190, 255, 0.32),0 6px 18px rgba(91, 106, 245, 0.22)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(32, 36, 70)",
			"--dsw-alias-button-primary-fill": "rgb(91, 106, 245)",
			"--dsw-alias-button-primary-hover": "rgb(104, 118, 255)",
			"--dsw-alias-button-tool-bar-fill": "rgba(33, 37, 68, 0.64)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(31, 31, 31, 0.42)",
			"--dsw-alias-button-tool-bar-hover": "rgba(33, 37, 68, 0.72)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.12)",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.07)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(122, 144, 255, 0.18)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.15)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(31, 34, 63)",
			"--dsw-alias-label-caption": "rgb(129, 138, 178)",
			"--dsw-alias-label-dimmed": "rgb(86, 93, 130)",
			"--dsw-alias-label-primary-bluish": "rgb(230, 235, 255)",
			"--dsw-alias-label-primary-dimmed": "rgb(224, 229, 252)",
			"--dsw-alias-label-primary-foreground": "rgb(245, 246, 255)",
			"--dsw-alias-label-primary-inverted": "rgb(30, 33, 62)",
			"--dsw-alias-label-primary": "rgb(236, 240, 255)",
			"--dsw-alias-label-secondary": "rgb(185, 192, 224)",
			"--dsw-alias-label-tertiary": "rgb(140, 148, 186)",
			"--dsw-alias-markdown-citation": "rgb(24, 27, 51)",
			"--dsw-alias-markdown-code-block-banner": "rgb(16, 18, 34)",
			"--dsw-alias-markdown-code-block": "rgb(17, 19, 36)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(31, 34, 63)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(17, 19, 36)",
			"--dsw-alias-markdown-inline-code": "rgb(24, 27, 51)",
			"--dsw-alias-markdown-placeholder": "rgb(22, 24, 46)",
			"--dsw-alias-markdown-tag": "rgb(24, 27, 51)",
			"--dsw-alias-scrollbar-bg-l1": "rgb(40, 44, 80)",
			"--dsw-alias-scrollbar-bg-l2": "rgb(52, 58, 104)",
			"--dsw-alias-scrollbar-hover-l1": "rgb(52, 58, 104)",
			"--dsw-alias-scrollbar-hover-l2": "rgb(62, 70, 124)",
			"--dsw-alias-state-business-primary": "rgb(122, 144, 255)",
			"--dsw-alias-state-business-tertiary": "rgb(30, 35, 66)",
			"--dsw-alias-toast-bg": "rgba(47, 52, 96, 0.88)",
			"--dsw-alias-tooltip-bg": "rgba(54, 60, 110, 0.9)",
			"--dsw-specific-bubble-highlight": "rgba(43, 47, 88, 0.84)",
			"--dsw-specific-bubble": "rgba(30, 34, 63, 0.78)",
			"--dsw-specific-input-major": "rgba(20, 23, 44, 0.74)",
			"--dsw-specific-login-input": "rgb(16, 18, 36)",
			"--dsw-specific-selector": "rgba(28, 32, 59, 0.82)",
			"--dsw-specific-sidebar-fill": "rgb(22, 28, 56)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(36, 40, 76)",
			"--dsw-specific-sidebar-nav-item-active": "rgb(31, 34, 63)",
			"--dsw-specific-sidebar-nav-item-hover": "rgb(26, 29, 54)",
			"--dsw-specific-tip": "rgba(24, 27, 51, 0.8)"
		});
		//#endregion
		//#region src/client/void.ts
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
			"--dsw-specific-tip": "rgba(24, 24, 30, 0.78)"
		});
		//#endregion
		//#region src/client/jade.ts
		/** Alias-token overrides for the jade theme. */
		const JADE_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(130, 210, 170, 0.08), rgba(130, 210, 170, 0) 24%),radial-gradient(560px 420px at 76% 14%, rgba(160, 226, 192, 0.26), transparent 55%),radial-gradient(540px 420px at 7% 55%, rgba(130, 210, 170, 0.22), transparent 52%)",
			"--dsw-alias-glass-blur": "blur(20px) saturate(1.20)",
			"--dsw-alias-surface-glass-blur": "blur(12px) saturate(1.0)",
			"--dsw-alias-bg-base": "rgb(10, 18, 14)",
			"--dsw-alias-surface-glass-spot": "rgba(160, 226, 192, 0.28)",
			"--dsw-alias-bg-layer-1": "rgb(20, 38, 28)",
			"--dsw-alias-bg-layer-2": "rgb(26, 44, 34)",
			"--dsw-alias-bg-layer-3": "rgb(32, 52, 40)",
			"--dsw-alias-bg-module-platform": "rgb(26, 42, 32)",
			"--dsw-alias-bg-multi-select": "rgb(22, 36, 28)",
			"--dsw-alias-bg-overlay": "rgb(44, 64, 52)",
			"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.26)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.20)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(8, 14, 10, 0.70)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.14)",
			"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
			"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.24)",
			"--dsw-alias-brand-primary": "rgb(130, 210, 170)",
			"--dsw-alias-brand-primary-invert": "rgb(220, 245, 234)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(90, 180, 140)",
			"--dsw-alias-brand-text": "rgb(130, 210, 170)",
			"--dsw-alias-button-contrast-fill": "rgb(130, 210, 170)",
			"--dsw-alias-button-elevated-fill": "rgb(22, 36, 28)",
			"--dsw-alias-button-floating-fill": "rgb(22, 36, 28)",
			"--dsw-alias-button-floating-hover": "rgb(28, 46, 36)",
			"--dsw-alias-button-ghost-active-border": "rgb(82, 140, 110)",
			"--dsw-alias-button-ghost-active-fill": "rgb(28, 46, 36)",
			"--dsw-alias-button-ghost-active-hover": "rgb(34, 54, 42)",
			"--dsw-alias-button-info-fill": "rgb(90, 180, 140)",
			"--dsw-alias-button-info-hover": "rgb(72, 164, 124)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(80, 190, 140, 0.50), rgba(50, 150, 100, 0.32) 55%, rgba(70, 170, 120, 0.44))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(92, 204, 154, 0.62), rgba(62, 164, 112, 0.40) 55%, rgba(82, 184, 134, 0.54))",
			"--dsw-alias-button-radius": "10px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(135deg, rgba(90, 180, 140, 0.34), rgba(60, 140, 100, 0.18) 50%, rgba(78, 160, 120, 0.30))",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(135deg, rgba(104, 194, 154, 0.44), rgba(72, 154, 114, 0.26) 50%, rgba(92, 172, 132, 0.38))",
			"--dsw-alias-button-primary-bg-size": "200% 100%",
			"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
			"--dsw-alias-button-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 0 0 1px rgba(130, 210, 170, 0.22),0 0 14px rgba(80, 180, 130, 0.30), 0 8px 28px rgba(60, 140, 100, 0.28)",
			"--dsw-alias-button-glow-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.34), 0 0 0 1px rgba(154, 224, 190, 0.36),0 0 20px rgba(100, 194, 150, 0.44), 0 12px 36px rgba(72, 154, 114, 0.40)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 0 1px rgba(130, 210, 170, 0.14),0 4px 12px rgba(60, 140, 100, 0.18)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(130, 210, 170, 0.26),0 6px 18px rgba(60, 140, 100, 0.16)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(28, 44, 34)",
			"--dsw-alias-button-primary-fill": "rgb(60, 140, 100)",
			"--dsw-alias-button-primary-hover": "rgb(72, 154, 114)",
			"--dsw-alias-button-tool-bar-fill": "rgba(30, 48, 38, 0.64)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(26, 38, 30, 0.42)",
			"--dsw-alias-button-tool-bar-hover": "rgba(30, 48, 38, 0.72)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(90, 180, 140, 0.16)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.14)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(28, 46, 36)",
			"--dsw-alias-label-caption": "rgb(120, 174, 148)",
			"--dsw-alias-label-dimmed": "rgb(78, 124, 104)",
			"--dsw-alias-label-primary-bluish": "rgb(226, 244, 236)",
			"--dsw-alias-label-primary-dimmed": "rgb(218, 240, 230)",
			"--dsw-alias-label-primary-foreground": "rgb(240, 250, 246)",
			"--dsw-alias-label-primary-inverted": "rgb(22, 38, 30)",
			"--dsw-alias-label-primary": "rgb(236, 246, 242)",
			"--dsw-alias-label-secondary": "rgb(186, 214, 200)",
			"--dsw-alias-label-tertiary": "rgb(146, 178, 164)",
			"--dsw-alias-markdown-citation": "rgb(22, 36, 28)",
			"--dsw-alias-markdown-code-block-banner": "rgb(14, 22, 18)",
			"--dsw-alias-markdown-code-block": "rgb(16, 24, 20)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(28, 44, 34)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(16, 24, 20)",
			"--dsw-alias-markdown-inline-code": "rgb(22, 36, 28)",
			"--dsw-alias-markdown-placeholder": "rgb(20, 30, 24)",
			"--dsw-alias-markdown-tag": "rgb(22, 36, 28)",
			"--dsw-alias-scrollbar-bg-l1": "rgb(40, 64, 52)",
			"--dsw-alias-scrollbar-bg-l2": "rgb(50, 80, 64)",
			"--dsw-alias-scrollbar-hover-l1": "rgb(50, 80, 64)",
			"--dsw-alias-scrollbar-hover-l2": "rgb(62, 96, 78)",
			"--dsw-alias-state-business-primary": "rgb(90, 180, 140)",
			"--dsw-alias-state-business-tertiary": "rgb(28, 46, 36)",
			"--dsw-alias-toast-bg": "rgba(40, 64, 50, 0.88)",
			"--dsw-alias-tooltip-bg": "rgba(48, 74, 58, 0.90)",
			"--dsw-specific-bubble-highlight": "rgba(38, 58, 48, 0.84)",
			"--dsw-specific-bubble": "rgba(28, 44, 34, 0.78)",
			"--dsw-specific-input-major": "rgba(16, 28, 22, 0.74)",
			"--dsw-specific-login-input": "rgb(14, 22, 18)",
			"--dsw-specific-selector": "rgba(24, 38, 30, 0.82)",
			"--dsw-specific-sidebar-fill": "rgb(16, 36, 26)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(32, 52, 40)",
			"--dsw-specific-sidebar-nav-item-active": "rgb(28, 46, 36)",
			"--dsw-specific-sidebar-nav-item-hover": "rgb(24, 38, 30)",
			"--dsw-specific-tip": "rgba(22, 36, 28, 0.80)"
		});
		//#endregion
		//#region src/client/solar.ts
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
			"--dsw-specific-tip": "rgba(38, 30, 32, 0.80)"
		});
		//#endregion
		//#region src/client/glacial.ts
		/** Alias-token overrides for the glacial theme. */
		const GLACIAL_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(150, 210, 245, 0.08), rgba(150, 210, 245, 0) 24%),radial-gradient(560px 420px at 82% 20%, rgba(182, 226, 250, 0.26), transparent 55%),radial-gradient(540px 420px at 9% 50%, rgba(150, 210, 245, 0.22), transparent 52%)",
			"--dsw-alias-glass-blur": "blur(20px) saturate(1.25)",
			"--dsw-alias-surface-glass-blur": "blur(12px) saturate(1.0)",
			"--dsw-alias-bg-base": "rgb(10, 12, 22)",
			"--dsw-alias-surface-glass-spot": "rgba(182, 226, 250, 0.28)",
			"--dsw-alias-bg-layer-1": "rgb(18, 24, 44)",
			"--dsw-alias-bg-layer-2": "rgb(24, 30, 50)",
			"--dsw-alias-bg-layer-3": "rgb(30, 36, 58)",
			"--dsw-alias-bg-module-platform": "rgb(26, 32, 52)",
			"--dsw-alias-bg-multi-select": "rgb(22, 28, 46)",
			"--dsw-alias-bg-overlay": "rgb(44, 52, 78)",
			"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.26)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.20)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(8, 10, 18, 0.70)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.14)",
			"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
			"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.24)",
			"--dsw-alias-brand-primary": "rgb(150, 210, 245)",
			"--dsw-alias-brand-primary-invert": "rgb(226, 242, 252)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(100, 180, 230)",
			"--dsw-alias-brand-text": "rgb(150, 210, 245)",
			"--dsw-alias-button-contrast-fill": "rgb(150, 210, 245)",
			"--dsw-alias-button-elevated-fill": "rgb(22, 26, 44)",
			"--dsw-alias-button-floating-fill": "rgb(22, 26, 44)",
			"--dsw-alias-button-floating-hover": "rgb(28, 34, 56)",
			"--dsw-alias-button-ghost-active-border": "rgb(80, 140, 180)",
			"--dsw-alias-button-ghost-active-fill": "rgb(28, 34, 56)",
			"--dsw-alias-button-ghost-active-hover": "rgb(34, 42, 66)",
			"--dsw-alias-button-info-fill": "rgb(100, 180, 230)",
			"--dsw-alias-button-info-hover": "rgb(80, 164, 216)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(100, 190, 240, 0.50), rgba(60, 150, 210, 0.32) 55%, rgba(80, 170, 226, 0.44))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(114, 202, 248, 0.62), rgba(74, 164, 222, 0.40) 55%, rgba(94, 184, 238, 0.54))",
			"--dsw-alias-button-radius": "10px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(135deg, rgba(100, 180, 230, 0.34), rgba(60, 140, 200, 0.18) 50%, rgba(80, 164, 216, 0.30))",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(135deg, rgba(114, 194, 242, 0.44), rgba(74, 154, 212, 0.26) 50%, rgba(94, 178, 228, 0.38))",
			"--dsw-alias-button-primary-bg-size": "200% 100%",
			"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
			"--dsw-alias-button-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 0 0 1px rgba(150, 210, 245, 0.22),0 0 14px rgba(100, 180, 230, 0.30), 0 8px 28px rgba(60, 140, 200, 0.28)",
			"--dsw-alias-button-glow-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.34), 0 0 0 1px rgba(170, 222, 250, 0.36),0 0 20px rgba(120, 194, 240, 0.44), 0 12px 36px rgba(74, 154, 212, 0.40)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 0 1px rgba(150, 210, 245, 0.14),0 4px 12px rgba(60, 140, 200, 0.18)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(150, 210, 245, 0.26),0 6px 18px rgba(60, 140, 200, 0.16)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(28, 34, 54)",
			"--dsw-alias-button-primary-fill": "rgb(60, 140, 200)",
			"--dsw-alias-button-primary-hover": "rgb(74, 154, 212)",
			"--dsw-alias-button-tool-bar-fill": "rgba(30, 36, 58, 0.64)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(24, 28, 44, 0.42)",
			"--dsw-alias-button-tool-bar-hover": "rgba(30, 36, 58, 0.72)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(100, 180, 230, 0.16)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.14)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(28, 34, 56)",
			"--dsw-alias-label-caption": "rgb(130, 172, 200)",
			"--dsw-alias-label-dimmed": "rgb(86, 122, 150)",
			"--dsw-alias-label-primary-bluish": "rgb(230, 242, 250)",
			"--dsw-alias-label-primary-dimmed": "rgb(224, 238, 248)",
			"--dsw-alias-label-primary-foreground": "rgb(244, 248, 252)",
			"--dsw-alias-label-primary-inverted": "rgb(20, 26, 44)",
			"--dsw-alias-label-primary": "rgb(238, 244, 250)",
			"--dsw-alias-label-secondary": "rgb(190, 210, 226)",
			"--dsw-alias-label-tertiary": "rgb(148, 172, 192)",
			"--dsw-alias-markdown-citation": "rgb(22, 26, 44)",
			"--dsw-alias-markdown-code-block-banner": "rgb(14, 16, 28)",
			"--dsw-alias-markdown-code-block": "rgb(16, 18, 30)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(28, 34, 54)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(16, 18, 30)",
			"--dsw-alias-markdown-inline-code": "rgb(22, 26, 44)",
			"--dsw-alias-markdown-placeholder": "rgb(20, 22, 36)",
			"--dsw-alias-markdown-tag": "rgb(22, 26, 44)",
			"--dsw-alias-scrollbar-bg-l1": "rgb(40, 48, 72)",
			"--dsw-alias-scrollbar-bg-l2": "rgb(50, 60, 90)",
			"--dsw-alias-scrollbar-hover-l1": "rgb(50, 60, 90)",
			"--dsw-alias-scrollbar-hover-l2": "rgb(62, 74, 108)",
			"--dsw-alias-state-business-primary": "rgb(100, 180, 230)",
			"--dsw-alias-state-business-tertiary": "rgb(28, 34, 56)",
			"--dsw-alias-toast-bg": "rgba(42, 48, 74, 0.88)",
			"--dsw-alias-tooltip-bg": "rgba(50, 58, 86, 0.90)",
			"--dsw-specific-bubble-highlight": "rgba(38, 46, 68, 0.84)",
			"--dsw-specific-bubble": "rgba(28, 34, 54, 0.78)",
			"--dsw-specific-input-major": "rgba(16, 20, 36, 0.74)",
			"--dsw-specific-login-input": "rgb(14, 16, 28)",
			"--dsw-specific-selector": "rgba(24, 28, 48, 0.82)",
			"--dsw-specific-sidebar-fill": "rgb(16, 22, 44)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(32, 38, 62)",
			"--dsw-specific-sidebar-nav-item-active": "rgb(28, 34, 56)",
			"--dsw-specific-sidebar-nav-item-hover": "rgb(24, 28, 48)",
			"--dsw-specific-tip": "rgba(22, 26, 44, 0.80)"
		});
		//#endregion
		//#region src/client/locales.ts
		/**
		* Tech-theme row dictionaries. A separate namespace from the official
		* 'settings.theme' pair: this plugin owns its own cubes' copy.
		*/
		const zh = {
			"tech-theme.title": "科技主题",
			"tech-theme.aurora": "极光",
			"tech-theme.nebula": "星云",
			"tech-theme.void": "冥夜",
			"tech-theme.jade": "翠渊",
			"tech-theme.solar": "灼日",
			"tech-theme.glacial": "寒渊"
		};
		/** English dictionary checked against the Chinese key set. */
		const en = {
			"tech-theme.title": "Tech themes",
			"tech-theme.aurora": "Aurora",
			"tech-theme.nebula": "Nebula",
			"tech-theme.void": "Void",
			"tech-theme.jade": "Jade",
			"tech-theme.solar": "Solar",
			"tech-theme.glacial": "Glacial"
		};
		//#endregion
		//#region src/client/settings-store.ts
		/**
		* Tech-theme row slot store: a mirror of the theme service snapshot, exactly
		* like the official Appearance row's store. The plugin's apply-world change
		* listener is the only writer; the row component reads via props.useStore.
		*/
		/**
		* Declares the tech-theme row state and write surface.
		* @returns the store handle.
		*/
		function createTechThemeStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({
					preference: "system",
					revision: -1
				}),
				actions: { sync: (d, preference, revision) => {
					if (revision <= d.revision) return;
					d.preference = preference;
					d.revision = revision;
				} }
			});
		}
		//#endregion
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
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\TechThemeRow.module.css.mjs
		const css = ".bNLuYa_group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:16px 0;display:flex}.bNLuYa_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.bNLuYa_cubeRow{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}.bNLuYa_themeCube{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:16px;flex-direction:column;flex:180px;justify-content:center;align-items:center;gap:4px;padding:20px 32px;font-size:14px;line-height:22px;display:flex}.bNLuYa_themeCube:hover:not(.bNLuYa_selected){background:var(--dsw-alias-interactive-bg-hover)}.bNLuYa_selected{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-static-neutral-bluish-400)}";
		const tagId = "@deepseek-ai/dsh-client-ui-theme-custom/TechThemeRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-theme-custom";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TechThemeRow_module_css_default = {
			"cubeRow": "bNLuYa_cubeRow",
			"group": "bNLuYa_group",
			"selected": "bNLuYa_selected",
			"themeCube": "bNLuYa_themeCube",
			"title": "bNLuYa_title"
		};
		//#endregion
		//#region src/client/TechThemeRow.tsx
		/**
		* Tech-theme preference row registered into the General section item slot
		* beside the official Appearance row (id `appearance-custom`, after it).
		* Two cubes — aurora and nebula — rendered only when this plugin mounts, so
		* the official ui-theme package never references the custom theme ids.
		* Selection follows the persisted preference, never the resolved active
		* theme; the ids persist through the official settings scope because
		* `THEME_PREFERENCES` includes them.
		*/
		/** Locale namespace registered by this plugin (see src/client/index.ts). */
		const SETTINGS_NS = "settings.theme.custom";
		/** Cube order and icons. Id must match a registered theme id. */
		const CUBES = [
			{
				id: "aurora",
				labelKey: "tech-theme.aurora",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconSparkle16
			},
			{
				id: "nebula",
				labelKey: "tech-theme.nebula",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconThinkOutline16
			},
			{
				id: "void",
				labelKey: "tech-theme.void",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconAgentPresetOutline16
			},
			{
				id: "jade",
				labelKey: "tech-theme.jade",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconBrowseOutline16
			},
			{
				id: "solar",
				labelKey: "tech-theme.solar",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconGoalOutline16
			},
			{
				id: "glacial",
				labelKey: "tech-theme.glacial",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconEnhanceOutline16
			}
		];
		/**
		* Render the tech-theme row.
		* @param props - composed slot props.
		* @returns the row element tree.
		*/
		function TechThemeRow({ t, setTheme, useStore }) {
			const preference = useStore((s) => s.preference);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: TechThemeRow_module_css_default.group,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: TechThemeRow_module_css_default.title,
					children: t("tech-theme.title")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: TechThemeRow_module_css_default.cubeRow,
					children: CUBES.map(({ id, labelKey, Icon }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: clsx(TechThemeRow_module_css_default.themeCube, preference === id && TechThemeRow_module_css_default.selected),
						"aria-pressed": preference === id,
						onClick: () => {
							setTheme(id);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, {}), t(labelKey)]
					}, id))
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Aurora: the violet variant — alias-token overrides over the dark base palette. */
		const AURORA = Object.freeze({
			id: "aurora",
			colorScheme: "dark",
			tokens: AURORA_TOKENS
		});
		/** Nebula: the deep-space tech variant — matte acrylic surfaces + gradient buttons. */
		const NEBULA = Object.freeze({
			id: "nebula",
			colorScheme: "dark",
			tokens: NEBULA_TOKENS
		});
		/** Void: the volcanic-ash dark variant — warm charcoal frosted glass. */
		const VOID = Object.freeze({
			id: "void",
			colorScheme: "dark",
			tokens: VOID_TOKENS
		});
		/** Jade: the emerald-green variant — deep forest-teal frosted glass. */
		const JADE = Object.freeze({
			id: "jade",
			colorScheme: "dark",
			tokens: JADE_TOKENS
		});
		/** Solar: the amber-orange variant — warm glowing frosted glass. */
		const SOLAR = Object.freeze({
			id: "solar",
			colorScheme: "dark",
			tokens: SOLAR_TOKENS
		});
		/** Glacial: the ice-blue variant — cold arctic frosted glass. */
		const GLACIAL = Object.freeze({
			id: "glacial",
			colorScheme: "dark",
			tokens: GLACIAL_TOKENS
		});
		/** Surface-glass CSS injected so sidebar, details, and bubbles get
		* backdrop-filter without modifying the host panel CSS (avoids
		* the fixed-positioned child constraint by using ::before pseudo-elements,
		* which are not DOM ancestors and therefore don't create a containing
		* block for position:fixed descendants).
		* Selectors use [class*="..."] to match CSS Modules hashed class names. */
		const SURFACE_GLASS_CSS = `
/* Glass feel via translucent surfaces letting the aurora pools shine
   through — no backdrop-filter (it blurs the pools into invisibility).
   Panels keep their own rgba fills and the frame/root gradients show
   through the alpha, which is the DSH web glass recipe.

   Conversation root: show the aurora
   pools DIRECTLY on the conversation surface, so the main chat area has a
   clearly visible glass backplate without relying on translucency alone. (The
   frame keeps its native uniform dark background so overlaid dialogs don't
   reveal a patterned backdrop through their own translucency.) */
[class$="centerCol"] > :first-child > [class$="_root"]{
  background:var(--dsw-alias-bg-app-image),var(--dsw-alias-bg-base) !important;
}

/* Sidebar column: transparent base so the sidebar's own glass backdrop
   shows through the alpha — the column wrapper no longer paints a solid
   fill that would block the frosted-glass effect underneath. */
[class$="sidebarCol"]{
  position:relative;z-index:0;background:transparent !important;
}
[class$="sidebarCol"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  backdrop-filter:var(--dsw-alias-glass-blur,none);
}
[class$="sidebarCol"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 12% 38%, var(--dsw-alias-surface-glass-spot, rgba(200,192,214,0.16)), transparent 56%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.04),inset 0 0 0 1px rgba(255,255,255,0.02);
}

/* Sidebar root: composite glass surface — radial inner glow (brighter
   center → dark edge) simulates depth, the diagonal sheen mimics a light
   reflection, and the semi-transparent fill keeps the sidebar distinct
   from the frame behind it. Glow and sheen ride the theme's
   --dsw-alias-surface-glass-spot (color-mixed down to the old white
   intensities) so both sidebars tint with the active theme. */
[class$="sidebarCol"] > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 72%, transparent) !important;
  backdrop-filter:blur(8px) !important;
}

/* better-sidebar's pane sits OUTSIDE the frame (x > frame width), so no
   frame pool shines behind it — give the pane its own soft light layer
   via ::after so the translucent fill has glass-like pools, matching
   the left sidebar. */
[class$="_pane"]{
  background-color:var(--dsw-alias-bg-base) !important;
  position:relative;z-index:0;
}
[class$="_pane"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 78% 68%, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.16)), transparent 56%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),inset 0 0 0 1px rgba(255,255,255,0.03);
}

/* All primary action buttons (Button variant="primary"): gradient glass
   fill with glow — covers send/stop in composer, dialog confirm/enable
   (RiskConfirmation, Modal footer), settings Done (plugin popups), and
   any other <Button variant="primary"> throughout the UI.
   [class*="_primary"] matches BOTH CSS Modules hash conventions:
   composer's "<hash>_primary" (ends with _primary) and ui-primitives'
   "_primary_<hash>_<id>" (underscore-prefixed, class in the middle). */
[class*="_primary"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
}
[class*="_primary"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}

/* Git commit button (dsh-better-sidebar .gitCommitButton, hashed as
   "<hash>_gitCommitButton"): same gradient glass recipe as the primary
   action buttons — the plugin paints it with the flat primary-fill token,
   so it needs its own rule. Color is overridden to the primary foreground
   (light) because the plugin's own label-primary-inverted token is dark
   and would vanish on the semi-transparent glass gradient. */
[class*="gitCommitButton"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
  color:var(--dsw-alias-label-primary-foreground) !important;
}
[class*="gitCommitButton"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}

/* Settings/dialog full-viewport layer (the .overlay box, marked
   role="presentation", whose child is the role="dialog" panel): force a
   standalone stacking context at the top of the page so the dialog never
   competes with the message-nav rail (z 1001), sticky composer, or the
   conversation trace — a structural fix that lives with the theme, not the
   host package. Portal menus (settings language/permission selects, z 1100)
   would lose to a max overlay on z-index alone, so they get the same max
   value below: both are root-level layers and menus mount into <body> AFTER
   the overlay, so the equal z-index resolves in the menu's favor (later DOM
   order wins). */
/* Settings/dialog: raise above third-party plugin layers, but never to the
   int32 max. A max z-index on the dialog makes every "plausible" plugin
   layer lose — dsh-market's preview lightbox (z 10000, explicitly designed
   to out-rank any plausible dialog) was buried behind the settings panel.
   The 9500 cap sits above the message-nav rail (1001), sticky composer, and
   Radix popovers (1100) while staying below the market lightbox. */
[role="presentation"]:has(> [role="dialog"]){
  z-index:9500 !important;
  isolation:isolate !important;
}
[role="menu"]{
  z-index:9501 !important;
}
/* The settings portal mounts INSIDE the sidebar column (sidebarCol), which
   is a position:relative z-index:0 stacking context — the message layer
   (z 20) competes against the column at the frame level, so any z-index on
   the dialog itself loses regardless of its value. Lift the whole sidebar
   column while a dialog is open: the column and the dialog do not overlap,
   so there is no visual side effect, and the :has() reverts automatically
   when the dialog closes. A nested :has() cannot be used — Chromium rejects
   it as an invalid selector and silently drops the whole rule. */
[class$="_sidebarCol"]:has([role="dialog"]){
  z-index:9500 !important;
}

/* Dialogs/modals: frosted glass surface — the entire settings/modal glass
   look lives here so the theme owns the visual, not the host package.
   z-index and isolation live on .overlay above (structural, injected
   separately) so role=dialog keeps only visual tokens. */
[role="dialog"]{
  background:
    linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 30%),
    linear-gradient(0deg, rgba(10,11,16,0.25) 0%, transparent 45%),
    color-mix(in srgb, var(--dsw-alias-bg-layer-2) 85%, transparent) !important;
  backdrop-filter:blur(32px) saturate(1.05) !important;
  box-shadow:
    0 0 0 1px rgba(200,198,204,0.22),
    inset 0 1px 0 rgba(255,255,255,0.12),
    0 6px 16px rgba(0,0,0,0.40),
    0 24px 60px rgba(0,0,0,0.50) !important;
}
`;
		/** localStorage key for the user's custom theme preference. */
		const LS_KEY = "dsh-theme-preference";
		/** Stable marker attribute for the injected keyframes style. */
		const KEYFRAMES_ATTRIBUTE = "data-ui-theme-custom-keyframes";
		/** Button-drift keyframes the nebula motion token references. */
		const BUTTON_DRIFT_CSS = `@keyframes dsh-button-drift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}`;
		/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
		const inject = [
			"theme",
			"slots",
			"locale"
		];
		/**
		* Inject the keyframes style once; idempotent across HMR re-applies.
		* @returns disposer removing the style element.
		*/
		function injectButtonDrift() {
			if (typeof document === "undefined") return () => {};
			if (document.head.querySelector(`style[${KEYFRAMES_ATTRIBUTE}]`) !== null) return () => {};
			const tag = document.createElement("style");
			tag.setAttribute(KEYFRAMES_ATTRIBUTE, "");
			tag.textContent = BUTTON_DRIFT_CSS;
			document.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}
		/** Marker attribute for the injected surface-glass stylesheet. */
		const SURFACE_GLASS_ATTRIBUTE = "data-ui-theme-custom-surface-glass";
		/**
		* Inject the surface-glass stylesheet once; idempotent across HMR re-applies.
		* Uses ::before pseudo-elements so backdrop-filter doesn't create a containing
		* block for position:fixed children (tooltips, dialogs).
		* @returns disposer removing the style element.
		*/
		function injectSurfaceGlass() {
			if (typeof document === "undefined") return () => {};
			if (document.head.querySelector(`style[${SURFACE_GLASS_ATTRIBUTE}]`) !== null) return () => {};
			const tag = document.createElement("style");
			tag.setAttribute(SURFACE_GLASS_ATTRIBUTE, "");
			tag.textContent = SURFACE_GLASS_CSS;
			document.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}
		/** Theme id → tokens map for direct CSS-variable application. */
		const THEME_TOKEN_MAP = {
			aurora: AURORA_TOKENS,
			nebula: NEBULA_TOKENS,
			void: VOID_TOKENS,
			jade: JADE_TOKENS,
			solar: SOLAR_TOKENS,
			glacial: GLACIAL_TOKENS
		};
		/** Apply theme tokens as CSS variables on html + body (belt-and-suspenders). */
		function applyTokens(tokens) {
			if (typeof document === "undefined") return;
			for (const [key, value] of Object.entries(tokens)) {
				document.documentElement.style.setProperty(key, value);
				document.body.style.setProperty(key, value);
			}
		}
		/**
		* Client plugin body: register both themes and the drift keyframes, plus the
		* tech-theme row contribution, disposing everything with the fiber so HMR and
		* teardown never leave a stale theme, stylesheet, or row behind.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			/** Apply a custom theme via the theme service AND direct CSS variables. */
			const activateTheme = (id) => {
				const tokens = THEME_TOKEN_MAP[id];
				if (!tokens) return;
				try {
					ctx.theme.setTheme(id);
				} catch {}
				applyTokens(tokens);
				try {
					localStorage.setItem(LS_KEY, id);
				} catch {}
			};
			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "ui-theme-custom: row dictionaries");
			const store = createTechThemeStore();
			let bound;
			const sync = (snapshot) => {
				bound?.sync(snapshot.preference, snapshot.revision);
			};
			ctx.on("theme/change", sync);
			const injected = (actions) => {
				bound = actions;
				sync(ctx.theme.getTheme());
				return { setTheme: (id) => {
					activateTheme(id);
				} };
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "appearance-custom",
				order: 20,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, TechThemeRow));
			ctx.effect(() => {
				const disposeAurora = ctx.theme.register(AURORA);
				const disposeNebula = ctx.theme.register(NEBULA);
				const disposeVoid = ctx.theme.register(VOID);
				const disposeJade = ctx.theme.register(JADE);
				const disposeSolar = ctx.theme.register(SOLAR);
				const disposeGlacial = ctx.theme.register(GLACIAL);
				const removeKeyframes = injectButtonDrift();
				const removeSurfaceGlass = injectSurfaceGlass();
				return () => {
					disposeAurora();
					disposeNebula();
					disposeVoid();
					disposeJade();
					disposeSolar();
					disposeGlacial();
					removeKeyframes();
					removeSurfaceGlass();
				};
			}, "ui-theme-custom: tech theme registrations + drift keyframes + surface glass");
			try {
				const saved = typeof localStorage !== "undefined" && localStorage.getItem(LS_KEY);
				if (saved && saved !== "light" && saved !== "dark" && saved !== "system" && ctx.theme.getTheme().preference !== saved) activateTheme(saved);
			} catch {}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map