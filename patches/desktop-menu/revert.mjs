/**
 * 还原桌面端菜单补丁：用首次打补丁时生成的 app.asar 备份整体覆盖回去。
 *
 * 用法：node revert.mjs [--app-dir E:\dshDesktop]
 */
import { existsSync, readdirSync, copyFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const i = args.indexOf('--app-dir')
const APP_DIR = i === -1 ? 'E:\\dshDesktop' : args[i + 1]
const RES = join(APP_DIR, 'resources')
const ASAR = join(RES, 'app.asar')

const backups = existsSync(RES)
  ? readdirSync(RES).filter((n) => n.startsWith('app.asar.orig-')).sort()
  : []

if (backups.length === 0) {
  console.error(`未找到备份（${RES}\\app.asar.orig-*），无法还原。`)
  process.exit(1)
}

const backup = join(RES, backups[backups.length - 1])
console.log(`使用备份：${backup}`)

try {
  copyFileSync(backup, ASAR)
} catch (error) {
  if (error?.code === 'EBUSY' || error?.code === 'EPERM' || error?.code === 'EACCES') {
    console.error('无法写入 app.asar：DSH 桌面端仍在运行。请先从托盘退出应用再重试。')
    process.exit(1)
  }
  throw error
}
console.log('✓ app.asar 已还原')

const unpacked = join(RES, 'app.asar.unpacked', 'lib', 'main.js')
if (existsSync(unpacked)) {
  unlinkSync(unpacked)
  console.log(`✓ 已删除 ${unpacked}`)
}
console.log('\n还原完成。备份文件保留，可自行删除。')
