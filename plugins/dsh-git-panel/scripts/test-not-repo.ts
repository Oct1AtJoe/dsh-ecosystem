/**
 * 门禁：工作区不是 Git 仓库时，「审查」tab 必须显示中性空态，而不是把原始
 * git 报错当故障展示。
 *
 * 背景：审查 tab 的图谱主视图会并发请求 graph + branches；非仓库时宿主返回
 * `not-a-repo`。修复前该错误码被当作普通故障塞进红色错误分支，用户看到的是
 * 一屏 git 原始报错文本。修复后应识别为业务状态并渲染空态文案。
 *
 * 判据只看**构建产物**（lib/client.js 才是真正上线的代码），并带负向对照：
 * 若有人把 not-a-repo 判定删掉，本脚本必须报错。
 */
import fs from 'node:fs'
import assert from 'node:assert'

const client = fs.readFileSync('C:/dsh-ecosystem/plugins/dsh-git-panel/lib/client.js', 'utf8')

// 1. 必须识别宿主的 not-a-repo 错误码
assert(
  client.includes('not-a-repo'),
  'client bundle must recognize the not-a-repo error code',
)

// 2. 必须存在独立的非仓库状态（不得复用通用 error 通道）
assert(
  client.includes('notRepo'),
  'client bundle must carry a dedicated notRepo state',
)

// 3. 必须提供空态文案（中/英各一条）
assert(
  client.includes('panel.notRepo'),
  'client bundle must ship the panel.notRepo copy',
)
assert(
  client.includes('panel.notRepoHint'),
  'client bundle must ship the panel.notRepoHint copy',
)

// 4. 图谱视图与提交详情视图都要覆盖（两个入口都不能漏）
const graphView = fs.readFileSync('C:/dsh-ecosystem/plugins/dsh-git-panel/src/client/review/ReviewGraphView.tsx', 'utf8')
assert(
  /code === 'not-a-repo'/.test(graphView),
  'ReviewGraphView must branch on the not-a-repo code',
)

const reviewView = fs.readFileSync('C:/dsh-ecosystem/plugins/dsh-git-panel/src/client/review/ReviewView.tsx', 'utf8')
assert(
  /code === 'not-a-repo'/.test(reviewView),
  'ReviewView must branch on the not-a-repo code',
)

// 负向对照：空态不得用错误色（--danger / --review-del-color）渲染，
// 否则「业务状态」在视觉上仍是故障。
assert(
  !/notRepo[\s\S]{0,400}var\(--review-del-color\)/.test(reviewView),
  'NEGATIVE: the not-repo empty state must not use the error colour',
)

console.log('[PASS] not-a-repo-empty-state-check: 非 Git 仓库空态与错误通道分离全部通过')
