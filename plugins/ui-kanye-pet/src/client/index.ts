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
export const inject = ['slots', 'locale', 'configForms']

/**
 * Contribute the kanye-pet tab to the Plugins settings section. The tab reads and
 * writes the `kanye-pet` settings namespace; the renderer consumes it through
 * configForms and the tab owns its own card.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-kanye-pet: dictionaries')

  const t = ctx.locale.bind(NS)
  const controller = new KanyeCardController(ctx.configForms.get(KANYE_NS))

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
      // Navigation belongs to the view owner: current hosts dropped
      // `sessions.open()`, and ui-workspace's openSession retains the Session
      // plus returns the main area to the Conversation (layout.selectPanel).
      // Resolved lazily at click time; unknown ids fail loud inside openSession.
      try {
        const workspace = ctx.get('uiWorkspace') as { openSession?: (id: string) => void } | undefined
        if (typeof workspace?.openSession === 'function') {
          workspace.openSession(sessionId)
          return
        }
        // Legacy hosts only: ISessions lost `open`, so this is a no-op there.
        const sessions = ctx.get('sessions') as { open?: (id: string) => void } | undefined
        sessions?.open?.(sessionId)
      } catch (error) {
        console.warn(`[ui-kanye-pet] open session ${sessionId} failed:`, error)
      }
    }
    window.addEventListener('dsh:open-session', onOpenSession)
    return () => { window.removeEventListener('dsh:open-session', onOpenSession) }
  }, 'ui-kanye-pet: dsh:open-session jump')

  // Desktop notification runtime patch (Plan A):
  // Ensure notifications are immediately controlled by desktopNotificationEnabled
  // in the active session without requiring an immediate exe rebuild.
  //
  // 两条宿主分支：
  // - Tauri 壳：注入 `__dshNotifyBridge`，通知要经桥转成 Windows Toast；
  // - Electron 官方壳（真 Chromium，无桥）：`new Notification()` 直接出系统通知。
  //   桌宠开启时必须吞掉，否则桌宠气泡与系统 Toast 重复弹（Tauri 版靠壳注入
  //   ShimNotification 解决，Electron 侧由本 shim 承担同一职责）。
  ctx.effect(() => {
    const RawNotification = window.Notification
    if (typeof RawNotification !== 'function') return () => {}

    // 同源相对路径：Electron 桌面端与 Web GUI 都由 Host 提供本页，端口随启动变化，
    // 硬编码 3080 在桌面端（随机端口）恒打空。
    const readPetConfig = (): Promise<{ desktopPetEnabled?: boolean; desktopNotificationEnabled?: boolean }> =>
      fetch('/kanye-pet/config', { cache: 'no-store' })
        .then(async (r) => {
          const b = (await r.json()) as Record<string, unknown>
          const cfg = (b?.config ?? b ?? {}) as { desktopPetEnabled?: boolean; desktopNotificationEnabled?: boolean }
          return cfg
        })

    function DynamicNotification(this: unknown, title: string, options?: NotificationOptions): unknown {
      const bridge = (window as unknown as { __dshNotifyBridge?: { fire?: (p: unknown) => void } }).__dshNotifyBridge
      if (!bridge?.fire) {
        // Electron / 浏览器：桌宠开着就由桌宠气泡接管，不再出系统通知。
        // 配置读不到时保持原行为（宁可多弹一条，也不静默丢通知）。
        void readPetConfig()
          .then((cfg) => {
            if (cfg.desktopPetEnabled === true) return
            new (RawNotification as unknown as { new (t: string, o?: NotificationOptions): unknown })(title, options)
          })
          .catch(() => {
            new (RawNotification as unknown as { new (t: string, o?: NotificationOptions): unknown })(title, options)
          })
        return this
      }
      const payload = {
        type: 'dsh-notification',
        title,
        body: options?.body || '',
        tag: options?.tag || '',
        sessionId: (options as { sessionId?: string } | undefined)?.sessionId || '',
        requireInteraction: Boolean(options?.requireInteraction),
        force: true,
      }
      void readPetConfig()
        .then((cfg) => {
          if (cfg.desktopNotificationEnabled !== false) {
            bridge.fire?.(payload)
          }
        })
        .catch(() => {
          bridge.fire?.(payload)
        })
      return this
    }
    DynamicNotification.permission = 'granted'
    DynamicNotification.requestPermission = () => Promise.resolve('granted')

    window.Notification = DynamicNotification as unknown as typeof Notification
    return () => {
      window.Notification = RawNotification
    }
  }, 'ui-kanye-pet: dynamic notification shim')
}
