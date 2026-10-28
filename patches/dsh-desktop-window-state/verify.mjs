#!/usr/bin/env node
/**
 * Verify the dsh-desktop-window-state patch is really in place.
 *
 * Judged on the patch's own symbols, never on locale copy. A symbol hit alone is
 * not enough, so each rewrite is asserted to sit in the function it belongs to,
 * and `node --check` proves the rewritten module still parses.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const target = process.env.DSH_MAIN_JS
  ?? 'E:/dshDesktop/resources/app.asar.unpacked/lib/main.js'

const source = readFileSync(target, 'utf8')

/** Slice one function body so a stray hit elsewhere cannot pass. */
function body(startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  if (start === -1) return ''
  const end = source.indexOf(endMarker, start + startMarker.length)
  return end === -1 ? source.slice(start) : source.slice(start, end)
}

const createWindowBody = body('function createWindow(', 'async function main() {')
const mainWindowBody = body('const createMainWindow = () => {', 'const enterWorkspace = async')

const checks = {
  /** Both helpers exist and are wired into the window lifecycle. */
  helpersInjected: source.includes('function persistWindowState(window) {')
    && source.includes('function readWindowState() {'),
  /** The hard-coded geometry was replaced by the saved state. */
  boundsRestored: createWindowBody.includes('...(savedWindowState?.bounds ?? { width: 1280, height: 820 }),')
    && !createWindowBody.includes('width: 1280,\n\t\theight: 820,'),
  maximizedRestored: createWindowBody.includes('if (savedWindowState?.maximized === true) window.maximize();'),
  /** Save triggers are wired and the close handler flushes synchronously. */
  saveWired: mainWindowBody.includes('for (const event of ["resize", "move", "maximize", "unmaximize"]) window.on(event, saveWindowState);'),
  closeFlushed: mainWindowBody.includes('window.on("close", (event) => {\n\t\t\tpersistWindowState(window);'),
  /** Off-screen guard survives, so an unplugged monitor cannot hide the window. */
  offScreenGuard: source.includes('screen.getAllDisplays().some('),
}

const syntax = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' })
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)

const report = {
  ok: failed.length === 0 && syntax.status === 0,
  target,
  checks,
  syntaxOk: syntax.status === 0,
  ...(failed.length === 0 ? {} : { failed }),
  ...(syntax.status === 0 ? {} : { syntaxError: syntax.stderr.slice(0, 400) }),
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
