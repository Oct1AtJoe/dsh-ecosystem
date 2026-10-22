/**
 * ⛔ DEPRECATED（2026-10-22）—— 随自研 Tauri 壳一起弃用，勿运行。
 *
 * 这个脚本是早期 Tauri 2 壳时代用来把 link: 插件「实体化」进壳的预构建产物的。
 * 现在的桌面端是官方 Electron 客户端（E:\dshDesktop），插件由 profile 的
 * package.json + cordis.patch.yml 挂载，不再需要这一步。
 *
 * 它引用的 external-repos/* 与 plugins/dsh-*-custom 目录都已不存在或改名。
 * 保留文件仅为读懂旧构建流程，**不要执行**。
 *
 * 阶段 2：实体化 8 个 link: 插件。
 *
 * 关键决策（基于实测）：插件目录里的 node_modules 是完整 devDependencies，
 * 含 rolldown(20MB)/lightningcss(9MB)/rollup 等纯构建工具链，运行时根本不需要。
 * 因此按 package.json 的 files 字段打包，不带 node_modules ——
 * 运行时依赖由 runtime 的 .pnpm 提供。
 */
import { cpSync, mkdirSync, readFileSync, existsSync, rmSync, readdirSync, statSync, lstatSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'

/** 需要实体化的插件：包名 -> 源码目录。 */
const PLUGINS = [
  ['dsh-better-reasoning-effort', 'C:\\dsh-ecosystem\\external-repos\\dsh-better-reasoning-effort'],
  ['dsh-feishu-notifier', 'C:\\dsh-ecosystem\\external-repos\\dsh-feishu-notifier'],
  ['dsh-git-panel', 'C:\\dsh-ecosystem\\plugins\\dsh-git-panel'],
  ['dsh-reference-anything', 'C:\\dsh-ecosystem\\external-repos\\dsh-reference-anything'],
  ['dsh-session-folders', 'C:\\dsh-ecosystem\\plugins\\session-folders'],
  ['dsh-session-title-gen', 'C:\\dsh-ecosystem\\plugins\\session-title'],
  ['dsh-smooth-stream', 'C:\\dsh-ecosystem\\external-repos\\dsh-smooth-stream'],
  ['dshmarket', 'C:\\dsh-ecosystem\\external-repos\\dsh-market'],
]

/** 按 files 字段挑选要打包的路径；无 files 字段则整包（排除 node_modules/点文件）。 */
function packageFiles(srcDir, pkg) {
  const files = pkg.files
  if (!Array.isArray(files) || files.length === 0) return null // null = 整包

  const picked = []
  for (const pattern of files) {
    // files 字段可能含通配符，这里只处理目录与直接文件（实测这 8 个插件都是这两种）
    if (pattern.includes('*')) {
      const [head] = pattern.split('/')
      if (head && existsSync(join(srcDir, head))) picked.push(head)
      continue
    }
    if (existsSync(join(srcDir, pattern))) picked.push(pattern.replace(/\/$/, ''))
  }
  return [...new Set(picked)]
}

const OUT = 'C:\\dsh-ecosystem\\desktop\\bundle-resources\\profile\\node_modules'
const report = []

for (const [name, srcDir] of PLUGINS) {
  const pkgPath = join(srcDir, 'package.json')
  if (!existsSync(pkgPath)) {
    report.push({ name, status: 'skipped', reason: 'no package.json' })
    continue
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const destDir = join(OUT, name)
  rmSync(destDir, { recursive: true, force: true })
  mkdirSync(destDir, { recursive: true })

  const picked = packageFiles(srcDir, pkg)
  let copiedBytes = 0
  let copiedFiles = 0

  const addPath = (rel) => {
    const src = join(srcDir, rel)
    const dst = join(destDir, rel)
    let st
    try {
      st = lstatSync(src)
    } catch {
      return
    }
    if (st.isSymbolicLink()) return // 跳过链接，避免把外部引用带进来
    if (st.isDirectory()) {
      cpSync(src, dst, {
        recursive: true,
        filter: (s) => !s.includes('node_modules') && !basename(s).startsWith('.git'),
      })
    } else {
      mkdirSync(dirname(dst), { recursive: true })
      cpSync(src, dst)
    }
  }

  if (picked === null) {
    // 整包：排除 node_modules 与 .git
    for (const entry of readdirSync(srcDir)) {
      if (entry === 'node_modules' || entry === '.git') continue
      if (entry.startsWith('.')) continue
      addPath(entry)
    }
  } else {
    // package.json 必定带上（模块解析需要）
    addPath('package.json')
    for (const rel of picked) if (rel !== 'package.json') addPath(rel)
  }

  const measure = (dir) => {
    let bytes = 0
    let files = 0
    const walk = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name)
        const s = lstatSync(p)
        if (s.isSymbolicLink()) continue
        if (s.isDirectory()) walk(p)
        else {
          bytes += s.size
          files++
        }
      }
    }
    walk(dir)
    return { bytes, files }
  }

  const m = measure(destDir)
  report.push({
    name,
    status: 'ok',
    mode: picked === null ? 'whole' : 'files-field',
    files: m.files,
    MB: +(m.bytes / 1024 / 1024).toFixed(2),
    deps: Object.keys(pkg.dependencies ?? {}),
  })
}

console.log(JSON.stringify(report, null, 2))
const total = report.reduce((a, r) => a + (r.MB ?? 0), 0)
console.log('总计 MB:', total.toFixed(2))
