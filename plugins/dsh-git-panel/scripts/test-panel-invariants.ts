/**
 * Git 面板两个已修缺陷的防回退自检。
 *
 * 1. 变更分组整体限高（原 `max-height:110px` + 整块 overflow-y:auto）：
 *    已暂存文件一多就把未暂存整组挤出视野。现改为两组各占一半、各自内部滚动。
 * 2. 模型降级记录残留：执行其他操作后，旧报错仍挂在成功提示下方。
 *    现由 pendingOp 变化触发清理。
 *
 * 这两处都是「改了容易、回退也容易」的样式/时序细节，用源文件不变量锁住，
 * 避免后续调整布局时把修复悄悄推翻。
 *
 * 运行：npx esbuild scripts/test-panel-invariants.ts --bundle --platform=node --format=esm | node --input-type=module
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

// 经 esbuild 打包后 import.meta.url 指向临时产物，因此按 cwd 解析。
// 本脚本约定从插件根目录运行（与其他 test-*.ts 一致）。
const root = process.cwd()
const src = readFileSync(join(root, 'src/client/Panel.tsx'), 'utf8')
const i18nSrc = readFileSync(join(root, 'src/client/i18n.ts'), 'utf8')

// ---- 1. 变更分组布局健康度 ----
check(
  '不再有 .dsh-gp-changes-groups 的 110px 整体限高',
  !/has-diff \.dsh-gp-changes-groups\s*\{[^}]*max-height:110px/u.test(src),
)
check(
  '变更列表各自独立限高滚动（防止互相挤出且绝不发生 flex 0 高度塌陷）',
  /\.dsh-gp-changes-list\s*\{[^}]*max-height:130px;\s*overflow-y:auto/u.test(src),
)

// ---- 2. 严禁后台高频轮询打崩宿主 ----
check(
  '面板内部严禁存在 3.5s 的高频无休止轮询定时器',
  !/setInterval\([^)]*3500\)/u.test(src),
)
check(
  '请求防重入并发锁已就位',
  src.includes('loadInFlightRef') && src.includes('statusInFlightRef') && src.includes('stashInFlightRef'),
)

// ---- 3. 降级记录必须被后续操作清理 ----
check(
  '降级记录由 pendingOp 变化触发清理',
  /useEffect\(\(\) => \{\s*if \(pendingOp !== null\) setFallbackNotes\(\[\]\)/u.test(src),
)
check(
  '清理逻辑不在 setMessage 内（会冲掉生成中刚收集的记录）',
  !/const setMessage[\s\S]{0,400}?setFallbackNotes\(\[\]\)/u.test(src),
)
check(
  '生成开始时也会重置降级记录',
  /const generateMessage[\s\S]{0,600}?setFallbackNotes\(\[\]\)/u.test(src),
)

// ---- 3. 红字不得复述明细（改由黄字逐条承载） ----
check(
  '全部失败的红字为通用总结、不含数量占位',
  /'write\.commit\.allFailed':\s*'[^'{]*'/u.test(i18nSrc),
)

console.log('\nGit 面板不变量自检完成。')
