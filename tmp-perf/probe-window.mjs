import WebSocket from 'ws'

const COOKIE = process.env.DSH_COOKIE
const PORT = process.env.DSH_PORT ?? '3081'
const MAX = Number(process.env.PROBE_MAX ?? 120)
const WITH_TURN = process.env.PROBE_TURN !== '0'
const ids = process.argv.slice(2)
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/api/remote.mux`, {
  headers: { Cookie: COOKIE, Origin: `http://127.0.0.1:${PORT}` },
})
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

function follow(sessionId) {
  const streamId = `f-${++seq}`
  const request = {
    address: { kind: 'session', sessionId },
    assistantStream: true,
    maxMessages: MAX,
    ...WITH_TURN ? { turnWindow: { minMessages: 50, minTurns: 2 } } : {},
  }
  return new Promise(resolve => {
    const t0 = performance.now()
    let firstAt = null, firstBytes = 0, records = null, cursor = null
    const finish = (extra = {}) => resolve({ sessionId, maxMessages: MAX, turnWindow: WITH_TURN, firstMs: firstAt === null ? null : Math.round(firstAt - t0), firstBytes, records, cursor, ...extra })
    pending.set(streamId, (m) => {
      if (m.type === 'error') { pending.delete(streamId); finish({ error: m.error.code + ': ' + m.error.message }); return }
      if (firstAt === null) {
        firstAt = performance.now()
        firstBytes = JSON.stringify(m).length
        records = Array.isArray(m.value?.records) ? m.value.records.length : null
        cursor = m.value?.cursor ?? null
        ws.send(JSON.stringify({ type: 'cancel', streamId }))
        pending.delete(streamId)
        finish()
      }
    })
    ws.send(JSON.stringify({ type: 'open', streamId, endpoint: 'session/follow', payload: { args: { request } } }))
    setTimeout(() => { if (pending.has(streamId)) { pending.delete(streamId); finish({ timeout: true }) } }, 30000)
  })
}

await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
for (const id of ids) {
  console.log(JSON.stringify(await follow(id)))
  await sleep(250)
  console.log(JSON.stringify(await follow(id)))
}
ws.close()
