/**
 * Aurora, nebula, and custom tech themes, node half. Injects a boot script
 * that reads the user's localStorage preference and overrides the initial
 * theme before the first paint, so the saved custom theme (e.g. void/jade)
 * is visible from the start with no flash. The browser half (./client)
 * completes the theme registration and handles subsequent switches.
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * Inject the boot script after the official ui-theme boot script so it
 * overrides the host-persisted preference when a custom theme was saved.
 * @param ctx - Host context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map