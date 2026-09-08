/**
 * The plugin-registered "void" theme (冥夜): a deep neutral-gray variant with
 * a blurred-glass backplate — the background uses a dark graphite base with
 * soft gray aurora pools that shine through translucent acrylic panels,
 * creating a通透 (transparent/deep) glass backplate feel. Panels carry lower
 * alpha values than the nebula so the pools remain visible under the frost,
 * and the glass blur is tuned for a soft matte finish. The palette is kept
 * in the neutral gray range — no blue, no red — evoking volcanic stone
 * viewed through a light-frosted pane.
 * All values are literal (no var() chains): the presenter applies them as
 * inline body variables, and the effect tokens
 * (`--dsw-alias-button-*`, `--dsw-alias-bg-app-image`,
 * `--dsw-alias-glass-blur`) are consumed by Button.module.css, the send
 * button, and the app-frame/conversation surfaces, defaulting to inert
 * values in the base palettes.
 * Surface tokens are translucent rgba over the aurora backdrop; the panel
 * roots add `backdrop-filter: var(--dsw-alias-glass-blur, none)` so the
 * panels read as matte frosted acrylic — the pools are visible through the
 * frost at a dimmed matte distance.
 * Contrast: primary text ~14:1, secondary ~9:1, tertiary ~5.5:1 on the
 * base surface; button text ≥4.5:1 over the darkest fill stop.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client';
/** Alias-token overrides for the void theme. */
export declare const VOID_TOKENS: ThemeTokens;
//# sourceMappingURL=void.d.ts.map