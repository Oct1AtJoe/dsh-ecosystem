// Runnable check for the `dsh:open-session` jump in lib/client.js.
//
// Current hosts removed `sessions.open()`: navigation belongs to the view owner,
// and ui-workspace's openSession is what retains the Session and returns the main
// area to the Conversation. A listener still calling only `sessions.open` is a
// silent no-op — the bubble click opens the window but selects nothing. Legacy
// hosts without ui-workspace keep the old call as a fallback.
//
// Run: node tests/jump-check.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const here = dirname(fileURLToPath(import.meta.url))
const source = await readFile(join(here, '..', 'lib', 'client.js'), 'utf8')

/** Every required module resolves to an inert passthrough. */
const passthrough = new Proxy(function () {}, {
  get: (_t, prop) => (prop === '__esModule' ? false : passthrough),
  apply: () => passthrough,
  construct: () => passthrough,
})

const calls = { openSession: [], open: [] }
const listeners = new Map()
let services = {}

const ctx = {
  effect: (fn) => { fn(); return () => {} },
  get: (name) => services[name],
  locale: { register: () => () => {}, bind: () => (key) => key },
  configForms: {
    get: () => ({
      subscribe: () => () => {},
      getSnapshot: () => ({ status: 'ready', writable: true, value: {} }),
    }),
  },
  slots: { inject: () => {}, register: () => () => {} },
}

let plugin
const sandbox = {
  window: {
    __ModuleLoader__: { load: (mod) => { plugin = mod.factory(() => passthrough) } },
    addEventListener: (name, fn) => { listeners.set(name, fn) },
    removeEventListener: () => {},
  },
  document: {
    createElement: () => ({ style: {}, dataset: {}, setAttribute: () => {}, appendChild: () => {} }),
    head: { appendChild: () => {} },
    querySelector: () => null,
  },
  fetch: () => Promise.reject(new Error('offline')),
  console,
  setTimeout,
  clearTimeout,
}
sandbox.globalThis = sandbox
vm.runInNewContext(source, sandbox, { filename: 'lib/client.js' })

assert.ok(plugin?.apply, 'bundle must export apply')
plugin.apply(ctx)

const jump = listeners.get('dsh:open-session')
assert.equal(typeof jump, 'function', 'apply registers the dsh:open-session listener')

// Current host: ui-workspace owns navigation, sessions.open is unused.
services = {
  uiWorkspace: { openSession: (id) => { calls.openSession.push(id) } },
  sessions: { open: (id) => { calls.open.push(id) } },
}
jump({ detail: { sessionId: 'session-7' } })
assert.deepEqual(calls.openSession, ['session-7'], 'ui-workspace owns navigation')
assert.deepEqual(calls.open, [], 'legacy sessions.open stays unused')

// Unknown ids inside openSession surface through the guard instead of escaping.
services.uiWorkspace.openSession = () => { throw new Error('unknown session') }
assert.doesNotThrow(() => { jump({ detail: { sessionId: 'missing' } }) }, 'unknown ids fail loud but stay contained')

// Legacy host without ui-workspace: fall back to the old call.
calls.open.length = 0
services = { sessions: { open: (id) => { calls.open.push(id) } } }
jump({ detail: { sessionId: 'session-8' } })
assert.deepEqual(calls.open, ['session-8'], 'legacy session selected')

// Empty/absent ids are ignored.
calls.open.length = 0
jump({ detail: {} })
jump({ detail: { sessionId: '' } })
assert.deepEqual(calls.open, [], 'no navigation without an id')

console.log('ok: dsh:open-session jumps through ui-workspace, legacy sessions.open as fallback')
