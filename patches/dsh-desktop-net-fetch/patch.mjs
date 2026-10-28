#!/usr/bin/env node
/**
 * Apply / check / revert the dsh-desktop-net-fetch patch.
 *
 * Target: the unpacked shell entry `lib/main.js`, which must already exist.
 * That file only reaches `app.asar.unpacked` because the `desktop-menu` patch
 * unpacked it; this patch never rewrites the asar header.
 *
 * Usage:
 *   node patch.mjs            apply
 *   node patch.mjs --check    report status without writing
 *   node patch.mjs --revert   restore the original file
 *
 * Override the target with `DSH_MAIN_JS` for a non-default install path.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyRules, revertRules } from './lib/rules.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const target = process.env.DSH_MAIN_JS
  ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js'
const backup = join(here, 'main.js.orig-0.2.1-rc.3')

const mode = process.argv.includes('--revert') ? 'revert'
  : process.argv.includes('--check') ? 'check'
  : 'apply'

if (!existsSync(target)) {
  console.error(JSON.stringify({ mode, target, error: 'target missing; apply the desktop-menu patch first' }))
  process.exit(1)
}

const source = readFileSync(target, 'utf8')

if (mode === 'check') {
  const applied = source.includes('net.fetch(target, init)')
  console.log(JSON.stringify({
    mode,
    target,
    applied,
    canApply: !applied && source.includes('const response = await fetch(target, init);'),
    canRevert: applied,
    ...(applied ? {} : { reason: applied ? undefined : 'not-applied' }),
  }))
  process.exit(0)
}

if (mode === 'revert') {
  if (!existsSync(backup)) {
    console.error(JSON.stringify({ mode, error: 'no backup to restore from' }))
    process.exit(1)
  }
  writeFileSync(target, revertRules(readFileSync(backup, 'utf8')))
  console.log(JSON.stringify({ mode, target, applied: false, changed: true }))
  process.exit(0)
}

// apply
if (source.includes('net.fetch(target, init)')) {
  console.log(JSON.stringify({ mode, target, applied: true, changed: false }))
  process.exit(0)
}
if (!existsSync(backup)) copyFileSync(target, backup)
writeFileSync(target, applyRules(source))
console.log(JSON.stringify({ mode, target, applied: true, changed: true }))
