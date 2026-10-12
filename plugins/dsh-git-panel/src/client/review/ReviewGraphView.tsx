/**
 * 审查 Tab 下的全局图谱主视图：无选定提交时，在会话区域全屏自适应展示 Git 提交图谱。
 * @module dsh-git-panel/client/review/ReviewGraphView
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { BranchesView, GraphView } from '../../core/types.ts'
import type { GitPanelApi } from '../api.ts'
import { useT } from '../i18n.ts'
import { ensureStyle, GraphViewComponent } from '../Panel.tsx'
import { ensureReviewStyle } from './review.css.ts'

export interface ReviewGraphViewProps {
  cwd: string
  sessionId?: string
  api: GitPanelApi
}

/** 模块级内存缓存：避免切换会话或组件重挂载时白屏转圈 */
const graphDataCache = new Map<string, { graph: GraphView; branches: BranchesView }>()

export const ReviewGraphView = memo(function ReviewGraphView(props: ReviewGraphViewProps) {
  const { cwd, sessionId, api } = props
  ensureStyle()
  ensureReviewStyle()
  const t = useT()

  const cached = cwd ? graphDataCache.get(cwd) : undefined
  const [graph, setGraph] = useState<GraphView | null>(() => cached?.graph ?? null)
  const [branches, setBranches] = useState<BranchesView | null>(() => cached?.branches ?? null)
  const [loading, setLoading] = useState(() => !cached)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth - 300 : 800))

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setWidth(Math.floor(entry.contentRect.width))
        }
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // 当 cwd 变化时，如果已有缓存立刻使用，避免 loading
  useEffect(() => {
    if (!cwd) return
    const c = graphDataCache.get(cwd)
    if (c) {
      setGraph(c.graph)
      setBranches(c.branches)
      setLoading(false)
    }
  }, [cwd])

  const loadData = useCallback(() => {
    if (!cwd) {
      setGraph(null)
      setBranches(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const hasCache = graphDataCache.has(cwd)
    if (!hasCache) {
      setLoading(true)
    }
    setError(null)

    Promise.all([api.graph(cwd), api.branches(cwd)]).then(([gRes, bRes]) => {
      if (cancelled) return
      setLoading(false)
      if (gRes.ok && bRes.ok) {
        setGraph(gRes.value)
        setBranches(bRes.value)
        graphDataCache.set(cwd, { graph: gRes.value, branches: bRes.value })
      } else {
        const err = (!gRes.ok ? gRes.error.message : '') || (!bRes.ok ? bRes.error.message : '') || '加载图谱失败'
        if (!hasCache) setError(err)
      }
    }).catch((err) => {
      if (cancelled) return
      setLoading(false)
      if (!hasCache) setError(String(err))
    })

    return () => {
      cancelled = true
    }
  }, [api, cwd])

  useEffect(() => {
    const cleanup = loadData()
    return () => {
      cleanup?.()
    }
  }, [loadData])

  if (!cwd) {
    return (
      <div
        className="dsh-review-root"
        data-conversation-composer-overlay=""
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--muted)',
          padding: 24,
          fontSize: 13,
        }}
      >
        {t('panel.empty')}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="dsh-review-root dsh-gp"
      data-conversation-composer-overlay=""
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--bg)',
        boxSizing: 'border-box',
        padding: '6px 14px 20px',
      }}
    >
      {loading && !graph ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--muted)',
            gap: 8,
            fontSize: 13,
          }}
        >
          <span className="dsh-gp-spinner lg" />
          <span>{t('loading')}</span>
        </div>
      ) : error && !graph ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--danger)',
            gap: 8,
            padding: 24,
            fontSize: 13,
          }}
        >
          <div>{error}</div>
          <button type="button" className="dsh-gp-btn" onClick={loadData}>
            {t('op.refresh')}
          </button>
        </div>
      ) : graph ? (
        <GraphViewComponent
          graph={graph}
          width={width}
          branches={branches}
          path={cwd}
          sessionId={sessionId}
        />
      ) : null}
    </div>
  )
})
