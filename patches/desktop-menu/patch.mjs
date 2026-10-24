/**
 * 给 DSH 官方 Electron 桌面端补两个菜单项：刷新页面（Ctrl+F5 语义）与重启应用。
 * 幂等：已打过补丁会直接跳过；首次运行自动备份 app.asar。
 *
 * 用法：node patch.mjs [--app-dir E:\dshDesktop] [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { openArchive, readHeader, entryAt, readPacked, writeHeaderInPlace } from './lib/asar.mjs'
import { PATCH_MARK, TARGET, UNPACKED_DIR, applyReplacements } from './lib/rules.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const DRY_RUN = args.includes('--dry-run')
const ASAR = join(APP_DIR, 'resources', 'app.asar')
const UNPACKED = join(APP_DIR, 'resources', UNPACKED_DIR)
const TARGET_DISK = join(UNPACKED, ...TARGET.split('/'))

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/** 官方版本号，用于备份命名与 README 追溯。 */
function appVersion(fd, header) {
  try {
    const entry = entryAt(header.json, 'package.json')
    if (entry === undefined) return 'unknown'
    const raw = readPacked(fd, entry, header.dataStart).toString('utf8')
    try {
      return JSON.parse(raw).version ?? 'unknown'
    } catch {
      // 官方 asar 头的 size 可能比实际内容少几个字节（0.2.1-rc.3 实测少 2 字节，
      // 末尾的 `\n}` 缺失），整段 JSON.parse 会在 EOF 失败。退回正则只取版本号，
      // 否则备份会被命名成 orig-unknown，下次升级时 existsSync 命中旧文件而跳过备份。
      return /"version"\s*:\s*"([^"]+)"/u.exec(raw)?.[1] ?? 'unknown'
    }
  } catch {
    return 'unknown'
  }
}

if (!existsSync(ASAR)) {
  console.error(`找不到 ${ASAR}`)
  process.exit(1)
}

// ── 1. 读取现状 ──
const archive = openArchive(ASAR)
let patchedText
let report
try {
  const header = readHeader(archive.fd)
  const entry = entryAt(header.json, TARGET)
  if (entry === undefined) throw new Error(`归档内找不到 ${TARGET}`)

  // 已 patch 过：正文落在 unpacked 目录，asar 内是 unpacked 条目
  if (entry.unpacked === true) {
    if (!existsSync(TARGET_DISK)) {
      throw new Error(`${TARGET} 已标记 unpacked，但 ${TARGET_DISK} 不存在。请先 revert 再 patch。`)
    }
    const current = readFileSync(TARGET_DISK, 'utf8')
    if (current.startsWith(PATCH_MARK)) {
      console.log('✓ 补丁已存在，跳过（幂等）')
      console.log(`  ${TARGET_DISK}`)
      process.exit(0)
    }
    throw new Error(`${TARGET} 已是 unpacked 但不是本补丁产物，拒绝覆盖。请先 revert。`)
  }

  const original = readPacked(archive.fd, entry, header.dataStart)
  const originalText = original.toString('utf8')
  const { text, applied } = applyReplacements(originalText)
  patchedText = text

  // ── 2. 语法自检：必须在写入真实文件之前 ──
  const probe = join(tmpdir(), `dsh-main-${Date.now()}.mjs`)
  writeFileSync(probe, PATCH_MARK + '\n' + text, 'utf8')
  try {
    execFileSync(process.execPath, ['--check', probe], { stdio: 'pipe' })
  } catch (error) {
    throw new Error(`注入后语法检查失败，已中止：\n${error.stderr?.toString() ?? error.message}`)
  }

  const patchedBuf = Buffer.from(PATCH_MARK + '\n' + text, 'utf8')
  const newHash = sha256(patchedBuf)

  report = {
    version: appVersion(archive.fd, header),
    applied,
    originalBytes: original.length,
    patchedBytes: patchedBuf.length,
    hash: newHash,
  }

  if (DRY_RUN) {
    console.log('— DRY RUN，未写入任何文件 —')
    console.log(JSON.stringify(report, null, 2))
    process.exit(0)
  }

  // ── 3. 备份 asar（一次性） ──
  const backup = join(APP_DIR, 'resources', `app.asar.orig-${report.version}`)
  if (!existsSync(backup)) {
    copyFileSync(ASAR, backup)
    console.log(`备份：${backup}`)
  } else {
    console.log(`备份已存在：${backup}`)
  }

  // ── 4. 写 unpacked 正文 ──
  mkdirSync(dirname(TARGET_DISK), { recursive: true })
  writeFileSync(TARGET_DISK, patchedBuf)
  console.log(`写入：${TARGET_DISK} (${patchedBuf.length} 字节)`)

  // ── 5. 改写 asar 头：把条目转为 unpacked ──
  const json = header.json
  json.files.lib.files['main.js'] = {
    size: patchedBuf.length,
    unpacked: true,
    integrity: { algorithm: 'SHA256', hash: newHash, blockSize: 4194304, blocks: [newHash] },
  }
  const written = writeHeaderInPlace(archive.fd, json, header.jsonLength)
  console.log(`asar 头已更新（填充 ${written.slack} 字节，数据区未移动）`)
} finally {
  archive.close()
}

console.log('\n✓ 补丁完成')
console.log(JSON.stringify(report, null, 2))
console.log('\n下一步：启动 DSH，右键托盘或点左上角「应用」验证两项菜单。')
