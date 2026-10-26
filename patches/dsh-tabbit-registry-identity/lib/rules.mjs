/**
 * dsh-tabbit 安装探测补丁的文本变换规则。
 * 与 desktop-menu 的 lib/rules.mjs 同构：纯字符串进、纯字符串出，便于单测与 diff 报告。
 */

/** 补丁独有符号，verify 用它判定补丁是否生效（不用 locale 文案键，会撞车）。 */
export const MARKER = 'windowsIdentityOf'

/**
 * 解析注册表记录的身份。
 * 原实现只看 DisplayName 白名单，导致非英文 Windows 全部判“未安装”。
 * 改为优先按卸载表子键名（安装器写死，恒英文），再回退 DisplayName。
 */
const IDENTITY_HELPER = [
  '/* 卸载表子键名恒为安装器写死的英文，不随系统语言变；DisplayName 则会被本地化。 */',
  'const WINDOWS_UNINSTALL_KEY_NAMES = new Map([',
  "    ['Tabbit', { edition: 'international', channel: 'stable' }],",
  "    ['Tabbit Browser', { edition: 'domestic', channel: 'stable' }],",
  ']);',
  '/*',
  ' * 从 registryKey 末段取卸载表子键名（忽略大小写），取不到再回退 DisplayName。',
  ' * 这条路径必须在 DisplayName 之前：后者在中文 Windows 上是 "Tabbit浏览器"。',
  ' */',
  'export function ' + MARKER + '(record) {',
  '    const keyName = record.registryKey?.split(/[\\\\/]/u).pop()?.trim();',
  '    const byKey = keyName === undefined ? undefined : WINDOWS_UNINSTALL_KEY_NAMES.get(keyName);',
  "    if (byKey !== undefined)",
  '        return byKey;',
  "    return WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '');",
  '}',
].join('\n')

/** 原身份判定：只认 DisplayName。 */
const OLD_COMMIT = [
  '    const commit = () => {',
  '        if (!record)',
  '            return;',
  "        const identity = WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '');",
  '        if (!identity)',
  '            return;',
].join('\n')

/** 新身份判定：先子键名，再 DisplayName。 */
const NEW_COMMIT = [
  '    const commit = () => {',
  '        if (!record)',
  '            return;',
  '        const identity = ' + MARKER + '(record);',
  '        if (!identity)',
  '            return;',
].join('\n')

/** 插入点：WINDOWS_DISPLAY_NAMES 闭包之后。 */
const ANCHOR = [
  '    [\'Tabbit Browser\', { edition: \'domestic\', channel: \'stable\' }],',
  ']);',
].join('\n')

/**
 * 把原始 detect.js 转成打过补丁的文本。
 * @param {string} source - 原始文件内容
 * @returns {{ text: string, changed: boolean, reason?: string }}
 */
export function applyRules(source) {
  if (source.includes(MARKER)) return { text: source, changed: false, reason: 'already-applied' }
  if (!source.includes(OLD_COMMIT)) return { text: source, changed: false, reason: 'anchor-miss:commit' }
  if (!source.includes(ANCHOR)) return { text: source, changed: false, reason: 'anchor-miss:helper' }
  let text = source.replace(ANCHOR, ANCHOR + '\n' + IDENTITY_HELPER)
  text = text.replace(OLD_COMMIT, NEW_COMMIT)
  if (!text.includes(MARKER)) return { text: source, changed: false, reason: 'self-check-failed' }
  if (text.includes("WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '');\n        if (!identity)")) {
    return { text: source, changed: false, reason: 'self-check-failed:commit' }
  }
  return { text, changed: true }
}

/**
 * 把打过补丁的文本还原成原始内容。
 * @param {string} source - 补丁后的文件内容
 * @returns {{ text: string, changed: boolean, reason?: string }}
 */
export function revertRules(source) {
  if (!source.includes(MARKER)) return { text: source, changed: false, reason: 'not-applied' }
  let text = source.replace(NEW_COMMIT, OLD_COMMIT)
  text = text.replace('\n' + IDENTITY_HELPER, '')
  if (text.includes(MARKER)) return { text: source, changed: false, reason: 'self-check-failed' }
  return { text, changed: true }
}
