/**
 * 宿主侧 git 服务：以工作区为边界约束的 git 操作，通过托管子进程接缝执行。
 * 浏览器只能在已注册的工作区根目录上运行 git（工作区门禁是 /git-panel
 * 各路由的安全边界）。
 * @module dsh-git-panel/host/git-service
 */

import { spawn } from 'node:child_process'
import { readFile as readBytes, realpath, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, relative as relativePath, resolve as resolvePath, sep } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-subprocess'
import type { SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type { BranchesView, BranchRow, CommitDetail, CommitFileDiffResult, CommitFileItem, FileNumstat, FileStatusView, GitError, GraphCommit, GraphTips, GraphView, OpResult, WorkspaceFileRead } from '../core/types.ts'

/** 一次已完成的 git 调用。 */
export interface GitRunResult {
  exitCode: number | null
  stdout: string
  stderr: string
}

/** git 经过的 spawn 接缝（生产环境中即子进程服务）。 */
export interface GitRunner {
  run(argv: readonly string[], cwd: string): Promise<GitRunResult>
  /** 中止当前在飞的 git 进程（用于面板上的「取消」按钮，避免只能干等超时）。 */
  cancel?(): void
}

/** 单条 git 命令的收集输出上限。 */
const OUTPUT_CAP_BYTES = 1 << 20

/** 送入浏览器做差异对比的文本上限（超出部分截断，避免把大文件塞进 JSON）。 */
const DIFF_TEXT_CAP_BYTES = 1 << 21

/** git 的空树对象 id：根提交没有父时用它作为 diff 基线。 */
const EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/** 提交内容不可变，缓存条目数上限（超出后整体清空，简单且够用）。 */
const COMMIT_CACHE_LIMIT = 400

/**
 * 工作区相对路径的安全判定：拒绝绝对路径与任何向上穿越。
 * @param name - 调用方给出的文件路径。
 * @returns 可以安全地拼到工作区根之下时为 true。
 */
function safeRelative(name: string): boolean {
  if (name === '' || name.startsWith('/') || name.startsWith('\\')) return false
  if (/^[a-zA-Z]:/u.test(name)) return false
  if (name === '..' || name.startsWith('../') || name.includes('/../') || name.endsWith('/..')) return false
  return true
}

/**
 * 绝对路径是否落在工作区根之下。
 * @param root - 工作区根。
 * @param absolute - 待判定的绝对路径。
 * @returns 在根之下（或就是根本身）时为 true。
 */
function inside(root: string, absolute: string): boolean {
  if (absolute === root) return true
  return absolute.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)
}

/** 解析 git diff --numstat 的重命名路径（如 "a => b" 或 "src/{old => new}.ts"）。 */
function resolveNumstatRename(path: string): string {
  if (path.includes('{') && path.includes('}')) {
    return path.replace(/\{[^{}]*=>\s*([^{}]*)\}/g, '$1').replace(/\/\//g, '/').trim()
  }
  const parts = path.split('=>')
  if (parts.length === 2) {
    return parts[1]!.trim()
  }
  return path
}

/** 解析 git diff --numstat 的输出为路径到增减行数的映射。 */
function parseNumstat(output: string): Record<string, FileNumstat> {
  const result: Record<string, FileNumstat> = Object.create(null)
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const insStr = parts[0]!.trim()
    const delStr = parts[1]!.trim()
    const rawPath = parts.slice(2).join('\t').trim()
    if (!rawPath) continue

    const insertions = insStr === '-' ? 0 : (parseInt(insStr, 10) || 0)
    const deletions = delStr === '-' ? 0 : (parseInt(delStr, 10) || 0)
    const stat: FileNumstat = { insertions, deletions }

    result[rawPath] = stat

    if (rawPath.includes('=>')) {
      const newPath = resolveNumstatRename(rawPath)
      if (newPath && newPath !== rawPath) {
        result[newPath] = stat
      }
      const porcelainArrow = rawPath.replace('=>', '->')
      result[porcelainArrow] = stat
    }
  }
  return result
}

/** 快速统计文本文件行数；二进制或超 2MB 文件返回 undefined。 */
async function countFileLines(fullPath: string): Promise<number | undefined> {
  try {
    const s = await stat(fullPath)
    if (!s.isFile() || s.size > 2 * 1024 * 1024) return undefined
    const buf = await readBytes(fullPath)
    if (buf.includes(0)) return undefined
    let lines = 0
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 10) lines++
    }
    if (buf.length > 0 && buf[buf.length - 1] !== 10) lines++
    return lines
  } catch {
    return undefined
  }
}

/** 工作区归属判定结果。 */
export type WorkspaceVerdict = { ok: true; canonical: string } | { ok: false; error: GitError }

/** 规范化路径并要求其等于一个已注册的工作区根目录。 */
export type WorkspaceGate = (path: string) => Promise<WorkspaceVerdict>

