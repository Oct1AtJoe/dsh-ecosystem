import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

function mount() {
  let hook
  const ctx = {
    on(ev, cb) { if (ev === 'tools/pre-execute') hook = cb },
    inject(_deps, cb) { cb({ systemPrompt: { section() {} }, tools: { register() {} } }) },
    effect() {},
    tools: { register() {} },
  }
  apply(ctx, { trashRoot: 'C:\\Users\\Administrator\\.dsh\\tmp\\trash-hook-test' })
  return hook
}
const next = () => ({ kind: 'pass' })

test('hook denies ops_bash rm', async () => {
  const h = mount()
  const r = await h({ name: 'ops_bash', arguments: { command: 'rm -rf x' } }, next)
  assert.equal(r.kind, 'deny')
})
test('hook allows ops_bash without delete', async () => {
  const h = mount()
  const r = await h({ name: 'ops_bash', arguments: { command: 'ls -la' } }, next)
  assert.equal(r.kind, 'pass')
})
test('hook denies ops_remove', async () => {
  const h = mount()
  const r = await h({ name: 'ops_remove', arguments: { path: 'a.txt' } }, next)
  assert.equal(r.kind, 'deny')
})
test('hook denies ops_batch remove (run), allows plan', async () => {
  const h = mount()
  const run = await h({ name: 'ops_batch', arguments: { action: 'run', operations: [{ op: 'remove', path: 'c' }] } }, next)
  assert.equal(run.kind, 'deny')
  const plan = await h({ name: 'ops_batch', arguments: { action: 'plan', operations: [{ op: 'remove', path: 'c' }] } }, next)
  assert.equal(plan.kind, 'pass')
})
test('hook allows unrelated ops tool', async () => {
  const h = mount()
  const r = await h({ name: 'ops_stat', arguments: { path: 'a' } }, next)
  assert.equal(r.kind, 'pass')
})
