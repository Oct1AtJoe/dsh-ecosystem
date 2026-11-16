import fs from 'node:fs'
import assert from 'node:assert'
import path from 'node:path'

const sourcePath = path.resolve('src/client/index.ts')
const clientBundlePath = path.resolve('lib/client.js')

const src = fs.readFileSync(sourcePath, 'utf8')

// 1. 验证源码中排除列表：确保已排除官方组件、包装器、span与搜索
assert(src.includes(':not([class*="input"])'), 'dialog input rule must exclude [class*="input"]')
assert(src.includes(':not(span > input)'), 'dialog input rule must exclude span > input')
assert(src.includes(':not([class*="wrap"] input)'), 'dialog input rule must exclude [class*="wrap"] input')
assert(src.includes(':not([class*="stepper"] input)'), 'dialog input rule must exclude [class*="stepper"] input')
assert(src.includes(':not([class*="search"] input)'), 'dialog input rule must exclude [class*="search"] input')

// 2. 验证全局复合输入容器免疫层
assert(src.includes('[class*="wrap"] > input'), 'must include wrap > input immunity')
assert(src.includes('[class*="tabSearch"] input'), 'must include tabSearch input immunity')
assert(src.includes('[class*="themeSearch"] input'), 'must include themeSearch input immunity')
assert(src.includes('span:has(> input) > input'), 'must include span:has(> input) > input immunity')
assert(src.includes('background: transparent !important'), 'must force transparent background')
assert(src.includes('border: none !important'), 'must force border: none')

// 3. 验证构建产物 bundle
const bundle = fs.readFileSync(clientBundlePath, 'utf8')
assert(bundle.includes('tabSearch'), 'bundle must contain tabSearch rule')
assert(bundle.includes('themeSearch'), 'bundle must contain themeSearch rule')
assert(bundle.includes('background:transparent!important') || bundle.includes('background: transparent !important'), 'bundle must contain transparent !important')

console.log('PASS: input-transparency-check - 源码与产物断言全部通过')
