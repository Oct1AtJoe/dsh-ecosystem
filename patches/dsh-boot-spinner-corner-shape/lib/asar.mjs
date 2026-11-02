/**
 * 最小 asar 读写工具：只做本补丁需要的两件事。
 *
 * 为什么不用 @electron/asar：本机没有该依赖，且我们不需要解包 183MB 全量内容。
 * asar 布局 = 16 字节 pickle 头（含 4 字节 JSON 长度）+ JSON 头 + 数据区。
 */
import { openSync, readSync, writeSync, closeSync, statSync } from 'node:fs'

const HEADER_PROBE = 16

/** 读取 asar 的 16 字节头，返回 JSON 头长度与数据区起点。 */
export function readHeaderSizes(fd) {
  const buf = Buffer.alloc(HEADER_PROBE)
  readSync(fd, buf, 0, HEADER_PROBE, 0)
  const jsonLength = buf.readUInt32LE(12)
  return { jsonLength, dataStart: HEADER_PROBE + jsonLength }
}

/** 读取并解析 asar 的 JSON 头（原文一并返回，用于逐字节还原）。 */
export function readHeader(fd) {
  const { jsonLength, dataStart } = readHeaderSizes(fd)
  const raw = Buffer.alloc(jsonLength)
  readSync(fd, raw, 0, jsonLength, HEADER_PROBE)
  return { raw, jsonLength, dataStart, json: JSON.parse(raw.toString('utf8').replace(/\0+$/, '')) }
}

/**
 * 按路径取 header 里的条目。
 * @param json - 已解析的 header
 * @param path - 以 `/` 分隔的归档内路径
 */
export function entryAt(json, path) {
  let node = json
  for (const segment of path.split('/')) {
    node = node?.files?.[segment]
    if (node === undefined) return undefined
  }
  return node
}

/** 取归档内文件的绝对字节区间（仅对已打包、非 unpacked 条目有意义）。 */
export function packedRange(entry, dataStart) {
  return { start: dataStart + Number(entry.offset), length: entry.size }
}

/** 从归档里读出已打包文件的完整内容。 */
export function readPacked(fd, entry, dataStart) {
  const { start, length } = packedRange(entry, dataStart)
  const buf = Buffer.alloc(length)
  readSync(fd, buf, 0, length, start)
  return buf
}

/**
 * 把 JSON 头写回 asar，长度必须与原始一致（否则数据区会整体错位）。
 * 不足部分用空格填充：JSON 解析器允许尾随空白，且 ASCII 空格不改变字节长度。
 */
export function writeHeaderInPlace(fd, json, jsonLength) {
  const compact = Buffer.from(JSON.stringify(json), 'utf8')
  if (compact.length > jsonLength) {
    throw new Error(`header grew ${compact.length - jsonLength} bytes; refusing to shift the data area`)
  }
  const padded = Buffer.concat([compact, Buffer.alloc(jsonLength - compact.length, 0x20)])
  writeSync(fd, padded, 0, padded.length, HEADER_PROBE)
  return { written: padded.length, slack: jsonLength - compact.length }
}

/** 打开 asar 供读写；文件被占用时给出可操作的报错。 */
export function openArchive(path, { readOnly = false } = {}) {
  try {
    const fd = openSync(path, readOnly ? 'r' : 'r+')
    return { fd, size: statSync(path).size, close: () => closeSync(fd) }
  } catch (error) {
    if (error?.code === 'EBUSY' || error?.code === 'EPERM' || error?.code === 'EACCES') {
      throw new Error(`无法写入 ${path}：DSH 桌面端仍在运行。请先从托盘退出应用再重试。`)
    }
    throw error
  }
}
