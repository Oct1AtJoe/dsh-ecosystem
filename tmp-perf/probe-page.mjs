import WebSocket from 'ws'

const COOKIE = process.env.DSH_COOKIE
const PORT = process.env.DSH_PORT ?? '3081'
const sessionId = process.argv[2]
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/api/remote.mux`, {
  headers: { Cookie: COOKIE, Origin: `http://127.0.0.1:${PORT}` },
})
ws.on('unexpected-response', (_q, r) => { console.error('rejected', r.statusCode); process.exit(1) })
ws.on('error', e => { console.error('error', e.message); process.exit(1) })
const pending = new Map()
ws.on('message', d => {
  let m
  try { m = JSON.parse(d.toString()) } catch { return }
  pending.get(m.streamId)?.(m)
})
const sleep = ms => new Promise(r => setTimeout(r, ms))

function request(streamId, endpoint, request) {
  return new Promise(resolve => {
    const t0 = performance.now()
    let firstMs = null, bytes = 0, error = null, records = null
    pending.set(streamId, m => {
      bytes += JSON.stringify(m).length
      if (m.type === 'error') { error = `${m.error.code}: ${m.error.message}`; finish() }
      if (m.type === 'item') {
        if (firstMs === null) firstMs = Math.round(performance.now() - t0)
        records = Array.isArray(m.value?.records) ? m.value.records.length : records
      }
      if (m.type === 'end') finish()
    })
    const finish = () => { pending.delete(streamId); resolve({ endpoint, firstMs, bytes, records, error }) }
    ws.send(JSON.stringify({ type: 'open', streamId, endpoint, payload: { args: { request } } }))
    setTimeout(() => { if (pending.has(streamId)) { pending.delete(streamId); resolve({ endpoint, timeout: true, firstMs, bytes, records, error }) } }, 30000)
  })
}

await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
const follow = await request('p1', 'session/follow', {
  address: { kind: 'session', sessionId }, assistantStream: true, maxMessages: 30,
})
console.log(JSON.stringify({ step: 'follow', ...follow }))
await sleep(300)
const page = await request('p2', 'session/page', {
  address: { kind: 'session', sessionId }, throughSeq: 8022,
  maxMessages: 200, turnWindow: { minMessages: 200, minTurns: 2 },
})
console.log(JSON.stringify({ step: 'page-jump', ...page }))
ws.close()
