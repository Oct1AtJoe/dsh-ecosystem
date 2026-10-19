/**
 * 输入框挂件（吉祥物）站位门禁。
 *
 * 锁死「挂件不能压到回到底部按钮」这条几何约束，并记录 2026-10-20
 * 用户要求的右移 16px（68px → 52px）。
 *
 * 为什么需要门禁：挂件挂在 composerStack 上、按钮挂在对话列上，
 * 两者在同一竖直带相遇。offset 一调小就会压住按钮，而这种重叠在
 * 截图里不明显、只有实际点按钮时才发现点不到。
 */
import fs from 'node:fs'
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

/** 剥掉 CSS 注释，避免注释里的示例值被当成真规则。 */
const stripCssComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '')
const css = stripCssComments(indexSrc)

/** 取某锚点下挂件的 right 偏移（px 数值）。 */
function offsetOf(anchor) {
  const re = new RegExp(
    `\\[data-dsh-pet-anchor="${anchor}"\\]\\s*>\\s*\\.dsh-composer-pet\\s*\\{([^}]*)\\}`,
  )
  const m = css.match(re)
  if (!m) return null
  const right = m[1].match(/right:\s*([^;]+);/)
  if (!right) return null
  const tail = right[1].match(/(\d+)px\)?\s*!important\s*$/)
  return tail ? Number(tail[1]) : null
}

console.log('=== A. 三个锚点必须同步右移（否则切换场景时挂件会跳）===')
const stack = offsetOf('stack')
const panel = offsetOf('panel')
const card = offsetOf('card')

check('stack 锚点存在', stack !== null, stack === null ? '' : `  offset=${stack}px`)
check('panel 锚点存在', panel !== null, panel === null ? '' : `  offset=${panel}px`)
check('card 锚点存在', card !== null, card === null ? '' : `  offset=${card}px`)
check('三个锚点偏移一致（无跳变）', stack === panel && panel === card,
  stack === panel && panel === card ? '' : `  stack=${stack} panel=${panel} card=${card}`)

console.log('\n=== B. 安全边界：offset 不得小于 44px ===')
// 几何：人物右缘到按钮左缘的间隙 = 34 + (offset - 16)  （列宽够宽时恒成立）
// offset=44 → 11px，已是可接受下限；再小就会贴住/压住按钮。
const SAFE_MIN = 44
for (const [name, v] of [['stack', stack], ['panel', panel], ['card', card]]) {
  check(
    `${name} 的 offset ≥ ${SAFE_MIN}px（不压回到底部按钮）`,
    v !== null && v >= SAFE_MIN,
    v !== null && v < SAFE_MIN ? `  实测 ${v}px，会压住按钮` : '',
  )
}

console.log('\n=== C. 记录本次右移（68px → 52px）===')
check('已右移到 52px（用户 2026-10-20 要求「往右移一些」）', stack === 52, `  实测 ${stack}px`)
check('负向对照：不得回落到旧的 68px', stack !== 68)
check('注释记录了 68→52 的由来与核算公式', /68px\s*调为\s*52px/.test(indexSrc) && /gap\s*=\s*34\s*\+/.test(indexSrc))

console.log('\n=== D. 垂直站位未被动到（只改横向）===')
check('stack 仍贴输入卡上沿（bottom: 100%）',
  /\[data-dsh-pet-anchor="stack"\][\s\S]{0,400}?bottom:\s*100%\s*!important/.test(css))
check('panel 仍保留 -7px 微调',
  /\[data-dsh-pet-anchor="panel"\][\s\S]{0,400}?bottom:\s*calc\(100%\s*-\s*7px\)/.test(css))
check('挂件尺寸未变（73×109）',
  /\.dsh-composer-pet\s*\{[\s\S]{0,400}?width:\s*73px\s*!important[\s\S]{0,80}?height:\s*109px\s*!important/.test(css))

console.log('\n=== E. 构建产物 ===')
check('产物含新偏移 52px', /\+ 52px\)/.test(bundle))
check('产物不再含挂件的 68px 偏移', !/\+ 68px\)\s*!important[\s\S]{0,200}?dsh-composer-pet/.test(bundle))

console.log('')
if (failed > 0) {
  console.log(`${failed} 项失败`)
  process.exit(1)
}
console.log('PASS: mascot-position-check 全部通过')
