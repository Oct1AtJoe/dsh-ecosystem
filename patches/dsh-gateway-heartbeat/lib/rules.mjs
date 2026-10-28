/**
 * 放宽网关 WebSocket 心跳的误杀阈值。
 *
 * 现象：桌面端跑长任务时，左下角偶发「重新连接中 → 连接成功」闪一下。
 *
 * 根因在 `@deepseek-ai/dsh-api-gateway` 的 `RemoteStreamMuxServer`：
 *
 * ```js
 * const missed = this.missedHeartbeats.get(socket)
 * if (missed >= MAX_MISSED_HEARTBEATS) { socket.terminate(); continue }
 * this.missedHeartbeats.set(socket, missed + 1)   // 每发一次 ping 就 +1
 * socket.ping()
 * ```
 *
 * `missed` 每次发 ping 都自增，只有收到 pong 才清零（`alive()`）。
 * `MAX_MISSED_HEARTBEATS = 2` 且间隔 2000ms，所以客户端 pong 只要晚到约 6 秒，
 * 服务端就 `terminate()`。Electron 的 pong 由 Chromium 网络进程自动回复，
 * 该进程同时在处理 SSE 与渲染负载时偶尔会慢一拍；被 terminate 后客户端只能看到
 * close code 1006（无 close 握手），ConnectionController 随即重连。
 *
 * 放大到 10：容错窗口从 6 秒变成 30 秒。仍能回收真正僵死的连接，
 * 但不再因一次网络进程抖动就杀掉健康连接。
 */

/** 补丁标识：写进文件首行，用于幂等判断与版本追溯。 */
export const PATCH_MARK = '/* dsh-ecosystem:gateway-heartbeat v1 */'

/** 归档内目标文件（相对 app.asar 根，以 / 分隔）。 */
export const TARGET = 'dsh/node_modules/@deepseek-ai/dsh-api-gateway/lib/types/stream-server.js'

/** 原值 -> 新值。 */
export const OLD = 'const MAX_MISSED_HEARTBEATS = 2;'
export const NEW = 'const MAX_MISSED_HEARTBEATS = 10;'

/**
 * 应用替换。命中次数必须恰好为 1，否则抛错拒绝写入。
 * @param source - 归档内的原始文件正文。
 * @returns 替换后的正文。
 */
export function applyRules(source) {
  const hits = source.split(OLD).length - 1
  if (hits !== 1) throw new Error(`gateway-heartbeat: expected 1 anchor, found ${hits}`)
  return source.replace(OLD, NEW)
}

/**
 * 还原替换。
 * @param source - 已打补丁的正文。
 * @returns 原始正文。
 */
export function revertRules(source) {
  const hits = source.split(NEW).length - 1
  if (hits !== 1) throw new Error(`gateway-heartbeat: expected 1 patched anchor, found ${hits}`)
  return source.replace(NEW, OLD)
}
