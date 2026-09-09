import { QueueDock } from "./QueueDock.js";
import { en, NS, zh } from "./locales.js";
export const inject = ['slots', 'conversation', 'sessions', 'uiConversation', 'locale'];
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-queue-recall: dictionaries');
    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'queue',
        priority: -5,
        order: 20,
        locale: NS,
        inject: (sessionId) => {
            const actx = ctx.sessions.scope(sessionId);
            if (actx === undefined)
                throw new Error(`queue dock: session "${sessionId}" resolved no scope`);
            const conversation = actx.get('conversation');
            if (conversation === undefined)
                throw new Error('queue dock: conversation service unavailable');
            return {
                updateQueue: (itemId, action) => conversation.updateQueue(itemId, action),
                notify: (level, text) => { conversation.input.for(actx).notify(level, text); },
                loadImage: attachment => ctx.uiConversation.imageUrl(sessionId, attachment),
            };
        },
    }, QueueDock));
}
//# sourceMappingURL=index.js.map