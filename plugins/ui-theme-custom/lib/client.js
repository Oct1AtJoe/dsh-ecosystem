window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-theme-custom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/sequoia.ts
		const SEQUOIA_TOKENS = Object.freeze({
			"--dsw-alias-bg-app-image": "radial-gradient(ellipse 900px 520px at 20% 15%, rgba(255, 160, 90, 0.08) 0%, transparent 65%),radial-gradient(ellipse 850px 600px at 85% 85%, rgba(110, 80, 255, 0.06) 0%, transparent 70%),radial-gradient(circle at 60% 40%, rgba(255, 100, 130, 0.05) 0%, transparent 60%),linear-gradient(135deg, rgba(60, 80, 180, 0.03) 0%, rgba(255, 140, 100, 0.02) 50%, rgba(255, 200, 80, 0.03) 100%)",
			"--dsw-alias-glass-blur": "blur(48px) saturate(200%)",
			"--dsw-alias-surface-glass-blur": "blur(32px) saturate(180%)",
			"--dsw-alias-bg-base": "rgba(255, 255, 255, 0.72)",
			"--dsw-alias-surface-glass-spot": "transparent",
			"--dsw-alias-bg-layer-1": "rgba(255, 255, 255, 0.88)",
			"--dsw-alias-bg-layer-2": "rgba(245, 245, 247, 0.92)",
			"--dsw-alias-bg-layer-3": "rgba(235, 235, 238, 0.96)",
			"--dsw-specific-sidebar-fill": "rgba(245, 245, 247, 0.45)",
			"--dsw-alias-bg-module-platform": "rgb(240, 240, 243)",
			"--dsw-alias-bg-multi-select": "rgb(230, 230, 235)",
			"--dsw-alias-bg-overlay": "rgba(255, 255, 255, 0.95)",
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
			"--dsw-specific-bubble-highlight": "rgba(255, 255, 255, 0.92)",
			"--dsw-specific-bubble": "rgba(255, 255, 255, 0.85)",
			"--dsw-specific-input-major": "rgba(255, 255, 255, 0.85)",
			"--dsw-specific-login-input": "rgba(255, 255, 255, 0.90)",
			"--dsw-specific-selector": "rgba(245, 245, 247, 0.85)",
			"--dsw-specific-tip": "rgba(245, 245, 247, 0.80)",
			"--dsw-specific-sidebar-nav-item-active-accent": "rgb(234, 238, 246)",
			"--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.85)",
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
			"--dsw-alias-bg-app-image": "radial-gradient(ellipse 900px 520px at 15% 20%, rgba(130, 60, 220, 0.08) 0%, transparent 65%),radial-gradient(ellipse 850px 600px at 85% 85%, rgba(40, 150, 255, 0.07) 0%, transparent 65%),radial-gradient(circle at 50% 50%, rgba(240, 70, 130, 0.03) 0%, transparent 60%),linear-gradient(180deg, rgba(12, 13, 17, 0.95) 0%, rgba(16, 18, 24, 0.98) 100%)",
			"--dsw-alias-glass-blur": "blur(50px) saturate(180%)",
			"--dsw-alias-surface-glass-blur": "blur(34px) saturate(160%)",
			"--dsw-alias-bg-base": "rgba(22, 24, 30, 0.74)",
			"--dsw-alias-surface-glass-spot": "transparent",
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
			"tech-theme.parchment": "缃素"
		};
		/** English dictionary checked against the Chinese key set. */
		const en = {
			"tech-theme.title": "Tech themes",
			"tech-theme.sequoia": "Liquid",
			"tech-theme.sonoma": "Obsidian",
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
		const css = ".bNLuYa_group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:16px 0;display:flex}.bNLuYa_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.bNLuYa_cubeRow{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}.bNLuYa_themeCube{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:16px;flex-direction:column;flex:180px;justify-content:center;align-items:center;gap:4px;padding:20px 32px;font-size:14px;line-height:22px;display:flex}.bNLuYa_themeCube:hover:not(.bNLuYa_selected){background:var(--dsw-alias-interactive-bg-hover)}.bNLuYa_selected{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)!important;border:1.5px solid var(--dsw-alias-brand-primary)!important;color:var(--dsw-alias-brand-primary)!important;box-shadow:0 4px 14px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent)!important;border-radius:14px!important}.bNLuYa_selected *{color:var(--dsw-alias-brand-primary)!important;fill:currentColor!important}";
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

/* 视窗外框发丝高光倒角（Hairline Specular Rim） */
body[data-ds-custom-theme="sequoia"] [class*="AppFrame_frame"] {
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.45) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="AppFrame_frame"] {
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.10) !important;
}

