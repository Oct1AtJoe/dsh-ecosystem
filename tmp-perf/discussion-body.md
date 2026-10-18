## Summary

Switching to a long session shows "载入历史" (loading history) for several seconds. The opening
`session/follow` snapshot is far larger than expected, and the client must parse, assemble, and
render all of it before `openState` becomes `open`.

Measured on a 6.66 MB v3 log (24.6 MB raw JSON, 8024 events): the opening snapshot carried
**450 records / 1.09 MB**, and cold open took **379 ms** on the host.

## Root cause

`HISTORY_PAGE_OPTIONS` in `packages/api/session-controller/src/client/sessions/session.ts`:

```ts
const HISTORY_PAGE_OPTIONS = { maxMessages: 500, turnWindow: { minMessages: 50, minTurns: 2 } }
```

`turnWindow` dominates `maxMessages`. `paginate()` in
`packages/api/session-controller/src/history.ts` walks backwards and stops at a `turn/start`
once both minima are met — so a single long turn returns **everything in that turn**,
regardless of `maxMessages`. On the measured session, the most recent turn alone contained
450 events, so `maxMessages` never triggered.

Reducing `maxMessages` alone does **not** help:

| request | records | payload |
|---|---|---|
| `maxMessages: 500` + `turnWindow {50, 2}` (current) | 450 | 1.09 MB |
| `maxMessages: 120` + `turnWindow {50, 2}` | 450 | 1.09 MB |
| `maxMessages: 120`, no `turnWindow` | 597 | 1.27 MB |
| `maxMessages: 80`, no `turnWindow` | 407 | 0.89 MB |
| `maxMessages: 50`, no `turnWindow` | 259 | 0.56 MB |
| `maxMessages: 30`, no `turnWindow` | 156 | 0.35 MB |

The client contract already permits a window that begins mid-turn
(`packages/api/session-controller/src/client/contract/session.ts:123`:
"partial Turn at the window's beginning").

## Proposed change

```ts
const HISTORY_PAGE_OPTIONS = { maxMessages: 30 }

const JUMP_PAGE_OPTIONS = {
  maxMessages: JUMP_PAGE_MESSAGES,
  turnWindow: { minMessages: JUMP_PAGE_MESSAGES, minTurns: 2 },
}
```

`JUMP_PAGE_OPTIONS` must restate `maxMessages` explicitly: it previously spread
`HISTORY_PAGE_OPTIONS`, and `minMessages: 200 > maxMessages` is rejected by
`validateHistoryWindow()` in `history.ts`.

## Measured effect

Same three sessions, cold / warm / live:

| session | records before → after | payload before → after |
|---|---|---|
| b724f314 (6.66 MB v3) | 450 → 156 | 1.09 MB → 0.35 MB (−68%) |
| c7912d98 (5.17 MB v3) | 312 → 151 | 0.51 MB → 0.23 MB (−56%) |
| 56d07a1c (6.24 MB v3, unmigrated) | 403 → 169 | 1.37 MB → 0.73 MB (−47%) |

Host cold-read time is unchanged (379 → 418 ms), which is expected: the cold path still
decodes the full log. What shrinks is the work the client does between receiving the snapshot
and flipping `openState` to `open` — `replaceWindow()` rebuilds every context, then ChatFlow
renders all rows without virtualization.

## Secondary observations (not in the patch)

- Cold read decodes and `JSON.parse`s the entire log to serve one tail page
  (`packages/session-query/session-query/src/cold-read.ts:37`,
  `packages/session/session-persistence-jsonl/src/index.ts:992`). ~250 ms for a 24 MB log.
- Legacy v3 sessions migrate synchronously on first open: 1955 ms measured, including two
  full-corpus header scans (607 files × ~0.3 ms each) in
  `prepareStoredMigration()`.
- `COLD_LOG_MEMO_MAX_ENTRIES = 2` and `SESSION_QUERY_DEFAULT_PREPARED_SESSION_CACHE_SIZE = 5`
  are small enough that switching among several long sessions repeatedly pays the cold cost.

## Trade-off

Fewer messages on first paint: users may need one "加载更早" click. 30 messages was chosen as
the balance point; 50 is a more conservative alternative.

Happy to test a different value if the maintainers prefer another default.
