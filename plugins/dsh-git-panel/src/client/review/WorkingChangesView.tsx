/**
 * 中间会话主区域「审查」Tab 的工作区分支：工作区变更文件树 + 单文件差异。
 *
 * 与提交审查共用同一个 Tab（B 方案）：reviewStore 里有提交目标时看提交，
 * 否则看工作区。点 Git 面板「变更区」的文件即落到这里。
 *
 * 差异正文直接复用 GitDiffView：它自带取数（HEAD / 工作区 / 状态），
 * 只需要一条 resourceAddress，因此这里不做任何 diff 逻辑。
 *
 * @module dsh-git-panel/client/review/WorkingChangesView
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import type { CommitFileItem } from '../../core/types.ts'
import { GitPanelApi } from '../api.ts'
import { GitDiffView } from '../GitDiffView.tsx'
import { statusLetter } from '../git-status.ts'
import { useT } from '../i18n.ts'
import { icon } from '../icons.tsx'
import { addressOf } from '../refs.ts'
import { CommitFileTree } from './CommitFileTree.tsx'
import { reviewStore, useChangesFile } from './review-store.ts'

export interface WorkingChangesViewProps {
  sessionId?: string
  cwd?: string
  api?: GitPanelApi
  sessions?: unknown
}

const STORAGE_TREE_WIDTH_KEY = 'dsh-git-panel.review.treeWidth'
const DEFAULT_TREE_WIDTH = 220
const MIN_TREE_WIDTH = 160
const MAX_TREE_WIDTH = 420

function readTreeWidth(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_TREE_WIDTH_KEY))
    if (Number.isFinite(stored) && stored >= MIN_TREE_WIDTH && stored <= MAX_TREE_WIDTH) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_TREE_WIDTH
}

export const WorkingChangesView = memo(function WorkingChangesView(props: WorkingChangesViewProps) {
  const t = useT()
  const [api] = useState(() => props.api ?? new GitPanelApi())
  const selected = useChangesFile(props.sessionId)
  const [files, setFiles] = useState<CommitFileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [treeWidth, setTreeWidth] = useState<number>(readTreeWidth)

  const cwd = props.cwd ?? ''

  /** 拉取工作区变更清单，并折算成文件树需要的条目（无增删统计）。 */
  const load = useCallback(async (): Promise<void> => {
    if (!cwd || !props.sessionId) {
      setFiles([])
      setLoading(false)
      return
    }
    setLoading(true)
    // status 同时给出变更清单与两套 numstat；fileStatus 只有状态码没有行数，
    // 文件树要显示 +N/-N 就只能走这里。
    const [result, statusResult] = await Promise.all([
      api.fileStatus(cwd),
      api.status(cwd),
    ])
    setLoading(false)
    if (!result.ok) {
      setError(result.error.message || 'git status failed')
      setFiles([])
      return
    }
    setError(null)
    const stagedStats = statusResult.ok
      ? (statusResult.value as { stagedStats?: Record<string, { insertions: number; deletions: number }> }).stagedStats ?? {}
      : {}
    const unstagedStats = statusResult.ok
      ? (statusResult.value as { unstagedStats?: Record<string, { insertions: number; deletions: number }> }).unstagedStats ?? {}
      : {}
    setFiles(result.value.entries.map((entry) => {
      // 已暂存优先看暂存区统计，否则看工作区；未跟踪文件由宿主补了行数。
      const stat = stagedStats[entry.path] ?? unstagedStats[entry.path]
      return {
        path: entry.path,
        status: statusLetter(entry.code),
        added: stat?.insertions ?? 0,
        deleted: stat?.deletions ?? 0,
      }
    }))
  }, [api, cwd, props.sessionId])

  useEffect(() => {
    void load()
  }, [load])

  /** 选中项：优先会话里绑定的那个，否则第一个变更文件。 */
  const current = useMemo(() => {
    if (selected !== null && files.some((file) => file.path === selected)) return selected
    return files[0]?.path ?? null
  }, [selected, files])

  /** 首次有清单时把默认选中写回 store，保证左树高亮与右侧一致。 */
  useEffect(() => {
    if (selected === null && current !== null) reviewStore.setChangesFile(props.sessionId, current)
  }, [selected, current, props.sessionId])

  const onSelectFile = useCallback((file: CommitFileItem): void => {
    reviewStore.setChangesFile(props.sessionId, file.path)
  }, [props.sessionId])

  // 树宽拖拽：与 ReviewView 同一套交互，共享同一个持久键。
  const handleMouseDown = useCallback((event: React.MouseEvent): void => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = treeWidth
    const onMove = (moveEvent: MouseEvent): void => {
      setTreeWidth(Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, startWidth + moveEvent.clientX - startX)))
    }
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setTreeWidth((width) => {
        try {
          localStorage.setItem(STORAGE_TREE_WIDTH_KEY, String(width))
        } catch {
          /* ignore */
        }
        return width
      })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [treeWidth])

  return (
    <div className="dsh-review-root" data-conversation-composer-overlay="">
      {/* 顶部信息条：说明当前看的是工作区，而不是某次提交 */}
      <div className="dsh-review-wt-bar">
        <span className="dsh-review-wt-title">{t('review.workspace')}</span>
        <span className="dsh-review-wt-meta">
          {loading ? t('review.loadingChanges') : t('review.filesCount', { count: String(files.length) })}
        </span>
        <span style={{ flex: 1 }} />
        {/* 问题1：进入变更视图后必须能退回图谱，否则这个 Tab 变成单向入口 */}
        <button
          type="button"
          className="dsh-review-diff-btn"
          onClick={() => reviewStore.clearChangesFile(props.sessionId)}
          title={t('review.backToGraph')}
        >
          ← {t('review.backToGraph')}
        </button>
        <button type="button" className="dsh-review-diff-btn" onClick={() => void load()} disabled={loading}>
          {icon('refresh', 12)} {t('review.refresh')}
        </button>
      </div>

      {error !== null && files.length === 0 ? (
        <div className="dsh-review-wt-empty">
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t('panel.opFailed')}</div>
          <div style={{ fontSize: 12.5 }}>{error}</div>
        </div>
      ) : files.length === 0 ? (
        <div className="dsh-review-wt-empty">
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t('review.workspaceClean')}</div>
          <div style={{ fontSize: 12.5 }}>{t('review.workspaceCleanHint')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          <div className="dsh-review-tree" style={{ width: treeWidth }}>
            <CommitFileTree files={files} selectedPath={current} onSelectFile={onSelectFile} />
          </div>
          <div
            onMouseDown={handleMouseDown}
            style={{ width: 4, cursor: 'col-resize', background: 'transparent', position: 'relative', zIndex: 10, marginLeft: -2, marginRight: -2 }}
            title={t('review.treeWidth')}
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {current !== null && props.sessionId !== undefined ? (
              <WorkingDiff api={api} sessions={props.sessions} sessionId={props.sessionId} file={current} />
            ) : (
              <div className="dsh-review-wt-empty">
                <div style={{ fontSize: 12.5 }}>{t('review.pickFile')}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

/** 单文件差异：GitDiffView 只吃一条资源地址，跨文件切换时按 key 重挂载即可重新取数。 */
const WorkingDiff = memo(function WorkingDiff(props: { api: GitPanelApi; sessions?: unknown; sessionId: string; file: string }) {
  return (
    <GitDiffView
      key={props.file}
      api={props.api}
      sessions={props.sessions as never}
      resourceAddress={addressOf(props.sessionId, props.file)}
    />
  )
})
