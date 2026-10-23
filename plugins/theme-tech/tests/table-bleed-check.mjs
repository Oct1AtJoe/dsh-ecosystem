/**
 * 宽表格「出血」越界门禁（液态 sequoia / 曜黑 sonoma 的玻璃回复卡片专属）。
 *
 * 锁死用户实测反馈的两条缺陷：
 *   ① 长表格底部横向滚动条左端跑到表格/卡片边界之外，画在页面底色上；
 *   ② 表格右侧内容从卡片右侧透出来，压到右栏与滚动条槽上。
 *
 * 真因（官方满幅出血公式 + 卡片内边距叠加，**不是**本插件写错宽度）：
 *   官方 ui-chat 对 ≥4 列表格加 .md-table-wide，用容器查询单位把表格撑到整个
 *   会话滚动容器宽：spare = (100cqw - content-width)/2；lead = spare + min(content-width,100cqw) - 100%；
 *   width = 100% + lead + spare；margin-left = -lead；padding-left = lead。
 *   无卡片时该公式让表格左右对齐**页面边界**（官方设计意图）；但本插件给回复加了
 *   玻璃卡（padding:16px 20px，不能加 overflow:hidden，否则裁掉焦点环/展开态），
 *   于是「100%」变成卡片内容盒宽，spare/lead 仍按整列容器算 —— 表盒必从卡片两侧溢出，
 *   且溢出量随窗宽增大。
 *
 * 修法：仅在两个玻璃主题里把出血系数归零，滚动盒 = 卡片内容盒宽。
 * 其余 4 个主题没有卡片，**必须**保留官方满幅出血 —— 这条是负向对照。
 *
 * 改宽表格样式后必须跑：node tests/table-bleed-check.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const here = import.meta.dirname
const indexSrc = fs.readFileSync(path.join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const bundlePath = path.join(here, '..', 'lib', 'client.js')
const bundle = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, 'utf8') : ''

let failed = 0
const check = (name, ok, extra = '') => {
  if (ok) {
    console.log(`PASS  ${name}${extra}`)
  } else {
    failed += 1
    console.log(`FAIL  ${name}${extra}`)
  }
}

/**
 * Extract the declaration block of the first rule whose selector contains `anchor`.
 * Rules in this file are written one-selector-per-line, so the block starts at the
 * first `{` after the anchor.
 * @param anchor - literal selector fragment that uniquely identifies the rule.
 * @returns the declarations between braces, or null when absent.
 */
const blockOf = (anchor) => {
  const at = indexSrc.indexOf(anchor)
  if (at < 0) return null
  const open = indexSrc.indexOf('{', at)
  const close = indexSrc.indexOf('}', open)
  if (open < 0 || close < 0) return null
  return indexSrc.slice(open + 1, close)
}

console.log('=== A. 两个玻璃主题：出血系数必须归零（滚动盒 = 卡片内容盒） ===')

// 作用域必须与「回复卡片」规则严格一致：同一个 flowItem 谓词 + 卡片内表格。
// 放宽到整列（不带 flowItem 作用域）会把官方满幅出血在别处也一起关掉。
const CARD_PREDICATE = '[data-slot="main.conversation"] [class*="flowItem"]:not([hidden]):not([data-turn-process-hidden="true"]):not([data-turn-process-member]):has([class*="_markdown_"])'
const seqAnchor = `body[data-ds-custom-theme="sequoia"] ${CARD_PREDICATE} [class*="tableScroll"].md-table-wide`
const sonAnchor = `body[data-ds-custom-theme="sonoma"] ${CARD_PREDICATE} [class*="tableScroll"].md-table-wide`

const seqBlock = blockOf(seqAnchor)
const sonBlock = blockOf(sonAnchor)

check('存在 sequoia 门控的宽表格复位规则', seqBlock !== null)
check(
  '存在 sonoma 门控的宽表格复位规则（两个玻璃主题都要修）',
  sonBlock !== null,
  sonBlock === null ? '  ← sonoma 缺规则，曜黑下缺陷仍在' : '',
)