/** 基于原生 child_process 的生产运行器，支持环境变量完整透传与网络超时。 */
export function subprocessRunner(_ctx: Context): GitRunner {
  let current: ReturnType<typeof spawn> | null = null
  // Windows 上 CreateProcess 相互竞争会显著变慢：一次面板刷新会同时要 12 个以上
  // git 进程，实测单次从 60ms 涨到 300ms 以上，把宿主事件循环按住一两秒。
  // 这里做全局并发闸，超出的排队等待，不再一起 fork。
  const MAX_CONCURRENT = 3
  let active = 0
  const waiters: Array<() => void> = []
  const acquire = async (): Promise<void> => {
    while (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => { waiters.push(resolve) })
    active += 1
  }
  const release = (): void => {
    active -= 1
    waiters.shift()?.()
  }
  return {
    cancel() {
      if (current !== null) {
        current.kill('SIGTERM')
        current = null
      }
    },
    async run(argv, cwd) {
      // 网络操作最长占 90 秒，若参与并发闸会把后续的面板刷新全部堵在队列里；
      // 前端对 pull/fetch/push 另有 in-flight 保护，同一时刻最多一个。
      const networkOp = argv.includes('pull') || argv.includes('fetch')
        || argv.includes('push') || argv.includes('clone')
      if (!networkOp) await acquire()
      // 槽位只归还一次：spawn 同步抛错时 Promise 会 reject，没有 close/error 事件。
      let released = false
      const once = (): void => {
        if (released) return
        released = true
        if (!networkOp) release()
      }
      try {
        return await new Promise((resolve) => {
        // 对齐 VS Code git 扩展的执行约定（extensions/git/src/git.ts）：
        //   options.stdio = ['ignore', null, null]   → stdin 丢弃，git 永远无法交互式提问
        //   LANGUAGE/LC_ALL/LANG = en_US.UTF-8       → 输出语言稳定（错误信息可被可靠解析）
        //   GIT_PAGER = 'cat'                        → 后台不启用分页器
        // VS Code 自己**完全不管凭据**：不写凭据文件、不改 remote URL、不清空 helper 链，
        // 认证交给系统已配置的凭据助手（macOS 上通常是 GCM / osxkeychain）。这里同样如此，
        // 仅在用户主动通过面板保存过凭据时，额外挂一个 git 原生 `store` 助手。
        const isWindows = process.platform === 'win32'
        const homeDir = homedir()
        // POSIX 下必须保留真实 HOME，否则 git 读不到 ~/.gitconfig 与 ~/.ssh，
        // 只能回落到系统级凭据助手；Windows 上则补全这些变量。
        const env = {
          ...process.env,
          ...(isWindows
            ? {
                USERPROFILE: process.env.USERPROFILE || homeDir,
                HOME: process.env.HOME || process.env.USERPROFILE || homeDir,
                APPDATA: process.env.APPDATA || `${homeDir}\\AppData\\Roaming`,
                LOCALAPPDATA: process.env.LOCALAPPDATA || `${homeDir}\\AppData\\Local`,
              }
            : {}),
          // 后台进程绝不进入交互式提示：没有 TTY，一旦发问就会挂到超时。
          GIT_TERMINAL_PROMPT: '0',
          // GCM 的 GUI 对话框需要有桌面会话；本进程由 launchd 后台拉起，
          // 弹窗可能无人应答而卡死，因此明确禁掉 GUI，让它直接报错。
          GCM_INTERACTIVE: 'never',
          GCM_MODAL_PROMPT: 'false',
          // VS Code 同款：强制英文输出 + 不分页。
          LANGUAGE: 'en',
          LC_ALL: 'en_US.UTF-8',
          LANG: 'en_US.UTF-8',
          GIT_PAGER: 'cat',
          // 企业内网 GitLab 不走代理，直连更快。
          NO_PROXY: '*sjfood.us,localhost,127.0.0.1',
          no_proxy: '*sjfood.us,localhost,127.0.0.1',
        }
        // 充裕合理的 90 秒网络超时：给多分支与大体积提交留足下载空间
        const isNetworkOp = argv.includes('pull') || argv.includes('fetch') || argv.includes('push') || argv.includes('clone')
        const timeout = isNetworkOp ? 90000 : 20000

        // 凭据：默认完全交给系统助手（VS Code 行为）。只有用户主动在面板里保存过
        // 凭据（~/.git-credentials 存在）时，才额外挂上 git 原生的 store 助手 ——
        // 注意此处不清空继承的 helper 链，顺序上 store 会先命中，未命中则继续交给系统助手。
        const credPath = join(homeDir, '.git-credentials')
        // git 对 `-c key=value` 的值会做一层转义解析，Windows 的反斜杠会被吃掉，
        // 导致 store 助手指向不存在的路径 → 凭据永远取不到、每次拉取都重新询问。
        // 必须换成正斜杠；Node 的 fs 在 Windows 上同样接受正斜杠，故 existsSync 不受影响。
        const credArgPath = credPath.replace(/\\/g, '/')
        const credArgs = existsSync(credPath)
          ? [
              '-c', `credential.helper=store --file=${credArgPath}`,
              // 我们的凭据按主机存（https://user:pass@host）；若开了 useHttpPath，
              // git 会要求按仓库路径精确匹配从而永远取不到，这里显式关闭。
              '-c', 'credential.useHttpPath=false',
            ]
          : []
        const fullArgv = [...credArgs, ...(argv as string[])]
        let timedOut = false
        // VS Code 同款：stdio[0]='ignore' → git 拿不到 stdin，无法交互式提问，只会直接失败。
        const child = spawn('git', fullArgv, {
          cwd,
          windowsHide: true,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        current = child

        const MAX = OUTPUT_CAP_BYTES
        let stdout = ''
        let stderr = ''
        let settled = false
        child.stdout?.setEncoding('utf8')
        child.stderr?.setEncoding('utf8')
        child.stdout?.on('data', (chunk: string) => { if (stdout.length < MAX) stdout += chunk })
        child.stderr?.on('data', (chunk: string) => { if (stderr.length < MAX) stderr += chunk })

        // 网络操作 90 秒、其余 20 秒：超时即 kill，避免后台 git 无限期挂起。
        const timer = setTimeout(() => {
          timedOut = true
          try { child.kill('SIGTERM') } catch { /* noop */ }
        }, timeout)

        const finish = (exitCode: number): void => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          current = null
          once()
          if (exitCode !== 0) {
            let errMsg = stderr.trim() !== '' ? stderr.trim() : `git exited with code ${exitCode}`
            if (timedOut) {
              // 稳定的机器可读前缀：客户端据此本地化（E_TIMEOUT → 对应语言文案）。
              errMsg = 'E_TIMEOUT: operation timed out'
            }
            resolve({ exitCode, stdout, stderr: errMsg })
          } else {
            resolve({ exitCode: 0, stdout, stderr })
          }
        }

        child.on('error', (err: Error) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          current = null
          once()
          resolve({ exitCode: 1, stdout, stderr: err.message || String(err) })
        })
        child.on('close', (code: number | null) => finish(code ?? 1))
        })
      } catch (error) {
        once()
        throw error
      }
    },
  }
}


