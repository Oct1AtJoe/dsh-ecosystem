/**
 * 提交图谱（Graph）布局算法自检：
 * 
 * 核心断言：
 * 1. 时间降序（最新在前）：commits 数组第 0 项（最新）映射为 row: 0（顶部）；
 * 2. 历史祖先提交行号单调递增，对任意提交及其父提交，恒有 child.row < parent.row（子在上，父在下）；
 * 3. 分支分叉与合并时，各分支的 lane 分配保持连续且互不冲突；
 * 4. 边界情况：单提交、空提交列表处理正常。
 */
import type { GraphCommit } from '../src/core/types.ts'
import { layoutGraph, type LayoutCommit } from '../src/client/graph.ts'

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

function main(): void {
  // 1. 单链线性历史：c3 -> c2 -> c1
  const linearCommits: GraphCommit[] = [
    { sha: 'c3', parents: ['c2'], author: 'Dev', date: '2026-09-23', subject: 'feat: third' },
    { sha: 'c2', parents: ['c1'], author: 'Dev', date: '2026-09-22', subject: 'feat: second' },
    { sha: 'c1', parents: [],     author: 'Dev', date: '2026-09-21', subject: 'feat: initial' },
  ]

  const linearLayout = layoutGraph(linearCommits)
  check('单链返回长度一致', linearLayout.length === 3)
  check('单链最新提交 c3 在顶部 (row: 0)', linearLayout[0].sha === 'c3' && linearLayout[0].row === 0)
  check('单链中间提交 c2 在中间 (row: 1)', linearLayout[1].sha === 'c2' && linearLayout[1].row === 1)
  check('单链初始提交 c1 在底部 (row: 2)', linearLayout[2].sha === 'c1' && linearLayout[2].row === 2)
  check('单链共用同一泳道 (lane: 0)', linearLayout.every((c) => c.lane === 0))

  // 2. 分支分叉与合并拓扑：
  // c4 (merge c2, c3) -> parents: ['c2', 'c3']
  // c3 (feature)      -> parents: ['c1']
  // c2 (master)       -> parents: ['c1']
  // c1 (root)         -> parents: []
  const dagCommits: GraphCommit[] = [
    { sha: 'c4', parents: ['c2', 'c3'], author: 'Dev', date: '2026-09-24', subject: 'merge: feature into master' },
    { sha: 'c3', parents: ['c1'],       author: 'Dev', date: '2026-09-23', subject: 'feat: add feature' },
    { sha: 'c2', parents: ['c1'],       author: 'Dev', date: '2026-09-22', subject: 'fix: fix on master' },
    { sha: 'c1', parents: [],           author: 'Dev', date: '2026-09-21', subject: 'chore: root init' },
  ]

  const dagLayout = layoutGraph(dagCommits)
  const bySha = new Map<string, LayoutCommit>(dagLayout.map((c) => [c.sha, c]))

  check('DAG 拓扑最新合并提交 c4 在顶部 (row: 0)', bySha.get('c4')?.row === 0)
  check('DAG 拓扑根提交 c1 在底部 (row: 3)', bySha.get('c1')?.row === 3)

  // 验证子提交必定在所有父提交的上方（行号更小）
  let childAboveParent = true
  for (const c of dagLayout) {
    for (const pSha of c.parents) {
      const p = bySha.get(pSha)
      if (p && !(c.row < p.row)) {
        childAboveParent = false
      }
    }
  }
  check('拓扑约束：子提交纵坐标始终位于父提交上方 (child.row < parent.row)', childAboveParent)

  // 验证泳道分叉隔离
  const c4Lane = bySha.get('c4')?.lane
  const c3Lane = bySha.get('c3')?.lane
  const c2Lane = bySha.get('c2')?.lane
  check('分支特征：分支 c3 独立分配不同泳道', c3Lane !== c4Lane && c3Lane !== c2Lane)

  // 3. 边界情况测试
  const emptyLayout = layoutGraph([])
  check('空提交数组返回空布局', emptyLayout.length === 0)

  const singleCommit: GraphCommit[] = [
    { sha: 'only', parents: [], author: 'Dev', date: '2026-09-20', subject: 'single' }
  ]
  const singleLayout = layoutGraph(singleCommit)
  check('单个提交 row 为 0，lane 为 0', singleLayout[0]?.row === 0 && singleLayout[0]?.lane === 0)
}

main()
