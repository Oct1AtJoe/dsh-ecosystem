// 壳联动 UI 注入脚本的回归自检。
//
// 背景：顶栏 ☰ 毛玻璃面板与「关于」玻璃弹窗由 desktop 的 initialization_script
// （lib.rs 的 shell_ui_script）提供。它必须是「文档创建即执行」的独立脚本，
// 否则冷启动服务未就绪窗口期没有面板，☰ 会先弹原生菜单再跳变。
//
// 本脚本从 lib.rs 抽取真实源码，在 vm 沙箱里跑 DOM 桩，**真实模拟点击**：
// 菜单项的 click 处理必须把动作经 __dshNotifyBridge.shellAction 回传到壳侧
// （壳侧 run_shell_action 与托盘菜单同源）；「关于」必须打开自绘弹窗而非系统框。
//
// 运行：node desktop/scripts/check-shell-ui.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const libRs = readFileSync(join(here, '..', 'src-tauri', 'src', 'lib.rs'), 'utf8')

const match = libRs.match(/fn shell_ui_script[\s\S]*?let js = r#"([\s\S]*?)"#;/)
if (!match) throw new Error('未能从 lib.rs 抽取 shell_ui_script —— 函数可能被重命名或改写')

const raw = match[1]
if (!raw.includes('__dshToggleShellMenu')) {
  throw new Error('抽取到的脚本不含 __dshToggleShellMenu —— 抽错了代码块')
}

const js = raw.replace('__VERSION__', '1.2.3').replace('__BUILD__', '0.1.0').replace('__ICON__', 'data:image/png;base64,AAAA')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

// ── 1. 语法可解析（写错一个括号就会在真实注入时静默失败）──
let syntaxOk = true
let syntaxErr = ''
try {
  new vm.Script(js)
} catch (e) {
  syntaxOk = false
  syntaxErr = `  ${e.message}`
}
check('语法：shell_ui_script 可作为 JS 解析', syntaxOk, syntaxErr)

// ── 2. DOM 桩：内联 HTML 会被构造成带 class / data-action 的子节点，
//        从而能真实模拟「点某一项」并验证它把哪个 action 发出去。──
function makeEl(tag = 'div') {
  const el = {
    tagName: tag,
    children: [],
    attrs: {},
    style: {},
    listeners: {},
    className: '',
    parent: null,
    textContent: '',
    _html: '',
    get innerHTML() { return this._html },
    set innerHTML(v) {
      this._html = v
      // 把 innerHTML 里的 class / data-action 解析成子节点，供 closest()/querySelector() 使用。
      // 同时覆盖 <div> 与 <button>，否则弹窗里的按钮取不到，会漏掉真实缺陷。
      const tagRe = /<(div|button|span|b)([^>]*?)>/g
      let m
      while ((m = tagRe.exec(v))) {
        const cls = /class="([^"]*)"/.exec(m[2])
        const act = /data-action="([^"]*)"/.exec(m[2])
        const clsStr = cls ? cls[1] : ''
        if (!clsStr && !act) continue
        const child = makeEl(m[1])
        child.className = clsStr
        if (act) child.attrs['data-action'] = act[1]
        child.parent = el
        el.children.push(child)
      }
    },
    setAttribute(k, v) { this.attrs[k] = v },
    getAttribute(k) { return this.attrs[k] ?? null },
    hasAttribute(k) { return k in this.attrs },
    removeAttribute(k) { delete this.attrs[k] },
    appendChild(c) { c.parent = this; this.children.push(c); return c },
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this)
      this.parent = null
    },
    contains(n) {
      if (n === this) return true
      return this.children.some(c => c.contains && c.contains(n))
    },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn) },
    removeEventListener(type, fn) {
      this.listeners[type] = (this.listeners[type] || []).filter(f => f !== fn)
    },
    querySelector(sel) {
      const want = sel.replace(/^\./, '')
      const walk = (node) => {
        for (const c of node.children) {
          if (String(c.className).split(/\s+/).includes(want)) return c
          const hit = walk(c)
          if (hit) return hit
        }
        return null
      }
      return walk(this)
    },
    closest(sel) {
      const want = sel.replace(/^\./, '')
      let n = this
      while (n) {
        if (String(n.className).split(/\s+/).includes(want)) return n
        n = n.parent
      }
      return null
    },
    /** 模拟点击：把 handler 收到的 event.target 指向给定节点。 */
    fire(type, target) {
      for (const fn of this.listeners[type] || []) fn({ target: target ?? this, key: '' })
    },
  }
  return el
}

