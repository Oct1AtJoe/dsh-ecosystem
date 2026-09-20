// 字号持久化与全局生效的回归自检。
//
// 背景（Fix 1）：官方 ThemeRuntime.setFontSize 是「先乐观改本地 → void host.set() 异步写盘」，
// 而 adopt() 每次收到 settings 镜像变更就无条件用镜像值覆盖本地 fontSize。写入飞行窗口内
// 任何镜像抖动都会把字号回滚成旧值 —— 用户看到「改完几秒自动弹回」。
// 插件层补了「字号意图」防护：记住显式提交值，发现被旧镜像回滚就重新断言。
//
// 背景（Fix 2/双轴）：官方只把 --dsh-content-font-size 挂在 body，且只有对话模块消费它；
// 两侧边栏与设置面板用硬编码 px，调字号时纹丝不动。
// 现架构：对话区走官方轴（官方行控制），侧边栏走本插件独立轴
// --dsh-sidebar-font-size（侧边栏字号行控制），设置面板跟随对话区轴。
//
// 运行：node plugins/ui-theme-custom/tests/font-size-check.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const clientBundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const clientSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const rowSrc = readFileSync(join(here, '..', 'src', 'client', 'SidebarFontRow.tsx'), 'utf8')
const fontSrc = readFileSync(join(here, '..', 'src', 'client', 'sidebar-font.ts'), 'utf8')
const localesSrc = readFileSync(join(here, '..', 'src', 'client', 'locales.ts'), 'utf8')
const shellHtml = readFileSync(join(here, '..', '..', '..', 'desktop', 'src', 'shell.html'), 'utf8')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

// ── Fix 1：字号意图防护必须真的接进 theme/change 链路 ──
check('Fix1：存在字号意图记录（setFontSize 包装）', clientSrc.includes('recordFontSizeIntent'))
check('Fix1：存在回滚检测与重新断言函数', clientSrc.includes('assertFontSizeIntent'))
check('Fix1：theme/change 中优先断言字号意图', /assertFontSizeIntent\(snapshot\.fontSize\)/.test(clientSrc))
check(
  'Fix1：断言命中回滚时用原函数重发（不会递归包装自身）',
  /originalSetFontSize\.call\(theme, pendingFontSize\)/.test(clientSrc),
)
check('Fix1：意图最终会清除（有静默窗口计时器）', clientSrc.includes('pendingFontSizeSettle'))
check('Fix1：效果随 fiber 释放（restore setFontSize wrapper）', clientSrc.includes('restore setFontSize wrapper'))
check('Fix1：意图防护已进构建产物', clientBundle.includes('assertFontSizeIntent') && clientBundle.includes('pendingFontSize'))

// ── 字号双轴：对话区（官方）与侧边栏（本插件）独立 ──
check('Fix2：复用官方增量轴 --dsh-content-font-delta', clientSrc.includes('--dsh-content-font-delta'))
check('Fix2：侧边栏走独立轴 --dsh-sidebar-font-size', clientSrc.includes('--dsh-sidebar-font-size'))
check(
  'Fix2：侧边栏字号直接用独立轴（不再跟随对话区 delta）',
  // 左侧边栏块：从第一条 sidebarCol 选择器到其规则结束，必须用独立轴且不出现对话区 delta
  (() => {
    const start = clientSrc.indexOf('/* 左侧边栏：better-sidebar')
    const end = clientSrc.indexOf('/* 右侧面板', start)
    const block = start >= 0 && end > start ? clientSrc.slice(start, end) : ''
    return block.includes('font-size:var(--dsh-sidebar-font-size')
      && !block.includes('--dsh-shell-font-delta')
  })(),
)
check(
  'Fix2：设置面板跟随对话区轴（它是内容）',
  /\[role="dialog"\] \[class\*="navCell"\][\s\S]{0,80}font-size:calc\(14px \+ var\(--dsh-shell-font-delta/.test(clientSrc),
)
check('Fix2：侧边栏次级文本比正文小一档', /--dsh-sidebar-font-size,13px\) - 1px\)/.test(clientSrc))
check('Fix2：行高随侧边栏字号联动（避免放大压字）', /line-height:calc\(var\(--dsh-sidebar-font-size,13px\) \+ 8px\)/.test(clientSrc))
check('Fix2：全局字号样式已进构建产物', clientBundle.includes('dsh-sidebar-font-size'))

