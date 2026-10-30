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
 *   node patch.mjs --revert   undo this patch from the live file
 *
 * Override the target with `DSH_MAIN_JS` for a non-default install path.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { applyRules, revertRules } from './lib/rules.mjs'

const target = process.env.DSH_MAIN_JS
  ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js'

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
  writeFileSync(target, revertRules(source))
  console.log(JSON.stringify({ mode, target, applied: false, changed: true }))
  process.exit(0)
}

// apply
if (source.includes('net.fetch(target, init)')) {
  console.log(JSON.stringify({ mode, target, applied: true, changed: false }))
  process.exit(0)
}
writeFileSync(target, applyRules(source))
console.log(JSON.stringify({ mode, target, applied: true, changed: true }))
