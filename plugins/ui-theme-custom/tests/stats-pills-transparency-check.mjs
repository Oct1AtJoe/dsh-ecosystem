import fs from 'node:fs'
import assert from 'node:assert'
import path from 'node:path'

const sourcePath = path.resolve('src/client/index.ts')
const clientBundlePath = path.resolve('lib/client.js')

const src = fs.readFileSync(sourcePath, 'utf8')
const bundle = fs.readFileSync(clientBundlePath, 'utf8')

console.log('=== 验证 StatsPills / _MG5Va_root 防透与毛玻璃守门 ===')

// 1. 源码选择器覆盖断言（0.2.1 新宿主 + 0.1.5 旧宿主双轨）
assert(src.includes('[data-composer-dock]'), '必须包含 0.2.1-rc.2 新宿主 [data-composer-dock] 容器选择器')
assert(src.includes('[data-composer-stats]'), '必须包含旧宿主 [data-composer-stats] 属性选择器以兼容历史')
assert(src.includes('_MG5Va_root'), '必须显式命中用户反馈的 _MG5Va_root 类名')
assert(src.includes('conversation.composer.dock'), '必须覆盖官方 conversation.composer.dock slot')

// 2. 浅色 (sequoia) 规则断言
const seqMatch = src.match(/body\[data-ds-custom-theme="sequoia"\]\s+\[data-composer-dock\][^{]*\{([^}]+)\}/)
assert(seqMatch, '必须存在 sequoia 下的 stats pills 容器样式')
const seqBody = seqMatch[1]
assert(seqBody.includes('rgba(245, 245, 247, 0.88)') || seqBody.includes('0.88'), 'sequoia 背景不透明度必须 >= 0.88（防穿透）')
assert(seqBody.includes('border-radius: 20px'), '必须严格对齐输入框 20px 圆角')

// 3. 浅色 ::before 毛玻璃断言（防嵌套 backdrop root）
const seqBeforeMatch = src.match(/body\[data-ds-custom-theme="sequoia"\]\s+\[data-composer-dock\][^{]*::before[^{]*\{([^}]+)\}/)
assert(seqBeforeMatch, '必须将 backdrop-filter 迁至 ::before 伪元素')
assert(seqBeforeMatch[1].includes('backdrop-filter: blur(40px)'), '虚化半径必须达到 40px 以上')

// 4. 深色 (sonoma) 规则断言
const sonomaMatch = src.match(/body\[data-ds-custom-theme="sonoma"\]\s+\[data-composer-dock\][^{]*\{([^}]+)\}/)
assert(sonomaMatch, '必须存在 sonoma 下的 stats pills 容器样式')
const sonomaBody = sonomaMatch[1]
assert(sonomaBody.includes('rgba(22, 24, 30, 0.90)') || sonomaBody.includes('0.90'), 'sonoma 背景必须为深色且不透明度 >= 0.90')

// 5. 产物 bundle 验证
assert(bundle.includes('data-composer-dock'), '产物 bundle 必须包含 data-composer-dock 规则')
assert(bundle.includes('data-composer-stats'), '产物 bundle 必须包含 data-composer-stats 规则')
assert(bundle.includes('_MG5Va_root'), '产物 bundle 必须包含 _MG5Va_root 规则')

console.log('PASS: stats-pills-transparency-check 全部通过')
