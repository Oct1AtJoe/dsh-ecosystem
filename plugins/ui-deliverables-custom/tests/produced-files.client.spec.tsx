// @vitest-environment jsdom
/**
 * ui-deliverables browser half: the derivation contract of
 * `producedForClosing` over engine-published Turn data, the row's rendering
 * and opener wiring, and the plugin registrations' fiber-teardown removal
 * (HMR safety) against the real SlotRegistry.
 */
import { Context } from '@deepseek-ai/cordis'
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionLiveEventEntry } from '@deepseek-ai/dsh-api-session-controller/client'
import {
  ConversationEventRegistry, ConversationNodeAssembler,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {
  ConversationLocationDataStore, ConversationMatch, ConversationNodeDefinition,
  ConversationTimelineSnapshot, ConversationTurnDataMap, ConversationViewDefinition,
  ConversationViewNode, TurnLocation,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { apply as applyLocale, inject as localeInject } from '@deepseek-ai/dsh-client-locale/client'
import type { ChatFileMentions, TurnTailOwnerProps } from '@deepseek-ai/dsh-client-ui-chat/client'
import {
  fitProducedFiles, ProducedFiles, type ProducedFilesProps,
} from '../src/client/ProducedFiles.tsx'
import { ToolMutationRow } from '../src/client/ToolMutationRow.tsx'
import { diffLines } from '../src/client/DiffBlock.tsx'
import {
  basename, deliverablesDefinition, diffStats, dirname, producedFileMentions, producedForClosing, selectProducedFiles,
  type DeliverablesTurnData,
} from '../src/client/turn-deliverables.ts'
import { apply, inject } from '../src/client/index.ts'
import { apply as applyInvariant } from '../src/invariant.ts'
import { en, zh } from '../src/client/locales.ts'

/**
 * Local test doubles for the two `dsh-client-test-runtime` helpers this suite
 * needs. Inlined rather than imported: that package's published lib pulls the
 * whole harness source graph in through bare `@deepseek-ai/<pkg>/src/…`
 * specifiers, which do not resolve from this workspace. Both doubles mirror the
 * originals (`translate.ts`, `settings-scope.ts`) exactly.
 */
function makeTranslate(
  ...dicts: readonly Record<string, string>[]
): (key: string, params?: Record<string, unknown>) => string {
  return (key, params) => {
    let template = key
    for (const dict of dicts) {
      const hit = dict[key]
      if (hit !== undefined) { template = hit; break }
    }
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match)
  }
}

function stubSettingsScope<T>() {
  let snapshot = {
    status: 'loading', value: undefined, base: undefined, user: undefined,
    revision: undefined, writable: false, mode: 'host',
  } as { status: string; value: T | undefined; base: unknown; user: unknown; revision: unknown; writable: boolean; mode: string }
  const listeners = new Set<() => void>()
  const set = vi.fn(() => Promise.resolve())
  const mutate = vi.fn(() => Promise.resolve())
  const unset = vi.fn(() => Promise.resolve())
  return {
    scope: {
      getSnapshot: () => snapshot,
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
      mutate, set, unset,
    },
    set, mutate, unset,
    listenerCount: () => listeners.size,
    publish: (next: Record<string, unknown>) => {
      snapshot = { ...snapshot, ...next } as typeof snapshot
      for (const listener of [...listeners]) listener()
    },
  }
}

const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalClientWidth === undefined) {
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
  } else {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth)
  }
})

class TestTurnDataStore implements ConversationLocationDataStore<ConversationTurnDataMap> {
  private readonly values = new Map<string, unknown>()

  get<Key extends Extract<keyof ConversationTurnDataMap, string>>(
    key: Key,
  ): Readonly<ConversationTurnDataMap[Key]> | undefined {
    return this.values.get(key) as Readonly<ConversationTurnDataMap[Key]> | undefined
  }

  set<Key extends Extract<keyof ConversationTurnDataMap, string>>(
    key: Key,
    value: ConversationTurnDataMap[Key],
  ): void {
    this.values.set(key, value)
  }
}

const turnLocation = (turn: number, deliverables?: DeliverablesTurnData): TurnLocation => {
  const data = new TestTurnDataStore()
  if (deliverables !== undefined) data.set('deliverables', deliverables)
  return { turn, start: undefined, end: undefined, status: 'closed', steps: [], data }
}

const produced = (
  ...values: ReadonlyArray<readonly [seq: number, path: string]>
): DeliverablesTurnData => ({
  produced: values.map(([seq, path]) => ({ seq, path })),
  history: new Map(),
  turnHunks: new Map(),
})

