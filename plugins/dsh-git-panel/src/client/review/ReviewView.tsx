/**
 * 中间会话主区域「审查」Tab 根组件：提交头 + 左右可拖拽分栏（修改文件树 + 代码 Diff）。
 * @module dsh-git-panel/client/review/ReviewView
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { CommitDetail, CommitFileItem } from '../../core/types.ts'
import { GitPanelApi } from '../api.ts'
import { useT } from '../i18n.ts'
import { icon } from '../icons.tsx'
import { CommitDiffPanel } from './CommitDiffPanel.tsx'
import { CommitFileTree } from './CommitFileTree.tsx'
import { CommitHeader } from './CommitHeader.tsx'
import { ReviewGraphView } from './ReviewGraphView.tsx'
import { ensureReviewStyle } from './review.css.ts'
import { reviewStore, useReviewTarget } from './review-store.ts'

export interface ReviewViewProps {
  sessionId?: string
  cwd?: string
  api?: GitPanelApi
}

const STORAGE_TREE_WIDTH_KEY = 'dsh-git-panel.review.treeWidth'
const DEFAULT_TREE_WIDTH = 220
const MIN_TREE_WIDTH = 160
const MAX_TREE_WIDTH = 420

export const ReviewView = memo(function ReviewView(props: ReviewViewProps) {
  ensureReviewStyle()
  const t = useT()
  // 严格绑定当前会话：跨会话不保留审查状态
  const target = useReviewTarget(props.sessionId)
  const [api] = useState(() => props.api ?? new GitPanelApi())

  // 当前有效的工作区路径与提交 sha：必须属于当前会话
  const effectiveCwd = props.cwd || target?.cwd || ''
  const effectiveSha = target?.sha || ''

  const [detail, setDetail] = useState<CommitDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<CommitFileItem | null>(null)

  // 左侧文件树宽度拖拽
  const [treeWidth, setTreeWidth] = useState<number>(() => {
    try {
      const stored = Number(localStorage.getItem(STORAGE_TREE_WIDTH_KEY))
      if (Number.isFinite(stored) && stored >= MIN_TREE_WIDTH && stored <= MAX_TREE_WIDTH) {
        return stored
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_TREE_WIDTH
  })

  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ startX: number; startW: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    dragStartRef.current = { startX: e.clientX, startW: treeWidth }

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return
      const delta = moveEvent.clientX - dragStartRef.current.startX
      const newWidth = Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, dragStartRef.current.startW + delta))
      setTreeWidth(newWidth)
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
      dragStartRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      try {
        localStorage.setItem(STORAGE_TREE_WIDTH_KEY, String(treeWidth))
      } catch {
        /* ignore */
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [treeWidth])

  // 加载提交详情：切换会话或无提交时，立即清空旧数据
  useEffect(() => {
    if (!props.sessionId || !effectiveCwd || !effectiveSha) {
      setDetail(null)
      setSelectedFile(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    api.commitDetail(effectiveCwd, effectiveSha).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (res.ok) {
        setDetail(res.value)
        // 默认选中第一个修改文件
        if (res.value.files.length > 0) {
          setSelectedFile(res.value.files[0]!)
        } else {
          setSelectedFile(null)
        }
      } else {
        setError(res.error.message || '获取提交详情失败')
      }
    }).catch((err) => {
      if (cancelled) return
      setLoading(false)
      setError(String(err))
    })

    return () => {
      cancelled = true
    }
  }, [api, props.sessionId, effectiveCwd, effectiveSha])

  return (
    <div
      className="dsh-review-root"
      data-conversation-composer-overlay=""
    >
      {/* 1. 图谱视图容器：未选中具体提交时展示；选中时通过 display: none 保活 DOM，保留滚动条位置与筛选输入 */}
      <div
        style={{
          display: effectiveSha ? 'none' : 'flex',
          flex: 1,
          height: '100%',
          minHeight: 0,
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <ReviewGraphView
          cwd={effectiveCwd}
          sessionId={props.sessionId}
          api={api}
        />
      </div>

      {/* 2. 提交代码审查视图：选中具体提交时才展示 */}
      {effectiveSha ? (
        loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              color: 'var(--review-muted)',
              gap: 8,
              fontSize: 13,
            }}
          >
            <span className="dsh-gp-spinner lg" />
            <span>{t('review.loading')}</span>
          </div>
        ) : error || !detail ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              color: 'var(--review-del-color)',
              gap: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t('panel.opFailed')}</div>
            <div style={{ fontSize: 12.5 }}>{error}</div>
            <button
              type="button"
              className="dsh-review-diff-btn"
              onClick={() => reviewStore.clearTarget(props.sessionId)}
            >
              ← {t('review.backToGraph')}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              height: '100%',
              minHeight: 0,
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {/* 顶部提交信息条 */}
            <CommitHeader
              detail={detail}
              onBack={() => {
                reviewStore.clearTarget(props.sessionId)
              }}
            />

            {/* 左右分栏主体 */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
              {/* 左栏：文件树 */}
              <div
                className="dsh-review-tree"
                style={{ width: treeWidth }}
              >
                <CommitFileTree
                  files={detail.files}
                  selectedPath={selectedFile?.path ?? null}
                  onSelectFile={setSelectedFile}
                />
              </div>

              {/* 拖拽把手 Splitter */}
              <div
                onMouseDown={handleMouseDown}
                style={{
                  width: 4,
                  cursor: 'col-resize',
                  background: 'transparent',
                  position: 'relative',
                  zIndex: 10,
                  marginLeft: -2,
                  marginRight: -2,
                }}
                title="拖拽调节宽度"
              />

              {/* 右栏：Diff 视图 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <CommitDiffPanel
                  api={api}
                  cwd={effectiveCwd}
                  sha={detail.sha}
                  file={selectedFile}
                  siblings={detail.files}
                />
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  )
})
