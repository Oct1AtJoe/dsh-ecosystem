/**
 * Aurora and nebula tech themes, registered onto the official theme registry
 * (`ctx.theme.register`), plus their own settings row (`settings.general.item`
 * contribution) and the drift keyframes the nebula motion token references.
 * The registry snapshot drives the presenter; the row — registered beside the
 * official Appearance row, which stays light/dark/system only — carries the
 * two cubes so the official ui-theme package never references the custom ids.
 * Selection persists through the official settings scope because
 * `THEME_PREFERENCES` includes the ids; the keyframes ride a runtime style
 * element disposed with the fiber.
 */
import type { Context } from '@deepseek-ai/cordis';
import { type TechThemeKey } from './locales.ts';
export type { TechThemeRowInjected } from './TechThemeRow.tsx';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The tech-theme row's copy. */
        'settings.theme.custom': TechThemeKey;
    }
}
/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
export declare const inject: string[];
/**
 * Client plugin body: register both themes and the drift keyframes, plus the
 * tech-theme row contribution, disposing everything with the fiber so HMR and
 * teardown never leave a stale theme, stylesheet, or row behind.
 * @param ctx - client root context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map