function tailOwner(
  data: DeliverablesTurnData | undefined,
  seq: number,
  openFile: (path: string) => void = () => {},
  turn = 1,
): TurnTailOwnerProps {
  return { seq, openFile, turn: turnLocation(turn, data) }
}

interface TimelineSnapshot {
  readonly timeline: ConversationTimelineSnapshot
}

class TestEventDefinitions {
  entries(): readonly ConversationNodeDefinition[] { return [deliverablesDefinition] }
  fallbackEntry(): ConversationNodeDefinition | undefined { return undefined }
}

class TestViewDefinitions {
  entries(): readonly ConversationViewDefinition[] { return [timelineViewDefinition] }
}

const timelineViewDefinition: ConversationViewDefinition<ConversationViewNode, TimelineSnapshot> = {
  target: 'test',
  create: () => {
    let current: TimelineSnapshot = { timeline: { turnOrder: [], turns: new Map() } }
    return {
      empty: current,
      replace: ({ timeline }) => (current = { timeline }),
      apply: ({ timeline }) => (current = { timeline }),
    }
  },
}

function at(
  seq: number,
  type: string,
  data: unknown,
): SessionLiveEventEntry {
  return {
    type: 'event',
    event: {
      seq, time: seq * 1_000, type, data,
      ...(type === 'tool/result' ? { surfaceOp: 'append' } : {}),
    } as never,
  }
}

function matched(input: SessionLiveEventEntry, role: ConversationMatch['role']): ConversationMatch {
  return { event: input.event, role, location: { kind: 'unresolved' } }
}

/**
 * One `tool/call` in the fork's real vocabulary: the derivation reads the tool
 * name plus its raw arguments, never the call view.
 */
function call(
  seq: number,
  callId: string,
  name: string,
  args: Readonly<Record<string, unknown>>,
  turn = 1,
): SessionLiveEventEntry {
  return at(seq, 'tool/call', {
    turn, step: 1, callId, name, arguments: JSON.stringify(args),
  })
}

function result(seq: number, callId: string, isError = false, turn = 1): SessionLiveEventEntry {
  return at(seq, 'tool/result', {
    turn,
    step: 1,
    message: {
      source: { kind: 'tool', callId },
      content: [{ type: 'tool-result', callId, content: [], isError }],
    },
  })
}

/** A `write` call whose whole content is the new file body. */
function write(
  seq: number,
  callId: string,
  path: string,
  content = 'x',
  turn = 1,
): SessionLiveEventEntry {
  return call(seq, callId, 'write', { file_path: path, content }, turn)
}

/** An `edit` call replacing `old_string` with `new_string` in one file. */
function edit(
  seq: number,
  callId: string,
  path: string,
  oldString = 'old',
  newString = 'new',
  turn = 1,
): SessionLiveEventEntry {
  return call(seq, callId, 'edit', {
    file_path: path, old_string: oldString, new_string: newString,
  }, turn)
}

function assembler(entries: readonly SessionLiveEventEntry[], hasMore = false): ConversationNodeAssembler {
  const value = new ConversationNodeAssembler(new TestEventDefinitions(), new TestViewDefinitions())
  value.replaceWindow(entries, hasMore)
  value.activateTarget('test')
  value.flush()
  return value
}

function deliverablesOf(value: ConversationNodeAssembler, turn = 1): Readonly<DeliverablesTurnData> | undefined {
  const snapshot = value.snapshot('test') as TimelineSnapshot
  // The official ui-deliverables package also declares the 'deliverables'
  // projection key; this fork's richer type wins through the explicit cast.
  return snapshot.timeline.turns.get(turn)?.data.get('deliverables') as Readonly<DeliverablesTurnData> | undefined
}

