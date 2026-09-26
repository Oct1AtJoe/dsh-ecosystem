// 液态主题（sequoia）纯色化与接缝消隐的产物级门禁。
//
// 背景：用户反馈「顶栏 / 两个侧边栏 / 主页面之间能看出分界」。实测确认真因是
// **色差而非线条** —— 任何叠加在 bg-base 之上的白色径向、白色渐变或白色发丝
// 都会让该区域比顶栏亮 1~3 阶；大面积纯色相邻时，人眼会把色阶跳变读成一条线。
//
// 因此本门禁锁死三条不变式：
//   A. 液态主题不发任何彩色（暖金/紫/粉）；
//   B. 液态主题的发丝/高光叠加必须清零（AppFrame 顶边、侧边栏右缘、右面板左缘）；
//   C. 玻璃属性（backdrop-filter + 半透明填充）必须保留 —— 去的是色差不是玻璃。
//
// 运行：node plugins/ui-theme-custom/tests/sequoia-neutral-check.mjs
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const bundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const themeSrc = readFileSync(join(here, '..', 'src', 'client', 'sequoia.ts'), 'utf8')
const indexSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')
const profile = 'C:/Users/Administrator/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-client-ui-theme-custom/lib/client.js'

let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : extra}`)
}

/** 取 sequoia 专属 CSS 规则块（模板串里 body[data-ds-custom-theme="sequoia"] 起）。 */
const seqRules = (() => {
  const out = []
  const re = /body\[data-ds-custom-theme="sequoia"\][^{]*\{[^}]*\}/g
  let m
  while ((m = re.exec(indexSrc)) !== null) out.push(m[0])
  return out.join('\n')
})()

console.log('=== A. 彩色清零（两处来源都要查） ===')
const colors = [
  ['暖金 255,168,108', '255, 168, 108'],
  ['紫 130,108,255', '130, 108, 255'],
  ['粉 255,120,148', '255, 120, 148'],
  ['蓝紫 80,100,210', '80, 100, 210'],
  ['橙 255,140,110', '255, 140, 110'],
  ['黄 255,210,110', '255, 210, 110'],
]
for (const [name, needle] of colors) {
  check(`token 文件无 ${name}`, !themeSrc.includes(needle))
  check(`注入 CSS 无 ${name}`, !seqRules.includes(needle))
}

console.log('\n=== B. 无光晕 / 竖向分界线保留（色差根因） ===')
// 【策略变更记录】本组断言经历过一次往返：
//   · 最初锁「bg-app-image 必须为 none」；
//   · 中间曾因「AI 卡片在浅色主题像实色」而短暂改为「允许有色光晕（方案 B）」；
//   · 用户随后明确要求「液态主题的光晕我不要，去掉就好，其他效果都保留」，
//     故回退为「必须 none」。
// ⚠️ 副作用已知并接受：纯色背景下 `blur(纯色)=纯色`，AI 卡片这类
//    「背后就是页面背景」的大面板不会有深色主题那样的通透感 —— 这是
//    「不要光晕」的必然代价，不是缺陷，门禁不应把它当成回归。
check('token: bg-app-image 关闭壁纸光晕（用户明确不要光晕）', /'--dsw-alias-bg-app-image':\s*'none'/.test(themeSrc))
check('token: bg-base 与顶栏同色且不透明', /'--dsw-alias-bg-base':\s*'rgb\(245, 245, 247\)'/.test(themeSrc))
check('token: surface-glass-spot 归零（不要侧栏漫反射斑）', /'--dsw-alias-surface-glass-spot':\s*'transparent'/.test(themeSrc))
check(
  'CSS: 液态主题不发 AppFrame 发丝高光（顶边白线根因）',
  !/body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(indexSrc),
)
check(
  'CSS: 左侧栏竖向分界线保留（用户明确要求）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\]\s*\{[^}]*border-right:\s*0\.5px solid/.test(indexSrc),
)
check(
  'CSS: 侧边栏内容层为半透明填充 + 顶部同色融合屏障（到 --dsh-fusion-top）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*rgb\(245, 245, 247\) var\(--dsh-fusion-top[^}]*rgba\(245, 245, 247, 0\.66\)/.test(indexSrc),
)
// 实测坑（截图定位到 y≈44 白线）：侧边栏内容层的 inset 白色内高光会画在
// 内容层顶部，即壳顶栏正下方，在纯色底上表现为一条横贯白线。必须保持 none。
check(
  'CSS: 侧边栏内容层严禁 inset 白色内高光（y=44 白线根因）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*box-shadow:\s*none/.test(indexSrc),
)
check(
  '融合：内容区顶部同色屏障使用 --dsh-fusion-top（与壳 TITLEBAR_HEIGHT 同步）',
  /--dsh-fusion-top:\s*44px/.test(indexSrc)
    && /var\(--dsh-fusion-top, 44px\)/.test(indexSrc),
)
// 【新增·实测修复】融合屏障必须是**渐隐带**，不能是硬切边。
// 用户反馈「深色主题下顶部栏与页面顶部这条缝看起来不太友好」。
// 逐像素实测（sonoma）：硬切边在 y=44 处 ΔL=-10.8（一条突兀的暗色断崖）；
// 改为渐隐后同一位置 ΔL=-1.0，无可见台阶。
// 判据：屏障带内必须在 --dsh-fusion-top 之后还有中间过渡色标，
// 且终点晚于 44px（即不能写 `transparent 44px` 这种硬切）。
check(
  '融合：屏障带为渐隐过渡而非硬切（不得出现 transparent 44px 硬边）',
  !/transparent\s+var\(--dsh-fusion-top,\s*44px\)\s*\)/.test(indexSrc),
)
check(
  '融合：屏障带含中间过渡色标（calc(--dsh-fusion-top + 52px) 半透明档）',
  /calc\(var\(--dsh-fusion-top, 44px\)\s*\+\s*52px\)/.test(indexSrc),
)
check(
  '融合：屏障带终点晚于 fusion-top（calc + 100px 处完全透明）',
  /transparent\s+calc\(var\(--dsh-fusion-top, 44px\)\s*\+\s*100px\)/.test(indexSrc),
)
// 【新增·实测修复】两侧侧栏也必须带同款顶部融合屏障。
// 用户反馈「深色主题下左右侧边栏跟顶部边栏反差太大，没有像中间一样自然过渡」。
// 逐像素实测（sonoma）：中央顶部 L=24.1（= bg-base），左栏顶部 L=35.5
// —— 侧栏半透明填充 + 紫色光斑直接暴露在顶栏下方，形成约 11 阶亮度断层。
// 补屏障后三处顶部均为 L≈23.9/24.1，色差归零。
// 判据：左栏内容层与右栏面板的 background 都必须以「同色 -> fusion-top -> 渐隐」开头。
console.log('\n=== B2. 两侧侧栏顶部融合（与中央一致的色差消隐）===')
check(
  '融合：左侧栏内容层带顶部同色融合屏障（sonoma）',
  /body\[data-ds-custom-theme="sonoma"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*rgb\(22,\s*24,\s*30\)\s*0,\s*rgb\(22,\s*24,\s*30\)\s*var\(--dsh-fusion-top/.test(indexSrc),
)
check(
  '融合：左侧栏内容层带顶部同色融合屏障（sequoia）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*rgb\(245,\s*245,\s*247\)\s*0,\s*rgb\(245,\s*245,\s*247\)\s*var\(--dsh-fusion-top/.test(indexSrc),
)
check(
  '融合：右侧栏面板带顶部同色融合屏障（sonoma）',
  /body\[data-ds-custom-theme="sonoma"\] \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*rgb\(22,\s*24,\s*30\)\s*0/.test(indexSrc),
)
check(
  '融合：右侧栏面板带顶部同色融合屏障（sequoia）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*rgb\(245,\s*245,\s*247\)\s*0/.test(indexSrc),
)
// 反向约束：侧栏与右栏面板严禁带「顶部 inset 白色亮线」——
// 它画在内容层 y=0（= 壳顶栏正下方），会在顶栏下方形成一条横贯亮线。
check(
  '融合：侧栏内容层无顶部 inset 白色亮线（sonoma）',
  !/body\[data-ds-custom-theme="sonoma"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[\s\S]{0,500}?inset 0 1px 1px/.test(indexSrc),
)
check(
  '融合：右侧栏面板无顶部 inset 白色亮线（sonoma）',
  !/body\[data-ds-custom-theme="sonoma"\] \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[\s\S]{0,500}?inset 0 1px 1px/.test(indexSrc),
)

// 【新增·实测修复】其余四个主题（void/jade/solar/parchment）走的是**通用**深浅分支，
// 用户反馈「其他 4 个主题也要一同修复」。
// 逐像素实测（修复前）：void 左 RGB(38,38,43) vs 中 RGB(13,13,16) → 差 25 阶；
//                        solar 左 RGB(49,39,31) vs 中 RGB(18,14,16) → 差 31 阶。
// 修复手法：把屏障提到**通用规则**（不分主题、不分深浅），
// 用 var(--dsw-alias-bg-base) 让每个主题自动取到自己的底色，无需逐个写死。
console.log('\n=== B3. 通用侧栏顶部融合（覆盖其余四主题）===')
check(
  '融合：深色通用分支的侧栏带 bg-base 融合屏障',
  /body\[data-ds-dark-theme\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*var\(--dsw-alias-bg-base\)\s*0,\s*var\(--dsw-alias-bg-base\)\s*var\(--dsh-fusion-top/.test(indexSrc),
)
check(
  '融合：浅色通用分支的侧栏带 bg-base 融合屏障',
  /body:not\(\[data-ds-dark-theme\]\) \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*var\(--dsw-alias-bg-base\)\s*0,\s*var\(--dsw-alias-bg-base\)\s*var\(--dsh-fusion-top/.test(indexSrc),
)
check(
  '融合：深色通用分支的右栏面板带 bg-base 融合屏障',
  /body\[data-ds-dark-theme\] \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*var\(--dsw-alias-bg-base\)\s*0/.test(indexSrc),
)
check(
  '融合：浅色通用分支的右栏面板带 bg-base 融合屏障',
  /body:not\(\[data-ds-dark-theme\]\) \[class\*="rightbarCol"\] \[data-sidebar-right-panel\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*var\(--dsw-alias-bg-base\)\s*0/.test(indexSrc),
)
// 屏障必须用 bg-base 变量而非写死某主题色，否则又退化成「只对一个主题有效」。
check(
  '融合：通用屏障使用 bg-base 变量（不得写死单一主题色）',
  !/body\[data-ds-dark-theme\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[\s\S]{0,400}?linear-gradient\(180deg,\s*rgb\(/.test(indexSrc),
)

// ── C5. 浮层可读性 + 嵌套 backdrop root 规避（用户实测反馈）──
// 用户反馈「对话框里权限展开的选择面板透明度太高、没有背景高斯模糊」。
// 实测该菜单的 computed backdrop-filter 确实是 blur(92px)，却看不出模糊。两个根因：
//   ① 菜单是**输入坞卡片的 DOM 后代**，而卡片自带 backdrop-filter → 建立 backdrop root，
//      后代的 blur 只能模糊该 root 内部已合成的内容（均匀填充）= 等于没模糊；
//   ② 菜单沿用了输入坞的 .38 填充，承载可读文字太透。
// 修法：卡片 blur 移到 ::before 伪元素（伪元素不是菜单祖先）；浮层单列填充档。
console.log('\n=== C5. 浮层可读性 + 嵌套 backdrop root 规避 ===')
check(
  '浮层：输入坞卡片**自身不得带** backdrop-filter（否则建立 backdrop root，内部浮层 blur 失效）',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="composerSeat"\] \[class\$="_card"\][\s\S]{0,220}?backdrop-filter:none\s*!important/.test(indexSrc),
)
check(
  '浮层：输入坞卡片 blur 已迁移到 ::before 伪元素',
  // 注意 ::before 规则是双主题选择器列表（以逗号结尾），故不能要求 ::before 后紧跟 {
  /\[class\$="_card"\]::before[\s\S]{0,400}?backdrop-filter:var\(--dsh-glass-blur/.test(indexSrc),
)
check(
  '浮层：卡片 ::before 有 z-index:-1（需卡片自身建立 stacking context 才可见）',
  /\[class\*="composerSeat"\] \[class\$="_card"\]::before\s*\{[\s\S]{0,300}?z-index:-1/.test(indexSrc),
)
check(
  '浮层：卡片含菜单时抬层（:has([role="menu"]) → z-index:9500）',
  /\[class\*="composerSeat"\] \[class\$="_card"\]:has\(\[role="menu"\]\)[\s\S]{0,350}?z-index:9500/.test(indexSrc),
)
check(
  '浮层：指令面板纳入 C 组统一毛玻璃',
  /\[class\*="overlayAnchor"\]\s+\[class\$="_menu"\]/.test(indexSrc),
)
check(
  '浮层：菜单/提示使用独立填充档 --dsh-glass-popover-fill（不共用输入坞 .38）',
  /\[role="menu"\][\s\S]{0,200}?var\(--dsh-glass-popover-fill\)/.test(indexSrc.replace(/\n/g, ' ')),
)
check(
  '浮层：浅色主题 Tooltip 文字为深色 label-primary（防白底白字）',
  /body\[data-ds-custom-theme="sequoia"\] \[role="tooltip"\][\s\S]{0,120}?color:var\(--dsw-alias-label-primary\)\s*!important/.test(indexSrc),
)
// 填充必须在保证通透（可隐约感知底层内容）的同时不破坏文字可读性：浅色 ≥ .50、深色 ≥ .70。
for (const [name, re, min] of [
  ['浅色 popover 填充 ≥ .50', /--dsh-glass-popover-fill:rgba\(255,255,255,([\d.]+)\)/, 0.50],
  ['深色 popover 填充 ≥ .70', /--dsh-glass-popover-fill:rgba\(26,30,38,([\d.]+)\)/, 0.70],
]) {
  const m = indexSrc.match(re)
  const val = m ? Number(m[1]) : null
  check(`浮层：${name}`, val !== null && val >= min, `  实测=${val}`)
}

console.log('\n=== C. 玻璃强度（去的是光晕与彩色，不是玻璃） ===')
check('token: glass-blur 提升到 64px（强化）', themeSrc.includes("'--dsw-alias-glass-blur': 'blur(64px) saturate(200%)'"))
check('token: surface-glass-blur 提升到 56px', themeSrc.includes("'--dsw-alias-surface-glass-blur': 'blur(56px) saturate(190%)'"))
check('token: 侧边栏填充 0.66（实而仍透，兼顾可读性）', themeSrc.includes("'--dsw-specific-sidebar-fill': 'rgba(245, 245, 247, 0.66)'"))
check('CSS: 侧边栏 ::before 毛玻璃提升到 56px', /sequoia"\] \[class\*="sidebarCol"\]::before\s*\{[^}]*backdrop-filter:\s*blur\(56px\)/.test(indexSrc))

// ── C3. 毛玻璃材质（与「磨砂颗粒」的本质区别）──
// 【材质定义已变更，本组断言随之改写】
//   · 毛玻璃 = 表面光滑无颗粒，背后内容被 blur 化开，隐约可见明暗但读不出字。
//   · 磨砂   = 表面微观颗粒（feTurbulence 噪声层）。
// 用户明确否决了磨砂路线：噪声 rect 带满 alpha，叠加会同时压暗明度，
// 强度 0.20→0.12→0.05→0.03 一路调都只是「糊了一层灰雾」的脏感，方向本身错误。
// 故本组由「断言噪声层存在」翻转为「断言噪声层不存在 + 毛玻璃配方齐备」。
console.log('\n=== C3. 毛玻璃材质（Frosted Glass）===')
check('毛玻璃：噪声层已彻底移除（毛玻璃表面光滑，不做磨砂）', !/dsh-frost-noise/.test(indexSrc))
check('毛玻璃：噪声纹理源已移除（无 feTurbulence 残留）', !/feTurbulence/.test(indexSrc))
// 两条独立的轴：填充控「透多少」，blur 控「糊多狠」。
// 用户确认参数：填充 .38 + blur(92px) saturate(180%)。
check('毛玻璃：虚化半径 92px（遮住背后文字靠它，不能靠加填充）', /--dsh-glass-blur:blur\(92px\) saturate\(180%\)/.test(indexSrc))
check('毛玻璃：浅色填充 .38（低填充才看得见背后）', /--dsh-glass-fill:rgba\(255,255,255,0\.38\)/.test(indexSrc))
// 【策略变更】原断言为「深色主题有独立填充」，走的是 [data-ds-dark-theme] 通配分支。
// 用户实测确认「只有液态与曜黑这两个主题加好看，其他 4 个主题加都不好看」，
// 故适用范围收窄为两个具名主题：sequoia（浅）.38 / sonoma（深）深色系填充。
check(
  '毛玻璃：曜黑 sonoma 有独立深色填充（照抄白色会发灰）',
  /body\[data-ds-custom-theme="sonoma"\]\{\s*--dsh-glass-fill:rgba\(26,30,38/.test(indexSrc),
)
check('毛玻璃：浅/深各有独立高光边缘', /--dsh-glass-edge:rgba\(255,255,255,0\.96\)/.test(indexSrc) && /--dsh-glass-edge:rgba\(255,255,255,0\.16\)/.test(indexSrc))
// 结构层前提：不去掉输入区实色压底，blur 模糊到的只是纯色，毛玻璃数学上不可能生效。
check(
  '毛玻璃：输入区实色压底已清除（结构层前提，否则 A1/A2 全部白做）',
  /\[data-ds-custom-theme="sequoia"\] \[class\*="composerSeat"\][\s\S]{0,120}?background-image:none\s*!important;/.test(indexSrc),
)
// A 组：背后有内容滚过 → 必须带 blur。
for (const [name, re] of [
  ['A1 输入坞', /\[class\*="composerSeat"\] \[class\$="_card"\][\s\S]{0,400}?backdrop-filter:var\(--dsh-glass-blur/],
  ['A3 撤回气泡', /\[class\*="dsh-recall-bubble"\][\s\S]{0,600}?backdrop-filter:var\(--dsh-glass-blur/],
]) {
  check(`毛玻璃：${name} 已接入统一配方`, re.test(indexSrc.replace(/\n/g, ' ')))
}
check(
  '浮层防劫持：成本卡 cm-footer-stack 显式禁用 backdrop-filter（防 Containing Block 劫持 Tooltip 导致双向滚动条）',
  /\[class\*="cm-footer-stack"\][\s\S]{0,300}?backdrop-filter:none\s*!important/.test(indexSrc.replace(/\n/g, ' ')),
)
// ── C6. 嵌套 backdrop root 的推广范围（防止只修一处、漏掉同类）──
// 「父层带真实元素级 backdrop-filter + 内部弹出浮层」= blur 被嵌套 root 吃掉。
// 全页实测结论（写入源码注释，此处锁住结论不被悄悄改回）：
//   · 输入坞卡片 QwfZkG_card    → 有浮层，需修（已把 blur 迁到 ::before）
//   · AI 回复卡 kdtA_a_flowItem → 内部定位浮层数 = 0，无需修
//   · cm-footer-stack 内部含 Tooltip fixed 浮层且自身为滚动容器 → 显式禁用 blur
//   · dsh-recall-bubble / _bannerWrap → 内部浮层数 = 0，无需修
//   · sidebarCol / rightbarCol  → blur 本就在 ::before，主元素无 blur，本就安全
console.log('\n=== C6. 嵌套 backdrop root 推广范围 ===')
check(
  '推广：源码注释记录了全页实测结论（AI 卡/侧栏无需修，成本卡禁用 blur）',
  /kdtA_a_flowItem[\s\S]{0,300}?内部浮层数 = 0/.test(indexSrc)
  && /sidebarCol \/ rightbarCol[\s\S]{0,200}?本就安全/.test(indexSrc),
)
check(
  '推广：明确要求新增 A 组成员若内含浮层须套用同一修法（防漏修）',
  /若日后 A 组新增成员[\s\S]{0,120}?必须套用本节同一修法/.test(indexSrc),
)
// 反向约束：不得出现「同一元素既带真实 blur 又声明了浮层抬层」之外的漏修形态 ——
// 即 :has([role="menu"]) 抬层规则必须与 ::before 迁移规则同时存在（成对出现）。
check(
  '推广：::before 迁移与 :has 抬层成对存在（缺一即漏修）',
  /\[class\$="_card"\]::before[\s\S]{0,400}?backdrop-filter:var\(--dsh-glass-blur/.test(indexSrc)
  && /\[class\$="_card"\]:has\(\[role="menu"\]\)[\s\S]{0,350}?z-index:9500/.test(indexSrc),
)
// ── 适用范围收窄（用户实测确认）──
// 玻璃材质**只服务 sequoia 与 sonoma**。本组断言防止它重新扩散到其余四主题。
console.log('\n=== C4. 玻璃适用范围（仅液态 + 曜黑）===')
check(
  '范围：材质规则带 sequoia 门控',
  /body\[data-ds-custom-theme="sequoia"\] \[class\*="composerSeat"\] \[class\$="_card"\]/.test(indexSrc),
)
check(
  '范围：材质规则带 sonoma 门控',
  /body\[data-ds-custom-theme="sonoma"\] \[class\*="composerSeat"\] \[class\$="_card"\]/.test(indexSrc),
)
// 其余四个主题不得出现在任何材质规则的主题门控里。
for (const id of ['void', 'jade', 'solar', 'parchment']) {
  const leaked = new RegExp(`body\\[data-ds-custom-theme="${id}"\\][^,{]*\\{[^}]*backdrop-filter:var\\(--dsh-glass-blur`).test(indexSrc)
  check(`范围：${id} 未被施加玻璃材质（不得回流）`, !leaked)
}
// 反面：不得用「参数归零」的方式豁免 —— 那会给其余主题写 background:transparent，
// 把官方原有底衬一起抹掉，属于破坏而非还原。
check(
  '范围：未用「归零」方式豁免其余主题（防抹掉官方底衬）',
  !/data-ds-custom-theme="(void|jade|solar|parchment)"\]\{[\s\S]{0,200}?--dsh-glass-blur:none/.test(indexSrc),
)
// 登记册：曾被否决的材质不应以任何形式回流。
check('毛玻璃：未使用已否决的颗粒变量名', !/--dsh-glass-noise/.test(indexSrc))

// ── 面板不透明度下限（防「太透」回归）──
// 玻璃要「实而仍透」：alpha 过低会让面板发虚、文字与底衬对比不足、边界感消失。
// 单点断言容易被逐个改动绕过，这里对整组浮层 token 做统一下限校验。
console.log('\n=== C2. 面板不透明度下限（防「太透」回归）===')
const opacityTokens = [
  ['bg-layer-1', /'--dsw-alias-bg-layer-1':\s*'rgba\(255, 255, 255, ([\d.]+)\)'/],
  ['bg-layer-2', /'--dsw-alias-bg-layer-2':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['bg-layer-3', /'--dsw-alias-bg-layer-3':\s*'rgba\(235, 235, 238, ([\d.]+)\)'/],
  ['bg-overlay', /'--dsw-alias-bg-overlay':\s*'rgba\(255, 255, 255, ([\d.]+)\)'/],
  ['sidebar-fill', /'--dsw-specific-sidebar-fill':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['selector', /'--dsw-specific-selector':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['tip', /'--dsw-specific-tip':\s*'rgba\(245, 245, 247, ([\d.]+)\)'/],
  ['bubble', /'--dsw-specific-bubble':\s*'rgba\(255, 255, 255, ([\d.]+)\)'/],
]
for (const [name, re] of opacityTokens) {
  const m = themeSrc.match(re)
  const val = m ? Number(m[1]) : null
  // 下限 0.6：低于此值在实测中被判定为「发虚、可读性不足」
  check(`下限：${name} alpha ≥ 0.6`, val !== null && val >= 0.6, `  实测=${val}`)
}
// 弹窗是内容面板，可读性优先：单独一档更实的填充，不得与输入坞的 .38 共用。
check(
  '毛玻璃：弹窗填充单独一档且更实（内容面板可读性优先）',
  /--dsh-glass-dialog-fill:rgba\(255,255,255,0\.78\)/.test(indexSrc),
)
check('CSS: 侧边栏右缘无白色高光线（只保留一条中性分界）', !/sequoia"\] \[class\*="sidebarCol"\] > \* > \[class\*="root"\]\s*\{[^}]*inset -0?\.?5?px 0 0 rgba\(255, 255, 255/.test(indexSrc))

console.log('\n=== D. 顶栏分割线：融合态全主题透明 ===')
// 方案 C（无边框融合）要求「顶栏色 == 该主题页面底色」，因此 6 个主题的
// line 必须全部 transparent（有色的线会在同色底上重新变成一条可见分界）。
check('产物：全部 6 个主题 line=transparent', (bundle.match(/line:\s*"transparent"/g) || []).length === 6)
check(
  '回归：任取一主题的顶栏 bg 必须等于其 token bg-base（融合前提）',
  (() => {
    // 抽查 sonoma / void / solar 三个曾不一致的主题
    const pairs = [
      ['sonoma', 'rgb(22, 24, 30)'],
      ['void', 'rgb(13, 13, 16)'],
      ['solar', 'rgb(18, 14, 16)'],
    ]
    return pairs.every(([id, color]) => new RegExp(`${id}[\\s\\S]{0,160}?bg:\\s*"${color.replace(/[()]/g, '\\$&')}"`).test(bundle))
  })(),
)
const shellHtml = readFileSync(join(here, '..', '..', '..', 'desktop', 'src', 'shell.html'), 'utf8')
check('壳消费 tb.line → --line', /if \(tb\.line\) write\('--line'/.test(shellHtml))
check('#titlebar 读 var(--line)', shellHtml.includes('border-bottom: 0.5px solid var(--line)'))
// 融合关键：壳顶栏严禁 backdrop-filter —— saturate() 会改变近中性灰的颜色，
// 使顶栏与内容区底产生色偏，是「看得出分家」的隐藏原因。
// 注意先剥离 CSS 注释再查：注释里会提到 backdrop-filter 这个词。
check(
  '融合：壳 #titlebar 禁用 backdrop-filter（saturate 会造成色偏）',
  (() => {
    const noComments = shellHtml.replace(/\/\*[\s\S]*?\*\//g, '')
    const m = noComments.match(/#titlebar\s*\{([^}]*)\}/)
    return m !== null && !/backdrop-filter/.test(m[1])
  })(),
)

console.log('\n=== E. profile 产物已同步 ===')
try {
  const a = statSync(join(here, '..', 'lib', 'client.js')).size
  const b = statSync(profile).size
  check('源与 profile 大小一致', a === b, `  源=${a} profile=${b}`)
  check('profile 含纯色 bg-base', readFileSync(profile, 'utf8').includes('rgb(245, 245, 247)'))
} catch (e) {
  failed++
  console.log(`FAIL  profile 产物不可读: ${e.message}`)
}

console.log('\n=== 负向对照（证明判据有牙齿） ===')
const withoutRimRemoval = indexSrc.replace(
  /body\[data-ds-custom-theme="sonoma"\] div\[class\$="_frame"\]/,
  'body[data-ds-custom-theme="sequoia"] div[class$="_frame"]',
)
check(
  '负向对照：把发丝高光加回液态主题，本门禁必须能检出',
  /body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(withoutRimRemoval)
    && !/body\[data-ds-custom-theme="sequoia"\] div\[class\$="_frame"\]/.test(indexSrc),
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
