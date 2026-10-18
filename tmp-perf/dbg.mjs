import { readFileSync } from 'node:fs'
import { createZstdDecompress } from 'node:zlib'
import { Readable } from 'node:stream'
const file = process.argv[2]
const dec = createZstdDecompress()
const chunks = []
await new Promise((resolve, reject) => { Readable.from(readFileSync(file)).pipe(dec).on('data', c => chunks.push(c)).on('end', resolve).on('error', reject) })
const text = Buffer.concat(chunks).toString('utf8')
const lines = text.split('\n').filter(Boolean)
console.log('bytes', text.length, 'lines', lines.length)
const types = {}
for (const l of lines) { try { const e = JSON.parse(l); types[e.type] = (types[e.type] || 0) + 1 } catch {} }
console.log(JSON.stringify(types).slice(0, 500))
const um = lines.map(l => { try { return JSON.parse(l) } catch { return null } }).filter(e => e?.type === 'user/message')
console.log('user messages', um.length)
for (const e of um.slice(-8)) {
  console.log('---', e.seq, JSON.stringify(e.data).slice(0, 500))
}
