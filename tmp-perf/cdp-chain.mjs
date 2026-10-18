// Dump the ancestor chain of the last user bubble with widths and layout owners.
import WebSocket from 'ws'

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
const infos = Array.isArray(listed) ? listed : (listed.targetInfos ?? [])
const page = infos.find(t => t.type === 'page' && t.url.includes('127.0.0.1:3080'))
const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 })
await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
let seq = 0
const call = (method, params) => rpc(ws, ++seq, method, params)
const r = await call('Runtime.evaluate', {
  expression: `
    (() => {
      const bubble = [...document.querySelectorAll('[class*="userStack"] > [class$="_bubble"]')].pop();
      if (!bubble) return JSON.stringify({ error: 'no bubble' });
      const chain = [];
      let el = bubble;
      for (let i = 0; i < 14 && el && el !== document.documentElement; i++) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        chain.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 60),
          slot: el.getAttribute('data-slot'),
          w: Math.round(rect.width),
          scrollW: el.scrollWidth,
          display: cs.display, flexDir: cs.flexDirection, alignItems: cs.alignItems,
          maxW: cs.maxWidth, width: cs.width, padding: cs.padding, margin: cs.margin,
          contain: cs.contain, position: cs.position,
        });
        el = el.parentElement;
      }
      return JSON.stringify(chain);
    })()
  `,
  returnByValue: true,
})
console.log(JSON.stringify(JSON.parse(r.result.value), null, 1))
ws.close()
