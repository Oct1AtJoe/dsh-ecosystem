import * as React from 'react'
import {
  HOME_RANGES,
  homePanelData,
  type createHomeUsage,
} from './data.ts'
import { ModelsView } from './models.tsx'
import { OverviewView } from './overview.tsx'

export interface HomeUsagePanelProps {
  usage: ReturnType<typeof createHomeUsage>
  bookPick?: number
  isHero?: boolean
  layout?: string
}

function checkHeroPhase(): boolean {
  if (typeof document === 'undefined') return false
  return document.querySelector('[data-phase="hero"]') !== null
    || document.querySelector('[class*="_composerHero"]') !== null
    || document.querySelector('[class*="composerHero"]') !== null
    || document.querySelector('[class*="_headline"]') !== null
}

function checkLayout(): string {
  try {
    return localStorage.getItem('dsh-home-layout') || 'studio'
  } catch {
    return 'studio'
  }
}

export function HomeUsagePanel({
  usage,
  bookPick = 0.5,
  isHero,
  layout,
}: HomeUsagePanelProps) {
  const [, bump] = React.useState(0)
  const [tab, setTab] = React.useState<'overview' | 'models'>('overview')
  const [range, setRange] = React.useState<string>('all')

  React.useEffect(() => {
    return usage.subscribe(() => {
      bump(c => c + 1)
    })
  }, [usage])

  const effectiveLayout = layout ?? checkLayout()
  const effectiveHero = isHero ?? checkHeroPhase()

  if (effectiveLayout !== 'studio' || !effectiveHero) {
    return null
  }

  const state = usage.state()
  const data = homePanelData(state, usage.list(), range, bookPick)

  return (
    <section
      className="dsh-theme-home-panel"
      data-computing={state.computing ? '' : undefined}
      aria-busy={state.computing || !data.known ? 'true' : 'false'}
    >
      <div className="dsh-theme-home-panel-head">
        <div className="dsh-theme-home-tabs">
          <button
            type="button"
            className="dsh-theme-home-tab"
            data-active={tab === 'overview' ? '' : undefined}
            aria-pressed={tab === 'overview'}
            onClick={() => setTab('overview')}
          >
            概览
          </button>
          <button
            type="button"
            className="dsh-theme-home-tab"
            data-active={tab === 'models' ? '' : undefined}
            aria-pressed={tab === 'models'}
            onClick={() => setTab('models')}
          >
            模型
          </button>
        </div>

        <div className="dsh-theme-home-panel-side">
          <div className="dsh-theme-home-ranges">
            {HOME_RANGES.map(item => (
              <button
                key={item.id}
                type="button"
                className="dsh-theme-home-range"
                data-active={range === item.id ? '' : undefined}
                aria-pressed={range === item.id}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'models' ? (
        <ModelsView data={data} />
      ) : (
        <OverviewView data={data} />
      )}
    </section>
  )
}
