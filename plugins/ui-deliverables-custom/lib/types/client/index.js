import { createSnapshotStore } from '@deepseek-ai/dsh-client-store';
import { ProducedFiles } from "./ProducedFiles.js";
import { en, NS, zh } from "./locales.js";
import { deliverablesDefinition, producedFileMentions, producedForClosing, selectProducedFiles, } from "./turn-deliverables.js";
export { ProducedFiles } from "./ProducedFiles.js";
export { producedForClosing } from "./turn-deliverables.js";
/** Required services for the tail-slot registration and its dictionaries. */
export const inject = ['slots', 'locale', 'uiConversation', 'remote', 'remote.session'];
/**
 * Client plugin body: register the dictionaries and the turn-tail entry.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const workspacePathOpen = createSnapshotStore(undefined);
    let requestedWorkspacePathOpen = false;
    let capabilityRevision = 0;
    let pendingCapability;
    const loadWorkspacePathOpen = () => {
        if (pendingCapability !== undefined)
            return;
        const revision = capabilityRevision;
        const pending = ctx.remote.session.canOpenWorkspacePath()
            .then((result) => {
            if (revision === capabilityRevision)
                workspacePathOpen.set(result.ok && result.value);
        })
            .finally(() => {
            if (pendingCapability === pending)
                pendingCapability = undefined;
        });
        pendingCapability = pending;
    };
    const ensureWorkspacePathOpen = () => {
        requestedWorkspacePathOpen = true;
        if (workspacePathOpen.getSnapshot() === undefined)
            loadWorkspacePathOpen();
    };
    ctx.on('connection/reset', () => {
        capabilityRevision++;
        pendingCapability = undefined;
        workspacePathOpen.set(undefined);
        if (requestedWorkspacePathOpen)
            loadWorkspacePathOpen();
    });
    ctx.uiConversation.events.register(deliverablesDefinition);
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-deliverables-custom: dictionaries');
    ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
        name: 'conversation.chat.turnTail',
        select: selectProducedFiles,
        // Chain order is ascending priority: dsh-better-sidebar claims the same
        // produced-files turn at -1, so this fork must try earlier to render at
        // all, while staying behind ui-resend-failed-round (-10), whose failed-
        // round entry keeps precedence on failed turns.
        priority: -5,
        locale: NS,
        inject: () => ({
            isLoopback: ctx.remote.$host.isLoopback,
            ensureWorkspacePathOpen,
            hooks: { workspacePathOpen },
        }),
    }, ProducedFiles));
    // The prose side of the same vocabulary: the chat view reaches this face
    // via ctx.get, so its absence — this plugin composed out — is the off state.
    const t = ctx.locale.bind(NS);
    const mentions = {
        forClosing(owner) {
            // Same claim test the turn-tail chain entry runs: no produced files,
            // no vocabulary — the two surfaces agree by construction.
            const paths = producedForClosing(owner.turn.data.get('deliverables'), owner.seq);
            if (paths.length === 0)
                return undefined;
            return producedFileMentions(paths, owner.openFile, path => t('produced.open', { name: path }));
        },
    };
    ctx.provide('chatFileMentions', mentions);
}
//# sourceMappingURL=index.js.map