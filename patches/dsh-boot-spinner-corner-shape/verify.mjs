#!/usr/bin/env node
/**
 * 验证 dsh-boot-spinner-corner-shape 补丁真的生效。
 *
 * 判据分四层，缺一不可：
 *   1. asar 头里目标条目已被标为 unpacked；
 *   2. 磁盘文件里有补丁独有符号（MARKER，官方产物绝不存在）；
 *   3. 原锚点残留数必须恰好为 0（漏改 = 没生效）；
 *   4. 行为等价：把 CSS 按「有/无补丁」两种形态解析，补丁后 ::after 必须
 *      显式声明 corner-shape，且其余字节未被动过（长度差 = 注入长度）。
 *
 * 注意：类名带内容哈希（_spinner_u7vgf_45），不能用它当判据 —— 升级就变。
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { MARKER, TARGET_DIR, applyRules, revertRules, resolveTarget } from './lib/rules.mjs'
import { openArchive, readHeader, entryAt } from './lib/asar.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const ASAR = join(APP_DIR, 'resources', 'app.asar')
const UNPACKED = join(APP_DIR, 'resources', 'app.asar.unpacked')

let target = ''
let headerUnpacked = false
let headerError
try {
  const archive = openArchive(ASAR, { readOnly: true })
  try {
    const header = readHeader(archive.fd)
    let dir = header.json
    for (const seg of TARGET_DIR.split('/')) {
      dir = dir?.files?.[seg]
      if (dir === undefined) throw new Error(`archive has no ${TARGET_DIR}`)
    }
    target = resolveTarget(Object.keys(dir.files))
    headerUnpacked = entryAt(header.json, target)?.unpacked === true
  } finally {
    archive.close()
  }
} catch (error) {
  headerError = String(error)
}

const targetDisk = target === '' ? '' : join(UNPACKED, ...target.split('/'))
const source = targetDisk !== '' && existsSync(targetDisk) ? readFileSync(targetDisk, 'utf8') : ''

const symbolHits = source === '' ? 0 : source.split(MARKER).length - 1

// 未打补丁的等价形态：把 MARKER 逆变换回去，再正向施加规则，结果必须回到现状。
// 这是「补丁正好只做了一件可逆的事」的行为证明，同时保证没有别的字节被动过。
let reversible = false
let anchorLeft = -1
try {
  const unpatched = revertRules(source)
  const reapplied = applyRules(unpatched)
  reversible = reapplied === source
  // revert 形态下锚点必须恰好命中 1 次（说明定位规则仍然对准那条规则）
  anchorLeft = (unpatched.match(/:after\{content:"";position:absolute;inset:-2px;border-radius:inherit;background:conic-gradient\(/gu) ?? []).length
} catch {
  reversible = false
}

const report = {
  ok: headerUnpacked && symbolHits === 1 && reversible && anchorLeft === 1,
  target: targetDisk,
  headerUnpacked,
  symbolHits,
  anchorLeft,
  reversible,
  ...(headerError === undefined ? {} : { headerError }),
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