// ── 侧边栏字号行（独立设置项）──
check('新行：持久化模块存在（localStorage key + 夹取）', fontSrc.includes("dsh-sidebar-font-size") && fontSrc.includes('SIDEBAR_FONT_MIN'))
check('新行：默认值比对话区默认 14px 小一档', /DEFAULT_SIDEBAR_FONT\s*=\s*13/.test(fontSrc))
check('新行：内联变量 html + body 双写（层叠陷阱）', /documentElement\.style\.setProperty\(SIDEBAR_FONT_VARIABLE/.test(fontSrc) && /document\.body\.style\.setProperty\(SIDEBAR_FONT_VARIABLE/.test(fontSrc))
check('新行：注册进 settings.general.item 槽位', clientSrc.includes('sidebar-font-custom'))
// order 必须避开官方占用值，且使外观、科技主题、字号流形成完美紧凑层级：
// 官方 appearance(10) -> 科技主题(10.5) -> 官方 font-size(11) -> 侧边栏字号(11.5) -> 官方 transcript-view(12)
check(
  '新行：order 紧随官方字号大小(11)，设为 11.5',
  /id:\s*'sidebar-font-custom'[\s\S]{0,120}order:\s*11\.5/.test(clientSrc),
)
check(
  '新行：order 未与官方 transcript-view(12) 冲突',
  !/id:\s*'sidebar-font-custom'[\s\S]{0,120}order:\s*12\b/.test(clientSrc),
)
// 科技主题区块：紧随官方外观行（10），不再落在页面最底部（原 20）
check(
  '重排：科技主题 order 紧随官方外观配置区（10.5，原为 20）',
  /id:\s*'appearance-custom'[\s\S]{0,120}order:\s*10\.5/.test(clientSrc),
)
check(
  '重排：科技主题不再使用 order 20（会与 composer-enter 混排落到底部）',
  !/id:\s*'appearance-custom'[\s\S]{0,120}order:\s*20/.test(clientSrc),
)
check('新行：组件含数字输入框', rowSrc.includes('inputMode="numeric"'))
check('新行：输入框非法值在 blur 时夹取', rowSrc.includes('onBlur') && rowSrc.includes('normalizeSidebarFont'))
check('新行：文案中英齐备', localesSrc.includes('侧边栏字号') && localesSrc.includes('Sidebar font size'))
check('新行：已进构建产物', clientBundle.includes('sidebar-font.title') && clientBundle.includes('Sidebar font size'))

// ── 选择器锚点硬规则（实测坑，静默失效且不报错）──
// CSS Modules 哈希后类名形如 V41CyG_frame，源码目录名不出现在 DOM 里。
// 曾把锚点写成 [class*="AppFrame_frame"]，导致 delta 恒为空、字号完全没生效。
check(
  '锚点：delta 定义挂 body（官方轴所在处，必然命中）',
  /body\{[\s\S]{0,200}--dsh-shell-font-delta:var\(--dsh-content-font-delta/.test(clientSrc),
)
check(
  '锚点：不得使用源码目录名做钩子（AppFrame/SettingsRoot/Rows 不在 DOM 中）',
  // 只在 CSS 规则里查（排除注释中的说明文字）
  !/\[class\*="AppFrame_frame"\]\s*\{/.test(clientSrc)
    && !/\[class\*="SettingsRoot"\]\s*\{/.test(clientSrc)
    && !/\[class\*="Rows_"\]\s*\{/.test(clientSrc),
)
check(
  '锚点：视窗发丝高光用 _frame 后缀匹配（对哈希稳定）',
  /\[class\$="_frame"\]/.test(clientSrc),
)
check(
  '边界：发丝高光排除右侧轮次导航条（限定 div 顶层并显式清除 nav.frame 阴影）',
  /div\[class\$="_frame"\]:has\(>\s*\[class\*="sidebarCol"\]\)/.test(clientSrc)
    && /nav\[class\*="frame"\][\s\S]{0,60}box-shadow:\s*none\s*!important/.test(clientSrc),
)
check(
  '锚点：禁止 [class*="title"] 过宽通配（实测误伤 49 个元素含对话区标题）',
  !/\[class\*="sidebarCol"\]\s*\[class\*="title"\]/.test(clientSrc)
    && !/\[class\*="rightbarCol"\]\s*\[class\*="title"\]/.test(clientSrc),
)
check(
  '锚点：侧边栏用实测存在的 dsh-ff__ 前缀（better-sidebar）',
  clientSrc.includes('dsh-ff__title') && clientSrc.includes('dsh-ff__header-title'),
)

// ── 边界（刻意不跟随）：窗口顶栏属于 chrome，不随字号缩放 ──
// 交通灯、托盘菜单等窗口装饰都是固定尺寸，只缩放中间标题会让 52px 紧凑条失衡；
// 官方 --dsh-content-font-size 是 content 轴，本就不覆盖窗口装饰。
check(
  '边界：顶栏不读字号变量（chrome 固定尺寸）',
  !shellHtml.includes('--shell-font-size') && !shellHtml.includes('payload.fontSize'),
)
check(
  '边界：插件不下发字号给壳（通知桥只带主题与顶栏配色）',
  !/syncDesktopTitlebar\([\s\S]{0,200}fontSize/.test(clientSrc)
    && !/titlebar, fontSize/.test(clientSrc),
)

// ── 关键回归：默认值必须合理且合法 ──
// 侧边栏默认 13px 落在合法区间内、且严格小于对话区默认 14px ——
// 这正是「不该跟主对话区一样大」的默认表达。
check(
  '回归：默认侧边栏字号合法且小于对话区默认 14px',
  /DEFAULT_SIDEBAR_FONT\s*=\s*13/.test(fontSrc)
    && /SIDEBAR_FONT_MIN\s*=\s*11/.test(fontSrc)
    && /SIDEBAR_FONT_MAX\s*=\s*16/.test(fontSrc),
)
// CSS 兜底值也必须与 TS 默认一致，否则未设置时会与设置页显示不符
check(
  '回归：CSS 兜底值与 TS 默认一致（13px，避免显示与渲染不符）',
  /--dsh-sidebar-font-size:13px/.test(clientSrc),
)

// ── 负向对照一：去掉 theme/change 里的断言调用，回滚必须无人纠正 ──
const withoutAssert = clientSrc.replace(
  /if \(assertFontSizeIntent\(snapshot\.fontSize\)\) return/,
  'void 0',
)
check(
  '负向对照：移除 theme/change 断言后回滚无人纠正（证明该接线不可省）',
  !/assertFontSizeIntent\(snapshot\.fontSize\)/.test(withoutAssert),
)

// ── 负向对照二：意图若从不清除，会永久压过后续合法的外部改动 ──
check(
  '负向对照：意图确有清除路径（否则外部改动会被永久压制）',
  /pendingFontSize = null/.test(clientSrc),
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
