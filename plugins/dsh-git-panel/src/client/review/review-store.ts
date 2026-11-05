/**
 * 提交审查状态管理：纯内存、按会话隔离（Session-scoped），不得跨会话保留，绝不持久化。
 * @module dsh-git-panel/client/review/review-store
 */

import { useSyncExternalStore } from 'react'
import { t } from '../i18n.ts'

export interface ReviewCommitTarget {
  sessionId: string
  cwd: string
  sha: string
  subject?: string
  author?: string
  date?: string
}

class ReviewStore {
  /** 纯内存存储：按会话隔离目标提交，不写入 localStorage/sessionStorage */
  private targetsBySession = new Map<string, ReviewCommitTarget>()
  /**
   * 按会话隔离的「工作区变更」选中文件（工作区相对路径）。
   * 与提交审查共用同一个中间 Tab：有提交目标时看提交，否则看工作区。
   */
  private changesBySession = new Map<string, string>()
  private listeners = new Set<() => void>()

  getTarget(sessionId?: string): ReviewCommitTarget | null {
    if (!sessionId) return null
    return this.targetsBySession.get(sessionId) ?? null
  }

  setTarget(target: ReviewCommitTarget): void {
    if (!target.sessionId) return
    this.targetsBySession.set(target.sessionId, target)
    this.notify()
  }

  clearTarget(sessionId?: string): void {
    if (!sessionId) return
    if (this.targetsBySession.has(sessionId)) {
      this.targetsBySession.delete(sessionId)
      this.notify()
    }
  }

  /** 读取当前会话选中的工作区变更文件。 */
  getChangesFile(sessionId?: string): string | null {
    if (!sessionId) return null
    return this.changesBySession.get(sessionId) ?? null
  }

  /**
   * 退出工作区变更视图，回到图谱。
   * @param sessionId - 会话 id。
   */
  clearChangesFile(sessionId?: string): void {
    if (!sessionId) return
    if (this.changesBySession.has(sessionId)) {
      this.changesBySession.delete(sessionId)
      this.notify()
    }
  }

  /** 设定当前会话选中的工作区变更文件（传 undefined 表示未选中）。 */
  setChangesFile(sessionId: string | undefined, file: string | undefined): void {
    if (!sessionId) return
    const next = file === undefined || file === '' ? undefined : file
    if ((this.changesBySession.get(sessionId)) === next) return
    if (next === undefined) this.changesBySession.delete(sessionId)
    else this.changesBySession.set(sessionId, next)
    this.notify()
  }

  /**
   * 点击 Git 面板「变更区」的文件：绑定工作区变更视图，并切到中间主区域本插件的 Tab。
   * 同时清掉提交审查目标，让这个 Tab 落到工作区分支。
   * @param sessionId - 会话 id。
   * @param file - 工作区相对路径。
   */
  selectChangesFileAndActivate(sessionId: string | undefined, file: string): void {
    if (!sessionId || !file) return
    this.targetsBySession.delete(sessionId)
    this.changesBySession.set(sessionId, file)
    this.notify()
    this.activateTab()
  }

  /** 点击提交时：将提交记录绑定至当前会话，并切到中间主区域本插件的 Tab。 */
  selectCommitAndActivate(target: ReviewCommitTarget): void {
    this.setTarget(target)
    this.changesBySession.delete(target.sessionId)
    this.activateTab()
  }

  /** 兼容旧调用名，语义等同 {@link activateTab}。 */
  activateReviewTab(): void {
    this.activateTab()
  }

  /**
   * 模拟点击中间主区域本插件的 Tab 按钮（不写入任何持久存储）。
   *
   * 点击后宿主重渲染需要时间，所以不是一次 rAF 就完事：逐帧重试到命中为止，
   * 最多约 1 秒。找不到就放弃（例如当前根本不在会话视图里），不报错。
   */
  activateTab(): void {
    if (typeof window === 'undefined') return
    const reviewLabels = [t('tab.review'), '审查', 'Review', 'Revisión']
    let attempts = 0
    const attempt = (): void => {
      attempts += 1
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]')) as HTMLButtonElement[]
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || ''
        if (!reviewLabels.includes(text)) continue
        if (btn.getAttribute('aria-selected') !== 'true') btn.click()
        return
      }
      if (attempts < 60) requestAnimationFrame(attempt)
    }
    requestAnimationFrame(attempt)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export const reviewStore = new ReviewStore()

/** React Hook：响应式获取当前会话选中的工作区变更文件。 */
export function useChangesFile(sessionId?: string): string | null {
  return useSyncExternalStore(
    (cb) => reviewStore.subscribe(cb),
    () => reviewStore.getChangesFile(sessionId),
  )
}

/** React Hook：响应式获取当前指定会话的提交目标。 */
export function useReviewTarget(sessionId?: string): ReviewCommitTarget | null {
  return useSyncExternalStore(
    (cb) => reviewStore.subscribe(cb),
    () => reviewStore.getTarget(sessionId),
  )
}
