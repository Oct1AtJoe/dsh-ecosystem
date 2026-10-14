/**
 * 图谱分支列宽推导自检。
 *
 * 背景：分支列原先硬编码 64px，`point-co-10-12-17:05` 这类较长分支名被截成
 * `point-co-…`（用户实测反馈）。这里锁定修复后的不变量：
 *
 * - 宽面板（审查页主区域）下，常见长分支名必须**完整显示**，不得出现 `…`；
 * - 窄侧栏下分支列不得超过净宽 30%，避免把提交列（主内容）挤没；
 * - 任何情况下列宽不小于 64px，保证列头「分支」可读。
 *
 * 用真实实现而非复制逻辑，避免自检与实现漂移。
 * 运行：npx esbuild scripts/test-branch-width.ts --bundle --platform=node --format=esm | node --input-type=module
 */
import { branchColumnWidth } from '../src/client/Panel.tsx'

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

/** 与 Panel.tsx 内 fitByWidth 同一估算规则，用于判断名字是否会显示省略号。 */
function rendered(text: string, maxWidth: number): string {
  let w = 0
  for (let i = 0; i < text.length; i += 1) {
    w += text.charCodeAt(i) > 255 ? 12 : 6.5
    if (w > maxWidth) return `${text.slice(0, i)}…`
  }
  return text
}

const LONG = 'point-co-10-12-17:05'
const LONGER = 'origin/point-co-10-12-17:05'
const tips = { main: 'a', 'dev-f3': 'b', 'origin/main': 'c', [LONG]: 'd', [LONGER]: 'e' }

// ---- 宽面板：审查页主区域（约 700px 起）----
for (const panelWidth of [700, 900, 1100, 1500]) {
  const usable = Math.max(240, panelWidth - 16)
  const bw = branchColumnWidth(tips, usable)
  const shown = rendered(LONG, bw - 6)
  check(`面板 ${panelWidth}px：长分支名 ${LONG} 完整显示`, shown === LONG, `列宽 ${bw}px，实显 ${shown}`)
  check(`面板 ${panelWidth}px：更长的 ${LONGER} 完整显示`, rendered(LONGER, bw - 6) === LONGER, `列宽 ${bw}px`)
  check(`面板 ${panelWidth}px：列宽不小于 64px`, bw >= 64, String(bw))
}

// ---- 窄侧栏：必须让位给提交列 ----
for (const panelWidth of [300, 400]) {
  const usable = Math.max(240, panelWidth - 16)
  const bw = branchColumnWidth(tips, usable)
  const cap = Math.max(64, Math.floor(usable * 0.3))
  check(`面板 ${panelWidth}px：分支列不超过净宽 30%`, bw <= cap, `列宽 ${bw}px，上限 ${cap}px`)
  check(`面板 ${panelWidth}px：提交列仍有可用空间`, usable - 52 - 6 - bw - 72 > 0, String(usable - 52 - 6 - bw - 72))
}

// ---- 短分支名不该撑出多余宽度 ----
const shortTips = { main: 'a', 'dev-f3': 'b' }
const shortWidth = branchColumnWidth(shortTips, 1500)
check('只有短分支名时列宽保持紧凑（64px 下限）', shortWidth === 64, String(shortWidth))

// ---- 无分支（空 tips）不得抛异常 ----
check('空 tips 返回下限 64px', branchColumnWidth({}, 1000) === 64)

console.log('\n分支列宽自检完成。')
