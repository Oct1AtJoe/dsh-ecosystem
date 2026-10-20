/**
 * 从备份整体还原 lib/main.js，并删掉本补丁新增的 preload-pet.cjs。
 *
 * 只动本补丁写入的两个文件；desktop-menu 的 asar unpacked 标记保持不变
 * （那是它的前置，回滚它请去 patches/desktop-menu/revert.mjs）。
 *
 * 用法：node revert.mjs [--app-dir E:\dshDesktop] [--backup <path>]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { TARGET, UNPACKED_DIR, PRELOAD_NAME } from './lib/rules.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const TARGET_DISK = join(APP_DIR, 'resources', UNPACKED_DIR, ...TARGET.split('/'))
const PRELOAD_DISK = join(dirname(TARGET_DISK), PRELOAD_NAME)
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

const explicit = argValue('--backup', null)
const candidates = explicit !== null
  ? [explicit]
  : readdirSync(dirname(TARGET_DISK))
    .filter((f) => f.startsWith(`${TARGET.split('/').pop()}.orig-`))
    .sort()
    .map((f) => join(dirname(TARGET_DISK), f))

if (candidates.length === 0) {
  console.error(`找不到备份（${join(dirname(TARGET_DISK), TARGET.split('/').pop() + '.orig-*')}）。`)
  process.exit(1)
}

const backup = candidates.at(-1)
const restored = readFileSync(backup)
copyFileSync(backup, TARGET_DISK)

console.log(`还原：${backup} → ${TARGET_DISK}`)
console.log(`  ${restored.length} 字节  sha256=${sha256(restored).slice(0, 16)}…`)

if (existsSync(PRELOAD_DISK)) {
  unlinkSync(PRELOAD_DISK)
  console.log(`删除：${PRELOAD_DISK}`)
}

console.log('\n✓ 还原完成。desktop-menu 的 asar 解包标记未动。')
