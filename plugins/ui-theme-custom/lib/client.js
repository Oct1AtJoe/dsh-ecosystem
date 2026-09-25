window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-theme-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region src/client/sequoia.ts
		const SEQUOIA_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "none",
			"--dsw-alias-glass-blur": "blur(64px) saturate(200%)",
			"--dsw-alias-surface-glass-blur": "blur(56px) saturate(190%)",
			"--dsw-alias-bg-base": "rgb(245, 245, 247)",
			"--dsw-alias-surface-glass-spot": "transparent",
			"--dsw-alias-bg-layer-1": "rgba(255, 255, 255, 0.88)",
			"--dsw-alias-bg-layer-2": "rgba(245, 245, 247, 0.90)",
			"--dsw-alias-bg-layer-3": "rgba(235, 235, 238, 0.94)",
			"--dsw-specific-sidebar-fill": "rgba(245, 245, 247, 0.66)",
			"--dsw-alias-bg-module-platform": "rgb(240, 240, 243)",
			"--dsw-alias-bg-multi-select": "rgb(230, 230, 235)",
			"--dsw-alias-bg-overlay": "rgba(255, 255, 255, 0.94)",
			"--dsw-alias-bg-skeleton": "rgba(0, 0, 0, 0.05)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.15)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.08)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.35)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.75)",
			"--dsw-alias-bg-mask-drop": "rgba(255, 255, 255, 0.85)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.65)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.85)",
			"--dsw-alias-border-l1": "rgba(0, 0, 0, 0.06)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(0, 0, 0, 0.08)",
			"--dsw-alias-border-l2": "rgba(0, 0, 0, 0.10)",
			"--dsw-alias-border-l3": "rgba(0, 0, 0, 0.16)",
			"--dsw-alias-border-l4": "rgba(0, 0, 0, 0.22)",
			"--dsw-alias-brand-primary": "#147ce5",
			"--dsw-alias-brand-primary-invert": "#ffffff",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "#0d6ecc",
			"--dsw-alias-brand-text": "#147ce5",
			"--dsw-alias-button-contrast-fill": "#1d1d1f",
			"--dsw-alias-button-elevated-fill": "rgba(255, 255, 255, 0.90)",
			"--dsw-alias-button-floating-fill": "rgba(255, 255, 255, 0.85)",
			"--dsw-alias-button-floating-hover": "rgba(255, 255, 255, 0.95)",
			"--dsw-alias-button-ghost-active-border": "rgba(20, 124, 229, 0.30)",
			"--dsw-alias-button-ghost-active-fill": "rgba(20, 124, 229, 0.08)",
			"--dsw-alias-button-ghost-active-hover": "rgba(20, 124, 229, 0.12)",
			"--dsw-alias-button-info-fill": "rgb(0, 102, 212)",
			"--dsw-alias-button-info-hover": "#005bb5",
			"--dsw-alias-button-info-bg": "linear-gradient(180deg, rgba(56, 152, 252, 0.90), rgba(20, 124, 229, 0.85))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(180deg, rgba(77, 165, 255, 0.95), rgba(40, 139, 242, 0.90))",
			"--dsw-alias-button-radius": "14px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(180deg, #3898fc 0%, #147ce5 100%)",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(180deg, #4da5ff 0%, #288bf2 100%)",
			"--dsw-alias-button-primary-bg-size": "100% 100%",
			"--dsw-alias-button-primary-motion": "none",
			"--dsw-alias-button-glow": "0 2px 8px rgba(20, 124, 229, 0.20)",
			"--dsw-alias-button-glow-hover": "0 4px 12px rgba(20, 124, 229, 0.30)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.20)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "0 0 0 2px rgba(20, 124, 229, 0.20)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgba(20, 124, 229, 0.12)",
			"--dsw-alias-button-primary-fill": "#147ce5",
			"--dsw-alias-button-primary-hover": "#288bf2",
			"--dsw-alias-button-tool-bar-fill": "rgba(0, 0, 0, 0.04)",
			"--dsw-alias-button-tool-bar-fill-invisible": "transparent",
			"--dsw-alias-button-tool-bar-hover": "rgba(0, 0, 0, 0.08)",
			"--dsw-alias-interactive-bg-active": "rgba(0, 0, 0, 0.08)",
			"--dsw-alias-interactive-bg-hover": "rgba(0, 0, 0, 0.04)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(0, 113, 227, 0.08)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(255, 59, 48, 0.08)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(242, 242, 245)",
			"--dsw-alias-label-primary": "#1d1d1f",
			"--dsw-alias-label-secondary": "#6e6e73",
			"--dsw-alias-label-caption": "#86868b",
			"--dsw-alias-label-dimmed": "#a1a1a6",
			"--dsw-alias-label-primary-bluish": "#1d1d1f",
			"--dsw-alias-label-primary-dimmed": "#424245",
			"--dsw-alias-label-primary-foreground": "#ffffff",
			"--dsw-alias-label-primary-inverted": "#ffffff",
			"--dsw-alias-label-tertiary": "#86868b",
			"--dsw-alias-markdown-citation": "rgba(0, 0, 0, 0.04)",
			"--dsw-alias-markdown-code-block-banner": "rgb(240, 242, 245)",
			"--dsw-alias-markdown-code-block": "#f6f8fa",
			"--dsw-alias-markdown-code-segment-selected": "rgba(0, 113, 227, 0.12)",
			"--dsw-alias-markdown-code-segment-unselected": "rgba(0, 0, 0, 0.03)",
			"--dsw-alias-markdown-inline-code": "rgba(0, 0, 0, 0.05)",
			"--dsw-alias-markdown-placeholder": "rgba(0, 0, 0, 0.03)",
			"--dsw-alias-markdown-tag": "rgba(0, 0, 0, 0.05)",
			"--dsw-alias-scrollbar-bg-l1": "rgba(0, 0, 0, 0.12)",
			"--dsw-alias-scrollbar-bg-l2": "rgba(0, 0, 0, 0.18)",
			"--dsw-alias-scrollbar-hover-l1": "rgba(0, 0, 0, 0.24)",
			"--dsw-alias-scrollbar-hover-l2": "rgba(0, 0, 0, 0.32)",
			"--dsw-alias-state-business-primary": "#0071e3",
			"--dsw-alias-state-business-tertiary": "rgba(0, 113, 227, 0.10)",
			"--dsw-alias-toast-bg": "rgba(30, 30, 35, 0.88)",
			"--dsw-alias-tooltip-bg": "rgba(30, 30, 35, 0.90)",
			"--dsw-specific-bubble-highlight": "rgba(255, 255, 255, 0.97)",
			"--dsw-specific-bubble": "rgba(255, 255, 255, 0.93)",
			"--dsw-specific-input-major": "rgba(255, 255, 255, 0.93)",
			"--dsw-specific-login-input": "rgba(255, 255, 255, 0.96)",
			"--dsw-specific-selector": "rgba(245, 245, 247, 0.94)",
			"--dsw-specific-tip": "rgba(245, 245, 247, 0.92)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(234, 238, 246)",
			"--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.93)",
			"--dsw-specific-sidebar-nav-item-hover": "rgba(0, 0, 0, 0.04)",
			"--dsw-code-bg": "#f6f8fa",
			"--dsw-code-fg": "#24292f",
			"--dsw-code-border": "#d0d7de",
			"--dsw-code-comment": "#6e7781",
			"--dsw-code-keyword": "#cf222e",
			"--dsw-code-string": "#0a3069",
			"--dsw-code-function": "#8250df"
		});
		//#endregion
		//#region src/client/sonoma.ts
		const SONOMA_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "radial-gradient(ellipse 950px 560px at 15% 18%, rgba(140, 70, 240, 0.18) 0%, transparent 68%),radial-gradient(ellipse 880px 620px at 85% 85%, rgba(41, 151, 255, 0.16) 0%, transparent 68%),radial-gradient(circle at 50% 50%, rgba(255, 75, 140, 0.08) 0%, transparent 62%),linear-gradient(180deg, rgba(12, 13, 17, 0.94) 0%, rgba(16, 18, 24, 0.97) 100%)",
			"--dsw-alias-glass-blur": "blur(50px) saturate(180%)",
			"--dsw-alias-surface-glass-blur": "blur(34px) saturate(160%)",
			"--dsw-alias-bg-base": "rgb(22, 24, 30)",
			"--dsw-alias-surface-glass-spot": "rgba(140, 70, 240, 0.18)",
			"--dsw-alias-bg-layer-1": "rgba(28, 32, 40, 0.78)",
			"--dsw-alias-bg-layer-2": "rgba(34, 38, 48, 0.85)",
			"--dsw-alias-bg-layer-3": "rgba(42, 46, 58, 0.92)",
			"--dsw-specific-sidebar-fill": "rgba(18, 20, 25, 0.55)",
			"--dsw-alias-bg-module-platform": "rgb(26, 29, 36)",
			"--dsw-alias-bg-multi-select": "rgb(36, 40, 52)",
			"--dsw-alias-bg-overlay": "rgba(20, 22, 28, 0.95)",
			"--dsw-alias-bg-skeleton": "rgba(255, 255, 255, 0.05)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.45)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.25)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.65)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.85)",
			"--dsw-alias-bg-mask-drop": "rgba(16, 18, 24, 0.90)",
			"--dsw-alias-border-inverted": "rgba(255, 255, 255, 0.14)",
			"--dsw-alias-border-inverted2": "rgba(255, 255, 255, 0.20)",
			"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
			"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.26)",
			"--dsw-alias-brand-primary": "#2997ff",
			"--dsw-alias-brand-primary-invert": "#ffffff",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "#1f80e6",
			"--dsw-alias-brand-text": "#2997ff",
			"--dsw-alias-button-contrast-fill": "#2997ff",
			"--dsw-alias-button-elevated-fill": "rgb(34, 38, 48)",
			"--dsw-alias-button-floating-fill": "rgba(34, 38, 48, 0.85)",
			"--dsw-alias-button-floating-hover": "rgb(42, 46, 58)",
			"--dsw-alias-button-ghost-active-border": "rgba(41, 151, 255, 0.40)",
			"--dsw-alias-button-ghost-active-fill": "rgba(41, 151, 255, 0.12)",
			"--dsw-alias-button-ghost-active-hover": "rgba(41, 151, 255, 0.18)",
			"--dsw-alias-button-info-fill": "rgb(41, 151, 255)",
			"--dsw-alias-button-info-hover": "#1f80e6",
			"--dsw-alias-button-info-bg": "linear-gradient(180deg, rgba(58, 160, 255, 0.60), rgba(41, 151, 255, 0.38))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(180deg, rgba(77, 169, 255, 0.72), rgba(58, 160, 255, 0.48))",
			"--dsw-alias-button-radius": "14px",
			"--dsw-alias-button-radius-sm": "8px",
			"--dsw-alias-button-primary-bg": "linear-gradient(180deg, #3aa0ff 0%, #2997ff 100%)",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(180deg, #4da9ff 0%, #3aa0ff 100%)",
			"--dsw-alias-button-primary-bg-size": "100% 100%",
			"--dsw-alias-button-primary-motion": "none",
			"--dsw-alias-button-glow": "0 0 12px rgba(41, 151, 255, 0.32)",
			"--dsw-alias-button-glow-hover": "0 0 18px rgba(41, 151, 255, 0.48)",
			"--dsw-alias-button-press-shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.50)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "0 0 0 2px rgba(41, 151, 255, 0.35)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgba(41, 151, 255, 0.18)",
			"--dsw-alias-button-primary-fill": "#2997ff",
			"--dsw-alias-button-primary-hover": "#3aa0ff",
			"--dsw-alias-button-tool-bar-fill": "rgba(255, 255, 255, 0.06)",
			"--dsw-alias-button-tool-bar-fill-invisible": "transparent",
			"--dsw-alias-button-tool-bar-hover": "rgba(255, 255, 255, 0.12)",
			"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.12)",
			"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.07)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(41, 151, 255, 0.16)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(255, 69, 58, 0.15)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(34, 38, 48)",
			"--dsw-alias-label-primary": "#f5f5f7",
			"--dsw-alias-label-secondary": "#a1a1a6",
			"--dsw-alias-label-caption": "#86868b",
			"--dsw-alias-label-dimmed": "#6e6e73",
			"--dsw-alias-label-primary-bluish": "#f5f5f7",
			"--dsw-alias-label-primary-dimmed": "#d1d1d6",
			"--dsw-alias-label-primary-foreground": "#ffffff",
			"--dsw-alias-label-primary-inverted": "#1c1c1e",
			"--dsw-alias-label-tertiary": "#86868b",
			"--dsw-alias-markdown-citation": "rgb(24, 27, 34)",
			"--dsw-alias-markdown-code-block-banner": "rgb(16, 18, 23)",
			"--dsw-alias-markdown-code-block": "#14161b",
			"--dsw-alias-markdown-code-segment-selected": "rgb(36, 40, 52)",
			"--dsw-alias-markdown-code-segment-unselected": "#14161b",
			"--dsw-alias-markdown-inline-code": "rgba(255, 255, 255, 0.08)",
			"--dsw-alias-markdown-placeholder": "rgb(20, 22, 28)",
			"--dsw-alias-markdown-tag": "rgb(28, 32, 40)",
			"--dsw-alias-scrollbar-bg-l1": "rgba(255, 255, 255, 0.10)",
			"--dsw-alias-scrollbar-bg-l2": "rgba(255, 255, 255, 0.16)",
			"--dsw-alias-scrollbar-hover-l1": "rgba(255, 255, 255, 0.22)",
			"--dsw-alias-scrollbar-hover-l2": "rgba(255, 255, 255, 0.28)",
			"--dsw-alias-state-business-primary": "#2997ff",
			"--dsw-alias-state-business-tertiary": "rgba(41, 151, 255, 0.15)",
			"--dsw-alias-toast-bg": "rgba(28, 32, 40, 0.90)",
			"--dsw-alias-tooltip-bg": "rgba(34, 38, 48, 0.92)",
			"--dsw-specific-bubble-highlight": "rgba(34, 38, 48, 0.88)",
			"--dsw-specific-bubble": "rgba(28, 32, 40, 0.82)",
			"--dsw-specific-input-major": "rgba(22, 24, 30, 0.82)",
			"--dsw-specific-login-input": "rgb(20, 22, 28)",
			"--dsw-specific-selector": "rgba(28, 32, 40, 0.85)",
			"--dsw-specific-tip": "rgba(24, 27, 34, 0.80)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(36, 40, 56)",
			"--dsw-specific-sidebar-nav-item-active": "rgba(42, 46, 58, 0.85)",
			"--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.05)",
			"--dsw-code-bg": "#14161b",
			"--dsw-code-fg": "#e6edf3",
			"--dsw-code-border": "rgba(255, 255, 255, 0.12)",
			"--dsw-code-comment": "#7d8590",
			"--dsw-code-keyword": "#ff7b72",
			"--dsw-code-string": "#a5d6ff",
			"--dsw-code-function": "#d2a8ff"
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
			"--dsw-alias-bg-app-image": "linear-gradient(180deg, rgba(34, 28, 24, 0.035) 0%, rgba(230, 224, 212, 0) 26%),radial-gradient(ellipse 960px 580px at 90% 16%, rgba(34, 28, 24, 0.045) 0%, transparent 68%),radial-gradient(ellipse 820px 480px at 8% 68%, rgba(38, 32, 28, 0.040) 0%, transparent 64%)",
			"--dsw-alias-glass-blur": "none",
			"--dsw-alias-surface-glass-blur": "none",
			"--dsw-alias-bg-base": "rgb(230, 224, 212)",
			"--dsw-alias-surface-glass-spot": "transparent",
			"--dsw-alias-bg-layer-1": "rgba(238, 232, 220, 0.88)",
			"--dsw-alias-bg-layer-2": "rgba(232, 225, 212, 0.92)",
			"--dsw-alias-bg-layer-3": "rgba(224, 216, 202, 0.95)",
			"--dsw-alias-bg-module-platform": "rgb(226, 219, 206)",
			"--dsw-alias-bg-multi-select": "rgb(220, 213, 200)",
			"--dsw-alias-bg-overlay": "rgb(236, 230, 218)",
			"--dsw-alias-bg-skeleton": "rgba(34, 28, 24, 0.05)",
			"--dsw-alias-bg-mask-1": "rgba(34, 28, 24, 0.22)",
			"--dsw-alias-bg-mask-2": "rgba(34, 28, 24, 0.10)",
			"--dsw-alias-bg-mask-3": "rgba(34, 28, 24, 0.40)",
			"--dsw-alias-bg-mask-photo": "rgba(34, 28, 24, 0.85)",
			"--dsw-alias-bg-mask-drop": "rgba(238, 232, 220, 0.80)",
			"--dsw-alias-border-inverted": "rgba(0, 0, 0, 0.05)",
			"--dsw-alias-border-inverted2": "rgba(0, 0, 0, 0.07)",
			"--dsw-alias-border-l1": "rgba(38, 32, 28, 0.07)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(38, 32, 28, 0.09)",
			"--dsw-alias-border-l2": "rgba(38, 32, 28, 0.10)",
			"--dsw-alias-border-l3": "rgba(38, 32, 28, 0.15)",
			"--dsw-alias-border-l4": "rgba(38, 32, 28, 0.20)",
			"--dsw-alias-brand-primary": "rgb(156, 48, 28)",
			"--dsw-alias-brand-primary-invert": "rgb(252, 246, 240)",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "rgb(142, 40, 22)",
			"--dsw-alias-brand-text": "rgb(156, 48, 28)",
			"--dsw-alias-button-contrast-fill": "rgb(34, 28, 24)",
			"--dsw-alias-button-elevated-fill": "rgb(238, 232, 220)",
			"--dsw-alias-button-floating-fill": "rgba(238, 232, 220, 0.88)",
			"--dsw-alias-button-floating-hover": "rgb(242, 236, 226)",
			"--dsw-alias-button-ghost-active-border": "rgb(204, 194, 180)",
			"--dsw-alias-button-ghost-active-fill": "rgb(226, 218, 205)",
			"--dsw-alias-button-ghost-active-hover": "rgb(218, 210, 196)",
			"--dsw-alias-button-info-fill": "rgb(156, 48, 28)",
			"--dsw-alias-button-info-hover": "rgb(138, 38, 20)",
			"--dsw-alias-button-info-bg": "linear-gradient(135deg, rgba(242, 236, 225, 0.95), rgba(228, 220, 208, 0.85))",
			"--dsw-alias-button-info-bg-hover": "linear-gradient(135deg, rgba(246, 241, 232, 1), rgba(232, 225, 212, 0.90))",
			"--dsw-alias-button-radius": "5px",
			"--dsw-alias-button-radius-sm": "4px",
			"--dsw-alias-button-primary-bg": "linear-gradient(145deg, rgb(165, 52, 32) 0%, rgb(148, 42, 24) 100%)",
			"--dsw-alias-button-primary-bg-hover": "linear-gradient(145deg, rgb(176, 58, 36) 0%, rgb(158, 46, 26) 100%)",
			"--dsw-alias-button-primary-bg-size": "100% 100%",
			"--dsw-alias-button-primary-motion": "none",
			"--dsw-alias-button-glow": "0 0 0 1px rgba(156, 48, 28, 0.35), inset 0 0 0 1px rgba(255, 240, 230, 0.30), 0 2px 4px rgba(34, 28, 24, 0.12)",
			"--dsw-alias-button-glow-hover": "0 0 0 1.5px rgba(156, 48, 28, 0.50), inset 0 0 0 1px rgba(255, 240, 230, 0.45), 0 3px 8px rgba(156, 48, 28, 0.25)",
			"--dsw-alias-button-press-shadow": "inset 0 2px 4px rgba(34, 28, 24, 0.25)",
			"--dsw-alias-button-press-shift": "translate(0, 1px)",
			"--dsw-alias-button-outline-glow": "0 0 0 1px rgba(156, 48, 28, 0.25)",
			"--dsw-alias-button-send-shift-active": "translateY(-1px) translate(0, 2px)",
			"--dsw-alias-button-primary-dimmed": "rgb(225, 217, 204)",
			"--dsw-alias-button-primary-fill": "rgb(156, 48, 28)",
			"--dsw-alias-button-primary-hover": "rgb(138, 38, 20)",
			"--dsw-alias-button-tool-bar-fill": "rgba(238, 232, 220, 0.70)",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(238, 232, 220, 0.35)",
			"--dsw-alias-button-tool-bar-hover": "rgba(242, 236, 225, 0.88)",
			"--dsw-alias-interactive-bg-active": "rgba(34, 28, 24, 0.08)",
			"--dsw-alias-interactive-bg-hover": "rgba(34, 28, 24, 0.04)",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(156, 48, 28, 0.08)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(220, 38, 38, 0.08)",
			"--dsw-alias-interactive-bg-hover-solid": "rgb(226, 219, 206)",
			"--dsw-alias-label-caption": "rgb(142, 130, 120)",
			"--dsw-alias-label-dimmed": "rgb(172, 160, 148)",
			"--dsw-alias-label-primary-bluish": "rgb(34, 28, 24)",
			"--dsw-alias-label-primary-dimmed": "rgb(52, 44, 38)",
			"--dsw-alias-label-primary-foreground": "rgb(252, 246, 240)",
			"--dsw-alias-label-primary-inverted": "rgb(252, 246, 240)",
			"--dsw-alias-label-primary": "rgb(34, 28, 24)",
			"--dsw-alias-label-secondary": "rgb(82, 72, 64)",
			"--dsw-alias-label-tertiary": "rgb(132, 120, 110)",
			"--dsw-alias-markdown-citation": "rgb(224, 217, 204)",
			"--dsw-alias-markdown-code-block-banner": "rgb(218, 210, 196)",
			"--dsw-alias-markdown-code-block": "rgb(224, 217, 204)",
			"--dsw-alias-markdown-code-segment-selected": "rgb(240, 235, 224)",
			"--dsw-alias-markdown-code-segment-unselected": "rgb(218, 210, 196)",
			"--dsw-alias-markdown-inline-code": "rgba(34, 28, 24, 0.06)",
			"--dsw-alias-markdown-placeholder": "rgb(224, 217, 204)",
			"--dsw-alias-markdown-tag": "rgb(218, 210, 196)",
			"--dsw-alias-scrollbar-bg-l1": "rgba(34, 28, 24, 0.10)",
			"--dsw-alias-scrollbar-bg-l2": "rgba(34, 28, 24, 0.15)",
			"--dsw-alias-scrollbar-hover-l1": "rgba(34, 28, 24, 0.20)",
			"--dsw-alias-scrollbar-hover-l2": "rgba(34, 28, 24, 0.25)",
			"--dsw-alias-state-business-primary": "rgb(156, 48, 28)",
			"--dsw-alias-state-business-tertiary": "rgb(224, 217, 204)",
			"--dsw-alias-toast-bg": "rgb(34, 28, 24)",
			"--dsw-alias-tooltip-bg": "rgb(34, 28, 24)",
			"--dsw-specific-bubble-highlight": "rgba(232, 225, 212, 0.90)",
			"--dsw-specific-bubble": "rgba(238, 232, 220, 0.92)",
			"--dsw-specific-input-major": "rgba(238, 232, 220, 0.92)",
			"--dsw-specific-login-input": "rgb(238, 232, 220)",
			"--dsw-specific-selector": "rgba(232, 225, 212, 0.90)",
			"--dsw-specific-sidebar-fill": "rgb(226, 219, 206)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(214, 206, 192)",
			"--dsw-specific-sidebar-nav-item-active": "rgba(242, 236, 225, 0.90)",
			"--dsw-specific-sidebar-nav-item-hover": "rgba(34, 28, 24, 0.04)",
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
			"tech-theme.sequoia": "液态",
			"tech-theme.sonoma": "曜黑",
			"tech-theme.void": "冥夜",
			"tech-theme.jade": "银曜",
			"tech-theme.solar": "灼日",
			"tech-theme.parchment": "缃素",
			"sidebar-font.title": "侧边栏字号",
			"sidebar-font.description": "仅影响两侧边栏。默认比对话区小一档，避免导航与正文抢视觉重量",
			"sidebar-font.unit": "px",
			"sidebar-font.increase": "增大侧边栏字号",
			"sidebar-font.decrease": "减小侧边栏字号"
		};
		/** English dictionary checked against the Chinese key set. */
		const en = {
			"tech-theme.title": "Tech themes",
			"tech-theme.sequoia": "Liquid",
			"tech-theme.sonoma": "Obsidian",
			"tech-theme.void": "Void",
			"tech-theme.jade": "Argent",
			"tech-theme.solar": "Solar",
			"tech-theme.parchment": "Parchment",
			"sidebar-font.title": "Sidebar font size",
			"sidebar-font.description": "Affects both sidebars only. Sits one step below the chat area so navigation never competes with the content",
			"sidebar-font.unit": "px",
			"sidebar-font.increase": "Increase sidebar font size",
			"sidebar-font.decrease": "Decrease sidebar font size"
		};
		//#endregion
		//#region src/client/sidebar-font.ts
		/**
		* 侧边栏字号偏好：独立于官方的对话区字号（--dsh-content-font-size）。
		*
		* 为什么独立：侧边栏是导航 chrome，对话区是阅读内容。两者同字号会让正文失去
		* 视觉重量（VS Code / Slack / Notion 的侧边栏都固定比正文小一档）。
		*
		* 为什么用 localStorage 而非官方 settings：官方 --dsh-content-font-size 属
		* ui-theme 命名空间，插件不写别人的命名空间（架构铁律）；主题偏好
		* （dsh-theme-preference）已有同样的先例。
		*
		* 应用方式：写 --dsh-sidebar-font-size 到 html + body（内联变量双写，见
		* AGENTS.md 6.3 的层叠陷阱），由 SURFACE_GLASS_CSS 的规则消费。
		*/
		/** localStorage key。 */
		const KEY = "dsh-sidebar-font-size";
		/** 驱动侧边栏字号的内联 CSS 变量名。 */
		const SIDEBAR_FONT_VARIABLE = "--dsh-sidebar-font-size";
		/** 校验并夹取到合法区间；非整数/非数字回退默认。 */
		function normalizeSidebarFont(value) {
			const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
			if (!Number.isFinite(n) || !Number.isInteger(n)) return 13;
			if (n < 11) return 11;
			if (n > 16) return 16;
			return n;
		}
		/** 读取已保存的侧边栏字号（无记录或不可用时回退默认）。 */
		function readSidebarFont() {
			if (typeof localStorage === "undefined") return 13;
			try {
				const raw = localStorage.getItem(KEY);
				if (raw === null || raw === "") return 13;
				return normalizeSidebarFont(raw);
			} catch {
				return 13;
			}
		}
		/** 持久化侧边栏字号。 */
		function writeSidebarFont(px) {
			if (typeof localStorage === "undefined") return;
			try {
				localStorage.setItem(KEY, String(normalizeSidebarFont(px)));
			} catch {}
		}
		/**
		* 把侧边栏字号写到 html + body 的内联变量。
		*
		* 必须双写：浅色兜底调色板定义在 body 上，其特异性高于 :root；只写
		* documentElement 会被 body 规则覆盖（AGENTS.md 6.3）。
		*/
		function applySidebarFont(px) {
			if (typeof document === "undefined") return;
			const value = `${normalizeSidebarFont(px)}px`;
			document.documentElement.style.setProperty(SIDEBAR_FONT_VARIABLE, value);
			if (document.body) document.body.style.setProperty(SIDEBAR_FONT_VARIABLE, value);
		}
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
		/**
		* 侧边栏字号行的 store。与主题行同样的「镜像 + revision 守卫」范式：
		* 唯一写入方是 apply-world 的同步调用，组件经 useStore 只读。
		* @returns store 句柄。
		*/
		function createSidebarFontStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({
					size: 13,
					revision: -1
				}),
				actions: { sync: (d, size, revision) => {
					if (revision <= d.revision) return;
					d.size = size;
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
		const css$1 = ".bNLuYa_group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:16px 0;display:flex}.bNLuYa_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.bNLuYa_cubeRow{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}.bNLuYa_themeCube{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:16px;flex-direction:column;flex:180px;justify-content:center;align-items:center;gap:4px;padding:20px 32px;font-size:14px;line-height:22px;display:flex}.bNLuYa_themeCube:hover:not(.bNLuYa_selected){background:var(--dsw-alias-interactive-bg-hover)}.bNLuYa_selected{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)!important;border:1.5px solid var(--dsw-alias-brand-primary)!important;color:var(--dsw-alias-brand-primary)!important;box-shadow:0 4px 14px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent)!important;border-radius:14px!important}.bNLuYa_selected *{color:var(--dsw-alias-brand-primary)!important;fill:currentColor!important}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-theme-custom/TechThemeRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-theme-custom";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
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
		* Six cubes rendered only when this plugin mounts, so the official ui-theme
		* package never references the custom theme ids. Selection follows the persisted
		* preference, never the resolved active theme; the ids persist through the official
		* settings scope because `THEME_PREFERENCES` includes them.
		*/
		/** 液态 (Liquid Frost) 主题专有图标：透光液态水滴，带镜面反射微弧 */
		function IconLiquid16({ size = 16, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.2C8 2.2 3.8 7.4 3.8 10.2C3.8 12.5 5.7 14.4 8 14.4C10.3 14.4 12.2 12.5 12.2 10.2C12.2 7.4 8 2.2 8 2.2Z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M6.2 9.8C6.3 11.2 7.4 12.2 8.6 12.3",
					strokeWidth: "1.1",
					strokeLinecap: "round",
					opacity: "0.65"
				})]
			});
		}
		/** 曜黑 (Dark Obsidian) 主题专有图标：黑曜石多面体切面晶石棱镜 */
		function IconObsidian16({ size = 16, className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polygon", { points: "8,1.8 13.8,6 11.6,13.8 4.4,13.8 2.2,6" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", {
						points: "8,1.8 8,13.8",
						strokeWidth: "1",
						opacity: "0.6"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", {
						points: "2.2,6 8,8.2 13.8,6",
						strokeWidth: "1",
						opacity: "0.6"
					})
				]
			});
		}
		/** Locale namespace registered by this plugin (see src/client/index.ts). */
		const SETTINGS_NS = "settings.theme.custom";
		/** Cube order and icons. Id must match a registered theme id. */
		const CUBES = [
			{
				id: "sequoia",
				labelKey: "tech-theme.sequoia",
				Icon: IconLiquid16
			},
			{
				id: "sonoma",
				labelKey: "tech-theme.sonoma",
				Icon: IconObsidian16
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
		//#region \0dsh-css:C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\SidebarFontRow.module.css.mjs
		const css = ".LcL5XW_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.LcL5XW_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.LcL5XW_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.LcL5XW_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.LcL5XW_control{flex:none;align-items:center;gap:8px;display:inline-flex}.LcL5XW_stepper{background:var(--dsw-alias-bg-module-platform);border-radius:18px;justify-content:center;align-items:center;min-width:72px;height:36px;display:inline-flex;position:relative}.LcL5XW_value{text-align:center;width:34px;min-width:18px;font:inherit;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;padding:0;font-size:14px;line-height:22px}.LcL5XW_value:focus-visible{box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);border-radius:6px}.LcL5XW_unit{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}.LcL5XW_arrows{opacity:0;flex-direction:column;gap:2px;display:flex;position:absolute;right:8px}.LcL5XW_stepper:hover .LcL5XW_arrows,.LcL5XW_stepper:focus-within .LcL5XW_arrows{opacity:1}.LcL5XW_arrow{background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 75%, transparent);width:17px;height:12px;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:3px;justify-content:center;align-items:center;padding:0;display:inline-flex}.LcL5XW_arrow:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}.LcL5XW_arrow:disabled{color:var(--dsw-alias-label-caption);cursor:default}";
		const tagId = "@deepseek-ai/dsh-client-ui-theme-custom/SidebarFontRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-theme-custom";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SidebarFontRow_module_css_default = {
			"arrow": "LcL5XW_arrow",
			"arrows": "LcL5XW_arrows",
			"control": "LcL5XW_control",
			"desc": "LcL5XW_desc",
			"row": "LcL5XW_row",
			"rowText": "LcL5XW_rowText",
			"stepper": "LcL5XW_stepper",
			"title": "LcL5XW_title",
			"unit": "LcL5XW_unit",
			"value": "LcL5XW_value"
		};
		//#endregion
		//#region src/client/SidebarFontRow.tsx
		/**
		* 侧边栏字号偏好行：注册进 General 区的 item 槽，紧邻官方「字号大小」行之后。
		*
		* 为什么单独一行而不是改官方那行：官方 FontSizeRow 属 ui-theme 包，且官方源码
		* 零修改是架构铁律（AGENTS.md 铁律 1）。插件经 settings.general.item 槽位新增
		* 自己的行，与官方行共用同一套视觉节奏。
		*
		* 交互：数字输入框（直接键入）+ 上下步进（微调）。键入非法值在 blur 时夹取回合法值，
		* 因此不会出现空值或越界持久化。
		*/
		/**
		* 渲染侧边栏字号行。
		* @param props - 槽位组合 props。
		* @returns 该行的元素树。
		*/
		function SidebarFontRow({ t, setSidebarFont, useStore }) {
			const size = useStore((s) => s.size);
			const [draft, setDraft] = (0, react.useState)(null);
			const commit = (next) => {
				setSidebarFont(normalizeSidebarFont(next));
				setDraft(null);
			};
			const onInput = (e) => {
				setDraft(e.target.value.replace(/[^\d]/g, "").slice(0, 2));
			};
			const onBlur = () => {
				if (draft === null) return;
				if (draft === "") {
					setDraft(null);
					return;
				}
				commit(Number.parseInt(draft, 10));
			};
			const onKeyDown = (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					const v = draft ?? String(size);
					commit(v === "" ? size : Number.parseInt(v, 10));
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SidebarFontRow_module_css_default.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SidebarFontRow_module_css_default.rowText,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SidebarFontRow_module_css_default.title,
						children: t("sidebar-font.title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SidebarFontRow_module_css_default.desc,
						children: t("sidebar-font.description")
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SidebarFontRow_module_css_default.control,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SidebarFontRow_module_css_default.stepper,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: SidebarFontRow_module_css_default.value,
							type: "text",
							inputMode: "numeric",
							"aria-label": t("sidebar-font.title"),
							value: draft ?? String(size),
							onChange: onInput,
							onBlur,
							onKeyDown
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: SidebarFontRow_module_css_default.arrows,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: SidebarFontRow_module_css_default.arrow,
								"aria-label": t("sidebar-font.increase"),
								disabled: size >= 16,
								onClick: () => {
									commit(size + 1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutline14, { size: 9 })
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: SidebarFontRow_module_css_default.arrow,
								"aria-label": t("sidebar-font.decrease"),
								disabled: size <= 11,
								onClick: () => {
									commit(size - 1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 9 })
							})]
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: SidebarFontRow_module_css_default.unit,
						children: t("sidebar-font.unit")
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Sequoia: macOS Sequoia 液态透光浅色版 (Liquid Frost Light). */
		const SEQUOIA = Object.freeze({
			id: "sequoia",
			colorScheme: "light",
			tokens: SEQUOIA_TOKENS
		});
		/** Sonoma: macOS Sonoma 深空曜黑暗色版 (Dark Obsidian Pro). */
		const SONOMA = Object.freeze({
			id: "sonoma",
			colorScheme: "dark",
			tokens: SONOMA_TOKENS
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
/* ── 无边框融合（方案 C）：顶部同色屏障带 ──────────────────────────────
   壳顶栏与内容区是两个物理不重叠的 WebView，要做到「看起来无边框」，
   必须让内容区**最顶端的色值**与壳顶栏逐字节一致。

   做法：在背景层最前面插一条与 bg-base 同色的实心带，高度 = 壳顶栏高度，
   再向下渐隐过渡到主题原有的极光渐变。由于它位于最上层，故顶部 44px
   内任何主题都呈现纯净的 bg-base 色 —— 而 bg-base 已与壳顶栏同色。

   ⚠️ --dsh-fusion-top 必须等于 desktop/src-tauri/src/lib.rs 的 TITLEBAR_HEIGHT，
   改一处必须同步另一处（sequoia-neutral-check.mjs 有门禁锁定）。 */
body[data-ds-custom-theme]{
  --dsh-fusion-top:44px;

  /* ── 毛玻璃参数（Frosted Glass）────────────────────────────────────────
     ⚠️ 材质定义：本插件做的是「毛玻璃」，不是「磨砂/砂纸」。

        · 毛玻璃 = 表面光滑无颗粒，背后内容被 blur 化开，隐约可见明暗但读不出字。
        · 磨砂   = 表面有微观颗粒（需叠 SVG 分形噪声纹理层）。

     历史教训：曾误做成磨砂，叠了一层 SVG fractalNoise 去色颗粒。
     该噪声 rect 带满 alpha，叠加会**同时压暗整体明度** —— 强度 0.20/0.12/0.05/0.03
     一路调下来始终是「糊了一层灰雾」的脏感，方向本身就是错的，调参无解。已全部移除。

     ⚠️ 两条独立的轴，切勿搞混（这是最容易做反的地方）：
        · 「透多少」由填充 alpha 控制 —— 调高会看不到背后（变白板）。
        · 「糊多狠」由 blur 半径控制 —— 遮住背后文字只能靠它，不能靠加填充。

     用户确认参数：填充 .38 + blur(92px) saturate(180%)。

     🚨 适用范围收窄（用户实测反馈）：
     玻璃材质**只服务 液态 sequoia 与 曜黑 sonoma 两个主题**。
     用户原话：「只有给液态以及曜黑这两个主题加好看，其他 4 个主题加了都不好看」。
     故冥夜 void / 银曜 jade / 灼日 solar / 缃素 parchment 一律**不加玻璃**，
     完全保持官方原始外观（含输入区压底渐变、面板填充、投影、描边等）。

     实现方式：给每条材质规则加主题门控前缀（body[data-ds-custom-theme="sequoia"] /
     "sonoma"），而不是给 4 个主题逐个写「归零」例外 ——
     后者会把 background 改成 transparent，连官方原有底衬一起抹掉，属于破坏而非还原。 */
  --dsh-glass-blur:blur(92px) saturate(180%);

  /* 两个玻璃主题各自的取值（sequoia 浅 / sonoma 深，各自独立、不共用） */
  --dsh-glass-fill:rgba(255,255,255,0.38);
  --dsh-glass-sheen:linear-gradient(180deg,
      rgba(255,255,255,0.30) 0%,
      rgba(255,255,255,0.05) 48%,
      rgba(255,255,255,0)    78%);
  --dsh-glass-edge:rgba(255,255,255,0.96);
  --dsh-glass-rim:rgba(255,255,255,0.58);
  --dsh-glass-bottom:rgba(255,255,255,0.40);
  /* 弹窗单独一档：内容面板可读性优先，填充比输入坞实得多 */
  --dsh-glass-dialog-fill:rgba(255,255,255,0.78);
  /* 浮层（菜单/提示）也单列一档：承载可读文字，不能沿用输入坞的 .38 */
  --dsh-glass-popover-fill:rgba(255,255,255,0.72);
}
/* 曜黑（深色）：填充与高光必须取深色系值 —— 照抄浅色的 rgba(255,255,255,.38)
   会让面板发灰发白，与暗色背景割裂。 */
body[data-ds-custom-theme="sonoma"]{
  --dsh-glass-fill:rgba(26,30,38,0.46);
  --dsh-glass-sheen:linear-gradient(180deg,
      rgba(255,255,255,0.10) 0%,
      rgba(255,255,255,0.02) 48%,
      rgba(255,255,255,0)    78%);
  --dsh-glass-edge:rgba(255,255,255,0.16);
  --dsh-glass-rim:rgba(255,255,255,0.10);
  --dsh-glass-bottom:rgba(255,255,255,0.06);
  --dsh-glass-dialog-fill:rgba(26,30,38,0.78);
  --dsh-glass-popover-fill:rgba(26,30,38,0.82);
}
/* ── 无边框融合屏障带（方案 C）──────────────────────────────────────────
   作用：内容区最顶端与壳顶栏保持逐字节同色，实现「看不出边框」。

   🚨 实测修复（用户反馈「深色主题下顶部栏与页面顶部这条缝看起来不太友好」）：
   原写法是**硬切边** ——
     linear-gradient(180deg, bg-base 0, bg-base 44px, transparent 44px)
   即「44px 内死纯色，44px 处瞬间变透明」。逐像素实测色阶：
     y=42  RGB(22,24,30)  L=24.1
     y=44  RGB(12,13,18)  L=13.3   ← ΔL = -10.8，一条突兀的暗色断崖
   深色主题下尤其刺眼：顶部是一块「死板纯色」，下方突然切到彩色光斑。

   现改为**渐隐带**：44px 内保持纯净同色（融合前提不变），
   之后用 100px 左右平滑过渡到主题原有背景。实测同一位置：
     y=44  ΔL = -1.0（无可见台阶）

   ⚠️ 两条硬约束：
     1. --dsh-fusion-top 必须等于 desktop/src-tauri/src/lib.rs 的 TITLEBAR_HEIGHT（44px）。
        三处需同步：shell.html 的 --dsh-titlebar-height、lib.rs 的 TITLEBAR_HEIGHT、此处。
     2. 屏障带必须位于 background **最上层**（CSS 第一项），否则彩色光斑会盖住它，
        顶部就不再与顶栏同色，融合失效。

   渐隐长度用固定 100px（= 44 + 100 = 144px 处完全过渡完），
   比 44px 的 2 倍略长，足够柔和又不会把光晕糊掉。 */
[class$="centerCol"] > :first-child > [class$="_root"],
[class$="centerCol"] [data-slot="main.conversation"] > [class*="_root"]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      transparent calc(var(--dsh-fusion-top, 44px) + 100px)),
    var(--dsw-alias-bg-app-image),
    var(--dsw-alias-bg-base) !important;
}
/* 注意：侧边栏顶部**不能**在此加同色屏障带 —— 下方 body[data-ds-dark-theme] /
   body:not([data-ds-dark-theme]) / body[data-ds-custom-theme="*"] 三条规则对同一
   选择器的特异性更高，会直接覆盖这里。侧边栏顶部的融合改由其各自的主题规则处理
   （见 sequoia 等主题块内的 sidebarCol root 定义）。 */

/* ══════════════════════════════════════════════════════════════════════════
   毛玻璃材质（Glassmorphism）· **仅 液态 sequoia 与 曜黑 sonoma**
   ══════════════════════════════════════════════════════════════════════════

   🚨 适用范围（用户实测确认）：
   用户反馈「只有给液态以及曜黑这两个主题加好看，其他 4 个主题加了都不好看」。
   故冥夜 void / 银曜 jade / 灼日 solar / 缃素 parchment **完全不加玻璃**，
   保持官方原始外观。

   实现方式：所有材质规则统一加主题门控（body[data-ds-custom-theme="sequoia"] /
   "sonoma" 前缀）。**不要**改用「把参数归零」的写法 —— 那会把 background 改成
   transparent，连官方原有底衬一起抹掉，属于破坏而非还原。

   分级原则：backdrop-filter 的收益取决于「背后是什么」。
     · A 组：背后**有内容滚过** → blur 有真实收益，上完整毛玻璃。
     · B 组：背后是**均匀纯色** → blur(纯色)=纯色，零收益，只做填充。
     · C 组：Portal 到 body 的瞬态浮层。

   ⚠️ 历史失效记录（务必先读）：0.1.5 版改了 CSS Modules 类名，旧规则
   [class*="InputBar_card"] / ChatView_column / AssistantMarkdown_root /
   MessageItem_bubble / codeBlock / _pane / _float / lensBar 实测命中数**全为 0**，
   一条都没生效 —— 这正是「各主题通用缺少玻璃质感」的直接原因。已在下方改写为真实类名。 */

/* ① 结构层（关键前提）：去掉输入区自刷的实色压底。
   实测 composerSeat 带 linear-gradient(transparent, rgb(245,245,247) 36px)，
   叠加纯色 bg-base 后，输入框背后恒为纯色 → blur(纯色)=纯色，
   毛玻璃**数学上不可能生效**。不去掉这层，下方 A1/A2 全部白做。
   ⚠️ 仅对两个玻璃主题生效 —— 其余主题保留官方压底，避免内容与输入框打架。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"]{
  background-image:none !important;
}

/* ── A 组：完整毛玻璃（背后有内容滚动经过）────────────────────────────── */
/* A1 输入坞 · A2 任务进度卡 · A3 撤回气泡 · A4 成本卡 · A5 代码块标题条。

   ⚠️ 实测性能修正：会话行 (dsh-ff__session-row) **不纳入 A 组**。
   侧栏一次性渲染 40+ 个会话行，每个都挂 blur(92px) 会产生 42 个
   backdrop-filter 合成层 —— 而它们背后是侧栏自身的纯色填充，blur 看不出
   任何差别，纯粹白烧 GPU。这就是「背景是纯色时 blur 零收益」原则的典型踩坑。

   ⚠️ 成本卡（cm-footer-stack）包边修正（用户实测反馈）：
   实测该卡片原本有**三重描边叠加** ——
     ① 官方 border: 1px solid rgba(0,0,0,.06)
     ② 我加的闭合 rim: inset 0 0 0 1px rgba(255,255,255,.58)
     ③ --dsw-elevation-prominent 内含的外环: 0 0 0 .5px rgba(0,0,0,.22)
   三重叠加即用户看到的「外面还有一层包边」。

   实测确认：该卡片**官方原生 box-shadow 为 none**（void/jade/solar 三主题实测均为 none），
   故 ②③ 全部是本次新增的，不是官方原有设计。

   现只保留「顶部高光 + 底部回光」两道**单向**内光：
     · 去掉闭合 rim（②）；
     · 去掉 elevation 外环（③）—— 侧栏内的卡片靠自身填充即可与背景分离，
       不需要外投影，更不该有那圈 0.5px 深色描边。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sequoia"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sequoia"] [class*="dsh-recall-bubble"],
body[data-ds-custom-theme="sequoia"] [class*="cm-footer-stack"],
body[data-ds-custom-theme="sequoia"] [class*="_bannerWrap"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sonoma"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sonoma"] [class*="dsh-recall-bubble"],
body[data-ds-custom-theme="sonoma"] [class*="cm-footer-stack"],
body[data-ds-custom-theme="sonoma"] [class*="_bannerWrap"]{
  background:var(--dsh-glass-sheen),var(--dsh-glass-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom) !important;
}
/* 输入坞是**浮在对话流之上**的 sticky 浮层，需要外投影与内容分离；
   成本卡在侧栏内、与背景同为侧栏填充，去掉外投影更干净。
   故只给输入坞/任务卡/标题条补回官方 elevation 的**投影部分**（不含 0.5px 外环）。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sequoia"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sequoia"] [class*="_bannerWrap"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sonoma"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sonoma"] [class*="_bannerWrap"]{
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 3px 8px rgba(0,0,0,0.10),
    0 0 20px rgba(0,0,0,0.05) !important;
}

/* ── B 组：仅填充（背后纯色，**不加 blur，也不加任何 box-shadow**）──────
   B1 侧栏内容层 · B2 右栏列 · B3 右侧面板 · B4 侧栏会话行 · B5 新会话按钮
   B6 成本芯片 · B7 网关开关 · B8~B11 设置弹窗内的步进器/下拉/色块/导航项

   🚨 三处实测踩坑（用户三次反馈「每个单独 DOM 都有外边框/边线」）：
     · 第一轮给了闭合 rim  inset 0 0 0 1px  → 每项被框出一圈完整矩形白线；
     · 第二轮改为只给顶部高光 inset 0 1px 0 → **仍然出线**：会话行高仅 36px，
       每行顶边一条近乎纯白的 1px 线（浅色主题下 rgba(255,255,255,.96)），
       多行堆叠起来就是「每个小 DOM 之间的横向边线」；
     · 第三轮：成本卡仍有包边 —— 官方自带 border + elevation 外环，
       叠加我给的 inset rim，三重描边。

   结论：**列表项/小控件一律不施加任何 box-shadow。**
   本组只做「填充透明度」，其余全部交还官方原始样式。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sequoia"] [data-sidebar-right-panel],
body[data-ds-custom-theme="sequoia"] [class*="dsh-ff__session-row"],
body[data-ds-custom-theme="sequoia"] [class*="_newSession"],
body[data-ds-custom-theme="sequoia"] [class*="cm-chip"],
body[data-ds-custom-theme="sequoia"] [class*="cm-gw-switcher"],
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sonoma"] [data-sidebar-right-panel],
body[data-ds-custom-theme="sonoma"] [class*="dsh-ff__session-row"],
body[data-ds-custom-theme="sonoma"] [class*="_newSession"],
body[data-ds-custom-theme="sonoma"] [class*="cm-chip"],
body[data-ds-custom-theme="sonoma"] [class*="cm-gw-switcher"]{
  box-shadow:none !important;
}

/* ── C 组：瞬态浮层 / Portal（仅两个玻璃主题）────────────────────────────
   C1 设置弹窗 · C2 菜单 · C3 Tooltip。
   C4 Toast **刻意排除** —— 官方是深色实底强调提示
   （--dsw-alias-button-contrast-fill），改半透明会削弱提示力度（用户已确认保持实底）。

   🚨 本轮修复（用户反馈「权限展开的选择面板透明度太高、没有背景高斯模糊」）：
   实测该菜单的 computed backdrop-filter **确实是 blur(92px)**，却看不出模糊。根因有二：

   ① **嵌套 backdrop root 导致 blur 失效**（主因）。
      实测祖先链：[role="menu"] → _root_1nxmc_1 → QwfZkG_modes → QwfZkG_tools
      → QwfZkG_row → **QwfZkG_card（输入坞卡片，自带 backdrop-filter）**。
      即该菜单是**输入坞卡片的 DOM 后代**。CSS 规范：带 backdrop-filter 的元素会建立
      新的 backdrop root，其后代的 backdrop-filter **只能模糊该 root 内部已合成的内容**。
      而卡片内部是均匀填充 → 菜单等于「模糊了一个寂寞」。
      修法沿用本项目对 sidebarCol 已确立的做法：**把卡片的 blur 移到 ::before 伪元素**
      （伪元素不是菜单的祖先，不会为后代建立 backdrop root）。

   ② **填充沿用了输入坞的 .38 档，太透**。
      菜单是**承载可读文字**的浮层（选项 + 勾选态），不是大面积背景板。
      与输入坞共用 .38 会让背后文字直接穿透、选项互相干扰。
      故为浮层单列一档 --dsh-glass-popover-fill（浅 .72 / 深 .82），
      与 --dsh-glass-dialog-fill 同理：**内容可读性优先于通透度**。 */
body[data-ds-custom-theme="sequoia"] [role="dialog"],
body[data-ds-custom-theme="sequoia"] [role="menu"],
body[data-ds-custom-theme="sequoia"] [role="tooltip"],
body[data-ds-custom-theme="sonoma"] [role="dialog"],
body[data-ds-custom-theme="sonoma"] [role="menu"],
body[data-ds-custom-theme="sonoma"] [role="tooltip"]{
  background:var(--dsh-glass-sheen),var(--dsh-glass-popover-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    0 24px 60px rgba(0,0,0,0.18) !important;
}

/* ① 解除嵌套 backdrop root：输入坞卡片的 blur 移到 ::before 伪元素。
   ⚠️ 伪元素 z-index:-1 需要卡片自身建立 stacking context（position+z-index:0），
   否则会掉到卡片背景之下而看不见。
   ⚠️ 卡片自身**严禁**再带 backdrop-filter —— 那正是菜单模糊失效的根因。

   ── 推广范围已全页实测（不是推测）────────────────────────────────
   判据：**自身带 backdrop-filter 且内部含绝对/固定定位浮层**的容器才需此修法。
   实测结果（sequoia 会话页全量扫描）：
     · QwfZkG_card（输入坞卡片）  内部有权限菜单/模型下拉  → **需修**（即本节）
     · kdtA_a_flowItem（AI 回复卡）内部浮层数 = 0          → 无需修
       （其 aria-expanded 是**内联折叠行**，展开的是文档流内容，不脱离文档流、
         不依赖祖先 blur 透视背景；实测 absoluteLayersInsideCard = []）
     · cm-footer-stack / dsh-recall-bubble / _bannerWrap  内部浮层数 = 0 → 无需修
     · sidebarCol / rightbarCol   blur 本就在 ::before 上，主元素无 blur → 本就安全
       （设置弹窗 Portal 虽挂其子树下，但祖先无 backdrop root，故 blur 正常）

   全页复扫「自身带 blur + 内含定位浮层」的容器数 = **0**，即风险已清零。
   ⚠️ 若日后 A 组新增成员且其内部会弹出浮层，必须套用本节同一修法。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]{
  position:relative;z-index:0;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"]::before,
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  border-radius:inherit;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
}
/* 卡片内含浮层时抬层，确保菜单浮在卡片内容之上（用 :has 自适应，无需改 JS） */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"]:has([role="menu"]),
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]:has([role="menu"]){
  z-index:9500 !important;
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
   which would break the settings dialog (portal renders inside sidebar).

   ⚠️ 顶部融合屏障（**六主题通用，不分深浅**）：
   中央内容区一直带「同色屏障 + 渐隐」，而侧栏此前没有 —— 导致侧栏顶部直接
   暴露半透明填充与光斑，与顶栏形成亮度断层。逐像素实测（修复前）：
     · void  左=33.7  中=13.3  → 差 20.3 阶
     · solar 左=36.8  中=15.4  → 差 21.3 阶
     · parchment 左=219.6 中=224.4 → 差 4.8 阶
   用户反馈「左右侧边栏跟顶部栏反差，其他 4 个主题也要一同修复」。
   故把屏障提到**通用规则**层：无论深浅主题，顶部 44px 一律等于 bg-base，
   再向下渐隐到主题原有材质。补齐后三处顶部亮度一致（差 < 1.5 阶）。
   ⚠️ 屏障必须在 background **最上层**（CSS 第一项），否则会被光斑盖住。 */
body[data-ds-dark-theme] [class*="sidebarCol"] > * > [class*="root"]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      transparent calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
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
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
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
/* 右栏面板同样补「顶部同色融合屏障」（六主题通用，与左侧栏一致）。
   缺失时其顶部会直接暴露半透明填充与光斑，与顶栏形成亮度断层。 */
body[data-ds-dark-theme] [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      transparent calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent) !important;
  /* 去掉顶部 inset 亮线（会在顶栏正下方形成横贯亮线） */
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.05), inset 1px 0 0 rgba(255,255,255,0.04) !important;
}
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 30%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 20%, transparent) 0%,
      transparent 60%),
    var(--dsw-specific-sidebar-fill) !important;
  box-shadow:
    inset -1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.06)),
    inset 1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.04)) !important;
}
/* 右栏 fullscreen 态的面板 blur 由上方 C 组统一处理，这里不再重复。 */

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

