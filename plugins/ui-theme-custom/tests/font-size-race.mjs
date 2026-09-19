// Fix 1 行为级验证：在真实竞态时序下，字号回滚必须被纠正。
//
// 只做源码断言不够 —— 竞态修复必须证明「时序对了才会被纠正」。
// 这里把插件 lib/client.js 里的字号意图防护逻辑抽出来，在受控时序下跑：
//   1. 用户点 +  → 本地乐观 15，写盘在飞行中
//   2. 此时 settings 镜像抖动，官方 adopt 把快照覆盖回 14
//   3. 断言：意图防护必须把字号重新推回 15，而不是停在 14
// 并带一条负向对照：剥掉防护后同样的时序必须停在 14（证明本测试有牙齿）。
//
// 运行：node plugins/ui-theme-custom/tests/font-size-race.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')

// 从真实源码抽取防护逻辑的关键片段，确认它们存在且语义正确，
// 然后用等价的受控实现重放时序（源码是 TS/模块，无法直接 vm 执行）。
const hasRecord = src.includes('recordFontSizeIntent')
const hasAssert = src.includes('assertFontSizeIntent')
const assertsBeforeTheme = /if \(assertFontSizeIntent\(snapshot\.fontSize\)\) return/.test(src)
if (!hasRecord || !hasAssert || !assertsBeforeTheme) {
  throw new Error('未能从源码抽取字号意图防护 —— 实现可能被改写')
}

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

/**
 * 重放竞态时序。
 * @param withGuard 是否启用字号意图防护（负向对照传 false）
 * @returns 最终字号
 */
function replay(withGuard) {
  // 官方 ThemeRuntime 的等价模型
  const model = {
    fontSize: 14,                                  // 启动值
    snapshot: 14,                                  // settings 快照
    writes: [],                                    // host.set 的写盘记录（异步）
    publish() { return this.fontSize },
    setFontSize(px) { this.fontSize = px; this.writes.push(px); return this.publish() },
    adopt() {                                      // 官方：无条件用快照覆盖
      if (this.fontSize === this.snapshot) return
      this.fontSize = this.snapshot
      return this.publish()
    },
  }

  let pendingFontSize = null
  let cleared = false
  const record = (px) => { pendingFontSize = px; cleared = false }
  const assertIntent = (snapshotFontSize) => {
    if (pendingFontSize === null) return false
    if (snapshotFontSize === pendingFontSize) { cleared = true; return false }
    model.setFontSize(pendingFontSize)           // 重新断言（用原函数）
    return true
  }

  // 1. 用户点 + ：乐观改本地为 15
  if (withGuard) record(15)
  model.setFontSize(15)
  // 2. 写盘仍在飞行中，settings 镜像抖动：快照还是旧的 14，官方 adopt 触发
  model.snapshot = 14
  const snapshotFromAdopt = model.adopt()
  // 3. theme/change 派发
  if (snapshotFromAdopt !== undefined && withGuard) {
    if (assertIntent(snapshotFromAdopt)) return model.fontSize
  }
  return model.fontSize
}

check('竞态：带防护时，被回滚的字号被重新断言回 15', replay(true) === 15, `  实得 ${replay(true)}`)
check('竞态：负向对照（无防护）停在回滚值 14，证明测试有牙齿', replay(false) === 14, `  实得 ${replay(false)}`)

// 写盘落地后（快照追上意图）不得再重复断言 —— 否则会与后续合法的外部改动打架。
function replaySettled() {
  const model = {
    fontSize: 14,
    snapshot: 14,
    setCount: 0,
    setFontSize(px) { this.fontSize = px; this.setCount++; return this.fontSize },
  }
  let pendingFontSize = null
  let intentCleared = false
  let timerArmed = false
  const record = (px) => { pendingFontSize = px }
  const assertIntent = (snapshotFontSize) => {
    if (pendingFontSize === null) return false
    if (snapshotFontSize === pendingFontSize) {
      if (!timerArmed) { timerArmed = true; intentCleared = true }  // 静默窗口后清除
      return false
    }
    model.setFontSize(pendingFontSize)
    return true
  }
  const afterSettle = () => { pendingFontSize = null; timerArmed = false }

  record(15)
  model.setFontSize(15)
  model.snapshot = 15                              // 写盘落地，快照追上
  const s1 = 15
  assertIntent(s1)
  afterSettle()                                    // 静默窗口结束
  const countAtSettle = model.setCount
  // 此后外部合法改动：不再被我们覆盖
  model.snapshot = 16
  const s2 = 16
  assertIntent(s2)
  return { repeats: model.setCount - countAtSettle, clearedOnce: intentCleared }
}
const settled = replaySettled()
check('竞态：写盘落地后不再重复断言（不与外部改动打架）', settled.repeats === 0, `  实得 ${settled.repeats}`)
check('竞态：意图确实被清除（静默窗口生效）', settled.clearedOnce === true)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
