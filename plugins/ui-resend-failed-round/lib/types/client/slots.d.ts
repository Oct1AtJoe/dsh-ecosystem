/**
 * The failed-round resend entry's injected face and composed props. The
 * target 'conversation.chat.turnTail' slot is declared and typed by ui-chat;
 * this package only contributes the entry, so no SlotMap merge lives here.
 * @module @deepseek-ai/dsh-client-ui-resend-failed-round/client/slots
 */
import type { TurnTailOwnerProps } from '@deepseek-ai/dsh-client-ui-chat/client';
import type { ChainSelect, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { NS } from './locales.ts';
/** Injected business face of one turn-tail resend entry. */
export interface ResendInjected {
    /**
     * Re-send one prompt text as a queued turn through the session-scoped
     * conversation service; a missing service makes the action a no-op.
     */
    send: (text: string) => void;
}
/** Selector fact elected for one failed-round tail. */
export interface ResendMatch {
    /** Terminal turn/end reason that elected the entry. */
    readonly reason: 'error' | 'max-tokens';
}
/** Full props of one turn-tail resend entry. */
export type ResendActionProps = PropsRuntime<'conversation.chat.turnTail'> & {
    matched: ResendMatch;
} & InjectFace<ResendInjected> & PropsLocale<typeof NS>;
/**
 * Elect the entry on a turn that ended terminally. Pure over the owner
 * props: the turn/end reason rides the tail owner's TurnLocation. Whether
 * this is still the latest failed round, and the round's user text, are the
 * component's chat-snapshot scan.
 * @param owner - tail owner currency for the closing turn.
 * @returns the elected reason, or null to decline.
 */
export declare const resendSelect: ChainSelect<TurnTailOwnerProps, ResendMatch>;
//# sourceMappingURL=slots.d.ts.map