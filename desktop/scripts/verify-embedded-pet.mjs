// 校验 release exe 内嵌的 pet.js 是否为修复后版本。
// 背景：Tauri 把 frontendDist 资源以 Brotli 压缩嵌入 exe，明文扫描搜不到特征串
// （曾因此误判「pet.js 未嵌入、改完不用重编」，导致一次静默失效）。
// 正确做法：解压 codegen asset 后断言修复特征；同时断言压缩字节确实出现在 exe 内。
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'

const BUILD = 'C:/dsh-ecosystem/desktop/src-tauri/target/release/build'
const EXE = 'C:/dsh-ecosystem/desktop/src-tauri/target/release/deepseek-harness-desktop.exe'
const DIST = 'C:/dsh-ecosystem/desktop/dist/DeepSeekHarness.exe'

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`)
}

// 最新 build 目录里的 js asset（pet.js 编译产物）
const dirs = readdirSync(BUILD)
  .filter(d => d.startsWith('deepseek-harness-desktop-'))
  .map(d => ({ d, t: statSync(join(BUILD, d)).mtimeMs }))
  .sort((a, b) => b.t - a.t)
check('找到 build 产物目录', dirs.length > 0)

const assetDir = join(BUILD, dirs[0].d, 'out', 'tauri-codegen-assets')
const jsFiles = readdirSync(assetDir).filter(f => f.endsWith('.js'))
check('找到 codegen js asset', jsFiles.length > 0, `dir=${assetDir}`)

const assetPath = join(assetDir, jsFiles[0])
const assetBytes = readFileSync(assetPath)
const plain = brotliDecompressSync(assetBytes)
const src = plain.toString('utf8')

check('asset 解压成功且像 pet.js', src.includes('applyConfig'))
check('修复：开关关闭时窗口压到 0×0', /winW = show \? Math\.round\(newSize\) : 0/.test(src))
check('修复：body display 随开关切换', src.includes("document.body.style.display = show ? '' : 'none'"))
check('修复：气泡在关闭态被拦截', src.includes('if (currentConfig.desktopPetEnabled === false) return'))
check('未引入 hide()（会挂起 WebView 导致无法恢复）', !src.includes('plugin:window|hide'))

// 压缩后的 asset 必须逐字节出现在 exe 内 —— 这是「确实嵌进去了」的硬证据
const exe = readFileSync(EXE)
check('压缩 asset 已嵌入 release exe', exe.includes(assetBytes))
check('明文不在 exe 内（Brotli 压缩，故明文扫描不可作为判据）', !exe.includes(plain))

// dist 是用户实际双击的产物：它必须就是本次构建、且同样带修复
const dist = readFileSync(DIST)
check('dist 产物已更新为本次构建（与 target exe 逐字节一致）', dist.equals(exe))
check('dist 产物内嵌的 asset 带修复', dist.includes(assetBytes))

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