/**
 * git --format 输出的记录/字段分隔符。NUL 是常规选择，但 Node 禁止在
 * spawn argv 中出现 NUL——子进程服务同样会拒绝——因此记录用 \x1e、字段用
 * \x1f（实际中 git 不会产生这些字符）。git 会在每条记录后追加换行，所以
 * 除第一条外的每条拆分记录都以 "\n" 开头——在 splitRecords 中剥离。
 */
const REC = '\u001e'
const FIELD = '\u001f'
/** 转义会破坏输出的控制字符（分隔符除外）。 */
function sanitize(text: string): string {
  return text.replace(/[\u0000-\u001d\u007f]/g, ' ')
}

/** 将 git --format 流拆分为记录，去掉每条记录自带的换行。 */
function splitRecords(text: string): string[] {
  return text
    .split(REC)
    .map((record) => (record.startsWith('\n') ? record.slice(1) : record))
    .filter((record) => record !== '')
}

/** 以工作区为边界约束的 git 服务。 */
export class GitService {
  /**
   * 提交级缓存：提交内容（含父提交 id 与文件内容）一经产生永不改变，
   * 因此可以安全地按 commit sha 长期缓存，避免重复 fork git 进程。
   */
  private readonly commitParentCache = new Map<string, string>()
  private readonly commitFileDiffCache = new Map<string, CommitFileDiffResult>()
  /**
   * 工作区根与 git 目录：同一工作区的 rev-parse 结果不会变，但每次
   * status/fileStatus 都会重新 fork 一次 git（Windows 约 60ms）。按 canonical
   * 缓存 Promise，顺带合并并发首算。
   */
  private readonly roots = new Map<string, Promise<{ toplevel: string; gitDir: string }>>()
  /** 当前分支短名：一次面板刷新里 branches/graph/current 会各问一遍。 */
  private readonly branchCache = new Map<string, { at: number; value: string }>()
  /** 文件树徽章轮询的短缓存。2 秒内重复询问直接返回，不再 fork git。 */
  private readonly fileStatusCache = new Map<string, { at: number; value: FileStatusView }>()

  constructor(
    public readonly runner: GitRunner,
    private readonly gate: WorkspaceGate,
  ) {}

  /** 缓存写入：超限时整体清空（提交级缓存无失效语义，粗暴清空即可）。 */
  private cacheSet<T>(map: Map<string, T>, key: string, value: T): void {
    if (map.size >= COMMIT_CACHE_LIMIT) map.clear()
    map.set(key, value)
  }

  private async requireWorkspace(path: string): Promise<string> {
    const verdict = await this.gate(path)
    if (!verdict.ok) throw Object.assign(new Error(verdict.error.message), { gitError: verdict.error })
    return verdict.canonical
  }

  /** 解析仓库显示名（顶层目录的基名）。 */
  private async repoName(canonical: string): Promise<string> {
    // toplevel 已经由 rootsOf 缓存，不必每轮重新 rev-parse。
    const { toplevel } = await this.rootsOf(canonical)
    return toplevel.split(/[\\/]/).pop() ?? canonical
  }

  /** 当前分支短名（HEAD 游离时为空）。1 秒内重复询问复用上一次结果。 */
  async currentBranch(canonical: string): Promise<string> {
    const cached = this.branchCache.get(canonical)
    const now = Date.now()
    if (cached !== undefined && now - cached.at < 1000) return cached.value
    const run = await this.runner.run(['symbolic-ref', '--quiet', '--short', 'HEAD'], canonical)
    const value = run.exitCode === 0 ? run.stdout.trim() : ''
    this.branchCache.set(canonical, { at: now, value })
    return value
  }

  /** 轻量级当前分支探测（一次或两次 git 调用），用于 chip 标签。 */
  async current(path: string): Promise<{ repo: string; current: string }> {
    const canonical = await this.requireWorkspace(path)
    const [repo, current] = await Promise.all([
      this.repoName(canonical),
      this.currentBranch(canonical),
    ])
    return { repo, current }
  }

