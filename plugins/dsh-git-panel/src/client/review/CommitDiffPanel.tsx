/**
 * 提交审查：右侧代码 Diff 面板（对齐 dsh-git-review 的双列4栏网格、hatched斜线纹、gap展开条、双列单列切换）。
 * @module dsh-git-panel/client/review/CommitDiffPanel
 */

import { memo, useEffect, useMemo, useState } from 'react'
import type { CommitFileDiffResult, CommitFileItem } from '../../core/types.ts'
import type { GitPanelApi } from '../api.ts'
import { diffRows } from '../diff.ts'
import { useT } from '../i18n.ts'
import { icon } from '../icons.tsx'
import { buildDiffDisplay, DiffTable, DIFF_CONTEXT_LINES } from './DiffTable.tsx'

interface CommitDiffPanelProps {
  api: GitPanelApi
  cwd: string
  sha: string
  file: CommitFileItem | null
  /** 同提交的其余改动文件：用于后台预取，点下一个文件时秒开。 */
  siblings?: CommitFileItem[]
}

/**
 * 提交级 diff 缓存：提交内容不可变，同一 (提交, 文件) 永远得到同一结果。
 * 模块级（跨组件实例共享），因此切文件、返回图谱再进来都是瞬时命中。
 */
const fileDiffCache = new Map<string, CommitFileDiffResult>()
const FILE_DIFF_CACHE_LIMIT = 120
const PREFETCH_CONCURRENCY = 4
/**
 * 预取文件数上限：每个文件在宿主侧要 fork 两个 git 进程，
 * 大提交（几十个文件）全量预取会把进程表打满，得不偿失。
 * ponytail: 只热前 12 个，真需要更多时把上限提到 cache 容量即可。
 */
const PREFETCH_MAX_FILES = 12

function fileDiffKey(cwd: string, sha: string, file: string): string {
  return `${cwd}\u0000${sha}\u0000${file}`
}

/** 带缓存的取 diff：命中直接返回，未命中才走网络并写入缓存。 */
function fetchFileDiff(
  api: GitPanelApi,
  cwd: string,
  sha: string,
  file: CommitFileItem,
): Promise<CommitFileDiffResult> {
  const key = fileDiffKey(cwd, sha, file.path)
  const hit = fileDiffCache.get(key)
  if (hit !== undefined) return Promise.resolve(hit)
  return api.commitFileDiff(cwd, sha, file.path, file.oldPath).then((res) => {
    if (!res.ok) throw new Error(res.error.message || '加载 diff 失败')
    if (fileDiffCache.size >= FILE_DIFF_CACHE_LIMIT) fileDiffCache.clear()
    fileDiffCache.set(key, res.value)
    return res.value
  })
}

