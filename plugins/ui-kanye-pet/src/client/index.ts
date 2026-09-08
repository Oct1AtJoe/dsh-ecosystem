/** kanye-pet settings, browser half — one Settings tab (like subagents). */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { KanyeCard } from './KanyeCard.tsx'
import { KANYE_NS, KanyeCardController } from './kanye-card-controller.ts'
import { en, zh, type KanyeLocaleKey } from './locales.ts'

export type { KanyeCardFace, KanyeCardState, KanyeSettings } from './kanye-card-controller.ts'
export type { KanyeLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** kanye-pet tab copy. */
    'kanye-pet': KanyeLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'kanye-pet'

/** Services required by the kanye-pet tab. */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Contribute the kanye-pet tab to the Plugins settings section. The tab reads and
 * writes the `kanye-pet` settings namespace; the renderer consumes it through
 * settingsScope and the tab owns its own card.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-kanye-pet: dictionaries')

  const t = ctx.locale.bind(NS)
  const controller = new KanyeCardController(ctx.settingsScope.bind({ namespace: KANYE_NS }))

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'pet',
    order: 50,
    label: () => t('tab'),
    locale: NS,
    inject: () => controller.inject(),
  }, KanyeCard))

  // Desktop pet bubble / Windows toast click: the Tauri shell dispatches
  // `dsh:open-session` on the main window; open the target session here.
  // The listener lives in this plugin since dsh-notification-custom was retired.
  ctx.effect(() => {
    const onOpenSession = (event: Event): void => {
      const sessionId = (event as CustomEvent<{ sessionId?: string }>).detail?.sessionId
      if (typeof sessionId !== 'string' || sessionId === '') return
      // Client-side Session Controller (same service ui-chat/ui-workspace use);
      // resolved lazily at click time — unknown ids fail loud inside open().
      const sessions = ctx.get('sessions') as { open?: (id: string) => void } | undefined
      try {
        sessions?.open?.(sessionId)
      } catch (error) {
        console.warn(`[ui-kanye-pet] open session ${sessionId} failed:`, error)
      }
    }
    window.addEventListener('dsh:open-session', onOpenSession)
    return () => { window.removeEventListener('dsh:open-session', onOpenSession) }
  }, 'ui-kanye-pet: dsh:open-session jump')
}
