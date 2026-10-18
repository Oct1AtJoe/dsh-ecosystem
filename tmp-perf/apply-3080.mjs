import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'

const file = 'E:/vibeCoding/deepseek-harness/packages/api/session-controller/lib/client.js'
const backup = 'C:/dsh-ecosystem/tmp-perf/client.js.orig'
const orig = readFileSync(file, 'utf8')
copyFileSync(file, backup)

function replaceBlock(src, marker, block) {
  const start = src.indexOf(marker)
  if (start < 0) throw new Error(`marker missing: ${marker}`)
  const endMarker = '\n\t\t};'
  const end = src.indexOf(endMarker, start)
  if (end < 0) throw new Error(`block end missing: ${marker}`)
  return src.slice(0, start) + block + src.slice(end + endMarker.length)
}

let out = replaceBlock(
  orig,
  'const HISTORY_PAGE_OPTIONS = {',
  'const HISTORY_PAGE_OPTIONS = { maxMessages: 30 };',
)
out = replaceBlock(
  out,
  'const JUMP_PAGE_OPTIONS = {',
  [
    'const JUMP_PAGE_OPTIONS = {',
    '\t\t\tmaxMessages: JUMP_PAGE_MESSAGES,',
    '\t\t\tturnWindow: {',
    '\t\t\t\tminMessages: JUMP_PAGE_MESSAGES,',
    '\t\t\t\tminTurns: 2',
    '\t\t\t}',
    '\t\t};',
  ].join('\n'),
)

if (!out.includes('const HISTORY_PAGE_OPTIONS = { maxMessages: 30 };')) throw new Error('history block not replaced')
if (!out.includes('maxMessages: JUMP_PAGE_MESSAGES')) throw new Error('jump block not replaced')
writeFileSync(file, out)

const check = readFileSync(file, 'utf8')
const i = check.indexOf('const HISTORY_PAGE_OPTIONS')
console.log(JSON.stringify({
  backup,
  bytesBefore: orig.length,
  bytesAfter: check.length,
  snippet: check.slice(i, i + 260),
}, null, 1))
