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
import { filterCommitsByBranch, resolveBranchInfoByRow, formatCommitDate } from '../src/client/Panel.tsx'

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

  // 4. 多历史分支累加紧凑度测试：确保分支结束后泳道及时回收复用，最新提交不出现 lane 膨胀漂移
  const multiBranchCommits: GraphCommit[] = []
  for (let i = 0; i < 40; i++) {
    const parents: string[] = []
    if (i < 39) parents.push(`c${i + 1}`)
    if (i % 4 === 0 && i < 36) parents.push(`feat_${i}`)
    multiBranchCommits.push({ sha: `c${i}`, parents, author: 'Dev', date: '2026-09-20', subject: `c${i}` })
    if (i % 4 === 0 && i < 36) {
      multiBranchCommits.push({ sha: `feat_${i}`, parents: [`c${i + 2}`], author: 'Dev', date: '2026-09-20', subject: `feat_${i}` })
    }
  }
  const multiLayout = layoutGraph(multiBranchCommits)
  const maxLane = Math.max(...multiLayout.map((c) => c.lane))
  check('多历史分支紧凑回收：最大并发泳道数受控 (<= 3)', maxLane <= 3, `实际 maxLane=${maxLane}`)
  check('顶部最新提交在主干左侧 (lane: 0)', multiLayout[0].lane === 0)

  // 5. 分支筛选 DAG 可达性测试
  const branchCommits: GraphCommit[] = [
    { sha: 'm2', parents: ['m1'], author: 'Dev', date: '2026-09-24', subject: 'main 2' },
    { sha: 'f2', parents: ['f1'], author: 'Dev', date: '2026-09-23', subject: 'feature 2' },
    { sha: 'f1', parents: ['m1'], author: 'Dev', date: '2026-09-22', subject: 'feature 1' },
    { sha: 'm1', parents: [],     author: 'Dev', date: '2026-09-21', subject: 'main 1' },
  ]
  const tips = { main: 'm2', feature: 'f2' }
  const featureFiltered = filterCommitsByBranch(branchCommits, tips, 'feature')
  check('分支筛选过滤出正确的祖先链 (feature 包含 f2, f1, m1)', featureFiltered.map(c => c.sha).join(',') === 'f2,f1,m1')
  const mainFiltered = filterCommitsByBranch(branchCommits, tips, 'main')
  check('分支筛选过滤出正确的祖先链 (main 包含 m2, m1)', mainFiltered.map(c => c.sha).join(',') === 'm2,m1')
  const noneFiltered = filterCommitsByBranch(branchCommits, tips, 'non-existent')
  check('不存在的分支返回空列表', noneFiltered.length === 0)

  // 6. 链路分支继承显示测试（方案 A）
  const inheritanceLayout: LayoutCommit[] = [
    { sha: 'f1', row: 0, lane: 0, parents: ['f2'], author: 'Dev', date: '2026-09-24', subject: 'f1' },
    { sha: 'd1', row: 1, lane: 1, parents: ['d2'], author: 'Dev', date: '2026-09-23', subject: 'd1' },
    { sha: 'd2', row: 2, lane: 1, parents: ['d3'], author: 'Dev', date: '2026-09-22', subject: 'd2' },
    { sha: 'f2', row: 3, lane: 0, parents: ['d3'], author: 'Dev', date: '2026-09-21', subject: 'f2' },
    { sha: 'd3', row: 4, lane: 1, parents: [],     author: 'Dev', date: '2026-09-20', subject: 'd3' },
  ]
  const inheritanceTips = { 'dev-f3': 'f1', dev: 'd1' }
  const branchMap = resolveBranchInfoByRow(inheritanceLayout, inheritanceTips, 'dev')
  check('行 0 为 dev-f3 分支 Tip', branchMap.get(0)?.branch === 'dev-f3' && branchMap.get(0)?.isTip === true)
  check('行 1 为当前活跃分支 dev 的 Tip', branchMap.get(1)?.branch === 'dev' && branchMap.get(1)?.isCurrentTip === true)
  check('行 2 继承父链分支 dev', branchMap.get(2)?.branch === 'dev' && branchMap.get(2)?.isTip === false)
  check('行 3 继承父链分支 dev-f3', branchMap.get(3)?.branch === 'dev-f3' && branchMap.get(3)?.isTip === false)
  check('行 4 主干祖先继承当前主分支 dev', branchMap.get(4)?.branch === 'dev' && branchMap.get(4)?.isTip === false)

  // 7. 日期紧凑展示格式化测试
  check('formatCommitDate 正常解析标准带时区时间', formatCommitDate('2026-10-11 08:45:12 +0800') === '10-11 08:45')
  check('formatCommitDate 正常解析 ISO 字符串', formatCommitDate('2026-10-11T08:45:12+08:00') === '10-11 08:45')
  check('formatCommitDate 兼容仅日期字符串', formatCommitDate('2026-10-11') === '10-11')
  check('formatCommitDate 兼容空值', formatCommitDate('') === '')
}

main()
