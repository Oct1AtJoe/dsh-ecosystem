// Link a local plugin's SOURCE tree into a DSH profile for development, and
// switch it back to a published tarball when releasing.
//
// Why this exists
// ---------------
// The profile installer resolves plugins from tarball URLs (release assets).
// That is right for other machines, but it means local source edits are
// invisible until a tarball is cut and reinstalled — the classic
// "I changed the code and nothing happened" loop.
//
// `link:` (a pnpm dependency pointing at the working tree) makes the profile
// resolve the plugin straight from disk, so a rebuild plus a browser refresh
// is the whole cycle. The plugin's own `dsh.bundle.patch` (cordis.patch.yml)
// still supplies the loader entry, so the browser half keeps loading.
//
// Usage
// -----
//   node scripts/plugin-dev-link.mjs link    <plugin-dir> [--profile desktop]
//   node scripts/plugin-dev-link.mjs release <plugin-dir> [--profile desktop]
//   node scripts/plugin-dev-link.mjs status  <plugin-dir> [--profile desktop]
//
//   <plugin-dir> is a directory under plugins/ (e.g. ui-theme-custom).
//
//   link    → rewrite the profile's dependency to link:<abs path>, reinstall,
//             and report what the user must do next (rebuild + refresh).
//   release → restore the published tarball URL for that plugin, reinstall,
//             then print the packaging command.
//   status  → report whether the profile currently resolves the plugin from
//             source or from a published tarball.
//
// Notes
// -----
// - The profile's `dsh.profile.bundles` list already names the plugin; this
//   script never touches it. Only the dependency spec changes.
// - Reinstalling rewrites the profile's node_modules, so the DSH host must be
//   restarted (or the page hard-refreshed) for the new resolution to take.
// - The published URL is derived from the plugin's package.json version, the
//   tarball naming convention pack-plugins.mjs uses, and the release tag that
//   actually hosts that tarball (looked up via `gh`; see resolveReleaseTag).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsRoot = path.join(repoRoot, 'plugins')

/**
 * Fallback GitHub release tag, used only when the live lookup below cannot
 * determine the tag (offline, `gh` missing, or no asset uploaded yet).
 *
 * ⚠️ 不要再把它当成唯一依据去手改 —— 历史教训：常量停在 `v5`、实际已发到
 * `v6`，`release` 子命令把 profile 依赖写成不存在的 `v5/...rc.12.tgz`，
 * 装包直接 404。现在优先按「哪个 Release 真正带这个 tarball」来判定。
 */
const RELEASE_TAG_FALLBACK = 'v5'

/** GitHub owner/repo that hosts the release assets. */
const RELEASE_REPO = 'Oct1AtJoe/dsh-ecosystem'

