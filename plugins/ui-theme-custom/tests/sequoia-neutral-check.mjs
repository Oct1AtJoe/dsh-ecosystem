// 液态主题（sequoia）纯色化与接缝消隐的产物级门禁。
//
// 背景：用户反馈「顶栏 / 两个侧边栏 / 主页面之间能看出分界」。实测确认真因是
// **色差而非线条** —— 任何叠加在 bg-base 之上的白色径向、白色渐变或白色发丝
// 都会让该区域比顶栏亮 1~3 阶；大面积纯色相邻时，人眼会把色阶跳变读成一条线。
//
// 因此本门禁锁死三条不变式：
//   A. 液态主题不发任何彩色（暖金/紫/粉）；
//   B. 液态主题的发丝/高光叠加必须清零（AppFrame 顶边、侧边栏右缘、右面板左缘）；
//   C. 玻璃属性（backdrop-filter + 半透明填充）必须保留 —— 去的是色差不是玻璃。
//
// 运行：node plugins/ui-theme-custom/tests/sequoia-neutral-check.mjs
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const bundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const themeSrc = readFileSync(join(here, '..', 'src', 'client', 'sequoia.ts'), 'utf8')
const indexSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const profile = 'C:/Users/Administrator/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-client-ui-theme-custom/lib/client.js'

