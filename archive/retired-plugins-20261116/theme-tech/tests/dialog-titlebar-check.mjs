// Windows 标题栏探针色自检（dsh-theme-tech）
//
// 背景：Windows 原生 WCO 三按钮由官方 preload 读 body 上的
// `--dsw-specific-sidebar-fill` 决定底色。两个已踩实的坑：
//   ① 带 alpha 的颜色会被 Windows DWM 与窗口黑底强制预乘
//      （Sequoia 的 0.66 → #f5f5f7 变 #a2a2a3，顶栏右侧一块脏灰）；
//   ② `setTitleBarOverlay` 每改一次颜色就重绘一次原生非客户区 = 一次可见跳变。
//
// 2026-10-23 用户拍板「优先不闪」，于是策略定为：
//   - 常态只给主题实色；弹窗开合**不改色** → 零跳变；
//   - 只跟随启动期全屏舞台层（开屏动画），因为它只出现一次且此时页面无内容。
//
// 运行：node plugins/theme-tech/tests/dialog-titlebar-check.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const clientBundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const clientSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

// ══ 不变量 1：探针色必须 alpha=1 ══
check('A1：存在 alpha 合成函数 compositeOver', /function compositeOver\(/u.test(clientSrc))
check('A2：合成输出为不透明 rgb()', clientSrc.includes('return `rgb(${mix(red'))
check('A3：存在遮罩色就绪判定 maskColorReady', /function maskColorReady\(/u.test(clientSrc))
check('A4：未就绪时返回 undefined 而非中间态', clientSrc.includes('if (!maskColorReady(stageColor)) return undefined'))
// 负向对照：就绪判据必须真的区分 0 alpha 与非 0 alpha
{
  const ready = (c) => {
    const m = c.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/u)
    if (m === null) return false
    return (m[4] === undefined ? 1 : Number(m[4])) > 0
  }
  check(
    '负向对照：透明判未就绪、半透明与实色判就绪',
    ready('rgba(0, 0, 0, 0)') === false
    && ready('rgba(0, 0, 0, 0.15)') === true
    && ready('rgb(0, 0, 0)') === true,
  )
}

// ══ 不变量 2：「不闪」策略 —— 弹窗不得引起改色 ══
check(
  'B1：resolveTitlebarProbeColor 不再看 dialog 遮罩（弹窗不改色）',
  !clientSrc.includes('findActiveMask')
  && !clientSrc.includes('modalMaskActive'),
)
check('B2：已删除 findModalMask（不再走弹窗分支）', !/function findModalMask\(/u.test(clientSrc))
check(
  'B3：常态（无舞台层）直接返回主题实色',
  /const stage = findStageMask\(\)\s*\n\s*if \(stage === null\) return base/u.test(clientSrc),
)
// 负向对照：设计取舍必须写在源码里，否则后人会误以为漏了弹窗联动
check(
  '负向对照：源码注明了「不跟随弹窗」的取舍与原因',
  clientSrc.includes('不跟随模态弹窗遮罩')
  && clientSrc.includes('反复抱怨的'),
)

// ══ 不变量 3：舞台层识别 ══
check('C1：存在舞台层查找 findStageMask', /function findStageMask\(/u.test(clientSrc))
check(
  'C2：全文档扫描（ink-whale 挂载在 #root 内，不是 body 直接子节点）',
  clientSrc.includes("querySelectorAll<HTMLElement>('body *')"),
)
check(
  'C3：排除 dialog 宿主与 dialog 祖先（否则弹窗遮罩会被误判）',
  clientSrc.includes('element === dialogHost || element.contains(dialog)'),
)
check(
  'C4：排除 aria-hidden 遮罩兄弟',
  clientSrc.includes("element.getAttribute('aria-hidden') === 'true'"),
)
check(
  'C5：排除带 backdrop-filter 的半透明遮罩（舞台层是自己画满的实色）',
  clientSrc.includes("style.backdropFilter !== 'none' && style.backdropFilter !== ''"),
)
check(
  'C6：必须铺满视口（≥95%，面板本身不算）',
  clientSrc.includes('rect.width < viewportWidth * 0.95'),
)
// 负向对照：舞台层判据不得把普通元素误判
{
  const isStage = ({ w, h, vw, vh, pos, alpha, backdrop, inDialog, ariaHidden }) =>
    !inDialog && !ariaHidden
    && (pos === 'fixed' || pos === 'absolute')
    && (backdrop === 'none' || backdrop === '')
    && w >= vw * 0.95 && h >= vh * 0.95 && alpha > 0
  const base = { w: 1920, h: 1080, vw: 1920, vh: 1080, pos: 'fixed', alpha: 1, backdrop: 'none', inDialog: false, ariaHidden: false }
  check('负向对照：小元素不算舞台层', isStage({ ...base, w: 100, h: 100 }) === false)
  check('负向对照：静态定位不算舞台层', isStage({ ...base, pos: 'static' }) === false)
  check('负向对照：全透明不算舞台层', isStage({ ...base, alpha: 0 }) === false)
  check('负向对照：弹窗系元素不算舞台层', isStage({ ...base, inDialog: true }) === false)
  check('负向对照：带 backdrop-filter 的遮罩不算舞台层', isStage({ ...base, backdrop: 'blur(48px)' }) === false)
  check('负向对照：真正的全屏开屏层才算', isStage(base) === true)
}

// ══ 不变量 4：写入去重（掐断 observer 自触发）══
check(
  'D1：writeTitlebarProbeColor 值未变时不碰 DOM',
  clientSrc.includes('if (color === lastTitlebarProbeColor) return false'),
)
check('D2：存在去重缓存 lastTitlebarProbeColor', clientSrc.includes('let lastTitlebarProbeColor'))
check(
  'D3：applyTokens 跳过探针变量的半透明写入（避免一次应用写两次）',
  clientSrc.includes("if (key === '--dsw-specific-sidebar-fill' && themeId !== undefined) continue"),
)
check(
  'D4：跳过后仍登记以便 clearTokens 清理',
  clientSrc.includes("APPLIED_TOKEN_NAMES.add('--dsw-specific-sidebar-fill')"),
)
// 负向对照：去重必须能挡住重复写入
{
  let cached
  let domWrites = 0
  const write = (c) => { if (c === cached) return false; cached = c; domWrites += 1; return true }
  write('a'); write('a'); write('a'); write('b'); write('b')
  check('负向对照：同值连写只落 1 次 DOM，换值才再写', domWrites === 2)
}

// ══ 不变量 5：html + body 双写（层叠陷阱，AGENTS.md §6.3）══
check('E1：存在双写函数 writeTitlebarProbeColor', /function writeTitlebarProbeColor\(/u.test(clientSrc))
check(
  'E2：写 html（官方壳 40px 顶栏填充读这端）',
  clientSrc.includes("document.documentElement.style.setProperty('--dsw-specific-sidebar-fill', color)"),
)
check(
  'E3：写 body（preload 探针读这端）',
  clientSrc.includes("document.body.style.setProperty('--dsw-specific-sidebar-fill', color)"),
)
check(
  'E4：applyTokens 与监听器都走双写函数',
  (clientSrc.match(/writeTitlebarProbeColor\(probe\)/gu) ?? []).length >= 2,
)
// 负向对照：只写一端的模型必然两端不一致
{
  const html = new Map([['v', 'light']])
  const body = new Map([['v', 'light']])
  body.set('v', 'dark')
  check(
    '负向对照：只写 body 时 html 端仍是旧值',
    html.get('v') === 'light' && body.get('v') === 'dark',
  )
}

// ══ 不变量 6：写入后必须清缓存，否则纯色写入被误判跳过 ══
check(
  'F1：applyTokens 写 token 后清空去重缓存',
  clientSrc.includes('lastTitlebarProbeColor = undefined'),
)

// ══ 产物同步 ══
check(
  'G1：compositeOver / findStageMask 已进构建产物',
  clientBundle.includes('compositeOver') && clientBundle.includes('findStageMask'),
)
check('G2：产物中已无弹窗联动残留', !clientBundle.includes('modalMaskActive') && !clientBundle.includes('findModalMask'))

if (failed > 0) {
  console.error(`\n${failed} 项检查失败`)
  process.exit(1)
} else {
  console.log('\n全部通过')
}
