import * as React from 'react'
import {
  HOME_MODEL_ROWS,
  formatCompactTokens,
  formatHomeCount,
  homeShortDate,
} from './data.ts'
import type { HomePanel } from './data.ts'
import type { HomeModel } from './types.ts'

const RANK_LAST = 7

function share(part: number, whole: number): string {
  return whole > 0 ? `${((Math.round((part / whole) * 1000) / 10)).toFixed(1)}%` : '—'
}

function axisMax(peak: number): number {
  if (!(peak > 0)) return 0
  const magnitude = Math.pow(10, Math.floor(Math.log(peak) / Math.LN10))
  const scaled = peak / magnitude
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10
  return step * magnitude
}

function sides(entry: HomeModel) {
  return {
    input: (entry.input || 0) + (entry.cacheRead || 0) + (entry.cacheWrite || 0),
    output: entry.output || 0,
  }
}

function hasSplit(entry: HomeModel): boolean {
  return entry.input !== undefined || entry.output !== undefined
    || entry.cacheRead !== undefined || entry.cacheWrite !== undefined
}

export function ModelChart({
  columns,
  rankOf,
  skeleton,
}: {
  columns: HomePanel['modelDays']
  rankOf: Record<string, number>
  skeleton: boolean
}) {
  let peak = 0
  const list = columns || []
  for (let c = 0; c < list.length; c++) {
    const col = list[c]
    if (!col) continue
    let total = 0
    const models = col.models
    for (const id in models) total += models[id] ?? 0
    if (total > peak) peak = total
  }
  const top = axisMax(peak)
  const ticks = [1, 0.75, 0.5, 0.25, 0]

  return (
    <div className="dsh-theme-home-chart" data-skeleton={skeleton ? '' : undefined}>
      <div className="dsh-theme-home-chart-plot">
        {ticks.map(at => (
          <span
            key={at}
            className="dsh-theme-home-chart-tick"
            style={{ bottom: `${at * 100}%` }}
          >
            {skeleton || top === 0 ? '' : formatCompactTokens(top * at)}
          </span>
        ))}
        <div className="dsh-theme-home-chart-bars">
          {list.map(column => {
            if (!column) return null
            let dayTotal = 0
            const stack: { id: string; tokens: number; rank: number }[] = []
            const models = column.models
            for (const id in models) {
              const tokens = models[id] ?? 0
              dayTotal += tokens
              const rank = rankOf[id]
              stack.push({ id, tokens, rank: rank === undefined ? Number.MAX_VALUE : rank })
            }
            stack.sort((a, b) => a.rank - b.rank)
            return (
              <span
                key={column.date}
                className="dsh-theme-home-chart-col"
                title={`${homeShortDate(column.date)} · ${formatCompactTokens(dayTotal)}`}
                style={{ height: `${top > 0 ? (dayTotal / top) * 100 : 0}%` }}
              >
                {stack.map(slice => (
                  <span
                    key={slice.id}
                    className="dsh-theme-home-chart-seg"
                    data-rank={Math.min(slice.rank, RANK_LAST)}
                    style={{ height: `${dayTotal > 0 ? (slice.tokens / dayTotal) * 100 : 0}%` }}
                  />
                ))}
              </span>
            )
          })}
        </div>
      </div>
      <div className="dsh-theme-home-chart-axis">
        {list.map((column, index) => {
          if (!column) return null
          const labelled = index % 3 === 0
          return (
            <span key={column.date} className="dsh-theme-home-chart-label">
              {labelled ? homeShortDate(column.date) : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function ModelsView({ data }: { data: HomePanel }) {
  const [expanded, setExpanded] = React.useState(false)
  const models = data.models
  const columns = data.modelDays
  const skeleton = !data.known

  if (!models || models.length === 0) {
    if (data.listed !== null || !skeleton) {
      return <div className="dsh-theme-home-models-empty">暂无模型用量数据</div>
    }
    return (
      <>
        <ModelChart columns={null} rankOf={{}} skeleton={true} />
        <div className="dsh-theme-home-models" data-skeleton="">
          {[0, 1, 2].map(index => (
            <div key={index} className="dsh-theme-home-model">
              <span className="dsh-theme-home-model-swatch" />
              <span className="dsh-theme-home-model-name" />
              <span className="dsh-theme-home-model-split" />
              <span className="dsh-theme-home-model-share" />
            </div>
          ))}
        </div>
      </>
    )
  }

  let total = 0
  const rankOf: Record<string, number> = {}
  for (let i = 0; i < models.length; i++) {
    const item = models[i]
    if (!item) continue
    total += item.tokens
    rankOf[item.id] = i
  }

  const shown = expanded ? models : models.slice(0, HOME_MODEL_ROWS)
  const hidden = models.length - shown.length

  return (
    <>
      {columns === null && !skeleton ? null : (
        <ModelChart columns={columns} rankOf={rankOf} skeleton={skeleton} />
      )}
      <div className="dsh-theme-home-models">
        <div className="dsh-theme-home-models-list" data-expanded={expanded ? '' : undefined}>
          {shown.map((entry, rank) => {
            if (!entry) return null
            const parts = sides(entry)
            return (
              <div
                key={entry.id}
                className="dsh-theme-home-model"
                title={
                  entry.sessions === undefined
                    ? entry.id
                    : `${entry.id} · ${formatHomeCount(entry.sessions)} 会话`
                }
              >
                <span
                  className="dsh-theme-home-model-swatch"
                  data-rank={Math.min(rank, RANK_LAST)}
                />
                <span className="dsh-theme-home-model-name">{entry.id}</span>
                <span className="dsh-theme-home-model-split">
                  {hasSplit(entry)
                    ? `${formatCompactTokens(parts.input)} 入 · ${formatCompactTokens(parts.output)} 出`
                    : formatCompactTokens(entry.tokens)}
                </span>
                <span className="dsh-theme-home-model-share">{share(entry.tokens, total)}</span>
              </div>
            )
          })}
        </div>
        {models.length <= HOME_MODEL_ROWS ? null : (
          <button
            type="button"
            className="dsh-theme-home-models-more"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : `展开更多 ${hidden} 个模型`}
          </button>
        )}
      </div>
    </>
  )
}
