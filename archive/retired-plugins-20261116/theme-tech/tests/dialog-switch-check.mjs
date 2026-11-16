import fs from 'node:fs'
import assert from 'node:assert'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// 产物路径按脚本自身位置推导：曾写死 C:/dsh-ecosystem/...，工作区换盘符后门禁直接崩。
const here = dirname(fileURLToPath(import.meta.url))
const clientCode = fs.readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')

// ── 1. 弹窗操作按钮规则必须排除开关与图标按钮（防止白底/大内边距污染） ──
assert(
  clientCode.includes('button:not([role="switch"]):not([aria-checked])'),
  'dialog actions button base rule must exclude role="switch" and aria-checked'
)
assert(
  clientCode.includes('button:not([data-tone="primary"]):not([role="switch"]):not([aria-checked])'),
  'dialog secondary actions button rule must exclude role="switch" and aria-checked'
)

// ── 2. 弹窗内开关规范化必须以 aria-checked 为判据 ──
assert(
  clientCode.includes('[role="dialog"] button[aria-checked]'),
  'dialog switch reset must key off the aria-checked state attribute'
)
assert(
  clientCode.includes('[role="dialog"] button[aria-checked="true"]'),
  'dialog switch on-state must key off aria-checked="true"'
)

// ── 3. 负向对照：不得再用 [class*="switch"] 这类宽通配做几何重置 ──
//   实踩回归：宽通配命中 ui-kanye-pet 的 .KanyeCard_switch（42×24 / 18px ::after /
//   translateX(18px)，状态走 aria-pressed），被强改成 36×20 / 16px，滑块错位。
assert(
  !clientCode.includes('[role="dialog"] button[class*="switch"]'),
  'NEGATIVE: dialog switch reset must NOT use the [class*="switch"] wildcard again'
)
assert(
  !clientCode.includes('[role="dialog"] button[class*="Switch"]'),
  'NEGATIVE: dialog switch reset must NOT use the [class*="Switch"] wildcard again'
)

// ── 4. 两态底色与滑块位移仍须保留，且开启态绑定品牌色 ──
assert(
  clientCode.includes('var(--dsw-alias-brand-primary') && clientCode.includes('translateX(16px)'),
  'dialog switch must keep the brand track colour and the 16px thumb travel'
)
assert(
  clientCode.includes('button[aria-checked]:not([aria-checked="true"])'),
  'dialog switch off-state must have a visible neutral track in both light and dark themes'
)

// ── 5. 必须显式排除第三方自绘开关（dsh-notify-me 的 .dnm-switch，防双重 translateX 叠加） ──
assert(
  clientCode.includes('button[aria-checked]:not([class*="dnm-switch"])'),
  'dialog switch reset must explicitly exclude .dnm-switch from geometric/transform overrides'
)
assert(
  clientCode.includes('button[aria-checked="true"]:not([class*="dnm-switch"]) > span'),
  'dialog switch thumb travel rule must explicitly exclude .dnm-switch to prevent 32px double travel'
)

console.log('[PASS] dialog-switch-check: 弹窗 Switch 防污染、aria-checked 判据、第三方自绘开关排除与宽通配负向对照全部通过')
