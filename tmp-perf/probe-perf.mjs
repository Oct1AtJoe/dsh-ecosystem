import WebSocket from 'ws'

const COOKIE = process.env.DSH_COOKIE
const PORT = process.env.DSH_PORT ?? '3081'
const MAX = Number(process.env.PROBE_MAX ?? 500)
const MIN_TURNS = Number(process.env.PROBE_MIN_TURNS ?? 2)
const ids = process.argv.slice(2)
const url = `ws://127.0.0.1:${PORT}/api/remote.mux`
const ws = new WebSocket(url, { headers: { Cookie: COOKIE, Origin: `http://127.0.0.1:${PORT}` } })
ws.on('unexpected-response', (_q, r) => { console.error('rejected', r.statusCode); process.exit(1) })
ws.on('error', e => { console.error('error', e.message); process.exit(1) })
let seq = 0
const pending = new Map()
ws.on('message', d => {
  let m
  try { m = JSON.parse(d.toString()) } catch { return }
  pending.get(m.streamId)?.(m, d.length)
})
const sleep = ms => new Promise(r => setTimeout(r, ms))

function follow(sessionId, maxMessages, turnWindow) {
  const streamId = `f-${++seq}`
  return new Promise(resolve => {
    const t0 = performance.now()
    let firstAt = null, firstBytes = 0, records = null, cursor = null, hasMore = null
    const finish = (extra = {}) => resolve({ sessionId, maxMessages, firstMs: firstAt === null ? null : Math.round(firstAt - t0), firstBytes, records, cursor, hasMore, ...extra })
    pending.set(streamId, (m) => {
      if (m.type === 'error') { pending.delete(streamId); finish({ error: m.error.code + ': ' + m.error.message }); return }
      if (firstAt === null) {
        firstAt = performance.now()
        firstBytes = JSON.stringify(m).length
        const v = m.value
        records = Array.isArray(v?.records) ? v.records.length : null
        cursor = v?.cursor ?? null
        hasMore = v?.hasMore ?? null
        ws.send(JSON.stringify({ type: 'cancel', streamId }))
        pending.delete(streamId)
        finish()
      }
    })
    ws.send(JSON.stringify({ type: 'open', streamId, endpoint: 'session/follow', payload: { args: { request: { address: { kind: 'session', sessionId }, assistantStream: true, maxMessages, turnWindow } } } }))
    setTimeout(() => { if (pending.has(streamId)) { pending.delete(streamId); finish({ timeout: true }) } }, 30000)
  })
}

await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
console.log(JSON.stringify({ port: PORT, connected: Math.round(performance.now()) }))
for (const id of ids) {
  console.log(JSON.stringify(await follow(id, MAX, { minMessages: 50, minTurns: MIN_TURNS })))
  await sleep(300)
  console.log(JSON.stringify(await follow(id, MAX, { minMessages: 50, minTurns: MIN_TURNS })))
  await sleep(1500)
  console.log(JSON.stringify(await follow(id, MAX, { minMessages: 50, minTurns: MIN_TURNS })))
}
ws.close()