export const CommitDiffPanel = memo(function CommitDiffPanel(props: CommitDiffPanelProps) {
  const { api, cwd, sha, file, siblings } = props
  const t = useT()

  const [loading, setLoading] = useState(false)
  const [diffData, setDiffData] = useState<CommitFileDiffResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<'split' | 'unified'>('split')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [expandAll, setExpandAll] = useState(false)
  const [expandedGaps, setExpandedGaps] = useState<ReadonlySet<number>>(() => new Set())

  // 加载单文件 diff：缓存命中时同步渲染，不闪 loading。
  useEffect(() => {
    if (!file || !cwd || !sha) {
      setDiffData(null)
      return
    }
    const hit = fileDiffCache.get(fileDiffKey(cwd, sha, file.path))
    if (hit !== undefined) {
      setDiffData(hit)
      setLoading(false)
      setError(null)
      setExpandedGaps(new Set())
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setDiffData(null)
    setExpandedGaps(new Set())

    fetchFileDiff(api, cwd, sha, file).then((value) => {
      if (cancelled) return
      setLoading(false)
      setDiffData(value)
    }).catch((err) => {
      if (cancelled) return
      setLoading(false)
      setError(String(err instanceof Error ? err.message : err))
    })

    return () => {
      cancelled = true
    }
  }, [api, cwd, sha, file])

  // 后台预取同提交其余文件（限并发），点下一个文件时直接命中缓存。
  useEffect(() => {
    if (!cwd || !sha || !siblings || siblings.length === 0) return undefined
    const pending = siblings
      .filter((f) => f.path !== file?.path)
      .filter((f) => !fileDiffCache.has(fileDiffKey(cwd, sha, f.path)))
      .slice(0, PREFETCH_MAX_FILES)
    if (pending.length === 0) return undefined

    let cancelled = false
    const queue = [...pending]
    const workers = Array.from({ length: Math.min(PREFETCH_CONCURRENCY, queue.length) }, async () => {
      while (!cancelled) {
        const next = queue.shift()
        if (next === undefined) return
        try {
          await fetchFileDiff(api, cwd, sha, next)
        } catch {
          /* 预取失败静默：用户真正点开时会再走一次并给出错误 */
        }
      }
    })
    void Promise.all(workers)
    return () => {
      cancelled = true
    }
  }, [api, cwd, sha, siblings, file?.path])

  // 计算行级 diff
  const rows = useMemo(() => {
    if (!diffData || diffData.binary) return []
    let oldText = diffData.oldContent
    let newText = diffData.newContent
    if (ignoreWhitespace) {
      oldText = oldText.split('\n').map((l) => l.trimEnd()).join('\n')
      newText = newText.split('\n').map((l) => l.trimEnd()).join('\n')
    }
    return diffRows(oldText, newText)
  }, [diffData, ignoreWhitespace])

  const displayItems = useMemo(
    () => buildDiffDisplay(rows, expandedGaps, expandAll),
    [rows, expandedGaps, expandAll],
  )

  if (!file) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--review-muted)', fontSize: 13 }}>
        {t('diff.empty')}
      </div>
    )
  }

  return (
    <div className="dsh-review-diff-pane">
      {/* 顶部 Header：文件图标 + 路径 + 增减统计 + 工具按钮 */}
      <div className="dsh-review-diff-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ color: 'var(--review-muted)', display: 'flex' }}>
            {icon('file', 14)}
          </span>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--dsw-alias-label-primary, inherit)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 12.5,
            }}
            title={file.path}
          >
            {file.path}
          </span>
          {(file.added > 0 || file.deleted > 0) && (
            <span style={{ fontSize: 11.5, display: 'inline-flex', gap: 4, flexShrink: 0, fontFamily: 'monospace' }}>
              {file.added > 0 && <span style={{ color: 'var(--review-add-color)' }}>+{file.added}</span>}
              {file.deleted > 0 && <span style={{ color: 'var(--review-del-color)' }}>-{file.deleted}</span>}
            </span>
          )}
        </div>

        {/* 右侧控制切换按钮组 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* 双列 / 单列 模式切换 */}
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`dsh-review-diff-btn${mode === 'split' ? ' active' : ''}`}
          >
            {t('review.splitDiff')}
          </button>
          <button
            type="button"
            onClick={() => setMode('unified')}
            className={`dsh-review-diff-btn${mode === 'unified' ? ' active' : ''}`}
          >
            {t('review.unifiedDiff')}
          </button>

          {/* 忽略空白 */}
          <button
            type="button"
            onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
            className={`dsh-review-diff-btn${ignoreWhitespace ? ' active' : ''}`}
            title={t('review.ignoreWhitespace')}
          >
            {t('review.ignoreWhitespace')}
          </button>

          {/* 展开全部上下文 */}
          <button
            type="button"
            onClick={() => setExpandAll(!expandAll)}
            className={`dsh-review-diff-btn${expandAll ? ' active' : ''}`}
            title={expandAll ? t('review.collapseAll') : t('review.expandAll')}
          >
            {expandAll ? t('review.collapseAll') : t('review.expandAll')}
          </button>
        </div>
      </div>

      {/* Diff 内容滚动区域 */}
      <div className="dsh-review-diff-scroll">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--review-muted)', fontSize: 13, gap: 8 }}>
            <span className="dsh-gp-spinner lg" />
            <span>{t('review.diffLoading')}</span>
          </div>
        ) : error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--review-del-color)', fontSize: 13 }}>
            {error}
          </div>
        ) : diffData?.binary ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--review-muted)', fontSize: 13 }}>
            {t('review.binary')}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--review-muted)', fontSize: 13 }}>
            {t('diff.empty')}
          </div>
        ) : (
          <DiffTable
            items={displayItems}
            mode={mode}
            onExpandGap={(from) => setExpandedGaps((prev) => new Set([...prev, from]))}
            gapLabel={(hidden) => t('diff.expandLines', { count: String(hidden) })}
          />
        )}
      </div>
    </div>
  )
})
