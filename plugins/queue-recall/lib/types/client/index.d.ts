import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type QueueRecallKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        queueRecall: QueueRecallKey;
    }
}
export declare const inject: string[];
/**
 * Shadow the shipped queue strip with the recall variant.
 *
 * Same slot id and order as `@deepseek-ai/dsh-client-ui-conversation`'s own
 * `conversation-queue-dock`, with a negative priority so this entry wins the
 * list-slot shadow: the shipped entry registers at the default 0.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map