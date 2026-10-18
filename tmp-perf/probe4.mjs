import WebSocket from 'ws'
const COOKIE = process.env.DSH_COOKIE
const sessionId = process.argv[2]
const endpoint = process.argv[3] ?? 'session/follow'
const ws = new WebSocket('ws://127.0.0.1:3080/api/remote.mux', { headers: { Cookie: COOKIE, Origin: 'http://127.0.0.1:3080' } })
ws.on('unexpected-response', (_q, r) => { console.error('rejected', r.statusCode); process.exit(1) })
ws.on('error', e => { console.error('error', e.message); process.exit(1) })
const t0 = performance.now()
let n = 0
ws.on('open', () => {
  console.log('open after', Math.round(performance.now() - t0))
  ws.send(JSON.stringify({
    type: 'open', streamId: 'dbg1', endpoint,
    payload: { args: { address: { kind: 'session', sessionId }, assistantStream: true, maxMessages: 500, turnWindow: { minMessages: 50, minTurns: 2 } } },
  }))
})
ws.on('message', d => {
  const s = d.toString()
  n++
  console.log(`msg${n} @${Math.round(performance.now() - t0)}ms bytes=${s.length} head=${s.slice(0, 400)}`)
  if (n >= 3) { ws.close(); }
})
setTimeout(() => { ws.close() }, 20000)
