/**
 * 桌面端菜单补丁的注入规则：唯一的真值来源，被 patch / verify / revert 共用。
 *
 * 设计约束（实测得出，勿改）：
 * - lib/main.js 在 asar 数据区后面紧贴 lib/preload-app.cjs，间隙为 0，无法原地扩展；
 * - 因此改为把 lib/main.js 标为 unpacked，正文写到 app.asar.unpacked/lib/main.js，
 *   asar 内其余条目 offset 全部不变，只需重写头部 JSON（等长填充）。
 * - Electron fuse `EnableEmbeddedAsarIntegrityValidation` 实测为 0（关闭），
 *   改 asar 不会触发完整性校验失败。
 */

/** 补丁标识：写进文件首行，用于幂等判断与版本追溯。 */
export const PATCH_MARK = '/* dsh-ecosystem:desktop-menu v1 */'

/** 每个替换都必须命中且仅命中一次，否则整体拒绝写入。 */
export const REPLACEMENTS = [
  {
    name: 'application-menu',
    why: '把开发态才显示的两项提为常驻，并换成硬刷新与整端重启',
    find: `\t\t...development ? [
\t\t\t{ type: "separator" },
\t\t\t{
\t\t\t\tlabel: currentDesktopLocale().messages.reloadPageMenu,
\t\t\t\trole: "reload"
\t\t\t},
\t\t\t{
\t\t\t\tlabel: currentDesktopLocale().messages.restartAppHostMenu,
\t\t\t\tclick: () => {
\t\t\t\t\tif (quitting) return;
\t\t\t\t\tapp.relaunch();
\t\t\t\t\tquitWithoutConfirmation();
\t\t\t\t}
\t\t\t}
\t\t] : [],`,
    replace: `\t\t{ type: "separator" },
\t\t{ label: currentDesktopLocale().messages.reloadPageMenu, click: () => { if (mainWindow) mainWindow.webContents.reloadIgnoringCache(); } },
\t\t{ label: currentDesktopLocale().messages.restartAppHostMenu, click: () => { if (quitting) return; app.relaunch(); quitWithoutConfirmation(); } },`,
  },
  {
    name: 'tray-menu',
    why: '托盘右键在「打开」与「退出」之间补上刷新与重启',
    find: `\t\t\t{
\t\t\t\tlabel: messages.quitApplication,
\t\t\t\tclick: () => {
\t\t\t\t\tthis.options.quit();
\t\t\t\t}
\t\t\t}
\t\t]));`,
    replace: `\t\t\t{ type: "separator" },
\t\t\t{ label: messages.reloadPageMenu, click: () => { this.options.reload(); } },
\t\t\t{ label: messages.restartAppHostMenu, click: () => { this.options.restart(); } },
\t\t\t{ type: "separator" },
\t\t\t{ label: messages.quitApplication, click: () => { this.options.quit(); } }
\t\t]));`,
  },
  {
    name: 'tray-options-wiring',
    why: 'DesktopTray 在模块顶层拿不到 mainWindow，由 main() 注入两个动作',
    find: `\t\t\topen: () => {
\t\t\t\tfocusPrimaryWindow();
\t\t\t},
\t\t\tquit: () => {
\t\t\t\tapp.quit();
\t\t\t}`,
    replace: `\t\t\topen: () => {
\t\t\t\tfocusPrimaryWindow();
\t\t\t},
\t\t\treload: () => {
\t\t\t\tif (mainWindow) mainWindow.webContents.reloadIgnoringCache();
\t\t\t},
\t\t\trestart: () => {
\t\t\t\tif (quitting) return;
\t\t\t\tapp.relaunch();
\t\t\t\tquitWithoutConfirmation();
\t\t\t},
\t\t\tquit: () => {
\t\t\t\tapp.quit();
\t\t\t}`,
  },
  {
    name: 'locale-en',
    why: '「重启应用与 Host」收敛为「重启应用」',
    find: `restartAppHostMenu: "Restart App and Host",`,
    replace: `restartAppHostMenu: "Restart App",`,
  },
  {
    name: 'locale-zh',
    why: '同上，中文文案',
    find: `restartAppHostMenu: "重启应用与 Host",`,
    replace: `restartAppHostMenu: "重启应用",`,
  },
]

/** 归档内路径与 unpacked 落盘路径。 */
export const TARGET = 'lib/main.js'
export const UNPACKED_DIR = 'app.asar.unpacked'

/** 对源码文本应用全部替换；任一锚点不唯一即抛错。 */
export function applyReplacements(source) {
  let out = source
  const applied = []
  for (const rule of REPLACEMENTS) {
    const hits = out.split(rule.find).length - 1
    if (hits !== 1) {
      throw new Error(`锚点「${rule.name}」命中 ${hits} 次（应为 1 次）。官方版本可能已变动，拒绝写入。`)
    }
    const parts = out.split(rule.find)
    out = parts[0] + rule.replace + parts[1]
    applied.push(rule.name)
  }
  return { text: out, applied }
}
