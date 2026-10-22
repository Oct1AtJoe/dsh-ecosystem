/**
 * pnpm shim 的解析核心（Node 实现，供 bin/pnpm{,.cmd,.ps1} 三个薄壳转发）。
 *
 * 为什么需要这一层：仓库要从一台机器搬到另一台机器，而旧版 shim 把
 * `node.exe` / `pnpm.cjs` 的绝对路径写死成 `C:\Users\Administrator\...`。
 * 换机器/换用户名后指向不存在的文件，`pnpm pack`、`plugin-dev-link.mjs`
 * 这类脚本会直接报 `The system cannot find the path specified`。
 * 所以这里**不保存任何机器相关路径**，每次调用现场解析。
 *
 * 解析优先级（命中即用）：
 *   1. $PNPM_EXE                       —— 显式覆盖，脚本与用户都能用
 *   2. DSH 桌面端自带的 pnpm            —— 与 profile 安装时同一个版本（权威）
 *   3. corepack pnpm                   —— Node 自带的版本管理器
 *   4. PATH 上的 pnpm                   —— 最后兜底
 *
 * 第 2 步只做「有界目录探测」：DSH 桌面端的布局固定为
 * `<安装根>/resources/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs`，
 * 所以在若干常见安装根下按 ≤2 层深度找这段后缀，找到即止。不递归整盘。
 */
import { existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

/** DSH 桌面端安装目录下的 pnpm 相对路径（跨版本稳定）。 */
const DSH_PNPM_SUFFIX = [
  'resources',
  'runtime',
  'primary-runtime',
  'dependencies',
  'pnpm',
  'bin',
  'pnpm.mjs',
]

/** 读一个目录的直接子目录；不可读就返回空数组（探测不能因为权限失败）。 */
function subdirs(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(dir, entry.name))
  } catch {
    return []
  }
}

/** 本机所有固定磁盘的根（`C:\`、`D:\` …）；读不到盘符就返回空。 */
function driveRoots() {
  if (process.platform !== 'win32') return []
  const roots = []
  for (let code = 67 /* C */; code <= 90 /* Z */; code += 1) {
    const root = `${String.fromCharCode(code)}:\\`
    if (existsSync(root)) roots.push(root)
  }
  return roots
}

/**
 * 在常见安装根下探测 DSH 桌面端自带的 pnpm。
 * 深度上限定为 2（`<root>/<app>/...` 或 `<root>/<vendor>/<app>/...`），
 * 覆盖 `C:\Program Files\<app>`、`D:\soft\<app>`、`%LOCALAPPDATA%\Programs\<app>` 这三类布局。
 * @returns 候选 pnpm.mjs 的绝对路径；找不到返回空数组。
 */
function dshRuntimeCandidates() {
  const roots = [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
    process.env.LOCALAPPDATA === undefined ? undefined : join(process.env.LOCALAPPDATA, 'Programs'),
    ...driveRoots(),
  ].filter((root) => typeof root === 'string' && root.length > 0)

  const found = []
  for (const root of roots) {
    for (const app of subdirs(root)) {
      const shallow = join(app, ...DSH_PNPM_SUFFIX)
      if (existsSync(shallow)) {
        found.push(shallow)
        continue // 命中就不再往下一层，省掉无谓 IO
      }
      for (const nested of subdirs(app)) {
        const deep = join(nested, ...DSH_PNPM_SUFFIX)
        if (existsSync(deep)) found.push(deep)
      }
    }
  }
  return [...new Set(found)]
}

/**
 * PATH 上能否解析到 pnpm。
 *
 * Windows 的 `where pnpm` 会同时列出 `pnpm`、`pnpm.cmd`、`pnpm.ps1` 三个壳，
 * 而 `.ps1` 不能被 spawn 直接执行（EFTYPE）。所以这里优先取 `.cmd`，
 * 其次取无扩展名的 POSIX 壳，最后才接受其余形式并交给 shell 兜底。
 * @returns 可执行的 pnpm 路径，或 null。
 */
function pathPnpm() {
  const probe = spawnSync(
    process.platform === 'win32' ? 'where.exe' : 'which',
    ['pnpm'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
  if (probe.status !== 0) return null
  const all = probe.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (all.length === 0) return null
  if (process.platform !== 'win32') return all[0]

  const rank = (p) => (/\.cmd$/i.test(p) ? 0 : /\.ps1$/i.test(p) ? 2 : 1)
  return [...all].sort((a, b) => rank(a) - rank(b))[0] ?? null
}

/**
 * 把一个候选路径包装成可执行的形式：`.ps1` 必须经 powershell 转发，
 * 其余（`.cmd`/`.bat` 或无扩展名的壳）由 spawn 的 shell 选项处理。
 * @param path 候选路径。
 * @returns 供 spawnSync 使用的 `{ file, prefixArgs }`。
 */
function toSpawnable(path) {
  if (/\.ps1$/i.test(path)) {
    return { file: 'powershell.exe', prefixArgs: ['-NoProfile', '-File', path] }
  }
  return { file: path, prefixArgs: [] }
}

/**
 * 决定这次该用哪个 pnpm。
 * @returns `{ kind: 'mjs' | 'bin', path: string }`，或 null（一个都没有）。
 */
function resolvePnpm() {
  const override = process.env.PNPM_EXE
  if (typeof override === 'string' && override.length > 0 && existsSync(override)) {
    return { kind: /\.(mjs|cjs|js)$/i.test(override) ? 'mjs' : 'bin', path: override }
  }

  const [runtime] = dshRuntimeCandidates()
  if (runtime !== undefined) return { kind: 'mjs', path: runtime }

  const corepack = process.platform === 'win32' ? 'corepack.cmd' : 'corepack'
  const corepackProbe = spawnSync(
    process.platform === 'win32' ? 'where.exe' : 'which',
    [corepack],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
  if (corepackProbe.status === 0) return { kind: 'bin', path: corepack, corepack: true }

  const onPath = pathPnpm()
  if (onPath !== null) return { kind: 'bin', path: onPath }

  return null
}

function main() {
  const argv = process.argv.slice(2)
  const target = resolvePnpm()

  if (target === null) {
    console.error(
      'pnpm shim: 找不到可用的 pnpm。\n'
      + '  请设置 PNPM_EXE=<pnpm.mjs 或 pnpm 可执行文件的绝对路径>，或把 pnpm 加入 PATH。',
    )
    process.exit(1)
  }

  // corepack 需要一个子命令：`corepack pnpm <args>`。
  const args = target.corepack === true ? ['pnpm', ...argv] : argv
  const { file, prefixArgs } = toSpawnable(target.path)
  const result = target.kind === 'mjs'
    ? spawnSync(process.execPath, [target.path, ...args], { stdio: 'inherit' })
    : spawnSync(file, [...prefixArgs, ...args], {
        stdio: 'inherit',
        // .cmd/.bat 在 Windows 上不能直接 spawn，必须经 shell 解析。
        shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(file),
      })

  if (result.error !== undefined) {
    console.error(`pnpm shim: 启动 ${target.path} 失败：${result.error.message}`)
    process.exit(1)
  }
  // 被信号杀掉时 status 为 null，按 shell 惯例用 128+signal 表达。
  process.exit(result.signal === null ? (result.status ?? 1) : 128)
}

main()
