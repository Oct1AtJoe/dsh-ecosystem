import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'

const file = 'E:/vibeCoding/deepseek-harness/packages/api/session-controller/lib/client.js'
copyFileSync(file, 'C:/dsh-ecosystem/tmp-perf/client.js.before-window')

let src = readFileSync(file, 'utf8')
const before = src

const oldHistory = `const HISTORY_PAGE_OPTIONS = {
			maxMessages: 500,
			turnWindow: {
				minMessages: 50,
				minTurns: 2
			}
		};`
const newHistory = `const HISTORY_PAGE_OPTIONS = { maxMessages: 30 };`

const oldJump = `const JUMP_PAGE_OPTIONS = {
			...HISTORY_PAGE_OPTIONS,
			turnWindow: {
				...HISTORY_PAGE_OPTIONS.turnWindow,
				minMessages: 200
			}
		};`
const newJump = `const JUMP_PAGE_OPTIONS = {
			maxMessages: 200,
			turnWindow: {
				minMessages: 200,
				minTurns: 2
			}
		};`

if (!src.includes(oldHistory)) throw new Error('HISTORY block not found')
if (!src.includes(oldJump)) throw new Error('JUMP block not found')
src = src.replace(oldHistory, newHistory).replace(oldJump, newJump)
if (src.includes('JUMP_PAGE_MESSAGES')) throw new Error('dangling JUMP_PAGE_MESSAGES')
if (!src.includes('maxMessages: 30')) throw new Error('history not applied')

writeFileSync(file, src)
const i = src.indexOf('const HISTORY_PAGE_OPTIONS')
console.log(JSON.stringify({
  bytesBefore: before.length,
  bytesAfter: src.length,
  snippet: src.slice(i, i + 300),
}, null, 1))
