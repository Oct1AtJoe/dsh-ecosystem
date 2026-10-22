import { SubagentComposerAction } from "./SubagentComposerAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the input-seat registration and its dictionaries. */
export const inject = ['slots', 'locale'];
/**
 * Client plugin body: register the dictionaries and the composer tool-row
 * entry.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-subagent-custom: dictionaries');
    ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right',
        id: 'subagent-activity',
        order: 10,
        locale: NS,
        inject: () => ({
            openSubagentTab: () => {
                // The sidebar owns the subagent topology view; its absence (plugin
                // composed out) degrades the click to a no-op.
                ctx.get('betterSidebar')?.openTab({ type: 'subagent' });
            },
        }),
    }, SubagentComposerAction));
    ctx.inject(['inputTriggers'], (scope) => {
        const inputTriggers = scope.get('inputTriggers');
        if (inputTriggers && !inputTriggers.live?.sources?.some((s) => s.name === 'reference')) {
            scope.effect(() => inputTriggers.registerSource({
                trigger: '@',
                name: 'reference',
                showGroupTitle: false,
                candidates: () => Promise.resolve([]),
                codec: {
                    clipboardText: (ref) => ref,
                    serialize: (ref) => Promise.resolve(ref),
                },
            }), 'ui-subagent-custom: compat reference serializer');
        }
    });
}
//# sourceMappingURL=index.js.map