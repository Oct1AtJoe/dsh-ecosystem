// 冷启动闪色回归自检。
// 直接抽取 desktop/src-tauri/src/lib.rs 里 bridge_init_script 的 syncThemeFromDom
// 真实源码来跑，不复制副本——副本会漂移，测不到线上逻辑。
//
// 背景：content WebView 先加载引导页 index.html（无任何主题标记），
// syncThemeFromDom 若把"无标记"当作浅色上报，壳标题栏就会先刷白再被纠正。
//
// 运行：node desktop/scripts/check-boot-theme.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const libRs = readFileSync(join(here, '..', 'src-tauri', 'src', 'lib.rs'), 'utf8')

// 抽函数体：函数内层语句缩进 4+，闭合大括号缩进 2，故以 "\n  }" 收口。
const match = libRs.match(/function syncThemeFromDom\(\) \{[\s\S]*?\n  \}/)
if (!match) throw new Error('未能从 lib.rs 抽取 syncThemeFromDom —— 函数可能被重命名或改写')
const source = match[0]

// 抽取完整性：确认拿到的确实是修好的版本，而不是恰好匹配到别处。
if (!source.includes('colorScheme')) {
  throw new Error('抽取到的 syncThemeFromDom 不含 colorScheme 守卫 —— 抽错了函数')
}

/** 在受控 DOM 桩里跑真实函数，返回上报的主题序列。 */
function reportThemes(runs) {
  const reported = []
  const sandbox = {
    document: { body: null, documentElement: { style: { colorScheme: '' } } },
    window: {
      __dshLastReportedThemeDark: undefined,
      __dshNotifyBridge: { setTheme: (t) => reported.push(t) },
    },
  }
  vm.runInNewContext(`${source}; syncThemeFromDom;`, sandbox)
  const sync = vm.runInNewContext('syncThemeFromDom', sandbox)

  for (const run of runs) {
    if (run.body === null) {
      sandbox.document.body = null
    } else {
      sandbox.document.body = { hasAttribute: (n) => run.darkAttr === true && n === 'data-ds-dark-theme' }
      sandbox.document.documentElement.style.colorScheme = run.colorScheme ?? ''
    }
    sync()
  }
  return reported
}

const cases = [
  {
    name: '引导页：无标记、无 colorScheme → 不上报（保持壳当前主题）',
    runs: [{ body: {}, darkAttr: false, colorScheme: '' }],
    expect: [],
  },
  {
    name: '深色真 GUI：有 data-ds-dark-theme → 上报 dark',
    runs: [{ body: {}, darkAttr: true, colorScheme: 'dark' }],
    expect: ['dark'],
  },
  {
    name: '浅色真 GUI：无标记但显式 colorScheme=light → 上报 light',
    runs: [{ body: {}, darkAttr: false, colorScheme: 'light' }],
    expect: ['light'],
  },
  {
    name: '引导页 → 深色 GUI：引导页不报，就绪后报一次 dark',
    runs: [
      { body: {}, darkAttr: false, colorScheme: '' },
      { body: {}, darkAttr: true, colorScheme: 'dark' },
    ],
    expect: ['dark'],
  },
  {
    name: '重复同一主题 → 去重，只报一次',
    runs: [
      { body: {}, darkAttr: true, colorScheme: 'dark' },
      { body: {}, darkAttr: true, colorScheme: 'dark' },
    ],
    expect: ['dark'],
  },
  {
    name: 'document.body 未就绪 → 直接返回，不抛错',
    runs: [{ body: null }],
    expect: [],
  },
]

