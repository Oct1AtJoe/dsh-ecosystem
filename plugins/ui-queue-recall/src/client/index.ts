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

/**
 * Reconstruct time of the first token delta from compact stream records without full expansion.
 */
function assistantStreamFirstTokenTime(stream: unknown): number | undefined {
  if (!Array.isArray(stream)) return undefined
  for (const record of stream) {
    if (!record || typeof record !== 'object') continue
    if (record.type === 'chunk') {
      const chunk = record.chunk
      if (
        (chunk?.type === 'text-delta' || chunk?.type === 'reasoning-delta') && chunk.text !== ''
        || chunk?.type === 'tool-call-delta' && (chunk.argumentsDelta !== '' || chunk.name !== undefined)
      ) {
        return record.time
      }
    } else {
      // packed delta run: 'text-chunks' | 'reasoning-chunks' | 'tool-call-chunks'
      if (record.type === 'tool-call-chunks' && record.name !== undefined) {
        return record.time0
      }
      const fragments = record.type === 'tool-call-chunks' ? record.args : record.texts
      if (Array.isArray(fragments)) {
        let time = typeof record.time0 === 'number' ? record.time0 : 0
        for (let i = 0; i < fragments.length; i++) {
          if (i > 0 && Array.isArray(record.dt)) {
            time += typeof record.dt[i - 1] === 'number' ? record.dt[i - 1] : 0
          }
          if (fragments[i] !== '') return time
        }
      }
    }
  }
  return undefined
}

function patchAssistantDefinition(def: any): void {
  if (!def || def._tpsPatched) return
  def._tpsPatched = true

  // 1. Update hook: populate firstTokenTime on assistant/message
  const origUpdate = def.update
  def.update = (context: any, match: any) => {
    const nextState = origUpdate ? origUpdate(context, match) : context.state
    if (match.event?.type === 'assistant/message' && match.event.data?.stream) {
      const firstToken = assistantStreamFirstTokenTime(match.event.data.stream)
      if (firstToken !== undefined) {
        return {
          ...nextState,
          firstTokenTime: nextState?.firstTokenTime ?? firstToken,
        }
      }
    }
    return nextState
  }

  // 2. Build Location Data hook: ensure finalNode.timing has firstTokenTime
  const origBuildLocationData = def.buildLocationData
  def.buildLocationData = (context: any, scope: any) => {
    const result = origBuildLocationData ? origBuildLocationData(context, scope) : null
    if (scope === 'step' && result && result.key === 'assistant-step') {
      const finalNode = result.value?.finalNode
      if (finalNode?.timing && finalNode.timing.firstTokenTime === null) {
        const msgMatch = context.matches?.find((m: any) => m.event?.type === 'assistant/message')
        if (msgMatch?.event?.data?.stream) {
          const firstToken = assistantStreamFirstTokenTime(msgMatch.event.data.stream)
          if (firstToken !== undefined) {
            finalNode.timing.firstTokenTime = firstToken
          }
        }
      }
    }
    return result
  }
}

function installTpsPatch(ctx: ClientContext): void {
  const events = (ctx.uiConversation as any)?.events
  if (!events) return

  // Patch existing registration if ui-chat loaded before us
  const existing = events.definitions?.get('assistant-step')
  if (existing) {
    patchAssistantDefinition(existing)
    events.refresh?.()
  }

  // Intercept future registrations in case ui-chat loads or reloads after us
  const origRegister = events.register?.bind(events)
  if (origRegister && !events._tpsRegisterHooked) {
    events._tpsRegisterHooked = true
    events.register = (definition: any) => {
      if (definition?.kind === 'assistant-step') {
        patchAssistantDefinition(definition)
      }
      return origRegister(definition)
    }
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-queue-recall: dictionaries')

  // Patch assistant-step to restore turn timing (TPS and TTFT) omitted in 0.1.5-rc.2+
  installTpsPatch(ctx)

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