const head = makeEl('head')
const body = makeEl('body')
const documentEl = makeEl('html')

const fired = []
const sandbox = {
  window: {},
  document: {
    head,
    body,
    documentElement: documentEl,
    createElement: (t) => makeEl(t),
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  },
  setTimeout: (fn) => fn(),
  Promise,
}
sandbox.window = sandbox
sandbox.window.__dshNotifyBridge = { shellAction: (a) => fired.push(a) }
sandbox.window.location = { reload() {} }

let runtimeOk = true
let runtimeErr = ''
try {
  vm.runInNewContext(js, sandbox)
} catch (e) {
  runtimeOk = false
  runtimeErr = `  ${e.message}`
}
check('运行：脚本在 DOM 桩中执行不抛错', runtimeOk, runtimeErr)

const toggle = sandbox.window.__dshToggleShellMenu
const openAbout = sandbox.window.__dshOpenAboutPopup
check(
  '入口：__dshToggleShellMenu 与 __dshOpenAboutPopup 均已挂载',
  typeof toggle === 'function' && typeof openAbout === 'function',
)

// ── 3. 面板：挂载 + 5 项动作齐全 ──
toggle()
const menu = body.children.find(c => String(c.className).includes('dsh-shell-menu'))
check('面板：__dshToggleShellMenu 向 body 挂载了面板', Boolean(menu))

const wantActions = ['reload', 'restart', 'devtools', 'about', 'quit']
const items = menu ? menu.children.filter(c => c.attrs['data-action']) : []
check(
  '面板：5 项动作齐全且顺序与托盘一致',
  wantActions.every((a, i) => items[i] && items[i].attrs['data-action'] === a),
  `  实得 ${JSON.stringify(items.map(i => i.attrs['data-action']))}`,
)

// ── 4. 真实点击四项：必须经 bridge 回传到壳侧 ──
for (const a of ['reload', 'restart', 'devtools', 'quit']) {
  // 每次重新打开面板（点击后脚本会 closeMenu）
  if (!body.children.some(c => String(c.className).includes('dsh-shell-menu'))) toggle()
  const m = body.children.find(c => String(c.className).includes('dsh-shell-menu'))
  const item = m.children.find(c => c.attrs['data-action'] === a)
  fired.length = 0
  m.fire('click', item)
  check(
    `动作：点击「${a}」→ bridge.shellAction('${a}') 回传壳侧`,
    fired.length === 1 && fired[0] === a,
    `  实得 ${JSON.stringify(fired)}`,
  )
}

// ── 5. 关于：必须打开自绘弹窗，且不回传 bridge ──
if (!body.children.some(c => String(c.className).includes('dsh-shell-menu'))) toggle()
const m2 = body.children.find(c => String(c.className).includes('dsh-shell-menu'))
const aboutItem = m2.children.find(c => c.attrs['data-action'] === 'about')
fired.length = 0
m2.fire('click', aboutItem)
const mask = body.children.find(c => String(c.className).includes('dsh-about-mask'))
check('关于：点击后打开自绘玻璃弹窗（非系统 MessageBox）', Boolean(mask))
check('关于：点击不误发 bridge 动作', fired.length === 0, `  实得 ${JSON.stringify(fired)}`)
// 卡片是 mask 的子节点（真实结构：mask 只做遮罩，内容在 .dsh-about 卡片里）
const card = mask ? mask.children.find(c => String(c.className).includes('dsh-about')) : null
check(
  '关于：弹窗含图标/标题/版本行/按钮',
  Boolean(card) && card._html.includes('dsh-about-mark')
    && card._html.includes('dsh-about-title')
    && card._html.includes('dsh-about-row')
    && card._html.includes('dsh-about-btn'),
)
// 品牌 logo：必须是内联鲸鱼位图（<img> + data URI），不再自绘 Apple/蓝色徽标
check(
  '关于：logo 为内联小鲸鱼位图（img + data URI）',
  Boolean(card) && card._html.includes('dsh-about-mark')
    && card._html.includes('<img src="data:image/png;base64,')
    && !card._html.includes('<svg'),
)
// 副标题那行已按要求移除
check(
  '关于：副标题「桌面端 · macOS …」已移除',
  Boolean(card) && !card._html.includes('dsh-about-sub')
    && !raw.includes('macOS Sequoia / Sonoma Edition'),
)
check('关于：版本号占位已注入', js.includes('1.2.3') && js.includes('0.1.0'))
check('关于：源码中不再调用系统 MessageBoxW', !raw.includes('MessageBoxW'))