/* 悬浮毛玻璃输入坞 (Floating Glass Dock) */
body[data-ds-custom-theme="sequoia"] [class*="InputBar_card"] {
  border-radius: 20px !important;
  background: rgba(255, 255, 255, 0.82) !important;
  border: 1px solid rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(36px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(36px) saturate(200%) !important;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 1px rgba(255, 255, 255, 0.95) !important;
  margin-bottom: 8px !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="InputBar_card"]:focus-within {
  border-color: rgba(0, 113, 227, 0.45) !important;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.15),
    0 0 0 3px rgba(0, 113, 227, 0.18),
    inset 0 1px 1px rgba(255, 255, 255, 0.95) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="InputBar_card"] {
  border-radius: 20px !important;
  background: rgba(24, 28, 36, 0.80) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  backdrop-filter: blur(38px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(38px) saturate(180%) !important;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.65),
    0 6px 16px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.18) !important;
  margin-bottom: 8px !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="InputBar_card"]:focus-within {
  border-color: rgba(41, 151, 255, 0.45) !important;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.75),
    0 0 0 3px rgba(41, 151, 255, 0.22),
    inset 0 1px 1px rgba(255, 255, 255, 0.25) !important;
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

/* 用户气泡：Apple 官方高光胶囊 */
body[data-ds-custom-theme="sequoia"] [class*="MessageItem_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #0071e3 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.28) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="MessageItem_bubble"] * {
  color: #ffffff !important;
}

body[data-ds-custom-theme="sonoma"] [class*="MessageItem_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #2997ff !important;
  color: #ffffff !important;
  box-shadow: 0 4px 18px rgba(41, 151, 255, 0.40) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="MessageItem_bubble"] * {
  color: #ffffff !important;
}

/* AI 助手回复：半透液态玻璃卡片化 */
body[data-ds-custom-theme="sequoia"] [class*="ChatView_column"] > [class*="ChatView_flowItem"]:has([class*="AssistantMarkdown_root"]) {
  background: rgba(255, 255, 255, 0.82) !important;
  border: 1px solid rgba(0, 0, 0, 0.07) !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 16px 20px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px) saturate(160%) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="ChatView_column"] > [class*="ChatView_flowItem"]:has([class*="AssistantMarkdown_root"]) {
  background: rgba(28, 32, 40, 0.74) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 16px 20px !important;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.40), inset 0 1px 1px rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(22px) saturate(160%) !important;
}

/* 侧边栏毛玻璃材质与透光 (Sidebar Glassmorphism)
   注意（历史硬规则）：绝对不能在 [class*="sidebarCol"] 主元素上直接设置 backdrop-filter！
   因为设置弹窗 (Settings Dialog) 的 Portal 挂载在 sidebarCol DOM 树下，backdrop-filter 会为
   position: fixed 子元素创建新的包含块 (Containing Block)，导致设置弹窗宽度被压死成侧边栏同宽！
   毛玻璃滤镜必须严格挂载在伪元素 ::before 上，该伪元素不是弹窗的祖先节点，完全安全。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] {
  background: transparent !important;
  border-right: 1px solid rgba(0, 0, 0, 0.08) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"]::before {
  backdrop-filter: blur(28px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > * > [class*="root"] {
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255, 160, 90, 0.04) 0%, transparent 100%),
    rgba(245, 245, 247, 0.65) !important;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.60) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] {
  background: transparent !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"]::before {
  backdrop-filter: blur(30px) saturate(170%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(170%) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > * > [class*="root"] {
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%, rgba(130, 60, 220, 0.04) 0%, transparent 100%),
    rgba(18, 20, 25, 0.65) !important;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08) !important;
}

/* 强制保障设置与模态弹窗全屏视口居中，彻底消除包含块压迫 */
[role="presentation"]:has(> [role="dialog"]) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