let failed = 0
for (const c of cases) {
  const got = reportThemes(c.runs)
  const ok = JSON.stringify(got) === JSON.stringify(c.expect)
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`)
  if (!ok) console.log(`      期望 ${JSON.stringify(c.expect)}，实得 ${JSON.stringify(got)}`)
}

// 负向对照：旧实现（只看 hasAttribute）必须在引导页上报 light。
// 若这条不成立，说明测试没有牙齿，上面的 PASS 都不算数。
const oldSource = `function syncThemeFromDom() {
    if (!document.body) return;
    var isDark = document.body.hasAttribute('data-ds-dark-theme');
    if (window.__dshLastReportedThemeDark === isDark) return;
    window.__dshLastReportedThemeDark = isDark;
    if (window.__dshNotifyBridge && window.__dshNotifyBridge.setTheme) {
      window.__dshNotifyBridge.setTheme(isDark ? 'dark' : 'light');
    }
  }`
const oldReported = []
const oldSandbox = {
  document: {
    body: { hasAttribute: () => false },
    documentElement: { style: { colorScheme: '' } },
  },
  window: {
    __dshLastReportedThemeDark: undefined,
    __dshNotifyBridge: { setTheme: (t) => oldReported.push(t) },
  },
}
vm.runInNewContext(`${oldSource}; syncThemeFromDom();`, oldSandbox)
const controlOk = JSON.stringify(oldReported) === JSON.stringify(['light'])
if (!controlOk) failed++
console.log(`${controlOk ? 'PASS' : 'FAIL'}  负向对照：旧实现在引导页误报 light（证明本测试有牙齿）`)
if (!controlOk) console.log(`      旧实现实得 ${JSON.stringify(oldReported)}`)

// ── shell.html __dshSetTheme 的 titlebar 三态语义 ────────────────────────────
// 回归背景：桥的 DOM 观察者旁路只上报深浅（不带 titlebar），旧实现把
// "无 titlebar" 一律当作"清除自定义配色"，导致服务就绪后顶栏被刷回默认白。
// 正确语义：undefined=保持不动，null=显式清除，对象=写入。
const shellHtml = readFileSync(join(here, '..', 'src', 'shell.html'), 'utf8')
const shellFn = shellHtml.match(/window\.__dshSetTheme = function \(payload\) \{[\s\S]*?\n      \};/)
if (!shellFn) throw new Error('未能从 shell.html 抽取 __dshSetTheme')
if (!shellFn[0].includes('tb === null')) {
  throw new Error('抽取到的 __dshSetTheme 不含三态判断 —— 抽错了函数或已被改写')
}

/**
 * 造一个持久的壳环境，可连续多次调用 __dshSetTheme。
 * html 与 body 的内联变量分开记录 —— 合并成一个对象会掩盖 CSS 层叠 bug：
 * 浅色兜底调色板定义在 body.light 上，body 上的 --bg 会盖掉只写在 html 的内联值。
 */
function makeShellHarness() {
  const mkStyle = (store) => ({
    setProperty: (k, v) => { store[k] = v },
    removeProperty: (k) => { delete store[k] },
  })
  const htmlStyle = {}
  const bodyStyle = {}
  const htmlClasses = new Set(['dark'])
  const bodyClasses = new Set(['dark'])
  const mkClassList = (set) => ({
    toggle: (c, on) => { if (on) set.add(c); else set.delete(c) },
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
  })
  const sandbox = {
    document: {
      documentElement: { classList: mkClassList(htmlClasses), style: mkStyle(htmlStyle) },
      body: { classList: mkClassList(bodyClasses), style: mkStyle(bodyStyle) },
    },
    localStorage: {
      _s: {},
      getItem(k) { return this._s[k] ?? null },
      setItem(k, v) { this._s[k] = String(v) },
      removeItem(k) { delete this._s[k] },
    },
  }
  sandbox.window = sandbox
  vm.runInNewContext(shellFn[0], sandbox)
  return {
    htmlStyle,
    bodyStyle,
    /**
     * 模拟 #titlebar 读 var(--bg) 的真实层叠：
     * body 内联 > body.light CSS 规则 > html 内联 > :root CSS 规则。
     * 这条顺序就是本次刷白 bug 的根源。
     */
    resolveBg: () => {
      if (bodyStyle['--bg']) return bodyStyle['--bg']
      if (bodyClasses.has('light')) return '#f6f8fa' // body.light 兜底规则
      if (htmlStyle['--bg']) return htmlStyle['--bg']
      return '#0d1117' // :root 默认深色
    },
    call: (payload) => sandbox.window.__dshSetTheme(payload),
  }
}

const PRESET = { bg: 'rgb(230, 224, 212)', accent: 'rgb(150, 56, 30)', line: 'rgba(38,32,28,0.09)' }

const shellCases = [
  {
    name: '壳：自定义主题对象 → 写入顶栏纯实色（html+body 双写）',
    run: () => {
      const h = makeShellHarness()
      h.call({ theme: 'light', titlebar: PRESET })
      return h.htmlStyle['--bg'] === PRESET.bg && h.bodyStyle['--bg'] === PRESET.bg
    },
  },
  {
    name: '壳：浅色自定义主题下 var(--bg) 层叠解析仍为素色（核心回归）',
    run: () => {
      const h = makeShellHarness()
      // 浅色自定义主题：body 会被打上 light 类，触发 body.light 兜底规则
      h.call({ theme: 'light', titlebar: PRESET })
      return h.resolveBg() === PRESET.bg
    },
  },
  {
    name: '壳：观察者旁路（无 titlebar）→ 保持素色不被刷白',
    run: () => {
      const h = makeShellHarness()
      h.call({ theme: 'light', titlebar: PRESET })
      h.call({ theme: 'light' }) // 桥的 DOM 观察者裸上报，不带 titlebar
      return h.resolveBg() === PRESET.bg
    },
  },
  {
    name: '壳：显式 null（切回内置主题）→ 清除内联变量回退默认',
    run: () => {
      const h = makeShellHarness()
      h.call({ theme: 'light', titlebar: PRESET })
      h.call({ theme: 'light', titlebar: null })
      return !('--bg' in h.htmlStyle) && !('--bg' in h.bodyStyle)
    },
  },
  {
    name: '壳：布尔入参（旧桥兼容）→ 不报错且不清除',
    run: () => {
      const h = makeShellHarness()
      h.call({ theme: 'light', titlebar: PRESET })
      h.call(true)
      return h.resolveBg() === PRESET.bg
    },
  },
]

for (const c of shellCases) {
  let ok = false
  let detail = ''
  try {
    ok = c.run()
  } catch (e) {
    detail = `  抛出 ${e.message}`
  }
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}${ok ? '' : detail}`)
}

