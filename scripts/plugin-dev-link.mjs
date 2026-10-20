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
// - The published URL is derived from the plugin's package.json version and
//   the release tag recorded in RELEASE_TAG below, matching the convention
//   pack-plugins.mjs uses for tarball names.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsRoot = path.join(repoRoot, 'plugins')

/**
 * GitHub release tag the published tarballs live under.
 *
 * ⚠️ 每次开新 Release（v4 → v5 …）都必须同步改这里，否则 `release` 子命令
 * 会把 profile 依赖写成**旧 tag**的 URL，装到的是上一轮的产物。
 * 核对方式：`gh release list --limit 3`，取标了 Latest 的那个。
 */
const RELEASE_TAG = 'v5'

/** GitHub owner/repo that hosts the release assets. */
const RELEASE_REPO = 'Oct1AtJoe/dsh-ecosystem'

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
  const flat = pkg.name.replace(/^@deepseek-ai\//, '').replace(/\//g, '-')
  return `https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/${flat}-${pkg.version}.tgz`
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
  console.log(`  2. upload dist-tarballs/${name.replace(/^@deepseek-ai\//, '').replace(/\//g, '-')}-${pkg.version}.tgz to the ${RELEASE_TAG} release`)
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
