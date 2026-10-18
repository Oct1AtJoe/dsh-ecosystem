// Measure bubble at a fixed viewport width (no reload) to check narrow layouts.
import WebSocket from 'ws'

const CDP = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9333'
const width = Number(process.argv[2] ?? 1000)
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
const infos = Array.isArray(listed) ? listed : (listed.targetInfos ?? [])
const page = infos.find(t => t.type === 'page' && t.url.includes('127.0.0.1:3080'))
const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 })
await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
let seq = 0
const call = (method, params) => rpc(ws, ++seq, method, params)
await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
await new Promise(r => setTimeout(r, 1500))
const r = await call('Runtime.evaluate', {
  expression: `
    (() => {
      const bubble = [...document.querySelectorAll('[class*="userStack"] > [class$="_bubble"]')].pop();
      if (!bubble) return JSON.stringify({ error: 'no bubble' });
      const range = document.createRange(); range.selectNodeContents(bubble);
      const lines = new Set([...range.getClientRects()].map(x => Math.round(x.top))).size;
      const col = document.querySelector('[class*="_column"]');
      const row = document.querySelector('.dsh-recall-row');
      const stack = document.querySelector('.dsh-recall-stack');
      const rect = el => el ? Math.round(el.getBoundingClientRect().width) : null;
      return JSON.stringify({
        innerW: innerWidth, lines,
        bubbleW: rect(bubble), stackW: rect(stack), rowW: rect(row), columnW: rect(col),
        stackMax: stack ? getComputedStyle(stack).maxWidth : null,
        docScrollW: document.documentElement.scrollWidth,
      });
    })()
  `,
  returnByValue: true,
})
console.log(JSON.stringify(JSON.parse(r.result.value), null, 1))
ws.close()
