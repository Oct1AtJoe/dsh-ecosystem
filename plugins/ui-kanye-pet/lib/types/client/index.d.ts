/** kanye-pet settings, browser half — one Settings tab (like subagents). */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type KanyeLocaleKey } from './locales.ts';
export type { KanyeCardFace, KanyeCardState, KanyeSettings } from './kanye-card-controller.ts';
export type { KanyeLocaleKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** kanye-pet tab copy. */
        'kanye-pet': KanyeLocaleKey;
    }
}
/** Dictionary namespace owned by this plugin. */
export declare const NS = "kanye-pet";
/** Services required by the kanye-pet tab. */
export declare const inject: string[];
/**
 * Contribute the kanye-pet tab to the Plugins settings section. The tab reads and
 * writes the `kanye-pet` settings namespace; the renderer consumes it through
 * settingsScope and the tab owns its own card.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map