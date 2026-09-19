// 部署产物校验：确认 dist 里的 exe 真的包含本轮改动。
//
// 只跑源码级自检不够——签名/编码/替换任何一环出错，产物都可能退回旧行为，
// 而这类问题在源码里完全看不出来（例如 __ICON__ 占位符没被 replace、图标没嵌进去）。
import { readFileSync } from 'node:fs'

const exe = 'C:/dsh-ecosystem/desktop/dist/DeepSeekHarness.exe'
const b = readFileSync(exe)
const s = b.toString('latin1')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

// 1. 鲸鱼图标必须以 PNG 原始字节编译期嵌入（运行时才编码成 base64）。
//    注意：exe 里本就有多张 PNG（Tauri 的 128/32 图标资源），因此不能只取第一处，
//    必须按「与源码 icon.png 逐字节一致」来确认，才是我们真正嵌进去的那张。
const srcIcon = readFileSync('C:/dsh-ecosystem/desktop/src/icon.png')
const magic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
let embeddedOk = false
let scan = 0
let hits = []
while (true) {
  const at = b.indexOf(magic, scan)
  if (at < 0) break
  hits.push(at)
  scan = at + 8
}
for (const at of hits) {
  if (b.subarray(at, at + srcIcon.length).equals(srcIcon)) {
    embeddedOk = true
    break
  }
}
check(
  `产物内嵌的鲸鱼图标与 src/icon.png 逐字节一致（共 ${hits.length} 张 PNG）`,
  embeddedOk,
  embeddedOk ? '' : '  未找到与源图标一致的嵌入段',
)

// 2. 壳联动 UI 的两个入口必须在
check('产物含 __dshToggleShellMenu 入口', s.includes('__dshToggleShellMenu'))
check('产物含 __dshOpenAboutPopup 入口', s.includes('__dshOpenAboutPopup'))

// 3. 弹窗用 <img> 承载图标，而不是自绘 <svg>
check('产物弹窗用 img 承载 logo', s.includes('<img src='))
check('产物 .dsh-about-mark img 样式存在', s.includes('.dsh-about-mark img'))

// 4. 旧副标题那行必须已移除（模板里不留、样式里也不留）
check('产物不含旧副标题「Sonoma Edition」', !s.includes('Sonoma Edition'))
check('产物不含旧 dsh-about-sub 样式', !s.includes('dsh-about-sub'))

// 5. 动作回传通路仍在
check('产物含 shell-action 动作类型', s.includes('shell-action'))

// 6. 菜单文案三处一致：托盘 / 壳原生菜单 / HTML 面板都应为「关于 DSH」。
//    注意不能用 `!includes('关于 DSH 宿主版本')` 这种过宽判据 —— 脚本里的中文注释
//    仍会提到该词，会把注释误判成残留文案。只断言「用户可见的菜单项字面量」。
const utf8 = b.toString('utf8')
check('产物含新文案「关于 DSH」', utf8.includes('关于 DSH'))
check(
  '产物无用户可见的旧文案（托盘 / 壳菜单 / 面板三处字面量）',
  !utf8.includes('"tray:about", "关于 DSH 宿主版本"')
    && !utf8.includes('"shell:about", "关于 DSH 宿主版本"')
    && !utf8.includes('data-action="about">关于 DSH 宿主版本'),
)

// ── 负向对照 ──
// 用一张明显不同的 PNG（128 图标）反证「逐字节一致」判据有牙齿：
// 它一定不等于源图标，因此上面那条 PASS 不可能是随便一张图蒙对的。
let decoy = null
for (const at of hits) {
  const w = b.readUInt32BE(at + 16)
  if (w !== 256) { decoy = at; break }
}
check(
  '负向对照：产物内另有一张 256 以外的 PNG，且不等于源鲸鱼图（判据有牙齿）',
  decoy !== null && !b.subarray(decoy, decoy + srcIcon.length).equals(srcIcon),
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
