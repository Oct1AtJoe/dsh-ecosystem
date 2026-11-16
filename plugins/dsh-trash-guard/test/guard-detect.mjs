import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findExplicitDelete, findOpsDelete, SHELL_TOOLS } from '../lib/index.js'

test('findExplicitDelete: shell deletes', () => {
  assert.ok(findExplicitDelete('rm -rf node_modules'))
  assert.ok(findExplicitDelete('cd x && del /q a.txt'))
  assert.ok(findExplicitDelete('git clean -xfd'))
  assert.equal(findExplicitDelete('echo hello'), undefined)
  assert.equal(findExplicitDelete('npm run build'), undefined)
})

test('SHELL_TOOLS includes ops_bash and shells', () => {
  for (const n of ['bash', 'pwsh', 'ops_bash', 'shell', 'pwsh_persistent']) assert.ok(SHELL_TOOLS.has(n), n)
})

test('findOpsDelete: ops_remove / remove', () => {
  assert.equal(findOpsDelete('ops_remove', { path: 'a.txt' }), 'remove a.txt')
  assert.equal(findOpsDelete('remove', { path: 'b' }), 'remove b')
  assert.equal(findOpsDelete('ops_remove', {}), undefined)
  assert.equal(findOpsDelete('ops_stat', { path: 'a' }), undefined)
})

test('findOpsDelete: ops_batch remove ops', () => {
  assert.equal(findOpsDelete('ops_batch', { action: 'run', operations: [{ op: 'remove', path: 'c' }] }), 'batch remove c')
  assert.equal(findOpsDelete('batch', { action: 'resume', operations: [{ op: 'copy', path: 'a', to: 'b' }, { op: 'remove', path: 'd' }] }), 'batch remove d')
  assert.equal(findOpsDelete('ops_batch', { action: 'plan', operations: [{ op: 'remove', path: 'c' }] }), undefined)
  assert.equal(findOpsDelete('ops_batch', { action: 'run', operations: [{ op: 'copy', path: 'a', to: 'b' }] }), undefined)
})
