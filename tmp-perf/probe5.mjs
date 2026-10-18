import WebSocket from 'ws'

const COOKIE = process.env.DSH_COOKIE
const ids = process.argv.slice(2)
const ws = new WebSocket('ws://127.0.0.1:3080/api/remote.mux', { headers: { Cookie: COOKIE, Origin: 'http://127.0.0.1:3080' } })
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
        firstBytes = d_len(m)
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
function d_len(m) { return JSON.stringify(m).length }

function page(sessionId, throughSeq, maxMessages, turnWindow) {
  const streamId = `p-${++seq}`
  return new Promise(resolve => {
    const t0 = performance.now()
    let firstAt = null, bytes = 0, records = null
    pending.set(streamId, (m, size) => {
      bytes += size
      if (m.type === 'item') {
        if (firstAt === null) firstAt = performance.now()
        records = Array.isArray(m.value?.records) ? m.value.records.length : records
      }
      if (m.type === 'error') { pending.delete(streamId); resolve({ sessionId, error: m.error.code }) }
      if (m.type === 'end') { pending.delete(streamId); resolve({ sessionId, ms: Math.round(firstAt - t0), bytes, records }) }
    })
    ws.send(JSON.stringify({ type: 'open', streamId, endpoint: 'session/page', payload: { args: { request: { address: { kind: 'session', sessionId }, throughSeq, maxMessages, turnWindow } } } }))
    setTimeout(() => { if (pending.has(streamId)) { pending.delete(streamId); resolve({ sessionId, timeout: true, ms: firstAt === null ? null : Math.round(firstAt - t0) }) } }, 30000)
  })
}

await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
console.log('open', Math.round(performance.now()))

for (const id of ids) {
  console.log(JSON.stringify(await follow(id, 50, { minMessages: 50, minTurns: 2 })))
  await sleep(300)
  console.log(JSON.stringify(await follow(id, 500, { minMessages: 50, minTurns: 2 })))
  await sleep(300)
  console.log(JSON.stringify(await follow(id, 50, { minMessages: 50, minTurns: 2 })))
  await sleep(2000)
  console.log(JSON.stringify(await follow(id, 500, { minMessages: 50, minTurns: 2 })))
}
ws.close()
