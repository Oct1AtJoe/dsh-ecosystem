/**
 * Failed-round resend plugin, browser half: the re-run entry in the
 * conversation.chat.turnTail chain. The chain elects the entry on turns that
 * ended terminally (turn-error or turn-max-tokens); the component re-sends
 * the failed round's user text through the session-scoped conversation
 * service once no newer round superseded the failure. The turn tail exists
 * for failure rounds even when no assistant message landed, unlike the
 * assistant-action strip.
 * @module @deepseek-ai/dsh-client-ui-resend-failed-round/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type ResendKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Failed-round resend copy. */
        resend: ResendKey;
    }
}
/** Required services: the slot registry, the session scope index, and the copy. */
export declare const inject: string[];
/**
 * Client plugin body: the failed-round re-run entry in the turn-tail chain.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map