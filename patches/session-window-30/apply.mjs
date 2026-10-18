/**
 * 会话首屏窗口 30 条 —— 可重复应用的补丁脚本。
 *
 * 为什么需要它：真正的改动落在 `lib/client.js`（gitignore 的构建产物）里，
 * 任何一次 `pnpm run build:lib` 都会覆盖回 500/2。所以必须同时改源码，
 * 让重建后的产物保持同样的窗口。
 *
 * 幂等：已改过的文件跳过，不会二次改写。
 *
 * 用法：
 *   node apply.mjs            # 应用（源码 + 产物）
 *   node apply.mjs --check    # 只检查状态，不写文件
 *   node apply.mjs --revert   # 还原源码（产物请用备份）
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'

const REPO = process.env.DSH_REPO ?? 'E:/vibeCoding/deepseek-harness'
const SRC = `${REPO}/packages/api/session-controller/src/client/sessions/session.ts`
const ARTIFACT = `${REPO}/packages/api/session-controller/lib/client.js`
const BACKUP = 'C:/dsh-ecosystem/patches/session-window-30/client.js.orig'

const SRC_BEFORE = `const HISTORY_PAGE_OPTIONS = { maxMessages: 500, turnWindow: { minMessages: PAGE_MESSAGES, minTurns: 2 } }`
const SRC_AFTER = `const HISTORY_PAGE_OPTIONS = { maxMessages: 30 }`

const JUMP_BEFORE = `const JUMP_PAGE_OPTIONS = {
  ...HISTORY_PAGE_OPTIONS,
  turnWindow: { ...HISTORY_PAGE_OPTIONS.turnWindow, minMessages: JUMP_PAGE_MESSAGES },
}`
const JUMP_AFTER = `const JUMP_PAGE_OPTIONS = {
  maxMessages: JUMP_PAGE_MESSAGES,
  turnWindow: { minMessages: JUMP_PAGE_MESSAGES, minTurns: 2 },
}`

// 构建产物里是 tsdown 展开后的形态（tab 缩进、单行 history）。
const ART_HISTORY_RE = /const HISTORY_PAGE_OPTIONS = \{[\s\S]*?\n\t\t\};/
const ART_HISTORY_NEW = 'const HISTORY_PAGE_OPTIONS = { maxMessages: 30 };'
const ART_JUMP_RE = /const JUMP_PAGE_OPTIONS = \{[\s\S]*?\n\t\t\};/
const ART_JUMP_NEW = [
  'const JUMP_PAGE_OPTIONS = {',
  '\t\t\tmaxMessages: JUMP_PAGE_MESSAGES,',
  '\t\t\tturnWindow: {',
  '\t\t\t\tminMessages: JUMP_PAGE_MESSAGES,',
  '\t\t\t\tminTurns: 2',
  '\t\t\t}',
  '\t\t};',
].join('\n')

const mode = process.argv.includes('--check') ? 'check'
  : process.argv.includes('--revert') ? 'revert'
    : 'apply'

function patchSource(text) {
  if (text.includes(SRC_AFTER)) return { text, changed: false }
  if (!text.includes(SRC_BEFORE)) throw new Error('源码 HISTORY_PAGE_OPTIONS 未匹配（上游可能已改）')
  let out = text.replace(SRC_BEFORE, SRC_AFTER)
  if (!out.includes(JUMP_AFTER)) {
    if (!out.includes(JUMP_BEFORE)) throw new Error('源码 JUMP_PAGE_OPTIONS 未匹配（上游可能已改）')
    out = out.replace(JUMP_BEFORE, JUMP_AFTER)
  }
  return { text: out, changed: true }
}

function revertSource(text) {
  if (!text.includes(SRC_AFTER)) return { text, changed: false }
  let out = text.replace(SRC_AFTER, SRC_BEFORE)
  if (out.includes(JUMP_AFTER)) out = out.replace(JUMP_AFTER, JUMP_BEFORE)
  return { text: out, changed: true }
}

function patchArtifact(text) {
  if (text.includes(ART_HISTORY_NEW)) return { text, changed: false }
  if (!ART_HISTORY_RE.test(text)) throw new Error('产物 HISTORY_PAGE_OPTIONS 未匹配')
  let out = text.replace(ART_HISTORY_RE, ART_HISTORY_NEW)
  if (!ART_JUMP_RE.test(out)) throw new Error('产物 JUMP_PAGE_OPTIONS 未匹配')
  out = out.replace(ART_JUMP_RE, ART_JUMP_NEW)
  return { text: out, changed: true }
}

const report = {}
for (const [label, file, fn] of [
  ['source', SRC, mode === 'revert' ? revertSource : patchSource],
]) {
  if (!existsSync(file)) { report[label] = 'missing'; continue }
  const text = readFileSync(file, 'utf8')
  if (mode === 'check') {
    report[label] = text.includes(SRC_AFTER) ? 'patched' : 'original'
    continue
  }
  const { text: next, changed } = fn(text)
  if (changed && mode !== 'check') writeFileSync(file, next)
  report[label] = changed ? (mode === 'revert' ? 'reverted' : 'patched') : 'unchanged'
}

if (mode !== 'revert') {
  if (!existsSync(ARTIFACT)) {
    report.artifact = 'missing'
  } else {
    const text = readFileSync(ARTIFACT, 'utf8')
    if (mode === 'check') {
      report.artifact = text.includes(ART_HISTORY_NEW) ? 'patched' : 'original'
    } else {
      if (!existsSync(BACKUP)) {
        copyFileSync(ARTIFACT, BACKUP)
        report.backup = 'created'
      }
      const { text: next, changed } = patchArtifact(text)
      if (changed) writeFileSync(ARTIFACT, next)
      report.artifact = changed ? 'patched' : 'unchanged'
    }
  }
}

// 一致性检查：源码与产物必须同向。
if (mode === 'check' && report.source && report.artifact) {
  if (report.source !== report.artifact) {
    report.warning = '源码与产物不一致：下次重建会覆盖产物，请先应用源码补丁'
  }
}

console.log(JSON.stringify({ mode, repo: REPO, ...report }, null, 1))
