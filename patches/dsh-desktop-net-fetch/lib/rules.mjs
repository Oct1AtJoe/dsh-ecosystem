/**
 * Rules for the dsh-desktop-net-fetch patch.
 *
 * The desktop shell forwards every non-asset `dsh-app://` request to the owned
 * Host from `forwardWebRequest` using the global `fetch`, which is Node's
 * undici client. undici enforces a connection-level `bodyTimeout` of 300_000ms
 * as an *idle* timer: every body chunk resets it, so a stream that simply has
 * nothing to say for five minutes is destroyed. Both long-lived SSE channels
 * (`/plugins/events` for HMR and per-plugin channels such as
 * `/plugins/dsh-status-rotator/events`) only write on a rebuild or status
 * change, so a quiet five minutes kills them, Chromium surfaces
 * `net::ERR_FAILED`, and `EventSource` reconnects forever. The connect
 * therefore flaps between "重新连接中" and "连接成功" during long turns.
 *
 * Electron's `net.fetch` runs on Chromium's own network stack, which is the
 * stack `protocol.handle` expects: no undici timers, correct stream bridging,
 * and it honours the system proxy. `net` is already imported by this file for
 * `connectDesktopWelcome`, so the change is one identifier.
 */

/** Unique symbol this patch introduces, used by verify to prove it applied. */
export const MARKER = 'net.fetch(target, init)';

const OLD = 'const response = await fetch(target, init);';

const NEW = [
  '// Chromium network stack, not Node undici: undici bites a silent SSE body',
  '// after its 300s idle bodyTimeout and EventSource then reconnects forever.',
  'const response = await net.fetch(target, init);',
].join('\n');

/**
 * Apply the forwarding rules to one source text.
 * @param source - Complete `lib/main.js` text.
 * @returns Patched text, unchanged when the anchor is already rewritten.
 */
export function applyRules(source) {
  if (source.includes(MARKER)) return source;
  if (!source.includes(OLD)) throw new Error('net-fetch: anchor not found; upstream changed forwardWebRequest');
  return source.replace(OLD, NEW);
}

/**
 * Restore the original forwarding call.
 * @param source - Complete `lib/main.js` text.
 * @returns Reverted text, unchanged when the patch is absent.
 */
export function revertRules(source) {
  if (!source.includes(MARKER)) return source;
  return source.replace(NEW, OLD);
}
