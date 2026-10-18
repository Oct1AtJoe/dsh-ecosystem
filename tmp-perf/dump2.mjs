import { decodeSession } from './session-decode.mjs'

const events = decodeSession(process.argv[2])
const out = []
for (const e of events) {
  if (e.type === 'user/message') {
    const parts = e.data?.message?.content ?? e.data?.content ?? []
    const t = Array.isArray(parts) ? parts.map(p => p.type === 'text' ? p.text : `[${p.type}]`).join('') : ''
    out.push({ seq: e.seq, role: 'user', text: String(t).slice(0, 700) })
  } else if (e.type === 'assistant/message') {
    const parts = e.data?.message?.content ?? e.data?.content ?? []
    const t = Array.isArray(parts) ? parts.map(p => p.type === 'text' ? p.text : '').join('') : ''
    if (String(t).trim()) out.push({ seq: e.seq, role: 'assistant', text: String(t).slice(0, 900) })
  }
}
console.log(JSON.stringify(out.slice(0, 30), null, 1))
