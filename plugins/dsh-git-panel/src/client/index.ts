/**
 * dsh-git-panel —— 浏览器端装配：
 *
 * 1. 输入 dock 的分支 Chip；
 * 2. 官方右侧栏的 Git 面板标签（`kind: 'git'`）；
 * 3. Git 变更对比标签（`kind: 'git-diff'`）——只接手「当前有 git 改动」的文件，
 *    由同步的 `canOpen` 门禁决定，其余文件仍走官方预览；
 * 4. 侧边栏文件树的 git 状态装饰（M/U/A 标记）。
 *
 * 所有接线失败都会记日志而不会抛出——当插件 apply 抛出异常时，shell 会中止整个
 * 启动流程。
 * @module dsh-git-panel/client
 */

import { createElement } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { GitPanelApi } from './api.ts'
import { initI18n, t } from './i18n.ts'
import { GitTabBody } from './GitTab.tsx'
import { GitDiffView } from './GitDiffView.tsx'
import { GitStatusCache } from './git-status.ts'
import { installFileTreeDecorations } from './decorations.ts'
import { basenameOf, parseFileAddress } from './refs.ts'
import { ReviewView } from './review/ReviewView.tsx'

/**
 * 我们使用到的注入式客户端运行时结构。这里在本地声明，而不是导入 SDK 的
 * ClientContext：宿主侧的 SDK 包会用另一种不同的 `sessions` 结构扩展同一个
 * cordis Context，当宿主端与客户端在同一程序中一起编译时，后者会胜出。无论
 * 如何，bundle 在运行时都采用鸭子类型判定。
 */
interface PanelClientContext {
  effect(fn: () => (() => void) | void, name: string): void
  inject(services: string[], fn: (scope: PanelClientContext) => void): void
  sidebarRightTabs?: {
    register(def: unknown): () => void
  }
  sidebarRight?: {
    openResource(address: string, options?: Record<string, unknown>): void
    openTab(kind: string, options?: Record<string, unknown>): void
  }
  sessions: {
    list: {
      getSnapshot(): { current?: string; byId: Record<string, { cwd?: string }> }
      subscribe(fn: () => void): () => void
    }
  }
  slots: {
    inject(name: string, factory: () => unknown): () => void
    register(opts: Record<string, unknown>, component: unknown): unknown
  }
  locale: {
    getLocale(): { active: string }
    subscribe(fn: () => void): () => void
  }
}

export const inject = ['sessions', 'locale', 'slots']

const TAB_ID = '@deepseek-ai/dsh-git-panel'


/**
 * 工作区启动卡上的 Git 图标。
 *
 * 契约与官方 provider 的 guide icon 一致：接收 `{ size, className }`，
 * 尺寸由官方卡片（26px）注入，颜色继承 `currentColor` 以便跟随主题与悬停态。
 */
function GitGuideIcon(props: { size?: number; className?: string }): React.ReactElement {
  const size = props.size ?? 26
  return createElement('svg', {
    width: size,
    height: size,
    className: props.className,
    viewBox: '0 0 28 28',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  },
    createElement('circle', { key: 'a', cx: 9, cy: 7, r: 2.6 }),
    createElement('circle', { key: 'b', cx: 9, cy: 21, r: 2.6 }),
    createElement('circle', { key: 'c', cx: 19, cy: 14, r: 2.6 }),
    createElement('path', { key: 'd', d: 'M9 9.6v8.8M9 14h7.4' }),
  )
}const DIFF_TAB_ID = '@deepseek-ai/dsh-git-panel/diff'
const DIFF_KIND = 'git-diff'

/** 文件地址前缀（与官方 side-bar 文件树拼出的地址同一约定）。 */
const FILE_PREFIX = 'dsh-resource://file/session/'

/** 变更清单轮询间隔：既保证装饰新鲜，又不至于在本地反复跑 git。 */
const POLL_MS = 3000

/** 由会话身份拼出文件资源地址。 */
function fileAddressOf(sessionId: string, relative: string): string {
  const encoded = relative.split('/').map((segment) => encodeURIComponent(segment)).join('/')
  return `${FILE_PREFIX}${encodeURIComponent(sessionId)}/${encoded}`
}

