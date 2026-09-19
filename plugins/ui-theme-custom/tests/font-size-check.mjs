// 字号持久化与全局生效的回归自检。
//
// 背景（Fix 1）：官方 ThemeRuntime.setFontSize 是「先乐观改本地 → void host.set() 异步写盘」，
// 而 adopt() 每次收到 settings 镜像变更就无条件用镜像值覆盖本地 fontSize。写入飞行窗口内
// 任何镜像抖动都会把字号回滚成旧值 —— 用户看到「改完几秒自动弹回」。
// 插件层补了「字号意图」防护：记住显式提交值，发现被旧镜像回滚就重新断言。
//
// 背景（Fix 2）：官方只把 --dsh-content-font-size 挂在 body，且只有对话模块消费它；
// 两侧边栏与设置面板用硬编码 px，调字号时纹丝不动。插件层用官方增量轴
// --dsh-content-font-delta 对外壳区域做等比增量。
//
// 运行：node plugins/ui-theme-custom/tests/font-size-check.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const clientBundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const clientSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const shellHtml = readFileSync(join(here, '..', '..', '..', 'desktop', 'src', 'shell.html'), 'utf8')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

// ── Fix 1：字号意图防护必须真的接进 theme/change 链路 ──
check('Fix1：存在字号意图记录（setFontSize 包装）', clientSrc.includes('recordFontSizeIntent'))
check('Fix1：存在回滚检测与重新断言函数', clientSrc.includes('assertFontSizeIntent'))
check('Fix1：theme/change 中优先断言字号意图', /assertFontSizeIntent\(snapshot\.fontSize\)/.test(clientSrc))
check(
  'Fix1：断言命中回滚时用原函数重发（不会递归包装自身）',
  /originalSetFontSize\.call\(theme, pendingFontSize\)/.test(clientSrc),
)
check('Fix1：意图最终会清除（有静默窗口计时器）', clientSrc.includes('pendingFontSizeSettle'))
check('Fix1：效果随 fiber 释放（restore setFontSize wrapper）', clientSrc.includes('restore setFontSize wrapper'))
check('Fix1：意图防护已进构建产物', clientBundle.includes('assertFontSizeIntent') && clientBundle.includes('pendingFontSize'))

// ── Fix 2：全局字号作用域 ──
check('Fix2：复用官方增量轴 --dsh-content-font-delta', clientSrc.includes('--dsh-content-font-delta'))
check('Fix2：外壳区域按增量放大（calc + delta）', /calc\(14px \+ var\(--dsh-shell-font-delta/.test(clientSrc))
check('Fix2：侧边栏行被覆盖', clientSrc.includes('[class*="sidebarCol"] [class*="sessionRow"]'))
check('Fix2：设置面板被覆盖', clientSrc.includes('[role="dialog"] [class*="navCell"]'))
check('Fix2：右侧面板被覆盖', clientSrc.includes('[class*="rightbarCol"]'))
check('Fix2：行高随字号联动（避免放大压字）', /line-height:calc\(22px \+ var\(--dsh-shell-font-delta/.test(clientSrc))
check('Fix2：全局字号样式已进构建产物', clientBundle.includes('dsh-shell-font-delta'))

// ── 边界（刻意不跟随）：窗口顶栏属于 chrome，不随字号缩放 ──
// 交通灯、托盘菜单等窗口装饰都是固定尺寸，只缩放中间标题会让 52px 紧凑条失衡；
// 官方 --dsh-content-font-size 是 content 轴，本就不覆盖窗口装饰。
check(
  '边界：顶栏不读字号变量（chrome 固定尺寸）',
  !shellHtml.includes('--shell-font-size') && !shellHtml.includes('payload.fontSize'),
)
check(
  '边界：插件不下发字号给壳（通知桥只带主题与顶栏配色）',
  !/syncDesktopTitlebar\([\s\S]{0,200}fontSize/.test(clientSrc)
    && !/titlebar, fontSize/.test(clientSrc),
)

// ── 关键回归：默认值下不得改变既有外观 ──
// delta=0 时 calc(14px + 0px) === 14px，与原始硬编码一致，故默认外观零变化。
check(
  '回归：Δ=0 时计算结果等于原始硬编码（默认外观不变）',
  /calc\(14px \+ var\(--dsh-shell-font-delta,0px\)\)/.test(clientSrc)
    && /calc\(12px \+ var\(--dsh-shell-font-delta,0px\)\)/.test(clientSrc),
)

// ── 负向对照一：去掉 theme/change 里的断言调用，回滚必须无人纠正 ──
const withoutAssert = clientSrc.replace(
  /if \(assertFontSizeIntent\(snapshot\.fontSize\)\) return/,
  'void 0',
)
check(
  '负向对照：移除 theme/change 断言后回滚无人纠正（证明该接线不可省）',
  !/assertFontSizeIntent\(snapshot\.fontSize\)/.test(withoutAssert),
)

// ── 负向对照二：意图若从不清除，会永久压过后续合法的外部改动 ──
check(
  '负向对照：意图确有清除路径（否则外部改动会被永久压制）',
  /pendingFontSize = null/.test(clientSrc),
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
