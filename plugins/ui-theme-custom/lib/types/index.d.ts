/**
 * Aurora, nebula, and custom tech themes, node half. Injects a boot script
 * that reads the user's localStorage preference and applies the saved
 * custom theme's full token set inline before the first paint, so the page
 * never flashes the default built-in palette. A requestAnimationFrame
 * re-assert loop holds the tokens against the official ThemePresenter's
 * boot-time adopt() until the browser half (./client) signals
 * `window.__dshCustomThemeLive` and takes over subsequent switches.
 *
 * The injection row and event are typed locally instead of importing the
 * host webserver package: the row is a tiny structural shape and the event
 * augmentation shadows the host's, so this node half stays self-contained
 * and compiles against whatever host version is installed.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Local structural stand-in for the host webserver's index injection row. */
type IndexInjection = {
    kind: 'script';
    placement: 'body';
    text: string;
};
declare module '@deepseek-ai/cordis' {
    interface Events {
        'webserver/index-inject'(table: IndexInjection[]): void;
    }
}
/**
 * Inject the boot script after the official ui-theme boot script so it
 * overrides the host-persisted preference when a custom theme was saved.
 * @param ctx - Host context.
 */
export declare function apply(ctx: Context): void;
export {};
//# sourceMappingURL=index.d.ts.map