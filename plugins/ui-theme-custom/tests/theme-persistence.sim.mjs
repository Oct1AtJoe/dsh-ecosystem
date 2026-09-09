/**
 * Boot-sequence simulation for the custom-theme persistence state machine.
 * Runs the built client bundle in a fresh VM per "boot" against one shared
 * localStorage, so the real module-level state (applied tokens, saved record)
 * is exercised exactly as in the browser.
 *
 * The bug under test: the official settings schema only persists
 * light/dark/system, so the plugin's own record is the only memory of a custom
 * choice. It must survive a refresh, yet a built-in choice made in the
 * Appearance row must win over it �?including when the official adoption has
 * already pulled the preference back to that built-in (making a later click a
 * no-op that emits no event).
 */
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

const bundle = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const BUILT_IN = ['light', 'dark', 'system']
const TOKENS = { '--dsw-alias-bg-base': 'rgb(13, 13, 16)', '--dsw-alias-surface-glass-spot': 'rgba(1,2,3,0.3)' }

/** Minimal CSSStyleDeclaration stand-in. */
function styleStore() {
  const map = new Map()
  return {
    setProperty: (k, v) => { map.set(k, v) },
    getPropertyValue: (k) => map.get(k) ?? '',
    removeProperty: (k) => { map.delete(k) },
    get size() { return map.size },
  }
}

/**
 * Boot the plugin once against a shared storage backend.
 * @param storage - the shared localStorage double.
 * @param durable - the official durable built-in preference for this boot.
 * @returns the fake theme service plus the events observed.
 */
function boot(storage, durable) {
  let factory
  const win = { __ModuleLoader__: { load: v => { factory = v.factory } }, localStorage: storage }
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
  assert.ok(factory, 'bundle registered a factory')

  // Fake theme service: preference transitions publish synchronously.
  let preference = 'system'
  const listeners = []
  const theme = {
    register: () => () => {},
    getTheme: () => ({ preference, revision: 0, active: { colorScheme: 'dark', tokens: TOKENS }, themes: [], fontSize: 14 }),
    setTheme(id) {
      if (id !== 'system' && !['light', 'dark', ...Object.keys({ aurora: 1, nebula: 1, void: 1, jade: 1, solar: 1, glacial: 1 })].includes(id)) throw new Error('unknown')
      if (preference === id) return
      preference = id
      const snap = theme.getTheme()
      for (const l of [...listeners]) l(snap)
    },
    /** Simulate the async durable adoption once the settings scope loads. */
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
  assert.ok(registered, 'row registered')
  // The row's injected face is the only path the plugin owns for custom themes.
  const face = registered.inject({ sync() {} })
  return { theme, preference: () => preference, click: id => theme.setTheme(id), selectCustom: id => face.setTheme(id) }
}

/** Fresh storage double per scenario. */
function storage() {
  const map = new Map()
  return {
    getItem: k => map.has(k) ? map.get(k) : null,
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: k => { map.delete(k) },
    raw: k => map.get(k) ?? null,
  }
}

// ── Scenario 1: custom theme chosen while durable is a built-in, survives refresh
{
  const s = storage()
  const b1 = boot(s, 'light')
  b1.theme.adopt()                       // the settings scope lands first, as in the browser
  b1.selectCustom('void')
  assert.equal(s.raw('dsh-theme-preference'), 'void|light', 'records the built-in it replaced')
  const b2 = boot(s, 'light')
  b2.theme.adopt()
  assert.equal(b2.preference(), 'void', 'refresh keeps the custom theme')
  assert.equal(s.raw('dsh-theme-preference'), 'void|light', 'record preserved across refresh')
  // The Appearance row now switches for real (preference is the custom id again).
  b2.click('light')
  assert.equal(s.raw('dsh-theme-preference'), null, 'built-in choice drops the record')
  assert.equal(b2.preference(), 'light')
  const b3 = boot(s, 'light')
  b3.theme.adopt()
  assert.equal(b3.preference(), 'light', 'next refresh keeps the built-in theme')
}

// ── Scenario 2: legacy id-only record still restores, then honours a built-in click
{
  const s = storage()
  s.setItem('dsh-theme-preference', 'void')
  const b = boot(s, 'system')
  b.theme.adopt()
  assert.equal(b.preference(), 'void', 'legacy record restores')
  assert.equal(s.raw('dsh-theme-preference'), 'void|system', 'legacy record upgraded with the adopted built-in')
  b.click('dark')
  assert.equal(s.raw('dsh-theme-preference'), null, 'built-in choice drops the legacy record')
}

// ── Scenario 3: a built-in picked in another tab wins over the saved custom theme
{
  const s = storage()
  const b1 = boot(s, 'light')
  b1.theme.adopt()
  b1.selectCustom('void')
  const b2 = boot(s, 'light')
  b2.theme.adopt()            // adoption: stale 'light' matches �?custom kept
  assert.equal(b2.preference(), 'void')
  // Another tab switches to dark, which lands as a later built-in event.
  b2.click('dark')
  assert.equal(s.raw('dsh-theme-preference'), null, 'remote built-in choice drops the record')
}

// ── Scenario 5: another tab moved the durable value while this tab was closed
{
  const s = storage()
  const b1 = boot(s, 'light')
  b1.theme.adopt()
  b1.selectCustom('void')            // record: void|light
  const b2 = boot(s, 'dark')  // durable changed to dark elsewhere
  b2.theme.adopt()
  assert.equal(b2.preference(), 'dark', 'a different durable built-in wins')
  assert.equal(s.raw('dsh-theme-preference'), null, 'stale custom record dropped')
}

// ── Scenario 6: picking a custom theme before the scope lands still sticks
{
  const s = storage()
  const b1 = boot(s, 'light')
  b1.selectCustom('void')            // scope not loaded yet: seen unknown
  assert.equal(s.raw('dsh-theme-preference'), 'void', 'unknown durable recorded as bare id')
  const b2 = boot(s, 'light')
  b2.theme.adopt()
  assert.equal(b2.preference(), 'void', 'custom choice made during boot survives')
  b2.click('light')
  assert.equal(s.raw('dsh-theme-preference'), null, 'built-in choice still drops the record')
}

// ── Scenario 4: no saved theme never invents one
{
  const s = storage()
  const b = boot(s, 'light')
  b.theme.adopt()
  assert.equal(b.preference(), 'light')
  assert.equal(s.raw('dsh-theme-preference'), null)
  b.selectCustom('glacial')
  assert.equal(s.raw('dsh-theme-preference'), 'glacial|light')
}

console.log('[ok] 主题持久化：自定义刷新保持、内置选择覆盖、旧记录兼容、跨标签覆盖')
