/**
 * 给官方 checkout 打上或撤回「聊天区只画可见行」补丁。
 *
 *   node apply.mjs           幂等应用；已应用则什么都不做
 *   node apply.mjs --check   只报告状态，不改文件
 *   node apply.mjs --revert  已应用则撤回
 *
 * checkout 默认 E:\vibeCoding\deepseek-harness，可用 DSH_CHECKOUT 覆盖。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const checkout = process.env.DSH_CHECKOUT ?? 'E:/vibeCoding/deepseek-harness'
const patch = join(dirname(fileURLToPath(import.meta.url)), '0001-chat-virtual-rows.patch')
const target = join(checkout, 'packages/client/ui-chat/src/client/chat/ChatView.module.css')
const marker = 'content-visibility: auto'

/** @returns {boolean} whether the patch's marker is already in the target file. */
function applied() {
  try {
    return readFileSync(target, 'utf8').includes(marker)
  } catch {
    return false
  }
}

/** @param {string[]} args @param {boolean} quiet @returns {number} git exit status. */
function git(args, quiet = false) {
  const result = spawnSync('git', ['-C', checkout, ...args], { encoding: 'utf8' })
  if (result.status !== 0 && !quiet) process.stderr.write(result.stderr || result.stdout)
  return result.status ?? 1
}

const mode = process.argv.includes('--revert') ? 'revert'
  : process.argv.includes('--check') ? 'check'
    : 'apply'
const present = applied()

if (mode === 'check') {
  // A reversible probe in both directions, without touching the working tree.
  const forward = git(['apply', '--check', patch], true) === 0
  const backward = git(['apply', '--check', '--reverse', patch], true) === 0
  console.log(JSON.stringify({ mode, checkout, applied: present, canApply: forward, canRevert: backward }))
  process.exit(0)
}

if (mode === 'apply' && present) {
  console.log(JSON.stringify({ mode, checkout, applied: true, changed: false }))
  process.exit(0)
}
if (mode === 'revert' && !present) {
  console.log(JSON.stringify({ mode, checkout, applied: false, changed: false }))
  process.exit(0)
}

const status = mode === 'apply' ? git(['apply', patch]) : git(['apply', '--reverse', patch])
if (status !== 0) process.exit(status)
if (applied() !== (mode === 'apply')) throw new Error('patch state does not match the requested mode')
console.log(JSON.stringify({ mode, checkout, applied: applied(), changed: true }))
