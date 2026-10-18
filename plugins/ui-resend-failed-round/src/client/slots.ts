/**
 * The failed-round resend entry's injected face and composed props. The
 * target 'conversation.chat.turnTail' slot is declared and typed by ui-chat;
 * this package only contributes the entry, so no SlotMap merge lives here.
 * @module @deepseek-ai/dsh-client-ui-resend-failed-round/client/slots
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'

/** Injected business face of one turn-tail resend entry. */
export interface ResendInjected {
  /**
   * Re-send one prompt text as a queued turn through the session-scoped
   * conversation service; a missing service makes the action a no-op.
   */
  send: (text: string) => void
}

/**
 * Full props of one turn-tail resend entry.
 *
 * 0.2.x made `conversation.chat.turnTail` a `list` slot: there is no selector
 * election any more, so this package carries no `matched` share. Whether the
 * turn actually ended terminally, and whether a newer round superseded it, is
 * decided inside the component from the chat snapshot.
 */
export type ResendActionProps = PropsRuntime<'conversation.chat.turnTail'>
  & InjectFace<ResendInjected>
  & PropsLocale<typeof NS>
