import WebSocket from 'ws'

const COOKIE = process.env.DSH_COOKIE
if (!COOKIE) { console.error('set DSH_COOKIE'); process.exit(2) }

const sessions = process.argv.slice(2)
if (sessions.length === 0) { console.error('usage: node probe3.mjs <sessionId> [sessionId...]'); process.exit(2) }

const url = 'ws://127.0.0.1:3080/api/remote.mux'
const ws = new WebSocket(url, { headers: { Cookie: COOKIE, Origin: 'http://127.0.0.1:3080' } })
const pending = new Map()
let seq = 0

ws.on('unexpected-response', (_req, res) => {
  console.error('upgrade rejected', res.statusCode, res.statusMessage)
  process.exit(1)
})
ws.on('error', e => { console.error('socket error', e.message); process.exit(1) })
ws.on('close', (code, reason) => console.log('socket close', code, String(reason)))

ws.on('message', (data) => {
  const text = data.toString()
  let msg
  try { msg = JSON.parse(text) } catch { return }
  const waiter = pending.get(msg.streamId)
  if (waiter) waiter(msg, text.length)
})

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function follow(sessionId, { maxMessages = 500, turnWindow = { minMessages: 50, minTurns: 2 }, keepMs = 0 } = {}) {
  const streamId = `probe-${++seq}`
  return await new Promise((resolve) => {
    const t0 = performance.now()
    let firstItemAt = null
    let firstSize = 0
    let itemCount = 0
    let totalBytes = 0
    let snapshot = null
    const result = { sessionId }
    const done = (extra = {}) => {
      resolve({ ...result, ...extra })
    }
    pending.set(streamId, (msg, size) => {
      totalBytes += size
      itemCount++
      if (msg.type === 'error') {
        pending.delete(streamId)
        done({ error: msg.error, firstItemMs: firstItemAt === null ? null : Math.round(firstItemAt - t0) })
        return
      }
      if (firstItemAt === null) {
        firstItemAt = performance.now()
        firstSize = size
        if (msg.type === 'item') {
          const v = msg.value
          snapshot = {
            type: v?.type,
            records: Array.isArray(v?.records) ? v.records.length : null,
            hasMore: v?.hasMore,
            cursor: v?.cursor,
            projectionsKeys: v?.projections ? Object.keys(v.projections.values ?? {}).length : null,
            assistantRev: v?.assistantStream?.revision ?? null,
          }
        }
        if (keepMs === 0) {
          ws.send(JSON.stringify({ type: 'cancel', streamId }))
          pending.delete(streamId)
          done({ firstItemMs: Math.round(firstItemAt - t0), firstBytes: firstSize, snapshot })
          return
        }
      }
      if (msg.type === 'end') {
        pending.delete(streamId)
        done({ firstItemMs: firstItemAt === null ? null : Math.round(firstItemAt - t0), firstBytes: firstSize, items: itemCount, bytes: totalBytes, snapshot })
      }
    })
    ws.send(JSON.stringify({
      type: 'open', streamId, endpoint: 'session/follow',
      payload: { args: { request: { address: { kind: 'session', sessionId }, assistantStream: true, maxMessages, turnWindow } } },
    }))
    setTimeout(() => {
      if (!pending.has(streamId)) return
      ws.send(JSON.stringify({ type: 'cancel', streamId }))
      pending.delete(streamId)
      done({ timeout: true, firstItemMs: firstItemAt === null ? null : Math.round(firstItemAt - t0), firstBytes: firstSize, items: itemCount, bytes: totalBytes, snapshot })
    }, 30000)
  })
}

async function page(sessionId, throughSeq, extra = {}) {
  const streamId = `page-${++seq}`
  const t0 = performance.now()
  return await new Promise((resolve) => {
    let firstAt = null
    let bytes = 0
    pending.set(streamId, (msg, size) => {
      bytes += size
      if (firstAt === null) firstAt = performance.now()
      if (msg.type === 'end') {
        pending.delete(streamId)
        resolve({ sessionId, ms: Math.round(firstAt - t0), bytes })
      }
      if (msg.type === 'error') {
        pending.delete(streamId)
        resolve({ sessionId, error: msg.error })
      }
    })
    ws.send(JSON.stringify({
      type: 'open', streamId, endpoint: 'session/page',
      payload: { args: { address: { kind: 'session', sessionId }, throughSeq, ...extra } },
    }))
    setTimeout(() => {
      if (!pending.has(streamId)) return
      ws.send(JSON.stringify({ type: 'cancel', streamId }))
      pending.delete(streamId)
      resolve({ sessionId, timeout: true, ms: firstAt === null ? null : Math.round(firstAt - t0) })
    }, 30000)
  })
}

try {
  await new Promise((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
  })
  console.log('socket open')
  for (const id of sessions) {
    const cold = await follow(id)
    console.log(JSON.stringify({ phase: 'follow-1', ...cold }))
    await sleep(800)
    const warm = await follow(id)
    console.log(JSON.stringify({ phase: 'follow-2', ...warm }))
    await sleep(800)
    const warm2 = await follow(id)
    console.log(JSON.stringify({ phase: 'follow-3', ...warm2 }))
  }
} finally {
  ws.close()
}
