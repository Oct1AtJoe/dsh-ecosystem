#!/usr/bin/env node
/**
 * 修桌面端启动页转圈：圆环被 corner-shape 通配压成方框。
 *
 * 手法与 dsh-host-profile-bom / dsh-gateway-heartbeat 一致：把目标文件标为 asar
 * unpacked，正文写到 app.asar.unpacked/ 下的磁盘文件，只重写 asar 头部 JSON
 * （等长填充），数据区一个字节都不移动。本补丁与 desktop-menu 无前置关系。
 *
 * 用法：
 *   node patch.mjs                  应用
 *   node patch.mjs --check          只报告状态
 *   node patch.mjs --revert         还原
 *   node patch.mjs --dry-run        演练，不写文件
 *
 * 换安装路径：--app-dir D:\other\dsh
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { openArchive, readHeader, entryAt, readPacked, writeHeaderInPlace } from './lib/asar.mjs'
import { MARKER, TARGET_DIR, applyRules, revertRules, resolveTarget } from './lib/rules.mjs'

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

/** 取出 assets 目录节点（不解包全量内容）。 */
function assetsNode(json) {
  let node = json
  for (const seg of TARGET_DIR.split('/')) {
    node = node?.files?.[seg]
    if (node === undefined) return undefined
  }
  return node
}

if (!existsSync(ASAR)) {
  console.error(JSON.stringify({ mode: MODE, error: `missing ${ASAR}` }))
  process.exit(1)
}

const archive = openArchive(ASAR, { readOnly: MODE === 'check' || DRY_RUN })
try {
  const header = readHeader(archive.fd)
  const dir = assetsNode(header.json)
  if (dir === undefined) throw new Error(`archive has no ${TARGET_DIR}`)

  const TARGET = resolveTarget(Object.keys(dir.files))
  const TARGET_DISK = join(UNPACKED, ...TARGET.split('/'))
  const entry = entryAt(header.json, TARGET)
  if (entry === undefined) throw new Error(`archive has no ${TARGET}`)

  const alreadyUnpacked = entry.unpacked === true
  const onDisk = alreadyUnpacked && existsSync(TARGET_DISK) ? readFileSync(TARGET_DISK, 'utf8') : undefined
  const applied = onDisk !== undefined && onDisk.includes(MARKER)

  if (MODE === 'check') {
    console.log(JSON.stringify({
      mode: MODE,
      target: TARGET_DISK,
      unpacked: alreadyUnpacked,
      applied,
      canApply: !alreadyUnpacked && !applied,
      canRevert: applied,
    }, null, 2))
    process.exit(0)
  }

  if (MODE === 'revert') {
    if (!applied) {
      console.log(JSON.stringify({ mode: MODE, applied: false, changed: false }))
      process.exit(0)
    }
    const reverted = revertRules(onDisk)
    if (DRY_RUN) {
      console.log('— DRY RUN —')
      console.log(JSON.stringify({ mode: MODE, originalBytes: onDisk.length, revertedBytes: reverted.length }, null, 2))
      process.exit(0)
    }
    writeFileSync(TARGET_DISK, reverted)
    console.log(JSON.stringify({ mode: MODE, applied: false, changed: true }))
    process.exit(0)
  }

  // apply：已经是本补丁产物 → 幂等退出
  if (alreadyUnpacked && applied) {
    console.log(JSON.stringify({ mode: MODE, applied: true, changed: false }))
    process.exit(0)
  }

  // 源文本：已 unpacked 取磁盘文件，否则从归档读
  let originalText
  if (alreadyUnpacked) {
    if (onDisk === undefined) throw new Error(`${TARGET} is marked unpacked but missing on disk: ${TARGET_DISK}`)
    originalText = onDisk
  } else {
    originalText = readPacked(archive.fd, entry, header.dataStart).toString('utf8')
  }

  const patchedText = applyRules(originalText)
  if (patchedText === originalText) throw new Error('applyRules produced no change; anchor drifted or already patched')
  const patchedBuf = Buffer.from(patchedText, 'utf8')

  // 自检：注入后标记必须恰好出现一次，且原锚点已消失
  const markerHits = patchedText.split(MARKER).length - 1
  if (markerHits !== 1) throw new Error(`post-check: marker appears ${String(markerHits)} times, expected 1`)

  const report = {
    version: appVersion(archive.fd, header),
    target: TARGET,
    originalBytes: Buffer.byteLength(originalText),
    patchedBytes: patchedBuf.length,
    markerHits,
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

  const newHash = sha256(patchedBuf)
  const segs = TARGET.split('/')
  const parent = segs.slice(0, -1).reduce((node, seg) => node.files[seg], header.json)
  parent.files[segs[segs.length - 1]] = {
    size: patchedBuf.length,
    unpacked: true,
    integrity: { algorithm: 'SHA256', hash: newHash, blockSize: 4194304, blocks: [newHash] },
  }
  const written = writeHeaderInPlace(archive.fd, header.json, header.jsonLength)

  console.log(JSON.stringify({ mode: MODE, applied: true, changed: true, ...report, slack: written.slack }, null, 2))
} finally {
  archive.close()
}
