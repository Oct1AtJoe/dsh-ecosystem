/**
 * 提交审查服务回归：正确性 + 父提交缓存命中（省掉重复 rev-list 进程）。
 * 运行：npx esbuild scripts/test-review.ts --bundle --platform=node --format=esm | node --input-type=module
 */
import { spawn } from 'node:child_process'
import { GitService, type GitRunner } from '../src/host/git-service.ts'

const calls: string[] = []

const runner: GitRunner = {
  run(argv, cwd) {
    calls.push(argv.join(' '))
    return new Promise((resolve) => {
      const child = spawn('git', [...argv], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
      child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }))
    })
  },
}

const CWD = 'C:/dsh-ecosystem'
const service = new GitService(runner, async (path) => ({ ok: true, canonical: path }))

async function run() {
  const headRun = await runner.run(['rev-parse', 'HEAD'], CWD)
  const sha = headRun.stdout.trim()
  const detail = await service.commitDetail(CWD, sha)

  if (!detail.sha || !detail.subject) throw new Error('detail missing sha or subject')
  if (detail.files.length === 0) throw new Error('files count should not be 0')

  const first = detail.files[0]!
  const revListBefore = calls.filter((c) => c.startsWith('rev-list ')).length

  const diff = await service.commitFileDiff(CWD, sha, first.path, first.oldPath)
  if (diff.path !== first.path) throw new Error('diff path mismatch')
  if (diff.oldContent === '' && diff.newContent === '') throw new Error('both sides empty')

  // commitDetail 已解析父提交：此处不应再跑 rev-list
  const revListAfter = calls.filter((c) => c.startsWith('rev-list ')).length
  if (revListAfter !== revListBefore) {
    throw new Error(`expected no extra rev-list call, got ${revListAfter - revListBefore}`)
  }

  // 第二次取同一文件必须走缓存：不再新增任何 git 进程
  const totalBefore = calls.length
  const again = await service.commitFileDiff(CWD, sha, first.path, first.oldPath)
  if (again !== diff) throw new Error('second call should return the cached object')
  if (calls.length !== totalBefore) {
    throw new Error(`cache miss: ${calls.length - totalBefore} extra git call(s)`)
  }

  console.log('✅ Commit review API + cache verification passed.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
