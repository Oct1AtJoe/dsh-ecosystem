/**
 * The plugin-registered "jade" theme (翠渊): an emerald-green variant over
 * the dark base palette — deep forest-teal surfaces with jade aurora pools
 * on the app background, cool-green matte acrylic (frosted translucent)
 * panels, and glassy tech buttons: emerald gradient fill with slow drift,
 * a top inner highlight, a 1px glass hairline, and a soft green outer glow.
 * All values are literal (no var() chains): the presenter applies them as
 * inline body variables, and the effect tokens
 * (`--dsw-alias-button-*`, `--dsw-alias-bg-app-image`,
 * `--dsw-alias-glass-blur`) are consumed by Button.module.css, the send
 * button, and the app-frame/conversation surfaces, defaulting to inert
 * values in the base palettes so other themes keep their current look.
 * Surface tokens are translucent rgba over the jade backdrop; the panel
 * roots add `backdrop-filter: var(--dsw-alias-glass-blur, none)` so the
 * panels read as matte frosted acrylic — the jade pools are dimmed under
 * the lifted panel alphas so the backdrop never wins over the fill.
 * Contrast: primary text ~15:1, secondary ~9.8:1, tertiary ~5.9:1 on the
 * base surface; button text ≥4.7:1 over the darkest fill stop.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Alias-token overrides for the jade theme. */
export declare const JADE_TOKENS: ThemeTokens;
//# sourceMappingURL=jade.d.ts.map