/* Dialogs/modals：毛玻璃面板（**仅 液态 sequoia 与 曜黑 sonoma**）。
   ⚠️ 弹窗是**大面积内容面板**（表单、长列表、设置项），可读性优先于通透度，
   故填充比输入坞更实 —— 单独用 --dsh-glass-dialog-fill，不共用 .38 的输入坞填充。
   配方（填充 + 虚化 + 光学边缘）与 C 组一致，此处只覆盖填充与投影。
   ⚠️ 主题门控写死为 sequoia / sonoma 两个 id：
   不得改到内置 light/dark，也不得扩散到其余四个自定义主题（用户已确认）。 */
body[data-ds-custom-theme="sonoma"] [role="dialog"]{
  background:
    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 30%),
    var(--dsh-glass-dialog-fill) !important;
  backdrop-filter:var(--dsh-glass-blur) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    0 6px 16px rgba(0,0,0,0.40),
    0 24px 60px rgba(0,0,0,0.50) !important;
}
body[data-ds-custom-theme="sequoia"] [role="dialog"]{
  background:
    linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 34%),
    var(--dsh-glass-dialog-fill) !important;
  backdrop-filter:var(--dsh-glass-blur) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    0 12px 32px rgba(15, 23, 42, 0.08),
    0 24px 64px rgba(15, 23, 42, 0.05) !important;
}

