/**
 * 提交审查：顶部提交信息（对齐 dsh-git-review 的主题、统计徽标、展开详情网格）。
 * @module dsh-git-panel/client/review/CommitHeader
 */

import { memo, useState } from 'react'
import type { CommitDetail } from '../../core/types.ts'
import { useT } from '../i18n.ts'
import { icon } from '../icons.tsx'

interface CommitHeaderProps {
  detail: CommitDetail
  onBack?: () => void
}

export const CommitHeader = memo(function CommitHeader(props: CommitHeaderProps) {
  const { detail, onBack } = props
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyHash = () => {
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(detail.sha)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="dsh-review-header">
      {/* 顶栏：返回图谱 + 展开箭头 + 描述标签 + 主题 + 右侧统计 */}
      <div className="dsh-review-header-top">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="dsh-review-diff-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={t('review.backToGraph')}
          >
            ← {t('review.backToGraph')}
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="dsh-review-toggle"
          title={expanded ? '收起详情' : '展开详情'}
          aria-expanded={expanded}
        >
          <span className={`dsh-review-toggle-icon${expanded ? ' dsh-review-toggle-open' : ''}`}>
            {icon('arrowRight', 11)}
          </span>
        </button>

        <span className="dsh-review-label">
          {t('review.description')}
        </span>

        <span className="dsh-review-subject" title={detail.subject}>
          {detail.subject}
        </span>

        {/* 右侧统计信息徽标 */}
        <div className="dsh-review-stats">
          <span className="dsh-review-stat-add">
            +{detail.totals.added}
          </span>
          <span className="dsh-review-stat-del">
            -{detail.totals.deleted}
          </span>
          <span className="dsh-review-stat-count">
            · {t('review.filesCount', { count: String(detail.totals.fileCount) })}
          </span>
        </div>
      </div>

      {/* 展开的提交详情网格 */}
      {expanded && (
        <div className="dsh-review-info-grid">
          {detail.body && (
            <div
              style={{
                gridColumn: '1 / -1',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: '4px 0 6px 0',
                borderBottom: '1px solid var(--review-border)',
                lineHeight: 1.5,
              }}
            >
              {detail.body}
            </div>
          )}

          <span style={{ color: 'var(--review-muted)' }}>{t('review.commit')}:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--ds-font-family-code, monospace)' }}>{detail.sha}</span>
            <button
              type="button"
              onClick={copyHash}
              className="dsh-review-diff-btn"
              style={{ padding: '1px 6px' }}
            >
              {copied ? t('graph.menu.copyHash.done') : t('graph.menu.copyHash')}
            </button>
          </div>

          <span style={{ color: 'var(--review-muted)' }}>{t('review.author')}:</span>
          <span>
            {detail.authorName} {detail.authorEmail ? `<${detail.authorEmail}>` : ''}
          </span>

          <span style={{ color: 'var(--review-muted)' }}>{t('review.date')}:</span>
          <span>{detail.date}</span>

          {detail.parents.length > 0 && (
            <>
              <span style={{ color: 'var(--review-muted)' }}>{t('review.parents')}:</span>
              <span style={{ fontFamily: 'var(--ds-font-family-code, monospace)' }}>
                {detail.parents.map((p) => p.slice(0, 7)).join(', ')}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
})