  /** 带 ahead/behind 相对上游的分支列表。 */
  async branches(path: string): Promise<BranchesView> {
    const canonical = await this.requireWorkspace(path)
    const [repo, current] = await Promise.all([
      this.repoName(canonical),
      this.currentBranch(canonical),
    ])

    // 一趟遍历本地 + 远程引用。下面会剥离完整引用名
    // （refname:short 会抹掉 heads/remotes 的区别）。
    const run = await this.runner.run(
      ['for-each-ref', '--sort=-committerdate', '--format=' + `%(refname)${FIELD}%(objectname:short)${FIELD}%(committerdate:iso8601)${FIELD}%(subject)${FIELD}%(upstream:short)${FIELD}%(upstream:track)${REC}`, 'refs/heads', 'refs/remotes'],
      canonical,
    )
    if (run.exitCode !== 0) {
      throw Object.assign(
        new Error(run.stderr.trim() || 'not a git repository'),
        { gitError: { code: 'not-a-repo', message: run.stderr.trim() || 'not a git repository' } },
      )
    }
    const local: BranchRow[] = []
    const remote: BranchRow[] = []

    for (const record of splitRecords(run.stdout)) {
      const [ref, sha, date, subject, upstream, track] = record.split(FIELD)
      if (!ref || !sha) continue
      const isRemote = ref.startsWith('refs/remotes/')
      const name = isRemote ? ref.slice('refs/remotes/'.length) : ref.slice('refs/heads/'.length)
      const row: BranchRow = {
        name: sanitize(name),
        sha: sanitize(sha),
        date: sanitize(date),
        subject: sanitize(subject ?? '').slice(0, 80),
        current: !isRemote && name === current,
      }
      // %(upstream:track) 形如 "[ahead 2, behind 1]"，与上游同步时为空串。
      // 一趟 for-each-ref 就带回所有跟踪分支的领先/落后，不必逐分支 rev-list
      // （Windows 上每次 fork 都是固定的六十毫秒级开销）。
      if (!isRemote && upstream) {
        row.ahead = Number(/ahead (\d+)/.exec(track ?? '')?.[1] ?? 0)
        row.behind = Number(/behind (\d+)/.exec(track ?? '')?.[1] ?? 0)
      }
      if (isRemote) {
        remote.push(row)
      } else {
        local.push(row)
      }
    }

    const sortRows = (rows: BranchRow[]): BranchRow[] => {
      rows.sort((x, y) => {
        if (x.name === current) return -1
        if (y.name === current) return 1
        const tx = Date.parse(x.date) || 0
        const ty = Date.parse(y.date) || 0
        if (ty !== tx) return ty - tx
        return x.name.localeCompare(y.name)
      })
      return rows
    }

    return { repo, current, local: sortRows(local), remote: sortRows(remote) }
  }

