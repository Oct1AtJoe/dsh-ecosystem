/**
 * 核对 profile 内我们这套插件的安装结果：
 * 包名 / 版本 / 产物 bundle id / 是否在 dsh.profile.bundles / cordis.patch.yml 的 name 是否指向新包名。
 */
import fs from 'node:fs'
import path from 'node:path'

const profile = process.env.DSH_PROFILE_DIR
const nm = path.join(profile, 'node_modules')

const NAMES = [
  'dsh-git-panel',
  'dsh-kanye-pet',
  'dsh-kanye-pet-settings',
  'dsh-theme-tech',
  'dsh-queue-recall',
  'dsh-resend-failed-round',
  'dsh-session-title-gen',
  'dsh-session-folders',
]

const pkg = JSON.parse(fs.readFileSync(path.join(profile, 'package.json'), 'utf8'))
const deps = pkg.dependencies ?? {}
const bundles = pkg.dsh?.profile?.bundles ?? []
const patch = fs.readFileSync(path.join(profile, 'cordis.patch.yml'), 'utf8')

const rows = []
for (const n of NAMES) {
  const dir = path.join(nm, n)
  const pj = path.join(dir, 'package.json')
  const installed = fs.existsSync(pj)
  const meta = installed ? JSON.parse(fs.readFileSync(pj, 'utf8')) : null

  // 产物 bundle id：client.js 头部注释可能很长（session-title 的 id 在第 14 行），
  // 取前 40 行里第一个 id: 字面量即可
  const client = path.join(dir, 'lib', 'client.js')
  let bundleId = '(no client.js)'
  if (fs.existsSync(client)) {
    const head = fs.readFileSync(client, 'utf8').split('\n').slice(0, 40).join('\n')
    const m = head.match(/id:\s*['"]([^'"]+)['"]/)
    bundleId = m ? m[1] : '(no id in head)'
  }

  // profile 的 cordis.patch.yml 里是否有 name: <这个包名>。
  // 注意：只有「需要 config / disable 别的条目」的插件才在 profile patch 里有条目。
  // 其余插件靠自带 package.json 的 dsh.bundle.patch（即插件目录下的 cordis.patch.yml）
  // 提供 loader 条目 —— 那种情况看插件自带 patch 里的 name。
  const nameRe = new RegExp(`name:\\s*['"]?${n}['"]?\\s*$`, 'm')
  const inProfilePatch = nameRe.test(patch)
  const ownPatchPath = path.join(dir, 'cordis.patch.yml')
  const ownPatchName = fs.existsSync(ownPatchPath)
    ? nameRe.test(fs.readFileSync(ownPatchPath, 'utf8'))
    : false

  rows.push({
    pkg: n,
    installed,
    version: meta?.version ?? '-',
    metaName: meta?.name ?? '-',
    bundleId,
    dep: deps[n] !== undefined,
    bundle: bundles.includes(n),
    patchName: inProfilePatch || ownPatchName,
    idMatch: bundleId === n,
  })
}

console.table(rows.map((r) => ({
  包名: r.pkg,
  已安装: r.installed,
  版本: r.version,
  'name 一致': r.metaName === r.pkg,
  'bundle id': r.bundleId,
  'id 一致': r.idMatch,
  依赖: r.dep,
  bundles: r.bundle,
  'patch name': r.patchName,
})))

const bad = rows.filter((r) => !r.installed || !r.dep || !r.bundle || !r.patchName || !r.idMatch || r.metaName !== r.pkg)
console.log(bad.length === 0 ? '\n✅ 8 个全部一致' : `\n⚠️ ${bad.length} 个有问题：${bad.map((b) => b.pkg).join(', ')}`)

// 旧名残留（只查仍在用的 8 个包；退役包单独查）
const OLD = [
  '@deepseek-ai/dsh-client-ui-theme-custom', '@deepseek-ai/dsh-client-ui-queue-recall',
  '@deepseek-ai/dsh-client-ui-resend-failed-round',
  '@deepseek-ai/dsh-client-ui-deliverables-custom', '@deepseek-ai/dsh-client-ui-kanye-pet',
  '@deepseek-ai/dsh-kanye-pet', 'dsh-session-title-custom',
  'dsh-session-folders-custom',
]
const leftovers = OLD.filter((o) => patch.includes(`name: ${o}`) || patch.includes(`name: "${o}"`) || patch.includes(`name: '${o}'`))
console.log(leftovers.length ? `⚠️ patch 仍有旧 name: ${leftovers.join(', ')}` : '✅ patch 无旧 name 残留')

// 退役包：不该出现在 dependencies / bundles / node_modules / patch
const RETIRED = ['dsh-subagent-card', 'dsh-file-upload',
  '@deepseek-ai/dsh-client-ui-subagent-custom', 'dsh-file-upload-custom']
const stillThere = RETIRED.filter((n) =>
  deps[n] !== undefined || bundles.includes(n) || fs.existsSync(path.join(nm, n)) || patch.includes(`name: ${n}`))
console.log(stillThere.length
  ? `⚠️ 退役包仍在: ${stillThere.join(', ')}`
  : '✅ 退役包（subagent-card / file-upload）已彻底移除')