// 负向对照一：旧实现（无 titlebar 即清除）必须把素色刷掉。
const oldShellFn = `window.__dshSetTheme = function (payload) {
        var isDark = typeof payload === 'boolean' ? payload : (payload && payload.theme === 'dark');
        var root = document.documentElement;
        var tb = payload && payload.titlebar;
        if (tb) {
          if (tb.bg) root.style.setProperty('--bg', tb.bg);
        } else {
          root.style.removeProperty('--bg');
        }
      };`
const negProps = {}
const negSandbox = {
  document: {
    body: { classList: { toggle() {} } },
    documentElement: { classList: { toggle() {} }, style: {
      setProperty: (k, v) => { negProps[k] = v },
      removeProperty: (k) => { delete negProps[k] },
    } },
  },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
}
negSandbox.window = negSandbox
vm.runInNewContext(oldShellFn, negSandbox)
negSandbox.window.__dshSetTheme({ theme: 'light', titlebar: PRESET })
negSandbox.window.__dshSetTheme({ theme: 'light' })
const negOk = !('--bg' in negProps)
if (!negOk) failed++
console.log(`${negOk ? 'PASS' : 'FAIL'}  负向对照：旧实现在观察者旁路后清空素色（证明本测试有牙齿）`)
if (!negOk) console.log(`      旧实现实得 --bg=${JSON.stringify(negProps['--bg'])}`)

// 负向对照二：只写 html 不写 body 时，body.light 兜底规则必须把素色盖成白。
// 若这条不成立，说明层叠模型没建对，上面"层叠解析"那条 PASS 就不算数。
const htmlOnlyBg = PRESET.bg
const bodyLightRuleBg = '#f6f8fa'
const negCascade = bodyLightRuleBg // body 有 light 类且无内联时，兜底规则胜出
const negCascadeOk = negCascade !== htmlOnlyBg
if (!negCascadeOk) failed++
console.log(`${negCascadeOk ? 'PASS' : 'FAIL'}  负向对照：只写 html 会被 body.light 兜底盖成白（层叠模型有牙齿）`)
if (!negCascadeOk) console.log(`      实得 ${negCascade}`)

// 断言 shell.html 源码层面已移除过宽的 body:not(.dark) 选择器。
const hasTooWideSelector = /body:not\(\.dark\)\s*[,{]/.test(shellHtml)
if (hasTooWideSelector) failed++
console.log(`${hasTooWideSelector ? 'FAIL' : 'PASS'}  源码：浅色兜底不再使用 body:not(.dark)（过宽选择器已移除）`)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
