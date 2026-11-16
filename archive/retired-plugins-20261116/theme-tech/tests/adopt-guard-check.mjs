// adopt 防抖与主题回滚保护自检
// 背景：任何外部插件保存设置触发 settings/document-updated 时，官方 ThemeRuntime.adopt()
// 会尝试无条件将当前 preference 覆盖为 settings 中的内置主题，导致 DOM 抖动和桌面端 WCO 黑闪。
// 运行：node plugins/theme-tech/tests/adopt-guard-check.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const clientBundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
const clientSrc = readFileSync(join(here, '..', 'src', 'client', 'index.ts'), 'utf8')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

check('AdoptGuard: 源码存在 adopt wrapper', clientSrc.includes('rawTheme.adopt = function'))
check('AdoptGuard: 保护判断包含 desired 与 builtinPickWins', clientSrc.includes('desired && !builtinPickWins(this.preference, liveBuiltinPick)'))
check('AdoptGuard: 同步字号与字体变更', clientSrc.includes('sizesChanged') && clientSrc.includes('fontsChanged'))
check('AdoptGuard: 随 fiber 释放清理 wrapper', clientSrc.includes('restore adopt wrapper'))
check('AdoptGuard: 构建产物已包含 adopt wrapper', clientBundle.includes('restore adopt wrapper') && clientBundle.includes('sizesChanged'))

if (failed > 0) {
  console.error(`\n${failed} 项检查失败`)
  process.exit(1)
} else {
  console.log('\n全部通过')
}
