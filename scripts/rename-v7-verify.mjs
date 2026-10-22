/**
 * G1/G3 精确门禁：只查「我们自己那 10 个旧包名」作为完整标识串的残留，
 * 并把命中按「预期红线」与「意外残留」分类。
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

/** 允许残留的判据：整行命中这些模式才算「预期的红线」 */
const EXPECTED = [
  /ROUTE_PREFIX\s*=/,                 // 路由前缀
  /const NS\s*=/,                     // locale NS
  /SETTINGS_NS\s*=/,                  // settings 命名空间
  /VIEW_PERSIST_KEY|POS_KEY/,         // 持久化键
  /STYLE_ID\s*=/,                     // style 标签 id
  /tag\.dataset\.plugin/,             // data-plugin 标记
  /data-dsh-session-folders-custom/,  // DOM 属性
  /ctx\.locale\.register/,            // 字典注册
  /id:\s*'@deepseek-ai\/dsh-client-ui-/,  // §3.3 list 槽注册 id
  /localStorage/,                     // localStorage 键
]

function walk(dir, skip = ['node_modules', '.git', 'dist-tarballs']) {
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
const expected = []
const unexpected = []

for (const abs of walk(REPO)) {
  const rel = path.relative(REPO, abs).replace(/\\/g, '/')
  if (!TEXT.test(rel)) continue
  // 历史档案与锁文件按计划不改
  if (rel.startsWith('docs/')) continue
  if (rel.endsWith('pnpm-lock.yaml') || rel.endsWith('package-lock.json')) continue
  if (rel.endsWith('.map')) continue

  const lines = fs.readFileSync(abs, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const name of OLD) {
      if (!line.includes(name)) continue
      const bucket = EXPECTED.some((re) => re.test(line)) ? expected : unexpected
      bucket.push(`${rel}:${i + 1}  ${line.trim().slice(0, 150)}`)
      break
    }
  })
}

console.log(`=== 意外残留（必须清零）：${unexpected.length} ===`)
for (const l of unexpected) console.log('  ' + l)
console.log(`\n=== 预期红线（受保护，保留原值）：${expected.length} ===`)
for (const l of expected) console.log('  ' + l)
