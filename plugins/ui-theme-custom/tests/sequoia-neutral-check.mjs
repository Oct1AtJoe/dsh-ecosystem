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

console.log('\n=== B. 接缝叠加清零（色差根因） ===')
check('token: bg-app-image 关闭壁纸光晕', /'--dsw-alias-bg-app-image':\s*'none'/.test(themeSrc))
check('token: bg-base 与顶栏同色且不透明', /'--dsw-alias-bg-base':\s*'rgb\(245, 245, 247\)'/.test(themeSrc))
check('token: surface-glass-spot 归零', /'--dsw-alias-surface-glass-spot':\s*'transparent'/.test(themeSrc))
check(
  'CSS: 液态主题不再发 AppFrame 发丝高光（顶边白线根因）',
  !/body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(indexSrc),
)
check(
  'CSS: 侧边栏右缘暗线已去除',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\]\s*\{[^}]*border-right:\s*none/.test(indexSrc),
)
check(
  'CSS: 侧边栏内容层仅剩半透明填充（无白渐变/无白线）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*background:\s*rgba\(245, 245, 247, 0\.48\)[^}]*box-shadow:\s*none/.test(indexSrc),
)
check(
  'CSS: 右面板同样清理（无左缘白线）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[^}]*box-shadow:\s*none/.test(indexSrc),
)

console.log('\n=== C. 玻璃效果必须保留（去的是色差，不是玻璃） ===')
check('CSS: 侧边栏 ::before 毛玻璃仍在', /sequoia"\] \[class\*="sidebarCol"\]::before\s*\{[^}]*backdrop-filter:\s*blur\(32px\)/.test(indexSrc))
check('CSS: 输入坞毛玻璃仍在', /sequoia"\] \[class\*="InputBar_card"\]\s*\{[^}]*backdrop-filter:\s*blur\(36px\)/.test(indexSrc))
check('CSS: AI 玻璃卡片仍在', /sequoia"\] \[class\*="ChatView_column"\][^}]*backdrop-filter:\s*blur\(20px\)/.test(indexSrc))
check('token: glass-blur 未被删除', themeSrc.includes("'--dsw-alias-glass-blur': 'blur(48px) saturate(200%)'"))
check('token: 半透明填充保留（非纯实色）', themeSrc.includes("'--dsw-specific-sidebar-fill': 'rgba(245, 245, 247, 0.45)'"))

console.log('\n=== D. 顶栏分割线：仅液态透明 ===')
check('液态 line=transparent（产物）', /line:\s*"transparent"/.test(bundle))
check(
  '其余主题仍有非透明 line（未被连带清空）',
  /sonoma[\s\S]{0,200}?line:\s*"rgba\(/.test(bundle),
)
const shellHtml = readFileSync(join(here, '..', '..', '..', 'desktop', 'src', 'shell.html'), 'utf8')
check('壳消费 tb.line → --line', /if \(tb\.line\) write\('--line'/.test(shellHtml))
check('#titlebar 读 var(--line)', shellHtml.includes('border-bottom: 0.5px solid var(--line)'))

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
