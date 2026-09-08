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
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the chat SlotMap declarations ('conversation.chat.turnTail'),
// the session scope's conversation service, and the slots/locale Context faces.
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { ResendAction } from './ResendAction.tsx'
import { en, NS, zh, type ResendKey } from './locales.ts'
import { resendSelect } from './slots.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Failed-round resend copy. */
    resend: ResendKey
  }
}

/** Required services: the slot registry, the session scope index, and the copy. */
export const inject = ['slots', 'sessions', 'locale']

/**
 * Client plugin body: the failed-round re-run entry in the turn-tail chain.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-resend-failed-round: dictionaries')
  ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
    name: 'conversation.chat.turnTail',
    // Elected ahead of the other tail contributions: on the failed round the
    // re-run affordance outranks file chips (tool cards still show the files).
    priority: -10,
    select: resendSelect,
    locale: NS,
    inject: (sessionId) => ({
      // Send failures surface through the session promptError strip.
      send: (text) => {
        const conversation = ctx.sessions.scope(sessionId)?.get('conversation')
        if (conversation !== undefined) void conversation.send(text)
      },
    }),
  }, ResendAction))
}
