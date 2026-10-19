/**
 * 物化 DSH runtime：把 pnpm 隔离布局的树搬成自包含、可分发、可运行的目录。
 *
 * 三个必须处理的现实问题（均经实测）：
 * 1. 91.5% 的文件是硬链接到外部 pnpm store —— 必须真复制，否则搬走全是断的。
 * 2. 10807 个目录符号链接 —— Windows 上 fs.symlinkSync 建的文件软链跨进程 stat 会 EPERM，
 *    必须用 junction；且 junction 目标必须是【新树内的路径】，指向源树等于没搬走。
 * 3. 文件软链 —— 直接复制目标实体。
 *
 * ponytail: 不做通用的包管理器实现，只做一次性的树搬运；结构保持 pnpm 原样，
 * 不展平不重排（展平会丢掉同名多版本的语义，见 dsh-schedule 有 9 个实例）。
 */
import { copyFileSync, mkdirSync, readdirSync, lstatSync, readlinkSync, realpathSync, statSync, symlinkSync, existsSync } from 'node:fs'
import { dirname, join, resolve, relative, sep } from 'node:path'

/**
 * 把 src 树搬到 dst 树，保持目录结构不变。
 * 软链按【相对路径】重定位到 dst 内的等价位置，确保整树可移动。
 */
export function materializeTree(src, dst, stats = { files: 0, junctions: 0, links: 0, dirs: 0, failed: [] }) {
  const srcRoot = resolve(src)
  const dstRoot = resolve(dst)

  // 把源树内的绝对路径翻译成目标树内的绝对路径；不在源树内则返回 null（外部依赖，须报错）
  const relocate = (absPath) => {
    const rel = relative(srcRoot, absPath)
    if (rel.startsWith('..') || resolve(rel) === absPath) return null
    return join(dstRoot, rel)
  }

  const walk = (srcDir, dstDir) => {
    mkdirSync(dstDir, { recursive: true })
    stats.dirs++

    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      const sp = join(srcDir, entry.name)
      const dp = join(dstDir, entry.name)

      let st
      try {
        st = lstatSync(sp)
      } catch (error) {
        stats.failed.push({ path: sp, reason: `lstat: ${error.code}` })
        continue
      }

      if (st.isSymbolicLink()) {
        let raw
        try {
          raw = readlinkSync(sp)
        } catch (error) {
          stats.failed.push({ path: sp, reason: `readlink: ${error.code}` })
          continue
        }

        // 软链可能是相对路径，也可能是绝对路径；统一解析成源树内的绝对路径
        const anchor = raw.match(/^[A-Za-z]:[\\/]/) ? raw : resolve(dirname(sp), raw)
        const newTarget = relocate(anchor)

        if (newTarget === null) {
          // 指向源树之外 —— 这正是必须被实体化掉的外部依赖（8 个 link: 插件）
          stats.failed.push({ path: sp, reason: `外部路径: ${anchor}` })
          continue
        }

        // 目标是目录 -> junction（Windows 唯一可靠方案）；目标是文件 -> 复制实体
        let isDir = false
        try {
          isDir = statSync(anchor).isDirectory()
        } catch {
          stats.failed.push({ path: sp, reason: `目标不存在: ${anchor}` })
          continue
        }

        if (isDir) {
          try {
            symlinkSync(newTarget, dp, 'junction')
            stats.junctions++
          } catch (error) {
            stats.failed.push({ path: sp, reason: `junction: ${error.code}` })
          }
        } else {
          try {
            copyFileSync(anchor, dp)
            stats.links++
            stats.files++
          } catch (error) {
            stats.failed.push({ path: sp, reason: `copy link target: ${error.code}` })
          }
        }
        continue
      }

      if (st.isDirectory()) {
        walk(sp, dp)
        continue
      }

      // 普通文件：copyFileSync 天然解硬链接，写入的是独立实体
      try {
        copyFileSync(sp, dp)
        stats.files++
      } catch (error) {
        stats.failed.push({ path: sp, reason: `copy: ${error.code}` })
      }
    }
  }

  walk(srcRoot, dstRoot)
  return stats
}

/** 统计树的物理体积与文件数。 */
export function measureTree(root) {
  let bytes = 0
  let files = 0
  let maxPath = 0
  const rootLen = resolve(root).length

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      const len = p.length - rootLen
      if (len > maxPath) maxPath = len

      let st
      try {
        st = lstatSync(p)
      } catch {
        continue
      }
      if (st.isSymbolicLink()) {
        // junction 不计入文件体积（它是重定向）
        continue
      }
      if (st.isDirectory()) walk(p)
      else {
        bytes += st.size
        files++
      }
    }
  }

  if (existsSync(root)) walk(resolve(root))
  return { bytes, files, maxRelativePath: maxPath }
}
