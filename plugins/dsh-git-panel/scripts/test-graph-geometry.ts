/**
 * graphEdgePath 纯几何自检（小档圆角）：
 * 同泳道=直线；跨泳道=竖直段+Q 圆角；R=max(|dx|*0.6, 行高*0.35)≈10.8。
 */
import { EDGE_STROKE_WIDTH, graphEdgePath, visibleRowWindow } from '../src/client/graph-geometry.ts'
function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`); if (!ok) process.exitCode = 1
}
const QRE = /^M (\d+) (\d+) L (\d+) ([\d.]+) Q (\d+) (\d+), (\d+) (\d+)$/
function main(): void {
  check('描边宽度为 1.8', EDGE_STROKE_WIDTH === 1.8)
  const s = graphEdgePath(16, 10, 16, 38, 28)
  check('同泳道=直线', s.straight === true && s.d === 'M 16 10 L 16 38', s.d)
  const c = graphEdgePath(16, 10, 34, 38, 28)   // dx18 -> max(10.8,9.8)=10.8
  const m = c.d.match(QRE)
  check('跨泳道=竖直+Q', c.straight === false && m !== null, c.d)
  if (m) {
    const y0=Number(m[2]), ly=Number(m[4]), qx=Number(m[5]), qy=Number(m[6]), ex=Number(m[7]), ey=Number(m[8])
    const R = ey - ly
    check('终点=父提交', ex === 34 && ey === 38)
    check('Q 控制点 x=子x / y=父y', qx === Number(m[1]) && qy === ey)
    check('小档半径 R≈10.8', Math.abs(R - 10.8) < 0.01, `R=${R}`)
    check('竖直段 x=子x 且在上方', Number(m[3]) === Number(m[1]) && ly > y0)
  }
  const L = graphEdgePath(34, 0, 16, 24, 28)
  check('向左曲线终点正确', / 16 24$/.test(L.d.trim()) && !L.straight, L.d)
  const big = graphEdgePath(0, 0, 18, 240, 28).d.match(QRE)
  check('长跨度 R 仍≈10.8（不放大）', big !== null && Math.abs((240 - Number(big[4])) - 10.8) < 0.01, big ? `R=${240-Number(big[4])}` : 'no-match')

  // ---- visibleRowWindow：视口虚拟化在 CSS zoom（宿主 body zoom=1.25）下不得偏移 ----
  const VW = { padTop: 10, rowHeight: 28, bufferRows: 10, totalRows: 300 }
  const S = 1500, A = 72, clientH = 508, scrollerTop = 0
  const svgTopZ1 = A - S               // z=1：gBCR 与布局像素同值
  const svgTopZ125 = 1.25 * (A - S)    // z=1.25：gBCR 被放大
  const trueFirst = (S - A - VW.padTop) / VW.rowHeight
  const trueLast = (S - A - VW.padTop + clientH) / VW.rowHeight
  const w1 = visibleRowWindow({ ...VW, svgTop: svgTopZ1, scrollerTop, scrollerClientHeight: clientH, zoom: 1 })
  const w125 = visibleRowWindow({ ...VW, svgTop: svgTopZ125, scrollerTop, scrollerClientHeight: clientH, zoom: 1.25 })
  check('zoom=1 窗口覆盖视口', w1.first <= trueFirst && w1.last >= trueLast, `[${w1.first},${w1.last}] vs [${trueFirst.toFixed(1)},${trueLast.toFixed(1)}]`)
  check('zoom=1.25 窗口与 zoom=1 等价', w125.first === w1.first && w125.last === w1.last, `[${w125.first},${w125.last}]`)
  check('zoom=1.25 窗口覆盖视口', w125.first <= trueFirst && w125.last >= trueLast)
  // 回归：不除以 zoom（把放大后的 gBCR 差当布局像素）时 first 必偏大 → 顶部露白
  const naive = visibleRowWindow({ ...VW, svgTop: svgTopZ125, scrollerTop, scrollerClientHeight: clientH, zoom: 1 })
  check('未归一化会 first 偏大（回归判据）', naive.first > trueFirst + 1, `naive.first=${naive.first} vs trueFirst=${trueFirst.toFixed(1)}`)
  // zoom<=0 回退按 1
  const wz0 = visibleRowWindow({ ...VW, svgTop: svgTopZ1, scrollerTop, scrollerClientHeight: clientH, zoom: 0 })
  check('zoom<=0 回退按 1', wz0.first === w1.first && wz0.last === w1.last)
  // totalRows 上界裁剪
  const wClamp = visibleRowWindow({ ...VW, totalRows: 45, svgTop: svgTopZ1, scrollerTop, scrollerClientHeight: clientH, zoom: 1 })
  check('last 不超过 totalRows-1', wClamp.last === 44, `last=${wClamp.last}`)
}
main()
