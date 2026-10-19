/**
 * 验证物化后的树是否真正自包含。
 *
 * 核心判据：所有 junction 目标必须落在【新树内部】。
 * 若指向源树，说明只是引用原位置，搬到别的电脑必断。
 */
import { readdirSync, lstatSync, readlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** 遍历树，收集所有链接及其解析后的绝对目标。 */
export function auditLinks(root) {
  const rootAbs = resolve(root)
  const junctions = []
  const fileLinks = []
  const broken = []

  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const p = join(dir, entry.name)
      let st
      try {
        st = lstatSync(p)
      } catch {
        broken.push(p)
        continue
      }

      if (st.isSymbolicLink()) {
        let raw
        try {
          raw = readlinkSync(p)
        } catch {
          broken.push(p)
          continue
        }

        // junction 的 readlink 返回绝对路径（含 \\?\ 前缀时需剥离）
        const cleaned = raw.startsWith('\\\\?\\') ? raw.slice(4) : raw
        const abs = cleaned.match(/^[A-Za-z]:[\\/]/) ? resolve(cleaned) : resolve(dir, cleaned)

        const inside = abs === rootAbs || abs.startsWith(rootAbs + '\\')
        const record = { path: p, target: abs, inside }
        if (st.isDirectory()) junctions.push(record)
        else fileLinks.push(record)
        continue
      }

      if (st.isDirectory()) walk(p)
    }
  }

  walk(rootAbs)
  return { root: rootAbs, junctions, fileLinks, broken }
}

/** 审计结果的人类可读摘要。 */
export function summarize(report) {
  const outside = report.junctions.filter((j) => !j.inside)
  return {
    junctions: report.junctions.length,
    outsideTree: outside.length,
    fileLinks: report.fileLinks.length,
    broken: report.broken.length,
    selfContained: outside.length === 0 && report.broken.length === 0,
    outsideSamples: outside.slice(0, 10).map((j) => ({ link: j.path, target: j.target })),
  }
}
