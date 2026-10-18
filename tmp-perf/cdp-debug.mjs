// Debug: dump GUI text + interactive element inventory through CDP.
import WebSocket from 'ws'
import fs from 'node:fs'

const CDP = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9333'
function rpc(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const onMessage = data => {
      let m
      try { m = JSON.parse(data.toString()) } catch { return }
      if (m.id !== id) return
      ws.off('message', onMessage)
      if (m.error) reject(new Error(`${method}: ${JSON.stringify(m.error)}`))
      else resolve(m.result)
    }
    ws.on('message', onMessage)
    ws.send(JSON.stringify({ id, method, params }))
  })
}
const listed = await (await fetch(`${CDP}/json/list`)).json()
const targetInfos = Array.isArray(listed) ? listed : (listed.targetInfos ?? [])
const page = targetInfos.find(t => t.type === 'page' && t.url.includes('127.0.0.1:3080'))
if (!page) throw new Error('no page')
const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 })
await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
let seq = 0
const call = (method, params) => rpc(ws, ++seq, method, params)
const evaluate = async expression => {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300))
  return r.result.value
}

const dump = await evaluate(`
  (() => {
    const text = document.body.innerText || '';
    const roles = [...document.querySelectorAll('[role]')].slice(0, 60).map(e => ({
      role: e.getAttribute('role'), cls: (e.className || '').toString().slice(0, 30),
      t: (e.textContent || '').trim().slice(0, 40),
    }));
    return JSON.stringify({ url: location.href, inner: innerWidth, text: text.slice(0, 1500), roles });
  })()
`)
const shot = await call('Page.captureScreenshot', { format: 'png' })
fs.writeFileSync('C:/dsh-ecosystem/tmp-perf/debug.png', Buffer.from(shot.data, 'base64'))
console.log(dump)
ws.close()
