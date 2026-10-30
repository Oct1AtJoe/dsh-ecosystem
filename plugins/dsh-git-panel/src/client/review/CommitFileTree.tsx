/**
 * 提交审查：左侧修改文件树（对齐 dsh-git-review 的搜索过滤、目录层级折叠、增减行数、状态图标）。
 * @module dsh-git-panel/client/review/CommitFileTree
 */

import { memo, useMemo, useState } from 'react'
import type { CommitFileItem } from '../../core/types.ts'
import { useT } from '../i18n.ts'
import { icon } from '../icons.tsx'

interface TreeNode {
  name: string
  fullPath: string
  isDir: boolean
  file?: CommitFileItem
  children: TreeNode[]
  totalFiles: number
}

function buildTree(files: CommitFileItem[]): TreeNode[] {
  const root: TreeNode = { name: '', fullPath: '', isDir: true, children: [], totalFiles: 0 }

  for (const file of files) {
    const parts = file.path.split('/')
    let current = root
    let accumulatedPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part
      const isLast = i === parts.length - 1

      let child = current.children.find((c) => c.name === part)
      if (!child) {
        child = {
          name: part,
          fullPath: accumulatedPath,
          isDir: !isLast,
          file: isLast ? file : undefined,
          children: [],
          totalFiles: 0,
        }
        current.children.push(child)
      }
      current = child
    }
  }

  function countAndSort(node: TreeNode): number {
    if (!node.isDir) return 1
    let sum = 0
    for (const child of node.children) {
      sum += countAndSort(child)
    }
    node.totalFiles = sum
    node.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return sum
  }

  countAndSort(root)
  return root.children
}

/** 文件类型彩色徽标（对齐附图中的 vu、js、ts 等样式）。 */
function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  let label = ext.slice(0, 2)
  let bg = 'rgba(128,128,128,0.14)'
  let color = 'var(--review-muted)'

  if (ext === 'vue') { label = 'vu'; bg = 'rgba(65, 184, 131, 0.16)'; color = '#41b883' }
  else if (ext === 'ts' || ext === 'tsx') { label = 'ts'; bg = 'rgba(49, 120, 198, 0.16)'; color = '#3178c6' }
  else if (ext === 'js' || ext === 'jsx') { label = 'js'; bg = 'rgba(229, 160, 13, 0.16)'; color = '#e5a00d' }
  else if (ext === 'json') { label = '{}'; bg = 'rgba(133, 234, 45, 0.16)'; color = '#70c922' }
  else if (ext === 'css' || ext === 'scss') { label = '#'; bg = 'rgba(66, 165, 245, 0.16)'; color = '#42a5f5' }
  else if (ext === 'md') { label = 'md'; bg = 'rgba(171, 71, 188, 0.16)'; color = '#ab47bc' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 15,
        height: 15,
        fontSize: 9,
        fontWeight: 700,
        borderRadius: 3,
        color,
        background: bg,
        flexShrink: 0,
        textTransform: 'lowercase',
      }}
    >
      {label}
    </span>
  )
}

function statusBadge(status: string) {
  const s = status.toUpperCase().slice(0, 1)
  let cls = 'dsh-review-badge-m'
  if (s === 'A') cls = 'dsh-review-badge-a'
  else if (s === 'D') cls = 'dsh-review-badge-d'
  else if (s === 'R') cls = 'dsh-review-badge-r'

  return (
    <span className={`dsh-review-badge ${cls}`} title={`Status: ${status}`}>
      {s || 'M'}
    </span>
  )
}

interface CommitFileTreeProps {
  files: CommitFileItem[]
  selectedPath: string | null
  onSelectFile: (file: CommitFileItem) => void
}

export const CommitFileTree = memo(function CommitFileTree(props: CommitFileTreeProps) {
  const { files, selectedPath, onSelectFile } = props
  const t = useT()
  const [filterText, setFilterText] = useState('')
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(() => new Set())

  const filteredFiles = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.path.toLowerCase().includes(q))
  }, [files, filterText])

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles])

  const toggleDir = (dirPath: string) => {
    setCollapsedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }

  function renderNode(node: TreeNode, depth: number) {
    if (node.isDir) {
      const isCollapsed = collapsedDirs.has(node.fullPath)
      return (
        <div key={node.fullPath} style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            type="button"
            onClick={() => toggleDir(node.fullPath)}
            className="dsh-review-dir-row"
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--review-muted)',
                fontSize: 11,
                transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.12s ease',
                width: 10,
                flexShrink: 0,
              }}
            >
              ↓
            </span>
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.name}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--review-muted)', marginLeft: 3 }}>
              {node.totalFiles}
            </span>
          </button>
          {!isCollapsed && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    const isSelected = selectedPath === node.fullPath
    const f = node.file!
    return (
      <button
        type="button"
        key={node.fullPath}
        onClick={() => onSelectFile(f)}
        className={`dsh-review-file-row${isSelected ? ' active' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        title={f.path}
      >
        {fileIcon(node.name)}
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {node.name}
        </span>
        {(f.added > 0 || f.deleted > 0) && (
          <span className="dsh-review-delta">
            {f.added > 0 && <span className="dsh-review-delta-add">+{f.added}</span>}
            {f.deleted > 0 && <span className="dsh-review-delta-del">-{f.deleted}</span>}
          </span>
        )}
        {statusBadge(f.status)}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 180 }}>
      {/* 搜索框 */}
      <div className="dsh-review-tree-search">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 7, color: 'var(--review-muted)', display: 'flex', pointerEvents: 'none' }}>
            {icon('search', 11)}
          </span>
          <input
            type="text"
            value={filterText}
            placeholder={t('review.filterFiles')}
            onChange={(e) => setFilterText(e.target.value)}
            className="dsh-review-tree-input"
          />
          {filterText && (
            <button
              type="button"
              onClick={() => setFilterText('')}
              style={{
                position: 'absolute',
                right: 4,
                border: 'none',
                background: 'transparent',
                color: 'var(--review-muted)',
                cursor: 'pointer',
                display: 'flex',
                padding: 2,
              }}
            >
              {icon('close', 10)}
            </button>
          )}
        </div>
      </div>

      {/* 树形列表 */}
      <div className="dsh-review-tree-scroll">
        {tree.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--review-muted)', fontSize: 12 }}>
            {filterText ? t('graph.filter.empty') : t('diff.empty')}
          </div>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  )
})
