/**
 * L0 可执行性验证：产物 runtime 能独立起 Web 服务。
 * 严格模式：可选地隐藏源树，证明零外部依赖。
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'C:\\dsh-ecosystem\\desktop\\bundle-resources\\runtime'
const HOME = join(process.env.TEMP ?? 'C:\\Users\\Administrator\\AppData\\Local\\Temp', '__l0-test-home')
const PORT = 3999

if (!existsSync(join(OUT, 'node.exe'))) {
  console.error('runtime 产物不存在')
  process.exit(1)
}

// 找到 dsh 实例
const pnpmDir = join(OUT, 'node_modules', '.pnpm')
const instances = readdirSync(pnpmDir).filter((n) => /^@deepseek-ai\+dsh@0\.2\.1-rc\.2/.test(n))
if (instances.length === 0) {
  console.error('未找到 dsh 实例')
  process.exit(1)
}
const bin = join(pnpmDir, instances[0], 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
console.log('dsh bin:', bin)

rmSync(HOME, { recursive: true, force: true })
mkdirSync(HOME, { recursive: true })

// ponytail: 只留 SystemRoot，剥离所有 PATH 里的 node/npm，模拟干净机器
const env = {
  SystemRoot: process.env.SystemRoot,
  TEMP: HOME,
  TMP: HOME,
  DSH_HOME: HOME,
  BROWSER: 'none',
}

console.log('=== 启动（空环境）===')
const child = spawn(join(OUT, 'node.exe'), [bin, 'web', '--host', '127.0.0.1', '--port', String(PORT), '--no-open'], {
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let stdout = ''
let stderr = ''
child.stdout.on('data', (d) => (stdout += d))
child.stderr.on('data', (d) => (stderr += d))

let exited = false
child.on('exit', (code) => {
  exited = true
  console.log('子进程退出, code =', code)
})

const deadline = Date.now() + 60000
let ok = false
let status = 0

while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 1000))
  if (exited) break
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(3000) })
    status = res.status
    ok = true
    break
  } catch {
    /* 还没起来 */
  }
}

console.log('=== 结果 ===')
console.log(JSON.stringify({ httpReachable: ok, httpStatus: status, exited }, null, 2))
console.log('--- stdout ---')
console.log(stdout.split('\n').slice(0, 15).join('\n'))
if (stderr.trim()) {
  console.log('--- stderr ---')
  console.log(stderr.split('\n').slice(0, 15).join('\n'))
}

child.kill()
await new Promise((r) => setTimeout(r, 1500))
rmSync(HOME, { recursive: true, force: true })

const verdict = ok && (status === 200 || status === 401) ? 'PASS' : 'FAIL'
console.log('L0 判定:', verdict)
process.exit(verdict === 'PASS' ? 0 : 1)
