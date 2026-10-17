/**
 * Regression gate: usage folding must survive a throwing/rejecting
 * `sessionQuery.readSession` by degrading to the raw on-disk JSONL log.
 * Previously one corrupt snapshot left the report at `value: null`, so the
 * home panel showed `--` and totals collapsed.
 *
 * Run: node --import <tsx> tests/usage-fallback-check.mjs
 */
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zstdCompressSync } from 'node:zlib'
import { createUsage } from '../src/host/usage.ts'

const USER = 1_000_000

function usageEvent(time, turn, step, model, tokens) {
  return {
    type: 'assistant/message',
    time,
    data: {
      turn,
      step,
      message: { source: { model } },
      usage: {
        inputTokens: tokens,
        outputTokens: tokens,
        cacheReadTokens: tokens,
        cacheWriteTokens: 0,
      },
    },
  }
}

function writeSession(root, project, id, events) {
  const dir = join(root, 'sessions', project, id)
  mkdirSync(dir, { recursive: true })
  const lines = [{ type: 'session', version: 3, id, createdAt: events[0].time, isSeeded: false, delegationDepth: 0 }]
    .concat(events)
    .map(row => JSON.stringify(row))
    .join('\n')
  writeFileSync(join(dir, 'session.v3.jsonl.zstd'), zstdCompressSync(Buffer.from(`${lines}\n`, 'utf8')))
}

const home = mkdtempSync(join(tmpdir(), 'ui-theme-custom-usage-'))
const DAY = 24 * 60 * 60 * 1000
const base = Date.UTC(2026, 0, 5, 10, 0, 0)

// Three sessions: 2 usable, 1 corrupt (sessionQuery rejects for it).
writeSession(home, '--p1--', 'session-a', [usageEvent(base, 1, 1, 'model-x', USER)])
writeSession(home, '--p1--', 'session-b', [
  usageEvent(base + DAY, 1, 1, 'model-y', USER),
  usageEvent(base + DAY, 1, 2, 'model-y', USER),
])
writeSession(home, '--p2--', 'session-c', [usageEvent(base + 2 * DAY, 1, 1, 'model-z', USER)])

const expectedTokens = USER * 3 * 4 // input + output + cacheRead per event, 4 events

let queryCalls = 0
const ctx = {
  get(name) {
    if (name === 'dshHomePath') return () => home
    if (name === 'sessionQuery') {
      return {
        async readSession() {
          queryCalls += 1
          // Exercise the exact failure the fix targets.
          throw new Error('seeded session constructor seed must equal its inherited prefix')
        },
      }
    }
    return undefined
  },
  logger: { warn() {} },
}

const usage = createUsage(ctx)
const report = await usage.refresh()
assert.ok(report !== null, 'report must not be null when sessionQuery rejects')
assert.equal(queryCalls, 3, 'readSession should be attempted for every session first')

const buckets = report.totals
const actual = buckets.input + buckets.output + buckets.cacheRead + buckets.cacheWrite
assert.equal(actual, expectedTokens, `folded tokens must come from the raw logs (${actual} != ${expectedTokens})`)
assert.equal(buckets.calls, 4, 'every usage sample counts as one call')
assert.equal(buckets.sessions, 3, 'all three sessions are represented')
assert.equal(report.read, 3, 'all three logs were folded from disk')
assert.equal(report.failed, 0, 'a sessionQuery failure is not a discarded log')

// Negative control: the old behaviour (rethrow) must still be detectable, so
// the assertion above cannot pass vacuously.
assert.notEqual(actual, 0, 'empty report would make the assertion meaningless')

usage.dispose()
rmSync(home, { recursive: true, force: true })
console.log('usage-fallback-check: ok')
