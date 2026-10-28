#!/usr/bin/env node
/**
 * Verify the dsh-desktop-net-fetch patch is really in place.
 *
 * Judged on the patch's own symbol, never on locale copy: `net.fetch(target, init)`
 * appears nowhere else in the shell. A symbol hit alone is not enough, so the
 * call is also asserted to sit inside `forwardWebRequest`, and `node --check`
 * proves the rewritten module still parses.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const target = process.env.DSH_MAIN_JS
  ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js'

const source = readFileSync(target, 'utf8')
const symbolHits = source.split('net.fetch(target, init)').length - 1

/** Slice the body of `forwardWebRequest` so a stray hit elsewhere cannot pass. */
function insideForwardWebRequest(text) {
  const start = text.indexOf('async function forwardWebRequest(')
  if (start === -1) return false
  const next = text.indexOf('\nasync function', start + 1)
  const body = next === -1 ? text.slice(start) : text.slice(start, next)
  return body.includes('net.fetch(target, init)')
}

const syntax = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' })

const report = {
  ok: symbolHits > 0 && insideForwardWebRequest(source) && syntax.status === 0,
  target,
  symbolHits,
  insideForwardWebRequest: insideForwardWebRequest(source),
  syntaxOk: syntax.status === 0,
  ...(syntax.status === 0 ? {} : { syntaxError: syntax.stderr.slice(0, 400) }),
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
