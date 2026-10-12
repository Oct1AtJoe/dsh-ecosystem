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

  /** 点击提交时：将提交记录绑定至当前会话，并切到中间主区域「审查」Tab。 */
  selectCommitAndActivate(target: ReviewCommitTarget): void {
    this.setTarget(target)
    this.activateReviewTab()
  }

  /** 模拟点击当前会话顶部的「审查」Tab 按钮（不写入任何持久存储）。 */
  activateReviewTab(): void {
    if (typeof window === 'undefined') return

    requestAnimationFrame(() => {
      const reviewLabels = [t('tab.review'), '审查', 'Review', 'Revisión']
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]')) as HTMLButtonElement[]
      for (const btn of buttons) {
        const text = btn.textContent?.trim() || ''
        if (reviewLabels.includes(text)) {
          if (btn.getAttribute('aria-selected') !== 'true') {
            btn.click()
          }
          break
        }
      }
    })
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

/** React Hook：响应式获取当前指定会话的提交目标。 */
export function useReviewTarget(sessionId?: string): ReviewCommitTarget | null {
  return useSyncExternalStore(
    (cb) => reviewStore.subscribe(cb),
    () => reviewStore.getTarget(sessionId),
  )
}
