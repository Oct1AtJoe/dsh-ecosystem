import { readFileSync } from 'node:fs'
import { createZstdDecompress } from 'node:zlib'
import { Readable } from 'node:stream'

const file = process.argv[2]
const chunks = []
const dec = createZstdDecompress()
await new Promise((resolve, reject) => {
  Readable.from(readFileSync(file)).pipe(dec)
    .on('data', c => chunks.push(c))
    .on('end', resolve)
    .on('error', reject)
})
const text = Buffer.concat(chunks).toString('utf8')
const lines = text.split('\n').filter(Boolean)
const out = []
for (const line of lines) {
  let e
  try { e = JSON.parse(line) } catch { continue }
  if (e.type === 'user/message') {
    const parts = e.data?.message?.content ?? []
    const t = parts.map(p => p.type === 'text' ? p.text : `[${p.type}]`).join('')
    out.push({ seq: e.seq, time: e.time, role: 'user', text: t.slice(0, 800) })
  } else if (e.type === 'assistant/message') {
    const parts = e.data?.message?.content ?? []
    const t = parts.map(p => p.type === 'text' ? p.text : '').join('')
    if (t.trim()) out.push({ seq: e.seq, time: e.time, role: 'assistant', text: t.slice(0, 1200) })
  }
}
console.log(JSON.stringify(out.slice(-40), null, 1))
