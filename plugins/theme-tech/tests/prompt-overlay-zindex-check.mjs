import fs from 'node:fs'
import assert from 'node:assert'

const clientCode = fs.readFileSync('C:/dsh-ecosystem/plugins/theme-tech/lib/client.js', 'utf8')

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
