/**
 * 产物级校验：桌宠窗口补丁是否完整落地。
 *
 * 只读真实文件，不改任何东西。任一断言失败即 exit 1。
 * 用法：node verify.mjs [--app-dir E:\dshDesktop]
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { writeFileSync } from 'node:fs'
import { PATCH_MARK, TARGET, UNPACKED_DIR, PRELOAD_NAME, PRELOAD_SOURCE } from './lib/rules.mjs'

const args = process.argv.slice(2)
const argValue = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const APP_DIR = argValue('--app-dir', 'E:\\dshDesktop')
const TARGET_DISK = join(APP_DIR, 'resources', UNPACKED_DIR, ...TARGET.split('/'))
const PRELOAD_DISK = join(dirname(TARGET_DISK), PRELOAD_NAME)

const checks = []
const check = (name, fn) => {
  try {
    const detail = fn()
    checks.push({ name, ok: true, detail })
  } catch (error) {
    checks.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) })
  }
}
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const source = existsSync(TARGET_DISK) ? readFileSync(TARGET_DISK, 'utf8') : ''

check('main.js 存在（desktop-menu 已解包）', () => {
  assert(existsSync(TARGET_DISK), `${TARGET_DISK} 不存在`)
  return TARGET_DISK
})

check('补丁标记在首行', () => {
  assert(source.includes(PATCH_MARK), '缺少补丁标记')
  return PATCH_MARK
})

check('screen 已从 electron 导入', () => {
  assert(/import \{[^}]*\bscreen\b[^}]*\} from "electron"/.test(source), 'import 列表缺少 screen')
  return 'screen imported'
})

check('宠物窗口安装在 main() 内', () => {
  assert(source.includes('installKanyePetWindow(() => mainWindow);'), '缺少安装调用')
  return 'installKanyePetWindow wired'
})

check('窗口工厂存在', () => {
  assert(source.includes('function installKanyePetWindow(getMainWindow)'), '缺少窗口工厂')
  return 'factory present'
})

check('窗口属性完整', () => {
  for (const [needle, label] of [
    ['frame: false', 'frame:false'],
    ['transparent: true', 'transparent:true'],
    ['hasShadow: false', 'hasShadow:false'],
    ['alwaysOnTop: true', 'alwaysOnTop'],
    ['skipTaskbar: true', 'skipTaskbar'],
    ['backgroundThrottling: false', 'backgroundThrottling:false'],
  ]) {
    assert(source.includes(needle), `缺少 ${label}`)
  }
  return '6/6 属性'
})

check('宠物页指向插件 Host 路由', () => {
  assert(source.includes('"dsh-app://app/kanye-pet/window"'), 'PET_URL 不是插件 Host 路由')
  return 'dsh-app://app/kanye-pet/window'
})

check('五个 IPC 全部注册', () => {
  for (const channel of ['set-position', 'set-size', 'set-visible', 'show-main', 'open-session']) {
    assert(source.includes(`"dsh-pet:${channel}"`), `缺少 ${channel}`)
  }
  return '5/5'
})

check('IPC 有 sender 校验', () => {
  const guards = (source.match(/kanye-pet: rejected IPC from an unowned renderer/g) ?? []).length
  assert(guards >= 5, `sender 守卫只有 ${guards} 处（应为 5）`)
  return `${guards} guards`
})

check('会话跳转派发 dsh:open-session', () => {
  assert(source.includes("CustomEvent('dsh:open-session'"), '缺少 CustomEvent 派发')
  return 'open-session event'
})

check('位置持久化路径正确', () => {
  assert(source.includes('"pet-window.json"'), '缺少位置文件')
  assert(source.includes('screen.getAllDisplays()'), '缺少屏幕边界校验')
  return 'userData/pet-window.json'
})

check('显隐走 hide/show 而非 0×0', () => {
  assert(source.includes('petWindow.hide()'), '缺少 hide()')
  assert(source.includes('petWindow.showInactive()'), '缺少 showInactive()')
  assert(!source.includes('value: { Logical: { width: 0'), '仍残留 0×0 缩窗逻辑')
  return 'hide/show'
})

check('加载失败自愈（503 是正常导航，必须探 DOM）', () => {
  // 503 会让 loadURL resolve、did-fail-load 不触发 —— 判据只能是加载完的 DOM。
  assert(source.includes("document.getElementById('pet')"), '缺少 DOM 探测判据')
  assert(source.includes('setTimeout(loadPetPage'), '缺少重试')
  return 'DOM probe retry'
})

check('显隐权威在页面（不在 did-finish-load）', () => {
  assert(!source.includes('"did-finish-load", () => {\n\t\t\tif (petWindow !== void 0 && !petWindow.isDestroyed()) petWindow.showInactive()'),
    '仍在 did-finish-load 里 show（503 时会闪空白窗）')
  assert(source.includes('petWindow.showInactive();'), '缺少 showInactive')
  return 'page owns visibility'
})

check('preload-pet.cjs 存在且内容完整', () => {
  assert(existsSync(PRELOAD_DISK), `${PRELOAD_DISK} 不存在`)
  const preload = readFileSync(PRELOAD_DISK, 'utf8')
  assert(preload === PRELOAD_SOURCE, 'preload 内容与规则文件不一致（可能被手改）')
  for (const api of ['setPosition', 'setSize', 'setVisible', 'showMain', 'openSession']) {
    assert(preload.includes(api), `preload 缺少 ${api}`)
  }
  return '5/5 API'
})

check('main.js 语法可解析', () => {
  const probe = join(tmpdir(), `dsh-verify-pet-${Date.now()}.mjs`)
  writeFileSync(probe, source, 'utf8')
  execFileSync(process.execPath, ['--check', probe], { stdio: 'pipe' })
  return 'syntax ok'
})

check('setSize 先写期望尺寸再改窗口（防 resize 守卫回滚）', () => {
  // 顺序反了就会被 resize 守卫按旧 desiredSize 回滚：日志实证 req=130x221 after=150x255
  const assignAt = source.indexOf('desiredSize = requested;')
  const setSizeAt = source.indexOf('petWindow.setSize(requested.width, requested.height);')
  assert(assignAt > -1, '缺少 desiredSize = requested 竞态修复')
  assert(setSizeAt > -1, '缺少 setSize(requested…) 调用')
  assert(assignAt < setSizeAt, 'desiredSize 必须在 setSize 之前赋值')
  return 'desiredSize-first'
})

check('宠物页不再调用 Tauri API（负向对照）', () => {
  // 前端已迁到插件 assets；这里只对本补丁能看到的范围做负向断言：
  // 补丁注入的代码里不得出现任何 __TAURI 残留。
  assert(!source.includes('__TAURI_INTERNALS__'), 'main.js 里出现 __TAURI_INTERNALS__ 残留')
  return 'no tauri'
})

const failed = checks.filter((c) => !c.ok)
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}${c.ok ? '' : `\n    ${c.detail}`}`)
}
console.log(`\n${checks.length - failed.length}/${checks.length} 通过`)
process.exit(failed.length === 0 ? 0 : 1)
