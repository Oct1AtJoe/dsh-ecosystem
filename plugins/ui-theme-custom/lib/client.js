window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-theme-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/mocha.ts
		const MOCHA_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(217, 145, 74, 0.08), rgba(20, 16, 14, 0) 24%),radial-gradient(560px 420px at 90% 18%, rgba(228, 160, 92, 0.22), transparent 55%),radial-gradient(540px 420px at 7% 42%, rgba(184, 118, 64, 0.18), transparent 52%)",
			"--dsw-alias-glass-blur": "blur(20px) saturate(1.20)",
			"--dsw-alias-surface-glass-blur": "blur(12px) saturate(1.0)",
			"--dsw-alias-bg-base": "rgb(20, 16, 14)",
			"--dsw-alias-surface-glass-spot": "rgba(228, 160, 92, 0.24)",
			"--dsw-alias-bg-layer-1": "rgb(34, 27, 23)",
			"--dsw-alias-bg-layer-2": "rgb(42, 33, 28)",
			"--dsw-alias-bg-layer-3": "rgb(50, 40, 34)",
			"--dsw-alias-bg-module-platform": "rgb(44, 35, 30)",
			"--dsw-alias-bg-multi-select": "rgb(38, 30, 26)",
			"--dsw-alias-bg-overlay": "rgba(58, 46, 39, 0.90)",
			"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.26)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.20)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(18, 14, 12, 0.70)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.14)",
			"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
			"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.24)",
			"--dsw-alias-brand-primary": "rgb(228, 160, 92)",
			"--dsw-alias-brand-primary-invert": "rgb(252, 238, 222)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(212, 140, 68)",
			"--dsw-alias-brand-text": "rgb(228, 160, 92)",
			"--dsw-alias-button-contrast-fill": "rgb(228, 160, 92)",
			"--dsw-alias-button-elevated-fill": "rgb(42, 33, 28)",
			"--dsw-alias-button-floating-fill": "rgb(42, 33, 28)",
			"--dsw-alias-button-floating-hover": "rgb(50, 40, 34)",
			"--dsw-alias-button-ghost-active-border": "rgb(168, 116, 68)",
			"--dsw-alias-button-ghost-active-fill": "rgb(48, 38, 32)",
			"--dsw-alias-button-ghost-active-hover": "rgb(56, 44, 38)",
			"--dsw-alias-button-info-fill": "rgb(228, 160, 92)",
			"--dsw-alias-button-info-hover": "rgb(212, 140, 68)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(228, 160, 92, 0.50), rgba(184, 118, 64, 0.32) 55%, rgba(206, 140, 78, 0.44))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(238, 172, 104, 0.62), rgba(198, 130, 74, 0.40) 55%, rgba(218, 152, 88, 0.54))",
			"--dsw-alias-button-radius": "10px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(135deg, rgba(212, 140, 68, 0.34), rgba(168, 106, 52, 0.18) 50%, rgba(194, 126, 62, 0.30))",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(135deg, rgba(226, 154, 80, 0.44), rgba(182, 118, 62, 0.26) 50%, rgba(208, 140, 74, 0.38))",
			"--dsw-alias-button-primary-bg-size": "200% 100%",
			"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
			"--dsw-alias-button-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 0 0 1px rgba(228, 160, 92, 0.22),0 0 14px rgba(212, 140, 68, 0.30), 0 8px 28px rgba(168, 106, 52, 0.28)",
			"--dsw-alias-button-glow-hover": "inset 0 1px 0 rgba(255, 255, 255, 0.34), 0 0 0 1px rgba(242, 180, 116, 0.36),0 0 20px rgba(226, 154, 80, 0.44), 0 12px 36px rgba(182, 118, 62, 0.40)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 0 1px rgba(228, 160, 92, 0.14),0 4px 12px rgba(168, 106, 52, 0.18)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(228, 160, 92, 0.26),0 6px 18px rgba(168, 106, 52, 0.16)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(48, 38, 32)",
			"--dsw-alias-button-primary-fill": "rgb(184, 118, 64)",
			"--dsw-alias-button-primary-hover": "rgb(198, 130, 74)",
			"--dsw-alias-button-tool-bar-fill": "rgba(46, 36, 30, 0.64)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(32, 26, 22, 0.42)",
			"--dsw-alias-button-tool-bar-hover": "rgba(46, 36, 30, 0.72)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(228, 160, 92, 0.16)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(242, 90, 90, 0.14)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(46, 36, 31)",
			"--dsw-alias-label-caption": "rgb(178, 154, 134)",
			"--dsw-alias-label-dimmed": "rgb(136, 114, 96)",
			"--dsw-alias-label-primary-bluish": "rgb(246, 240, 234)",
			"--dsw-alias-label-primary-dimmed": "rgb(240, 232, 224)",
			"--dsw-alias-label-primary-foreground": "rgb(252, 248, 244)",
			"--dsw-alias-label-primary-inverted": "rgb(34, 27, 23)",
			"--dsw-alias-label-primary": "rgb(246, 240, 234)",
			"--dsw-alias-label-secondary": "rgb(208, 194, 182)",
			"--dsw-alias-label-tertiary": "rgb(166, 150, 138)",
			"--dsw-alias-markdown-citation": "rgb(38, 30, 26)",
			"--dsw-alias-markdown-code-block-banner": "rgb(24, 19, 16)",
			"--dsw-alias-markdown-code-block": "rgb(26, 21, 18)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(48, 38, 32)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(26, 21, 18)",
			"--dsw-alias-markdown-inline-code": "rgb(38, 30, 26)",
			"--dsw-alias-markdown-placeholder": "rgb(32, 25, 21)",
			"--dsw-alias-markdown-tag": "rgb(38, 30, 26)",
			"--dsw-alias-scrollbar-bg-l1": "rgb(54, 43, 37)",
			"--dsw-alias-scrollbar-bg-l2": "rgb(66, 52, 45)",
			"--dsw-alias-scrollbar-hover-l1": "rgb(66, 52, 45)",
			"--dsw-alias-scrollbar-hover-l2": "rgb(80, 64, 55)",
			"--dsw-alias-state-business-primary": "rgb(228, 160, 92)",
			"--dsw-alias-state-business-tertiary": "rgb(48, 38, 32)",
			"--dsw-alias-toast-bg": "rgba(58, 46, 39, 0.88)",
			"--dsw-alias-tooltip-bg": "rgba(64, 51, 43, 0.90)",
			"--dsw-specific-bubble-highlight": "rgba(52, 41, 35, 0.84)",
			"--dsw-specific-bubble": "rgba(40, 32, 27, 0.78)",
			"--dsw-specific-input-major": "rgba(32, 25, 21, 0.74)",
			"--dsw-specific-login-input": "rgb(24, 19, 16)",
			"--dsw-specific-selector": "rgba(40, 32, 27, 0.82)",
			"--dsw-specific-sidebar-fill": "rgb(30, 23, 19)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(48, 37, 31)",
			"--dsw-specific-sidebar-nav-item-active": "rgb(44, 34, 29)",
			"--dsw-specific-sidebar-nav-item-hover": "rgb(36, 28, 24)",
			"--dsw-specific-tip": "rgba(40, 32, 27, 0.80)"
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
		/** Alias-token overrides for the 银曜 (Argent / Cool Titanium Stone) light theme. */
		const JADE_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(236, 239, 245, 0.80), rgba(226, 228, 233, 0) 24%),radial-gradient(560px 420px at 85% 15%, rgba(240, 243, 248, 0.65), transparent 55%),radial-gradient(540px 420px at 8% 45%, rgba(205, 211, 222, 0.45), transparent 52%)",
			"--dsw-alias-glass-blur": "blur(20px) saturate(1.20)",
			"--dsw-alias-surface-glass-blur": "blur(12px)",
			"--dsw-alias-bg-base": "rgb(226, 228, 233)",
			"--dsw-alias-surface-glass-spot": "rgba(238, 241, 247, 0.65)",
			"--dsw-alias-bg-layer-1": "rgba(235, 237, 242, 0.88)",
			"--dsw-alias-bg-layer-2": "rgba(228, 231, 237, 0.92)",
			"--dsw-alias-bg-layer-3": "rgba(220, 223, 230, 0.96)",
			"--dsw-alias-bg-module-platform": "rgb(224, 227, 234)",
			"--dsw-alias-bg-multi-select": "rgb(218, 221, 228)",
			"--dsw-alias-bg-overlay": "rgba(238, 241, 247, 0.98)",
			"--dsw-alias-bg-skeleton": "rgba(15, 23, 42, 0.06)",
			"--dsw-alias-bg-mask-1": "rgba(15, 23, 42, 0.22)",
			"--dsw-alias-bg-mask-2": "rgba(15, 23, 42, 0.10)",
			"--dsw-alias-bg-mask-3": "rgba(15, 23, 42, 0.40)",
			"--dsw-alias-bg-mask-photo": "rgba(15, 23, 42, 0.85)",
			"--dsw-alias-bg-mask-drop": "rgba(235, 238, 244, 0.82)",
			"--dsw-alias-border-inverted": "rgba(0, 0, 0, 0.06)",
			"--dsw-alias-border-inverted2": "rgba(0, 0, 0, 0.08)",
			"--dsw-alias-border-l1": "rgba(15, 23, 42, 0.06)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(15, 23, 42, 0.09)",
			"--dsw-alias-border-l2": "rgba(15, 23, 42, 0.10)",
			"--dsw-alias-border-l3": "rgba(15, 23, 42, 0.14)",
			"--dsw-alias-border-l4": "rgba(15, 23, 42, 0.20)",
			"--dsw-alias-brand-primary": "rgb(20, 22, 28)",
			"--dsw-alias-brand-primary-invert": "rgb(240, 242, 247)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(36, 40, 50)",
			"--dsw-alias-brand-text": "rgb(20, 22, 28)",
			"--dsw-alias-button-contrast-fill": "rgb(20, 22, 28)",
			"--dsw-alias-button-elevated-fill": "rgb(238, 240, 245)",
			"--dsw-alias-button-floating-fill": "rgba(238, 240, 245, 0.88)",
			"--dsw-alias-button-floating-hover": "rgb(232, 235, 241)",
			"--dsw-alias-button-ghost-active-border": "rgb(196, 202, 212)",
			"--dsw-alias-button-ghost-active-fill": "rgb(226, 229, 235)",
			"--dsw-alias-button-ghost-active-hover": "rgb(220, 223, 230)",
			"--dsw-alias-button-info-fill": "rgb(20, 22, 28)",
			"--dsw-alias-button-info-hover": "rgb(42, 46, 56)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(240, 242, 247, 0.95), rgba(222, 226, 234, 0.85))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(245, 247, 252, 1), rgba(228, 232, 240, 0.90))",
			"--dsw-alias-button-radius": "10px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(145deg, rgba(240, 242, 247, 0.95) 0%, rgba(230, 233, 240, 0.88) 45%, rgba(216, 220, 228, 0.82) 100%)",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(145deg, rgba(245, 247, 252, 1) 0%, rgba(235, 238, 245, 0.92) 45%, rgba(222, 226, 234) 100%)",
			"--dsw-alias-button-primary-bg-size": "200% 100%",
			"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
			"--dsw-alias-button-glow": "inset 0 1px 1px rgba(255, 255, 255, 0.80), inset 0 0 0 1px rgba(255, 255, 255, 0.40), 0 0 0 1px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.08), 0 6px 16px rgba(15, 23, 42, 0.05)",
			"--dsw-alias-button-glow-hover": "inset 0 1px 1.5px rgba(255, 255, 255, 0.90), inset 0 0 0 1px rgba(255, 255, 255, 0.60), 0 0 0 1px rgba(15, 23, 42, 0.14), 0 3px 10px rgba(15, 23, 42, 0.12), 0 8px 20px rgba(15, 23, 42, 0.06)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 2px rgba(15, 23, 42, 0.14), inset 0 0 0 1px rgba(15, 23, 42, 0.09), 0 1px 3px rgba(15, 23, 42, 0.06)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "inset 0 1px 1px rgba(255, 255, 255, 0.70), 0 0 0 1px rgba(15, 23, 42, 0.11)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(218, 222, 230)",
			"--dsw-alias-button-primary-fill": "rgb(20, 22, 28)",
			"--dsw-alias-button-primary-hover": "rgb(42, 46, 56)",
			"--dsw-alias-button-tool-bar-fill": "rgba(235, 238, 244, 0.70)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(235, 238, 244, 0.35)",
			"--dsw-alias-button-tool-bar-hover": "rgba(240, 242, 248, 0.88)",
			"--dsw-alias-interactive-bg-active": "rgba(15, 23, 42, 0.09)",
			"--dsw-alias-interactive-bg-hover": "rgba(15, 23, 42, 0.05)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(15, 23, 42, 0.08)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(236, 19, 19, 0.08)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(226, 229, 236)",
			"--dsw-alias-label-caption": "rgb(136, 144, 156)",
			"--dsw-alias-label-dimmed": "rgb(168, 175, 186)",
			"--dsw-alias-label-primary-bluish": "rgb(20, 22, 28)",
			"--dsw-alias-label-primary-dimmed": "rgb(36, 40, 50)",
			"--dsw-alias-label-primary-foreground": "rgb(240, 242, 247)",
			"--dsw-alias-label-primary-inverted": "rgb(240, 242, 247)",
			"--dsw-alias-label-primary": "rgb(20, 22, 28)",
			"--dsw-alias-label-secondary": "rgb(68, 76, 88)",
			"--dsw-alias-label-tertiary": "rgb(112, 120, 134)",
			"--dsw-alias-markdown-citation": "rgb(224, 227, 234)",
			"--dsw-alias-markdown-code-block-banner": "rgb(222, 225, 232)",
			"--dsw-alias-markdown-code-block": "rgb(226, 229, 236)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(238, 240, 245)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(222, 225, 232)",
			"--dsw-alias-markdown-inline-code": "rgb(222, 225, 232)",
			"--dsw-alias-markdown-placeholder": "rgb(226, 229, 236)",
			"--dsw-alias-markdown-tag": "rgb(222, 225, 232)",
			"--dsw-alias-scrollbar-bg-l1": "rgba(15, 23, 42, 0.13)",
			"--dsw-alias-scrollbar-bg-l2": "rgba(15, 23, 42, 0.18)",
			"--dsw-alias-scrollbar-hover-l1": "rgba(15, 23, 42, 0.24)",
			"--dsw-alias-scrollbar-hover-l2": "rgba(15, 23, 42, 0.30)",
			"--dsw-alias-state-business-primary": "rgb(20, 22, 28)",
			"--dsw-alias-state-business-tertiary": "rgb(222, 225, 232)",
			"--dsw-alias-toast-bg": "rgb(26, 28, 36)",
			"--dsw-alias-tooltip-bg": "rgb(20, 22, 28)",
			"--dsw-specific-bubble-highlight": "rgba(228, 232, 238, 0.90)",
			"--dsw-specific-bubble": "rgba(235, 238, 243, 0.92)",
			"--dsw-specific-input-major": "rgba(235, 238, 243, 0.92)",
			"--dsw-specific-login-input": "rgb(235, 238, 243)",
			"--dsw-specific-selector": "rgba(228, 232, 238, 0.90)",
			"--dsw-specific-sidebar-fill": "rgba(224, 227, 234, 0.70)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(212, 216, 224)",
			"--dsw-specific-sidebar-nav-item-active": "rgba(238, 241, 246, 0.90)",
			"--dsw-specific-sidebar-nav-item-hover": "rgba(15, 23, 42, 0.05)",
			"--dsw-specific-tip": "rgba(226, 229, 236, 0.85)"
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
		//#region src/client/parchment.ts
		const PARCHMENT_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "none",
			"--dsw-alias-glass-blur": "none",
			"--dsw-alias-surface-glass-blur": "none",
			"--dsw-alias-bg-base": "rgb(230, 224, 212)",
			"--dsw-alias-surface-glass-spot": "transparent",
			"--dsw-alias-bg-layer-1": "rgba(238, 232, 220, 0.86)",
			"--dsw-alias-bg-layer-2": "rgba(232, 225, 212, 0.90)",
			"--dsw-alias-bg-layer-3": "rgba(224, 216, 202, 0.94)",
			"--dsw-alias-bg-module-platform": "rgb(226, 219, 206)",
			"--dsw-alias-bg-multi-select": "rgb(220, 213, 200)",
			"--dsw-alias-bg-overlay": "rgb(236, 230, 218)",
			"--dsw-alias-bg-skeleton": "rgba(38, 32, 28, 0.05)",
			"--dsw-alias-bg-mask-1": "rgba(38, 32, 28, 0.22)",
			"--dsw-alias-bg-mask-2": "rgba(38, 32, 28, 0.10)",
			"--dsw-alias-bg-mask-3": "rgba(38, 32, 28, 0.40)",
			"--dsw-alias-bg-mask-photo": "rgba(38, 32, 28, 0.85)",
			"--dsw-alias-bg-mask-drop": "rgba(238, 232, 220, 0.80)",
			"--dsw-alias-border-inverted": "rgba(0, 0, 0, 0.05)",
			"--dsw-alias-border-inverted2": "rgba(0, 0, 0, 0.07)",
			"--dsw-alias-border-l1": "rgba(38, 32, 28, 0.06)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(38, 32, 28, 0.08)",
			"--dsw-alias-border-l2": "rgba(38, 32, 28, 0.09)",
			"--dsw-alias-border-l3": "rgba(38, 32, 28, 0.13)",
			"--dsw-alias-border-l4": "rgba(38, 32, 28, 0.18)",
			"--dsw-alias-brand-primary": "rgb(150, 56, 30)",
			"--dsw-alias-brand-primary-invert": "rgb(248, 243, 234)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(140, 50, 26)",
			"--dsw-alias-brand-text": "rgb(150, 56, 30)",
			"--dsw-alias-button-contrast-fill": "rgb(38, 32, 28)",
			"--dsw-alias-button-elevated-fill": "rgb(238, 232, 220)",
			"--dsw-alias-button-floating-fill": "rgba(238, 232, 220, 0.88)",
			"--dsw-alias-button-floating-hover": "rgb(242, 236, 226)",
			"--dsw-alias-button-ghost-active-border": "rgb(204, 194, 180)",
			"--dsw-alias-button-ghost-active-fill": "rgb(226, 218, 205)",
			"--dsw-alias-button-ghost-active-hover": "rgb(218, 210, 196)",
			"--dsw-alias-button-info-fill": "rgb(145, 52, 26)",
			"--dsw-alias-button-info-hover": "rgb(130, 44, 20)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(242, 236, 225, 0.95), rgba(228, 220, 208, 0.85))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(246, 241, 232, 1), rgba(232, 225, 212, 0.90))",
			"--dsw-alias-button-radius": "10px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(145deg, rgba(242, 236, 225, 0.95) 0%, rgba(234, 227, 215, 0.88) 45%, rgba(220, 212, 198, 0.82) 100%)",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(145deg, rgba(246, 241, 232, 1) 0%, rgba(238, 232, 220, 0.92) 45%, rgba(225, 217, 204) 100%)",
			"--dsw-alias-button-primary-bg-size": "200% 100%",
			"--dsw-alias-button-primary-motion": "dsh-button-drift 5s linear infinite",
			"--dsw-alias-button-glow": "0 1px 2px rgba(38, 32, 28, 0.06), 0 2px 6px rgba(38, 32, 28, 0.04)",
			"--dsw-alias-button-glow-hover": "0 2px 4px rgba(38, 32, 28, 0.08), 0 4px 10px rgba(38, 32, 28, 0.06)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 2px rgba(38, 32, 28, 0.10)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "0 0 0 1px rgba(38, 32, 28, 0.08)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(225, 217, 204)",
			"--dsw-alias-button-primary-fill": "rgb(150, 56, 30)",
			"--dsw-alias-button-primary-hover": "rgb(135, 48, 24)",
			"--dsw-alias-button-tool-bar-fill": "rgba(238, 232, 220, 0.70)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(238, 232, 220, 0.35)",
			"--dsw-alias-button-tool-bar-hover": "rgba(242, 236, 225, 0.88)",
			"--dsw-alias-interactive-bg-active": "rgba(38, 32, 28, 0.08)",
			"--dsw-alias-interactive-bg-hover": "rgba(38, 32, 28, 0.04)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(150, 56, 30, 0.08)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(220, 38, 38, 0.08)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(226, 219, 206)",
			"--dsw-alias-label-caption": "rgb(136, 126, 114)",
			"--dsw-alias-label-dimmed": "rgb(168, 156, 142)",
			"--dsw-alias-label-primary-bluish": "rgb(38, 32, 28)",
			"--dsw-alias-label-primary-dimmed": "rgb(56, 48, 42)",
			"--dsw-alias-label-primary-foreground": "rgb(248, 243, 234)",
			"--dsw-alias-label-primary-inverted": "rgb(248, 243, 234)",
			"--dsw-alias-label-primary": "rgb(38, 32, 28)",
			"--dsw-alias-label-secondary": "rgb(84, 74, 66)",
			"--dsw-alias-label-tertiary": "rgb(126, 114, 102)",
			"--dsw-alias-markdown-citation": "rgb(226, 219, 206)",
			"--dsw-alias-markdown-code-block-banner": "rgb(224, 217, 204)",
			"--dsw-alias-markdown-code-block": "rgb(228, 221, 208)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(238, 232, 220)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(224, 217, 204)",
			"--dsw-alias-markdown-inline-code": "rgb(224, 217, 204)",
			"--dsw-alias-markdown-placeholder": "rgb(228, 221, 208)",
			"--dsw-alias-markdown-tag": "rgb(224, 217, 204)",
			"--dsw-alias-scrollbar-bg-l1": "rgba(38, 32, 28, 0.12)",
			"--dsw-alias-scrollbar-bg-l2": "rgba(38, 32, 28, 0.16)",
			"--dsw-alias-scrollbar-hover-l1": "rgba(38, 32, 28, 0.22)",
			"--dsw-alias-scrollbar-hover-l2": "rgba(38, 32, 28, 0.28)",
			"--dsw-alias-state-business-primary": "rgb(150, 56, 30)",
			"--dsw-alias-state-business-tertiary": "rgb(224, 217, 204)",
			"--dsw-alias-toast-bg": "rgb(38, 32, 28)",
			"--dsw-alias-tooltip-bg": "rgb(38, 32, 28)",
			"--dsw-specific-bubble-highlight": "rgba(232, 225, 212, 0.90)",
			"--dsw-specific-bubble": "rgba(238, 232, 220, 0.92)",
			"--dsw-specific-input-major": "rgba(238, 232, 220, 0.92)",
			"--dsw-specific-login-input": "rgb(238, 232, 220)",
			"--dsw-specific-selector": "rgba(232, 225, 212, 0.90)",
			"--dsw-specific-sidebar-fill": "rgb(226, 219, 206)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(214, 206, 192)",
			"--dsw-specific-sidebar-nav-item-active": "rgba(242, 236, 225, 0.90)",
			"--dsw-specific-sidebar-nav-item-hover": "rgba(38, 32, 28, 0.04)",
			"--dsw-specific-tip": "rgba(228, 221, 208, 0.80)"
		});
		//#endregion
		//#region src/client/locales.ts
		/**
		* Tech-theme row dictionaries. A separate namespace from the official
		* 'settings.theme' pair: this plugin owns its own cubes' copy.
		*/
		const zh = {
			"tech-theme.title": "科技主题",
			"tech-theme.mocha": "栖木",
			"tech-theme.nebula": "星云",
			"tech-theme.void": "冥夜",
			"tech-theme.jade": "银曜",
			"tech-theme.solar": "灼日",
			"tech-theme.parchment": "缃素"
		};
		/** English dictionary checked against the Chinese key set. */
		const en = {
			"tech-theme.title": "Tech themes",
			"tech-theme.mocha": "Mocha",
			"tech-theme.nebula": "Nebula",
			"tech-theme.void": "Void",
			"tech-theme.jade": "Argent",
			"tech-theme.solar": "Solar",
			"tech-theme.parchment": "Parchment"
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
				id: "mocha",
				labelKey: "tech-theme.mocha",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16
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
				id: "parchment",
				labelKey: "tech-theme.parchment",
				Icon: _deepseek_ai_dsh_client_ui_primitives.IconListPenOutline16
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
		/** Mocha (栖木): the warm coffee and wood dark variant — rich espresso charcoal + warm caramel amber. */
		const MOCHA = Object.freeze({
			id: "mocha",
			colorScheme: "dark",
			tokens: MOCHA_TOKENS
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
		/** Argent (银曜): refined frosted liquid silver light theme (silver, grey, obsidian black). */
		const JADE = Object.freeze({
			id: "jade",
			colorScheme: "light",
			tokens: JADE_TOKENS
		});
		/** Solar: the amber-orange variant — warm glowing frosted glass. */
		const SOLAR = Object.freeze({
			id: "solar",
			colorScheme: "dark",
			tokens: SOLAR_TOKENS
		});
		/** Parchment (缃素): refined warm rice paper & pine soot ink light theme (cream linen, amber cinnabar, ink black). */
		const PARCHMENT = Object.freeze({
			id: "parchment",
			colorScheme: "light",
			tokens: PARCHMENT_TOKENS
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
/* 0.1.5+ renders the conversation through nested root-slot anchors:
   centerCol > [data-slot="main"] > [data-slot="main.conversation"] > root.
   Keep the 0.1.2 direct-child form for older hosts; the slot anchor form
   covers the current nesting (anchors are display:contents). */
[class$="centerCol"] > :first-child > [class$="_root"],
[class$="centerCol"] [data-slot="main.conversation"] > [class*="_root"]{
  background:var(--dsw-alias-bg-app-image),var(--dsw-alias-bg-base) !important;
}

/* Sidebar column: transparent base so the sidebar's own glass backdrop
   shows through the alpha — the column wrapper no longer paints a solid
   fill that would block the frosted-glass effect underneath. */
[class*="sidebarCol"]{
  position:relative;z-index:0;background:transparent !important;
}
[class*="sidebarCol"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  backdrop-filter:var(--dsw-alias-glass-blur,none);
}
[class*="sidebarCol"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 12% 38%, var(--dsw-alias-surface-glass-spot, transparent), transparent 56%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.04),inset 0 0 0 1px rgba(255,255,255,0.02);
}

/* Sidebar root: composite glass surface — radial inner glow (brighter
   center → dark edge) simulates depth, the diagonal sheen mimics a light
   reflection, and the semi-transparent fill keeps the sidebar distinct
   from the frame behind it. Glow and sheen ride the theme's
   --dsw-alias-surface-glass-spot (color-mixed down to the old white
   intensities) so both sidebars tint with the active theme.
   Matches strictly through the single renderSlot wrapper div (> * >)
   so deep descendants (e.g. settings dialog Menu spans with ._root_*) are not matched.
   
   NOTE: backdrop-filter NOT set here — it lives on sidebarCol::before
   (pseudo-element, safe for position:fixed children). backdrop-filter on
   a DOM element creates a containing block for position:fixed descendants,
   which would break the settings dialog (portal renders inside sidebar). */
body[data-ds-dark-theme] [class*="sidebarCol"] > * > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent) !important;
}
/* Light theme sidebar glass — driven by theme's surface-glass-spot (transparent when spots disabled) */
body:not([data-ds-dark-theme]) [class*="sidebarCol"] > * > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 30%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 20%, transparent) 0%,
      transparent 60%),
    var(--dsw-specific-sidebar-fill) !important;
  box-shadow: inset -1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.06)) !important;
}

