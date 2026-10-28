#!/usr/bin/env node
/**
 * 放宽网关 WebSocket 心跳阈值：把 MAX_MISSED_HEARTBEATS 从 2 提到 10。
 *
 * 手法与 desktop-menu 一致：把目标文件标为 asar unpacked，正文写到
 * `app.asar.unpacked/` 下的磁盘文件，只重写 asar 头部 JSON（等长填充），
 * 数据区一个字节都不移动。
 *
 * 用法：
 *   node patch.mjs                  应用
 *   node patch.mjs --check          只报告状态
 *   node patch.mjs --revert         还原（从头备份恢复）
 *   node patch.mjs --dry-run        演练，不写文件
 *
 * 换安装路径：--app-dir D:\other\dsh
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { openArchive, readHeader, entryAt, readPacked, writeHeaderInPlace } from './lib/asar.mjs'
import { PATCH_MARK, TARGET, applyRules, revertRules } from './lib/rules.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const DRY_RUN = args.includes('--dry-run')
const MODE = args.includes('--revert') ? 'revert' : args.includes('--check') ? 'check' : 'apply'

const ASAR = join(APP_DIR, 'resources', 'app.asar')
const UNPACKED = join(APP_DIR, 'resources', 'app.asar.unpacked')
const TARGET_DISK = join(UNPACKED, ...TARGET.split('/'))

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/** 官方版本号，用于备份命名。 */
function appVersion(fd, header) {
  try {
    const entry = entryAt(header.json, 'package.json')
    if (entry === undefined) return 'unknown'
    const raw = readPacked(fd, entry, header.dataStart).toString('utf8')
    try {
      return JSON.parse(raw).version ?? 'unknown'
    } catch {
      return /"version"\s*:\s*"([^"]+)"/u.exec(raw)?.[1] ?? 'unknown'
    }
  } catch {
    return 'unknown'
  }
}

if (!existsSync(ASAR)) {
  console.error(JSON.stringify({ mode: MODE, error: `missing ${ASAR}` }))
  process.exit(1)
}

const archive = openArchive(ASAR, { readOnly: MODE === 'check' })
try {
  const header = readHeader(archive.fd)
  const entry = entryAt(header.json, TARGET)
  if (entry === undefined) throw new Error(`archive has no ${TARGET}`)

  const alreadyUnpacked = entry.unpacked === true
  const onDisk = alreadyUnpacked && existsSync(TARGET_DISK) ? readFileSync(TARGET_DISK, 'utf8') : undefined
  const applied = onDisk !== undefined && onDisk.startsWith(PATCH_MARK)

  if (MODE === 'check') {
    console.log(JSON.stringify({
      mode: MODE,
      target: TARGET_DISK,
      unpacked: alreadyUnpacked,
      applied,
      canApply: !alreadyUnpacked,
      canRevert: applied,
    }, null, 2))
    process.exit(0)
  }

  if (MODE === 'revert') {
    if (!applied) {
      console.log(JSON.stringify({ mode: MODE, applied: false, changed: false }))
      process.exit(0)
    }
    writeFileSync(TARGET_DISK, revertRules(onDisk.replace(PATCH_MARK + '\n', '')))
    console.log(JSON.stringify({ mode: MODE, applied: false, changed: true }))
    process.exit(0)
  }

  // apply
  if (alreadyUnpacked) {
    if (!applied) throw new Error(`${TARGET} is already unpacked but is not this patch; revert first`)
    console.log(JSON.stringify({ mode: MODE, applied: true, changed: false }))
    process.exit(0)
  }

  const original = readPacked(archive.fd, entry, header.dataStart)
  const patchedText = PATCH_MARK + '\n' + applyRules(original.toString('utf8'))
  const patchedBuf = Buffer.from(patchedText, 'utf8')

  // 语法自检必须在写真实文件之前
  const probe = join(tmpdir(), `gateway-heartbeat-${Date.now()}.mjs`)
  writeFileSync(probe, patchedText, 'utf8')
  try {
    execFileSync(process.execPath, ['--check', probe], { stdio: 'pipe' })
  } catch (error) {
    throw new Error(`syntax check failed, aborted:\n${error.stderr?.toString() ?? error.message}`)
  }

  const report = {
    version: appVersion(archive.fd, header),
    originalBytes: original.length,
    patchedBytes: patchedBuf.length,
  }

  if (DRY_RUN) {
    console.log('— DRY RUN —')
    console.log(JSON.stringify(report, null, 2))
    process.exit(0)
  }

  const backup = join(APP_DIR, 'resources', `app.asar.orig-${report.version}`)
  if (!existsSync(backup)) copyFileSync(ASAR, backup)

  mkdirSync(dirname(TARGET_DISK), { recursive: true })
  writeFileSync(TARGET_DISK, patchedBuf)

  const json = header.json
  let node = json
  const segs = TARGET.split('/')
  for (const seg of segs.slice(0, -1)) node = node.files[seg]
  const newHash = sha256(patchedBuf)
  node.files[segs[segs.length - 1]] = {
    size: patchedBuf.length,
    unpacked: true,
    integrity: { algorithm: 'SHA256', hash: newHash, blockSize: 4194304, blocks: [newHash] },
  }
  const written = writeHeaderInPlace(archive.fd, json, header.jsonLength)

  console.log(JSON.stringify({ mode: MODE, applied: true, changed: true, ...report, slack: written.slack }, null, 2))
} finally {
  archive.close()
}
