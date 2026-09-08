import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Failed-round resend action: a re-run entry in the turn-tail zone of a turn
 * that ended terminally (turn-error or turn-max-tokens). Rendered in the
 * turn's tail chain; clicking re-sends the failed round's user text as a new
 * queued turn through the session-scoped conversation service. The chain
 * elects the entry on terminal turn ends; the component declines again when
 * a newer round superseded the failure, so the tail renders nothing extra.
 * @module @deepseek-ai/dsh-client-ui-resend-failed-round/client/ResendAction
 */
import { useMemo } from 'react';
import { IconRefreshOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './ResendAction.module.css';
/**
 * The failed round's re-send text: the last user message preceding this
 * turn's terminal failure. Null when a later user message superseded the
 * round or no user message exists. Re-sends the message's plain text
 * (images are not replayed).
 * @param order - stable Chat row order; changes only on row enter/leave/move.
 * @param nodes - live per-key Chat node readers.
 * @param turn - the failed turn this tail belongs to.
 * @returns the plain text to re-send, or null when the round is gone.
 */
export function failedRoundTarget(order, nodes, turn) {
    let text = null;
    let failed = false;
    for (const key of order) {
        const node = nodes.get(key);
        if (node === undefined)
            continue;
        if (node.kind === 'user') {
            // A later user message resets the round: the action only ever addresses
            // the round that actually failed last.
            if (failed)
                return null;
            let joined = '';
            for (const block of node.data.content) {
                if (block.type === 'text')
                    joined += block.text;
            }
            text = joined;
        }
        else if ((node.kind === 'turn-error' || node.kind === 'turn-max-tokens') && node.data.turn === turn) {
            failed = true;
        }
    }
    return failed ? text : null;
}
/**
 * One failed round's re-run control in the turn-tail zone.
 * @param props - the tail's owner share, the elected reason, the injected
 *   send verb, and the locale seat.
 * @returns the re-run button, or null when a newer round superseded the failure.
 */
export function ResendAction({ turn, send, t, useChat }) {
    // The failed-round target rides order (stable except on row enter/leave),
    // so content deltas never recompute it.
    const order = useChat(s => s.order);
    const nodes = useChat(s => s.nodes);
    const latestTurn = useChat(s => s.timeline.turnOrder.at(-1));
    const target = useMemo(() => latestTurn === turn.turn ? failedRoundTarget(order, nodes, turn.turn) : null, [order, nodes, latestTurn, turn.turn]);
    if (target === null)
        return null;
    const label = t('action.resend');
    return (_jsx(Tooltip, { label: label, side: "top", delayMs: 500, children: _jsxs("button", { type: "button", className: css.button, "aria-label": label, onClick: () => { send(target); }, children: [_jsx(IconRefreshOutline16, {}), _jsx("span", { children: label })] }) }));
}
//# sourceMappingURL=ResendAction.js.map