/**
 * Regression gate: the home panel must NOT paint the coarse session-list
 * fallback while the host is still folding the real usage report.
 *
 * The fallback attributes a whole session's lifetime tokens to its
 * last-activity day, so "今天" used to flash ~692M and then snap to the true
 * ~75M once the fold landed. The panel must hold its skeleton during that
 * window instead, and only degrade to the list when the real report is
 * genuinely unreachable.
 *
 * Run: node --import <tsx> tests/usage-pending-check.mjs
 */
import assert from 'node:assert/strict'
import { HOME_POLL_MAX, homePanelData } from '../src/client/usage/data.ts'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

/** Coarse fallback: one session carrying a lifetime 692M on its last day. */
const listed = {
  tokens: 692_000_000,
  sessions: 3,
  activeDays: 3,
  calls: 40,
  hours: new Array(24).fill(0),
  model: 'listed-model',
  models: [{ id: 'listed-model', tokens: 692_000_000, sessions: 3, lastAt: now }],
  days: [{ date: new Date(now).toISOString().slice(0, 10), total: 692_000_000 }],
  entries: [{ at: now, tokens: 692_000_000, model: 'listed-model', calls: 40 }],
}

const noValue = { value: null, computing: true, error: null, loading: true, polls: 1 }

// 1. Host still folding: skeleton, never the inflated fallback number.
const pending = homePanelData(noValue, listed, 'today', 0.5)
assert.equal(pending.known, false, 'must not claim data is known while folding')
assert.equal(pending.tokens, 0, 'must not paint the 692M fallback while folding')
assert.equal(pending.sessions, null, 'session count must be unknown while folding')
assert.equal(pending.calls, null, 'calls must be unknown while folding')
assert.equal(pending.model, null, 'model must be unknown while folding')

// 2. Real report arrived: its own numbers win outright.
const real = {
  value: {
    source: 'local',
    computedAt: now,
    days: [{
      date: new Date(now).toISOString().slice(0, 10),
      input: 40_000_000, output: 5_000_000, cacheRead: 29_700_000, cacheWrite: 0,
      calls: 120,
      sessions: 4,
      sessionIds: ['a', 'b', 'c', 'd'],
      hours: new Array(24).fill(0).map((_, h) => (h === 15 ? 60 : 0)),
      models: { 'real-model': 74_700_000 },
      modelDetails: { 'real-model': { input: 40_000_000, output: 5_000_000, cacheRead: 29_700_000, cacheWrite: 0, tokens: 74_700_000 } },
    }],
    models: [{ id: 'real-model', tokens: 74_700_000 }],
    firstDay: null,
    lastDay: null,
    totals: { input: 40_000_000, output: 5_000_000, cacheRead: 29_700_000, cacheWrite: 0, calls: 120, sessions: 4, activeDays: 1 },
    model: 'real-model',
  },
  computing: false,
  error: null,
  loading: false,
  polls: 2,
}
const settled = homePanelData(real, listed, 'today', 0.5)
assert.equal(settled.known, true)
assert.equal(settled.tokens, 74_700_000, 'must show the folded 74.7M, not 692M')
assert.equal(settled.calls, 120)
assert.equal(settled.model, 'real-model')

// 3. Route unreachable (error): the list is the only data left -> degrade.
const degraded = homePanelData(
  { value: null, computing: false, error: 'unavailable', loading: false, polls: 1 },
  listed,
  'today',
  0.5,
)
assert.equal(degraded.known, true, 'an unreachable route must still render the fallback')
assert.equal(degraded.tokens, 692_000_000)

// 4. Poll budget exhausted: never strand the panel on a skeleton forever.
const exhausted = homePanelData(
  { value: null, computing: true, error: null, loading: false, polls: HOME_POLL_MAX },
  listed,
  'today',
  0.5,
)
assert.equal(exhausted.known, true, 'exhausted polling must degrade rather than hang on skeleton')

console.log('usage-pending-check: ok')
