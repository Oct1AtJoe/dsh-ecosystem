// Pack every installable plugin into a prebuilt tarball for GitHub Releases.
//
// Why this exists: the host UI ("Settings > Plugins > Add") accepts a .tgz URL
// directly (plugin-manager's TARBALL_SPEC). Publishing tarballs means another
// machine installs a plugin without cloning this repo, running a build, or
// keeping a local checkout on disk forever the way `link:` would require.
//
// The repo root has no package.json, so the git-install path cannot target a
// plugin subdirectory -- tarballs are the only URL-installable form here.
//
// Usage:
//   node scripts/pack-plugins.mjs
// then upload dist-tarballs/* to a release (see scripts/README-releases.md).
//
// Notes:
// - `files` in each package.json decides what ships; it must list lib/,
//   cordis.patch.yml, and whatever assets the client half loads. verifyTarballs()
//   below re-checks that from the archive itself rather than trusting the field.
// - Output names are flattened (`@scope/name` -> `name`) so release URLs stay
//   simple, and they carry the version so a new release never overwrites a
//   cached asset.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsRoot = path.join(repoRoot, 'plugins')
const distDir = path.join(repoRoot, 'dist-tarballs')

/** Plugins worth publishing. Add a directory name here to ship it. */
export const PUBLISHED = [
  'dsh-git-panel',
  'kanye-pet',
  'kanye-pet-settings',
  'theme-tech',
  'queue-recall',
  'resend-failed-round',
  'session-title',
  'session-folders',
]

/** Windows bsdtar emits CRLF, so always normalise before comparing paths. */
function listing(tgz) {
  return execFileSync('tar', ['-tzf', tgz], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
}

/**
 * Assert the archive actually installs: package.json present, main resolves
 * inside it, the client half is there, and dsh.bundle.patch names a file that
 * shipped. A plugin missing its patch file installs as a plain dependency and
 * silently never loads its browser half -- exactly the failure this packaging
 * step is meant to stop.
 */
export function verifyTarball(tgz) {
  const list = listing(tgz)
  const has = (p) => list.includes(p)
  const problems = []

  if (!has('package/package.json')) problems.push('package.json')
  if (!list.some((f) => /^package\/lib\/index\.(js|mjs)$/.test(f))) problems.push('lib entry')
  if (!list.some((f) => f.startsWith('package/lib/client'))) problems.push('lib client')

  const pkg = JSON.parse(execFileSync('tar', ['-xzOf', tgz, 'package/package.json'], { encoding: 'utf8' }))
  const patchRel = pkg.dsh?.bundle?.patch
  if (!patchRel) problems.push('no dsh.bundle.patch')
  else if (!has('package/' + patchRel.replace(/^\.\//, ''))) problems.push('patch ' + patchRel)

  const mainRel = 'package/' + (pkg.main ?? 'index.js')
  if (!has(mainRel)) problems.push('main ' + mainRel)

  if (!has('package/icon.svg')) problems.push('no icon.svg')
  if (!has('package/locale/en.json')) problems.push('no locale/en.json')
  if (!has('package/locale/zh.json')) problems.push('no locale/zh.json')

  return { pkg, problems }
}

function resolvePnpm() {
  const candidates = [
    process.env.PNPM_EXE,
    path.join(process.env.USERPROFILE || '', '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'pnpm', 'bin', 'pnpm.mjs'),
    path.join(repoRoot, 'bin', 'pnpm.cmd'),
    path.join(repoRoot, 'bin', 'pnpm'),
  ]
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c
  }
  return 'pnpm'
}

function packOne(dir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  const before = new Set(fs.readdirSync(distDir))
  const pnpm = resolvePnpm()
  if (pnpm.endsWith('.mjs') || pnpm.endsWith('.js')) {
    execFileSync(process.execPath, [pnpm, 'pack', '--pack-destination', distDir], {
      cwd: dir,
      stdio: 'pipe',
    })
  } else if (process.platform === 'win32') {
    execFileSync('cmd.exe', ['/c', pnpm, 'pack', '--pack-destination', distDir], {
      cwd: dir,
      stdio: 'pipe',
    })
  } else {
    execFileSync(pnpm, ['pack', '--pack-destination', distDir], {
      cwd: dir,
      stdio: 'pipe',
    })
  }
  const produced = fs.readdirSync(distDir).filter((f) => !before.has(f) && f.endsWith('.tgz'))
  if (produced.length !== 1) throw new Error(`pack produced ${produced.length} tarballs for ${pkg.name}`)

  const wanted = `${pkg.name.replace(/^@deepseek-ai\//, '').replace(/\//g, '-')}-${pkg.version}.tgz`
  const from = path.join(distDir, produced[0])
  const to = path.join(distDir, wanted)
  if (from !== to) fs.renameSync(from, to)
  return { name: pkg.name, version: pkg.version, file: wanted, bytes: fs.statSync(to).size }
}

function main() {
  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  const rows = []
  let failed = 0
  for (const dirName of PUBLISHED) {
    const dir = path.join(pluginsRoot, dirName)
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
      console.log(`skip   ${dirName} (no package.json)`)
      continue
    }
    process.stdout.write(`pack   ${dirName} ... `)
    try {
      const row = packOne(dir)
      const { problems } = verifyTarball(path.join(distDir, row.file))
      if (problems.length > 0) {
        failed += 1
        console.log(`INVALID -> ${problems.join(', ')}`)
        continue
      }
      rows.push(row)
      console.log(`${row.file} (${row.bytes} B)`)
    } catch (error) {
      failed += 1
      console.log(`FAILED -> ${error.stderr?.toString() ?? error.message}`)
    }
  }

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(rows, null, 2) + '\n', 'utf8')
  console.log(`\n${rows.length}/${PUBLISHED.length} tarballs ready in ${distDir}`)
  if (failed > 0) process.exitCode = 1
}

if (import.meta.main) main()