/* Oriental Calligraphic & Inkstone accents:
   1. Blockquote: brush-stroke vermilion/ink left spine
   2. Horizontal rule: dry-brush ink wash taper */
body:not([data-ds-dark-theme]) blockquote {
  border-left: 3px solid var(--dsw-alias-brand-primary, #9c301c) !important;
  background: var(--dsw-alias-markdown-citation, rgba(34, 28, 24, 0.04)) !important;
  border-radius: 0 6px 6px 0 !important;
}
body:not([data-ds-dark-theme]) hr {
  border: none !important;
  height: 1px !important;
  background: linear-gradient(90deg, transparent 0%, var(--dsw-alias-border-l3, rgba(34, 28, 24, 0.15)) 25%, var(--dsw-alias-border-l3, rgba(34, 28, 24, 0.15)) 75%, transparent 100%) !important;
}

/* ==========================================================================
   macOS Sequoia & Sonoma Liquid Glass & Physical Material Engine
   ========================================================================== */

/* 全局字体：优先采用 Apple 原生 SF Pro 排版 */
body[data-ds-custom-theme="sequoia"],
body[data-ds-custom-theme="sonoma"] {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
}

/* 视窗外框发丝高光倒角（Hairline Specular Rim：模拟精密切削玻璃微反光）
   ⚠️ 实测：AppFrame 的真实类名是 哈希前缀加 _frame（如 V41CyG_frame），源码目录名
   AppFrame 不在 DOM 里。改用后缀匹配 _frame，同时必须限定含有直接子级 sidebarCol
   （即顶层视窗容器），严禁裸写 [class$="_frame"] —— 否则会误伤对话流右侧的
   轮次导航条（nav.PodZZa_frame），导致导航条四周被误加矩形描边。

   液态主题例外：该高光贴在 AppFrame 顶边，正好横贯「顶栏—内容区」接缝，
   rgba(255,255,255,0.95) 的 1px 白线 + 全周 0.55 白环在纯色底上会被读成
   一条明确的分界线。故液态主题整体不发丝高光（视觉统一优先）。 */
body[data-ds-custom-theme="sonoma"] div[class$="_frame"]:has(> [class*="sidebarCol"]) {
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
}

/* 轮次导航条（TurnNavigator，标签为 nav.PodZZa_frame）：
   浮动在对话流右侧，坚决禁止继承任何外框发丝阴影或误伤边框 */
nav[class*="frame"],
[class*="TurnNavigator"] {
  box-shadow: none !important;
}

/* 输入坞的聚焦态反馈（液态/曜黑各一套主题色）。
   ⚠️ 旧规则用 [class*="InputBar_card"]，0.1.5 改名后实测命中数为 0，一直没生效。
   现改用结构稳定的 [class*="composerSeat"] [class$="_card"]（与 A1 组同源）。
   填充、虚化、颗粒均已由 A 组统一配方与 --dsh-glass-* 令牌接管，
   此处只保留「聚焦环 + 圆角」这两项纯交互反馈，避免与 A 组 !important 打架。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"] {
  border-radius: 20px !important;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"]:focus-within {
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 0 0 3px rgba(0, 113, 227, 0.18),
    var(--dsw-elevation-prominent, none) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"] {
  border-radius: 20px !important;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]:focus-within {
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 0 0 3px rgba(41, 151, 255, 0.22),
    var(--dsw-elevation-prominent, none) !important;
}

/* 全局 Primary 按钮（涵盖插件市场「全部更新」、「安装」、发送按钮与操作确认键）：
   彻底消除深暗高对比刺眼纯色，升级为 Apple 原生透光晴空蓝微渐变与发丝微反光 */
body[data-ds-custom-theme="sequoia"] button[class*="_primary"],
body[data-ds-custom-theme="sequoia"] [class*="_primary"],
body[data-ds-custom-theme="sequoia"] button[class*="sendButton"] {
  border-radius: 14px !important;
  background: linear-gradient(180deg, #3898fc 0%, #147ce5 100%) !important;
  box-shadow:
    0 2px 8px rgba(20, 124, 229, 0.22),
    inset 0 1px 1px rgba(255, 255, 255, 0.40) !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  color: #ffffff !important;
  font-weight: 500 !important;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] button[class*="_primary"] *,
body[data-ds-custom-theme="sequoia"] [class*="_primary"] *,
body[data-ds-custom-theme="sequoia"] button[class*="sendButton"] * {
  color: #ffffff !important;
  fill: currentColor !important;
}
body[data-ds-custom-theme="sequoia"] button[class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sequoia"] [class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sequoia"] button[class*="sendButton"]:hover:not(:disabled) {
  background: linear-gradient(180deg, #4da5ff 0%, #288bf2 100%) !important;
  box-shadow:
    0 4px 12px rgba(20, 124, 229, 0.32),
    inset 0 1px 1px rgba(255, 255, 255, 0.55) !important;
  transform: translateY(-0.5px);
}

body[data-ds-custom-theme="sonoma"] button[class*="_primary"],
body[data-ds-custom-theme="sonoma"] [class*="_primary"],
body[data-ds-custom-theme="sonoma"] button[class*="sendButton"] {
  border-radius: 14px !important;
  background: linear-gradient(180deg, #3aa0ff 0%, #2997ff 100%) !important;
  box-shadow:
    0 0 14px rgba(41, 151, 255, 0.32),
    inset 0 1px 1px rgba(255, 255, 255, 0.30) !important;
  border: 1px solid rgba(255, 255, 255, 0.20) !important;
  color: #ffffff !important;
  font-weight: 500 !important;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] button[class*="_primary"] *,
body[data-ds-custom-theme="sonoma"] [class*="_primary"] *,
body[data-ds-custom-theme="sonoma"] button[class*="sendButton"] * {
  color: #ffffff !important;
  fill: currentColor !important;
}
body[data-ds-custom-theme="sonoma"] button[class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sonoma"] [class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sonoma"] button[class*="sendButton"]:hover:not(:disabled) {
  background: linear-gradient(180deg, #4da9ff 0%, #3aa0ff 100%) !important;
  box-shadow:
    0 0 20px rgba(41, 151, 255, 0.48),
    inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;
  transform: translateY(-0.5px);
}

/* 用户气泡：Apple 官方高光胶囊。
   ⚠️ 选择器已修正：旧写法 [class*="MessageItem_bubble"] 依赖「源码目录名」，
   而 CSS Modules 产出的是 <hash>_bubble —— 源码名从不出现在 DOM，实测命中为 0。
   改用后缀式 [class$="_bubble"]（不含哈希，跨版本稳定），并以 userStack 限定为用户气泡，
   避免误伤 tooltip 的 .bubble。 */
body[data-ds-custom-theme="sequoia"] [class*="userStack"] > [class$="_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #0071e3 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.28) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="userStack"] > [class$="_bubble"] * {
  color: #ffffff !important;
}

body[data-ds-custom-theme="sonoma"] [class*="userStack"] > [class$="_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #2997ff !important;
  color: #ffffff !important;
  box-shadow: 0 4px 18px rgba(41, 151, 255, 0.40) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="userStack"] > [class$="_bubble"] * {
  color: #ffffff !important;
}

/* AI 助手回复卡片（**仅液态 sequoia 与曜黑 sonoma** 有此卡面化处理，
   其余四主题保持官方原生段落样式 —— 不做范围外改版）。
   ⚠️ 旧写法 ChatView_column / AssistantMarkdown_root 均为源码目录名，实测命中为 0。
   改用稳定的 slot 锚点 + 后缀式 markdown 类（hash-independent）。

   ⚠️ 该卡片的玻璃质感依赖主题的 --dsw-alias-bg-app-image 提供底衬变化：
     · sonoma：紫/蓝/粉三色光斑底 → 透出后玻璃质感明显 ✅
     · sequoia：已按「方案 B」恢复极淡冷调光晕，特征点落在内容列内 → 可透出 ✅
   若某主题把 bg-app-image 设为 none，则卡片背后恒为纯色，模糊纯色仍是纯色，
   此时只能呈现「顶部光学反光 + 轻微明度差」，不会有明显通透感（物理限制）。
   ⚠️ 只给顶部高光与底部回光两道单向光，**不给闭合 rim**（避免包边）。 */
body[data-ds-custom-theme="sequoia"] [data-slot="main.conversation"] [class*="flowItem"]:has([class*="_markdown_"]),
body[data-ds-custom-theme="sonoma"] [data-slot="main.conversation"] [class*="flowItem"]:has([class*="_markdown_"]) {
  background:var(--dsh-glass-sheen),var(--dsh-glass-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 16px 20px !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 10px 30px rgba(0, 0, 0, 0.07) !important;
}

/* 侧边栏毛玻璃材质与透光 (Sidebar Glassmorphism)
   注意（历史硬规则）：绝对不能在 [class*="sidebarCol"] 主元素上直接设置 backdrop-filter！
   因为设置弹窗 (Settings Dialog) 的 Portal 挂载在 sidebarCol DOM 树下，backdrop-filter 会为
   position: fixed 子元素创建新的包含块 (Containing Block)，导致设置弹窗宽度被压死成侧边栏同宽！
   毛玻璃滤镜必须严格挂载在伪元素 ::before 上，该伪元素不是弹窗的祖先节点，完全安全。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] {
  background: transparent !important;
  /* 左栏右缘竖向分界线（用户要求保留）：
     用「中性浅灰」而非高反差黑/白 —— 在大面积同色底上，
     0.5px 的克制灰线能清晰界定两栏，又不会像 1px 纯黑那样突兀。 */
  border-right: 0.5px solid rgba(0, 0, 0, 0.10) !important;
}
/* 侧边栏毛玻璃：blur 半径拉大（56px），配合下方 0.34 的极淡填充，
   玻璃通透度显著提升（观感 = 模糊半径 ÷ 填充不透明度）。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"]::before {
  backdrop-filter: blur(56px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(56px) saturate(190%) !important;
}
/* 侧边栏内容层：半透明填充 + 顶部与顶栏同色融合屏障。
   层次顺序（CSS background 第一项在最上）：
     ① 融合屏障（顶部 44px 与顶栏逐字节同色，任何叠加层不得侵入否则破坏融合）
     ② 半透明填充
   ⚠️ 屏障同样采用**渐隐过渡**而非硬切边（与内容区一致）：
   侧栏底衬虽是不透明填充，硬切边在这里肉眼不可见，但保持全站一致可避免
   将来调整侧栏填充透明度时这条断崖重新暴露。门禁统一锁「不得出现硬切」。
   ⚠️ 已移除磨砂颗粒层：本插件做的是毛玻璃（表面光滑），颗粒属被否决的材质。
   ⚠️ 严禁 inset 白色高光：inset 0 1px 1px rgba(255,255,255,·) 会画在内容层
   顶部（y=0，即壳顶栏正下方 y=44 处），在纯色底上直接表现为一条横贯的白线。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > * > [class*="root"] {
  background:
    linear-gradient(180deg,
      rgb(245, 245, 247) 0,
      rgb(245, 245, 247) var(--dsh-fusion-top, 44px),
      rgba(245, 245, 247, 0.88) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(245, 245, 247, 0.72) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgba(245, 245, 247, 0.66) !important;
  box-shadow: none !important;
}

body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] {
  background: transparent !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"]::before {
  backdrop-filter: blur(34px) saturate(170%) !important;
  -webkit-backdrop-filter: blur(34px) saturate(170%) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > * > [class*="root"] {
  background:
    /* ① 顶部同色融合屏障（**必须在最上层**）—— 逐字节等于 bg-base，
          向下渐隐过渡到主题原有填充。缺这条则侧栏顶部直接暴露半透明填充
          + 紫色光斑，与顶栏形成约 11 阶亮度断层（实测 L≈35 vs 24.1），
          用户反馈「左右侧边栏跟顶部边栏反差太大，没有像中间一样自然过渡」。 */
    linear-gradient(180deg,
      rgb(22, 24, 30) 0,
      rgb(22, 24, 30) var(--dsh-fusion-top, 44px),
      rgba(22, 24, 30, 0.55) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(22, 24, 30, 0) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    /* ② 主题原有材质 */
    radial-gradient(ellipse 85% 65% at 48% 28%, rgba(140, 70, 240, 0.15) 0%, transparent 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  /* ⚠️ 严禁 inset 白色内高光：inset 0 1px 1px 会画在内容层顶部，
     即壳顶栏正下方，在深色底上表现为一条横贯亮线（历史踩坑）。 */
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.09) !important;
}

/* 右侧抽屉面板：与顶栏同色系，不发丝高光（同左侧栏，避免色差被读成分界）。
   ⚠️ 已移除磨砂颗粒层（毛玻璃不要颗粒）。
   ⚠️ 同样补上**顶部同色融合屏障**：右栏面板是独立绘制的 surface，
   缺屏障时其顶部会直接暴露半透明填充与光斑，与顶栏形成断层
   （与左侧栏同一根因，用户反馈「左右侧边栏跟顶部边栏反差太大」）。 */
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] [data-sidebar-right-panel] {
  background:
    linear-gradient(180deg,
      rgb(245, 245, 247) 0,
      rgb(245, 245, 247) var(--dsh-fusion-top, 44px),
      rgba(245, 245, 247, 0.88) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(245, 245, 247, 0.72) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgba(245, 245, 247, 0.68) !important;
  box-shadow: none !important;
}
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] [data-sidebar-right-panel] {
  background:
    linear-gradient(180deg,
      rgb(22, 24, 30) 0,
      rgb(22, 24, 30) var(--dsh-fusion-top, 44px),
      rgba(22, 24, 30, 0.55) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(22, 24, 30, 0) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 85% 65% at 52% 28%, rgba(41, 151, 255, 0.12) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  /* 去掉顶部 inset 亮线（会在顶栏正下方形成横贯亮线） */
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.09) !important;
}

/* 强制保障设置与模态弹窗全屏视口居中，彻底消除包含块压迫 */
[role="presentation"]:has(> [role="dialog"]) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

/* 选中态与分类标签组件视觉调优：柔和半透底色，绝不喧宾夺主，14px 协调几何圆弧
   （涵盖插件市场分类标签、dsh-cost-meter 等扩展的胶囊式 Tab，确保背景与文字对比度充足醒目） */
body[data-ds-custom-theme="sequoia"] [class*="cats"] button[class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="catsWrap"] button[class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="tag"][class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="badge"][class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="cm-tab"][class*="active"],
body[data-ds-custom-theme="sequoia"] button[class*="cm-tab"][class*="active"] {
  background: rgba(0, 113, 227, 0.14) !important;
  color: #0071e3 !important;
  border: 1px solid rgba(0, 113, 227, 0.28) !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 6px rgba(0, 113, 227, 0.10) !important;
  font-weight: 600 !important;
}

body[data-ds-custom-theme="sonoma"] [class*="cats"] button[class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="catsWrap"] button[class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="tag"][class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="badge"][class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="cm-tab"][class*="active"],
body[data-ds-custom-theme="sonoma"] button[class*="cm-tab"][class*="active"] {
  background: rgba(41, 151, 255, 0.18) !important;
  color: #2997ff !important;
  border: 1px solid rgba(41, 151, 255, 0.35) !important;
  border-radius: 8px !important;
  box-shadow: 0 0 10px rgba(41, 151, 255, 0.18) !important;
  font-weight: 600 !important;
}

/* 侧边栏会话/工作区 Nav 条目：仅限真正的侧栏列表，严格排除 [role="dialog"] 与 [role="tab"] */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]),
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] {
  background: rgba(0, 113, 227, 0.12) !important;
  color: #0071e3 !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]) *,
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] * {
  color: #0071e3 !important;
  fill: currentColor !important;
}

body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]),
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] {
  background: rgba(41, 151, 255, 0.16) !important;
  color: #2997ff !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]) *,
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] * {
  color: #2997ff !important;
  fill: currentColor !important;
}

