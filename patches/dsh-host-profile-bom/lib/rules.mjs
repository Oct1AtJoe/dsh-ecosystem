/**
 * Rules for the dsh-host-profile-bom patch.
 *
 * 症状：桌面端启动弹「DeepSeek Harness is unavailable」，但**不是**认证问题。
 * 宿主诊断里才有真话：
 *
 *   SyntaxError: Unexpected token '﻿', "﻿{ "name"... is not valid JSON
 *     at readPackageManifest (…/dsh-app-boot/lib/index.js:709)
 *     at readOptionalProfileManifest (…:843)
 *     at createRuntimeResolution (…:769)
 *
 * 根因：`dsh-app-boot` 里有多处 `JSON.parse(readFileSync(path, "utf8"))`。
 * Node 的 utf8 解码**不剥离 BOM**，开头那个 U+FEFF 让 JSON.parse 直接抛。
 * 崩在遍历依赖图的第一站，Host 起不来，壳层只报「启动失败」。
 *
 * BOM 从哪来：Windows PowerShell 5.1 的 `Set-Content -Encoding utf8` 默认写 BOM，
 * 改写 profile 清单 / 插件清单时容易带上。本机 2026-11-02 把
 * `dsh-prompt-history` 从 `link:` 换成 `1.9.0` 时实测触发。
 *
 * 为什么改读取层而不是逐个改解析点：该文件里裸 `JSON.parse(readFileSync(...))`
 * 有 10 处，逐个 patch 啰嗦且脆弱。本补丁把 `fs.readFileSync` 换成「剥 BOM 版本」，
 * **一次覆盖全部读取点**；上游日后新增读取点也自动受保护。
 *
 * 可逆性设计：ESM 具名导入是只读绑定，不能重新赋值，所以补丁把每个裸
 * `readFileSync(` 调用改写成 `fs.readFileSync(`。为了让 revert 能**精确**区分
 * 「本补丁改出来的」与「原文件自带的」，改写用的名字是显式的
 * {@link REWRITTEN_CALL}（`fs.readFileSync`），而原文件里自带的命名空间调用
 * 在 apply 时会先被占位符保护、结束时原样还原 —— 因此 revert 只需把
 * `fs.readFileSync(` 全部还原即可，无需任何启发式猜测。
 */

/** 本补丁独有的符号，verify 用它判据。 */
export const MARKER = '__dshBomProofReadFile'

/** 目标文件（相对 asar 根）。 */
export const TARGET = 'dsh/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js'

/** 锚点：fs 的具名导入行。注入块紧跟在它后面。 */
export const ANCHOR = 'import fs, { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";'

/**
 * 注入块。
 *  - `fs.readFileSync` 被整体替换，故所有经它读取的调用点都受保护。
 *  - 原始实现先存进闭包，避免包装函数自我递归。
 *  - 只处理字符串结果；Buffer / fd 形态原样透传，不改变既有语义。
 */
export const INJECT = [
  '',
  '//#region dsh-ecosystem profile-bom',
  '/** 剥掉 UTF-8 BOM：Node 的 utf8 解码不剥，JSON.parse 会直接抛。 */',
  'function __dshStripBom(value) {',
  '\tif (typeof value !== "string" || value.charCodeAt(0) !== 0xfeff) return value;',
  '\treturn value.slice(1);',
  '}',
  '/** 剥 BOM 后的 readFileSync。原始实现先存进闭包，避免自我递归。 */',
  'const __dshOriginalReadFile = fs.readFileSync;',
  'function __dshBomProofReadFile(path, options) {',
  '\treturn __dshStripBom(__dshOriginalReadFile(path, options));',
  '}',
  'fs.__dshBomRead = __dshBomProofReadFile;',
  'fs.readFileSync = __dshBomProofReadFile;',
  '//#endregion',
].join('\n')

/** 裸 `readFileSync(` 调用点（排除属性访问）。 */
const BARE_CALL = /(?<![\w.$])readFileSync\(/gu
/** 原文件自带的命名空间 `fs.readFileSync(` 调用点。 */
const NAMESPACE_CALL = /(?<![\w.$])fs\.readFileSync\(/gu

/**
 * 本补丁改写后的调用形态：显式命名空间 **加独有后缀**，
 * 使 revert 能把它与「原文件自带的 fs.readFileSync(」精确区分。
 */
const REWRITTEN_CALL = 'fs.__dshBomRead('
/** 还原时只认这种独有形态。 */
const REWRITTEN_CALL_PATTERN = /(?<![\w.$])fs\.__dshBomRead\(/gu

/**
 * 该行是否是不该被改写的定义行（导入语句）。
 * @param text - 正在变换的完整文本。
 * @param offset - 匹配起点。
 * @returns true 表示保持原样。
 */
function isDefinitionLine(text, offset) {
  const lineStart = text.lastIndexOf('\n', offset) + 1
  const lineEnd = text.indexOf('\n', offset)
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)
  return line.includes('from "node:fs"')
}

/**
 * 把 BOM 容忍注入应用到一份源码上。
 * @param source - 完整的 `dsh-app-boot/lib/index.js` 文本。
 * @returns 打补丁后的文本；已打过则原样返回。
 */
export function applyRules(source) {
  if (source.includes(MARKER)) return source
  const hits = source.split(ANCHOR).length - 1
  if (hits !== 1) {
    throw new Error(`profile-bom: fs import anchor matched ${String(hits)} times, expected 1; upstream changed the imports`)
  }
  const withInject = source.replace(ANCHOR, `${ANCHOR}${INJECT}`)
  return withInject.replace(BARE_CALL, (match, offset) => (isDefinitionLine(withInject, offset) ? match : REWRITTEN_CALL))
}

/**
 * 还原官方实现。
 *
 * 只把 {@link REWRITTEN_CALL} 这一独有形态还原成裸调用，原文件自带的
 * `fs.readFileSync(` 从头到尾没被碰过，因此逐字节可逆，无需任何启发式。
 * @param source - 完整的 `dsh-app-boot/lib/index.js` 文本。
 * @returns 撤回后的文本；补丁不存在则原样返回。
 */
export function revertRules(source) {
  if (!source.includes(MARKER)) return source
  const withoutInject = source.replace(INJECT, '')
  return withoutInject.replace(REWRITTEN_CALL_PATTERN, 'readFileSync(')
}
