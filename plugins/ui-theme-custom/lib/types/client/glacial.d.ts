/**
 * The plugin-registered "glacial" theme (寒渊): an ice-blue variant over
 * the dark base palette — deep navy-slate surfaces with cold cyan aurora
 * pools on the app background, icy-blue matte acrylic (frosted translucent)
 * panels, and glassy tech buttons: cool silver-blue gradient fill with slow
 * drift, a top inner highlight, a 1px glass hairline, and a soft blue-white
 * outer glow.
 * All values are literal (no var() chains): the presenter applies them as
 * inline body variables, and the effect tokens
 * (`--dsw-alias-button-*`, `--dsw-alias-bg-app-image`,
 * `--dsw-alias-glass-blur`) are consumed by Button.module.css, the send
 * button, and the app-frame/conversation surfaces, defaulting to inert
 * values in the base palettes.
 * Surface tokens are translucent rgba over the icy backdrop; the panel
 * roots add `backdrop-filter: var(--dsw-alias-glass-blur, none)` so the
 * panels read as matte frosted acrylic.
 * Contrast: primary text ~15:1, secondary ~9.8:1, tertiary ~5.9:1 on the
 * base surface; button text ≥4.7:1 over the darkest fill stop.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Alias-token overrides for the glacial theme. */
export declare const GLACIAL_TOKENS: ThemeTokens;
//# sourceMappingURL=glacial.d.ts.map