/* 顶部栏 ☰ 毛玻璃面板与「关于」玻璃弹窗已统一由桌面壳的 initialization_script
   （shell_ui_script）提供：它在 document-created 即执行，冷启动引导页也有，
   因此不会出现「先原生菜单、后自定义面板」的跳变。本插件不再重复实现该 UI，
   以免覆盖壳脚本导致跳变回归。动作仍经 __dshNotifyBridge.shellAction() 回到壳侧。 */

/* ── 字号作用域（Type scale）──────────────────────────────────────────
   分两条独立轴：
   - 对话区（阅读内容）：官方 --dsh-content-font-size，由官方行控制。
   - 侧边栏（导航 chrome）：本插件 --dsh-sidebar-font-size，由侧边栏字号行控制。
   两者独立，因为导航与正文同字号会让内容主体失去视觉重量（VS Code / Slack /
   Notion 的侧边栏都固定小一档）。

   设置面板自身跟随对话区轴（它是内容的一部分）。

   ⚠️ 实测硬规则：CSS Modules 哈希后类名形如 V41CyG_frame，**源码目录名
   （AppFrame / SettingsRoot / Rows）不会出现在 DOM 里**。所以：
   - 区域钩子只能用真实存在的片段（sidebarCol / rightbarCol / dsh-ff__ / role="dialog"）；
   - 禁止 [class*="title"] 这类过宽通配：实测命中 49 个元素，会误伤对话区标题。

   ponytail: 侧边栏直接用绝对字号（不是 delta），因为它是独立设置项而非对话区的偏移。 */
