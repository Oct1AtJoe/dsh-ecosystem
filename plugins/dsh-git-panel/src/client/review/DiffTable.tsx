/**
 * 共用的 Diff 表格渲染层（双列 4 栏 Grid / 单列 / 斜线纹 / 折叠条）。
 *
 * 抽取理由：提交审查（CommitDiffPanel）与工作区变更（GitDiffView）原本各写了一套
 * 行渲染，视觉上明显不一致——图谱页是 44px 独立行号列 + 4 栏 Grid + 对侧空位斜线纹 +
 * 「··· 展开 N 行」折叠条，变更页是 flex 拼接。这里把**展示层**统一，两个调用方
 * 各自保留自己的取数、工具栏与编辑/冲突能力。
 *
 * 纯展示组件：不取数、不管模式切换，只接收算好的行与折叠态。
 * @module dsh-git-panel/client/review/DiffTable
 */

import { memo } from 'react'
import type { DiffRow } from '../diff.ts'

/** 折叠上下文行数：与调用方共用同一常量语义。 */
export const DIFF_CONTEXT_LINES = 3

/** 一行或一段被折叠的未改动区域。 */
export interface DiffDisplayItem {
  kind: 'row' | 'gap'
  row?: DiffRow
  from?: number
  to?: number
  key: string
}

/**
 * 按上下文行数折叠未改动区域。
 * @param rows - 行级差异。
 * @param expanded - 已展开的区块起始下标集合。
 * @param expandAll - 是否全部展开。
 * @returns 待渲染的展示项。
 */
export function buildDiffDisplay(
  rows: readonly DiffRow[],
  expanded: ReadonlySet<number>,
  expandAll = false,
): DiffDisplayItem[] {
  if (expandAll) return rows.map((row, index) => ({ kind: 'row', row, key: `r${index}` }))

  const items: DiffDisplayItem[] = []
  let index = 0
  while (index < rows.length) {
    const row = rows[index]
    if (row === undefined) break
    if (row.kind !== 'equal') {
      items.push({ kind: 'row', row, key: `r${index}` })
      index += 1
      continue
    }
    let end = index
    while (end < rows.length && rows[end]?.kind === 'equal') end += 1
    const count = end - index
    if (count <= DIFF_CONTEXT_LINES * 2 + 1 || expanded.has(index)) {
      for (let at = index; at < end; at += 1) {
        const held = rows[at]
        if (held !== undefined) items.push({ kind: 'row', row: held, key: `r${at}` })
      }
    } else {
      for (let at = index; at < index + DIFF_CONTEXT_LINES; at += 1) {
        const held = rows[at]
        if (held !== undefined) items.push({ kind: 'row', row: held, key: `r${at}` })
      }
      items.push({ kind: 'gap', from: index + DIFF_CONTEXT_LINES, to: end - DIFF_CONTEXT_LINES, key: `g${index}` })
      for (let at = end - DIFF_CONTEXT_LINES; at < end; at += 1) {
        const held = rows[at]
        if (held !== undefined) items.push({ kind: 'row', row: held, key: `r${at}` })
      }
    }
    index = end
  }
  return items
}

export interface DiffTableProps {
  /** 已折叠/展开的展示项。 */
  items: readonly DiffDisplayItem[]
  mode: 'split' | 'unified'
  /** 折叠条点击：参数是该区块在 rows 里的起始下标（已减去上下文行数）。 */
  onExpandGap: (from: number) => void
  /** 折叠条文案。 */
  gapLabel: (hidden: number) => string
  /** 字号（px）；缺省走样式表。 */
  fontSize?: number
  /** 是否保留折行（GitDiffView 的「自动换行」开关）。 */
  wrap?: boolean
}

/**
 * Diff 表格：左侧工作区/基准、右侧对照，双列 4 栏或单列。
 */
export const DiffTable = memo(function DiffTable(props: DiffTableProps) {
  const { items, mode, onExpandGap, gapLabel, fontSize, wrap = true } = props
  const style = fontSize === undefined ? undefined : { fontSize: `${fontSize}px` }

  return (
    <div className={`dsh-review-table${wrap ? ' wrap' : ''}`} style={style}>
      {items.map((item) => {
        if (item.kind === 'gap') {
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => onExpandGap((item.from ?? 0) - DIFF_CONTEXT_LINES)}
              className="dsh-review-gap-bar"
            >
              {gapLabel((item.to ?? 0) - (item.from ?? 0))}
            </button>
          )
        }

        const row = item.row!
        if (mode === 'unified') {
          const isIns = row.kind === 'ins'
          const isDel = row.kind === 'del'
          const num = isDel ? row.left?.num : row.right?.num ?? row.left?.num
          const text = isDel ? row.left?.text : row.right?.text ?? row.left?.text
          const rowCls = isIns ? ' dsh-review-row-u-add' : isDel ? ' dsh-review-row-u-del' : ''
          return (
            <div key={item.key} className={`dsh-review-row-u${rowCls}`}>
              <span className="dsh-review-cell-no-u">{num ?? ''}</span>
              <span className="dsh-review-cell-txt">{text ?? ''}</span>
            </div>
          )
        }

        const isAdd = row.kind === 'ins'
        const isDel = row.kind === 'del'
        const isPair = row.kind === 'change'
        const rowCls = isAdd ? ' dsh-review-row-add' : isDel ? ' dsh-review-row-del' : isPair ? ' dsh-review-row-pair' : ''
        const leftHatched = row.left === undefined
        const rightHatched = row.right === undefined

        return (
          <div key={item.key} className={`dsh-review-row${rowCls}`}>
            <span className={`dsh-review-cell-no${leftHatched ? ' dsh-review-hatched' : ''}`}>
              {row.left ? row.left.num : ''}
            </span>
            <span className={`dsh-review-cell-txt${leftHatched ? ' dsh-review-hatched' : ''}`}>
              {row.left ? row.left.text : ''}
            </span>
            <span className={`dsh-review-cell-no${rightHatched ? ' dsh-review-hatched' : ''}`}>
              {row.right ? row.right.num : ''}
            </span>
            <span className={`dsh-review-cell-txt${rightHatched ? ' dsh-review-hatched' : ''}`}>
              {row.right ? row.right.text : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
})
