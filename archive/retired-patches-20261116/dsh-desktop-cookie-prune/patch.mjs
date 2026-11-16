#!/usr/bin/env node
/**
 * Apply / check / revert the dsh-desktop-cookie-prune patch.
 *
 * Target: the unpacked shell entry `lib/main.js`, which must already exist.
 * That file only reaches `app.asar.unpacked` because the `desktop-menu` patch
 * unpacked it; this patch never rewrites the asar header.
 *
 * Usage:
 *   node patch.mjs            apply
 *   node patch.mjs --check    report status without writing
 *   node patch.mjs --revert   undo this patch from the live file
 *   node patch.mjs --dry-run  report the byte delta without writing
 *
 * Override the target with `DSH_MAIN_JS` for a non-default install path.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MARKER, applyRules, revertRules } from './lib/rules.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const target = process.env.DSH_MAIN_JS
  ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js'
// Snapshot taken right before this patch rewrites the file; it already carries
// the sibling patches, so it is a last-resort restore target only — `--revert`
// always undoes this patch from the live file instead.
const backup = join(here, 'main.js.pre-cookie-prune')

const mode = process.argv.includes('--revert') ? 'revert'
  : process.argv.includes('--check') ? 'check'
  : process.argv.includes('--dry-run') ? 'dry-run'
  : 'apply'

if (!existsSync(target)) {
  console.error(JSON.stringify({ mode, target, error: 'target missing; apply the desktop-menu patch first' }))
  process.exit(1)
}

const source = readFileSync(target, 'utf8')

if (mode === 'check') {
  const applied = source.includes(MARKER)
  console.log(JSON.stringify({
    mode,
    target,
    applied,
    canApply: !applied,
    canRevert: applied,
  }))
  process.exit(0)
}

if (mode === 'dry-run') {
  try {
    const next = applyRules(source)
    console.log(JSON.stringify({ mode, target, applied: false, wouldChange: next !== source, patchedBytes: next.length }))
  } catch (error) {
    console.error(JSON.stringify({ mode, target, error: error.message }))
    process.exit(1)
  }
  process.exit(0)
}

if (mode === 'revert') {
  writeFileSync(target, revertRules(source))
  console.log(JSON.stringify({ mode, target, applied: false, changed: true }))
  process.exit(0)
}

// apply
if (source.includes(MARKER)) {
  console.log(JSON.stringify({ mode, target, applied: true, changed: false }))
  process.exit(0)
}
if (!existsSync(backup)) copyFileSync(target, backup)
writeFileSync(target, applyRules(source))
console.log(JSON.stringify({ mode, target, applied: true, changed: true }))
