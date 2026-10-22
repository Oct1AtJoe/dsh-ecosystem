/**
 * 浮层可读性门禁：回答选择面板 + 右栏 diff 面板。
 *
 * 两条用户实测反馈的修复，各带负向对照：
 *   缺陷一：回答选择面板透明度太高 —— 真因是输入坞玻璃规则用
 *           [class$="_card"] 锚定，把回答面板（类名同样以 _card 结尾、
 *           同样挂在 composerSeat 内）一起命中，0.93 被覆盖成 0.38。
 *           修法：改用官方输入坞自带的 [data-composer-card] 属性锚定。
 *   缺陷二：文件 diff 悬浮面板透明度太高 —— 真因是右栏面板在 fullscreen 态
 *           （data-sidebar-right-panel="fullscreen"）铺满视口压在对话上，
 *           0.68 填充让正文与 diff 叠印。修法：fullscreen 态改实心。
 */
import fs from 'node:fs'
import assert from 'node:assert'
import path from 'node:path'

const here = import.meta.dirname
const indexSrc = fs.readFileSync(path.join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const bundle = fs.readFileSync(path.join(here, '..', 'lib', 'client.js'), 'utf8')

let failed = 0
const check = (name, ok, extra = '') => {
  if (ok) {
    console.log(`PASS  ${name}${extra}`)
  } else {
    failed += 1
    console.log(`FAIL  ${name}${extra}`)
  }
}

// 注入的 CSS 整体是一段模板字符串，注释里也会提到旧选择器。
// 门禁必须只检查**真实规则**，故先剥掉 CSS 注释再匹配。
const stripCssComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
const css = stripCssComments(indexSrc)

console.log('=== A. 缺陷一：输入坞玻璃规则不得再误伤回答选择面板 ===')

// 回答面板与输入坞都挂在 composerSeat 内，类名都以 _card 结尾。
// 唯一可靠的判据是官方 InputBar 自带的 data-composer-card 属性。
check(
  '输入坞玻璃规则已改用 [data-composer-card] 锚定',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="composerSeat"\] \[data-composer-card\][^{]*\{/.test(indexSrc),
)
check(
  '两个玻璃主题都改用 data-composer-card',
  /body\[data-ds-custom-theme="sonoma"\] \[class\*="composerSeat"\] \[data-composer-card\][^{]*\{/.test(indexSrc),
)
// 负向对照：composerSeat 作用域内不得再出现 [class$="_card"] 通配。
// 该通配会命中回答面板的 H0yVCG_card。
const wildcards = css.match(/\[class\*="composerSeat"\][^{,]*\[class\$="_card"\]/g) ?? []
check(
  '负向对照：composerSeat 作用域内不再有 [class$="_card"] 通配',
  wildcards.length === 0,
  wildcards.length ? `  残留 ${wildcards.length} 处: ${wildcards.slice(0, 2).join(' | ')}` : '',
)
check(
  '负向对照：产物 bundle 内不再有 composerSeat + [class$="_card"] 组合',
  !/composerSeat"\]\s*\[class\$="_card"\]/.test(stripCssComments(bundle)),
)
// 回答面板自身的填充必须还在（未被任何规则改写）
check(
  '回答面板的输入坞级填充未被主题改写（仍走 --dsw-specific-input-major）',
  !/input-major\s*:\s*rgba\(255,\s*255,\s*255,\s*0\.\d+\)/.test(indexSrc),
)

console.log('\n=== B. 缺陷二：右栏 fullscreen 态必须实心（diff 面板压住对话） ===')
check(
  '存在 fullscreen 判据规则',
  /\[data-sidebar-right-panel="fullscreen"\]/.test(indexSrc),
)
check(
  'fullscreen 规则带 :not([aria-hidden="true"]) 守卫',
  /\[data-sidebar-right-panel="fullscreen"\]:not\(\[aria-hidden="true"\]\)/.test(indexSrc),
)
// 特异性陷阱：通栏规则带 :not() 是 (0,4,1)；fullscreen 规则若不带就是 (0,3,1)，
// 即使写在后面也赢不了 —— 实测计算值会停在 0.68。
check(
  '负向对照：fullscreen 规则不得漏掉 :not() 守卫（否则特异性不够，源序也救不了）',
  !/\[data-sidebar-right-panel="fullscreen"\]\s*\{/.test(indexSrc),
)
check(
  'fullscreen 态使用不透明底色（rgb 实色，非 rgba 半透）',
  /\[data-sidebar-right-panel="fullscreen"\]:not\(\[aria-hidden="true"\]\)\s*\{[\s\S]{0,400}?rgb\(245,\s*245,\s*247\)\s*!important/.test(indexSrc),
)
// push 态必须保持半透明玻璃侧栏（设计意图，不能一起改成实心）
check(
  'push 态保持半透明（0.68 玻璃侧栏是设计意图）',
  /\[data-sidebar-right-panel\]:not\(\[aria-hidden="true"\]\)\s*\{[\s\S]{0,500}?rgba\(245,\s*245,\s*247,\s*0\.68\)\s*!important/.test(indexSrc),
)
check(
  '负向对照：push 态不得被改成实心',
  !/\[data-sidebar-right-panel\]:not\(\[aria-hidden="true"\]\)\s*\{[\s\S]{0,500}?rgb\(245,\s*245,\s*247\)\s*!important/.test(indexSrc),
)

console.log('\n=== C. 主题门控：只限两个玻璃主题 ===')
for (const id of ['void', 'jade', 'solar', 'parchment']) {
  const leaked = new RegExp(
    `body\\[data-ds-custom-theme="${id}"\\][^\\n]*(data-composer-card|data-sidebar-right-panel="fullscreen")`,
  ).test(indexSrc)
  check(`范围：${id} 未被施加新材质规则`, !leaked)
}

console.log('\n=== D. 构建产物 ===')
check('产物含 data-composer-card 规则', bundle.includes('data-composer-card'))
check('产物含 fullscreen 规则', bundle.includes('data-sidebar-right-panel="fullscreen"'))
check('产物含 :not 守卫', bundle.includes('data-sidebar-right-panel="fullscreen"]:not([aria-hidden="true"])'))

console.log('\n=== 负向对照（证明判据有牙齿） ===')
// 若把锚定改回 [class$="_card"]，A 组必须失败。
check(
  '负向对照：改回 [class$="_card"] 时本门禁会报错',
  !/\[class\*="composerSeat"\][^{,]*\[class\$="_card"\]/.test(css),
)
// 若把 fullscreen 的 :not() 守卫去掉，B 组必须失败。
check(
  '负向对照：去掉 :not() 守卫时本门禁会报错',
  !/\[data-sidebar-right-panel="fullscreen"\]\s*\{/.test(indexSrc),
)

console.log('')
if (failed > 0) {
  console.log(`${failed} 项失败`)
  process.exit(1)
}
console.log('PASS: panel-opacity-check 全部通过')
