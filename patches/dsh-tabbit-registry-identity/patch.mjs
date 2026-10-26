/**
 * 给 dsh-tabbit 的安装探测器打补丁：按卸载表子键名识别，而非 DisplayName 白名单。
 *
 *   node patch.mjs           幂等应用；已应用则什么都不做
 *   node patch.mjs --check   只报告状态，不改文件
 *   node patch.mjs --revert  已应用则撤回
 *
 * profile 默认 ~/.dsh/profiles/desktop，可用 DSH_PROFILE_DIR 覆盖。
 *
 * 注意：detect.js 是 pnpm store 的硬链接，原地改会污染全局 store。
 * 这里先断链（复制成独立文件再替换），只改 profile 里那一份。
 */
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyRules, MARKER, revertRules } from './lib/rules.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const profileDir = process.env.DSH_PROFILE_DIR ?? join(homedir(), '.dsh', 'profiles', 'desktop')
const pkgDir = join(profileDir, 'node_modules', 'dsh-tabbit')
const target = join(pkgDir, 'lib', 'installer', 'detect.js')
const original = join(here, 'detect.js.orig-0.4.0')

const mode = process.argv.includes('--revert') ? 'revert'
  : process.argv.includes('--check') ? 'check'
    : 'apply'

if (!existsSync(target)) {
  console.error(JSON.stringify({ mode, target, error: 'detect.js not found — is dsh-tabbit installed in this profile?' }))
  process.exit(2)
}

/**
 * 把硬链接换成独立副本，返回是否为硬链接。
 * @param {string} path - 目标文件
 * @returns {boolean} 原先是否为硬链接
 */
function unlinkHardLink(path) {
  // Windows 上 fs.statSync().nlink > 1 即多链接；断链做法是写临时文件再原子替换。
  const linked = statSync(path).nlink > 1
  if (!linked) return false
  const tmp = path + '.dsh-patch-tmp'
  copyFileSync(path, tmp)
  rmSync(path, { force: true })
  renameSync(tmp, path)
  return true
}

const before = readFileSync(target, 'utf8')
const applied = before.includes(MARKER)

if (mode === 'check') {
  const probe = applyRules(before)
  console.log(JSON.stringify({
    mode, profileDir, target, applied,
    canApply: probe.changed, canRevert: applied,
    ...probe.reason === undefined ? {} : { reason: probe.reason },
    hardLinked: statSync(target).nlink > 1,
  }))
  process.exit(0)
}

if (mode === 'apply' && applied) {
  console.log(JSON.stringify({ mode, profileDir, applied: true, changed: false }))
  process.exit(0)
}
if (mode === 'revert' && !applied) {
  console.log(JSON.stringify({ mode, profileDir, applied: false, changed: false }))
  process.exit(0)
}

// 首次应用前留底：优先存断链前的原始字节（未打补丁时的真身）。
if (mode === 'apply' && !existsSync(original) && !applied) {
  copyFileSync(target, original)
}

const broken = unlinkHardLink(target)
const result = mode === 'apply' ? applyRules(before) : revertRules(before)
if (!result.changed) {
  console.error(JSON.stringify({ mode, error: 'transform produced no change', reason: result.reason ?? null }))
  process.exit(1)
}
writeFileSync(target, result.text, 'utf8')

const after = readFileSync(target, 'utf8')
if (after.includes(MARKER) !== (mode === 'apply')) {
  console.error(JSON.stringify({ mode, error: 'post-write state does not match the requested mode' }))
  process.exit(1)
}
console.log(JSON.stringify({
  mode, profileDir, target,
  applied: after.includes(MARKER), changed: true, hardLinkBroken: broken,
}))
