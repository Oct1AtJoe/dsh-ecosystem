/**
 * 侧边栏字号偏好：独立于官方的对话区字号（--dsh-content-font-size）。
 *
 * 为什么独立：侧边栏是导航 chrome，对话区是阅读内容。两者同字号会让正文失去
 * 视觉重量（VS Code / Slack / Notion 的侧边栏都固定比正文小一档）。
 *
 * 为什么用 localStorage 而非官方 settings：官方 --dsh-content-font-size 属
 * ui-theme 命名空间，插件不写别人的命名空间（架构铁律）；主题偏好
 * （dsh-theme-preference）已有同样的先例。
 *
 * 应用方式：写 --dsh-sidebar-font-size 到 html + body（内联变量双写，见
 * AGENTS.md 6.3 的层叠陷阱），由 SURFACE_GLASS_CSS 的规则消费。
 */

/** localStorage key。 */
const KEY = 'dsh-sidebar-font-size'

/** 最小可设侧边栏字号（px）。 */
export const SIDEBAR_FONT_MIN = 11

/** 最大可设侧边栏字号（px）。 */
export const SIDEBAR_FONT_MAX = 16

/**
 * 默认侧边栏字号：比对话区默认 14px 小一档。
 * 这正是「不该和主对话区一样大」的默认表达。
 */
export const DEFAULT_SIDEBAR_FONT = 13

/** 驱动侧边栏字号的内联 CSS 变量名。 */
export const SIDEBAR_FONT_VARIABLE = '--dsh-sidebar-font-size'

/** 校验并夹取到合法区间；非整数/非数字回退默认。 */
export function normalizeSidebarFont(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return DEFAULT_SIDEBAR_FONT
  if (n < SIDEBAR_FONT_MIN) return SIDEBAR_FONT_MIN
  if (n > SIDEBAR_FONT_MAX) return SIDEBAR_FONT_MAX
  return n
}

/** 读取已保存的侧边栏字号（无记录或不可用时回退默认）。 */
export function readSidebarFont(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_SIDEBAR_FONT
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null || raw === '') return DEFAULT_SIDEBAR_FONT
    return normalizeSidebarFont(raw)
  } catch {
    return DEFAULT_SIDEBAR_FONT
  }
}

/** 持久化侧边栏字号。 */
export function writeSidebarFont(px: number): void {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(KEY, String(normalizeSidebarFont(px))) } catch { /* 隐私模式等 */ }
}

/**
 * 把侧边栏字号写到 html + body 的内联变量。
 *
 * 必须双写：浅色兜底调色板定义在 body 上，其特异性高于 :root；只写
 * documentElement 会被 body 规则覆盖（AGENTS.md 6.3）。
 */
export function applySidebarFont(px: number): void {
  if (typeof document === 'undefined') return
  const value = `${normalizeSidebarFont(px)}px`
  document.documentElement.style.setProperty(SIDEBAR_FONT_VARIABLE, value)
  if (document.body) document.body.style.setProperty(SIDEBAR_FONT_VARIABLE, value)
}
