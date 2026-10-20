/**
 * 校验桌面端菜单补丁是否完整生效。
 * 判据全部落在产物上：asar 头条目、unpacked 正文、语法、以及两项菜单的运行时接线。
 *
 * 用法：node verify.mjs [--app-dir E:\dshDesktop]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { openArchive, readHeader, entryAt } from './lib/asar.mjs'
import { PATCH_MARK, TARGET, UNPACKED_DIR, REPLACEMENTS } from './lib/rules.mjs'

const args = process.argv.slice(2)
const i = args.indexOf('--app-dir')
const APP_DIR = i === -1 ? 'E:\\dshDesktop' : args[i + 1]
const ASAR = join(APP_DIR, 'resources', 'app.asar')
const TARGET_DISK = join(APP_DIR, 'resources', UNPACKED_DIR, ...TARGET.split('/'))

const checks = []
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

// ── 1. asar 头条目 ──
const archive = openArchive(ASAR, { readOnly: true })
let entry
try {
  const header = readHeader(archive.fd)
  entry = entryAt(header.json, TARGET)
} finally {
  archive.close()
}
check('asar 内存在 lib/main.js 条目', entry !== undefined)
check('该条目已标记 unpacked', entry?.unpacked === true, entry?.unpacked === true ? '' : `unpacked=${entry?.unpacked}`)

// ── 2. unpacked 正文 ──
check('unpacked 正文文件存在', existsSync(TARGET_DISK), TARGET_DISK)
const body = existsSync(TARGET_DISK) ? readFileSync(TARGET_DISK) : Buffer.alloc(0)
check('正文带补丁标识', body.toString('utf8', 0, 200).includes(PATCH_MARK))
check('条目 size 与磁盘文件一致', entry?.size === body.length, `entry=${entry?.size} disk=${body.length}`)
const hash = createHash('sha256').update(body).digest('hex')
check('条目 integrity 哈希与磁盘文件一致', entry?.integrity?.hash === hash,
  entry?.integrity?.hash === hash ? '' : `entry=${entry?.integrity?.hash?.slice(0, 12)} disk=${hash.slice(0, 12)}`)

// ── 3. 语法 ──
const text = body.toString('utf8')
const probe = join(tmpdir(), `dsh-verify-${Date.now()}.mjs`)
writeFileSync(probe, text, 'utf8')
let syntaxOk = true
try {
  execFileSync(process.execPath, ['--check', probe], { stdio: 'pipe' })
} catch {
  syntaxOk = false
}
check('注入后语法通过 node --check', syntaxOk)

// ── 4. 每处替换都已落地（正向） ──
for (const rule of REPLACEMENTS) {
  const present = text.includes(rule.replace)
  const stale = text.includes(rule.find)
  check(`替换「${rule.name}」已生效`, present && !stale, present ? (stale ? '旧锚点仍在' : '') : '未见新内容')
}

// ── 5. 行为接线（负向对照：确认没有退化成开发态专属或普通刷新） ──
check('应用菜单不再受 development 条件包裹',
  !text.includes('...development ? [\n\t\t\t{ type: "separator" },\n\t\t\t{\n\t\t\t\tlabel: currentDesktopLocale().messages.reloadPageMenu'))
check('刷新走 reloadIgnoringCache（非 role: reload）',
  text.includes('reloadIgnoringCache') && !text.includes('label: currentDesktopLocale().messages.reloadPageMenu,\n\t\t\t\trole: "reload"'))
check('托盘注入 reload 动作', text.includes('reload: () => {'))
check('托盘注入 restart 动作', text.includes('restart: () => {'))
check('重启走 app.relaunch + quitWithoutConfirmation',
  text.includes('app.relaunch();\n\t\t\t\tquitWithoutConfirmation();') || text.includes('app.relaunch(); quitWithoutConfirmation();'))

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} 项通过`)
if (failed.length > 0) {
  console.error('\n未通过项：')
  for (const f of failed) console.error(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`)
  process.exit(1)
}
