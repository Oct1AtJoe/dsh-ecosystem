/**
 * 验证 dsh-tabbit 安装探测补丁是否真的生效。
 *
 * 判据分两层，缺一不可：
 *   1. 补丁独有符号 windowsIdentityOf 在 detect.js 里出现（零命中 = 没打进去）
 *   2. 真跑一次 detectTabbitInstallations()，installations 必须非空
 *
 * 第二层是关键：符号在但探测仍返回空，说明别处还有一道拦截。
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { MARKER } from './lib/rules.mjs'

const profileDir = process.env.DSH_PROFILE_DIR ?? join(homedir(), '.dsh', 'profiles', 'desktop')
const pkgDir = join(profileDir, 'node_modules', 'dsh-tabbit')
const target = join(pkgDir, 'lib', 'installer', 'detect.js')

if (!existsSync(target)) {
  console.error(JSON.stringify({ ok: false, error: 'detect.js not found' }))
  process.exit(2)
}

const source = readFileSync(target, 'utf8')
const symbolHits = source.split(MARKER).length - 1

let live
try {
  const mod = await import(pathToFileURL(target).href)
  live = await mod.detectTabbitInstallations()
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: 'detect import/run failed: ' + String(error), symbolHits }))
  process.exit(1)
}

const installations = Array.isArray(live?.installations) ? live.installations : []
const ok = symbolHits > 0 && installations.length > 0

console.log(JSON.stringify({
  ok,
  profileDir,
  symbolHits,
  hardLinked: statSync(target).nlink > 1,
  installations,
  supported: Array.isArray(live?.supportedInstallations) ? live.supportedInstallations : [],
  ...ok ? {} : {
    hint: symbolHits === 0
      ? 'patch not applied — run patch.mjs'
      : 'symbol present but detection still empty — inspect detectTabbitInstallations()',
  },
}, null, 2))
process.exit(ok ? 0 : 1)
