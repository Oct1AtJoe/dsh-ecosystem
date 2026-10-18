// Open a session in the GUI page (CDP) and measure user bubbles.
// Usage: node cdp-open.mjs <sessionText>
import WebSocket from 'ws'
import fs from 'node:fs'

const CDP = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9333'
const sessionText = process.argv[2] ?? ''
const shotPath = process.argv[3] ?? 'C:/dsh-ecosystem/tmp-perf/session.png'

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
const sleep = ms => new Promise(r => setTimeout(r, ms))

await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
await call('Page.enable', {})
await call('Page.reload', { ignoreCache: false })
await sleep(6000)

const info = await evaluate(`JSON.stringify({ url: location.href, inner: innerWidth, text: (document.body.innerText || '').slice(0, 900) })`)
console.log('AFTER RELOAD', info)

const clicked = await evaluate(`
  (() => {
    const target = ${JSON.stringify(sessionText)};
    const nodes = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 || e.textContent.trim() === target);
    const hit = nodes.filter(e => (e.textContent || '').trim().includes(target));
    if (hit.length === 0) return 'miss';
    const leaf = hit.find(e => e.children.length === 0) ?? hit[0];
    let el = leaf;
    for (let i = 0; i < 6 && el; i++) {
      if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'treeitem' || el.getAttribute('role') === 'option' || el.getAttribute('role') === 'menuitem' || el.tabIndex >= 0) break;
      el = el.parentElement;
    }
    (el ?? leaf).click();
    return 'clicked:' + (leaf.textContent || '').trim().slice(0, 40);
  })()
`)
console.log('CLICK', clicked)
await sleep(5000)

const measure = await evaluate(`
  (() => {
    const bubbles = [...document.querySelectorAll('[class*="userStack"] > [class$="_bubble"]')];
    const rows = bubbles.map(b => {
      const r = b.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(b);
      const tops = new Set([...range.getClientRects()].map(x => Math.round(x.top)));
      const cs = getComputedStyle(b);
      return {
        text: (b.innerText || '').slice(0, 50).replace(/\\n/g, '\\\\n'),
        w: Math.round(r.width), h: Math.round(r.height), lines: tops.size,
        maxWidth: cs.maxWidth, whiteSpace: cs.whiteSpace, wordBreak: cs.wordBreak,
        fontSize: cs.fontSize, lineHeight: cs.lineHeight, padding: cs.padding,
      };
    });
    const stacks = [...document.querySelectorAll('[class*="userStack"]')].slice(-3).map(s => {
      const cs = getComputedStyle(s);
      return { w: Math.round(s.getBoundingClientRect().width), maxWidth: cs.maxWidth, rowW: Math.round(s.parentElement.getBoundingClientRect().width) };
    });
    const column = document.querySelector('[class*="column"]');
    return JSON.stringify({
      url: location.href, bubbles: bubbles.length, rows: rows.slice(-5), stacks,
      columnW: column ? Math.round(column.getBoundingClientRect().width) : null,
      columnMax: column ? getComputedStyle(column).maxWidth : null,
      inner: innerWidth, text: (document.body.innerText || '').slice(0, 400),
    });
  })()
`)
const shot = await call('Page.captureScreenshot', { format: 'png' })
fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'))
console.log('MEASURE', measure)
ws.close()
