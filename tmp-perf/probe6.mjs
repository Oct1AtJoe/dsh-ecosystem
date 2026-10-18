import { readFileSync } from 'node:fs'
import { createZstdDecompress, zstdDecompressSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'

const file = process.argv[2]
const buf = readFileSync(file)
const ZSTD_MAGIC = 0xFD2FB528
function scanFrames(buf) {
  const frames = []; let offset = 0
  while (offset < buf.length) {
    const start = offset
    if (buf.length - offset < 4) break
    if (buf.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error('bad magic')
    offset += 4
    const descriptor = buf.readUInt8(offset); offset += 1
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 0x20) !== 0
    const checksum = (descriptor & 0x04) !== 0
    const dictionaryFlag = descriptor & 0x03
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
    offset += (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    for (;;) {
      const bh = buf.readUIntLE(offset, 3); offset += 3
      const last = (bh & 1) !== 0
      const type = (bh >>> 1) & 0x03
      offset += type === 0x01 ? 1 : (bh >>> 3)
      if (last) break
    }
    if (checksum) offset += 4
    frames.push({ start, end: offset })
  }
  return frames
}

let t = performance.now()
const frames = scanFrames(buf)
const scanMs = performance.now() - t

// production-style decoder (fresh handle per frame would be slow; use one stream handle)
const CHUNK = 1 << 20
const out = Buffer.allocUnsafe(CHUNK)
t = performance.now()
const stream = createZstdDecompress({ chunkSize: CHUNK })
const handle = stream._handle
const parts = []
for (const { start, end } of frames) {
  const input = buf.subarray(start, end)
  let io = 0, ir = input.length
  for (;;) {
    handle.writeSync(stream._defaultFlushFlag, input, io, ir, out, 0, out.length)
    const outputAfter = stream._writeState[0]
    const inputAfter = stream._writeState[1]
    const produced = out.length - outputAfter
    parts.push(Buffer.from(out.subarray(0, produced)))
    if (outputAfter !== 0) break
    io += ir - inputAfter
    ir = inputAfter
  }
}
const decoded = Buffer.concat(parts)
const decodeMs = performance.now() - t
stream.close()

t = performance.now()
const text = decoded.toString('utf8')
const lines = text.split('\n')
const events = []
for (const line of lines) if (line) events.push(JSON.parse(line))
const parseMs = performance.now() - t

// deep freeze exactly like freezeStoredEvent
t = performance.now()
for (const event of events) {
  const pending = [event]
  while (pending.length > 0) {
    const current = pending.pop()
    Object.freeze(current)
    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) { const c = current[i]; if (c !== null && typeof c === 'object') pending.push(c) }
    } else {
      for (const key in current) { const c = current[key]; if (c !== null && typeof c === 'object') pending.push(c) }
    }
  }
}
Object.freeze(events)
const freezeMs = performance.now() - t

// projection-ish full scan: 21 passes reading two fields
t = performance.now()
let sink = 0
for (let p = 0; p < 21; p++) for (const e of events) sink += (e.type?.length ?? 0) + (e.seq ?? 0)
const projScanMs = performance.now() - t

// paginate (500 messages, turnWindow 2) + stringify
t = performance.now()
const MESSAGE_TYPES = new Set(['user/message', 'assistant/message'])
let count = 0, turns = 0, cut = 0
for (let i = events.length - 1; i >= 0; i--) {
  const e = events[i]
  if (e.type === 'turn/start') { turns++; if (count >= 50 && turns >= 2) { cut = i; break } }
  if (!MESSAGE_TYPES.has(e.type)) continue
  count++; if (count >= 500) { cut = i; break }
}
const page = events.slice(cut)
const json = JSON.stringify(page)
const pageMs = performance.now() - t

// find tail page of 50 messages too
t = performance.now()
let c2 = 0, cut2 = 0
for (let i = events.length - 1; i >= 0; i--) { const e = events[i]; if (!MESSAGE_TYPES.has(e.type)) continue; c2++; if (c2 >= 50) { cut2 = i; break } }
const json50 = JSON.stringify(events.slice(cut2))
const page50Ms = performance.now() - t

console.log(JSON.stringify({
  events: events.length,
  compressedMB: +(buf.length / 1048576).toFixed(2),
  rawMB: +(decoded.length / 1048576).toFixed(2),
  frames: frames.length,
  scanMs: +scanMs.toFixed(1),
  decodeMs: +decodeMs.toFixed(1),
  parseMs: +parseMs.toFixed(1),
  freezeMs: +freezeMs.toFixed(1),
  projScanMs: +projScanMs.toFixed(1),
  page500_ms: +pageMs.toFixed(1),
  page500_MB: +(json.length / 1048576).toFixed(2),
  page50_ms: +page50Ms.toFixed(1),
  page50_MB: +(json50.length / 1048576).toFixed(2),
  totalWithoutProjections: +(scanMs + decodeMs + parseMs + freezeMs + page50Ms).toFixed(1),
  sink,
}, null, 1))