body{
  /* 对话区增量轴：设置面板等跟随内容缩放的区域用 */
  --dsh-shell-font-delta:var(--dsh-content-font-delta,0px);
  /* 侧边栏字号兜底：未设置时比对话区默认（14px）小一档 */
  --dsh-sidebar-font-size:13px;
}
/* 左侧边栏：better-sidebar 会话/文件夹/搜索行（真实前缀 dsh-ff__） */
[class*="sidebarCol"] [class*="dsh-ff__title"],
[class*="sidebarCol"] [class*="dsh-ff__header-title"],
[class*="sidebarCol"] [class*="sessionRow"],
[class*="sidebarCol"] [class*="projectRow"],
[class*="sidebarCol"] [class*="searchResultTitle"],
[class*="sidebarCol"] [class*="navLabel"],
[class*="sidebarCol"] [class*="navCell"]{
  font-size:var(--dsh-sidebar-font-size,13px);
}
[class*="sidebarCol"] [class*="searchResultWorkspace"],
[class*="sidebarCol"] [class*="searchResultSnippet"],
[class*="sidebarCol"] [class*="dsh-ff__meta"],
[class*="sidebarCol"] [class*="dsh-ff__subtitle"]{
  font-size:calc(var(--dsh-sidebar-font-size,13px) - 1px);
}
/* 右侧面板：同样归侧边栏轴 */
[class*="rightbarCol"] [class*="sessionRow"],
[class*="rightbarCol"] [class*="navLabel"],
[class*="rightbarCol"] [class*="dsh-ff__title"]{
  font-size:var(--dsh-sidebar-font-size,13px);
}
[class*="rightbarCol"] [class*="searchResultSnippet"],
[class*="rightbarCol"] [class*="dsh-ff__meta"]{
  font-size:calc(var(--dsh-sidebar-font-size,13px) - 1px);
}
/* 设置面板自身：跟随对话区轴（它是内容） */
[role="dialog"] [class*="navTitle"]{
  font-size:calc(16px + var(--dsh-shell-font-delta,0px));
}
[role="dialog"] [class*="navCell"],
[role="dialog"] [class*="navLabel"]{
  font-size:calc(14px + var(--dsh-shell-font-delta,0px));
}
/* 外壳行高随侧边栏字号联动，避免放大后压字 */
[class*="sidebarCol"] [class*="sessionRow"],
[class*="sidebarCol"] [class*="projectRow"]{
  line-height:calc(var(--dsh-sidebar-font-size,13px) + 8px);
}