export function apply(ctx: PanelClientContext): void {
  try {
    initI18n(ctx.locale)
  } catch (error) {
    console.error('dsh-git-panel: i18n init failed', error)
  }

  const api = new GitPanelApi()
  const statusCache = new GitStatusCache(api)

  /** 会话身份 -> 工作区根（cwd）。 */
  const cwdOf = (sessionId: string | undefined): string => {
    if (sessionId === undefined) return ''
    try {
      const snapshot = ctx.sessions.list.getSnapshot()
      const cwd = snapshot.byId[sessionId]?.cwd
      return typeof cwd === 'string' ? cwd : ''
    } catch {
      return ''
    }
  }

  // 0. 变更清单：切会话或前台激活时按需刷新，绝不在后台以 3 秒高频暴力轮询。
  ctx.inject(['sessions'], () => {
    try {
      let lastCwd = ''
      let lastRefreshTime = 0

      const refreshCurrent = (fresh = false): void => {
        const current = ctx.sessions.list.getSnapshot().current
        const cwd = cwdOf(current)
        if (!cwd) return
        const now = Date.now()
        // 距离上次刷新不足 10 秒且不是强制刷新则跳过，避免高频打垮宿主
        if (!fresh && cwd === lastCwd && now - lastRefreshTime < 10000) return
        lastCwd = cwd
        lastRefreshTime = now
        void statusCache.ensure(cwd, fresh)
      }

      refreshCurrent()
      // 仅在当前会话切换或当前工作区目录改变时按需触发，绝不随每次会话更新轰炸
      ctx.sessions.list.subscribe(() => {
        const current = ctx.sessions.list.getSnapshot().current
        const cwd = cwdOf(current)
        if (cwd && cwd !== lastCwd) {
          refreshCurrent(true)
        }
      })

      const onFocusOrVisible = (): void => {
        if (document.visibilityState === 'visible') {
          refreshCurrent(false)
        }
      }
      window.addEventListener('focus', onFocusOrVisible)
      document.addEventListener('visibilitychange', onFocusOrVisible)

      ctx.effect(() => () => {
        window.removeEventListener('focus', onFocusOrVisible)
        document.removeEventListener('visibilitychange', onFocusOrVisible)
      }, 'dsh-git-panel: status poll')
      ctx.effect(() => installFileTreeDecorations(statusCache, () => {}), 'dsh-git-panel: file tree decorations')
    } catch (error) {
      console.warn('dsh-git-panel: status polling setup failed', error)
    }
  })

  // 1. 输入框上方的分支状态 Chip —— 当前**不再注册**。
  //
  //    它是 `conversation.input.dock` 槽里紧贴输入框上方的一个 div，与官方
  //    工作区选择器并排。实际上它属于重复入口：右侧栏 Git 标签本身就是一等
  //    公民（分支列表、双击切换、右键菜单全都在那里），chip 只是又占了一行
  //    输入框上方的空间，因此这里停用。
  //
  //    组件本体（BranchChip.tsx）与下方第 2 条的面板都不依赖这段注册：
  //    Panel 切分支时自己会 load() 刷新，chip 派发的 'dsh-git-panel:switched'
  //    事件对它并非必需。保留代码便于需要时一键恢复——把下面这段放开即可。
  //
  // ctx.inject(['slots', 'sessions'], (scope: PanelClientContext) => {
  //   try {
  //     scope.slots.inject('conversation.input.dock', () =>
  //       scope.slots.register({
  //         name: 'conversation.input.dock',
  //         id: 'git-panel-branch-chip',
  //         order: 100,
  //         locale: 'dsh-git-panel',
  //         inject: () => ({ sessions: scope.sessions }),
  //       }, BranchChip))
  //   } catch (error) {
  //     console.error('dsh-git-panel: branch chip registration failed', error)
  //   }
  // })

  // 2. 官方右侧栏集成 (适配新版 DSH 0.1.5-alpha.2+ 原生多 Tab 系统)
  ctx.inject(['sidebarRightTabs', 'slots'], (scope: any) => {
    try {
      if (scope.sidebarRightTabs) {
        scope.sidebarRightTabs.register({
          id: TAB_ID,
          kind: 'git',
          priority: 'extension',
          title: () => 'Git',
          // 与官方 provider（sidebar-files / sidebar-terminal）保持完全一致的
          // guide 契约：id + order + title + description + icon 五件套。
          // 缺 description/icon 会让工作区启动卡只剩一行标题，行距与留白都和
          // 官方卡片对不齐——补全后才与「工作区文件」「新建终端」长得一样。
          guide: [{
            id: 'git',
            order: 12,
            title: () => t('tab.gitTitle'),
            description: () => t('guide.gitDescription'),
            icon: GitGuideIcon,
          }],
        })

        scope.slots.inject('sidebar.right.pane.tab', () =>
          scope.slots.register({
            name: 'sidebar.right.pane.tab',
            key: TAB_ID,
            inject: () => ({ api, sessions: ctx.sessions, statusCache }),
          }, GitTabBody)
        )

        scope.slots.inject('sidebar.right.pane.tab.title', () =>
          scope.slots.register({
            name: 'sidebar.right.pane.tab.title',
            key: TAB_ID,
          }, () => createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 5 } },
            createElement('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' },
              createElement('circle', { cx: 4, cy: 4, r: 2 }),
              createElement('circle', { cx: 4, cy: 12, r: 2 }),
              createElement('circle', { cx: 12, cy: 8, r: 2 }),
              createElement('path', { d: 'M4 6v4M4 8h5a3 3 0 013 3' })
            ),
            createElement('span', null, 'Git')
          ))
        )
        console.log('dsh-git-panel: registered into native sidebarRightTabs')
      }
    } catch (err) {
      console.warn('dsh-git-panel: sidebarRightTabs register error', err)
    }
  })

  // 3. Git 变更对比标签：按 kind: 'git-diff' 打开。
  //    不声明全局匹配模式（patterns: []），避免劫持用户在对话中或文件树中点击普通文件时的默认预览行为；
  //    仅在 Git 面板明确点击变更文件时（带 { kind: 'git-diff' }）才打开此标签类型。
  ctx.inject(['sidebarRightTabs', 'slots', 'sessions', 'sidebarRight'], (scope: any) => {
    try {
      if (!scope.sidebarRightTabs) return
      scope.sidebarRightTabs.register({
        id: DIFF_TAB_ID,
        kind: DIFF_KIND,
        priority: 'extension',
        canOpen: (address: string): boolean => {
          const parsed = parseFileAddress(address)
          return parsed !== undefined && parsed.sessionId !== ''
        },
        title: (address: string) => {
          const parsed = parseFileAddress(address)
          return `± ${basenameOf(parsed?.path ?? address)}`
        },
      })

      scope.slots.inject('sidebar.right.pane.tab', () =>
        scope.slots.register({
          name: 'sidebar.right.pane.tab',
          key: DIFF_TAB_ID,
          inject: () => ({
            api,
            sessions: ctx.sessions,
            sidebarRight: scope.sidebarRight ?? ctx.sidebarRight,
          }),
        }, GitDiffView)
      )
      console.log('dsh-git-panel: registered git-diff tab type')
    } catch (error) {
      console.warn('dsh-git-panel: git-diff register error', error)
    }
  })

  // 4. 中间主区域对话旁边的「审查」Tab：通过 conversation.view 插槽注册。
  ctx.inject(['slots', 'sessions'], (scope: any) => {
    try {
      scope.slots.inject('conversation.view', () =>
        scope.slots.register({
          name: 'conversation.view',
          id: 'git-review',
          order: 20,
          label: () => t('tab.review'),
          inject: (sessionId: string) => ({
            sessionId,
            cwd: cwdOf(sessionId),
            api,
          }),
        }, ReviewView)
      )
      console.log('dsh-git-panel: registered conversation.view git-review tab')
    } catch (error) {
      console.warn('dsh-git-panel: conversation.view register error', error)
    }
  })
}

/** Cordis 插件入口 —— 同时提供命名与默认导出，确保 loader 总能解析到它。 */
export default { apply, inject }
