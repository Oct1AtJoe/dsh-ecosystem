/**
 * Subagent composer action, browser half: registers the robot button into the
 * conversation input's right list seat. The button shows the live
 * running-subagent count and opens the dsh-better-sidebar subagent tab.
 * Composing this plugin out of cordis.yml removes the affordance entirely;
 * official ui-subagent owns every other subagent surface.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { SubagentComposerAction } from './SubagentComposerAction.tsx'
import { en, NS, zh, type SubagentComposerKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Composer subagent button copy. */
    'subagent-composer': SubagentComposerKey
  }
}

/** Required services for the input-seat registration and its dictionaries. */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: register the dictionaries and the composer tool-row
 * entry.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-subagent-custom: dictionaries')
  ctx.slots.inject(
    'conversation.input.right',
    () => ctx.slots.register({
      name: 'conversation.input.right',
      id: 'subagent-activity',
      order: 10,
      locale: NS,
      inject: () => ({
        openSubagentTab: () => {
          // The sidebar owns the subagent topology view; its absence (plugin
          // composed out) degrades the click to a no-op.
          ctx.get('betterSidebar')?.openTab({ type: 'subagent' })
        },
      }),
    }, SubagentComposerAction),
  )
  ctx.inject(['inputTriggers'], (scope) => {
    const inputTriggers = scope.get('inputTriggers') as any
    if (inputTriggers && !inputTriggers.live?.sources?.some((s: any) => s.name === 'reference')) {
      scope.effect(() => inputTriggers.registerSource({
        trigger: '@',
        name: 'reference',
        showGroupTitle: false,
        candidates: () => Promise.resolve([]),
        codec: {
          clipboardText: (ref: string) => ref,
          serialize: (ref: string) => Promise.resolve(ref),
        },
      }), 'ui-subagent-custom: compat reference serializer')
    }
  })
}
