// Minimal CDP driver for an isolated Edge instance pointed at the local DSH GUI.
// Usage: node cdp-gui.mjs <step>
//   step = 'check'  -> load GUI, report title/body length, screenshot
import WebSocket from 'ws'
import fs from 'node:fs'

const CDP = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9333'
const COOKIE_NAME = process.env.DSH_COOKIE_NAME
const COOKIE_VALUE = process.env.DSH_COOKIE_VALUE
const step = process.argv[2] ?? 'check'

function rpc(ws, id, method, params = {}, sessionId) {
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
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
}

const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 })
await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })

let seq = 0
const call = (method, params) => rpc(ws, ++seq, method, params)

await call('Page.enable', {})
await call('Network.enable', {})
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
if (COOKIE_NAME && COOKIE_VALUE) {
  await call('Network.setCookie', {
    name: COOKIE_NAME, value: COOKIE_VALUE, domain: '127.0.0.1', path: '/', httpOnly: true,
  })
}
await call('Page.navigate', { url: 'http://127.0.0.1:3080/' })

const deadline = Date.now() + 25000
let state = null
while (Date.now() < deadline) {
  await new Promise(r => setTimeout(r, 500))
  try {
    const r = await call('Runtime.evaluate', {
      expression: `JSON.stringify({ title: document.title, url: location.href, ready: document.readyState, bodyLen: document.body ? document.body.innerText.length : -1 })`,
      returnByValue: true,
    })
    state = JSON.parse(r.result.value)
    if (state.bodyLen > 200) break
  } catch { /* page may be swapping execution context */ }
}

const shot = await call('Page.captureScreenshot', { format: 'png' })
fs.writeFileSync(process.env.SHOT_PATH ?? 'C:/dsh-ecosystem/tmp-perf/gui.png', Buffer.from(shot.data, 'base64'))

const summary = await call('Runtime.evaluate', {
  expression: `
    (() => {
      const bubbles = [...document.querySelectorAll('[class*="userStack"] > [class$="_bubble"]')];
      const last = bubbles.slice(-3).map(b => {
        const r = b.getBoundingClientRect();
        const range = document.createRange(); range.selectNodeContents(b);
        const tops = new Set([...range.getClientRects()].map(x => Math.round(x.top)));
        const cs = getComputedStyle(b);
        return {
          text: (b.innerText || '').slice(0, 40),
          w: Math.round(r.width), h: Math.round(r.height), lines: tops.size,
          maxWidth: cs.maxWidth, whiteSpace: cs.whiteSpace, wordBreak: cs.wordBreak,
          fontSize: cs.fontSize, lineHeight: cs.lineHeight,
        };
      });
      const column = document.querySelector('[class*="column"]');
      const body = document.querySelector('[class*="_body"]');
      return JSON.stringify({
        bubbles: bubbles.length, last,
        columnMax: column ? getComputedStyle(column).maxWidth : null,
        columnW: column ? Math.round(column.getBoundingClientRect().width) : null,
        chatVar: body ? getComputedStyle(body).getPropertyValue('--dsh-chat-content-width').trim() : null,
        inner: innerWidth,
      });
    })()
  `,
  returnByValue: true,
})

console.log(JSON.stringify({ step, state, measure: JSON.parse(summary.result.value) }, null, 1))
ws.close()