/* 选中态与分类标签组件视觉调优：柔和半透底色，绝不喧宾夺主，14px 协调几何圆弧 */
body[data-ds-custom-theme="sequoia"] [class*="cats"] button[class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="catsWrap"] button[class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="tag"][class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="badge"][class*="active"] {
  background: rgba(0, 113, 227, 0.12) !important;
  color: #0071e3 !important;
  border: 1px solid rgba(0, 113, 227, 0.28) !important;
  border-radius: 14px !important;
  box-shadow: 0 2px 6px rgba(0, 113, 227, 0.12) !important;
  font-weight: 550 !important;
}

body[data-ds-custom-theme="sonoma"] [class*="cats"] button[class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="catsWrap"] button[class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="tag"][class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="badge"][class*="active"] {
  background: rgba(41, 151, 255, 0.16) !important;
  color: #2997ff !important;
  border: 1px solid rgba(41, 151, 255, 0.35) !important;
  border-radius: 14px !important;
  box-shadow: 0 0 10px rgba(41, 151, 255, 0.20) !important;
  font-weight: 550 !important;
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

/* 确保 Tab 标签页保持清爽高质感的下划线指示，杜绝蓝厚块污染 */
[role="tab"] {
  background: transparent !important;
  box-shadow: none !important;
}

/* 顶部栏 ☰ 毛玻璃面板与「关于」玻璃弹窗已统一由桌面壳的 initialization_script
   （shell_ui_script）提供：它在 document-created 即执行，冷启动引导页也有，
   因此不会出现「先原生菜单、后自定义面板」的跳变。本插件不再重复实现该 UI，
   以免覆盖壳脚本导致跳变回归。动作仍经 __dshNotifyBridge.shellAction() 回到壳侧。 */

/* Xcode 风格代码块 */
body[data-ds-custom-theme="sequoia"] pre,
body[data-ds-custom-theme="sequoia"] [class*="codeBlock"] {
  border-radius: 10px !important;
  border: 1px solid #d0d7de !important;
  background: #f6f8fa !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}
body[data-ds-custom-theme="sonoma"] pre,
body[data-ds-custom-theme="sonoma"] [class*="codeBlock"] {
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
				line: "rgba(0, 0, 0, 0.08)",
				text: "rgb(29, 29, 31)",
				muted: "rgb(110, 110, 115)",
				hover: "rgba(0, 113, 227, 0.08)",
				active: "rgba(0, 113, 227, 0.16)"
			},
			sonoma: {
				bg: "rgb(22, 24, 30)",
				accent: "rgb(41, 151, 255)",
				line: "rgba(255, 255, 255, 0.10)",
				text: "rgb(245, 245, 247)",
				muted: "rgb(161, 161, 166)",
				hover: "rgba(41, 151, 255, 0.12)",
				active: "rgba(41, 151, 255, 0.22)"
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
			parchment: {
				bg: "rgb(230, 224, 212)",
				accent: "rgb(156, 48, 28)",
				line: "rgba(38, 32, 28, 0.08)",
				text: "rgb(34, 28, 24)",
				muted: "rgb(120, 106, 96)",
				hover: "rgba(156, 48, 28, 0.08)",
				active: "rgba(156, 48, 28, 0.15)"
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
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map