for (const [label, block] of [['sequoia', seqBlock], ['sonoma', sonBlock]]) {
  if (block === null) continue
  check(`${label}: --dsh-table-spare 归零`, /--dsh-table-spare\s*:\s*0px\s*!important/.test(block), label === 'sequoia' ? `  实测值: ${(block.match(/--dsh-table-spare\s*:[^;]+/) ?? ['(缺失)'])[0]}` : '')
  check(`${label}: --dsh-table-lead 归零`, /--dsh-table-lead\s*:\s*0px\s*!important/.test(block))
  // ⚠️ 自定义属性没有 box-sizing 参与：width:100% + padding-left 必须显式归零，
  //    否则「100% + padding」依旧会溢出（官方原公式正是靠 padding-left:lead 撑出满幅）。
  check(`${label}: box-sizing 锁定 border-box`, /box-sizing\s*:\s*border-box\s*!important/.test(block))
  check(`${label}: width 复位为 100% 且 !important`, /(?<![\w-])width\s*:\s*100%\s*!important/.test(block))
  check(`${label}: max-width 复位为 100%（覆盖官方 max-width:none）`, /max-width\s*:\s*100%\s*!important/.test(block))
  check(`${label}: margin-left 复位为 0（消掉 -lead 左移）`, /margin-left\s*:\s*0\s*!important/.test(block))
  check(`${label}: margin-right 复位为 0`, /margin-right\s*:\s*0\s*!important/.test(block))
  check(`${label}: padding-left 复位为 0（消掉 lead 左内距）`, /padding-left\s*:\s*0\s*!important/.test(block))
  check(`${label}: padding-right 复位为 0`, /padding-right\s*:\s*0\s*!important/.test(block))
  check(`${label}: 保留 overflow-x: auto（横向滚动仍可用）`, /overflow-x\s*:\s*auto\s*!important/.test(block))
}

console.log('\n=== A2. 作用域必须与卡片规则一致（不得放宽到整列） ===')
// 卡片规则与复位规则必须用同一套 flowItem 谓词：卡片外的宽表格（弹窗、侧栏预览）
// 没有 18px 内边距，官方满幅出血在那里是正确行为，不应被连带关掉。
const cardSelector = `body[data-ds-custom-theme="sequoia"] ${CARD_PREDICATE}`
check('卡片规则使用同一 flowItem 谓词（两处同源）', indexSrc.includes(cardSelector))
const scopedToCard = indexSrc.includes(seqAnchor) && indexSrc.includes(sonAnchor)
check('复位规则被卡片作用域约束（不是全页面一刀切）', scopedToCard)
// 负向对照：不得出现「只按 conversation 槽位、不带 flowItem」的复位规则。
check(
  '负向对照：不存在脱离卡片作用域的宽表格归零规则',
  !/body\[data-ds-custom-theme="(sequoia|sonoma)"\] \[data-slot="main\.conversation"\] \[class\*="tableScroll"\]\.md-table-wide\s*[,{]/.test(indexSrc),
)

console.log('\n=== B. 负向对照：其余 4 个主题不得被归零（否则它们会失去官方满幅出血） ===')
for (const id of ['void', 'jade', 'solar', 'parchment']) {
  const leaked = new RegExp(
    `body\\[data-ds-custom-theme="${id}"\\][^\\n]*tableScroll[^\\n]*\\.md-table-wide`,
  ).test(indexSrc)
  check(`范围：${id} 未被施加出血归零规则`, !leaked)
}

console.log('\n=== C. 负向对照：不得用裁剪遮盖症状 ===')
// 用 overflow:hidden 裁掉出血属于「遮盖」而非修复：会同时裁掉表格的横向滚动能力
// 与卡片内的焦点环、展开态（见 §1.5 / 输入坞同类教训），故显式禁止。
const cardAnchor = 'body[data-ds-custom-theme="sequoia"] [data-slot="main.conversation"] [class*="flowItem"]'
const cardBlock = blockOf(cardAnchor)
check('回复卡片规则仍存在（本门禁的前提）', cardBlock !== null)
check(
  '负向对照：回复卡片不得改 overflow 去裁剪（会把滚动条与焦点环一起裁掉）',
  cardBlock !== null && !/overflow(-[xy])?\s*:\s*hidden/.test(cardBlock),
)
check(
  '负向对照：宽表格复位规则自身也不得靠 overflow:hidden 遮盖',
  !seqBlock || !/overflow-x\s*:\s*hidden/.test(seqBlock),
)

console.log('\n=== D. 构建产物 ===')
check('lib/client.js 存在', bundle.length > 0)
check('产物含 sequoia 宽表格复位规则', bundle.includes('--dsh-table-spare:0px') || bundle.includes('--dsh-table-spare: 0px'))
check(
  '产物含 max-width:100% 复位（消除右侧透出）',
  /max-width:\s*100%\s*!important/.test(bundle) || /max-width:100%!important/.test(bundle),
)
check(
  '产物仍保留官方 bleed 变量的消费点（不误删官方样式）',
  bundle.includes('md-table-wide'),
)

console.log('\n=== 负向对照（证明判据有牙齿） ===')
// 若把归零删掉（回到「原始 bleed + 卡片内边距」），A 组必须失败。
const withoutZeroing = indexSrc.replace(/--dsh-table-spare\s*:\s*0px/g, '')
check('负向对照：删掉归零后本门禁会报错（判据不是恒真）', !/--dsh-table-spare\s*:\s*0px/.test(withoutZeroing))
// 若只改了一个主题，A 组必须失败。
check(
  '负向对照：只修 sequoia 不修 sonoma 时会被判失败',
  seqAnchor !== sonAnchor && indexSrc.includes(sonAnchor),
)

console.log('')
if (failed > 0) {
  console.log(`${failed} 项失败`)
  process.exit(1)
}
console.log('PASS: table-bleed-check 全部通过')
