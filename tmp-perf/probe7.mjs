import { open, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

const root = process.argv[2]
const ZSTD_MAGIC = 0xFD2FB528

function firstFrame(buf) {
  if (buf.length < 4 || buf.readUInt32LE(0) !== ZSTD_MAGIC) return null
  let offset = 5
  const descriptor = buf.readUInt8(4)
  const contentSizeFlag = descriptor >>> 6
  const singleSegment = (descriptor & 0x20) !== 0
  const checksum = (descriptor & 0x04) !== 0
  const dictionaryFlag = descriptor & 0x03
  offset += (singleSegment ? 0 : 1) + (dictionaryFlag === 3 ? 4 : dictionaryFlag)
    + (contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag)
  for (;;) {
    if (buf.length - offset < 3) return null
    const bh = buf.readUIntLE(offset, 3); offset += 3
    const last = (bh & 1) !== 0
    const type = (bh >>> 1) & 0x03
    const size = bh >>> 3
    offset += type === 0x01 ? 1 : size
    if (last) break
  }
  if (checksum) offset += 4
  return buf.subarray(0, offset)
}

async function firstLine(path) {
  const fh = await open(path, 'r')
  try {
    const buf = Buffer.alloc(1 << 16)
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0)
    const frame = firstFrame(buf.subarray(0, bytesRead))
    if (!frame) return ''
    const text = zstdDecompressSync(frame).toString('utf8')
    return text.split('\n')[0] ?? ''
  } finally {
    await fh.close()
  }
}

const projects = await readdir(root)
const paths = []
for (const p of projects) {
  if (!p.startsWith('--')) continue
  const dirs = await readdir(join(root, p))
  for (const d of dirs) {
    if (!d.startsWith('session-') && !d.startsWith('subagent-') && !/^[0-9a-f-]{36}$/.test(d)) continue
    try {
      const files = await readdir(join(root, p, d))
      const v4 = files.find(f => f === 'session.v4.jsonl.zstd')
      const v3 = files.find(f => f === 'session.v3.jsonl.zstd')
      const pick = v4 ?? v3
      if (pick) paths.push(join(root, p, d, pick))
    } catch {}
  }
}

const t0 = performance.now()
let ok = 0
const limit = 3
let index = 0
async function worker() {
  while (index < paths.length) {
    const path = paths[index++]
    try { if (await firstLine(path)) ok++ } catch {}
  }
}
await Promise.all(Array.from({ length: limit }, worker))
const ms = performance.now() - t0
console.log(JSON.stringify({ files: paths.length, ok, ms: Math.round(ms), perFileMs: +(ms / paths.length).toFixed(2) }))
