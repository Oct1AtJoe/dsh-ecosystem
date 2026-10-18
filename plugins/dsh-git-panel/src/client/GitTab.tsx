/**
 * 官方右侧栏 Git Tab 的内容体：跟随当前会话的工作区目录切换。
 *
 * 会话身份来自 slot 标准属性 `sessionId`：`sidebar.right.pane.tab` 是
 * `scope: 'session'` 的 keyed 槽，官方会直接注入当前会话的 id。早期版本改成
 * 订阅 sessions 列表的 `getSnapshot().current`，但 0.2.1 的 `SessionListState`
 * 只有 `{ ids, byId, phase, projectionsBySession }`——**没有 `current`**，
 * 于是 `readPath()` 永远拿到空串，面板一直停在「打开项目会话后显示 Git 面板」。
 * 现在按 id 查 `byId[id].cwd`，订阅只用于 cwd 变化与 running 结束后的刷新。
 *
 * 同时它把官方注入的 `useTabInfo` 变成一条「在右侧栏打开这个文件的 Git 对比」
 * 通道交给面板本体——面板只负责点，不关心地址怎么拼。
 *
 * @module dsh-git-panel/client/GitTab
 */

import { createElement, useCallback, useEffect, useState } from 'react'
import { GitPanelApi } from './api.ts'
import { GitPanel } from './Panel.tsx'
import type { GitStatusCache } from './git-status.ts'

/** sessions 服务的最小结构面孔（鸭子类型，避免依赖宿主 SDK 类型）。 */
export interface TabSessions {
  list: {
    getSnapshot(): { ids?: readonly string[]; byId: Record<string, { cwd?: string; running?: boolean }> }
    subscribe(fn: () => void): () => void
  }
}

/** 官方右侧栏 `useTabInfo()` 的最小面孔。 */
export interface TabInfo {
  tab: {
    id: string
    contentId: string
    actions: {
      openResource(address: string, options?: Record<string, unknown>): void
    }
  }
}

/** Git Tab 内容体 props：api 由注册处注入，sessionId 由官方 session scope 注入。 */
export interface GitTabBodyProps {
  api?: GitPanelApi
  sessions?: TabSessions
  statusCache?: GitStatusCache
  /** 注入工厂给出的初始路径（可选，订阅后会以实时快照为准）。 */
  path?: string
  /** 官方 slot 注入的当前会话 id（`sidebar.right.pane.tab` 的 session scope 标准属性）。 */
  sessionId?: string
  /** 官方注入的标签钩子。 */
  useTabInfo?: () => TabInfo
}

/** 按会话身份读取当前工作区路径。 */
function readPath(sessions: TabSessions | undefined, sessionId: string | undefined): string {
  if (!sessions || sessionId === undefined || sessionId === '') return ''
  const cwd = sessions.list.getSnapshot().byId[sessionId]?.cwd
  return typeof cwd === 'string' ? cwd : ''
}

/** 由会话身份与工作区相对路径拼出文件资源地址。 */
function addressOf(sessionId: string, relative: string): string {
  const encoded = relative.split('/').map((segment) => encodeURIComponent(segment)).join('/')
  return `dsh-resource://file/session/${encodeURIComponent(sessionId)}/${encoded}`
}

/** 官方右侧栏中的 Git 面板。 */
export function GitTabBody(props: GitTabBodyProps): React.ReactElement {
  const { sessions, statusCache, sessionId: injectedSessionId } = props
  const [api] = useState<GitPanelApi>(() => props.api ?? new GitPanelApi())
  const [path, setPath] = useState<string>(() => props.path ?? readPath(sessions, injectedSessionId))
  const uuid = injectedSessionId ?? ''
  const info = props.useTabInfo?.()

  useEffect(() => {
    if (!sessions) return undefined
    let prevRunning = false
    const update = (): void => {
      const snapshot = sessions.list.getSnapshot()
      const currentSession = uuid === '' ? undefined : snapshot.byId[uuid]
      const newPath = typeof currentSession?.cwd === 'string' ? currentSession.cwd : ''
      setPath(newPath)

      const isRunning = Boolean(currentSession?.running)
      // Agent 运行结束（running: true -> false）：工作区很可能有新建或修改文件，主动强制刷新
      if (prevRunning && !isRunning && newPath !== '') {
        if (statusCache !== undefined) void statusCache.ensure(newPath, true)
      }
      prevRunning = isRunning
    }
    update()
    return sessions.list.subscribe(update)
  }, [sessions, statusCache, uuid])

  /** 在右侧栏以 Git 对比视图打开某个变更文件。 */
  const openDiff = useCallback((relative: string): boolean => {
    if (uuid === '' || relative === '') return false
    try {
      info?.tab.actions.openResource(addressOf(uuid, relative), { kind: 'git-diff' })
      return true
    } catch (error) {
      console.warn('dsh-git-panel: open diff failed', error)
      return false
    }
  }, [info, uuid])

  /** 面板刷新时同步刷新装饰缓存。 */
  const refreshStatus = useCallback((): void => {
    if (statusCache !== undefined && path !== '') void statusCache.ensure(path, true)
  }, [statusCache, path])

  return createElement(GitPanel, { path, api, sessionId: uuid, onOpenDiff: openDiff, onRefreshStatus: refreshStatus, statusCache })
}