/* Sidebar active workspace/folder icons: obsidian black in light mode */
body:not([data-ds-dark-theme]) [class*="folderActive"],
body:not([data-ds-dark-theme]) [class*="dsh-ff__icon-accent"],
body:not([data-ds-dark-theme]) .dsh-ff__icon-accent,
body:not([data-ds-dark-theme]) .dsh-ff__folder-icon.dsh-ff__icon-accent svg {
  color: var(--dsw-alias-label-primary, #181a22) !important;
  fill: currentColor !important;
}

/* Right sidebar — 0.1.5 native ui-sidebar-right, a sibling of the app frame:
   rightbarCol hosts an edge-anchored panel ([data-sidebar-right-panel], "push"
   mode) that can also go fixed fullscreen. Mirror the left sidebar's glass
   recipe: the column paints the theme's app-image pools DIRECTLY (same trick
   as the conversation surface) so the translucent panel has real depth to
   show through — otherwise its fill sits over the solid frame and reads as
   flat colour; the column keeps the blur backdrop + soft light pool, the
   panel keeps the translucent composite fill; fullscreen gets its own
   backdrop so the panel doesn't turn flat over the conversation.

   The panel is matched by its data attribute, never by [class*="_panel"]:
   that substring also hits the sibling _panelBody class, which painted the
   same 45% fill a second time over the panel — two stacked translucent layers
   read as one solid colour. */
[class*="rightbarCol"]{
  position:relative;z-index:0;
  background:var(--dsw-alias-bg-app-image),var(--dsw-alias-bg-base) !important;
}
[class*="rightbarCol"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  backdrop-filter:var(--dsw-alias-glass-blur,none);
}
[class*="rightbarCol"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 78% 68%, var(--dsw-alias-surface-glass-spot, transparent), transparent 56%);
  box-shadow:inset -1px 0 0 rgba(255,255,255,0.04),inset 0 0 0 1px rgba(255,255,255,0.02);
}
body[data-ds-dark-theme] [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent) !important;
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.05), inset 1px 0 0 rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05) !important;
}
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 30%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 20%, transparent) 0%,
      transparent 60%),
    var(--dsw-specific-sidebar-fill) !important;
  box-shadow:
    inset -1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.06)),
    inset 1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.04)),
    inset 0 1px 1px var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.04)) !important;
}
[class*="rightbarCol"] [data-sidebar-right-panel="fullscreen"]{
  backdrop-filter:var(--dsw-alias-glass-blur,none);
  -webkit-backdrop-filter:var(--dsw-alias-glass-blur,none);
}
/* Floating dock panels are position:fixed inside the same column subtree:
   the frame already carries a translucent layer-2 fill, so add the theme's
   glass blur and a specular edge so floats read as real frosted glass. */
