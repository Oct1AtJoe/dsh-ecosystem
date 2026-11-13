/**
 * 提交图谱的纯几何工具：计算父子提交之间的连线路径。
 * @module dsh-git-panel/client/graph-geometry
 */

/** 连线描边宽度（px）。与节点圆环描边保持一致。 */
export const EDGE_STROKE_WIDTH = 1.8

export interface EdgeGeometry {
  d: string
  straight: boolean
}

/**
 * 计算一条父子连线的路径。
 *
 * - 同泳道：竖直线。
 * - 跨泳道：先沿子泳道竖直下行，再用「大半径圆角」二次贝塞尔弯入父提交，
 *   终点切线水平。半径 R 取 max(横向差*1.6, 行高*1.1) 且不超过整段高度，
 *   因此弧度大、转角圆润，不再是贴线斜切或小半径急折角。
 *
 * @param x 子提交 x
 * @param y 子提交 y（恒小于 py）
 * @param px 父提交 x
 * @param py 父提交 y
 * @param rowHeight 行高（决定圆角最小半径）
 */
export function graphEdgePath(
  x: number,
  y: number,
  px: number,
  py: number,
  rowHeight: number,
): EdgeGeometry {
  if (px === x) {
    return { d: `M ${x} ${y} L ${px} ${py}`, straight: true }
  }
  const dy = Math.max(0, py - y)
  const R = Math.min(dy, Math.max(Math.abs(px - x) * 0.6, rowHeight * 0.35))
  const d = `M ${x} ${y} L ${x} ${py - R} Q ${x} ${py}, ${px} ${py}`
  return { d, straight: false }
}
