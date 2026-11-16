/**
 * 给官方 checkout 打上或撤回「聊天区只画可见行」补丁。
 *
 *   node apply.mjs           幂等应用；已应用则什么都不做
 *   node apply.mjs --check   只报告状态，不改文件
 *   node apply.mjs --revert  已应用则撤回
 *
 * checkout 默认 E:\vibeCoding\deepseek-harness，可用 DSH_CHECKOUT 覆盖。
 *
 * 这里用锚点文本插入而不是 git patch：官方几乎每个版本都会改这个文件的
 * 相邻注释，hunk 的行号与上下文一变动 patch 就失效（0.2.2 实测）。锚点选
 * 的是紧随 `.column` 之后的 flow 槽注释，自 0.2.1 起未变。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const checkout = process.env.DSH_CHECKOUT ?? 'E:/vibeCoding/deepseek-harness'
const target = join(checkout, 'packages/client/ui-chat/src/client/chat/ChatView.module.css')
const marker = 'content-visibility: auto'

/** 插入位置：flow 槽注释之前（等价于紧接 `.column` 规则的末尾）。 */
const anchor = '/* The flow slot\'s display:contents anchor preserves layout but not selector ancestry.'
const block = `/* Long transcripts only paint the rows near the scrollport. The browser keeps
   every top-level row in the DOM, so scroll anchoring, the turn rail and the
   fold policies still read the same tree; off-screen rows just skip layout and
   paint, estimated by \`contain-intrinsic-size\` until they come back. */
:is(.column, :global([data-slot="conversation.chat.flow"])) > [data-chat-anchor-key] {
  content-visibility: auto;
  contain-intrinsic-size: auto 96px;
}

`

/** @returns {boolean} whether the patch's marker is already in the target file. */
function applied() {
  try {
    return readFileSync(target, 'utf8').includes(marker)
  } catch {
    return false
  }
}

const mode = process.argv.includes('--revert') ? 'revert'
  : process.argv.includes('--check') ? 'check'
    : 'apply'
const present = applied()

if (mode === 'check') {
  console.log(JSON.stringify({ mode, checkout, applied: present, canApply: !present, canRevert: present }))
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

const source = readFileSync(target, 'utf8')
const parts = source.split(anchor)
if (parts.length !== 2) {
  throw new Error(`锚点命中 ${parts.length - 1} 次（应为 1 次）：官方可能改了 flow 槽注释，拒绝写入`)
}
let next
if (mode === 'apply') {
  next = parts[0] + block + anchor + parts[1]
} else {
  if (!parts[0].endsWith(block)) throw new Error('已应用，但插入块不在锚点之前；拒绝猜测删除范围')
  next = parts[0].slice(0, -block.length) + anchor + parts[1]
}
writeFileSync(target, next)
if (applied() !== (mode === 'apply')) throw new Error('patch state does not match the requested mode')
console.log(JSON.stringify({ mode, checkout, applied: applied(), changed: true }))
