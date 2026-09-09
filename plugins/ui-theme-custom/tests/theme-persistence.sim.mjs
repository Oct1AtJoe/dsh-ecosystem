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
  const winListeners = []
  const win = {
    __ModuleLoader__: { load: v => { factory = v.factory } },
    localStorage: storage,
    addEventListener: (type, fn) => { winListeners.push({ type, fn }) },
    removeEventListener: () => {},
  }
  const document = {
    documentElement: { style: styleStore() },
    body: { style: styleStore() },
    head: { querySelector: () => null, appendChild: () => {}, append: () => {} },
    createElement: () => ({ setAttribute() {}, remove() {}, style: {}, dataset: {} }),
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  }
  const sandbox = { window: win, document, localStorage: storage, console, setTimeout, clearTimeout, Date, Set, Map, Object, Array, JSON, String, Number, RegExp, Math, Error }
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

  const userClickBuiltIn = (id) => {
    for (const l of winListeners) if (l.type === 'pointerdown') l.fn()
    theme.setTheme(id)
  }

  const userSelectCustom = (id) => {
    for (const l of winListeners) if (l.type === 'pointerdown') l.fn()
    face.setTheme(id)
  }

  return { theme, preference: () => preference, userClickBuiltIn, userSelectCustom }
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

// ── Scenario 1: 用户选择冥夜，刷新页面（F5），保持冥夜
{
  const s = storage()
  const b1 = boot(s, 'light')
  b1.theme.adopt()
  assert.equal(b1.preference(), 'light')

  b1.userSelectCustom('void')
  assert.equal(b1.preference(), 'void')
  assert.equal(s.raw('dsh-theme-preference'), 'void')

  const b2 = boot(s, 'light')
  assert.equal(b2.preference(), 'void', '首屏立即恢复冥夜')
  b2.theme.adopt()
  assert.equal(b2.preference(), 'void', '后台同步绝不冲掉冥夜')
  assert.equal(s.raw('dsh-theme-preference'), 'void')
}

// ── Scenario 2: 用户在冥夜下，点击了官方「浅色」，刷新页面保持浅色
{
  const s = storage()
  s.setItem('dsh-theme-preference', 'void')
  const b = boot(s, 'light')
  b.theme.adopt()
  assert.equal(b.preference(), 'void')

  b.userClickBuiltIn('light')
  assert.equal(b.preference(), 'light')
  assert.equal(s.raw('dsh-theme-preference'), null, '用户选择内置主题，自定义记录被彻底清空')

  const b2 = boot(s, 'light')
  b2.theme.adopt()
  assert.equal(b2.preference(), 'light', '刷新后保持浅色')
  assert.equal(s.raw('dsh-theme-preference'), null)
}

// ── Scenario 3: 用户切回「深色」或者「跟随系统」同理
{
  const s = storage()
  s.setItem('dsh-theme-preference', 'void')
  const b = boot(s, 'dark')
  b.theme.adopt()

  b.userClickBuiltIn('system')
  assert.equal(b.preference(), 'system')
  assert.equal(s.raw('dsh-theme-preference'), null)

  const b2 = boot(s, 'system')
  b2.theme.adopt()
  assert.equal(b2.preference(), 'system')
}

console.log('[ok] 用户交互驱动的主题持久化验证通过：自定义刷新保持、用户切内置持久生效！')