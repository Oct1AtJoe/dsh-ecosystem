// assets 静态服务守卫：路径净化 + MIME 映射（纯函数，零宿主依赖，可单测）。
// 契约：从请求 pathname 提取相对 assets 目录的安全子路径；含 `..`/`.`/空段/`\`（Windows 分隔符）/绝对路径即拒绝。
import { ASSETS_PATH } from './routes.mjs'
export { ASSETS_PATH }

/**
 * 从请求 pathname 提取安全相对路径；非法返回 null。
 * @param {string} pathname - 解码后的 URL pathname。
 * @param {string} prefix - assets 路由前缀。
 */
export function sanitizeAssetPath(pathname, prefix = ASSETS_PATH) {
  if (!pathname.startsWith(`${prefix}/`)) return null
  const rel = pathname.slice(prefix.length + 1)
  if (rel === '' || rel.includes('\0')) return null
  const segments = rel.split('/')
  for (const s of segments) {
    if (s === '' || s === '.' || s === '..' || s.includes('\\')) return null
  }
  return rel
}

const MIME = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json; charset=utf-8',
  // 音效资产：assets/sounds/ 下放用户可替换的通知音（见 AGENTS.md 5.7）。
  // 缺 MIME 会回落 octet-stream，WebView2 能否播放全靠 sniff，故显式声明。
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
}

/** 按扩展名映射 content-type；未知返回 octet-stream。 */
export function contentTypeFor(rel) {
  const dot = rel.lastIndexOf('.')
  const ext = dot === -1 ? '' : rel.slice(dot).toLowerCase()
  return MIME[ext] ?? 'application/octet-stream'
}

/**
 * assets 响应的 cache-control 策略（与 contentTypeFor 同层的纯函数，可单测）。
 *
 * 契约：只有「随包分发且内容不可变」的素材才吃 immutable 一年；
 * 会被用户就地替换的资产必须每次校验，否则替换后重启仍命中强缓存。
 * - manifest.json：资产清单本身会变，且是客户端首个请求，必须 no-cache。
 * - sounds/：用户自定义通知音效目录（AGENTS.md 5.7 说"放好文件重启即可"）。
 *   若下发 immutable，"换音效"会静默失效——听见的仍是旧音，且无任何报错。
 * - 其余（characters/…）：路径含角色 id 且随包分发，内容不可变。
 *   发布契约：改图必须改文件名或角色 id，否则 immutable 会滞留旧图。
 */
export function cacheControlFor(rel) {
  if (rel === 'manifest.json' || rel.startsWith('sounds/')) return 'no-cache, must-revalidate'
  return 'public, max-age=31536000, immutable'
}
