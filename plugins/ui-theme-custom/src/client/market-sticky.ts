/**
 * 插件市场（dsh-market）吸顶筛选区的 stuck 状态补丁。
 *
 * 🚨 为什么需要这个模块（实测结论，不要用「加填充」代替它）：
 * dsh-market 1.66 的 `catsStuck` 只服务于组件内部的「分类行折叠」计算，
 * **不向 DOM 输出任何 stuck 标记** —— 实测其 `client/client.js` 中
 * `data-stuck` 出现 0 次，`Stuck` 只出现在源码注释里。
 * 而本主题的筛选区是两态设计（未吸顶 transparent / 吸顶给填充），
 * 依赖的正是 `[data-stuck="true"]` / `[class*="Stuck"]` 这两个永不命中的选择器。
 * 于是吸顶后筛选区仍是透明，卡片文字从它下面滚过时直接穿透。
 *
 * 修法：本模块观测 dsh-market **自己渲染的哨兵节点**
 * （`MarketSection.tsx` 在 stickyHead 前渲染的 `<div ref={setCatsSentinel} />`），
 * 按几何关系补出 `data-stuck` 标记，让主题的两态 CSS 真正生效。
 *
 * 判据（不猜类名、不猜偏移量）：未吸顶时哨兵紧贴在吸顶条上方
 * （sentinel.bottom ≈ head.top）；吸顶后吸顶条被钉在滚动视口顶边，
 * 哨兵继续向上滚走，二者距离拉开 —— 差值 > 1px 即判定为吸顶。
 */

/** 补丁挂载的标记属性，便于门禁与排查确认已生效。 */
export const MARKET_STICKY_ATTRIBUTE = 'data-dsh-market-sticky-sync'

/** 吸顶判定的容差：亚像素布局与 0.5px 边框会让差值在 0~1 之间抖动。 */
const STUCK_EPSILON = 1

/**
 * 单次扫描：为每个市场的每个吸顶条同步 `data-stuck`。
 * 只写属性、不读回布局之外的任何东西，因此可在滚动帧内安全调用。
 */
function syncStuck(): void {
  const roots = document.querySelectorAll<HTMLElement>('[data-dsh-market-root]')
  for (let i = 0; i < roots.length; i += 1) {
    const root = roots[i]
    if (root === undefined) continue
    const heads = root.querySelectorAll<HTMLElement>('[class*="stickyHead"]')
    for (let j = 0; j < heads.length; j += 1) {
      const head = heads[j]
      if (head === undefined) continue
      // 宿主在 stickyHead 之前渲染哨兵（空 div）。它是「内容是否已滚过」的唯一真值来源。
      const sentinel = head.previousElementSibling
      const stuck = sentinel instanceof HTMLElement
        ? head.getBoundingClientRect().top - sentinel.getBoundingClientRect().bottom > STUCK_EPSILON
        : false
      const current = head.getAttribute('data-stuck') === 'true'
      if (stuck === current) continue
      // 只在状态翻转时写 DOM，避免每帧都触发样式重算。
      if (stuck) head.setAttribute('data-stuck', 'true')
      else head.removeAttribute('data-stuck')
    }
  }
}

/**
 * 安装吸顶同步：滚动与缩放**同步**判定（吸顶态必须与滚动同帧生效），
 * 市场挂载/切页引起的 DOM 变化则用 rAF 节流补一次扫描。
 * @returns disposer，随插件 fiber 一起释放。
 */
export function initMarketStickySync(): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {}
  if (document.documentElement.hasAttribute(MARKET_STICKY_ATTRIBUTE)) return () => {}
  document.documentElement.setAttribute(MARKET_STICKY_ATTRIBUTE, '')

  let frame = 0
  const schedule = (): void => {
    if (frame !== 0) return
    frame = window.requestAnimationFrame(() => {
      frame = 0
      syncStuck()
    })
  }

  // 市场按需挂载、切标签会重建 stickyHead，需要在新节点出现后补一次判定。
  // DOM 批量变更用 rAF 节流（一次变更可能触发大量记录）。
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })

  /**
   * 滚动路径**同步**执行，不经 rAF。
   * 判据只读 2 个 rect（市场根最多一个），成本可忽略；而依赖 rAF 会让吸顶态
   * 晚一帧生效 —— 用户看到的正是「卡片文字已经从筛选区下面滚过去了、
   * 筛选区却还没变实」的那一帧穿透。
   */
  const onScroll = (): void => { syncStuck() }

  // scroll 不冒泡，但捕获阶段能拿到任意滚动容器的滚动事件（市场的滚动容器是 .body）。
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('resize', onScroll, { passive: true })

  syncStuck()

  return () => {
    if (frame !== 0) window.cancelAnimationFrame(frame)
    document.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', onScroll)
    observer.disconnect()
    document.documentElement.removeAttribute(MARKET_STICKY_ATTRIBUTE)
    const heads = document.querySelectorAll<HTMLElement>('[class*="stickyHead"][data-stuck]')
    for (let i = 0; i < heads.length; i += 1) heads[i]?.removeAttribute('data-stuck')
  }
}