describe('produced-file Turn data', () => {
  it('deduplicates paths in first-seen order and stops at the closing Assistant seq', () => {
    const data = produced(
      [3, 'out/index.html'],
      [4, 'out/app.css'],
      [4, 'out/index.html'],
      [8, 'after.txt'],
    )
    expect(producedForClosing(data, 6)).toEqual(['out/index.html', 'out/app.css'])
    expect(selectProducedFiles(tailOwner(data, 6))).toEqual([
      { path: 'out/index.html', hunks: [], totalHunks: [] },
      { path: 'out/app.css', hunks: [], totalHunks: [] },
    ])
    expect(producedForClosing(undefined)).toEqual([])
    expect(selectProducedFiles(tailOwner(undefined, 9, () => {}, 2))).toBeNull()
  })

  it('folds successful write and edit calls while ignoring reads, failures, and non-mutations', () => {
    const value = assembler([
      at(1, 'turn/start', { turn: 1 }),
      write(2, 'write', 'out/index.html'),
      result(3, 'write'),
      edit(4, 'edit', 'notes.md'),
      result(5, 'edit'),
      // A read is not a mutation, and a failed result contributes nothing.
      call(6, 'read', 'read', { file_path: 'input.txt' }),
      result(7, 'read'),
      write(8, 'failed', 'broken.txt'),
      result(9, 'failed', true),
      // A supported name with arguments that name no usable content.
      call(10, 'no-content', 'write', { file_path: 'empty.txt' }),
      result(11, 'no-content'),
    ])

    expect(producedForClosing(deliverablesOf(value))).toEqual([
      'out/index.html', 'notes.md',
    ])
  })

  it('ignores orphan results and replacement results', () => {
    const replacement = result(8, 'replacement')
    const value = assembler([
      at(1, 'turn/start', { turn: 1 }),
      result(3, 'no-call'),
      write(7, 'replacement', 'replaced.txt'),
      {
        ...replacement,
        event: {
          ...replacement.event,
          surfaceOp: { op: 'replace', start: 1, end: 1 },
        } as never,
      },
      at(9, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ])

    expect(producedForClosing(deliverablesOf(value))).toEqual([])
  })

  it('rejects an invalid start match and preserves state for an unrelated update', () => {
    const startMatch = matched(at(1, 'turn/start', { turn: 1 }), 'start')
    const emptyContext: Parameters<typeof deliverablesDefinition.start>[0] = {
      key: 'deliverables:1',
      kind: 'deliverables',
      id: '1',
      matches: [startMatch],
      start: startMatch,
      state: undefined,
      current: new Map(),
    }
    const reader: Parameters<typeof deliverablesDefinition.start>[2] = { previous: () => undefined }
    const state = deliverablesDefinition.start(emptyContext, startMatch, reader)
    const unrelated = matched(at(2, 'turn/end', { turn: 1, reason: { kind: 'completed' } }), 'update')
    const context: Parameters<typeof deliverablesDefinition.update>[0] = { ...emptyContext, state }

    expect(() => deliverablesDefinition.start(emptyContext, unrelated, reader))
      .toThrow('deliverables start requires turn/start')
    expect(deliverablesDefinition.update(context, unrelated)).toBe(state)
  })

  it('reconstructs deliverables state from recorded matches even when Turn start is cut away by pagination', () => {
    const value = assembler([
      write(10, 'late', 'history.txt'),
      result(11, 'late'),
    ], true)
    expect(producedForClosing(deliverablesOf(value))).toEqual(['history.txt'])

    // Scrolling back supplies the start Match; the row must survive the switch.
    value.prepend([at(1, 'turn/start', { turn: 1 })], false)
    value.flush()
    expect(producedForClosing(deliverablesOf(value))).toEqual(['history.txt'])
  })

  it('extends the same Turn data incrementally on live append', () => {
    const value = assembler([
      at(1, 'turn/start', { turn: 1 }),
      write(2, 'first', 'first.txt'),
      result(3, 'first'),
    ])
    const first = deliverablesOf(value)
    expect(producedForClosing(first)).toEqual(['first.txt'])

    value.append(write(4, 'second', 'second.txt'))
    value.append(result(5, 'second'))
    value.flush()
    expect(producedForClosing(deliverablesOf(value))).toEqual(['first.txt', 'second.txt'])
  })

  it('derives applied hunks from the call arguments for write and edit', () => {
    const value = assembler([
      at(1, 'turn/start', { turn: 1 }),
      write(2, 'a', 'out/a.txt', 'hello\n'),
      result(3, 'a'),
      edit(4, 'b', 'out/b.txt', 'old\n', 'new\n'),
      result(5, 'b'),
    ])
    const data = deliverablesOf(value)
    expect(producedForClosing(data)).toEqual(['out/a.txt', 'out/b.txt'])
    // A whole-file write is one new-file hunk; an edit is old-to-new.
    expect(data?.history.get('out/a.txt')).toEqual([{ oldText: null, newText: 'hello\n' }])
    expect(data?.history.get('out/b.txt')).toEqual([{ oldText: 'old\n', newText: 'new\n' }])
    // turnHunks matches history in a single-turn scenario.
    expect(data?.turnHunks.get('out/a.txt')).toEqual([{ oldText: null, newText: 'hello\n' }])
    expect(data?.turnHunks.get('out/b.txt')).toEqual([{ oldText: 'old\n', newText: 'new\n' }])
  })

  it('lists a path with no hunks when the call carries no usable change', () => {
    const value = assembler([
      at(1, 'turn/start', { turn: 1 }),
      // `write` with an empty body still names a path (the argument is a
      // string), but yields no content hunk.
      call(2, 'empty-body', 'write', { file_path: 'empty.txt', content: '' }),
      result(3, 'empty-body'),
      // An `edit` whose two sides are identical is not a mutation at all.
      edit(4, 'same', 'same.txt', 'same', 'same'),
      result(5, 'same'),
      // A read is not a mutation.
      call(6, 'read', 'read', { file_path: 'input.txt' }),
      result(7, 'read'),
    ])
    const data = deliverablesOf(value)
    // Only the empty write names a produced path; it carries no hunks.
    expect(producedForClosing(data)).toEqual(['empty.txt'])
    expect(data?.history.get('empty.txt')).toBeUndefined()
    expect(data?.history.get('same.txt')).toBeUndefined()
    expect(data?.history.get('input.txt')).toBeUndefined()
  })

  it('accumulates hunks for repeated edits of one path and chains history across turns', () => {
    const value = assembler([
      at(1, 'turn/start', { turn: 1 }),
      write(2, 'first', 'out/a.txt', 'one\n'),
      result(3, 'first'),
      at(4, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
      at(5, 'turn/start', { turn: 2 }),
      edit(6, 'second', 'out/a.txt', 'one\n', 'two\n', 2),
      result(7, 'second', false, 2),
      edit(8, 'third', 'out/a.txt', 'two\n', 'three\nfour\n', 2),
      result(9, 'third', false, 2),
      at(10, 'turn/end', { turn: 2, reason: { kind: 'completed' } }),
    ])
    const turn1 = deliverablesOf(value, 1)
    const turn2 = deliverablesOf(value, 2)
    expect(turn1?.history.get('out/a.txt')).toEqual([{ oldText: null, newText: 'one\n' }])
    // Turn 2 chains the conversation history: both its own edits append.
    expect(turn2?.history.get('out/a.txt')).toEqual([
      { oldText: null, newText: 'one\n' },
      { oldText: 'one\n', newText: 'two\n' },
      { oldText: 'two\n', newText: 'three\nfour\n' },
    ])
    // turnHunks is per-turn: turn 1 has its single write, turn 2 has only
    // the two edits made in that turn (no chaining).
    expect(turn1?.turnHunks.get('out/a.txt')).toEqual([{ oldText: null, newText: 'one\n' }])
    expect(turn2?.turnHunks.get('out/a.txt')).toEqual([
      { oldText: 'one\n', newText: 'two\n' },
      { oldText: 'two\n', newText: 'three\nfour\n' },
    ])
    expect(producedForClosing(turn2)).toEqual(['out/a.txt'])
    expect(selectProducedFiles(tailOwner(turn2, 10))).toEqual([
      {
        path: 'out/a.txt',
        hunks: turn2?.turnHunks.get('out/a.txt'),
        totalHunks: turn2?.history.get('out/a.txt'),
      },
    ])
  })
})

describe('diffStats', () => {
  it('counts only the prefix/suffix-trimmed changed lines, empty zero, trailing newline a terminator', () => {
    expect(diffStats([{ oldText: 'a\nb\n', newText: 'x\n' }])).toEqual({ added: 1, removed: 2 })
    expect(diffStats([{ oldText: null, newText: '' }])).toEqual({ added: 0, removed: 0 })
    expect(diffStats([{ oldText: 'only', newText: 'a\nb' }])).toEqual({ added: 2, removed: 1 })
    expect(diffStats([])).toEqual({ added: 0, removed: 0 })
    expect(diffStats([
      { oldText: 'x\n', newText: 'y\n' },
      { oldText: 'z\n', newText: 'w\n' },
    ])).toEqual({ added: 2, removed: 2 })
  })

  it('pairs unchanged lines away: a pure append counts as additions only', () => {
    expect(diffStats([{ oldText: 'a\nb\n', newText: 'a\nb\nc\n' }])).toEqual({ added: 1, removed: 0 })
    expect(diffStats([{ oldText: 'a\nb\nc\n', newText: 'a\nc\n' }])).toEqual({ added: 0, removed: 1 })
    expect(diffStats([{ oldText: 'a\n', newText: 'a\n' }])).toEqual({ added: 0, removed: 0 })
  })

  it('pairs context lines differing only by trailing punctuation or comma changes', () => {
    // Adding element with trailing comma added to preceding line
    expect(diffStats([{ oldText: '  "test456"\n]\n', newText: '  "test456",\n  "test232"\n]\n' }]))
      .toEqual({ added: 1, removed: 0 })
    // Deleting element with trailing comma removed from preceding line
    expect(diffStats([{ oldText: '  "test123",\n  "test456"\n]\n', newText: '  "test123"\n]\n' }]))
      .toEqual({ added: 0, removed: 1 })
    // Preserves pure punctuation-only change
    expect(diffStats([{ oldText: 'a\n', newText: 'a,\n' }])).toEqual({ added: 1, removed: 1 })
    // Preserves unchanged lines in middle of scattered edits
    expect(diffStats([{ oldText: 'a\nb\nc\n', newText: 'a\nx\nb\ny\nc\n' }])).toEqual({ added: 2, removed: 0 })
  })
})

describe('diffLines', () => {
  it('pairs removed and added rows per change site and inserts gap rows across untouched spans', () => {
    const result = diffLines('a\nb\nc\nd\ne', 'a\nB\nc\nD\ne')
    expect(result.removed).toEqual(['b', 'd'])
    expect(result.added).toEqual(['B', 'D'])
    expect(result.rows).toEqual([
      { kind: 'del', text: 'b', line: 2 },
      { kind: 'add', text: 'B', line: 2 },
      { kind: 'gap', text: '⋯' },
      { kind: 'del', text: 'd', line: 4 },
      { kind: 'add', text: 'D', line: 4 },
    ])
  })

  it('keeps single contiguous change without gap rows', () => {
    const result = diffLines('prefix\nold\nsuffix', 'prefix\nnew\nsuffix')
    expect(result.rows).toEqual([
      { kind: 'del', text: 'old', line: 2 },
      { kind: 'add', text: 'new', line: 2 },
    ])
  })

  it('supports custom startLine for absolute line numbers', () => {
    const result = diffLines('prefix\nold\nsuffix', 'prefix\nnew\nsuffix', 100)
    expect(result.rows).toEqual([
      { kind: 'del', text: 'old', line: 101 },
      { kind: 'add', text: 'new', line: 101 },
    ])
  })
})

describe('ProducedFiles row', () => {
  const t = makeTranslate(zh)
  /** Injected host-capability seats: the fork reads a boolean opener capability. */
  const capability = (
    canOpenPath: boolean | undefined,
    isLoopback = true,
  ): Pick<ProducedFilesProps, 'isLoopback' | 'useWorkspacePathOpen' | 'ensureWorkspacePathOpen'> => ({
    isLoopback,
    ensureWorkspacePathOpen: () => {},
    useWorkspacePathOpen: <T,>(selector: (value: boolean | undefined) => T): T => selector(canOpenPath),
  })

  it('selects the largest prefix using the exact remainder width', () => {
    expect(fitProducedFiles(230, 8, [70, 60, 60], [55, 55, 55, 55])).toBe(2)
    expect(fitProducedFiles(145, 8, [70, 60, 60], [55, 55, 55, 55])).toBe(1)
    expect(fitProducedFiles(300, 8, [70, 60, 60], [55, 55, 55, 55])).toBe(3)
    // A zero-width lane is a pre-layout test/hidden state, not evidence that
    // every chip overflowed; keep the bounded initial prefix until measured.
    expect(fitProducedFiles(0, 8, [70, 60], [60, 50, undefined])).toBe(2)
    expect(fitProducedFiles(128, 8, [60, 60], [70, 50, undefined])).toBe(2)
    // Candidate-specific suffix widths matter at the 10 -> 9 digit boundary.
    expect(fitProducedFiles(126, 8, [60], [70, 50])).toBe(1)
    expect(fitProducedFiles(20, 8, [60], [70, 50])).toBe(0)
  })

  it('shows all chips up to the cap in a multi-line row, opens files, and shows the folder action', () => {
    const paths = ['deep/a.html', 'b.css', 'c.ts']
      .map(path => ({ path, hunks: [], totalHunks: [] }))
    const openFile = vi.fn<(path: string) => void>()
    const view = render(
      <ProducedFiles matched={paths} openFile={openFile} {...capability(true)} t={t} />,
    )
    expect(view.getByText('本次产物')).toBeTruthy()
    const row = view.container.querySelector('[data-produced-files-row]')
    if (!(row instanceof HTMLElement)) throw new Error('produced row missing')
    // 3 chips sit exactly at the COLLAPSED_LIMIT=3 threshold, so no fold chip.
    expect(within(row).getAllByRole('button')).toHaveLength(3)
    expect(within(row).queryByText('+')).toBeNull()
    const chip = view.getByRole('button', { name: '打开 deep/a.html' })
    expect(chip.textContent).toBe('a.html')
    expect(chip.getAttribute('title')).toBe('deep/a.html')
    fireEvent.click(chip)
    expect(openFile).toHaveBeenCalledWith('deep/a.html')

    // "show in folder" appears when there are produced files and the host
    // can open paths (no longer gated on overflow).
    const showFolder = view.getByRole('button', { name: '在文件夹中显示' })
    fireEvent.click(showFolder)
    expect(openFile).toHaveBeenLastCalledWith('.')
  })

  it('folds chips beyond 3 files, expands on click, and collapses on toggle', () => {
    const paths = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts', 'g.ts']
      .map(path => ({ path, hunks: [], totalHunks: [] }))
    const view = render(
      <ProducedFiles matched={paths} openFile={() => {}} {...capability(false)} t={t} />,
    )
    const row = view.container.querySelector('[data-produced-files-row]')
    if (!(row instanceof HTMLElement)) throw new Error('produced row missing')
    // Shows first 3 chips + 1 moreChip button = 4 buttons
    expect(within(row).getAllByRole('button')).toHaveLength(4)
    const expandBtn = within(row).getByRole('button', { name: '展开其余 4 个文件' })
    expect(expandBtn.textContent).toBe('+ 4 个文件')
    expect(expandBtn.getAttribute('aria-expanded')).toBe('false')

    // Click to expand all
    fireEvent.click(expandBtn)
    expect(within(row).getAllByRole('button')).toHaveLength(8) // 7 chips + 1 collapse button
    const collapseBtn = within(row).getByRole('button', { name: '收起多余文件' })
    expect(collapseBtn.textContent).toBe('收起')
    expect(collapseBtn.getAttribute('aria-expanded')).toBe('true')

    // Click to collapse back
    fireEvent.click(collapseBtn)
    expect(within(row).getAllByRole('button')).toHaveLength(4)
    expect(within(row).getByText('+ 4 个文件')).toBeTruthy()
  })

  it('shows the conversation +/- totals next to the name and expands the change below the row', () => {
    const openFile = vi.fn<(path: string) => void>()
    const view = render(
      <ProducedFiles
        matched={[
          { path: 'out/a.ts', hunks: [{ oldText: 'one\n', newText: 'two\nthree\n' }], totalHunks: [{ oldText: 'one\n', newText: 'two\nthree\n' }] },
          { path: 'out/b.md', hunks: [], totalHunks: [] },
        ]}
        openFile={openFile}
        {...capability(false)}
        t={t}
      />,
    )
    const row = view.container.querySelector('[data-produced-files-row]')
    if (!(row instanceof HTMLElement)) throw new Error('produced row missing')
    // The changed file carries its conversation totals; the hunk-less one
    // stays a plain chip with no chevron.
    expect(within(row).getByText('+2')).toBeTruthy()
    expect(within(row).getByText('-1')).toBeTruthy()
    expect(within(row).queryByText('+0')).toBeNull()
    expect(view.queryByRole('button', { name: '展开 out/b.md 的修改内容' })).toBeNull()

    // The name still opens the file; the chevron expands the change.
    fireEvent.click(view.getByRole('button', { name: '打开 out/a.ts' }))
    expect(openFile).toHaveBeenCalledWith('out/a.ts')
    const toggle = view.getByRole('button', { name: '展开 out/a.ts 的修改内容' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    const panel = view.container.querySelector('[data-produced-diff]')
    if (!(panel instanceof HTMLElement)) throw new Error('produced diff panel missing')
    expect(within(panel).getByText('one')).toBeTruthy()
    expect(within(panel).getByText('two')).toBeTruthy()
    expect(within(panel).getByText('three')).toBeTruthy()
    // The panel is one card: a title bar carries the path (name + dimmed
    // directory), the totals, and its own collapse control; the primitive's
    // internal path header and footer stay off inside the panel.
    expect(within(panel).getByText('a.ts')).toBeTruthy()
    expect(within(panel).getByText('out')).toBeTruthy()
    expect(within(panel).getByText('+2')).toBeTruthy()
    expect(within(panel).getByText('-1')).toBeTruthy()
    expect(within(panel).queryByText('└ +2 -1 · 1 file')).toBeNull()
    fireEvent.click(within(panel).getByRole('button', { name: '打开 out/a.ts' }))
    expect(openFile).toHaveBeenLastCalledWith('out/a.ts')
    fireEvent.click(within(panel).getByRole('button', { name: '收起修改面板' }))
    expect(view.container.querySelector('[data-produced-diff]')).toBeNull()
    // Reopening through the chip: the chip's control still collapses, and the
    // panel's path header names the expanded file.
    fireEvent.click(view.getByRole('button', { name: '展开 out/a.ts 的修改内容' }))
    const collapse = view.getByRole('button', { name: '收起 out/a.ts 的修改内容' })
    expect(collapse.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(collapse)
    expect(view.container.querySelector('[data-produced-diff]')).toBeNull()
  })

  it('opens a file by name while another chip stays expanded', () => {
    const openFile = vi.fn<(path: string) => void>()
    const view = render(
      <ProducedFiles
        matched={[
          { path: 'a.ts', hunks: [{ oldText: 'x\n', newText: 'y\n' }], totalHunks: [{ oldText: 'x\n', newText: 'y\n' }] },
          { path: 'b.ts', hunks: [{ oldText: 'u\n', newText: 'v\n' }], totalHunks: [{ oldText: 'u\n', newText: 'v\n' }] },
        ]}
        openFile={openFile}
        {...capability(false)}
        t={t}
      />,
    )
    fireEvent.click(view.getByRole('button', { name: '展开 a.ts 的修改内容' }))
    expect(view.container.querySelector('[data-produced-diff]')).not.toBeNull()
    // Opening a second chip's change moves the single expanded panel.
    fireEvent.click(view.getByRole('button', { name: '展开 b.ts 的修改内容' }))
    const panel = view.container.querySelector('[data-produced-diff]')
    if (!(panel instanceof HTMLElement)) throw new Error('produced diff panel missing')
    expect(within(panel).getByText('u')).toBeTruthy()
    expect(within(panel).queryByText('x')).toBeNull()
  })

  it('shows the folder action when files exist and the host supports it, absent otherwise', () => {
    const openFile = vi.fn<(path: string) => void>()
    const matches = ['a.md', 'b.md', 'c.md', 'd.md', 'e.md', 'f.md', 'g.md']
      .map(path => ({ path, hunks: [], totalHunks: [] }))
    // Single file + capable host → folder action appears (unlike old
    // overflow-only gate).
    const view = render(
      <ProducedFiles matched={[matches[0]!]} openFile={openFile} {...capability(true)} t={t} />,
    )
    expect(view.queryByRole('button', { name: '在文件夹中显示' })).not.toBeNull()
    // Unavailable host capabilities still hide it.
    for (const unavailable of [capability(false), capability(true, false), capability(undefined)]) {
      view.rerender(<ProducedFiles matched={matches} openFile={openFile} {...unavailable} t={t} />)
      expect(view.queryByRole('button', { name: '在文件夹中显示' })).toBeNull()
    }
  })

  it('uses singular English copy when exactly one file is hidden beyond the cap', () => {
    // 4 files: 3 shown, 1 hidden beyond COLLAPSED_LIMIT (3)
    const fileCount = 4
    const view = render(
      <ProducedFiles
        matched={Array.from({ length: fileCount }, (_, i) => ({
          path: `file-${i}.md`,
          hunks: [],
          totalHunks: [],
        }))}
        openFile={() => {}}
        {...capability(false)}
        t={makeTranslate(en)}
      />,
    )
    const row = view.container.querySelector('[data-produced-files-row]')
    if (!(row instanceof HTMLElement)) throw new Error('produced row missing')
    expect(within(row).getByText('+ 1 file')).toBeTruthy()
  })
})

describe('producedFileMentions resolver', () => {
  const label = (path: string) => `打开 ${path}`

  it('resolves exact paths and unique basenames; ambiguity and unknowns stay unresolved', () => {
    const opened: string[] = []
    const resolver = producedFileMentions(
      ['out/index.html', 'a/style.css', 'b/style.css'],
      (path) => { opened.push(path) },
      label,
    )
    // Unique basename resolves to its full path; the full path rides title.
    const byBasename = resolver.resolve('index.html')
    expect(byBasename?.label).toBe('打开 out/index.html')
    expect(byBasename?.title).toBe('out/index.html')
    byBasename?.open()
    expect(opened).toEqual(['out/index.html'])
    // An exact path resolves even when its basename is ambiguous.
    const exact = resolver.resolve('a/style.css')
    expect(exact?.title).toBe('a/style.css')
    // A basename two paths share stays unresolved rather than guessing,
    // and so does a token naming nothing the turn wrote.
    expect(resolver.resolve('style.css')).toBeUndefined()
    expect(resolver.resolve('notes.md')).toBeUndefined()
    expect(basename('a\\b\\c.txt')).toBe('c.txt')
    expect(dirname('a\\b\\c.txt')).toBe('a\\b')
    expect(dirname('flat.txt')).toBe('')
  })
})

describe('package shells', () => {
  it('the invariant companion registers ownership', async () => {
    const registered: string[] = []
    const ctx = new Context()
    ctx.provide('invariants')
    ctx.set('invariants', {
      register: (pkg: string) => { registered.push(pkg); return () => {} },
    } as never)
    const dispose = await applyInvariant(ctx)
    expect(registered).toEqual(['@deepseek-ai/dsh-client-ui-deliverables-custom'])
    expect(dispose).toBeTypeOf('function')
  })
})

describe('plugin registration', () => {
  it('registers the tail entry, toolview entries, and fiber disposal removes them', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    await ctx.plugin(ConversationEventRegistry).await()
    // The owning view's child declaration, stood up by a bench root entry.
    ctx.slots.register({
      name: 'root',
      children: {
        'conversation.chat.turnTail': { kind: 'chain', scope: 'session' },
        'tool.call.toolview': { kind: 'keyed', scope: 'session' },
      },
    } as never, () => null)
    // The fork injects the boolean workspace-path opener capability, not the
    // host-description object the official package uses. `remote.session` is a
    // separate injected service name, so it must be provided on its own.
    const remoteSession = { canOpenWorkspacePath: async () => ({ ok: true, value: true }) }
    ctx.provide('remote', {
      ['$host']: { isLoopback: false },
      session: remoteSession,
    } as never)
    ctx.provide('remote.session', remoteSession as never)
    // The plugin's inject list also requires the conversation service face.
    ctx.provide('uiConversation', { events: { register: () => () => {} } } as never)
    // ui-theme's Appearance row binds a durable scope through these two.
    ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
    await ctx.plugin({ inject: localeInject, apply: applyLocale }).await()

    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const [entry] = ctx.slots.entries('conversation.chat.turnTail')
    expect(entry).toBeDefined()
    expect(entry?.inject?.()).toMatchObject({ isLoopback: false })

    const toolEntries = ctx.slots.entries('tool.call.toolview')
    expect(toolEntries.map(e => e.options.key)).toEqual(['edit', 'write'])
    expect(toolEntries[0]?.options.priority).toBe(-5)
    expect(toolEntries[1]?.options.priority).toBe(-5)

    // The prose face is live while the plugin is: a produced turn yields a
    // resolver whose matches open through the owner-supplied opener.
    const opened: string[] = []
    const owner = tailOwner(
      produced([2, 'site/report.html']),
      3,
      (path) => { opened.push(path) },
    )
    const service = (ctx as unknown as { get(name: string): ChatFileMentions | undefined }).get('chatFileMentions')
    const mentions = service?.forClosing(owner)
    mentions?.resolve('report.html')?.open()
    expect(opened).toEqual(['site/report.html'])
    // A turn that produced nothing yields no vocabulary at all.
    expect(service?.forClosing(tailOwner(undefined, 2))).toBeUndefined()

    await fiber.dispose()
    expect(ctx.slots.entries('conversation.chat.turnTail')).toHaveLength(0)
    expect(ctx.slots.entries('tool.call.toolview')).toHaveLength(0)
    // Fiber teardown retracts the service: the consumer's ctx.get sees the off state.
    expect((ctx as unknown as { get(name: string): unknown }).get('chatFileMentions')).toBeUndefined()
  })
})

describe('ToolMutationRow', () => {
  it('renders accurate diffStat and toggles expansion with intelligent DiffBlock', () => {
    const openFile = vi.fn()
    const view = render(
      <ToolMutationRow
        callId="test-call-1"
        toolName="edit"
        block={{
          kind: 'tool-result',
          isError: false,
          callId: 'test-call-1',
          // A settled call carries its arguments under `block.call`.
          call: {
            argsRaw: JSON.stringify({
              file_path: 'src/config.json',
              old_string: '  "test456"\n]',
              new_string: '  "test456",\n  "test232"\n]',
            }),
          },
          meta: {
            // Simulated native meta.diffs with redundant context lines.
            diffs: [{
              path: 'src/config.json',
              oldText: '[\n  "test123",\n  "test456"\n]',
              newText: '[\n  "test123",\n  "test456",\n  "test232"\n]',
            }],
          },
        }}
        openFile={openFile}
        // The component renders `t('tool.title.edit')`; pass a dictionary that
        // carries it so the title resolves to real copy rather than the key.
        t={makeTranslate({ 'tool.title.edit': '编辑', 'tool.title.write': '写入', 'row.inspect': '查看' }) as never}
      />,
    )

    // Instead of native DSH's duplicate "+5 -4", it calculates "+1 -0".
    expect(view.getByText('+1 -0')).toBeTruthy()

    // The file link opens the file via its title.
    const link = view.getByTitle('src/config.json')
    fireEvent.click(link)
    expect(openFile).toHaveBeenCalledWith('src/config.json')

    // Expanding reveals only the changed line, not the unchanged context.
    fireEvent.click(view.getByText('编辑'))
    expect(view.getByText('"test232"')).toBeTruthy()
    expect(view.queryByText('"test123"')).toBeNull()
  })
})
