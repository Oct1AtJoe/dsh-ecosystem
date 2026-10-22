import type { ChatNodeStore } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { ResendActionProps } from './slots.ts';
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
export declare function failedRoundTarget(order: readonly string[], nodes: ChatNodeStore, turn: number): string | null;
/**
 * One failed round's re-run control in the turn-tail zone.
 * @param props - the tail's owner share, the elected reason, the injected
 *   send verb, and the locale seat.
 * @returns the re-run button, or null when a newer round superseded the failure.
 */
export declare function ResendAction({ turn, send, t, useChat }: ResendActionProps): import("react").JSX.Element | null;
//# sourceMappingURL=ResendAction.d.ts.map