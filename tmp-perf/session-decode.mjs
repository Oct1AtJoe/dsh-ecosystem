import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

export function decodeSession(file) {
  const buf = readFileSync(file)
  const ZSTD_MAGIC = 0xFD2FB528
  const frames = []
  let offset = 0
  while (offset < buf.length) {
    const start = offset
    if (buf.length - offset < 4) break
    if (buf.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error('bad magic at ' + offset)
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
      const blockHeader = buf.readUIntLE(offset, 3); offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 0x03
      const blockSize = blockHeader >>> 3
      offset += blockType === 0x01 ? 1 : blockSize
      if (lastBlock) break
    }
    if (checksum) offset += 4
    frames.push({ start, end: offset })
  }
  const parts = frames.map(f => zstdDecompressSync(buf.subarray(f.start, f.end)))
  const text = Buffer.concat(parts).toString('utf8')
  const events = []
  for (const line of text.split('\n')) {
    if (!line) continue
    try { events.push(JSON.parse(line)) } catch {}
  }
  return events
}

if (process.argv[1] && process.argv[1].endsWith('session-decode.mjs')) {
  const events = decodeSession(process.argv[2])
  const types = {}
  for (const e of events) types[e.type] = (types[e.type] || 0) + 1
  console.log(JSON.stringify({ events: events.length, types }))
}