let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : extra}`)
}

/** 取 sequoia 专属 CSS 规则块（模板串里 body[data-ds-custom-theme="sequoia"] 起）。 */
const seqRules = (() => {
  const out = []
  const re = /body\[data-ds-custom-theme="sequoia"\][^{]*\{[^}]*\}/g
  let m
  while ((m = re.exec(indexSrc)) !== null) out.push(m[0])
  return out.join('\n')
})()

console.log('=== A. 彩色清零（两处来源都要查） ===')
const colors = [
  ['暖金 255,168,108', '255, 168, 108'],
  ['紫 130,108,255', '130, 108, 255'],
  ['粉 255,120,148', '255, 120, 148'],
  ['蓝紫 80,100,210', '80, 100, 210'],
  ['橙 255,140,110', '255, 140, 110'],
  ['黄 255,210,110', '255, 210, 110'],
]
for (const [name, needle] of colors) {
  check(`token 文件无 ${name}`, !themeSrc.includes(needle))
  check(`注入 CSS 无 ${name}`, !seqRules.includes(needle))
}

console.log('\n=== B. 无光晕 / 竖向分界线保留（色差根因） ===')
check('token: bg-app-image 关闭壁纸光晕（不要光晕）', /'--dsw-alias-bg-app-image':\s*'none'/.test(themeSrc))
check('token: bg-base 与顶栏同色且不透明', /'--dsw-alias-bg-base':\s*'rgb\(245, 245, 247\)'/.test(themeSrc))
check('token: surface-glass-spot 归零（不要光斑）', /'--dsw-alias-surface-glass-spot':\s*'transparent'/.test(themeSrc))
check(
  'CSS: 液态主题不发 AppFrame 发丝高光（顶边白线根因）',
  !/body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(indexSrc),
)
check(
  'CSS: 左侧栏竖向分界线保留（用户明确要求）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\]\s*\{[^}]*border-right:\s*0\.5px solid/.test(indexSrc),
)
check(
  'CSS: 侧边栏内容层为半透明填充 + 顶部同色融合屏障（到 --dsh-fusion-top）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*rgb\(245, 245, 247\) var\(--dsh-fusion-top[^}]*rgba\(245, 245, 247, 0\.66\)/.test(indexSrc),
)
// 实测坑（截图定位到 y≈44 白线）：侧边栏内容层的 inset 白色内高光会画在
// 内容层顶部，即壳顶栏正下方，在纯色底上表现为一条横贯白线。必须保持 none。
check(
  'CSS: 侧边栏内容层严禁 inset 白色内高光（y=44 白线根因）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*box-shadow:\s*none/.test(indexSrc),
)
check(
  '融合：内容区顶部同色屏障使用 --dsh-fusion-top（与壳 TITLEBAR_HEIGHT 同步）',
  /--dsh-fusion-top:\s*44px/.test(indexSrc)
    && /var\(--dsh-fusion-top, 44px\)/.test(indexSrc),
)

console.log('\n=== C. 玻璃强度（去的是光晕与彩色，不是玻璃） ===')
check('token: glass-blur 提升到 64px（强化）', themeSrc.includes("'--dsw-alias-glass-blur': 'blur(64px) saturate(200%)'"))
check('token: surface-glass-blur 提升到 56px', themeSrc.includes("'--dsw-alias-surface-glass-blur': 'blur(56px) saturate(190%)'"))
check('token: 侧边栏填充 0.66（实而仍透，兼顾可读性）', themeSrc.includes("'--dsw-specific-sidebar-fill': 'rgba(245, 245, 247, 0.66)'"))
check('CSS: 侧边栏 ::before 毛玻璃提升到 56px', /sequoia"\] \[class\*="sidebarCol"\]::before\s*\{[^}]*backdrop-filter:\s*blur\(56px\)/.test(indexSrc))
check('CSS: 输入坞毛玻璃 64px + 填充 0.74', /sequoia"\] \[class\*="InputBar_card"\]\s*\{[^}]*background:\s*var\(--dsh-frost-noise[^}]*rgba\(255, 255, 255, 0\.74\)[^}]*backdrop-filter:\s*blur\(64px\)/.test(indexSrc))
check('CSS: AI 玻璃卡片 40px + 填充 0.80', /sequoia"\] \[class\*="ChatView_column"\][^}]*background:\s*var\(--dsh-frost-noise[^}]*rgba\(255, 255, 255, 0\.80\)[^}]*backdrop-filter:\s*blur\(40px\)/.test(indexSrc))

// ── C3. 磨砂质感（与「玻璃质感」的本质区别）──
// 「玻璃」= 透明；「磨砂」= 表面微观颗粒 + 光线漫射。
// ⚠️ 关键认知：背景是纯色时 backdrop-filter 的 blur() 模糊不出任何东西
// （模糊纯色仍是纯色），单靠 blur 永远只有通透感、没有磨砂感。
// 真磨砂必须叠加噪声纹理 —— 与 macOS NSVisualEffectView 内部做法一致。
console.log('\n=== C3. 磨砂颗粒（Frost Grain）===')
check('磨砂：噪声源已定义（SVG feTurbulence）', /--dsh-frost-noise:url\("data:image\/svg\+xml/.test(indexSrc))
check('磨砂：噪声已去色（feColorMatrix saturate=0，避免彩色噪点）', /feColorMatrix[^%]*type='saturate'[^%]*values='0'/.test(indexSrc))
check('磨砂：噪声强度克制（opacity ≤ 0.16，过高会发灰）', (() => {
  const m = indexSrc.match(/filter='url\(%23n\)'\s+opacity='([\d.]+)'/)
  return m !== null && Number(m[1]) <= 0.16
})())
for (const [name, re] of [
  ['输入坞', /sequoia"\] \[class\*="InputBar_card"\]\s*\{[^}]*var\(--dsh-frost-noise/],
  ['AI 卡片', /sequoia"\] \[class\*="ChatView_column"\][^}]*var\(--dsh-frost-noise/],
  ['侧边栏', /sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*var\(--dsh-frost-noise/],
  ['右侧面板', /sequoia"\] \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[^}]*var\(--dsh-frost-noise/],
  ['弹窗', /\[role="dialog"\]\{[^}]*var\(--dsh-frost-noise/],
]) {
  check(`磨砂：${name} 已叠加颗粒层`, re.test(indexSrc.replace(/\n/g, '')))
}
check('磨砂：噪声变量带兜底（未定义时不得让整条 background 失效）', /var\(--dsh-frost-noise, none\)/.test(indexSrc))
// 融合前提：侧边栏噪声层必须排在顶部同色屏障**之后**，否则颗粒会污染
// 顶部 44px，破坏与壳顶栏的逐字节同色。
check(
  '磨砂：侧边栏噪声排在融合屏障之后（不污染顶部 44px）',
  /\[class\*="root"\]\s*\{[\s\S]{0,220}rgb\(245, 245, 247\) var\(--dsh-fusion-top[\s\S]{0,80}var\(--dsh-frost-noise/.test(indexSrc),
)

// ── 面板不透明度下限（用户两次反馈「太透」的系统性守卫）──
// 玻璃要「实而仍透」：alpha 过低会让面板发虚、文字与底衬对比不足、边界感消失。
// 单点断言容易被逐个改动绕过，这里对整组浮层 token 做统一下限校验。
console.log('\n=== C2. 面板不透明度下限（防「太透」回归）===')
const opacityTokens = [
  ['bg-layer-1', /'--dsw-alias-bg-layer-1':\s*'rgba\(255, 255, 255, ([\d.]+)\)'/],
  ['bg-layer-2', /'--dsw-alias-bg-layer-2':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['bg-layer-3', /'--dsw-alias-bg-layer-3':\s*'rgba\(235, 235, 238, ([\d.]+)\)'/],
  ['bg-overlay', /'--dsw-alias-bg-overlay':\s*'rgba\(255, 255, 255, ([\d.]+)\)'/],
  ['sidebar-fill', /'--dsw-specific-sidebar-fill':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['selector', /'--dsw-specific-selector':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['tip', /'--dsw-specific-tip':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['bubble', /'--dsw-specific-bubble':\s*'rgba\(255, 255, 255, ([\d.]+)\)'/],
]
for (const [name, re] of opacityTokens) {
  const m = themeSrc.match(re)
  const val = m ? Number(m[1]) : null
  // 下限 0.6：低于此值在实测中被判定为「发虚、可读性不足」
  check(`下限：${name} alpha ≥ 0.6`, val !== null && val >= 0.6, `  实测=${val}`)
}
// 关键回归：本次只回调「填充不透明度」，blur 半径必须原封不动 ——
// 玻璃质感由 blur 承担，误调 blur 会把「调实一点」变成「糊成一片」。
check(
  '回归：本次仅调填充，blur 半径保持（64/56/40/48）',
  ['blur(64px)', 'blur(56px)', 'blur(40px)', 'blur(48px)'].every(k => indexSrc.includes(k)),
)
check('CSS: 弹窗毛玻璃提升到 48px', /\[role="dialog"\]\{[^}]*backdrop-filter:\s*blur\(48px\)/.test(indexSrc.replace(/\n/g, '')))
check('CSS: 侧边栏右缘无白色高光线（只保留一条中性分界）', !/sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*inset -0?\.?5?px 0 0 rgba\(255, 255, 255/.test(indexSrc))

console.log('\n=== D. 顶栏分割线：融合态全主题透明 ===')
// 方案 C（无边框融合）要求「顶栏色 == 该主题页面底色」，因此 6 个主题的
// line 必须全部 transparent（有色的线会在同色底上重新变成一条可见分界）。
check('产物：全部 6 个主题 line=transparent', (bundle.match(/line:\s*"transparent"/g) || []).length === 6)
check(
  '回归：任取一主题的顶栏 bg 必须等于其 token bg-base（融合前提）',
  (() => {
    // 抽查 sonoma / void / solar 三个曾不一致的主题
    const pairs = [
      ['sonoma', 'rgb(22, 24, 30)'],
      ['void', 'rgb(13, 13, 16)'],
      ['solar', 'rgb(18, 14, 16)'],
    ]
    return pairs.every(([id, color]) => new RegExp(`${id}[\\s\\S]{0,160}?bg:\\s*"${color.replace(/[()]/g, '\\$&')}"`).test(bundle))
  })(),
)
const shellHtml = readFileSync(join(here, '..', '..', '..', 'desktop', 'src', 'shell.html'), 'utf8')
check('壳消费 tb.line → --line', /if \(tb\.line\) write\('--line'/.test(shellHtml))
check('#titlebar 读 var(--line)', shellHtml.includes('border-bottom: 0.5px solid var(--line)'))
// 融合关键：壳顶栏严禁 backdrop-filter —— saturate() 会改变近中性灰的颜色，
// 使顶栏与内容区底产生色偏，是「看得出分家」的隐藏原因。
// 注意先剥离 CSS 注释再查：注释里会提到 backdrop-filter 这个词。
check(
  '融合：壳 #titlebar 禁用 backdrop-filter（saturate 会造成色偏）',
  (() => {
    const noComments = shellHtml.replace(/\/\*[\s\S]*?\*\//g, '')
    const m = noComments.match(/#titlebar\s*\{([^}]*)\}/)
    return m !== null && !/backdrop-filter/.test(m[1])
  })(),
)

console.log('\n=== E. profile 产物已同步 ===')
try {
  const a = statSync(join(here, '..', 'lib', 'client.js')).size
  const b = statSync(profile).size
  check('源与 profile 大小一致', a === b, `  源=${a} profile=${b}`)
  check('profile 含纯色 bg-base', readFileSync(profile, 'utf8').includes('rgb(245, 245, 247)'))
} catch (e) {
  failed++
  console.log(`FAIL  profile 产物不可读: ${e.message}`)
}

console.log('\n=== 负向对照（证明判据有牙齿） ===')
const withoutRimRemoval = indexSrc.replace(
  /body\[data-ds-custom-theme="sonoma"\] div\[class\$="_frame"\]/,
  'body[data-ds-custom-theme="sequoia"] div[class$="_frame"]',
)
check(
  '负向对照：把发丝高光加回液态主题，本门禁必须能检出',
  /body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(withoutRimRemoval)
    && !/body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(indexSrc),
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
