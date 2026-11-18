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

export interface ViewportWindowInput {
  /** SVG 元素 getBoundingClientRect().top（受 CSS zoom 放大） */
  svgTop: number
  /** 滚动容器 getBoundingClientRect().top（受 CSS zoom 放大） */
  scrollerTop: number
  /** 滚动容器 clientHeight（未缩放布局像素） */
  scrollerClientHeight: number
  /** 有效 CSS 缩放（body zoom）；<=0 时按 1 处理 */
  zoom: number
  /** SVG 顶部内边距（第 0 行的 y） */
  padTop: number
  /** 行高 */
  rowHeight: number
  /** 视口上下各多渲染的行数 */
  bufferRows: number
  /** 总行数 */
  totalRows: number
}

/**
 * 计算提交图谱虚拟化的可见行区间 [first, last]。
 *
 * getBoundingClientRect() 返回的坐标会被 CSS `zoom`（宿主 UI 缩放，实测 body zoom=1.25）
 * 放大，而 clientHeight / 行高 / 内边距都是未缩放的布局像素；两者直接相减会让行窗口
 * 随滚动量线性偏大、视口上方露出空白。这里先把 gBCR 差值除以 zoom 归一到布局像素，
 * 再换算行区间。zoom<=0（或未测到）时按 1 处理，保证 zoom=1 行为不变。
 */
export function visibleRowWindow(input: ViewportWindowInput): { first: number; last: number } {
  const { svgTop, scrollerTop, scrollerClientHeight, zoom, padTop, rowHeight, bufferRows, totalRows } = input
  const z = zoom > 0 ? zoom : 1
  const v0 = (scrollerTop - svgTop) / z
  const v1 = v0 + scrollerClientHeight
  const first = Math.max(0, Math.floor((v0 - padTop) / rowHeight) - bufferRows)
  const last = Math.min(totalRows - 1, Math.ceil((v1 - padTop) / rowHeight) + bufferRows)
  return { first, last }
}
