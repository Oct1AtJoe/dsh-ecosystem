/**
 * Git 提交流程暂存区隔离测试：
 *
 * 核心验证场景（用户真实操作还原）：
 * 变更区共 4 个文件（2 个已暂存，2 个未暂存）：
 *   1. f1-staged-new.ts   (新增且已暂存)
 *   2. f2-staged-mod.ts   (修改且已暂存)
 *   3. f3-unstaged-mod.ts (修改但未暂存)
 *   4. f4-unstaged-new.ts (新建未跟踪，未暂存)
 *
 * 断言：
 *   - 提交信息上下文仅读取暂存区改动；
 *   - 执行 commit 时，仅暂存的 2 个文件入库生成新提交；
 *   - 未暂存的另外 2 个文件绝对不被自动 add 或提交，提交后依然完好保留在工作区；
 *   - 暂存区为空时调用 commit 会被明确拒绝，返回 empty-stage 错误码，绝不误提交未暂存文件。
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GitService, type GitRunner } from '../src/host/git-service.ts'

const runner: GitRunner = {
  run(argv, cwd) {
    return new Promise((resolve) => {
      const child = spawn('git', [...argv], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = ''; let stderr = ''
      child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
      child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }))
    })
  },
}

const service = new GitService(runner, async (p) => ({ ok: true, canonical: p }))

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

async function git(cwd: string, argv: string[]): Promise<string> {
  const run = await runner.run(argv, cwd)
  if (run.exitCode !== 0) {
    throw new Error(`git ${argv.join(' ')} failed [exit ${run.exitCode}]: ${run.stderr || run.stdout}`)
  }
  return run.stdout
}

async function main(): Promise<void> {
  const repo = mkdtempSync(join(tmpdir(), 'gitpanel-stage-commit-'))
  try {
    // 1. 初始化空仓库并配置
    await git(repo, ['init', '-q'])
    await git(repo, ['config', 'user.email', 'tester@test.com'])
    await git(repo, ['config', 'user.name', 'Tester'])

    // 基础历史提交
    writeFileSync(join(repo, 'base.txt'), 'base content\n')
    writeFileSync(join(repo, 'f2-staged-mod.ts'), 'original f2\n')
    writeFileSync(join(repo, 'f3-unstaged-mod.ts'), 'original f3\n')
    await git(repo, ['add', '.'])
    await git(repo, ['commit', '-qm', 'chore: initial base commit'])

    // 2. 构造 4 个变更文件场景
    // (1) 新增并暂存
    writeFileSync(join(repo, 'f1-staged-new.ts'), 'export const f1 = 1\n')
    await git(repo, ['add', 'f1-staged-new.ts'])

    // (2) 修改并暂存
    writeFileSync(join(repo, 'f2-staged-mod.ts'), 'original f2\nmodified and staged\n')
    await git(repo, ['add', 'f2-staged-mod.ts'])

    // (3) 修改但不暂存
    writeFileSync(join(repo, 'f3-unstaged-mod.ts'), 'original f3\nmodified but UNSTAGED\n')

    // (4) 新建未跟踪且不暂存
    writeFileSync(join(repo, 'f4-unstaged-new.ts'), 'export const f4 = 4\n')

    // 验证当前状态：porcelain 应有 4 个变更（2个暂存、2个未暂存）
    const beforeStatus = await git(repo, ['status', '--porcelain'])
    check('提交前状态包含 4 个变更', beforeStatus.trim().split('\n').length === 4)
    check('f1-staged-new.ts 为已暂存新增 (A )', beforeStatus.includes('A  f1-staged-new.ts'))
    check('f2-staged-mod.ts 为已暂存修改 (M )', beforeStatus.includes('M  f2-staged-mod.ts'))
    check('f3-unstaged-mod.ts 为未暂存修改 ( M)', beforeStatus.includes(' M f3-unstaged-mod.ts'))
    check('f4-unstaged-new.ts 为未暂存未跟踪 (??)', beforeStatus.includes('?? f4-unstaged-new.ts'))

    // 3. 验证 stagedContext 只读取已暂存文件
    const stagedCtx = await service.stagedContext(repo)
    check('stagedContext 读取成功', stagedCtx.ok === true)
    if (stagedCtx.ok) {
      check('stagedContext 包含 f1-staged-new.ts', stagedCtx.diff.includes('f1-staged-new.ts'))
      check('stagedContext 包含 f2-staged-mod.ts', stagedCtx.diff.includes('f2-staged-mod.ts'))
      check('stagedContext 不包含未暂存的 f3-unstaged-mod.ts', !stagedCtx.diff.includes('f3-unstaged-mod.ts'))
      check('stagedContext 不包含未暂存的 f4-unstaged-new.ts', !stagedCtx.diff.includes('f4-unstaged-new.ts'))
    }

    // 4. 执行提交（只提供 commit 信息）
    const commitRes = await service.commit(repo, 'feat: only commit staged files')
    check('执行 commit 成功', commitRes.ok === true, commitRes.error?.message)

    // 5. 检查最新提交包含哪些文件
    const commitFiles = (await git(repo, ['show', '--name-only', '--format=', 'HEAD']))
      .trim()
      .split('\n')
      .filter((s) => s.trim() !== '')

    check('入库文件总数恰为 2 个', commitFiles.length === 2, JSON.stringify(commitFiles))
    check('f1-staged-new.ts 成功入库', commitFiles.includes('f1-staged-new.ts'))
    check('f2-staged-mod.ts 成功入库', commitFiles.includes('f2-staged-mod.ts'))
    check('未暂存的 f3-unstaged-mod.ts 绝未入库', !commitFiles.includes('f3-unstaged-mod.ts'))
    check('未暂存的 f4-unstaged-new.ts 绝未入库', !commitFiles.includes('f4-unstaged-new.ts'))

    // 6. 检查提交后工作区状态：未暂存的文件必须原样保留在变更区
    const afterStatus = await git(repo, ['status', '--porcelain'])
    check('已暂存的 f1-staged-new.ts 不再出现在状态中', !afterStatus.includes('f1-staged-new.ts'))
    check('已暂存的 f2-staged-mod.ts 不再出现在状态中', !afterStatus.includes('f2-staged-mod.ts'))
    check('未暂存的 f3-unstaged-mod.ts 依然完好保留在工作区 ( M)', afterStatus.includes(' M f3-unstaged-mod.ts'))
    check('未暂存的 f4-unstaged-new.ts 依然完好保留在工作区 (??)', afterStatus.includes('?? f4-unstaged-new.ts'))

    // 7. 边界检查：暂存区为空时再次调用 commit，断言被拦截阻止，返回 empty-stage
    const emptyCommit = await service.commit(repo, 'feat: should fail because stage is empty')
    check('暂存区为空时 commit 被拒绝', emptyCommit.ok === false)
    check('暂存区为空时返回 empty-stage 错误码', emptyCommit.error?.code === 'empty-stage', emptyCommit.error?.code)

    // 8. 边界检查：commit message 为空串时被拒绝
    const emptyMsgCommit = await service.commit(repo, '   ')
    check('commit message 为空串时被拒绝', emptyMsgCommit.ok === false)
    check('空 message 返回 empty-message 错误码', emptyMsgCommit.error?.code === 'empty-message')
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error('自检执行异常:', err)
  process.exit(1)
})
