// @vitest-environment jsdom
/**
 * Regression guard for the pagination hole in the produced-files row.
 *
 * The bug: `history.page` caps a window at 50 MESSAGES (`DEFAULT_MAX_MESSAGES`),
 * and `turn/start` is not a message, so one long Turn whose cut lands mid-Turn
 * loads a window with no `turn/start`. The assembler only runs a Definition's
 * `update` once its Context has a start Match, so `context.state` stays
 * `undefined`; the pre-fix `buildLocationData` returned null on that condition
 * and the "本次产物" row silently disappeared on reload (a live session still
 * showed it, because the live window still held the start).
 *
 * Run with the harness vitest (see the plugin's vitest.config.ts):
 *   E:/vibeCoding/deepseek-harness/node_modules/.bin/vitest run
 */
import { describe, expect, it } from 'vitest'
import {
  deliverablesDefinition,
  producedForClosing,
  type DeliverablesTurnData,
} from '../src/client/turn-deliverables.ts'

/** One durable session event, in the shape the Definition's `match` consumes. */
function at(seq: number, type: string, data: unknown) {
  return {
    seq,
    time: seq * 1_000,
    type,
    data,
    ...(type === 'tool/result' ? { surfaceOp: 'append' } : {}),
  } as never
}

function mutationCall(seq: number, callId: string, name: string, args: unknown) {
  return at(seq, 'tool/call', {
    turn: 1, step: 1, callId, name, arguments: JSON.stringify(args),
  })
}

function toolResult(seq: number, callId: string, isError = false) {
  return at(seq, 'tool/result', {
    turn: 1,
    step: 1,
    message: {
      source: { kind: 'tool', callId },
      content: [{ type: 'tool-result', callId, content: [], isError }],
    },
  })
}

const turnStart = (seq: number) => at(seq, 'turn/start', { turn: 1 })

const write = (seq: number, callId: string, path: string, content: string) =>
  mutationCall(seq, callId, 'write', { file_path: path, content })

/**
 * Replay a window through the Definition exactly as `ConversationNodeAssembler`
 * does: `start` on the start Match, `update` only while a state exists.
 */
function replay(window: readonly unknown[]): DeliverablesTurnData | undefined {
  let state: ReturnType<typeof deliverablesDefinition.start> | undefined
  const matches: Array<{ role: string; event: unknown }> = []
  for (const event of window) {
    const result = deliverablesDefinition.match(event as never)
    if (result === null) continue
    const match = { key: `deliverables:${result.id}`, event, role: result.role, location: { kind: 'turn' } }
    matches.push(match)
    if (result.role === 'start') {
      state = deliverablesDefinition.start({} as never, match as never, { previous: () => undefined } as never)
    } else if (state !== undefined) {
      state = deliverablesDefinition.update({ state, matches } as never, match as never)
    }
  }
  const context = {
    key: 'deliverables:1',
    kind: 'deliverables',
    id: '1',
    matches,
    start: matches.find((m) => m.role === 'start'),
    state,
    current: new Map(),
  }
  const data = deliverablesDefinition.buildLocationData?.(context as never, 'turn', null)
  return data === null || data === undefined ? undefined : (data.value as DeliverablesTurnData)
}

const PET = 'desktop/src/pet.js'

describe('produced-files row survives a paginated window', () => {
  it('rebuilds the row when the page cut away this Turn\'s start event', () => {
    // The real shape: tail page only — `turn/start` fell off the front.
    const data = replay([
      write(610, 'e1', PET, 'let dragging = false;\n'),
      toolResult(611, 'e1'),
      write(650, 'e2', 'desktop/src-tauri/src/lib.rs', 'pet.set_always_on_top(true);\n'),
      toolResult(651, 'e2'),
    ])

    // The precondition that made this fail: no start Match was ever seen.
    expect(data).toBeDefined()
    expect(producedForClosing(data)).toEqual([PET, 'desktop/src-tauri/src/lib.rs'])
  })

  it('keeps working when the window does contain the start event', () => {
    const data = replay([
      turnStart(5),
      write(610, 'e1', PET, 'let dragging = false;\n'),
      toolResult(611, 'e1'),
    ])

    expect(producedForClosing(data)).toEqual([PET])
  })

  it('still reports nothing when every mutation in the window failed', () => {
    const data = replay([
      write(610, 'e1', PET, 'x\n'),
      toolResult(611, 'e1', true),
    ])

    expect(producedForClosing(data)).toEqual([])
  })

  it('rebuilds applied hunks, not just the path list', () => {
    const data = replay([
      mutationCall(620, 'e1', 'edit', { file_path: PET, old_string: 'let winX = 0\n', new_string: 'let dragStart = null\n' }),
      toolResult(621, 'e1'),
    ])

    expect(data?.turnHunks.get(PET)).toEqual([
      { oldText: 'let winX = 0\n', newText: 'let dragStart = null\n' },
    ])
  })
})
