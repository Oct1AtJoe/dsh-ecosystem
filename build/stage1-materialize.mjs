/** 阶段 1 主流程：物化 runtime 并审计自包含性。 */
import { rmSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { materializeTree, measureTree } from './prepare-runtime.mjs'
import { auditLinks, summarize } from './audit-links.mjs'

const SRC = 'C:\\Users\\Administrator\\.dsh\\profiles\\web\\node_modules'
const OUT = 'C:\\dsh-ecosystem\\desktop\\bundle-resources\\runtime'
const NODE_EXE = 'C:\\Users\\Administrator\\.local\\bin\\nodejs24\\node.exe'

const t0 = Date.now()

console.log('=== 清理旧产物 ===')
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

console.log('=== 物化 node_modules ===')
const stats = materializeTree(SRC, join(OUT, 'node_modules'))

console.log(
  JSON.stringify(
    {
      耗时秒: Math.round((Date.now() - t0) / 1000),
      文件: stats.files,
      junction: stats.junctions,
      文件软链实体化: stats.links,
      目录: stats.dirs,
      失败: stats.failed.length,
    },
    null,
    2,
  ),
)

if (stats.failed.length > 0) {
  console.log('=== 失败样本（前 20）===')
  console.log(JSON.stringify(stats.failed.slice(0, 20), null, 2))
}

console.log('=== 拷贝 node.exe ===')
copyFileSync(NODE_EXE, join(OUT, 'node.exe'))

console.log('=== 体积度量 ===')
const m = measureTree(join(OUT, 'node_modules'))
console.log(
  JSON.stringify(
    {
      文件数: m.files,
      MB: Math.round(m.bytes / 1024 / 1024),
      最长相对路径: m.maxRelativePath,
    },
    null,
    2,
  ),
)

console.log('=== 自包含审计 ===')
const report = auditLinks(OUT)
console.log(JSON.stringify(summarize(report), null, 2))
