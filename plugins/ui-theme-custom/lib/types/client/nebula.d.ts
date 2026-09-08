/**
 * The plugin-registered "nebula" theme (幻彩星云): a deep-space violet-blue variant
 * over the dark base palette with a retro-tech feel — radial aurora pools on
 * the app surfaces, matte acrylic (frosted translucent) panels, and glassy
 * tech buttons: translucent gradient fill with slow drift, a top inner
 * highlight, a 1px glass hairline, and a soft blue-violet outer glow. All
 * values are literal (no var() chains): the presenter applies them as
 * inline body variables, and the effect tokens
 * (`--dsw-alias-button-*`, `--dsw-alias-bg-app-image`,
 * `--dsw-alias-glass-blur`) are consumed by Button.module.css, the send
 * button, and the app-frame/conversation surfaces, defaulting to inert
 * values in the base palettes so light/dark/aurora keep their current look.
 * Surface tokens are translucent rgba over the aurora backdrop; the panel
 * roots that carry no fixed-positioned descendants add
 * `backdrop-filter: var(--dsw-alias-glass-blur, none)` so the panels read
 * as matte frosted acrylic — the aurora pools are dimmed under the lifted
 * panel alphas so the backdrop never wins over the fill (a bright backdrop
 * reads as glass, a dim one as acrylic), while light/dark/aurora resolve
 * the token to `none` and stay opaque-flat.
 * Contrast: primary text ~15:1, secondary ~9.8:1, tertiary ~5.9:1 on the
 * base surface; button text >=4.7:1 over the darkest fill stop.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Alias-token overrides for the nebula theme. */
export declare const NEBULA_TOKENS: ThemeTokens;
//# sourceMappingURL=nebula.d.ts.map