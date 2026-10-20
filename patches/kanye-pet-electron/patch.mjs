/**
 * 给 DSH 官方 Electron 桌面端加一个桌宠透明置顶窗口（kanye-pet 插件的前端宿主）。
 *
 * 前置：`patches/desktop-menu` 必须已打过 —— 它把 lib/main.js 标为 unpacked，
 * 本补丁只改那个已展开的磁盘文件，绝不重写 asar 头（风险面因此小得多）。
 *
 * 幂等：已打过会直接跳过；首次运行自动备份 main.js。
 * 用法：node patch.mjs [--app-dir E:\dshDesktop] [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, readSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { openArchive, readHeader, entryAt } from './lib/asar.mjs'
import {
  PATCH_MARK, TARGET, UNPACKED_DIR, PRELOAD_NAME, PRELOAD_SOURCE, applyReplacements,
} from './lib/rules.mjs'

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
const PRELOAD_DISK = join(dirname(TARGET_DISK), PRELOAD_NAME)

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

if (!existsSync(ASAR)) {
  console.error(`找不到 ${ASAR}`)
  process.exit(1)
}

// ── 1. 前置检查：desktop-menu 必须已经把 main.js 解包 ──
const archive = openArchive(ASAR, { readOnly: true })
let version = 'unknown'
try {
  const header = readHeader(archive.fd)
  const entry = entryAt(header.json, TARGET)
  if (entry === undefined) throw new Error(`归档内找不到 ${TARGET}`)
  if (entry.unpacked !== true) {
    throw new Error(
      `${TARGET} 尚未被解包。本补丁依赖 patches/desktop-menu 先执行（它负责标记 unpacked）。\n` +
      `请先运行：cd patches/desktop-menu; node patch.mjs`,
    )
  }
  try {
    const pkg = entryAt(header.json, 'package.json')
    if (pkg !== undefined) {
      const raw = Buffer.alloc(pkg.size)
      readSync(archive.fd, raw, 0, pkg.size, header.dataStart + Number(pkg.offset))
      version = JSON.parse(raw.toString('utf8')).version ?? 'unknown'
    }
  } catch { /* 版本号仅用于备份命名与报告，读不到不阻断 */ }
} finally {
  archive.close()
}

if (!existsSync(TARGET_DISK)) {
  console.error(`缺少 ${TARGET_DISK}。asar 头标记为 unpacked 但磁盘文件不存在，请先 revert desktop-menu 再重打。`)
  process.exit(1)
}

// ── 2. 幂等判断 ──
const current = readFileSync(TARGET_DISK, 'utf8')
if (current.includes(PATCH_MARK)) {
  console.log('✓ 补丁已存在，跳过（幂等）')
  console.log(`  ${TARGET_DISK}`)
  process.exit(0)
}

// ── 3. 应用替换 ──
const { text, applied } = applyReplacements(current)
const patchedCode = `${PATCH_MARK}\n${text}`
const patchedBuf = Buffer.from(patchedCode, 'utf8')

// ── 4. 语法自检：写入真实文件之前 ──
const probe = join(tmpdir(), `dsh-main-pet-${Date.now()}.mjs`)
writeFileSync(probe, patchedBuf, 'utf8')
try {
  execFileSync(process.execPath, ['--check', probe], { stdio: 'pipe' })
} catch (error) {
  throw new Error(`注入后语法检查失败，已中止：\n${error.stderr?.toString() ?? error.message}`)
}

const report = {
  version,
  applied,
  originalBytes: current.length,
  patchedBytes: patchedBuf.length,
  hash: sha256(patchedBuf),
  preload: PRELOAD_DISK,
}

if (DRY_RUN) {
  console.log('— DRY RUN，未写入任何文件 —')
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

// ── 5. 备份（一次性，按版本命名，升级后不会覆盖旧备份） ──
const backup = `${TARGET_DISK}.orig-${version}`
if (!existsSync(backup)) {
  copyFileSync(TARGET_DISK, backup)
  console.log(`备份：${backup}`)
} else {
  console.log(`备份已存在：${backup}`)
}

// ── 6. 写入 main.js + preload ──
writeFileSync(TARGET_DISK, patchedBuf)
console.log(`写入：${TARGET_DISK} (${patchedBuf.length} 字节)`)

mkdirSync(dirname(PRELOAD_DISK), { recursive: true })
writeFileSync(PRELOAD_DISK, PRELOAD_SOURCE, 'utf8')
console.log(`写入：${PRELOAD_DISK} (${Buffer.byteLength(PRELOAD_SOURCE)} 字节)`)

console.log('\n✓ 补丁完成')
console.log(JSON.stringify(report, null, 2))
console.log('\n下一步：完全退出 DSH 桌面端后重启，桌面上应出现宠物。')
console.log('宠物页由插件 Host 提供：确认 kanye-pet 插件已在当前 profile 挂载。')
