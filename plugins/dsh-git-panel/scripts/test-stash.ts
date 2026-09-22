/**
 * 储藏抽屉的自检：收纳范围 + 抽屉文件数统计。
 *
 * 锁定的回归（两条都是实测确认过的行为）：
 *
 * 1. 裸 `git stash push` **不收未跟踪文件**，于是点「储藏改动」后新建的文件还留在
 *    工作区，看起来像没生效。必须带 `-u`，让已暂存 / 未暂存已跟踪 / 未跟踪三类
 *    一并收走，工作区回到干净。
 * 2. `git stash show --name-only` **默认不列未跟踪文件**（-u 产生的储藏把未跟踪
 *    部分挂在第三个 parent 上），必须显式加 `--include-untracked`，否则
 *    「已储藏 5 个文件」会被算成 2 个——数字直接骗人。
 *
 * 用 esbuild 打包后由 node 运行，无需 DSH 运行时。
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { realpath } from 'node:fs/promises'
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

const service = new GitService(runner, async (p) => ({ ok: true, canonical: await realpath(p) }))

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

/** 造仓库：已暂存 1 + 未暂存已跟踪 1 + 未跟踪 3（含目录内文件）。 */
async function makeRepo(): Promise<{ repo: string; cleanup: () => void; git: (a: string[]) => Promise<void> }> {
  const repo = mkdtempSync(join(tmpdir(), 'gitpanel-stash-'))
  const git = async (argv: string[]): Promise<void> => {
    const r = await runner.run(argv, repo)
    if (r.exitCode !== 0) throw new Error(`git ${argv.join(' ')}: ${r.stderr}`)
  }
  await git(['init', '-q'])
  await git(['config', 'user.email', 'test@test.com'])
  await git(['config', 'user.name', 'Tester'])
  writeFileSync(join(repo, 'staged.txt'), 'v1\n')
  writeFileSync(join(repo, 'tracked.txt'), 'v1\n')
  await git(['add', '.'])
  await git(['commit', '-qm', 'feat: init'])

  writeFileSync(join(repo, 'staged.txt'), 'v1\nstaged-edit\n')
  await git(['add', 'staged.txt'])                       // 已暂存
  writeFileSync(join(repo, 'tracked.txt'), 'v1\nunstaged\n')  // 未暂存（已跟踪）
  writeFileSync(join(repo, 'untracked.txt'), 'new\n')    // 未跟踪
  mkdirSync(join(repo, 'newdir'))
  writeFileSync(join(repo, 'newdir', 'a.txt'), 'a\n')    // 未跟踪（目录内）
  writeFileSync(join(repo, 'newdir', 'b.txt'), 'b\n')    // 未跟踪（目录内）

  return { repo, cleanup: () => rmSync(repo, { recursive: true, force: true }), git }
}

const changesOf = async (repo: string): Promise<number> => {
  const r = await service.fileStatus(repo)
  return r.ok ? r.value.entries.length : -1
}

async function main(): Promise<void> {
  // ---- 场景 1：stashPush 必须收走全部 5 个变更（含 3 个未跟踪） ----
  {
    const { repo, cleanup } = await makeRepo()
    try {
      const before = await changesOf(repo)
      check('收纳前有 5 个变更', before === 5, String(before))

      const pushed = await service.stashPush(repo)
      check('stashPush 成功', pushed.ok, pushed.ok ? '' : pushed.error.message)

      const after = await changesOf(repo)
      check('收纳后工作区干净（未跟踪也被收走）', after === 0, `剩余 ${after} 个`)

      // ---- 场景 2：抽屉文件数必须算全 5 个（含未跟踪） ----
      const summary = await service.stashSummary(repo)
      check('stashSummary 成功', summary.ok, summary.ok ? '' : summary.error.message)
      if (summary.ok) {
        check('抽屉条目数为 1', summary.entries === 1, String(summary.entries))
        check('抽屉文件数为 5（含未跟踪）', summary.files === 5, `实际 ${summary.files}（若为 2 说明漏了 --include-untracked）`)
      }

      // ---- 场景 3：pop 之后变更应全部回来 ----
      const popped = await service.stashPop(repo)
      check('stashPop 成功', popped.ok, popped.ok ? '' : popped.error.message)
      const restored = await changesOf(repo)
      check('恢复后 5 个变更全部回来', restored === 5, String(restored))

      const afterPop = await service.stashSummary(repo)
      check('pop 后抽屉清空', afterPop.ok && afterPop.entries === 0 && afterPop.files === 0,
        afterPop.ok ? JSON.stringify(afterPop) : afterPop.error.message)
    } finally {
      cleanup()
    }
  }

  // ---- 场景 4：多份储藏时文件数应累加，且空抽屉报 0 ----
  {
    const { repo, cleanup, git } = await makeRepo()
    try {
      const empty = await service.stashSummary(repo)
      check('空抽屉：条目 0 / 文件 0', empty.ok && empty.entries === 0 && empty.files === 0,
        empty.ok ? JSON.stringify(empty) : empty.error.message)

      await service.stashPush(repo, '第一轮')   // 5 个文件
      writeFileSync(join(repo, 'second.txt'), 'second\n')
      writeFileSync(join(repo, 'tracked.txt'), 'v1\nsecond-round\n')
      await git(['add', 'tracked.txt'])
      await service.stashPush(repo, '第二轮')   // 2 个文件

      const two = await service.stashSummary(repo)
      check('两份储藏：条目 2 / 文件 7', two.ok && two.entries === 2 && two.files === 7,
        two.ok ? JSON.stringify(two) : two.error.message)
    } finally {
      cleanup()
    }
  }

  // ---- 场景 5：无改动时储藏应失败（不该留下空抽屉条目） ----
  {
    const { repo, cleanup } = await makeRepo()
    try {
      await service.stashPush(repo)
      const clean = await service.stashPush(repo)
      check('工作区干净时再储藏不新增条目', !clean.ok || (await service.stashSummary(repo)).ok === true,
        clean.ok ? 'git 接受了（已记录）' : clean.error.message)
    } finally {
      cleanup()
    }
  }
}

main().catch((error) => { console.error('测试失败:', error); process.exit(1) })
