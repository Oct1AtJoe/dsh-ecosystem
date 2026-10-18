/**
 * Regression gate: the hero-phase predicate must not be satisfied by unrelated
 * popovers that happen to use a `…_headline` class.
 *
 * The context-usage dialog renders `<span class="…_headline">上下文已用</span>`.
 * While `[class*="_headline"]` was part of the predicate, opening that popover
 * on an ordinary conversation flipped the body into hero mode and the model
 * usage panel appeared behind it.
 *
 * Run: node tests/hero-predicate-check.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const sources = {
  'src/client/index.ts': 'isHeroPhase',
  'src/client/usage/HomeUsagePanel.tsx': 'checkHeroPhase',
}
const bundle = 'lib/client.js'

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

/** Slice one simple `function name() { … }` body by brace matching. */
function bodyOf(text, name) {
  const start = text.indexOf(`function ${name}()`)
  assert.notEqual(start, -1, `${name} not found`)
  const open = text.indexOf('{', start)
  let depth = 0
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1
    else if (text[i] === '}') {
      depth -= 1
      if (depth === 0) return text.slice(open, i + 1)
    }
  }
  throw new Error(`unbalanced braces in ${name}`)
}

// 1. Source: neither predicate may probe `_headline`.
for (const [rel, name] of Object.entries(sources)) {
  const body = bodyOf(read(rel), name)
  assert.equal(
    body.includes('querySelector(\'[class*="_headline"]\')'),
    false,
    `${rel}: ${name} must not use the _headline probe (context popover false-positive)`,
  )
  // It must still detect the real hero tree.
  assert.ok(
    body.includes('_composerHero') || body.includes('data-phase'),
    `${rel}: ${name} must keep an authoritative hero signal`,
  )
}

// 2. Built bundle: the fix must have actually shipped.
const built = read(bundle)
for (const name of ['isHeroPhase', 'checkHeroPhase']) {
  const body = bodyOf(built, name)
  assert.equal(
    body.includes('[class*=\\"_headline\\"]'),
    false,
    `${bundle}: ${name} still probes _headline — rebuild the bundle`,
  )
}

// 3. Negative control: the assertion must be able to fail.
assert.throws(
  () => bodyOf('function nope(){}', 'isHeroPhase'),
  /isHeroPhase not found/,
  'brace-matching helper must reject a missing function',
)

console.log('hero-predicate-check: ok')