[class*="rightbarCol"] [class$="_float"]{
  backdrop-filter:var(--dsw-alias-glass-blur,none);
  -webkit-backdrop-filter:var(--dsw-alias-glass-blur,none);
}
body[data-ds-dark-theme] [class*="rightbarCol"] [class$="_float"]{
  box-shadow:var(--dsw-elevation-prominent), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02) !important;
}
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [class$="_float"]{
  box-shadow:
    var(--dsw-elevation-prominent),
    inset 0 1px 1px rgba(255,255,255,0.85),
    inset 0 0 0 1px rgba(255,255,255,0.45) !important;
}
/* The changes tab (better-sidebar's unified "文件变动" pane) paints an opaque
   --dsw-alias-bg-base ground on its own root, which covers the right panel's
   glass — it is the one pane that reads as a flat slab while every sibling tab
   stays translucent. Drop that ground inside the right sidebar only; the tab's
   rows and diff surfaces still paint their own fills, and the panel glass is
   the same base-surface colour the root was imitating.
   Hooked through the pane's own lens bar (unconditional first child of the
   changes root) so no per-build class hash is baked in. */
[class*="rightbarCol"] [data-slot="sidebar.right.pane.tab"] [class*="_root"]:has(> [class*="_lensBar"]){
  background:transparent !important;
}