/** Tarball asset name for a plugin, matching pack-plugins.mjs naming. */
function tarballName(pkg) {
  const flat = pkg.name.replace(/^@deepseek-ai\//, '').replace(/\//g, '-')
  return `${flat}-${pkg.version}.tgz`
}

/**
 * Find the release tag that actually hosts this plugin's tarball.
 *
 * 以资产存在性为判据，而不是信任某个写死的常量：tarball 一定是在开 Release
 * 时上传的，所以「哪个 tag 带这个文件」就是唯一正确的 tag。查询失败时回退
 * 到 RELEASE_TAG_FALLBACK，保持离线可用。
 * @param pkg - the plugin's package.json.
 * @returns the tag, or null when it cannot be determined.
 */
function resolveReleaseTag(pkg) {
  const asset = tarballName(pkg)
  let tags
  try {
    // `gh release list` 不接受 assets 字段，只能先拿 tag 再逐个 view。
    const out = execFileSync(
      'gh',
      ['release', 'list', '--limit', '20', '--json', 'tagName'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    tags = JSON.parse(out).map(r => r.tagName)
  } catch {
    return null
  }
  for (const tag of tags) {
    try {
      const out = execFileSync(
        'gh',
        ['release', 'view', tag, '--json', 'assets', '--jq', '.assets[].name'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      )
      if (out.split(/\r?\n/).includes(asset)) return tag
    } catch {
      // 单个 release 查询失败不影响其余 tag。
    }
  }
  return null
}

/** Where the DSH profiles live on this machine. */
const PROFILES_ROOT = path.join(process.env.USERPROFILE || '', '.dsh', 'profiles')

/** Default profile (the one the desktop app uses). */
const DEFAULT_PROFILE = 'desktop'

function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

/** Resolve the plugin directory name to an absolute path + its package.json. */
function resolvePlugin(dirName) {
  const dir = path.isAbsolute(dirName) ? dirName : path.join(pluginsRoot, dirName)
  const pkgPath = path.join(dir, 'package.json')
  if (!fs.existsSync(pkgPath)) fail(`no package.json at ${dir}`)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  return { dir, pkg, pkgPath, name: pkg.name }
}

/** The published tarball URL for a plugin, matching pack-plugins.mjs naming. */
function publishedUrl(pkg) {
  const tag = resolveReleaseTag(pkg) ?? RELEASE_TAG_FALLBACK
  return `https://github.com/${RELEASE_REPO}/releases/download/${tag}/${tarballName(pkg)}`
}

/** Locate the pnpm runtime (the CLI is not on PATH by default). */
function resolvePnpm() {
  const candidates = [
    process.env.PNPM_EXE,
    path.join(process.env.USERPROFILE || '', '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'pnpm', 'bin', 'pnpm.mjs'),
    path.join(repoRoot, 'bin', 'pnpm.cmd'),
  ]
  for (const c of candidates) if (c && fs.existsSync(c)) return c
  return 'pnpm'
}

/** Run pnpm in the profile directory. */
function pnpmInProfile(profileDir, args) {
  const pnpm = resolvePnpm()
  const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { cwd: profileDir, stdio: 'pipe' })
  if (pnpm.endsWith('.mjs') || pnpm.endsWith('.js')) {
    run(process.execPath, [pnpm, ...args])
  } else if (process.platform === 'win32') {
    run('cmd.exe', ['/c', pnpm, ...args])
  } else {
    run(pnpm, args)
  }
}

/** Read a profile's package.json. */
function readProfile(profileName) {
  const dir = path.join(PROFILES_ROOT, profileName)
  const pkgPath = path.join(dir, 'package.json')
  if (!fs.existsSync(pkgPath)) fail(`profile "${profileName}" not found at ${dir}`)
  return { dir, pkgPath, pkg: JSON.parse(fs.readFileSync(pkgPath, 'utf8')) }
}

/** Write a profile's package.json back, preserving the 2-space indent style. */
function writeProfile(profile, pkg) {
  fs.writeFileSync(profile.pkgPath, JSON.stringify(profile.pkg, null, 2) + '\n', 'utf8')
}

/** The current dependency spec for the plugin in a profile. */
function currentSpec(profile, name) {
  return profile.pkg.dependencies?.[name] ?? profile.pkg.devDependencies?.[name]
}

/** Whether the profile resolves the plugin from the local working tree. */
function isLinked(spec) {
  return typeof spec === 'string' && spec.startsWith('link:')
}

function cmdLink(dirName, profileName) {
  const { dir, pkg, name } = resolvePlugin(dirName)
  const profile = readProfile(profileName)

  const before = currentSpec(profile, name)
  const spec = `link:${dir.replace(/\\/g, '/')}`
  if (before === spec) {
    console.log(`already linked: ${name} -> ${dir}`)
  } else {
    profile.pkg.dependencies ??= {}
    profile.pkg.dependencies[name] = spec
    writeProfile(profile, pkg)
    console.log(`rewrote dependency: ${name}`)
    console.log(`  from: ${before ?? '(none)'}`)
    console.log(`  to:   ${spec}`)
  }

  pnpmInProfile(profile.dir, ['install', '--no-frozen-lockfile'])

  console.log('')
  console.log('Next steps for the developer:')
  console.log(`  1. rebuild the plugin:  cd ${dir} && node "E:\\vibeCoding\\deepseek-harness\\node_modules\\typescript\\bin\\tsc" -p tsconfig.json`)
  console.log(`                          cd ${dir} && node "E:\\vibeCoding\\deepseek-harness\\node_modules\\tsdown\\dist\\run.mjs" --config tsdown.config.ts`)
  console.log('  2. RESTART the DSH host — the profile was reinstalled, and the host')
  console.log('     resolves each plugin\'s client.js path once at startup and caches it')
  console.log('     (client-modules resolveMeta/pkMeta cache). A page refresh alone will')
  console.log('     still serve the OLD bundle. After the restart, hard-refresh (Ctrl+F5).')
  console.log('  3. later rebuilds do NOT need a restart: the HMR watcher polls each')
  console.log('     bundle every 500ms and pushes a rebuilt graph over SSE, so a rebuild')
  console.log('     + Ctrl+F5 is enough from then on.')
  console.log('')
  console.log('Release later with:')
  console.log(`  node scripts/plugin-dev-link.mjs release ${dirName} --profile ${profileName}`)
}

function cmdRelease(dirName, profileName) {
  const { pkg, name } = resolvePlugin(dirName)
  const profile = readProfile(profileName)

  const url = publishedUrl(pkg)
  const before = currentSpec(profile, name)
  if (before === url) {
    console.log(`already on published tarball: ${name} -> ${url}`)
  } else {
    profile.pkg.dependencies ??= {}
    profile.pkg.dependencies[name] = url
    writeProfile(profile, pkg)
    console.log(`restored published dependency: ${name}`)
    console.log(`  from: ${before ?? '(none)'}`)
    console.log(`  to:   ${url}`)
  }

  pnpmInProfile(profile.dir, ['install', '--no-frozen-lockfile'])

  console.log('')
  console.log('Next steps:')
  console.log(`  1. cut the release tarball:  node scripts/pack-plugins.mjs`)
  console.log(`  2. upload dist-tarballs/${tarballName(pkg)} to the release that ends up hosting it`)
  console.log('  3. restart the DSH host so the profile resolves the new tarball')
}

function cmdStatus(dirName, profileName) {
  const { dir, pkg, name } = resolvePlugin(dirName)
  const profile = readProfile(profileName)
  const spec = currentSpec(profile, name)
  const linked = isLinked(spec)

  console.log(`plugin : ${name}@${pkg.version}`)
  console.log(`source : ${dir}`)
  console.log(`profile: ${profileName} (${profile.dir})`)
  console.log(`spec   : ${spec ?? '(not a dependency)'}`)
  console.log(`state  : ${linked ? 'LINKED to local source' : 'installed from published tarball'}`)

  const clientJs = path.join(dir, 'lib', 'client.js')
  if (fs.existsSync(clientJs)) {
    const stat = fs.statSync(clientJs)
    console.log(`build  : lib/client.js ${stat.size} B, mtime ${stat.mtime.toISOString()}`)
  } else {
    console.log('build  : lib/client.js MISSING — run the two-phase build')
  }
}

function main() {
  const [command, dirName] = process.argv.slice(2)
  if (!command || !dirName) {
    console.error('usage: node scripts/plugin-dev-link.mjs <link|release|status> <plugin-dir> [--profile desktop]')
    process.exit(1)
  }
  const profileFlag = process.argv.indexOf('--profile')
  const profileName = profileFlag >= 0 ? process.argv[profileFlag + 1] : DEFAULT_PROFILE

  switch (command) {
    case 'link':
      cmdLink(dirName, profileName)
      break
    case 'release':
      cmdRelease(dirName, profileName)
      break
    case 'status':
      cmdStatus(dirName, profileName)
      break
    default:
      fail(`unknown command "${command}" (expected link | release | status)`)
  }
}

if (import.meta.main) main()
