export interface UsageDayModelDetail {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  tokens: number
}

export interface UsageDay {
  date: string
  input?: number
  output?: number
  cacheRead?: number
  cacheWrite?: number
  calls?: number
  sessions?: number
  sessionIds?: string[]
  models?: Record<string, number> | undefined
  modelDetails?: Record<string, UsageDayModelDetail> | undefined
  hours?: number[] | undefined
  total?: number
}

export interface UsageTotals {
  input?: number
  output?: number
  cacheRead?: number
  cacheWrite?: number
  calls?: number
  sessions?: number
  activeDays?: number
  total?: number
}

export interface UsageModel {
  id: string
  input?: number
  output?: number
  cacheRead?: number
  cacheWrite?: number
  tokens?: number
  sessions?: number | undefined
  lastAt?: number | undefined
}

export interface UsageReport {
  source: string
  computedAt: number
  days: UsageDay[]
  models: UsageModel[]
  firstDay: string | null
  lastDay: string | null
  hours?: number[] | undefined
  totals: UsageTotals
  model?: string | undefined
}

export interface UsageAnswer {
  ok: boolean
  value?: UsageReport
  computing?: boolean
  error?: string
}

export interface HomeUsageState {
  value: UsageReport | null
  computing: boolean
  error: string | null
  loading: boolean
  polls: number
}

export interface ListedModel {
  id: string
  tokens: number
  sessions: number
  lastAt: number
}

export interface ListSummary {
  tokens: number
  sessions: number
  activeDays: number
  calls?: number | undefined
  hours?: number[] | undefined
  model: string | null
  models: ListedModel[]
  days: { date: string; total: number }[]
  entries: { at: number; tokens: number; model: string | null; calls?: number | undefined }[]
}

export interface HeatCell {
  date: string
  tokens: number
  messages: number | null
  level: number
}

export interface HomeModel {
  id: string
  input?: number | undefined
  output?: number | undefined
  cacheRead?: number | undefined
  cacheWrite?: number | undefined
  tokens: number
  sessions?: number | undefined
  lastAt?: number | undefined
}
