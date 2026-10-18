import { createReadStream, readFileSync } from 'node:fs'
import { createZstdDecompress, zstdDecompressSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'

const file = process.argv[2]
if (!file) { console.error('usage: node probe1.mjs <session.v3.jsonl.zstd>'); process.exit(2) }

const ZSTD_MAGIC = 0xFD2FB528
function scanFrames(buf) {
  const frames = []
  let offset = 0
  while (offset < buf.length) {
    const start = offset
    if (buf.length - offset < 4) break
    if (buf.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error(`bad magic at ${offset} (byte ${buf.readUInt32LE(offset).toString(16)})`)
    offset += 4
    if (offset === buf.length) break
    const descriptor = buf.readUInt8(offset); offset += 1
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 0x20) !== 0
    const checksum = (descriptor & 0x04) !== 0
    const dictionaryFlag = descriptor & 0x03
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
    offset += (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    for (;;) {
      if (buf.length - offset < 3) { offset = start; break }
      const blockHeader = buf.readUIntLE(offset, 3); offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 0x03
      const blockSize = blockHeader >>> 3
      const payloadBytes = blockType === 0x01 ? 1 : blockSize
      offset += payloadBytes
      if (lastBlock) break
    }
    if (checksum) offset += 4
    frames.push({ start, end: offset })
  }
  return frames
}

const t0 = performance.now()
const compressed = readFileSync(file)
const t1 = performance.now()
const frames = scanFrames(compressed)
const tScan = performance.now()
let raw = Buffer.alloc(0)
for (const f of frames) raw = Buffer.concat([raw, zstdDecompressSync(compressed.subarray(f.start, f.end))])
const t2 = performance.now()
const text = raw.toString('utf8')
const lines = text.split('\n')
const events = []
const tp0 = performance.now()
for (const line of lines) if (line) events.push(JSON.parse(line))
const tp1 = performance.now()

const byType = new Map()
let rawJsonBytes = 0
for (const e of events) {
  const k = e.type ?? 'unknown'
  byType.set(k, (byType.get(k) ?? 0) + 1)
  rawJsonBytes += JSON.stringify(e).length
}

const MESSAGE_TYPES = new Set(['user/message', 'assistant/message'])
const isMessage = e => MESSAGE_TYPES.has(e.type)

function pageCut(maxMessages, minMessages, minTurns) {
  let count = 0, turns = 0, cut = 0
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'turn/start') {
      turns++
      if (count >= minMessages && turns >= minTurns) { cut = i; break }
    }
    if (!isMessage(e)) continue
    count++
    if (count >= maxMessages) { cut = i; break }
  }
  return cut
}

function reportPage(label, maxMessages, minMessages, minTurns) {
  const cut = pageCut(maxMessages, minMessages, minTurns)
  const page = events.slice(cut)
  const json = JSON.stringify(page)
  const types = new Map()
  let biggest = []
  for (const e of page) {
    const k = e.type ?? 'unknown'
    const size = JSON.stringify(e).length
    types.set(k, (types.get(k) ?? 0) + size)
    biggest.push([size, k, e.seq])
  }
  biggest.sort((a, b) => b[0] - a[0])
  console.log(`\n[${label}] cutIndex=${cut} events=${page.length} messages=${page.filter(isMessage).length} wireBytes=${(json.length/1048576).toFixed(2)}MB`)
  console.log('  bytes by type:', [...types.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}=${(v/1048576).toFixed(2)}MB`).join(' '))
  console.log('  biggest:', biggest.slice(0,5).map(([s,k,q])=>`${k}@${q}:${(s/1024).toFixed(0)}KB`).join(' '))
}

console.log(JSON.stringify({
  file,
  compressedMB: +(compressed.length/1048576).toFixed(2),
  frames: frames.length,
  rawMB: +(raw.length/1048576).toFixed(2),
  readMs: +(t1-t0).toFixed(1),
  scanMs: +(tScan-t1).toFixed(1),
  decompressMs: +(t2-tScan).toFixed(1),
  jsonParseMs: +(tp1-tp0).toFixed(1),
  events: events.length,
  totalEventsJsonMB: +(rawJsonBytes/1048576).toFixed(2),
  types: Object.fromEntries([...byType.entries()].sort((a,b)=>b[1]-a[1])),
}, null, 1))

reportPage('opening client page: max500,min50,minTurns2', 500, 50, 2)
reportPage('default host page: 50', 50, 50, 0)
reportPage('jump page: 200', 200, 200, 0)
