// Runnable check for the layout preference layer in lib/client.js.
//
// The host layout store is memory-only (ui-layout/src/client/stores.ts declares
// no persist), so both column widths and the sidebar font size are remembered
// by this plugin instead. Risks locked down here:
//
//   1. A CLOSE must never be undone. toggleSidebar is wrapped, so re-applying
//      the remembered width on a close would flip the sidebar back open.
//   2. Restoration happens once at boot, not on every layout hook.
//   3. A drag must survive a reload; the percentage row must clear the stale px
//      memory so the initial-width row keeps meaning something.
//   4. Out-of-range or malformed storage clamps instead of poisoning the frame.
//
// Run: node layout-prefs.check.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = await readFile(join(here, 'lib', 'client.js'), 'utf8')

const KEY_SIDEBAR = 'dsh.session-folders-custom.sidebar-width'
const KEY_RIGHTBAR = 'dsh.session-folders-custom.rightbar-width'
const KEY_RIGHTBAR_PX = 'dsh.session-folders-custom.rightbar-px'
const KEY_FONT = 'dsh.session-folders-custom.sidebar-font'

/** Build a fake localStorage so each scenario starts from a known state. */
function makeStorage(seed) {
  const map = new Map(Object.entries(seed ?? {}))
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)) },
    removeItem: (k) => { map.delete(k) },
  }
}

/**
 * Boot the shipped bundle against a fake host and run its apply().
 * @param opts - storage seed, frame width, sidebar collapsed marker.
 * @returns handles the assertions drive.
 */
