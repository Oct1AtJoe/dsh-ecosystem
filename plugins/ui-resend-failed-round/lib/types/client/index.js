import { ResendAction } from "./ResendAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services: the slot registry, the session scope index, and the copy. */
export const inject = ['slots', 'sessions', 'locale'];
/**
 * Client plugin body: the failed-round re-run entry in the turn-tail chain.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-resend-failed-round: dictionaries');
    ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
        name: 'conversation.chat.turnTail',
        // 0.2.x 把该槽从 chain 改成 list：要 id，排序仍靠 priority；原来的
        // resendSelect 选举由 ResendAction 自己在 target === null 时返回 null。
        id: '@deepseek-ai/dsh-client-ui-resend-failed-round',
        // Elected ahead of the other tail contributions: on the failed round the
        // re-run affordance outranks file chips (tool cards still show the files).
        priority: -10,
        locale: NS,
        inject: (sessionId) => ({
            // Send failures surface through the session promptError strip.
            send: (text) => {
                const conversation = ctx.sessions.scope(sessionId)?.get('conversation');
                if (conversation !== undefined)
                    void conversation.send(text);
            },
        }),
    }, ResendAction));
}
//# sourceMappingURL=index.js.map