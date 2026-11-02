/**
 * Rules for the dsh-boot-spinner-corner-shape patch.
 *
 * 症状：桌面端启动页「Loading plugins…」那个转圈，圆环被压成圆角方框在转。
 *
 * 根因（官方 bug，不是任何插件的锅）：
 *   boot 页圆环由 dsh-web-frontend 产物里的
 *     ._spinner_<hash>      { border-radius:50%; corner-shape:round; border:2px solid ... }
 *     ._spinner_<hash>:after{ position:absolute; inset:-2px; border-radius:inherit;
 *                             background:conic-gradient(... --dsh-boot-arc ...) }
 *   绘制彩色进度弧的是 ::after，它只继承半径、没声明形状。
 *   而 ui-theme 的 corner-shape.css 在 @supports 命中后通配覆盖全站：
 *     *, *::before, *::after { corner-shape: var(--dsw-corner-shape) }
 *   令牌值是 superellipse(1.5)。corner-shape 不继承，border-radius:inherit
 *   传不了形状，于是 ::after 拿到 superellipse(1.5)，正圆被压成 squircle。
 *
 * 为什么只有桌面端复现：Electron 44 带 Chromium 155，支持 corner-shape，
 * @supports 命中；旧浏览器整块丢弃该规则，所以圆的是对的。
 *
 * 修法：给 ::after 补一句 corner-shape:round（与 ui-theme 自述的配对契约一致）。
 * 官方门禁测试 corner-shape-styles.client.spec.ts 只扫字面量 50%/100%/>=99px 的
 * border-radius，::after 用的 border-radius:inherit 绕过了它，所以漏网。
 *
 * 目标文件是 vite 产物，类名带内容哈希（_spinner_u7vgf_45），升级就会变，
 * 所以用正则锚点而不是字面量。
 */

/** 本补丁独有的符号，verify 用它判据（官方产物里绝不存在）。 */
export const MARKER = 'inset:-2px;border-radius:inherit;corner-shape:round;background:conic-gradient('

/**
 * 目标文件的归档内路径前缀。真实文件名带内容哈希，运行时用 resolveTarget 解析。
 * 目录写死是因为 apps/desktop/src/main.ts 硬编码了这个路径，不走 profile 解析。
 */
export const TARGET_DIR = 'dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets'
export const TARGET_PATTERN = /^index-[\w-]+\.css$/u

/**
 * 锚点：boot 圆环 ::after 规则的正文开头。
 *  - `inset:-2px` + `border-radius:inherit` + conic-gradient 三件套在本文件里唯一，
 *    且 conic-gradient 里紧跟 --dsh-boot-arc 变量，别的 ::after 不会同时满足。
 *  - 两侧都留断言（调用方保证匹配数 === 1），锚点漂移时抛错而不是写半截文件。
 */
export const ANCHOR = /:after\{content:"";position:absolute;inset:-2px;border-radius:inherit;background:conic-gradient\(/gu

/** 注入形态：在 border-radius:inherit; 之后插 corner-shape:round; */
export const INJECT = 'corner-shape:round;'

/** 已注入后的完整片段，用于幂等判定与 revert 定位。 */
const PATCHED = 'inset:-2px;border-radius:inherit;' + INJECT + 'background:conic-gradient('

/**
 * 从 asar 头里挑出唯一个 boot CSS 目标条目名。
 * @param names - dist/assets 目录下的文件名列表。
 * @returns 唯一匹配的 CSS 文件名。
 */
export function resolveTarget(names) {
  const matches = names.filter(name => TARGET_PATTERN.test(name))
  if (matches.length !== 1) {
    throw new Error(`boot-spinner-corner-shape: expected 1 index-*.css under ${TARGET_DIR}, found ${String(matches.length)}: ${matches.join(', ')}`)
  }
  return `${TARGET_DIR}/${matches[0]}`
}

/**
 * 给一份 dist css 打上 corner-shape:round。
 * @param source - 完整 CSS 文本。
 * @returns 打补丁后的文本；已打过则原样返回。
 */
export function applyRules(source) {
  if (source.includes(MARKER)) return source
  const hits = source.match(ANCHOR)?.length ?? 0
  if (hits !== 1) {
    throw new Error(`boot-spinner-corner-shape: anchor matched ${String(hits)} times, expected 1; upstream changed the boot spinner rule`)
  }
  return source.replace(ANCHOR, match => match.replace('border-radius:inherit;', 'border-radius:inherit;' + INJECT))
}

/**
 * 还原官方 CSS。
 * @param source - 完整 CSS 文本。
 * @returns 撤回后的文本；补丁不存在则原样返回。
 */
export function revertRules(source) {
  if (!source.includes(MARKER)) return source
  return source.replace(PATCHED, 'inset:-2px;border-radius:inherit;background:conic-gradient(')
}
