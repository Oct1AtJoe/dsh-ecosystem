/**
 * v7 残留门禁（确定性版）：逐条列出旧名命中，并按「可解释的红线」分类。
 *
 * 判据用**行内容特征**而不是正则白名单堆砌，避免白名单自身出错。
 * 三条硬规则：
 *   1. 命中行是注释（// * #）→ 红线（文档/说明）
 *   2. 命中行是 cordis loader 条目的 `- id:` → 红线
 *   3. 命中行是 ROUTE_PREFIX / NS / SETTINGS_NS / STYLE_ID / list 槽 id / DOM 属性 → 红线
 *   4. 命中在 lib/client.js（已构建产物）且属于上述三类 → 红线（就是源码的拷贝）
 *   5. 其余一律算意外
 * 整文件豁免：历史文档、迁移脚本、门禁脚本自身。
 */
import fs from 'node:fs'
import path from 'node:path'

const REPO = 'C:/dsh-ecosystem'

const OLD = [
  '@deepseek-ai/dsh-client-ui-kanye-pet',
  '@deepseek-ai/dsh-client-ui-theme-custom',
  '@deepseek-ai/dsh-client-ui-queue-recall',
  '@deepseek-ai/dsh-client-ui-resend-failed-round',
  '@deepseek-ai/dsh-client-ui-subagent-custom',
  '@deepseek-ai/dsh-client-ui-deliverables-custom',
  '@deepseek-ai/dsh-kanye-pet',
  'dsh-session-title-custom',
  'dsh-session-folders-custom',
  'dsh-file-upload-custom',
]

const EXEMPT = [
  /^plugins\/session-title\/PLAN\.md$/,      // 历史设计文档
  /^scripts\/(?:migrate-profile-v7\.ps1|rename-v7-verify\.mjs|verify-profile-v7\.mjs)$/,
  /^README\.md$/,
  /^另一台电脑安装指南\.md$/,
]

/** 红线判据：返回原因字符串，null = 意外残留 */
function redLineReason(line) {
  const t = line.trim()
  if (/^(\/\/|\*|#|<!--)/.test(t)) return '注释/文档'
  if (/^-\s*id:\s*['"]?\S/.test(t)) return 'cordis loader 条目 id'
  if (/^["']?id['"]?\s*:\s*['"]/.test(t) && /@deepseek-ai\//.test(t)) return 'list 槽注册 id'
  if (/\b(?:ROUTE_PREFIX|SETTINGS_NS|NS|STYLE_ID|VIEW_PERSIST_KEY|POS_KEY)\b\s*=/.test(t)) return '契约常量'
  if (/data-dsh-session-folders-custom/.test(t)) return 'DOM/CSS 属性'
  if (/ctx\.locale\.register|tag\.dataset\.plugin/.test(t)) return '诊断标记'
  if (/localStorage/.test(t)) return 'localStorage 键'
  return null
}

function walk(dir, skip = ['node_modules', '.git', 'dist-tarballs', 'recovery', 'archive', '.workbuddy', '.agent-teams']) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p, skip))
    else out.push(p)
  }
  return out
}

const TEXT = /\.(md|mjs|js|ts|tsx|json|yml|yaml|ps1)$/
const byReason = new Map()
const unexpected = []

for (const abs of walk(REPO)) {
  const rel = path.relative(REPO, abs).replace(/\\/g, '/')
  if (!TEXT.test(rel) || rel.endsWith('.map')) continue
  if (rel.startsWith('docs/')) continue
  if (rel.endsWith('pnpm-lock.yaml') || rel.endsWith('package-lock.json')) continue
  if (EXEMPT.some((re) => re.test(rel))) continue

  fs.readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
    const hit = OLD.find((n) => line.includes(n))
    if (hit === undefined) return
    const why = redLineReason(line)
    const entry = `${rel}:${i + 1}  ${line.trim().slice(0, 140)}`
    if (why === null) unexpected.push(entry)
    else {
      if (!byReason.has(why)) byReason.set(why, [])
      byReason.get(why).push(entry)
    }
  })
}

console.log('=== 红线命中（受保护，按类别） ===')
for (const [why, list] of [...byReason].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n[${why}]  ${list.length} 条`)
  for (const l of list) console.log('  ' + l)
}

console.log(`\n=== 意外残留（必须为 0）：${unexpected.length} ===`)
for (const l of unexpected) console.log('  ' + l)
process.exitCode = unexpected.length === 0 ? 0 : 1
