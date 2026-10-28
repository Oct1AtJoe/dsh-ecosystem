/**
 * Rules for the dsh-desktop-window-state patch.
 *
 * The shell creates the main window with a hard-coded 1280x820 size and no
 * position (lib/main.js createWindow), so every restart lands wherever Electron
 * defaults to. Nothing in the shell persists window bounds: desktop/settings.json
 * only carries an `updates` object and is read once per process.
 *
 * This patch adds one state file next to it, `desktop/window-state.json`, keeps
 * it current through debounced resize/move/maximize events plus a synchronous
 * write on close, and feeds the saved bounds back into `new BrowserWindow({...})`.
 *
 * Restored bounds are validated against the live display layout: a position that
 * no longer intersects any `workArea` (unplugged monitor, resolution change) is
 * dropped so the window cannot reopen off-screen. Negative coordinates stay valid
 * because displays left of / above the primary one use them.
 */

/** Unique symbol this patch introduces, used by verify to prove it applied. */
export const MARKER = 'persistWindowState(window)';

/** Anchor: the hard-coded main-window geometry. */
const ANCHOR_CREATE = [
  'function createWindow(preload, show = false, primary = false) {',
  '\tconst window = new BrowserWindow({',
  '\t\twidth: 1280,',
  '\t\theight: 820,',
].join('\n');

const NEW_CREATE = [
  'function createWindow(preload, show = false, primary = false) {',
  '\tconst savedWindowState = readWindowState();',
  '\tconst window = new BrowserWindow({',
  '\t\t...(savedWindowState?.bounds ?? { width: 1280, height: 820 }),',
].join('\n');

/** Anchor: end of createWindow, directly before main(). */
const ANCHOR_RETURN = [
  '\t});',
  '\treturn window;',
  '}',
  'async function main() {',
].join('\n');

const NEW_RETURN = [
  '\t});',
  '\tif (savedWindowState?.maximized === true) window.maximize();',
  '\treturn window;',
  '}',
  'async function main() {',
].join('\n');

/** Anchor: main-window event wiring. */
const ANCHOR_WIRE = [
  '\t\tconst window = createWindow(appPreload, false, true);',
  '\t\tmainWindow = window;',
].join('\n');

const NEW_WIRE = [
  '\t\tconst window = createWindow(appPreload, false, true);',
  '\t\tmainWindow = window;',
  '\t\tlet windowStateTimer;',
  '\t\tconst saveWindowState = () => {',
  '\t\t\tclearTimeout(windowStateTimer);',
  '\t\t\twindowStateTimer = setTimeout(() => {',
  '\t\t\t\tif (!window.isDestroyed()) persistWindowState(window);',
  '\t\t\t}, 500);',
  '\t\t};',
  '\t\tfor (const event of ["resize", "move", "maximize", "unmaximize"]) window.on(event, saveWindowState);',
].join('\n');

/** Anchor: the close handler, where the last state is flushed synchronously. */
const ANCHOR_CLOSE = [
  '\t\twindow.on("close", (event) => {',
  '\t\t\tif (quitting || shellInstallerOwnsQuit || sessionEnding) return;',
].join('\n');

const NEW_CLOSE = [
  '\t\twindow.on("close", (event) => {',
  '\t\t\tpersistWindowState(window);',
  '\t\t\tif (quitting || shellInstallerOwnsQuit || sessionEnding) return;',
].join('\n');

/** Helpers injected ahead of createWindow; every import they use is already top-level. */
const HELPERS = [
  '/** @returns the `desktop/window-state.json` path under Electron userData. */',
  'function windowStateFile() {',
  '\treturn join(app.getPath("userData"), "desktop", "window-state.json");',
  '}',
  '/**',
  '* Read the last saved bounds.',
  '* @returns Bounds plus the maximized flag, or undefined (defaults apply) when',
  '* missing, malformed, smaller than the minimum size, or off every display.',
  '*/',
  'function readWindowState() {',
  '\ttry {',
  '\t\tconst value = JSON.parse(readFileSync(windowStateFile(), "utf8"));',
  '\t\tif (typeof value !== "object" || value === null) return void 0;',
  '\t\tconst { x, y, width, height } = value;',
  '\t\tif (![x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n))) return void 0;',
  '\t\tif (width < 520 || height < 600) return void 0;',
  '\t\tconst onScreen = screen.getAllDisplays().some(({ workArea }) => x < workArea.x + workArea.width - 80 && x + width > workArea.x + 80 && y < workArea.y + workArea.height - 80 && y + height > workArea.y);',
  '\t\tif (!onScreen) return void 0;',
  '\t\treturn { bounds: { x, y, width, height }, maximized: value.maximized === true };',
  '\t} catch {',
  '\t\treturn void 0;',
  '\t}',
  '}',
  '/**',
  '* Persist the current window geometry. `getNormalBounds` keeps the restored',
  '* size while maximized, so the flag alone reproduces the prior state.',
  '* @param window - the main BrowserWindow.',
  '*/',
  'function persistWindowState(window) {',
  '\ttry {',
  '\t\tconst { x, y, width, height } = window.getNormalBounds();',
  '\t\tif (width < 520 || height < 600) return;',
  '\t\tmkdirSync(join(app.getPath("userData"), "desktop"), { recursive: true, mode: 448 });',
  '\t\tconst maximized = window.isMaximized();',
  '\t\twriteFileSync(windowStateFile(), JSON.stringify({ x, y, width, height, maximized }, null, 2) + "\\n", { mode: 384 });',
  '\t} catch (error) {',
  '\t\tconsole.warn("desktop window state: could not be saved", error);',
  '\t}',
  '}',
  '',
  ANCHOR_CREATE,
].join('\n');

const steps = [
  [ANCHOR_CREATE, NEW_CREATE],
  [ANCHOR_RETURN, NEW_RETURN],
  [ANCHOR_WIRE, NEW_WIRE],
  [ANCHOR_CLOSE, NEW_CLOSE],
];

/**
 * Apply the window-state rules to one source text.
 * @param source - Complete `lib/main.js` text.
 * @returns Patched text, unchanged when already applied.
 */
export function applyRules(source) {
  if (source.includes(MARKER)) return source;
  let next = source;
  if (!next.includes(HELPERS)) next = next.replace(ANCHOR_CREATE, HELPERS);
  for (const [anchor, replacement] of steps) {
    if (!next.includes(anchor)) throw new Error('window-state: anchor not found; upstream changed the shell entry');
    next = next.replace(anchor, replacement);
  }
  return next;
}

/**
 * Restore the original shell entry.
 * @param source - Complete `lib/main.js` text.
 * @returns Reverted text, unchanged when the patch is absent.
 */
export function revertRules(source) {
  if (!source.includes(MARKER)) return source;
  let next = source.replace(NEW_CREATE, ANCHOR_CREATE).replace(NEW_RETURN, ANCHOR_RETURN);
  for (const [anchor, replacement] of steps.slice(2).reverse()) next = next.replace(replacement, anchor);
  return next.replace(HELPERS, ANCHOR_CREATE);
}
