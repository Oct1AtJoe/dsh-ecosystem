#!/usr/bin/env node
/**
 * 校验网关心跳补丁确实生效。
 *
 * 判据用补丁自己的独有符号（MAX_MISSED_HEARTBEATS = 10），
 * 并确认 asar 头把该条目标为 unpacked —— 只改磁盘文件而没改头，
 * Electron 仍会读包内副本，等于没打。
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { openArchive, readHeader, entryAt } from './lib/asar.mjs'
import { TARGET, NEW } from './lib/rules.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const ASAR = join(APP_DIR, 'resources', 'app.asar')
const TARGET_DISK = join(APP_DIR, 'resources', 'app.asar.unpacked', ...TARGET.split('/'))

const report = { ok: false, target: TARGET_DISK }

if (!existsSync(TARGET_DISK)) {
  report.reason = 'unpacked file missing'
  console.log(JSON.stringify(report, null, 2))
  process.exit(1)
}

const text = readFileSync(TARGET_DISK, 'utf8')
report.symbolHits = text.split(NEW).length - 1
report.hasMark = text.startsWith('/* dsh-ecosystem:gateway-heartbeat v1 */')

const archive = openArchive(ASAR, { readOnly: true })
try {
  const header = readHeader(archive.fd)
  const entry = entryAt(header.json, TARGET)
  report.headerUnpacked = entry?.unpacked === true
} finally {
  archive.close()
}

report.ok = report.symbolHits === 1 && report.headerUnpacked === true
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