/* All primary action buttons (Button variant="primary"):
   1. Dark themes: neon fluid-drift glass buttons.
   2. Light theme: frosted liquid silver glass (银底黑字) with top specular highlight,
      subtle metallic gradient, crisp obsidian typography and soft depth shadow.
   Covers send/stop in composer, dialog confirm/enable (RiskConfirmation, Modal footer),
   settings Done, and any other <Button variant="primary"> throughout the UI. */
body[data-ds-dark-theme] [class*="_primary"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
}
body[data-ds-dark-theme] [class*="_primary"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}

/* Light mode: Primary action buttons driven dynamically by theme tokens */
body:not([data-ds-dark-theme]) [class*="_primary"],
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]{
  background: var(--dsw-alias-button-primary-bg) !important;
  background-size: var(--dsw-alias-button-primary-bg-size, 200% 100%) !important;
  box-shadow: var(--dsw-alias-button-glow, none) !important;
  color: var(--dsw-alias-button-contrast-fill, #181a22) !important;
  font-weight: 550 !important;
  transition: all 180ms var(--ds-ease-in-out, ease-in-out) !important;
}
body:not([data-ds-dark-theme]) [class*="_primary"]:hover:not(:disabled),
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]:hover:not(:disabled){
  background: var(--dsw-alias-button-primary-bg-hover, var(--dsw-alias-button-primary-bg)) !important;
  box-shadow: var(--dsw-alias-button-glow-hover, none) !important;
  transform: translateY(-0.5px);
}
body:not([data-ds-dark-theme]) [class*="_primary"]:active:not(:disabled),
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]:active:not(:disabled){
  transform: translateY(0.5px);
  box-shadow: var(--dsw-alias-button-press-shadow, none) !important;
}
body:not([data-ds-dark-theme]) [class*="_primary"] *,
body:not([data-ds-dark-theme]) [class*="gitCommitButton"] *{
  color: var(--dsw-alias-button-contrast-fill, #181a22) !important;
  fill: currentColor !important;
}

/* Git commit button (dsh-better-sidebar .gitCommitButton, hashed as
   "<hash>_gitCommitButton"): same gradient glass recipe as the primary
   action buttons — scoped to dark theme. */
body[data-ds-dark-theme] [class*="gitCommitButton"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
  color:var(--dsw-alias-label-primary-foreground) !important;
}
body[data-ds-dark-theme] [class*="gitCommitButton"]:hover:not(:disabled){
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
[class*="_sidebarCol"]:has([role="dialog"]){
  z-index:9500 !important;
}
/* Tooltip inside sidebar: raise sidebar column above center column and message layer (z 20)
   so tooltips extending to the right are not clipped or covered by the conversation surface. */
[class*="sidebarCol"]:has([role="tooltip"]){
  z-index:50 !important;
}

/* Sidebar footer actions: vertical layout so card (e.g. cost-meter) and action buttons stack top-to-bottom */
[class*="footArea"] [class*="footerActions"]{
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 8px !important;
}
[class*="footArea"] [class*="footerActions"] > *{
  min-width: 0 !important;
  width: 100% !important;
}
[class*="footArea"] [class*="footerActions"] .dshRemoteSidebarEntry{
  order: 10 !important;
}
[class*="footArea"] [class*="footerActions"] .dshRemoteSidebarEntry.isWide{
  width: 100% !important;
  margin: 0 !important;
}
[class*="collapsed"] [class*="footArea"] [class*="footerActions"]{
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 8px !important;
  width: auto !important;
}
[class*="collapsed"] [class*="footArea"] [class*="footerActions"] > *{
  width: auto !important;
}

/* Dialogs/modals: frosted glass surface */
body[data-ds-dark-theme] [role="dialog"]{
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
/* Dialogs/modals in light mode: surface driven dynamically by theme tokens */
body:not([data-ds-dark-theme]) [role="dialog"]{
  background:
    linear-gradient(145deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 100%),
    var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2, rgb(238, 232, 220))) !important;
  backdrop-filter: blur(28px) saturate(1.10) !important;
  -webkit-backdrop-filter: blur(28px) saturate(1.10) !important;
  box-shadow:
    0 0 0 1px var(--dsw-alias-border-l2, rgba(15, 23, 42, 0.08)),
    0 12px 32px rgba(15, 23, 42, 0.08),
    0 24px 64px rgba(15, 23, 42, 0.05) !important;
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
			mocha: MOCHA_TOKENS,
			nebula: NEBULA_TOKENS,
			void: VOID_TOKENS,
			jade: JADE_TOKENS,
			solar: SOLAR_TOKENS,
			parchment: PARCHMENT_TOKENS
		};
		/** Theme id → colorScheme map so light custom themes switch palette properly. */
		const THEME_SCHEME_MAP = {
			mocha: "dark",
			nebula: "dark",
			void: "dark",
			jade: "light",
			solar: "dark",
			parchment: "light"
		};
		/** Token names this plugin wrote inline (its retraction set). */
		const APPLIED_TOKEN_NAMES = /* @__PURE__ */ new Set();
		const TITLEBAR_PRESETS = {
			nebula: {
				bg: "rgb(28, 24, 46)",
				accent: "rgb(168, 142, 250)",
				line: "rgba(168, 142, 250, 0.18)",
				text: "rgb(240, 236, 255)",
				muted: "rgb(175, 168, 200)",
				hover: "rgba(168, 142, 250, 0.12)",
				active: "rgba(168, 142, 250, 0.22)"
			},
			solar: {
				bg: "rgb(40, 28, 20)",
				accent: "rgb(240, 180, 90)",
				line: "rgba(240, 180, 90, 0.18)",
				text: "rgb(252, 246, 238)",
				muted: "rgb(198, 178, 156)",
				hover: "rgba(240, 180, 90, 0.12)",
				active: "rgba(240, 180, 90, 0.22)"
			},
			mocha: {
				bg: "rgb(36, 27, 21)",
				accent: "rgb(228, 160, 92)",
				line: "rgba(228, 160, 92, 0.18)",
				text: "rgb(248, 242, 236)",
				muted: "rgb(196, 176, 158)",
				hover: "rgba(228, 160, 92, 0.12)",
				active: "rgba(228, 160, 92, 0.22)"
			},
			parchment: {
				bg: "rgb(230, 224, 212)",
				accent: "rgb(150, 56, 30)",
				line: "rgba(38, 32, 28, 0.09)",
				text: "rgb(38, 32, 28)",
				muted: "rgb(110, 98, 88)",
				hover: "rgba(38, 32, 28, 0.06)",
				active: "rgba(150, 56, 30, 0.12)"
			},
			jade: {
				bg: "rgb(226, 228, 233)",
				accent: "rgb(20, 22, 28)",
				line: "rgba(15, 23, 42, 0.09)",
				text: "rgb(20, 22, 28)",
				muted: "rgb(90, 98, 110)",
				hover: "rgba(15, 23, 42, 0.06)",
				active: "rgba(15, 23, 42, 0.10)"
			},
			void: {
				bg: "rgb(24, 26, 30)",
				accent: "rgb(140, 144, 155)",
				line: "rgba(140, 144, 155, 0.18)",
				text: "rgb(235, 237, 240)",
				muted: "rgb(160, 164, 175)",
				hover: "rgba(140, 144, 155, 0.08)",
				active: "rgba(140, 144, 155, 0.16)"
			}
		};
		/**
		* Synchronize theme and background color with the Tauri desktop shell (if running in desktop).
		* Toggles Windows DWM native title bar dark/light mode and sets caption color on Windows 11.
		*/
		function syncDesktopTitlebar(theme, colorSpec, titlebar) {
			if (typeof window === "undefined") return;
			const bridge = window.__dshNotifyBridge;
			if (!bridge) return;
			if (typeof bridge.setTheme === "function") bridge.setTheme(theme, colorSpec, titlebar);
			else if (bridge.port && bridge.token) try {
				fetch(`http://127.0.0.1:${bridge.port}/notify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${bridge.token}`
					},
					body: JSON.stringify({
						type: "theme-change",
						theme,
						color: colorSpec,
						titlebar
					})
				}).catch(() => {});
			} catch {}
		}
		/** Apply theme tokens as CSS variables on html + body (belt-and-suspenders). */
		function applyTokens(tokens, colorScheme = "dark", themeId) {
			if (typeof document === "undefined") return;
			document.documentElement.style.colorScheme = colorScheme;
			if (colorScheme === "dark") document.body.setAttribute("data-ds-dark-theme", "");
			else document.body.removeAttribute("data-ds-dark-theme");
			for (const [key, value] of Object.entries(tokens)) {
				document.documentElement.style.setProperty(key, value);
				document.body.style.setProperty(key, value);
				APPLIED_TOKEN_NAMES.add(key);
			}
			const titlebar = themeId ? TITLEBAR_PRESETS[themeId] : void 0;
			syncDesktopTitlebar(colorScheme, titlebar?.bg ?? tokens["--dsw-alias-bg-base"], titlebar);
		}
		/**
		* Retract every inline token this plugin wrote. The official ThemePresenter only
		* retracts the body variables it wrote itself, so a custom theme's inline
		* overrides on html + body would otherwise survive a switch back to a built-in
		* preference.
		*/
		function clearTokens() {
			if (typeof document === "undefined") return;
			for (const name of APPLIED_TOKEN_NAMES) {
				document.documentElement.style.removeProperty(name);
				document.body.style.removeProperty(name);
			}
			APPLIED_TOKEN_NAMES.clear();
		}
		/** Built-in preferences the official Appearance row can explicitly pick. */
		const BUILT_IN_PREFERENCES = [
			"light",
			"dark",
			"system"
		];
		function isBuiltinPreference(value) {
			return BUILT_IN_PREFERENCES.includes(value);
		}
		/**
		* Whether an observed built-in preference wins over the persisted custom theme.
		* Only a light/dark value the user explicitly picked in THIS session via the
		* setTheme wrapper wins. Values adopted from the settings document at boot/reload
		* (livePick null) never win.
		*/
		function builtinPickWins(preference, livePick) {
			if (preference !== "light" && preference !== "dark") return false;
			return preference === livePick;
		}
		/**
		* Read the saved custom-theme id from localStorage.
		* Handles both plain ids and legacy "id|seen" pipe-delimited values.
		* @returns the validated theme id, or undefined when nothing is saved.
		*/
		function readSaved() {
			if (typeof localStorage === "undefined") return void 0;
			const raw = localStorage.getItem(LS_KEY);
			if (!raw || raw === "off") return void 0;
			const id = raw.split("|")[0];
			return id && THEME_TOKEN_MAP[id] !== void 0 ? id : void 0;
		}
		/** Persist the custom-theme id to localStorage. */
		function writeSaved(id) {
			try {
				localStorage.setItem(LS_KEY, id);
			} catch {}
		}
		/** Drop the saved custom-theme record. */
		function clearSaved() {
			try {
				localStorage.removeItem(LS_KEY);
			} catch {}
		}
		/**
		* Client plugin body: register both themes and the drift keyframes, plus the
		* tech-theme row contribution, disposing everything with the fiber so HMR and
		* teardown never leave a stale theme, stylesheet, or row behind.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			window.__dshCustomThemeLive = true;
			const theme = ctx.theme ?? ctx.get?.("theme");
			/** Apply a custom theme via direct CSS variables and the theme service. */
			const activateTheme = (id) => {
				const tokens = THEME_TOKEN_MAP[id];
				if (!tokens) return;
				writeSaved(id);
				try {
					theme.setTheme(id);
				} catch {}
				applyTokens(tokens, THEME_SCHEME_MAP[id] ?? "dark", id);
			};
			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "ui-theme-custom: row dictionaries");
			const store = createTechThemeStore();
			let bound;
			let liveBuiltinPick = null;
			const originalSetTheme = theme.setTheme;
			theme.setTheme = function(id) {
				liveBuiltinPick = isBuiltinPreference(id) ? id : null;
				originalSetTheme.call(this, id);
			};
			ctx.effect(() => () => {
				theme.setTheme = originalSetTheme;
			}, "ui-theme-custom: restore setTheme wrapper");
			let restorePending = false;
			const scheduleRestore = (desired) => {
				if (restorePending) return;
				restorePending = true;
				queueMicrotask(() => {
					restorePending = false;
					const preference = theme.getTheme().preference;
					if (preference === desired) return;
					if (builtinPickWins(preference, liveBuiltinPick)) return;
					activateTheme(desired);
				});
			};
			const applyDesired = () => {
				const desired = readSaved();
				const preference = theme.getTheme().preference;
				if (desired === void 0) {
					if (isBuiltinPreference(preference)) {
						clearTokens();
						const isDark = preference === "dark" || preference === "system" && typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
						syncDesktopTitlebar(isDark ? "dark" : "light", isDark ? "#16161b" : "#f5f5f7", null);
					}
					return;
				}
				if (preference === desired) {
					const tokens = THEME_TOKEN_MAP[desired];
					if (tokens) applyTokens(tokens, THEME_SCHEME_MAP[desired] ?? "dark", desired);
					return;
				}
				if (builtinPickWins(preference, liveBuiltinPick)) {
					clearSaved();
					clearTokens();
					const isDark = preference === "dark" || preference === "system" && typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
					syncDesktopTitlebar(isDark ? "dark" : "light", isDark ? "#16161b" : "#f5f5f7", null);
					return;
				}
				scheduleRestore(desired);
			};
			applyDesired();
			ctx.on("theme/change", (snapshot) => {
				applyDesired();
				bound?.sync(snapshot.preference, snapshot.revision);
			});
			const injected = (actions) => {
				bound = actions;
				bound.sync(theme.getTheme().preference, theme.getTheme().revision);
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
				const disposeMocha = ctx.theme.register(MOCHA);
				const disposeNebula = ctx.theme.register(NEBULA);
				const disposeVoid = ctx.theme.register(VOID);
				const disposeJade = ctx.theme.register(JADE);
				const disposeSolar = ctx.theme.register(SOLAR);
				const disposeParchment = ctx.theme.register(PARCHMENT);
				const removeKeyframes = injectButtonDrift();
				const removeSurfaceGlass = injectSurfaceGlass();
				return () => {
					disposeMocha();
					disposeNebula();
					disposeVoid();
					disposeJade();
					disposeSolar();
					disposeParchment();
					removeKeyframes();
					removeSurfaceGlass();
					clearTokens();
				};
			}, "ui-theme-custom: tech theme registrations + drift keyframes + surface glass");
			try {
				const saved = readSaved();
				if (saved !== void 0) activateTheme(saved);
			} catch {}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map