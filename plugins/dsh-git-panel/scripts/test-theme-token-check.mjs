/**
 * 主题令牌门禁：锁住「git 面板跟随 dsh-theme-tech 等自定义主题」的三条不变式。
 *
 * 背景：Panel.tsx 原先把 --bg/--fg/--panel-bg 等 9 个变量硬编码成 #ffffff / #f6f8fa，
 * 再由于 .dsh-gp 自带 background:var(--bg)，把主题在 [data-sidebar-right-panel] 上画的
 * 玻璃层整块盖死 —— 主题看起来「没生效」。修法是变量改「令牌优先 + 原色兜底」，
 * 并在自定义主题下让壳透明。
 *
 * 这三处都属于「改了容易、回退也容易」的细节（一次卡顿的复制粘贴就能退回硬编码），
 * 所以用源文件不变量锁住。
 *
 * 运行（从插件根目录）：node scripts/test-theme-token-check.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
let failed = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) failed += 1
}

const read = (rel) => readFileSync(join(root, rel), 'utf8')

/** 递归收集 src/client 下所有 .ts/.tsx 源码。 */
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/u.test(name)) out.push(full)
  }
  return out
}

const panel = read('src/client/Panel.tsx')
const files = walk(join(root, 'src/client'))
const all = files.map((f) => readFileSync(f, 'utf8')).join('\n')

// ---- 1. Panel.tsx 必须真的消费令牌（防退回硬编码） ----
const panelTokens = (panel.match(/var\(\s*--dsw-/gu) ?? []).length
check('Panel.tsx 消费 --dsw-* 令牌', panelTokens >= 15, `${panelTokens} 处`)

// ---- 2. 五个核心变量必须是「令牌优先」形态 ----
for (const [name, token] of [
  ['--bg', '--dsw-alias-bg-base'],
  ['--fg', '--dsw-alias-label-primary'],
  ['--muted', '--dsw-alias-label-caption'],
  ['--border', '--dsw-alias-border-l1'],
  ['--accent', '--dsw-alias-brand-primary'],
  ['--hover', '--dsw-alias-interactive-bg-hover'],
  ['--danger', '--dsw-alias-state-error-primary'],
  ['--panel-bg', '--dsw-alias-bg-layer-2'],
]) {
  check(
    `${name} 走 ${token}（带原色兜底）`,
    new RegExp(`${name}\\s*:\\s*var\\(\\s*${token}\\s*,`, 'u').test(panel),
  )
}

// ---- 3. 宿主 / 主题都不存在的令牌名一律禁止 ----
// 这些是历史上写错的名字，会静默掉进兜底色，等于主题永远不生效。
// 正名对照：layer2→layer-2、bg-hover→interactive-bg-hover、
//          status-danger→state-error-primary、color-brand→brand-primary、
//          border-secondary→border-l2、fill-hover→interactive-bg-hover、
//          fill-active→interactive-bg-active、font-mono→（宿主未定义，用系统栈）
const BANNED = [
  '--dsw-alias-bg-layer2',
  '--dsw-alias-bg-hover',
  '--dsw-alias-status-danger',
  '--dsw-alias-color-brand',
  '--dsw-alias-border-secondary',
  '--dsw-alias-fill-hover',
  '--dsw-alias-fill-active',
  '--dsw-font-mono',
]
for (const banned of BANNED) {
  check(`未引用未定义令牌 ${banned}`, !all.includes(banned))
}

// ---- 4. 自定义主题下壳必须透明，否则玻璃层被整块盖死 ----
check(
  '自定义主题下 .dsh-gp 壳透明',
  /body\[data-ds-custom-theme\]\s+\.dsh-gp\s*\{\s*background:\s*transparent/u.test(panel),
)
// 负向对照：透明规则必须限定在 data-ds-custom-theme 下。
// 若无条件写成 .dsh-gp{background:transparent}，内置 light/dark 用户会丢底色。
check(
  '壳透明规则不得漏掉主题门控（内置深浅色不受影响）',
  !/^\.dsh-gp\s*\{[^}]*background:\s*transparent/mu.test(panel),
)

// ---- 4b. 面板内唯一大面积阅读块（变更 diff 预览）不得用实色底色 ----
// 壳透明后，若这里仍是 var(--bg) 实色，会在玻璃面板里糊出一块死色补丁。
check(
  '自定义主题下变更 diff 预览改为半透明底衬',
  /body\[data-ds-custom-theme\]\s+\.dsh-gp-changes-pre\s*\{[^}]*color-mix\([^)]*var\(--panel-bg\)/u.test(panel),
)

// ---- 5. 图谱 lane 调色板是数据可视化色，必须保持硬编码（不跟主题走） ----
check(
  '图谱 lane 调色板保持独立硬编码',
  /--dsh-gp-lane-0:\s*#[0-9a-f]{6}/iu.test(panel),
)

console.log(failed === 0 ? '\n所有令牌断言通过' : `\n${failed} 条断言失败`)
process.exitCode = failed === 0 ? 0 : 1