// 「关于 DSH」文案必须三处一致：托盘 / 壳原生菜单 / HTML 面板。
// 三处的 id 各自独立（tray:about / shell:about / 面板 data-action="about"），
// 文案却是肉眼可见的同一项；改一处漏两处，用户会看到同一功能有两个名字。
check(
  '文案：托盘项为「关于 DSH」',
  /MenuItem::with_id\(app, "tray:about", "关于 DSH"/.test(libRs),
)
check(
  '文案：壳原生菜单项为「关于 DSH」',
  /item\("shell:about", "关于 DSH"\)/.test(libRs),
)
check(
  '文案：HTML 面板项为「关于 DSH」',
  raw.includes('data-action="about">关于 DSH</div>'),
)

// ── 6. 深浅主题适配 ──
check(
  '主题：按 colorScheme / data-ds-dark-theme 判定深浅并打 data-light',
  raw.includes('data-light') && raw.includes('colorScheme') && raw.includes('data-ds-dark-theme'),
)

// ── 负向对照一：把回传通路掐断后，动作必须发不出去（证明本测试有牙齿）──
// 只替换调用点（函数定义 `function bridge(action)` 不算），避免误伤。
const brokenRaw = raw.replace(/^\s*bridge\(action\);/m, '      void 0;')
const brokenFired = []
const bs = {
  window: {},
  document: {
    head: makeEl('head'), body: makeEl('body'), documentElement: makeEl('html'),
    createElement: (t) => makeEl(t), querySelector: () => null,
    addEventListener() {}, removeEventListener() {},
  },
  setTimeout: (fn) => fn(),
  Promise,
}
bs.window = bs
bs.window.__dshNotifyBridge = { shellAction: (a) => brokenFired.push(a) }
bs.window.location = { reload() {} }
vm.runInNewContext(brokenRaw.replace('__VERSION__', '1').replace('__BUILD__', '1').replace('__ICON__', 'data:image/png;base64,AAAA'), bs)
bs.window.__dshToggleShellMenu()
const bm = bs.document.body.children.find(c => String(c.className).includes('dsh-shell-menu'))
const bi = bm.children.find(c => c.attrs['data-action'] === 'quit')
bm.fire('click', bi)
check(
  '负向对照：掐断 bridge(action) 后动作发不出去（证明本测试有牙齿）',
  brokenFired.length === 0,
  `  实得 ${JSON.stringify(brokenFired)}`,
)

// ── 负向对照二：移除「关于走本地弹窗」分支后，它必须退化成误发 bridge 动作 ──
const noAboutRaw = raw.replace("if (action === 'about') { openAbout(); return; }", '')
const nf = []
const ns = {
  window: {},
  document: {
    head: makeEl('head'), body: makeEl('body'), documentElement: makeEl('html'),
    createElement: (t) => makeEl(t), querySelector: () => null,
    addEventListener() {}, removeEventListener() {},
  },
  setTimeout: (fn) => fn(),
  Promise,
}
ns.window = ns
ns.window.__dshNotifyBridge = { shellAction: (a) => nf.push(a) }
ns.window.location = { reload() {} }
vm.runInNewContext(noAboutRaw.replace('__VERSION__', '1').replace('__BUILD__', '1').replace('__ICON__', 'data:image/png;base64,AAAA'), ns)
ns.window.__dshToggleShellMenu()
const nm = ns.document.body.children.find(c => String(c.className).includes('dsh-shell-menu'))
nm.fire('click', nm.children.find(c => c.attrs['data-action'] === 'about'))
check(
  '负向对照：去掉 about 本地分支后会误发 bridge（证明分支不可省）',
  nf.includes('about'),
  `  实得 ${JSON.stringify(nf)}`,
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
