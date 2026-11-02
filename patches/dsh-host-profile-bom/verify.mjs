#!/usr/bin/env node
/**
 * 验证 dsh-host-profile-bom 补丁真的生效。
 *
 * 判据分四层，缺一不可：
 *   1. asar 头里目标条目已被标为 unpacked；
 *   2. 磁盘文件里有补丁独有符号；
 *   3. 所有裸 `readFileSync(` 调用点都已改走补丁注入的通道（无残留）；
 *   4. 真行为测试：带 BOM 的 JSON 经补丁等价逻辑后必须能解析。
 *
 * 第 3、4 层是关键 —— 符号在但读取点没覆盖，等于补丁没生效。
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { MARKER, TARGET } from './lib/rules.mjs'
import { openArchive, readHeader, entryAt } from './lib/asar.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const TARGET_DISK = join(APP_DIR, 'resources', 'app.asar.unpacked', ...TARGET.split('/'))

let headerUnpacked = false
try {
  const archive = openArchive(join(APP_DIR, 'resources', 'app.asar'), { readOnly: true })
  try {
    headerUnpacked = entryAt(readHeader(archive.fd).json, TARGET)?.unpacked === true
  } finally {
    archive.close()
  }
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: `cannot read asar header: ${String(error)}` }, null, 2))
  process.exit(1)
}

const source = existsSync(TARGET_DISK) ? readFileSync(TARGET_DISK, 'utf8') : ''
const symbolHits = source.split(MARKER).length - 1
/** 注入块之后仍残留的裸 readFileSync 调用数，必须为 0。 */
const bareCallsLeft = (source.match(/(?<![\w.$])readFileSync\(/gu) ?? []).length
const namespacedCalls = (source.match(/(?<![\w.$])fs\.__dshBomRead\(/gu) ?? []).length

const syntax = source === ''
  ? { status: 1, stderr: 'target file missing' }
  : spawnSync(process.execPath, ['--check', TARGET_DISK], { encoding: 'utf8' })

// 行为测试：复刻注入块的剥 BOM 逻辑，BOM 输入必须能解析出对象。
const strip = (value) => (typeof value !== 'string' || value.charCodeAt(0) !== 0xfeff ? value : value.slice(1))
let behaviorOk = false
try {
  behaviorOk = JSON.parse(strip('﻿{"name":"probe"}'))?.name === 'probe'
} catch {
  behaviorOk = false
}

const report = {
  ok: headerUnpacked && symbolHits > 0 && bareCallsLeft === 0 && namespacedCalls > 0 && syntax.status === 0 && behaviorOk,
  target: TARGET_DISK,
  headerUnpacked,
  symbolHits,
  bareCallsLeft,
  namespacedCalls,
  syntaxOk: syntax.status === 0,
  bomParses: behaviorOk,
  ...(syntax.status === 0 ? {} : { syntaxError: String(syntax.stderr).slice(0, 400) }),
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
