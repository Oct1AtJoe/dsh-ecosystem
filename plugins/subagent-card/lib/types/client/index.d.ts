/**
 * Subagent composer action, browser half: registers the robot button into the
 * conversation input's right list seat. The button shows the live
 * running-subagent count and opens the dsh-better-sidebar subagent tab.
 * Composing this plugin out of cordis.yml removes the affordance entirely;
 * official ui-subagent owns every other subagent surface.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type SubagentComposerKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Composer subagent button copy. */
        'subagent-composer': SubagentComposerKey;
    }
}
/** Required services for the input-seat registration and its dictionaries. */
export declare const inject: string[];
/**
 * Client plugin body: register the dictionaries and the composer tool-row
 * entry.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map