function boot(opts = {}) {
  const storage = makeStorage(opts.seed)
  const calls = { setSidebar: [], setRightbar: [], toggle: 0, openRightbar: 0 }
  const registered = []

  const passthrough = new Proxy(function () {}, {
    get: (_target, prop) => (prop === '__esModule' ? false : passthrough),
    apply: () => passthrough,
    construct: () => passthrough,
  })
  const requireFn = (spec) =>
    (spec === 'react' || spec === 'react-dom' || spec === 'react/jsx-runtime'
      ? passthrough
      : new Proxy({}, { get: () => passthrough }))

  // Mirrors the host: sidebar is a px width, rightbar starts null because the
  // panel has never been opened (stores.ts keeps that null).
  const panels = {
    sidebar: 280,
    rightbar: null,
    setSidebar(px) { calls.setSidebar.push(px); this.sidebar = px },
    setRightbar(px) { calls.setRightbar.push(px); this.rightbar = px },
    toggleSidebar() {
      calls.toggle += 1
      // Host contract: closing forgets the width (falls to 0), opening restores 280.
      this.sidebar = this.sidebar === 0 ? 280 : 0
    },
    openRightbar() {
      calls.openRightbar += 1
      if (this.rightbar === null) this.rightbar = Math.round(1920 * 0.24)
    },
  }

  const ctx = {
    effect: (fn) => { fn(); return () => {} },
    get: (name) => {
      if (name === 'layout') return { panels }
      if (name === 'uiWorkspace') return {}
      return undefined
    },
    inject: () => {},
    locale: { register: () => () => {}, bind: () => () => '', subscribe: () => () => {} },
    sessions: { binding: () => undefined, searchResultLimit: 20 },
    workspaces: {},
    uiWorkspace: {},
    slots: {
      inject: (_name, callback) => { callback() },
      register: (meta) => { registered.push(meta); return () => {} },
    },
  }

  const documentElement = { style: { props: {}, setProperty(k, v) { this.props[k] = v } } }
  const body = { style: { props: {}, setProperty(k, v) { this.props[k] = v } } }

  let plugin
  const sandbox = {
    window: {
      innerWidth: opts.innerWidth ?? 1920,
      __ModuleLoader__: { load: (mod) => { plugin = mod.factory(requireFn) } },
    },
    document: {
      documentElement,
      body,
      head: { appendChild: () => {} },
      createElement: () => ({ style: {}, dataset: {}, setAttribute: () => {}, appendChild: () => {} }),
      querySelector: (sel) => (sel === '[data-sidebar-collapsed]' && opts.collapsed === true ? {} : null),
    },
    localStorage: storage,
    console,
    setTimeout,
    clearTimeout,
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    unescape,
    encodeURIComponent,
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(source, sandbox, { filename: 'client.js' })
  assert.ok(plugin?.apply, 'bundle must export apply')
  plugin.apply(ctx)
  return { ctx, storage, calls, panels, registered, documentElement, body }
}

/** Let the drag-write throttle (200ms) flush. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 260))

let failures = 0

/** Run one assertion group without aborting the rest of the suite. */
async function group(name, fn) {
  try {
    await fn()
    console.log('  ok   ' + name)
  } catch (error) {
    failures += 1
    console.log('  FAIL ' + name)
    console.log('         -> ' + error.message)
  }
}

console.log('=== layout preference gate ===')

console.log('')
console.log('-- A. boot restoration --')

await group('restores the remembered sidebar width exactly once', () => {
  const bundle = boot({ seed: { [KEY_SIDEBAR]: '360' } })
  assert.deepEqual(bundle.calls.setSidebar, [360], 'one restore call')
})

await group('falls back to the 280px contract default when nothing is stored', () => {
  const bundle = boot({})
  assert.deepEqual(bundle.calls.setSidebar, [280], 'default width restored')
})

await group('clamps out-of-range and malformed stored widths', () => {
  const cases = [['9999', 420], ['10', 264], ['abc', 280], ['', 280]]
  for (const pair of cases) {
    const bundle = boot({ seed: { [KEY_SIDEBAR]: pair[0] } })
    assert.equal(bundle.calls.setSidebar.at(-1), pair[1], 'stored ' + JSON.stringify(pair[0]))
  }
})

console.log('')
console.log('-- B. drag memory --')

await group('persists a dragged sidebar width', async () => {
  const bundle = boot({})
  bundle.panels.setSidebar(333)
  await settle()
  assert.equal(bundle.storage.map.get(KEY_SIDEBAR), '333', 'drag stored')
})

await group('persists a dragged right-panel width as px memory', async () => {
  const bundle = boot({})
  bundle.panels.setRightbar(520)
  await settle()
  assert.equal(bundle.storage.map.get(KEY_RIGHTBAR_PX), '520', 'rightbar px stored')
})

await group('reopening the right panel prefers the dragged px over the percentage', () => {
  const bundle = boot({ seed: { [KEY_RIGHTBAR_PX]: '520', [KEY_RIGHTBAR]: '24' } })
  bundle.panels.rightbar = null
  bundle.panels.openRightbar()
  assert.equal(bundle.calls.setRightbar.at(-1), 520, 'drag memory wins')
})

await group('editing the percentage row clears the stale px memory', () => {
  const bundle = boot({ seed: { [KEY_RIGHTBAR_PX]: '520', [KEY_RIGHTBAR]: '24' } })
  const row = bundle.registered.find((entry) => entry.id === 'folders-rightbar-width')
  assert.ok(row, 'percentage row registered')
  row.inject({ sync: () => {} }).setRightbarPct(40)
  assert.equal(bundle.storage.map.has(KEY_RIGHTBAR_PX), false, 'px memory cleared')
  assert.equal(bundle.storage.map.get(KEY_RIGHTBAR), '40', 'percentage stored')
  assert.equal(bundle.calls.setRightbar.at(-1), 768, '40 percent of 1920 applied at once')
})

console.log('')
console.log('-- C. toggle semantics (regression guard) --')

await group('a CLOSE does not re-apply a width', () => {
  // Collapsed marker ABSENT = the sidebar is currently open, so this toggle closes it.
  const bundle = boot({ collapsed: false, seed: { [KEY_SIDEBAR]: '360' } })
  const before = bundle.calls.setSidebar.length
  bundle.panels.toggleSidebar()
  assert.equal(bundle.calls.setSidebar.length, before, 'no width written while closing')
  assert.equal(bundle.panels.sidebar, 0, 'sidebar actually closed')
})

await group('an OPEN re-applies the remembered width over the host default', () => {
  // Collapsed marker PRESENT = currently closed, so this toggle opens it back to 280.
  const bundle = boot({ collapsed: true, seed: { [KEY_SIDEBAR]: '360' } })
  bundle.panels.sidebar = 0
  bundle.panels.toggleSidebar()
  assert.equal(bundle.calls.setSidebar.at(-1), 360, 'remembered width restored')
  assert.equal(bundle.panels.sidebar, 360, 'frame landed on the preference')
})

console.log('')
console.log('-- D. sidebar font axis --')

await group('publishes the font variable on html AND body', () => {
  const bundle = boot({ seed: { [KEY_FONT]: '15' } })
  assert.equal(bundle.documentElement.style.props['--dsh-ff-font'], '15px', 'html written')
  assert.equal(bundle.body.style.props['--dsh-ff-font'], '15px', 'body written (cascade guard)')
})

await group('clamps the font size into 11..16', () => {
  const cases = [['99', '16px'], ['1', '11px'], ['xx', '13px'], ['14', '14px']]
  for (const pair of cases) {
    const bundle = boot({ seed: { [KEY_FONT]: pair[0] } })
    assert.equal(bundle.documentElement.style.props['--dsh-ff-font'], pair[1], 'stored ' + pair[0])
  }
})

await group('clamps the right-panel percentage into 15..60', () => {
  const cases = [['5', 15], ['99', 60], ['40', 40]]
  for (const pair of cases) {
    const bundle = boot({ seed: { [KEY_RIGHTBAR]: pair[0] } })
    const row = bundle.registered.find((entry) => entry.id === 'folders-rightbar-width')
    let synced
    row.inject({ sync: (next) => { synced = next } }).setRightbarPct(Number(pair[0]))
    assert.equal(synced.rightbarPct, pair[1], 'pct ' + pair[0])
  }
})

console.log('')
console.log('-- E. registration shape --')

await group('registers exactly the three General rows, in order', () => {
  const bundle = boot({})
  const rows = bundle.registered.filter((entry) => entry.name === 'settings.general.item')
  assert.deepEqual(rows.map((r) => r.id), [
    'folders-sidebar-width', 'folders-rightbar-width', 'folders-sidebar-font',
  ], 'row ids')
  assert.equal(new Set(rows.map((r) => r.order)).size, rows.length, 'orders distinct')
  const orders = rows.map((r) => r.order)
  assert.deepEqual(orders, orders.slice().sort((a, b) => a - b), 'orders ascend')
})

await group('every General row binds the plugin namespace and a store', () => {
  const bundle = boot({})
  const rows = bundle.registered.filter((entry) => entry.name === 'settings.general.item')
  for (const row of rows) {
    assert.equal(row.locale, 'dsh-session-folders-custom', row.id + ' namespace')
    assert.ok(row.store, row.id + ' store')
    assert.equal(typeof row.inject, 'function', row.id + ' inject')
  }
})

console.log('')
console.log('-- F. source invariants (negative controls) --')

await group('the sidebar rows consume the font axis instead of a px literal', () => {
  assert.match(source, /var\(--dsh-ff-font, 13px\)/, 'font axis consumed')
  assert.doesNotMatch(source, /\.dsh-ff__session-row \{[^}]*font-size: 13px/, 'session row unpinned')
  assert.doesNotMatch(source, /\.dsh-ff__folder-row \{[^}]*font-size: 13px/, 'folder row unpinned')
})

await group('the percentage and the px drag memory keep separate keys', () => {
  assert.match(source, /"dsh\.session-folders-custom\.rightbar-width"/, 'pct key')
  assert.match(source, /"dsh\.session-folders-custom\.rightbar-px"/, 'px key')
})

await group('html and body are both written for the font variable', () => {
  assert.match(source, /root\.style\.setProperty\(FONT_VAR/, 'html write present')
  assert.match(source, /body\.style\.setProperty\(FONT_VAR/, 'body write present')
  // The cascade guard only holds if BOTH targets are written; one alone is overridden.
  assert.match(source, /document\.documentElement/, 'documentElement is the html target')
})

console.log('')
console.log('=== FAILED COUNT: ' + failures + ' ===')
if (failures > 0) process.exitCode = 1
