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
export declare const MARKET_STICKY_ATTRIBUTE = "data-dsh-market-sticky-sync";
/**
 * 安装吸顶同步：滚动与缩放**同步**判定（吸顶态必须与滚动同帧生效），
 * 市场挂载/切页引起的 DOM 变化则用 rAF 节流补一次扫描。
 * @returns disposer，随插件 fiber 一起释放。
 */
export declare function initMarketStickySync(): () => void;
//# sourceMappingURL=market-sticky.d.ts.map