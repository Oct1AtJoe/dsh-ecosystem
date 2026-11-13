/**
 * graphEdgePath 纯几何自检（小档圆角）：
 * 同泳道=直线；跨泳道=竖直段+Q 圆角；R=max(|dx|*0.6, 行高*0.35)≈10.8。
 */
import { EDGE_STROKE_WIDTH, graphEdgePath } from '../src/client/graph-geometry.ts'
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
}
main()