  /** 切换到已存在的分支（或为远程分支创建本地跟踪分支）。 */
  async switchBranch(path: string, branch: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const argv: string[] = branch.startsWith('origin/')
      ? ['switch', '-c', branch.slice('origin/'.length), '--track', branch]
      : ['switch', branch]
    const run = await this.runner.run(argv, canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'switch-failed', message: run.stderr.trim() || `git switch ${branch} failed` } }
    }
    this.branchCache.delete(canonical)
    return { ok: true, output: run.stdout.trim() }
  }

  /** 拉取当前分支（使用其上游）。 */
  async pull(path: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['pull'], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'pull-failed', message: run.stderr.trim() || 'git pull failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 拉取所有远程，并执行 prune。 */
  async fetchAll(path: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['fetch', '--all', '--prune'], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'fetch-failed', message: run.stderr.trim() || 'git fetch failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 重命名本地分支（git branch -m）。 */
  async renameBranch(path: string, from: string, to: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['branch', '-m', from, to], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'rename-failed', message: run.stderr.trim() || 'git branch -m failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 强制删除本地分支（git branch -D）。 */
  async deleteBranch(path: string, branch: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['branch', '-D', branch], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'delete-failed', message: run.stderr.trim() || 'git branch -D failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 删除远程分支（git push <remote> --delete <name>）。 */
  async deleteRemoteBranch(path: string, branch: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const slash = branch.indexOf('/')
    if (slash <= 0 || slash === branch.length - 1) {
      return { ok: false, output: '', error: { code: 'bad-branch', message: `invalid remote branch: ${branch}` } }
    }
    const remote = branch.slice(0, slash)
    const name = branch.slice(slash + 1)
    const run = await this.runner.run(['push', remote, '--delete', name], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'delete-failed', message: run.stderr.trim() || 'git push --delete failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 将某分支合入当前分支（git merge --no-edit）。 */
  async mergeBranch(path: string, branch: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['merge', '--no-edit', branch], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'merge-failed', message: run.stderr.trim() || 'git merge failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 工作区状态摘要：变更文件列表（git status --porcelain）、增减行统计，并自动读取 MERGE_MSG。 */
  async status(path: string): Promise<{
    ok: boolean
    output: string
    mergeMsg?: string
    stagedStats?: Record<string, FileNumstat>
    unstagedStats?: Record<string, FileNumstat>
    error?: { code: string; message: string }
  }> {
    const canonical = await this.requireWorkspace(path)
    // 必须带 --untracked-files=all，且必须与 fileStatus() 用同一组参数。
    // 并行拉取 porcelain 状态与未暂存/已暂存的增减行统计（禁用 quotepath 以保证中文路径对齐）
    const [run, diffRun, cachedDiffRun] = await Promise.all([
      this.runner.run(['status', '--porcelain', '--untracked-files=all'], canonical),
      this.runner.run(['-c', 'core.quotepath=false', 'diff', '--numstat'], canonical),
      this.runner.run(['-c', 'core.quotepath=false', 'diff', '--cached', '--numstat'], canonical),
    ])
    if (run.exitCode !== 0) {
      return { ok: false, output: '', error: { code: 'status-failed', message: run.stderr.trim() || 'git status failed' } }
    }
    const lines = run.stdout.split('\n').filter((l) => l.trim() !== '')
    // 原样返回 porcelain 行：每行固定「XY<空格>路径」，未暂存修改的 X 位本身就是空格
    // （如 " M src/a.ts"）。任何 /^(\S+)\s+/ 形式的重排都会把这类行整行丢掉，
    // 因此这里不做任何改写，解析交给客户端按固定宽度处理。
    const output = lines.join('\n')

    const unstagedStats = diffRun.exitCode === 0 ? parseNumstat(diffRun.stdout) : {}
    const stagedStats = cachedDiffRun.exitCode === 0 ? parseNumstat(cachedDiffRun.stdout) : {}

    // 针对未跟踪文件（??），git diff 默认不包含；为小于 2MB 的普通文本文件补充增行统计
    const untrackedFiles: string[] = []
    for (const line of lines) {
      if (line.startsWith('?? ')) {
        const file = line.slice(3).trim()
        if (file && safeRelative(file)) untrackedFiles.push(file)
      }
    }
    if (untrackedFiles.length > 0) {
      const batch = untrackedFiles.slice(0, 50)
      await Promise.all(batch.map(async (file) => {
        const full = resolvePath(canonical, file)
        if (!inside(canonical, full)) return
        const linesCount = await countFileLines(full)
        if (typeof linesCount === 'number') {
          unstagedStats[file] = { insertions: linesCount, deletions: 0 }
        }
      }))
    }

    // 像 VS Code 一样：检查是否有 .git/MERGE_MSG 并自动读取
    let mergeMsg = ''
    try {
      const { gitDir } = await this.rootsOf(canonical)
      const mergeMsgPath = join(gitDir, 'MERGE_MSG')
      if (existsSync(mergeMsgPath)) {
        mergeMsg = readFileSync(mergeMsgPath, 'utf8').split('\n')[0].trim()
      }
    } catch {}

    return { ok: true, output, mergeMsg, stagedStats, unstagedStats }
  }

  /** 单个文件暂存（git add -- <file>）。 */
  async stageFile(path: string, file: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (name === '' || name.startsWith('/') || name === '..' || name.includes('/../')) {
      return { ok: false, output: '', error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const run = await this.runner.run(['add', '--', name], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'stage-failed', message: run.stderr.trim() || 'git add failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 取消单个文件暂存（git reset HEAD -- <file> 或 git restore --staged -- <file>）。 */
  async unstageFile(path: string, file: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (name === '' || name.startsWith('/') || name === '..' || name.includes('/../')) {
      return { ok: false, output: '', error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const run = await this.runner.run(['reset', 'HEAD', '--', name], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'unstage-failed', message: run.stderr.trim() || 'git reset failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 放弃工作区未暂存修改（git checkout -- <file> 或 git clean for untracked）。 */
  async discardFile(path: string, file: string, untracked: boolean): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (name === '' || name.startsWith('/') || name === '..' || name.includes('/../')) {
      return { ok: false, output: '', error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const argv = untracked ? ['clean', '-fd', '--', name] : ['checkout', '--', name]
    const run = await this.runner.run(argv, canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'discard-failed', message: run.stderr.trim() || 'discard failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 单个文件的变更 diff（已暂存 + 未暂存，git diff HEAD -- <file>）。 */
  async diffFile(path: string, file: string): Promise<{ ok: boolean; output: string; error?: { code: string; message: string } }> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (name === '' || name.startsWith('/') || name === '..' || name.includes('/../')) {
      return { ok: false, output: '', error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const run = await this.runner.run(['diff', 'HEAD', '--', name], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: '', error: { code: 'diff-failed', message: run.stderr.trim() || 'git diff failed' } }
    }
    return { ok: true, output: run.stdout }
  }

  /**
   * 暂存区（staged）的变更内容，外加仓库最近的提交主题。
   *
   * 自动生成提交信息只需这两样：`git diff --cached` 说明「改了什么」，
   * 最近的主题说明「这个仓库怎么写提交信息」（语言 / 前缀 / 语气）。
   * 暂存区为空时 diff 为空串，由调用方据此给出提示且不触发生成。
   */
  async stagedContext(path: string): Promise<{ ok: true; diff: string; subjects: string[] } | { ok: false; error: GitError }> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['diff', '--cached'], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, error: { code: 'diff-failed', message: run.stderr.trim() || 'git diff --cached failed' } }
    }
    // 首条提交之前 log 会失败（无可引用的 HEAD），那不是错误，只是没有可模仿的先例。
    const log = await this.runner.run(['log', '-5', '--format=%s'], canonical)
    const subjects = log.exitCode === 0
      ? log.stdout.split('\n').map((line) => line.trim()).filter((line) => line !== '')
      : []
    return { ok: true, diff: run.stdout, subjects }
  }

  /** 获取文件 HEAD 版本的内容（git show HEAD:<仓库相对路径>）。 */
  async showHead(path: string, file: string): Promise<{ ok: boolean; output: string; error?: { code: string; message: string } }> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (!safeRelative(name)) {
      return { ok: false, output: '', error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const { toplevel } = await this.rootsOf(canonical)
    const absolute = resolvePath(canonical, name)
    if (!inside(canonical, absolute)) {
      return { ok: false, output: '', error: { code: 'outside-workspace', message: '文件位于工作区外' } }
    }
    const tracked = relativePath(toplevel, absolute).split(sep).join('/')
    const run = await this.runner.run(['show', `HEAD:${tracked}`], toplevel)
    if (run.exitCode !== 0) {
      return { ok: false, output: '', error: { code: 'show-failed', message: run.stderr.trim() || 'git show HEAD failed' } }
    }
    return { ok: true, output: run.stdout }
  }

  /** 读取工作区文件的当前内容（UTF-8）；二进制与超限文件只回报元数据。 */
  async readFile(path: string, file: string): Promise<WorkspaceFileRead> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (!safeRelative(name)) {
      return { ok: false, text: '', bytes: 0, binary: false, truncated: false, error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const absolute = resolvePath(canonical, name)
    if (!inside(canonical, absolute)) {
      return { ok: false, text: '', bytes: 0, binary: false, truncated: false, error: { code: 'outside-workspace', message: '文件位于工作区外' } }
    }
    try {
      const info = await stat(absolute)
      if (info.isDirectory()) {
        return { ok: false, text: '', bytes: 0, binary: false, truncated: false, error: { code: 'not-a-file', message: '这是一个目录' } }
      }
      const buffer = await readBytes(absolute)
      const binary = buffer.includes(0)
      const truncated = buffer.byteLength > DIFF_TEXT_CAP_BYTES
      const slice = truncated ? buffer.subarray(0, DIFF_TEXT_CAP_BYTES) : buffer
      return {
        ok: true,
        text: binary ? '' : slice.toString('utf8'),
        bytes: buffer.byteLength,
        binary,
        truncated,
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return { ok: true, text: '', bytes: 0, binary: false, truncated: false, missing: true }
      }
      return {
        ok: false,
        text: '',
        bytes: 0,
        binary: false,
        truncated: false,
        error: { code: 'read-failed', message: error instanceof Error ? error.message : '读取失败' },
      }
    }
  }

  /** 保存文件内容（冲突解决或编辑回写）。 */
  async saveFile(path: string, file: string, content: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const name = file.trim()
    if (!safeRelative(name)) {
      return { ok: false, output: '', error: { code: 'invalid-file', message: '非法文件路径' } }
    }
    const absolute = resolvePath(canonical, name)
    if (!inside(canonical, absolute)) {
      return { ok: false, output: '', error: { code: 'outside-workspace', message: '文件位于工作区外' } }
    }
    try {
      const { writeFile } = await import('node:fs/promises')
      await writeFile(absolute, content, 'utf8')
      return { ok: true, output: 'saved' }
    } catch (error) {
      return { ok: false, output: '', error: { code: 'write-failed', message: error instanceof Error ? error.message : '写入失败' } }
    }
  }

  /**
   * 变更文件清单：以工作区根为基准的相对路径（含未跟踪），供客户端做同步的
   * 「这个文件有没有 git 改动」门禁；同时回报仓库根，便于客户端展示。
   */
  async fileStatus(path: string): Promise<{ ok: boolean; value?: FileStatusView; error?: GitError }> {
    const canonical = await this.requireWorkspace(path)
    const held = this.fileStatusCache.get(canonical)
    if (held !== undefined && Date.now() - held.at < 2000) return { ok: true, value: held.value }
    const { toplevel } = await this.rootsOf(canonical)
    // 以仓库根为 cwd 运行，porcelain 的路径基准与 toplevel 必然一致。
    // 文件树徽章只需要「这个路径有没有改动」。--untracked-files=all 会把每个
    // 未跟踪文件都列出来，大工作区一次 200–500ms；normal 只列未跟踪目录，够用。
    const run = await this.runner.run(['status', '--porcelain', '-z', '--untracked-files=normal'], toplevel)
    if (run.exitCode !== 0) {
      return { ok: false, error: { code: 'status-failed', message: run.stderr.trim() || 'git status failed' } }
    }
    const entries: Array<{ path: string; code: string }> = []
    const chunks = run.stdout.split('\u0000')
    for (let index = 0; index < chunks.length; index += 1) {
      const entry = chunks[index]
      if (entry === undefined || entry.length < 4) continue
      const code = entry.slice(0, 2)
      const target = entry.slice(3)
      // -z 的重命名记录把原路径放在下一段，跳过它。
      if (code.startsWith('R') || code.startsWith('C')) index += 1
      const absolute = resolvePath(toplevel, target)
      const local = relativePath(canonical, absolute).split(sep).join('/')
      if (local === '' || local.startsWith('../') || local === '..') continue
      entries.push({ path: local, code })
    }
    entries.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
    const value = { workspace: canonical, toplevel, entries }
    this.fileStatusCache.set(canonical, { at: Date.now(), value })
    return { ok: true, value }
  }

  /**
   * 仓库根与 git 目录：非 git 目录回退到工作区根与 `.git`。
   * 结果按 canonical 缓存，避免每轮轮询重复 fork rev-parse。
   */
  private rootsOf(canonical: string): Promise<{ toplevel: string; gitDir: string }> {
    const cached = this.roots.get(canonical)
    if (cached !== undefined) return cached
    const task = (async () => {
      const [top, dir] = await Promise.all([
        this.runner.run(['rev-parse', '--show-toplevel'], canonical),
        this.runner.run(['rev-parse', '--git-dir'], canonical),
      ])
      const root = top.exitCode === 0 ? top.stdout.trim() : ''
      const rawDir = dir.exitCode === 0 ? dir.stdout.trim() : '.git'
      return {
        toplevel: root === '' ? canonical : root,
        gitDir: rawDir.startsWith('/') || /^[a-zA-Z]:/.test(rawDir) ? rawDir : join(canonical, rawDir),
      }
    })()
    this.roots.set(canonical, task)
    return task
  }

  /** 摘取一个提交到当前分支（git cherry-pick）。 */
  async cherryPick(path: string, sha: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const clean = sha.trim()
    if (clean === '') return { ok: false, output: '', error: { code: 'empty-sha', message: 'sha 不能为空' } }
    const run = await this.runner.run(['cherry-pick', clean], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'cherry-pick-failed', message: run.stderr.trim() || 'git cherry-pick failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 撤销一个提交（git revert --no-edit）。 */
  async revertCommit(path: string, sha: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const clean = sha.trim()
    if (clean === '') return { ok: false, output: '', error: { code: 'empty-sha', message: 'sha 不能为空' } }
    const run = await this.runner.run(['revert', '--no-edit', clean], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'revert-failed', message: run.stderr.trim() || 'git revert failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 一键同步（git pull --rebase + 有超前则 git push）。 */
  async sync(path: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const pullRun = await this.runner.run(['pull', '--rebase'], canonical)
    if (pullRun.exitCode !== 0) {
      return { ok: false, output: pullRun.stdout, error: { code: 'sync-pull-failed', message: pullRun.stderr.trim() || 'git pull --rebase failed' } }
    }
    const pushRun = await this.runner.run(['push'], canonical)
    if (pushRun.exitCode !== 0) {
      return { ok: false, output: pushRun.stdout, error: { code: 'sync-push-failed', message: pushRun.stderr.trim() || 'git push failed' } }
    }
    const out = [pullRun.stdout.trim(), pushRun.stdout.trim()].filter(Boolean).join('\n')
    return { ok: true, output: out || 'Sync successful' }
  }

  /**
   * 提交已暂存的变更（git commit -m）。
   * 严格遵循暂存区隔离原则：只提交已暂存（staged）文件，不自动 add -A，
   * 未暂存（unstaged）文件一律保留在工作区。
   * 暂存区为空时返回 empty-stage 错误。
   */
  async commit(path: string, message: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const clean = message.trim()
    if (clean === '') {
      return { ok: false, output: '', error: { code: 'empty-message', message: 'commit message 不能为空' } }
    }
    const commitRun = await this.runner.run(['commit', '-m', clean], canonical)
    if (commitRun.exitCode !== 0) {
      const msg = commitRun.stderr.trim() || commitRun.stdout.trim() || 'git commit failed'
      const isNothingStaged = msg.includes('nothing to commit') || msg.includes('no changes added to commit')
      return {
        ok: false,
        output: commitRun.stdout,
        error: {
          code: isNothingStaged ? 'empty-stage' : 'commit-failed',
          message: isNothingStaged ? '暂存区为空，没有要提交的改动' : msg,
        },
      }
    }
    return { ok: true, output: commitRun.stdout.trim() }
  }

  /** 推送当前分支到上游（git push）。 */
  async push(path: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['push'], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'push-failed', message: run.stderr.trim() || 'git push failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 暂存列表（git stash list）。 */
  async stashList(path: string): Promise<{ ok: boolean; output: string; error?: { code: string; message: string } }> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['stash', 'list'], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: '', error: { code: 'stash-list-failed', message: run.stderr.trim() || 'git stash list failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /**
   * 抽屉（stash 栈）内容概览：条目数与其中涉及的文件总数。
   *
   * 两个必须注意的点，都是实测确认的：
   *
   * 1. `git stash list` 只给条目，不给文件。要知道「抽屉里有没有东西、多少个
   *    文件」必须对每条 `stash show --name-only`。
   * 2. `stash show --name-only` **默认不列出未跟踪文件**（因为 -u 产生的储藏把
   *    未跟踪部分放在第三个 parent 上），必须显式加 `-u`/`--include-untracked`，
   *    否则「储藏了 5 个文件」会被算成 2 个——数字直接骗人。
   */
  async stashSummary(path: string): Promise<{ ok: true; entries: number; files: number } | { ok: false; error: GitError }> {
    const canonical = await this.requireWorkspace(path)
    const list = await this.runner.run(['stash', 'list', '--format=%gd'], canonical)
    if (list.exitCode !== 0) {
      return { ok: false, error: { code: 'stash-list-failed', message: list.stderr.trim() || 'git stash list failed' } }
    }
    const refs = list.stdout.split('\n').map((line) => line.trim()).filter((line) => line !== '')
    let files = 0
    for (const ref of refs) {
      const show = await this.runner.run(['stash', 'show', '--include-untracked', '--name-only', ref], canonical)
      if (show.exitCode !== 0) continue
      files += show.stdout.split('\n').filter((line) => line.trim() !== '').length
    }
    return { ok: true, entries: refs.length, files }
  }

  /**
   * 把当前变更收进抽屉（git stash push -u -m）。
   *
   * `-u`（--include-untracked）是必需的：裸 `git stash push` 会收走已暂存的改动
   * 与已跟踪文件的未暂存改动，**但绝不碰未跟踪文件**——于是新建的文件会留在工作区，
   * 用户看到「储藏」之后变更列表里还挂着一堆文件，以为没生效。实测：带 -u 之后
   * 已暂存 / 未暂存已跟踪 / 未跟踪三类一并收走，工作区回到干净状态。
   */
  async stashPush(path: string, message?: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const argv = ['stash', 'push', '-u']
    if (message !== undefined && message.trim() !== '') argv.push('-m', message.trim())
    const run = await this.runner.run(argv, canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'stash-failed', message: run.stderr.trim() || 'git stash push failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 恢复最新暂存（git stash pop）。 */
  async stashPop(path: string): Promise<OpResult> {
    const canonical = await this.requireWorkspace(path)
    const run = await this.runner.run(['stash', 'pop'], canonical)
    if (run.exitCode !== 0) {
      return { ok: false, output: run.stdout, error: { code: 'stash-pop-failed', message: run.stderr.trim() || 'git stash pop failed' } }
    }
    return { ok: true, output: run.stdout.trim() }
  }

  /** 用于图视图的提交 DAG（全部引用，按日期排序，有上限）。 */
  async graph(path: string): Promise<GraphView> {
    const canonical = await this.requireWorkspace(path)
    const [repo, current, logRun, tipRun] = await Promise.all([
      this.repoName(canonical),
      this.currentBranch(canonical),
      this.runner.run(
        ['log', '--all', '--date-order', '--max-count=300',
          '--pretty=format:' + `%H${FIELD}%P${FIELD}%an${FIELD}%ai${FIELD}%s${REC}`],
        canonical,
      ),
      this.runner.run(
        ['for-each-ref', '--format=' + `%(refname:short)${FIELD}%(objectname)${REC}`, 'refs/heads', 'refs/remotes'],
        canonical,
      ),
    ])

    const commits: GraphCommit[] = []
    const seen = new Set<string>()
    if (logRun.exitCode !== 0) {
      throw Object.assign(
        new Error(logRun.stderr.trim() || 'not a git repository'),
        { gitError: { code: 'not-a-repo', message: logRun.stderr.trim() || 'not a git repository' } },
      )
    }
    for (const record of splitRecords(logRun.stdout)) {
      const [sha, parents, author, date, subject] = record.split(FIELD)
      if (!sha || seen.has(sha)) continue
      seen.add(sha)
      commits.push({
        sha,
        parents: parents ? parents.split(' ') : [],
        author: sanitize(author ?? ''),
        date: sanitize(date ?? ''),
        subject: sanitize(subject ?? '').slice(0, 100),
      })
    }

    const tips: GraphTips = {}
    for (const record of splitRecords(tipRun.stdout)) {
      const [name, sha] = record.split(FIELD)
      if (name && sha) tips[name] = sha
    }

    return { repo, current, commits, tips }
  }

  /** 获取提交详情与变动文件统计。 */
  async commitDetail(path: string, sha: string): Promise<CommitDetail> {
    const canonical = await this.requireWorkspace(path)
    const commitSha = sha.trim()
    if (!/^[0-9a-fA-F]{4,40}$/.test(commitSha)) {
      throw Object.assign(new Error('invalid commit sha'), { gitError: { code: 'invalid-sha', message: '非法提交哈希' } })
    }

    const logRun = await this.runner.run(
      ['log', '-1', '--format=%H%x1f%s%x1f%b%x1f%an%x1f%ae%x1f%aI%x1f%P', commitSha],
      canonical,
    )
    if (logRun.exitCode !== 0 || !logRun.stdout.trim()) {
      throw Object.assign(new Error('commit not found'), { gitError: { code: 'not-found', message: '未找到指定提交' } })
    }

    const [fullSha, subject, body, authorName, authorEmail, date, parentsRaw] = logRun.stdout.trim().split('\x1f')
    const parents = (parentsRaw ?? '').split(' ').filter(Boolean)
    const parentRef = parents.length > 0 ? parents[0]! : EMPTY_TREE_SHA
    // 回填父提交缓存：随后逐个文件取 diff 时无需再跑 rev-list。
    this.cacheSet(this.commitParentCache, `${canonical}\u0000${fullSha}`, parentRef)

    const [nameRun, numRun] = await Promise.all([
      this.runner.run(
        ['-c', 'core.quotepath=false', 'diff', '--name-status', '-M', parentRef, fullSha],
        canonical,
      ),
      this.runner.run(
        ['-c', 'core.quotepath=false', 'diff', '--numstat', '-M', parentRef, fullSha],
        canonical,
      ),
    ])

    const numstatMap = parseNumstat(numRun.stdout)

    const files: CommitFileItem[] = []
    let totalAdded = 0
    let totalDeleted = 0

    for (const line of nameRun.stdout.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parts = trimmed.split('\t')
      if (parts.length < 2) continue
      const statusRaw = parts[0] ?? 'M'
      const status = statusRaw.slice(0, 1)
      let oldPath: string | undefined
      let filePath: string
      if (parts.length >= 3) {
        oldPath = parts[1]
        filePath = parts[2]
      } else {
        filePath = parts[1]
      }

      const num = numstatMap[filePath]
      const added = num?.insertions ?? 0
      const deleted = num?.deletions ?? 0

      totalAdded += added
      totalDeleted += deleted

      files.push({
        path: filePath,
        status,
        oldPath,
        added,
        deleted,
      })
    }

    return {
      sha: fullSha,
      subject: subject ?? '',
      body: body ?? '',
      authorName: authorName ?? '',
      authorEmail: authorEmail ?? '',
      date: date ?? '',
      parents,
      files,
      totals: {
        added: totalAdded,
        deleted: totalDeleted,
        fileCount: files.length,
      },
    }
  }

  /** 获取提交中单个文件的新旧完整内容（前端本地算 LCS，服务端不预生成 diff）。 */
  async commitFileDiff(path: string, sha: string, file: string, oldPath?: string): Promise<CommitFileDiffResult> {
    const canonical = await this.requireWorkspace(path)
    const commitSha = sha.trim()
    const filePath = file.trim()
    if (!/^[0-9a-fA-F]{4,40}$/.test(commitSha) || !filePath) {
      throw Object.assign(new Error('invalid params'), { gitError: { code: 'invalid-params', message: '参数非法' } })
    }

    const cacheKey = `${canonical}\u0000${commitSha}\u0000${filePath}\u0000${oldPath ?? ''}`
    const cached = this.commitFileDiffCache.get(cacheKey)
    if (cached !== undefined) return cached

    // 父提交优先取 commitDetail 已解析过的结果，省掉一次 rev-list 进程（约 70ms）。
    let parentRef = this.commitParentCache.get(`${canonical}\u0000${commitSha}`)
    if (parentRef === undefined) {
      const parentRun = await this.runner.run(['rev-list', '--parents', '-n', '1', commitSha], canonical)
      const parts = parentRun.stdout.trim().split(' ')
      parentRef = parts.length > 1 && parts[1] !== '' ? parts[1]! : EMPTY_TREE_SHA
      this.cacheSet(this.commitParentCache, `${canonical}\u0000${commitSha}`, parentRef)
    }

    const oldTarget = oldPath?.trim() || filePath
    const [oldContentRun, newContentRun] = await Promise.all([
      this.runner.run(['show', `${parentRef}:${oldTarget}`], canonical),
      this.runner.run(['show', `${commitSha}:${filePath}`], canonical),
    ])

    const oldText = oldContentRun.exitCode === 0 ? oldContentRun.stdout : ''
    const newText = newContentRun.exitCode === 0 ? newContentRun.stdout : ''
    const binary = oldText.includes('\0') || newText.includes('\0')

    const result: CommitFileDiffResult = {
      path: filePath,
      oldPath: oldPath?.trim(),
      oldContent: binary ? '' : oldText,
      newContent: binary ? '' : newText,
      binary,
    }
    // 提交内容不可变：缓存结果，来回切文件/切回图谱再进均瞬时命中。
    this.cacheSet(this.commitFileDiffCache, cacheKey, result)
    return result
  }
}
