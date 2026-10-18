import { readFileSync } from 'node:fs'
import { createZstdDecompress, zstdDecompressSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'

const file = process.argv[2]
const compressed = readFileSync(file)
const ZSTD_MAGIC = 0xFD2FB528
function scanFrames(buf) {
  const frames = []; let offset = 0
  while (offset < buf.length) {
    const start = offset
    if (buf.length - offset < 4) break
    if (buf.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error('bad magic')
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
  return frames
}

let t = performance.now()
const frames = scanFrames(compressed)
console.log('frames', frames.length, 'scanMs', (performance.now() - t).toFixed(1))

const CHUNK = 1024 * 1024
const output = Buffer.allocUnsafe(CHUNK)

// 1) production private-handle path: one stream, writeSync per frame
{
  const stream = createZstdDecompress({ chunkSize: CHUNK })
  const handle = stream._handle
  let total = 0
  const t0 = performance.now()
  for (const { start, end } of frames) {
    const input = compressed.subarray(start, end)
    let inputOffset = 0
    let inputRemaining = input.length
    for (;;) {
      handle.writeSync(stream._defaultFlushFlag, input, inputOffset, inputRemaining, output, 0, output.length)
      const outputAfter = stream._writeState[0]
      const inputAfter = stream._writeState[1]
      const produced = output.length - outputAfter
      total += produced
      if (outputAfter !== 0) break
      inputOffset += inputRemaining - inputAfter
      inputRemaining = inputAfter
    }
  }
  const ms = performance.now() - t0
  console.log('private-handle total output MB', (total / 1048576).toFixed(1), 'decodeMs', ms.toFixed(1), 'perFrameMs', (ms / frames.length).toFixed(3))
  stream.close()
}

// 2) public one-shot per frame, collect buffers then concat once
{
  const t0 = performance.now()
  const bufs = []
  for (const { start, end } of frames) bufs.push(zstdDecompressSync(compressed.subarray(start, end)))
  const concatMs = performance.now() - t0
  const t1 = performance.now()
  const joined = Buffer.concat(bufs)
  console.log('public one-shot decodeMs', concatMs.toFixed(1), 'concatMs', (performance.now() - t1).toFixed(1), 'totalMB', (joined.length / 1048576).toFixed(1))
  const t2 = performance.now()
  const text = joined.toString('utf8')
  const lines = text.split('\n')
  let n = 0
  for (const line of lines) if (line) { JSON.parse(line); n++ }
  console.log('parseMs', (performance.now() - t2).toFixed(1), 'events', n)
}

// 3) single stream decode of whole file (zstd supports concatenated frames?)
{
  const t0 = performance.now()
  try {
    const all = zstdDecompressSync(compressed)
    console.log('whole-file one-shot MB', (all.length / 1048576).toFixed(1), 'ms', (performance.now() - t0).toFixed(1))
  } catch (e) { console.log('whole-file one-shot failed:', e.message) }
}
