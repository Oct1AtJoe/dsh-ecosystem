import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ANCHOR_FN, ANCHOR_THROW, ANCHOR_WELCOME, MARKER, applyRules, cookieNameFor, revertRules } from '../lib/rules.mjs'

const fixture = [
  '\t\t\t\tconst ready = await host.start();',
  '\t\t\t\thostCookie = await authenticateWebHost(ready.url);',
  ANCHOR_WELCOME,
  '\t\t\t\tanalyticsEnabled = await welcomeBackend.analyticsEnabled().catch(() => false);',
  '\tawait authenticated.body?.cancel();',
  ANCHOR_THROW,
  '\tconst invoke = async (request, signal) => {',
  ANCHOR_FN,
  '\tconst origin = new URL(authenticatedUrl).origin;',
  '}',
  '',
].join('\n')

test('applies every rule and is idempotent', () => {
  const once = applyRules(fixture)
  assert.ok(once.includes(MARKER))
  assert.ok(once.includes('async function pruneStaleHostCookies(url) {'))
  assert.ok(once.includes('HTTP ${authenticated.status}'))
  assert.ok(!once.includes(ANCHOR_THROW))
  assert.equal(applyRules(once), once, 'second apply must be a no-op')
})

test('prune call runs before the welcome handshake', () => {
  const once = applyRules(fixture)
  assert.ok(once.indexOf(MARKER) < once.indexOf('welcomeBackend = await connectDesktopWelcome(ready.url'))
})

test('revert restores the original source byte for byte', () => {
  assert.equal(revertRules(applyRules(fixture)), fixture)
})

test('revert on an unpatched source is a no-op', () => {
  assert.equal(revertRules(fixture), fixture)
})

test('a changed anchor fails loudly instead of writing a half-patched file', () => {
  const drifted = fixture.replace('const ready = await host.start();', 'const ready = await host.launch();')
  assert.throws(() => applyRules(drifted.replace(ANCHOR_WELCOME, 'welcomeBackend = undefined;')), /anchor not found/u)
})

test('the real shell entry still matches every anchor', { skip: realSource() === undefined }, () => {
  // The live file may already be patched, which removes the very anchors we want
  // to inspect; revert first so this proves they still exist upstream.
  const source = revertRules(realSource())
  for (const anchor of [ANCHOR_FN, ANCHOR_THROW, ANCHOR_WELCOME]) {
    assert.ok(source.includes(anchor), `anchor drifted: ${anchor.slice(0, 60)}…`)
  }
  // And the whole pipeline still round-trips on the real file, not just a fixture.
  assert.ok(applyRules(source).includes(MARKER))
})

test('cookie names differ per authority, which is why stale ones accumulate', () => {
  assert.notEqual(cookieNameFor('127.0.0.1:50001'), cookieNameFor('127.0.0.1:50002'))
  assert.ok(cookieNameFor('127.0.0.1:50001').startsWith('dsh-auth-'))
})

/** @returns the live shell entry, or undefined when this machine has no DSH install. */
function realSource() {
  try {
    return readFileSync(process.env.DSH_MAIN_JS ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js', 'utf8')
  } catch {
    return undefined
  }
}
