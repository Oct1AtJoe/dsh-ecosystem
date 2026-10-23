import fs from 'node:fs'
import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// 产物路径按脚本自身位置推导：曾写死 C:/dsh-ecosystem/...，工作区换盘符后门禁直接崩。
const here = dirname(fileURLToPath(import.meta.url))
const clientCode = fs.readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')

// 1. 断言：第三方 body 级浮层（dsh-prompt-history 的预测/补全 ghost）存在遮挡层时被隐藏
assert(
  clientCode.includes('.dsh-ph-suggest') && clientCode.includes('.dsh-ph-ghost'),
  'client bundle must handle dsh-prompt-history body-level overlays (.dsh-ph-suggest / .dsh-ph-ghost)'
)

// 2. 断言：判据锚在宿主自带标记上 —— 设置弹窗 / composer overlay 视图 / 右栏通栏
assert(
  clientCode.includes('[role="presentation"] > [role="dialog"]'),
  'overlay guard must anchor on the official settings/modal structure (role=presentation > role=dialog)'
)
assert(
  clientCode.includes('[data-conversation-composer-overlay]'),
  'overlay guard must anchor on the official composer-overlay view marker (trajectory/review)'
)
assert(
  clientCode.includes('[data-sidebar-right-panel="fullscreen"]'),
  'overlay guard must anchor on the official right-panel fullscreen state'
)

// 2b. 断言：回答选择面板与计划审查面板也属遮挡层（宿主自带 data-* 属性，
//     QuestionComposer.tsx:433 / PlanReviewPanel.tsx:58）。
//     回归背景：这两个面板弹出时输入坞 host 仍 isConnected，
//     第三方 tick 不会收起浮层，提示语就压在面板之上。
assert(
  clientCode.includes('[data-question-key]'),
  'overlay guard must treat the answer-question panel (data-question-key) as a covering layer'
)
assert(
  clientCode.includes('[data-plan-review-key]'),
  'overlay guard must treat the plan-review panel (data-plan-review-key) as a covering layer'
)

// 2b-2. 断言：开屏动画（dsh-ink-whale 的 .dshiw-root）也算遮挡层。
//     它经 shell.overlay 槽位注入，全屏 fixed、z-index:2147483000；
//     开屏期间输入框本就不可交互，提示语浮在品牌动画上只会显得脏。
assert(
  clientCode.includes('.dshiw-root'),
  'overlay guard must treat the dsh-ink-whale splash (.dshiw-root) as a covering layer'
)

// 2b-3. 负向对照：开屏判据必须是该类名本身，不得写成 .dshiw-mount（那只是
//     React 的挂载壳，没有层级；也不是全屏根节点）。
assert(
  !/\:has\(:is\([\s\S]{0,700}\.dshiw-mount/.test(clientCode),
  'NEGATIVE: the splash anchor must be .dshiw-root, not the bare .dshiw-mount wrapper'
)

// 2b-4. 断言：模型选择面板与弹出菜单也属遮挡层（官方 ModelSelect 使用的
//     MenuSurface 带有 [data-menu-material]，展开模型列表时包含 [role="menu"]，
//     三方模型选择插件带有 .bre-model-search-box）。
//     菜单展开向上覆盖输入框时，提示语必须收起，不能穿透盖在模型面板上方。
assert(
  clientCode.includes('[data-menu-material]'),
  'overlay guard must treat MenuSurface ([data-menu-material]) as a covering layer'
)
assert(
  clientCode.includes('[role="menu"]'),
  'overlay guard must treat [role="menu"] as a covering layer'
)
assert(
  clientCode.includes('.bre-model-search-box'),
  'overlay guard must treat model selection search box (.bre-model-search-box) as a covering layer'
)

// 2b-5. 断言：MenuSurface 材质容器层级加固提升至 9501，与 [role="menu"] 齐平
assert(
  /\[role="menu"\],\s*\[data-menu-material\]\s*\{\s*z-index:\s*9501\s*!important;/.test(clientCode),
  'MenuSurface ([data-menu-material]) must share z-index:9501 with [role="menu"]'
)

// 2c. 负向对照：禁止用通配类名去锚定这两个面板（CSS Modules 哈希后类名不可靠，
//     且 [class*="card"] 会误伤输入坞与其它卡片）。
assert(
  !/data-ds-custom-theme\]:has\(:is\([\s\S]{0,600}\[class\*="card"\]/.test(clientCode),
  'NEGATIVE: the guard must not anchor on a [class*="card"] wildcard'
)

// 2d. 负向对照：聊天目录（.dsh-ph-toc*）刻意不纳入遮挡收起 ——
//     它是用户主动拖出的浮层，面板出现时消失会被读成"目录自己丢了"。
assert(
  !/:is\(\.dsh-ph-suggest, \.dsh-ph-ghost[^)]*dsh-ph-toc/.test(clientCode)
    && !/dsh-ph-toc[\s\S]{0,200}display:\s*none/.test(clientCode),
  'NEGATIVE: the chat TOC (.dsh-ph-toc*) must stay out of the covering-layer hide rule'
)

// 3. 断言：必须用 display:none 收起，而不是改 z-index 下压（body 直接子级下压会掉到内容层之下）
assert(
  /body\[data-ds-custom-theme\]:has\(:is\([\s\S]*?\)\) :is\(\.dsh-ph-suggest, \.dsh-ph-ghost\)\s*\{\s*display:\s*none/.test(clientCode),
  'overlay guard must hide the third-party ghost with display:none (never by lowering z-index)'
)

// 4. 负向对照：规则必须带自定义主题门控，内置主题原始表现不得被改变
assert(
  clientCode.includes('body[data-ds-custom-theme]:has(:is('),
  'overlay guard must be gated behind body[data-ds-custom-theme] so built-in themes stay untouched'
)

console.log('[PASS] prompt-overlay-zindex-check: 第三方输入框浮层遮挡纠正守卫全部通过')
