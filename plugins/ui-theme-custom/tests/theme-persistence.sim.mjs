import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

const bundle = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const TOKENS = { '--dsw-alias-bg-base': 'rgb(13, 13, 16)' }

function styleStore() {
  const map = new Map()
  return {
    setProperty: (k, v) => { map.set(k, v) },
    getPropertyValue: (k) => map.get(k) ?? '',
    removeProperty: (k) => { map.delete(k) },
    get size() { return map.size },
  }
}

function boot(storage, durable) {
  let factory
  const win = {
    __ModuleLoader__: { load: v => { factory = v.factory } },
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  const attrs = new Set()
  const document = {
    documentElement: { style: styleStore() },
    body: {
      style: styleStore(),
      setAttribute: (k) => { attrs.add(k) },
      removeAttribute: (k) => { attrs.delete(k) },
      hasAttribute: (k) => attrs.has(k),
    },
    head: { querySelector: () => null, appendChild: () => {}, append: () => {} },
    createElement: () => ({ setAttribute() {}, remove() {}, style: {}, dataset: {} }),
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  }
  let microtasks = []
  const sandbox = {
    window: win, document, localStorage: storage, console, setTimeout, clearTimeout,
    queueMicrotask: (fn) => { microtasks.push(fn) },
    Date, Set, Map, Object, Array, JSON, String, Number, RegExp, Math, Error
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(bundle, sandbox)

  let preference = 'system'
  const listeners = []
  const theme = {
    register: () => () => {},
    getTheme: () => ({ preference, revision: 0, active: { colorScheme: 'dark', tokens: TOKENS }, themes: [], fontSize: 14 }),
    setTheme(id) {
      if (preference === id) return
      preference = id
      const snap = theme.getTheme()
      for (const l of [...listeners]) l(snap)
    },
    adopt() {
      if (preference === durable) return
      preference = durable
      const snap = theme.getTheme()
      for (const l of [...listeners]) l(snap)
    },
  }

  let registered
  const ctx = {
    theme,
    locale: { register: () => () => {} },
    effect: (fn) => { fn(); return () => {} },
    on: (name, fn) => { if (name === 'theme/change') listeners.push(fn); return () => {} },
    slots: {
      inject: (name, cb) => cb(),
      register: (config) => { registered = config; return () => {} },
    },
  }
  const mod = factory(name => {
    if (name === 'react') return { createElement: () => null, Fragment: 'f', useState: v => [v, () => {}], useEffect() {}, useRef: v => ({ current: v }) }
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return { Tooltip: 'tooltip' }
    if (name === '@deepseek-ai/dsh-client-store') {
      return {
        defineStore: ({ init, actions }) => {
          const state = init()
          const handle = { getState: () => state }
          for (const [key, fn] of Object.entries(actions)) handle[key] = (...args) => { fn(state, ...args) }
          return handle
        },
      }
    }
    if (name === 'clsx') return () => ''
    return {}
  })
  mod.apply(ctx)
  const face = registered.inject({ sync() {} })

  const flush = () => {
    while (microtasks.length > 0) {
      const tasks = microtasks
      microtasks = []
      for (const t of tasks) t()
    }
  }

  const userClickBuiltIn = (id) => {
    theme.setTheme(id)
    flush()
  }

  const userSelectCustom = (id) => {
    face.setTheme(id)
    flush()
  }

  return { theme, preference: () => preference, userClickBuiltIn, userSelectCustom, document, flush }
}

function storage() {
  const map = new Map()
  return {
    getItem: k => map.has(k) ? map.get(k) : null,
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: k => { map.delete(k) },
    raw: k => map.get(k) ?? null,
  }
}

// ── Scenario 1: 用户选择冥夜，刷新页面（F5），保持冥夜、暗色属性和 CSS 变量！
{
  const s = storage()
  const b1 = boot(s, 'light') // 初始后台存的是 light
  b1.theme.adopt()
  b1.flush()
  assert.equal(b1.preference(), 'light')

  // 用户点击冥夜
  b1.userSelectCustom('void')
  assert.equal(b1.preference(), 'void')
  assert.equal(s.raw('dsh-theme-preference'), 'void')
  assert.equal(b1.document.body.hasAttribute('data-ds-dark-theme'), true)
  assert.equal(b1.document.documentElement.style.colorScheme, 'dark')
  assert.equal(b1.document.body.style.getPropertyValue('--dsw-alias-bg-base'), 'rgb(13, 13, 16)')

  // 用户按 F5 刷新页面（全新 boot，后台再次推送 light）
  const b2 = boot(s, 'light')
  b2.flush()
  assert.equal(b2.preference(), 'void', '首屏立即恢复冥夜')
  b2.theme.adopt() // 后台设置同步推送了 light（无 setTheme 调用）
  b2.flush()
  assert.equal(b2.preference(), 'void', '后台同步绝不冲掉冥夜')
  assert.equal(s.raw('dsh-theme-preference'), 'void')
  assert.equal(b2.document.body.hasAttribute('data-ds-dark-theme'), true, '暗色属性完好')
  assert.equal(b2.document.documentElement.style.colorScheme, 'dark')
  assert.equal(b2.document.body.style.getPropertyValue('--dsw-alias-bg-base'), 'rgb(13, 13, 16)', 'CSS 变量和光斑完全保留')
}

// ── Scenario 2: 用户在冥夜下，点击了官方「浅色」，刷新页面保持浅色
{
  const s = storage()
  s.setItem('dsh-theme-preference', 'void')
  const b = boot(s, 'light')
  b.theme.adopt()
  b.flush()
  assert.equal(b.preference(), 'void')

  // 用户点击官方浅色（走官方 setTheme 包装器，产生 liveBuiltinPick）
  b.userClickBuiltIn('light')
  assert.equal(b.preference(), 'light')
  assert.equal(s.raw('dsh-theme-preference'), null, '用户选择内置主题，自定义记录被彻底清空')
  assert.equal(b.document.body.style.getPropertyValue('--dsw-alias-bg-base'), '', '自定义变量被完全回收')

  // 用户按 F5 刷新页面
  const b2 = boot(s, 'light')
  b2.theme.adopt()
  b2.flush()
  assert.equal(b2.preference(), 'light', '刷新后保持浅色')
  assert.equal(s.raw('dsh-theme-preference'), null)
}

// ── Scenario 3: 用户选择新浅色主题「银曜」(jade)，刷新保持浅色属性与银灰底色
{
  const s = storage()
  const b1 = boot(s, 'dark')
  b1.theme.adopt()
  b1.flush()

  // 用户点击银曜 (jade)
  b1.userSelectCustom('jade')
  assert.equal(b1.preference(), 'jade')
  assert.equal(s.raw('dsh-theme-preference'), 'jade')
  assert.equal(b1.document.body.hasAttribute('data-ds-dark-theme'), false, '银曜作为浅色主题，绝无暗色属性')
  assert.equal(b1.document.documentElement.style.colorScheme, 'light')
  assert.equal(b1.document.body.style.getPropertyValue('--dsw-alias-bg-base'), 'rgb(243, 244, 247)', '温润冷银底色生效')

  // 用户按 F5 刷新页面（全新 boot，后台同步推送 dark）
  const b2 = boot(s, 'dark')
  b2.flush()
  assert.equal(b2.preference(), 'jade', '首屏立即恢复银曜')
  b2.theme.adopt()
  b2.flush()
  assert.equal(b2.preference(), 'jade', '后台同步绝不冲掉银曜')
  assert.equal(s.raw('dsh-theme-preference'), 'jade')
  assert.equal(b2.document.body.hasAttribute('data-ds-dark-theme'), false, '刷新后依然保持浅色属性')
  assert.equal(b2.document.documentElement.style.colorScheme, 'light')
  assert.equal(b2.document.body.style.getPropertyValue('--dsw-alias-bg-base'), 'rgb(243, 244, 247)')
}

console.log('[ok] 借鉴优秀开源插件的最佳实践方案：全场景严格验证通过！')