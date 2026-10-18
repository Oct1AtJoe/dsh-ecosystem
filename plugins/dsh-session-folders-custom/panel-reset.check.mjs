// Runnable check for the center-column panel reset in lib/client.js.
//
// The sidebar row click must select the Session AND return the center column
// to the Conversation. dshmarket registers a `main` panel (the market page),
// so a bare sessions.open() leaves the market on screen. This loads the real
// shipped bundle with stubbed platform modules and drives the injected face.
//
// Run: node panel-reset.check.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = await readFile(join(here, 'lib', 'client.js'), 'utf8')

/** Minimal ESM-ish stubs: the factory only reaches for these at apply time. */
const passthrough = new Proxy(function () {}, {
  get: (_t, prop) => (prop === '__esModule' ? false : passthrough),
  apply: () => passthrough,
  construct: () => passthrough,
})

const calls = { open: [], selectPanel: [] }
let registration

const ctx = {
  effect: (fn) => { fn(); return () => {} },
  get: (name) => (name === 'layout'
    ? { selectPanel: (id) => { calls.selectPanel.push(id) } }
    : undefined),
  locale: { register: () => () => {}, bind: () => (key) => key, subscribe: () => () => {} },
  sessions: {
    open: (id) => { calls.open.push(id) },
    search: async () => ({ ok: true, value: { rows: [] } }),
    searchResultLimit: 20,
    fork: () => Promise.resolve('child-1'),
    binding: () => undefined,
  },
  workspaces: {},
  uiWorkspace: {},
  slots: {
    inject: (_name, callback) => { registration = callback() },
    register: (meta) => { registration = { meta } ; return () => {} },
  },
}

let plugin
const sandbox = {
  window: {
    __ModuleLoader__: {
      load: (mod) => { plugin = mod.factory((spec) => {
        if (spec === 'react' || spec === 'react-dom' || spec === 'react/jsx-runtime') return passthrough
        return new Proxy({}, { get: () => passthrough })
      }) },
    },
  },
  document: { createElement: () => ({ style: {}, dataset: {}, setAttribute: () => {}, appendChild: () => {} }), head: { appendChild: () => {} }, querySelector: () => ({}) },
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

// Capture the sidebar.workspaces registration by letting inject run eagerly.
const captured = []
ctx.slots.inject = (_name, callback) => {
  callback()
}
ctx.slots.register = (meta) => { captured.push(meta); return () => {} }
plugin.apply(ctx)

assert.equal(captured.length, 1, 'one sidebar.workspaces registration')
const face = captured[0].inject()
assert.equal(typeof face.open, 'function', 'injected face exposes open')

// The behaviour under test: a row click selects the session AND leaves the panel.
face.open('session-7')
assert.deepEqual(calls.open, ['session-7'], 'session selected')
assert.deepEqual(calls.selectPanel, [null], 'center column returned to the conversation')

// Fork must land in the conversation too, not in whatever panel was open.
calls.open.length = 0
calls.selectPanel.length = 0
face.forkSession('session-7')
await new Promise((resolve) => setTimeout(resolve, 0))
assert.deepEqual(calls.open, ['child-1'], 'forked child selected')
assert.deepEqual(calls.selectPanel, [null], 'fork also returns to the conversation')

console.log('ok: open/forkSession reset the center column panel')
