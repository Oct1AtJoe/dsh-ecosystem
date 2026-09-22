/**
 * 变更分组规则 + 行首状态徽章的自检。
 *
 * 覆盖点：
 * - 分组：` M`（X 位是空格）不得漏、`MM` 双组、未跟踪入 unstaged；
 * - **7 个冲突码全部单独成组**（UU AA UD UA DU AU DD）——上游原先只认前 4 个，
 *   `AU` / `UA` / `DD` 会同时漏进 staged 与 unstaged（实测），这是本次修的 bug；
 * - 徽章字母：未跟踪 → `U`、未暂存修改 → `M`，两者**必须不同**（用户要一眼分辨
 *   「新文件还没进 git」与「已有文件被改动」）；
 * - 未跟踪与已暂存的新增分别是 `U` / `A`，也不得撞车（`??` 不该被标成「新增」，
 *   它不暂存就不会进提交）；
 * - 冲突码全部映射为 `C`。
 *
 * 字母与文件树装饰同一套（changeBadgeOf 直接复用 statusLetter），因此这里也顺带
 * 锁定「同一个文件在面板与文件树同字母」的不变量。
 * 全部直接 import 真实实现，避免自检与实现漂移。
 */
import { changeBadgeOf, classifyChanges, type ChangeEntry } from '../src/client/change-groups.ts'

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

const has = (list: ChangeEntry[], file: string): boolean => list.some((x) => x.file === file)

// ---- classifyChanges 分组 ----
const c1 = classifyChanges([
  { code: ' M', file: 'a.ts' },   // 未暂存修改（X 位空格）
  { code: 'M ', file: 'b.ts' },   // 已暂存
  { code: '??', file: 'c.ts' },   // 未跟踪
  { code: 'UU', file: 'd.ts' },   // 冲突
])
check('未暂存修改（ M）计入 unstaged', has(c1.unstaged, 'a.ts'), JSON.stringify(c1.unstaged))
check('已暂存（M ）计入 staged', has(c1.staged, 'b.ts'), JSON.stringify(c1.staged))
check('未跟踪（??）计入 unstaged', has(c1.unstaged, 'c.ts'), JSON.stringify(c1.unstaged))
check('冲突（UU）计入 conflicts', c1.conflicts.length === 1, JSON.stringify(c1.conflicts))
check('冲突不进 staged', !has(c1.staged, 'd.ts'), JSON.stringify(c1.staged))
check('冲突不进 unstaged', !has(c1.unstaged, 'd.ts'), JSON.stringify(c1.unstaged))
check(' M 不进 staged（X 位是空格）', !has(c1.staged, 'a.ts'), JSON.stringify(c1.staged))

const c2 = classifyChanges([{ code: 'MM', file: 'x.ts' }])
check('MM 同时算已暂存与未暂存', c2.staged.length === 1 && c2.unstaged.length === 1, JSON.stringify(c2))

const c3 = classifyChanges([])
check('空清单三组皆空', c3.conflicts.length === 0 && c3.staged.length === 0 && c3.unstaged.length === 0)

// ---- 7 个冲突码全部单独成组（回归：原先只认 UU/AA/UD/DU 四个） ----
const CONFLICTS = ['UU', 'AA', 'UD', 'UA', 'DU', 'AU', 'DD']
for (const code of CONFLICTS) {
  const r = classifyChanges([{ code, file: 'x' }])
  const lone = r.conflicts.length === 1 && r.staged.length === 0 && r.unstaged.length === 0
  check(`冲突码 ${code} 单独成组`, lone, JSON.stringify(r))
}
// 混排：7 个冲突码一起，不得有任何一个漏进另外两组。
const allIn = classifyChanges(CONFLICTS.map((code, i) => ({ code, file: `f${i}.ts` })))
check('7 个冲突码混排全部入 conflicts', allIn.conflicts.length === 7 && allIn.staged.length === 0 && allIn.unstaged.length === 0,
  JSON.stringify(allIn))

// ---- 状态徽章字母 ----
check('未跟踪（??）→ U', changeBadgeOf('??') === 'U', changeBadgeOf('??'))
check('未暂存修改（ M）→ M', changeBadgeOf(' M') === 'M', changeBadgeOf(' M'))
check('已暂存修改（M ）→ M', changeBadgeOf('M ') === 'M', changeBadgeOf('M '))
// 核心不变量：新文件与已修改文件的字母必须不同，否则界面无从区分。
check('U 与 M 不同（区分未跟踪 / 已修改）', changeBadgeOf('??') !== changeBadgeOf(' M'))
// 未跟踪不得被标成「新增」：?? 不暂存就不会进提交，A 表示已在 index。
check('未跟踪（??）≠ 新增（A ）', changeBadgeOf('??') !== changeBadgeOf('A '))
check('已暂存新增（A ）→ A', changeBadgeOf('A ') === 'A', changeBadgeOf('A '))
check('未暂存删除（ D）→ D', changeBadgeOf(' D') === 'D', changeBadgeOf(' D'))
check('未暂存重命名（RM）→ R', changeBadgeOf('RM') === 'R', changeBadgeOf('RM'))
for (const code of CONFLICTS) {
  check(`冲突码 ${code} → C`, changeBadgeOf(code) === 'C', changeBadgeOf(code))
}
