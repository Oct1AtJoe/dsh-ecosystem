import { spawn } from 'node:child_process'
import { GitService, type GitRunner } from '../src/host/git-service.ts'

const runner: GitRunner = {
  run(argv, cwd) {
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

const service = new GitService(runner, async (path) => ({ ok: true, canonical: path }))

async function run() {
  const headRun = await runner.run(['rev-parse', 'HEAD'], 'C:/dsh-ecosystem')
  const sha = headRun.stdout.trim()
  const detail = await service.commitDetail('C:/dsh-ecosystem', sha)

  if (!detail.sha || !detail.subject) {
    throw new Error('detail missing sha or subject')
  }
  if (detail.files.length === 0) {
    throw new Error('files count should not be 0')
  }
  const first = detail.files[0]!
  const diff = await service.commitFileDiff('C:/dsh-ecosystem', sha, first.path, first.oldPath)
  if (diff.path !== first.path) {
    throw new Error('diff path mismatch')
  }
  console.log('✅ Commit review API verification passed successfully.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
