/**
 * Rules for the dsh-desktop-cookie-prune patch.
 *
 * 症状：桌面端启动即报 `desktop welcome: Web authentication failed`；
 * 重装、禁用插件、重置 profile 都无效，但 Host 本身是健康的。
 *
 * 根因（官方 discussion #9924 / discussioncomment-19276392，本机实测复现 431）：
 *
 *  1. Host 每次以 `--port 0` 启动 → 端口随机；
 *  2. BrowserAuth 的 cookie 名 = `dsh-auth-` + sha256(authority)，authority 含端口
 *     → 每个新端口都是一个**新 cookie 名**；
 *  3. cookie 存活 30 天（`Max-Age=2592000`），Electron 持久化，壳从不清理；
 *  4. Chromium 发 Cookie 头时**不看端口**，`127.0.0.1` 的全套一起发；
 *  5. 攒到约 70 个后 `Cookie` 头超过 Node HTTP 默认 16 KiB
 *     → Host 回 `431 Request Header Fields Too Large`；
 *  6. `connectDesktopWelcome` 把所有非 2xx 一律当成认证失败，真实状态码被吞，
 *     于是用户只看到「认证失败」，无从下手。
 *
 * 旧 cookie 必然是死重：签名载荷里带 authority（host:port），`isAuthenticated`
 * 会校验 authority 相符，换过端口之后旧 cookie 永远验不过。所以本补丁在欢迎
 * 握手前把它们清掉，并把真实 HTTP 状态补进报错。
 */
import { createHash } from 'node:crypto'

/** 本补丁独有的符号，verify 用它判据（不能用 locale 文案，会撞车复用字典）。 */
export const MARKER = 'pruneStaleHostCookies(ready.url)'

/** `client-connection` 的 BrowserAuth 拥有的 cookie 前缀。 */
export const COOKIE_PREFIX = 'dsh-auth-'

/** 锚点：`backend.start()` 里的欢迎握手调用点。 */
export const ANCHOR_WELCOME = '\t\t\t\twelcomeBackend = await connectDesktopWelcome(ready.url, (input, init) => net.fetch(input, init), async () => (await session.defaultSession.cookies.get({ url: ready.url })).map((cookie) => `${cookie.name}=${cookie.value}`).join("; "));'

export const NEW_WELCOME = [
  '\t\t\t\tawait pruneStaleHostCookies(ready.url);',
  ANCHOR_WELCOME,
].join('\n')

/** 锚点：`connectDesktopWelcome` 里那句吞掉状态码的通用报错。 */
export const ANCHOR_THROW = '\tif (!authenticated.ok) throw new Error("desktop welcome: Web authentication failed");'

export const NEW_THROW = '\tif (!authenticated.ok) throw new Error(`desktop welcome: Web authentication failed (HTTP ${authenticated.status} at ${origin})`);'

/** 锚点：`connectDesktopWelcome` 的函数头，helper 插在它前面。 */
export const ANCHOR_FN = 'async function connectDesktopWelcome(authenticatedUrl, send, cookies = () => Promise.resolve("")) {'

export const HELPERS = [
  '/**',
  '* 清掉本 Host 已失效的浏览器认证 cookie，避免 Cookie 头撑爆 Node 的 16 KiB 上限。',
  '*',
  '* Host 每次随机端口，BrowserAuth 又按 authority（含端口）给 cookie 命名，',
  '* 所以每次启动都会留下一个后续启动永远验不过的死 cookie；Chromium 又把',
  '* `127.0.0.1` 的所有 cookie 一起发，攒到约 70 个就 431。',
  '* @param url - 当前运行 Host 的启动 URL。',
  '*/',
  'async function pruneStaleHostCookies(url) {',
  '\ttry {',
  '\t\tconst stored = await session.defaultSession.cookies.get({ url });',
  `\t\tconst stale = stored.filter((cookie) => cookie.name.startsWith(${JSON.stringify(COOKIE_PREFIX)}));`,
  '\t\tif (stale.length === 0) return;',
  '\t\tawait Promise.all(stale.map((cookie) => session.defaultSession.cookies.remove(url, cookie.name)));',
  '\t\tconsole.log(`desktop welcome: pruned ${String(stale.length)} stale host cookie(s)`);',
  '\t} catch (error) {',
  '\t\tconsole.warn("desktop welcome: could not prune stale host cookies", error);',
  '\t}',
  '}',
  '',
  ANCHOR_FN,
].join('\n')

const steps = [
  [ANCHOR_WELCOME, NEW_WELCOME],
  [ANCHOR_THROW, NEW_THROW],
]

/**
 * 把 cookie 清理规则应用到一份源码上。
 * @param source - 完整的 `lib/main.js` 文本。
 * @returns 打补丁后的文本；已打过则原样返回。
 */
export function applyRules(source) {
  if (source.includes(MARKER)) return source
  let next = source
  if (!next.includes(HELPERS)) {
    if (!next.includes(ANCHOR_FN)) throw new Error('cookie-prune: function anchor not found; upstream changed the shell entry')
    next = next.replace(ANCHOR_FN, HELPERS)
  }
  for (const [anchor, replacement] of steps) {
    if (!next.includes(anchor)) throw new Error('cookie-prune: anchor not found; upstream changed the shell entry')
    next = next.replace(anchor, replacement)
  }
  return next
}

/**
 * 还原官方壳层入口。
 * @param source - 完整的 `lib/main.js` 文本。
 * @returns 撤回后的文本；补丁不存在则原样返回。
 */
export function revertRules(source) {
  if (!source.includes(MARKER)) return source
  let next = source
  for (const [anchor, replacement] of [...steps].reverse()) next = next.replace(replacement, anchor)
  return next.replace(HELPERS, ANCHOR_FN)
}

/**
 * BrowserAuth 会给某个 authority 铸出的 cookie 名。测试用它证明「换端口即换名」
 * 这一前提，而不需要拉起整个 Host。
 * @param authority - `requestAudience` 拼出的 `host:port`。
 * @returns 该 authority 对应的 cookie 名。
 */
export function cookieNameFor(authority) {
  return COOKIE_PREFIX + createHash('sha256').update(authority).digest('base64')
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}
