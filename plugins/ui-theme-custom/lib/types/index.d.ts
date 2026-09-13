/**
 * Aurora, nebula, and custom tech themes, node half. Injects a boot script
 * that reads the user's localStorage preference and applies the saved
 * custom theme's full token set inline before the first paint, so the page
 * never flashes the default built-in palette. A requestAnimationFrame
 * re-assert loop holds the tokens against the official ThemePresenter's
 * boot-time adopt() until the browser half (./client) signals
 * `window.__dshCustomThemeLive` and takes over subsequent switches.
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * Inject the boot script after the official ui-theme boot script so it
 * overrides the host-persisted preference when a custom theme was saved.
 * @param ctx - Host context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map