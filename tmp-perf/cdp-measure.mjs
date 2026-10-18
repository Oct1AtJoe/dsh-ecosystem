// Measure the last user bubble layout, after an optional full reload.
import WebSocket from 'ws'
import fs from 'node:fs'

const CDP = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9333'
const reload = process.argv[2] === 'reload'
const openText = process.argv[3] ?? ''
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
const evaluate = async expression => {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300))
  return r.result.value
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

if (reload) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  await call('Page.enable', {})
  await call('Page.reload', { ignoreCache: true })
  await sleep(7000)
  if (openText) {
    await evaluate(`
      (() => {
        const t = ${JSON.stringify(openText)};
        const hit = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.textContent || '').includes(t));
        const leaf = hit[0]; if (!leaf) return 'miss';
        let el = leaf;
        for (let i = 0; i < 6 && el; i++) { if (el.tagName === 'BUTTON' || el.tabIndex >= 0 || el.getAttribute('role')) break; el = el.parentElement }
        (el ?? leaf).click(); return 'ok';
      })()
    `)
    await sleep(5000)
  }
}

const measure = await evaluate(`
  (() => {
    const bubble = [...document.querySelectorAll('[class*="userStack"] > [class$="_bubble"]')].pop();
    if (!bubble) return JSON.stringify({ error: 'no bubble' });
    const info = el => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return { cls: (el.className || '').toString().slice(0, 40), w: Math.round(r.width), maxW: cs.maxWidth, width: cs.width };
    };
    const range = document.createRange(); range.selectNodeContents(bubble);
    const lines = new Set([...range.getClientRects()].map(x => Math.round(x.top))).size;
    const chain = [];
    let el = bubble;
    for (let i = 0; i < 10 && el && el !== document.documentElement; i++) { chain.push(info(el)); el = el.parentElement }
    return JSON.stringify({ innerW: innerWidth, lines, bubble: info(bubble), chain });
  })()
`)
const shot = await call('Page.captureScreenshot', { format: 'png' })
fs.writeFileSync('C:/dsh-ecosystem/tmp-perf/after.png', Buffer.from(shot.data, 'base64'))
console.log(JSON.stringify(JSON.parse(measure), null, 1))
ws.close()
