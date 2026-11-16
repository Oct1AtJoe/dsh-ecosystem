/**
 * 门禁：长会话渲染裁剪（content-visibility）必须安全。
 *
 * 为什么需要：
 *   content-visibility:auto 会让视口外的行**跳过布局与绘制**，是长会话流式输出
 *   掉帧的结构性修法（唯一与 dsh-claude-style 有量级差距的项）。
 *   但它一旦折叠错对象，症状极其难查 —— 正在生成的答案会显示成空白。
 *
 * 三条不变式 + 负向对照：
 *   1. 必须存在 content-visibility:auto 规则；
 *   2. 必须排除 [data-turn-process-answer]（正在生成的答案）；
 *   3. 必须排除 user 行与 [hidden] / 折叠面板内的隐藏行；
 *   4. 必须用 contain-intrinsic-size 的 auto 关键字（记住真实高度，滚动条不跳）。
 */
import fs from 'node:fs'
import path from 'node:path'

const here = import.meta.dirname
const src = fs.readFileSync(path.join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const bundle = fs.readFileSync(path.join(here, '..', 'lib', 'client.js'), 'utf8')

let failed = 0
const check = (name, ok, extra = '') => {
  if (ok) console.log(`PASS  ${name}${extra}`)
  else { failed += 1; console.log(`FAIL  ${name}${extra}`) }
}

/** 取 content-visibility 规则的完整选择器块（到 { 为止）。 */
const ruleStart = src.indexOf('content-visibility: auto')
check('存在 content-visibility:auto 规则', ruleStart !== -1)

const selector = ruleStart === -1 ? '' : src.slice(src.lastIndexOf('\n\n', ruleStart) + 1, src.indexOf('{', ruleStart))

console.log('=== 排除清单（折叠错对象 = 答案空白，最难查的一类回归）===')
check('锚点为宿主自带 data-chat-flow-kind（不猜类名）', selector.includes('[data-chat-flow-kind]'))
check('排除正在生成的答案 [data-turn-process-answer]', selector.includes('[data-turn-process-answer]'))
check('排除用户行 [data-chat-flow-kind="user"]', selector.includes('[data-chat-flow-kind="user"]'))
check('排除 [hidden]', selector.includes('[hidden]'))
check('排除已折叠的思考/工具成员 [data-turn-process-hidden]', selector.includes('[data-turn-process-hidden]'))
check('排除折叠面板内的隐藏行', selector.includes('[data-disclosure-row]'))

console.log('\n=== 尺寸占位 ===')
// auto 关键字让浏览器记住上次渲染的真实高度；缺了它反复滚动会持续用估值，滚动条乱跳。
check('contain-intrinsic-size 使用 auto 关键字（记住真实高度）',
  /contain-intrinsic-size:\s*auto\s+\d+px/.test(src))
check('负向对照：不得使用无 auto 的纯估值写法',
  !/contain-intrinsic-size:\s*\d+px\s*;/.test(src))

console.log('\n=== 构建产物 ===')
check('产物含 content-visibility:auto', bundle.includes('content-visibility'))
check('产物含 contain-intrinsic-size', bundle.includes('contain-intrinsic-size'))

console.log('\n=== 负向对照（证明判据有牙齿）===')
check('负向对照：删掉答案行排除项时，本组必须能察觉',
  !/\[data-chat-flow-kind\]:not\(\[data-chat-flow-kind="user"\]\)\s*\{/.test(src))

console.log('')
if (failed > 0) { console.log(`${failed} 项失败`); process.exit(1) }
console.log('PASS: chat-cv-check 全部通过')
