/**
 * 关键验证：junction 必须指向【新树】而非源树。
 * 判据：搬完之后把源树改名，新树仍然可运行，才算真正自包含。
 *
 * 用最小子树做快速迭代，避免每次全量 84 秒拷贝。
 */
import { renameSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { materializeTree, measureTree } from './prepare-runtime.mjs'

const SRC = 'C:\\Users\\Administrator\\.dsh\\profiles\\web\\node_modules'
const DST = 'C:\\__probe-dst'

// 只挑一个 dsh 实例 + 它依赖的 cordis，验证解析链
const KEEP = [
  '.pnpm/@deepseek-ai+dsh@0.2.1-rc.2_6fc9f7589ffa2b166529e389b14fb9bc',
  '.pnpm/@deepseek-ai+cordis@4.0.5_@_90376d305dda7a2df932b5d58ea69b86',
]

console.log('这只是一个测量脚本，实际搬运由 prepare-runtime.mjs 完成')
console.log('SRC=', SRC)
console.log('DST=', DST)
