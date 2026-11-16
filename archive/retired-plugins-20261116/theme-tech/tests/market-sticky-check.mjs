/**
 * 插件市场（dsh-market）在设置弹窗内的可读性门禁。
 *
 * 锁死两条用户实测反馈的修复，并各带一条负向对照：
 *   缺陷一：任务悬浮窗 .opPanel 透明度太高 —— 真因是市场借用会被弹窗玻璃
 *           规则改写的 --dsw-alias-bg-layer-1，必须改走 bg-overlay。
 *   缺陷二：上滑时筛选区 .stickyHead 透明度太高 —— 真因是吸顶态永不触发
 *           （宿主不输出 stuck 标记），必须由 market-sticky.ts 补出 data-stuck。
 */
import fs from 'node:fs'
import assert from 'node:assert'
import path from 'node:path'

const here = import.meta.dirname
const indexSrc = fs.readFileSync(path.join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const stickySrc = fs.readFileSync(path.join(here, '..', 'src', 'client', 'market-sticky.ts'), 'utf8')
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

console.log('=== A. 缺陷一：任务悬浮窗 .opPanel 不再借用会被改写的 layer token ===')

const opPanelRule = indexSrc.match(
  /body\[data-ds-custom-theme="sequoia"\] \[data-dsh-market-root\] \[class\*="opPanel"\][\s\S]*?\{([^}]+)\}/,
)
check('存在 .opPanel 的 sequoia 门控规则', opPanelRule !== null)
check(
  '.opPanel 背景改走 --dsw-alias-bg-overlay（近实心浮层档）',
  opPanelRule !== null && opPanelRule[1].includes('--dsw-alias-bg-overlay'),
)
// 负向对照：绝不能继续用 layer-1 —— 弹窗内它已被玻璃规则改写成 0.36。
check(
  '负向对照：.opPanel 不得直接使用 --dsw-alias-bg-layer-1 作主背景',
  !/\[class\*="opPanel"\][\s\S]{0,120}?background:\s*var\(--dsw-alias-bg-layer-1/.test(indexSrc),
)
check(
  '.opPanel 规则带 sonoma 门控（两个玻璃主题都要修）',
  /body\[data-ds-custom-theme="sonoma"\] \[data-dsh-market-root\] \[class\*="opPanel"\]/.test(indexSrc),
)

console.log('\n=== B. 缺陷二：吸顶筛选区 .stickyHead ===')

// 两态设计必须保留：未吸顶 transparent，吸顶才给填充。
// 规则是分组选择器（sequoia 与 sonoma 两行共用一个大括号），故匹配到 `{` 为止。
const idleRule = indexSrc.match(
  /body\[data-ds-custom-theme="sequoia"\] \[data-dsh-market-root\] \[class\*="stickyHead"\][^{]*\{([^}]+)\}/,
)
check('存在未吸顶态规则', idleRule !== null)
check(
  '未吸顶态保持 transparent（不得新增可见色带）',
  idleRule !== null && /background:\s*transparent\s*!important/.test(idleRule[1]),
)
check(
  '未吸顶态带 sonoma 门控（两个玻璃主题都要修）',
  // 分组选择器的最后一行以 `{` 结尾，中间行以 `,` 结尾，两种写法都算命中。
  /body\[data-ds-custom-theme="sonoma"\] \[data-dsh-market-root\] \[class\*="stickyHead"\]\s*[,{]/.test(indexSrc),
)

const stuckRule = indexSrc.match(
  /body\[data-ds-custom-theme="sequoia"\] \[data-dsh-market-root\] \[class\*="stickyHead"\]\[data-stuck="true"\][^{]*\{([^}]+)\}/,
)
check('存在吸顶激活态规则', stuckRule !== null)
check(
  '吸顶态填充走 token 而非写死主题色',
  stuckRule !== null && stuckRule[1].includes('--dsw-alias-bg-overlay'),
)
check(
  '吸顶态 ::before 同步上色（堵住上方 14px 漏字缝）',
  /\[class\*="stickyHead"\]\[data-stuck="true"\]::before \{[\s\S]{0,120}?background:\s*inherit/.test(indexSrc),
)
// 负向对照：吸顶态的 ::before 绝不能是 transparent —— 那正是「漏字缝」的来源。
check(
  '负向对照：吸顶态 ::before 不得为 transparent',
  !/\[data-stuck="true"\]::before \{[\s\S]{0,160}?background:\s*transparent/.test(indexSrc),
)

console.log('\n=== C. stuck 标记必须真的会被补出（否则吸顶态永不触发） ===')
check('market-sticky.ts 存在', stickySrc.length > 0)
check('补丁写入 data-stuck 属性', stickySrc.includes("setAttribute('data-stuck', 'true')"))
check('未吸顶时清除标记（可回到透明态）', stickySrc.includes("removeAttribute('data-stuck')"))
check(
  '判据来自宿主哨兵节点的几何关系（不猜类名/偏移量）',
  stickySrc.includes('previousElementSibling') && stickySrc.includes('getBoundingClientRect'),
)
check(
  '滚动路径同步判定（吸顶态必须与滚动同帧生效，不得晚一帧穿透）',
  /const onScroll = \(\): void => \{ syncStuck\(\) \}/.test(stickySrc)
    && /addEventListener\('scroll', onScroll, \{ capture: true/.test(stickySrc),
)
check(
  '负向对照：滚动监听不得回落到 rAF 节流（会晚一帧）',
  !/addEventListener\('scroll', schedule/.test(stickySrc),
)
check('随 fiber 释放（返回 disposer 且移除监听）', stickySrc.includes('removeEventListener') && stickySrc.includes('observer.disconnect()'))
check('已在 index.ts 中挂载为 ctx.effect', /initMarketStickySync\(\)[\s\S]{0,80}market sticky head state/.test(indexSrc))

console.log('\n=== D. 主题门控：不得污染其余 4 个主题（§1.5 材质适用范围） ===')
for (const id of ['void', 'jade', 'solar', 'parchment']) {
  const leaked = new RegExp(
    `body\\[data-ds-custom-theme="${id}"\\] \\[data-dsh-market-root\\]`,
  ).test(indexSrc)
  check(`范围：${id} 未被施加市场材质规则`, !leaked)
}

console.log('\n=== E. 构建产物 ===')
check('产物含 opPanel 规则', bundle.includes('opPanel'))
check('产物含 data-stuck 规则', bundle.includes('data-stuck'))
check('产物含 bg-overlay 回退', bundle.includes('--dsw-alias-bg-overlay'))
check('产物含吸顶同步器（setAttribute data-stuck）', bundle.includes("data-stuck"))

console.log('\n=== 负向对照（证明判据有牙齿） ===')
// 若把 opPanel 改回 layer-1，A 组必须失败。
check(
  '负向对照：opPanel 用 layer-1 时本门禁会报错',
  !/\[class\*="opPanel"\] \{[\s\S]{0,120}?background:\s*var\(--dsw-alias-bg-layer-1/.test(indexSrc),
)
// 若删掉吸顶同步器，C 组必须失败。
check(
  '负向对照：无同步器时 data-stuck 永不出现',
  stickySrc.includes('data-stuck'),
)

console.log('')
if (failed > 0) {
  console.log(`${failed} 项失败`)
  process.exit(1)
}
console.log('PASS: market-sticky-check 全部通过')
