import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { QueueDock } from './QueueDock.tsx'
import { en, NS, zh, type QueueRecallKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    queueRecall: QueueRecallKey
  }
}

export const inject = ['slots', 'conversation', 'sessions', 'uiConversation', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-queue-recall: dictionaries')

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'queue',
    priority: -5,
    order: 20,
    locale: NS,
    inject: (sessionId: SessionId) => {
      const actx = ctx.sessions.scope(sessionId)
      if (actx === undefined) throw new Error(`queue dock: session "${sessionId}" resolved no scope`)
      const conversation = actx.get('conversation')
      if (conversation === undefined) throw new Error('queue dock: conversation service unavailable')
      return {
        updateQueue: (itemId, action) => conversation.updateQueue(itemId, action),
        notify: (level, text) => { conversation.input.for(actx).notify(level, text) },
        loadImage: attachment => ctx.uiConversation.imageUrl(sessionId, attachment),
      }
    },
  }, QueueDock))
}
