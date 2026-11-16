// 右侧边栏初始百分比宽度的门禁自检脚本
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const bundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const indexSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const helperSrc = readFileSync(join(here, '..', 'src', 'client', 'rightbar-width.ts'), 'utf8')
const localeSrc = readFileSync(join(here, '..', 'src', 'client', 'locales.ts'), 'utf8')

let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : extra}`)
}

console.log('=== 右侧边栏初始百分比宽度自检 ===')

check('持久化：helper 模块存在且包含 key 与默认值 24', helperSrc.includes('dsh-rightbar-width-ratio') && helperSrc.includes('DEFAULT_RIGHTBAR_RATIO = 24'))
check('夹取逻辑：包含 15..60 范围限制', helperSrc.includes('RIGHTBAR_RATIO_MIN = 15') && helperSrc.includes('RIGHTBAR_RATIO_MAX = 60'))
check('槽位注册：id 为 rightbar-width-custom', indexSrc.includes("id: 'rightbar-width-custom'"))
check('槽位顺序：order 设为 10.8（紧跟 10.7 mascot 之后，在 11 之前）', /id:\s*'rightbar-width-custom'[\s\S]{0,60}order:\s*10\.8/.test(indexSrc))
check('文案：中文词典包含设置项标题与描述', localeSrc.includes("'rightbar-width.title': '右侧边栏初始百分比宽度'"))
check('文案：英文词典对齐包含标题与描述', localeSrc.includes("'rightbar-width.title': 'Right sidebar initial width'"))
check('产物：RightbarWidthRow 与 slot 注册已打入 bundle', bundle.includes('rightbar-width-custom') && bundle.includes('dsh-rightbar-width-ratio'))
check('联动：openRightbar 包装与 setRightbar 调用已进代码', indexSrc.includes('l.panels.setRightbar(targetPx)') && indexSrc.includes('hookLayout'))

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
