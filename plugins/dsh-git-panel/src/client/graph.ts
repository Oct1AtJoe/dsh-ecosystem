/** 提交 DAG 布局：为每个提交分配一条 lane（GitLens/gitk 风格列）。 */

import type { GraphCommit } from '../core/types.ts'

export interface LayoutCommit extends GraphCommit {
  /** 行索引，0 = 最新（顶部）。 */
  row: number
  /** lane 索引（从 0 开始）。 */
  lane: number
}

/**
 * 将提交布局到行与 lane 中。
 *
 * 采用自顶向下（最新提交在前）的紧凑活跃泳道（Active Lanes）算法：
 * 1. 顶部最新提交（HEAD / tip）优先占据最左侧泳道（lane: 0）。
 * 2. 提交向下追踪其父提交：首个父提交继承当前泳道，合并引入的父提交分配到紧凑空闲泳道。
 * 3. 当分支汇聚到同一父提交或终结时，泳道被及时回收复用。
 *
 * 这样可以避免历史多分支累加导致的 lane 索引无限右移漂移问题，使活动分支
 * 始终紧凑靠左排列。
 */
export function layoutGraph(commits: GraphCommit[]): LayoutCommit[] {
  const activeLanes: Array<string | null> = []
  const placed: LayoutCommit[] = []

  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row]
    // 1. 寻找当前是否有已有活跃泳道在等待该 commit
    let lane = activeLanes.indexOf(commit.sha)

    if (lane === -1) {
      // 这是一个新分支的 tip 或起始 commit，分配最小可用空闲泳道
      lane = activeLanes.indexOf(null)
      if (lane === -1) {
        lane = activeLanes.length
        activeLanes.push(null)
      }
    }

    // 记录布局结果
    placed.push({ ...commit, row, lane })

    // 当前 commit 已落定，先清空当前等待槽
    activeLanes[lane] = null

    // 2. 如果还有其它泳道也在等待该 commit（说明该 commit 是多个子分支的分叉汇聚点），
    // 那些泳道此时也已成功汇聚，全部释放
    for (let i = 0; i < activeLanes.length; i++) {
      if (activeLanes[i] === commit.sha) {
        activeLanes[i] = null
      }
    }

    // 3. 处理当前 commit 的父提交
    const parents = commit.parents ?? []
    if (parents.length > 0) {
      // 首个父提交（主干延续）优先沿用当前 lane，除非已有其它泳道在等它
      const p0 = parents[0]
      if (activeLanes.indexOf(p0) === -1) {
        activeLanes[lane] = p0
      }

      // 后续父提交（合并引入的次级分支）
      for (let pIdx = 1; pIdx < parents.length; pIdx++) {
        const p = parents[pIdx]
        if (activeLanes.indexOf(p) === -1) {
          let nextFree = activeLanes.indexOf(null)
          if (nextFree === -1) {
            nextFree = activeLanes.length
            activeLanes.push(null)
          }
          activeLanes[nextFree] = p
        }
      }
    }

    // 修剪末尾多余的 null
    while (activeLanes.length > 0 && activeLanes[activeLanes.length - 1] === null) {
      activeLanes.pop()
    }
  }

  return placed
}
