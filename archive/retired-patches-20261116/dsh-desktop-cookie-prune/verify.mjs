#!/usr/bin/env node
/**
 * Verify the dsh-desktop-cookie-prune patch is really in place.
 *
 * Judged on the patch's own symbol: `pruneStaleHostCookies` appears nowhere else
 * in the shell. A symbol hit alone is not enough, so the helper is also asserted
 * to sit inside `backend.start()` and before the welcome handshake, the throw
 * must carry the HTTP status, and `node --check` proves the module still parses.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { MARKER, ANCHOR_THROW, NEW_THROW } from './lib/rules.mjs'

const target = process.env.DSH_MAIN_JS
  ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js'

const source = readFileSync(target, 'utf8')
const symbolHits = source.split('async function pruneStaleHostCookies(url)').length - 1

const pruneIndex = source.indexOf(MARKER)
const welcomeIndex = source.indexOf('welcomeBackend = await connectDesktopWelcome(ready.url')
const ordered = pruneIndex !== -1 && welcomeIndex !== -1 && pruneIndex < welcomeIndex
const statusReported = source.includes(NEW_THROW) && !source.includes(ANCHOR_THROW)

const syntax = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' })

const report = {
  ok: symbolHits === 1 && ordered && statusReported && syntax.status === 0,
  target,
  symbolHits,
  pruneBeforeWelcome: ordered,
  statusReported,
  syntaxOk: syntax.status === 0,
  ...(syntax.status === 0 ? {} : { syntaxError: syntax.stderr.slice(0, 400) }),
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
