// Runnable check for Session navigation in lib/client.js.
//
// Current hosts dropped `sessions.open()`: navigation belongs to the view owner,
// and ui-workspace pairs "retain the Session" with `layout.selectPanel(null)` in
// UiWorkspaceService.openSession. The sidebar row click must call that owner, or
// the click selects nothing. Legacy hosts keep the old pair as a fallback. This
// loads the real shipped bundle with stubbed platform modules and drives the
// injected face.
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

const calls = { openSession: [], open: [], selectPanel: [] }
let registration
let uiWorkspace = { openSession: (id) => { calls.openSession.push(id) } }

const ctx = {
  effect: (fn) => { fn(); return () => {} },
  get: (name) => {
    if (name === 'layout') return { selectPanel: (id) => { calls.selectPanel.push(id) } }
    if (name === 'uiWorkspace') return uiWorkspace
    return undefined
  },
  locale: { register: () => () => {}, bind: () => (key) => key, subscribe: () => () => {} },
  sessions: {
    // Legacy API: current hosts no longer provide it, and it must stay unused
    // while ui-workspace is present.
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

assert.equal(captured.length, 2, 'sidebar.workspaces plus the settings launcher')
const workspaces = captured.find(entry => entry.name === 'sidebar.workspaces')
assert.ok(workspaces, 'sidebar.workspaces registration')
const face = workspaces.inject()
assert.equal(typeof face.open, 'function', 'injected face exposes open')

// Current host: the ui-workspace owner selects the Session and reveals the
// Conversation (it calls layout.selectPanel(null) itself).
face.open('session-7')
assert.deepEqual(calls.openSession, ['session-7'], 'ui-workspace owns navigation')
assert.deepEqual(calls.open, [], 'legacy sessions.open stays unused')

// Fork must land in the conversation too, not in whatever panel was open.
calls.openSession.length = 0
face.forkSession('session-7')
await new Promise((resolve) => setTimeout(resolve, 0))
assert.deepEqual(calls.openSession, ['child-1'], 'forked child selected')

// Legacy host without ui-workspace: fall back to the old pair.
uiWorkspace = undefined
calls.open.length = 0
calls.selectPanel.length = 0
face.open('session-8')
assert.deepEqual(calls.open, ['session-8'], 'legacy session selected')
assert.deepEqual(calls.selectPanel, [null], 'legacy center column returned to the conversation')

console.log('ok: open/forkSession navigate through ui-workspace, legacy pair as fallback')

// Pending interaction: the row dot must read ui-session's status map through
// the standard `useSessionStatus` prop. The removed `useSessionPendingInteraction`
// prop left the map empty, so a parked run kept spinning (the reported bug).
assert.match(source, /useSessionStatus/, 'bundle binds the standard status hook')
assert.match(source, /statusBySession\.get\(summary\.id\)\?\.pendingInteraction\?\.kind/, 'row status folds the pending kind from the status map')
assert.doesNotMatch(source, /useSessionPendingInteraction/, 'removed host prop must not come back')

console.log('ok: pending interaction reads useSessionStatus')

// Sidebar foot: a negative-priority settings launcher shadows the account
// "More" popover, so the shipped Settings entry shows again.
const launcher = captured.find(entry => entry.name === 'settings.launcher')
assert.ok(launcher, 'settings.launcher registration')
assert.ok(typeof launcher.priority === 'number' && launcher.priority < 0, 'launcher outranks the account entry')

console.log('ok: settings launcher shadows the account More menu')