/* Xcode 风格代码块。
   ⚠️ 代码块**刻意不上毛玻璃**（用户已确认排除 A6）：代码是可读性最高优先级的实体内容，
   半透明会让底层文字透出来干扰阅读，故保持实色底 + 描边。
   选择器修正：旧写法 [class*="codeBlock"] 为源码目录名，实测命中为 0；
   改用真实存在且不含哈希的 [class*="md-code-block"]。 */
body[data-ds-custom-theme="sequoia"] pre,
body[data-ds-custom-theme="sequoia"] [class*="md-code-block"] {
  border-radius: 10px !important;
  border: 1px solid #d0d7de !important;
  background: #f6f8fa !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}
body[data-ds-custom-theme="sonoma"] pre,
body[data-ds-custom-theme="sonoma"] [class*="md-code-block"] {
  border-radius: 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  background: #14161b !important;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5) !important;
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
			sequoia: SEQUOIA_TOKENS,
			sonoma: SONOMA_TOKENS,
			void: VOID_TOKENS,
			jade: JADE_TOKENS,
			solar: SOLAR_TOKENS,
			parchment: PARCHMENT_TOKENS
		};
		/** Theme id → colorScheme map so light custom themes switch palette properly. */
		const THEME_SCHEME_MAP = {
			sequoia: "light",
			sonoma: "dark",
			void: "dark",
			jade: "light",
			solar: "dark",
			parchment: "light"
		};
		/** Token names this plugin wrote inline (its retraction set). */
		const APPLIED_TOKEN_NAMES = /* @__PURE__ */ new Set();
		const TITLEBAR_PRESETS = {
			sequoia: {
				bg: "rgb(245, 245, 247)",
				accent: "rgb(0, 113, 227)",
				line: "transparent",
				text: "rgb(29, 29, 31)",
				muted: "rgb(110, 110, 115)",
				hover: "rgba(0, 113, 227, 0.08)",
				active: "rgba(0, 113, 227, 0.16)"
			},
			sonoma: {
				bg: "rgb(22, 24, 30)",
				accent: "rgb(41, 151, 255)",
				line: "transparent",
				text: "rgb(245, 245, 247)",
				muted: "rgb(161, 161, 166)",
				hover: "rgba(41, 151, 255, 0.12)",
				active: "rgba(41, 151, 255, 0.22)"
			},
			solar: {
				bg: "rgb(18, 14, 16)",
				accent: "rgb(240, 180, 90)",
				line: "transparent",
				text: "rgb(252, 246, 238)",
				muted: "rgb(198, 178, 156)",
				hover: "rgba(240, 180, 90, 0.12)",
				active: "rgba(240, 180, 90, 0.22)"
			},
			parchment: {
				bg: "rgb(230, 224, 212)",
				accent: "rgb(156, 48, 28)",
				line: "transparent",
				text: "rgb(34, 28, 24)",
				muted: "rgb(120, 106, 96)",
				hover: "rgba(156, 48, 28, 0.08)",
				active: "rgba(156, 48, 28, 0.15)"
			},
			jade: {
				bg: "rgb(226, 228, 233)",
				accent: "rgb(20, 22, 28)",
				line: "transparent",
				text: "rgb(20, 22, 28)",
				muted: "rgb(90, 98, 110)",
				hover: "rgba(15, 23, 42, 0.06)",
				active: "rgba(15, 23, 42, 0.10)"
			},
			void: {
				bg: "rgb(13, 13, 16)",
				accent: "rgb(140, 144, 155)",
				line: "transparent",
				text: "rgb(235, 237, 240)",
				muted: "rgb(160, 164, 175)",
				hover: "rgba(140, 144, 155, 0.08)",
				active: "rgba(140, 144, 155, 0.16)"
			}
		};
		/**
		* Synchronize theme and background color with the Tauri desktop shell (if running in desktop).
		* Toggles Windows DWM native title bar dark/light mode and sets caption color on Windows 11.
		*
		* 刻意不下发字号：窗口顶栏属于 chrome（交通灯、托盘菜单都是固定尺寸），
		* 业界惯例与官方 --dsh-content-font-size（content 轴）都不缩放窗口装饰。
		* 字号只作用于页面内的内容区与侧边栏/设置面板。
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
			if (themeId) document.body.setAttribute("data-ds-custom-theme", themeId);
			else document.body.removeAttribute("data-ds-custom-theme");
			const nextKeys = new Set(Object.keys(tokens));
			for (const name of APPLIED_TOKEN_NAMES) if (!nextKeys.has(name)) {
				document.documentElement.style.removeProperty(name);
				document.body.style.removeProperty(name);
				APPLIED_TOKEN_NAMES.delete(name);
			}
			if (!tokens["--dsw-font-family"]) {
				document.documentElement.style.removeProperty("--dsw-font-family");
				document.body.style.removeProperty("--dsw-font-family");
			}
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
			document.body.removeAttribute("data-ds-custom-theme");
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
			let pendingFontSize = null;
			let pendingFontSizeSettle;
			const originalSetFontSize = theme.setFontSize;
			const recordFontSizeIntent = (px) => {
				pendingFontSize = px;
				if (pendingFontSizeSettle !== void 0) clearTimeout(pendingFontSizeSettle);
				pendingFontSizeSettle = void 0;
			};
			theme.setFontSize = function(px) {
				recordFontSizeIntent(px);
				originalSetFontSize.call(this, px);
			};
			ctx.effect(() => () => {
				theme.setFontSize = originalSetFontSize;
				if (pendingFontSizeSettle !== void 0) clearTimeout(pendingFontSizeSettle);
			}, "ui-theme-custom: restore setFontSize wrapper");
			/**
			* 若快照里的字号被旧镜像回滚，重新断言用户意图。
			* @returns true 表示已重新断言（调用方应中止本次后续处理）。
			*/
			const assertFontSizeIntent = (snapshotFontSize) => {
				if (pendingFontSize === null) return false;
				if (snapshotFontSize === pendingFontSize) {
					if (pendingFontSizeSettle === void 0) pendingFontSizeSettle = setTimeout(() => {
						pendingFontSize = null;
						pendingFontSizeSettle = void 0;
					}, 1500);
					return false;
				}
				if (pendingFontSizeSettle !== void 0) {
					clearTimeout(pendingFontSizeSettle);
					pendingFontSizeSettle = void 0;
				}
				try {
					originalSetFontSize.call(theme, pendingFontSize);
				} catch {}
				return true;
			};
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
				if (assertFontSizeIntent(snapshot.fontSize)) return;
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
				order: 10.5,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, TechThemeRow));
			const sidebarStore = createSidebarFontStore();
			let sidebarBound;
			let sidebarRevision = 0;
			const syncSidebarFontRow = () => {
				sidebarBound?.sync(readSidebarFont(), ++sidebarRevision);
			};
			const sidebarInjected = (actions) => {
				sidebarBound = actions;
				syncSidebarFontRow();
				return { setSidebarFont: (px) => {
					const next = normalizeSidebarFont(px);
					writeSidebarFont(next);
					applySidebarFont(next);
					syncSidebarFontRow();
				} };
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "sidebar-font-custom",
				order: 11.5,
				store: sidebarStore,
				locale: SETTINGS_NS,
				inject: sidebarInjected
			}, SidebarFontRow));
			ctx.effect(() => {
				const disposeSequoia = ctx.theme.register(SEQUOIA);
				const disposeSonoma = ctx.theme.register(SONOMA);
				const disposeVoid = ctx.theme.register(VOID);
				const disposeJade = ctx.theme.register(JADE);
				const disposeSolar = ctx.theme.register(SOLAR);
				const disposeParchment = ctx.theme.register(PARCHMENT);
				const removeKeyframes = injectButtonDrift();
				const removeSurfaceGlass = injectSurfaceGlass();
				return () => {
					disposeSequoia();
					disposeSonoma();
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
			try {
				applySidebarFont(readSidebarFont());
			} catch {}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map