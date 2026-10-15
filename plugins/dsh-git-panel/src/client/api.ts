/** /git-panel 路由的类型化传输层。 */
import type { BranchesView, CommitDetail, CommitFileDiffResult, FileStatusView, GraphView, OpResult, WorkspaceFileRead } from '../core/types.ts'

export interface GitError {
  code: string
  message: string
}

export type Envelope<T> = { ok: true; value: T } | { ok: false; error: GitError }

/**
 * 生成提交信息时服务端推给浏览器的过程事件（NDJSON 帧，终结帧 `done` 除外）。
 * 与宿主 `GenerateEvent` 同形；这里独立声明，避免客户端 value-import 宿主模块。
 */
export type GenerateStreamEvent =
  | { type: 'attempt'; index: number; total: number; provider: string; model: string; reasoningEffort?: string }
  | { type: 'fallback'; index: number; total: number; provider: string; model: string; reason: string; detail?: string; nextProvider?: string; nextModel?: string }
  | { type: 'effort-retry'; index: number; provider: string; model: string; droppedEffort: string }

/** 单帧：过程事件或终结帧。 */
type GenerateStreamFrame =
  | GenerateStreamEvent
  | { type: 'done'; value?: { message: string }; error?: GitError }

async function post<T>(path: string, payload: unknown, signal?: AbortSignal): Promise<Envelope<T>> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      ...(signal !== undefined ? { signal } : {}),
    })
  } catch (error) {
    // 用户主动取消不是故障：给稳定错误码，由调用方静默处理（不弹错误提示）。
    if (signal?.aborted === true || (error instanceof DOMException && error.name === 'AbortError')) {
      return { ok: false, error: { code: 'cancelled', message: 'request cancelled' } }
    }
    return { ok: false, error: { code: 'internal', message: 'git route unavailable' } }
  }
  try {
    return (await response.json()) as Envelope<T>
  } catch {
    return { ok: false, error: { code: 'internal', message: `bad response (HTTP ${response.status})` } }
  }
}

/** 浏览器端的 git 面板 API。 */
export class GitPanelApi {
  /** 轻量接口：仅获取当前分支（用于 chip 标签）。 */
  current(path: string) {
    return post<{ repo: string; current: string }>('/git-panel/current', { path })
  }

  branches(path: string) {
    return post<BranchesView>('/git-panel/branches', { path })
  }

  graph(path: string) {
    return post<GraphView>('/git-panel/graph', { path })
  }

  switchBranch(path: string, branch: string) {
    return post<OpResult>('/git-panel/switch', { path, branch })
  }

  /** 中止当前在飞的 git 进程。 */
  cancel(path: string) {
    return post<{ cancelled: boolean }>('/git-panel/cancel', { path })
  }

  pull(path: string) {
    return post<OpResult>('/git-panel/pull', { path })
  }

  fetchAll(path: string) {
    return post<OpResult>('/git-panel/fetch', { path })
  }

  renameBranch(path: string, branch: string, newName: string) {
    return post<OpResult>('/git-panel/rename', { path, branch, newName })
  }

  deleteBranch(path: string, branch: string) {
    return post<OpResult>('/git-panel/delete', { path, branch })
  }

  deleteRemoteBranch(path: string, branch: string) {
    return post<OpResult>('/git-panel/delete-remote', { path, branch })
  }

  mergeBranch(path: string, branch: string) {
    return post<OpResult>('/git-panel/merge', { path, branch })
  }

  status(path: string) {
    return post<OpResult & {
      mergeMsg?: string
      stagedStats?: Record<string, { insertions: number; deletions: number }>
      unstagedStats?: Record<string, { insertions: number; deletions: number }>
    }>('/git-panel/status', { path })
  }

  diffFile(path: string, file: string) {
    return post<OpResult>('/git-panel/diff', { path, file })
  }

  showHead(path: string, file: string) {
    return post<OpResult>('/git-panel/show-head', { path, file })
  }

  saveFile(path: string, file: string, content: string) {
    return post<OpResult>('/git-panel/save-file', { path, file, content })
  }

  /** 工作区变更清单（含 porcelain 状态码），文件树装饰与路由门禁共用。 */
  fileStatus(path: string) {
    return post<FileStatusView>('/git-panel/file-status', { path })
  }

  /** 读取工作区文件当前内容。 */
  readFile(path: string, file: string) {
    return post<WorkspaceFileRead>('/git-panel/read-file', { path, file })
  }

  stageFile(path: string, file: string) {
    return post<OpResult>('/git-panel/stage', { path, file })
  }

  unstageFile(path: string, file: string) {
    return post<OpResult>('/git-panel/unstage', { path, file })
  }

  discardFile(path: string, file: string, untracked: boolean) {
    return post<OpResult>('/git-panel/discard', { path, file, untracked })
  }

  cherryPick(path: string, sha: string) {
    return post<OpResult>('/git-panel/cherry-pick', { path, sha })
  }

  revertCommit(path: string, sha: string) {
    return post<OpResult>('/git-panel/revert', { path, sha })
  }

  commit(path: string, message: string) {
    return post<OpResult>('/git-panel/commit', { path, message })
  }

  /** 读取暂存区内容，由当前默认模型生成一条提交信息。传 signal 可中途取消。 */
  generateCommitMessage(path: string, signal?: AbortSignal) {
    return post<{ message: string }>('/git-panel/generate-commit-message', { path }, signal)
  }

  /**
   * 流式版本：边生成边把托底链的尝试/失败事件回调出来，让「某模型报错 →
   * 正改用下一个」在切换之前就可见。
   *
   * @param path - 工作区路径。
   * @param onEvent - 每收到一帧即时调用（attempt / fallback / effort-retry）。
   * @param signal - 取消信号。
   * @returns 终结结果（成功消息或错误），与 `generateCommitMessage` 同形。
   */
  async generateCommitMessageStream(
    path: string,
    onEvent: (event: GenerateStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<Envelope<{ message: string }>> {
    let response: Response
    try {
      response = await fetch('/git-panel/generate-commit-message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error) {
      if (signal?.aborted === true || (error instanceof DOMException && error.name === 'AbortError')) {
        return { ok: false, error: { code: 'cancelled', message: 'request cancelled' } }
      }
      return { ok: false, error: { code: 'internal', message: 'git route unavailable' } }
    }

    if (response.body === null) {
      return { ok: false, error: { code: 'internal', message: 'response has no body' } }
    }

    let final: Envelope<{ message: string }> | null = null
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    /** 处理一行 NDJSON；返回 true 表示已收到终结帧。 */
    const handleLine = (line: string): boolean => {
      const trimmed = line.trim()
      if (trimmed === '') return false
      let frame: GenerateStreamFrame
      try {
        frame = JSON.parse(trimmed) as GenerateStreamFrame
      } catch {
        return false
      }
      if (frame.type === 'done') {
        final = frame.error !== undefined
          ? { ok: false, error: frame.error }
          : { ok: true, value: frame.value ?? { message: '' } }
        return true
      }
      onEvent(frame)
      return false
    }

    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let nl = buffer.indexOf('\n')
        while (nl !== -1) {
          const line = buffer.slice(0, nl)
          buffer = buffer.slice(nl + 1)
          if (handleLine(line)) {
            void reader.cancel()
            return final ?? { ok: false, error: { code: 'internal', message: 'no result frame' } }
          }
          nl = buffer.indexOf('\n')
        }
      }
      // 收尾：最后一行可能没有换行符
      if (buffer !== '' && handleLine(buffer)) {
        return final ?? { ok: false, error: { code: 'internal', message: 'no result frame' } }
      }
    } catch (error) {
      if (signal?.aborted === true || (error instanceof DOMException && error.name === 'AbortError')) {
        return { ok: false, error: { code: 'cancelled', message: 'request cancelled' } }
      }
      return { ok: false, error: { code: 'internal', message: error instanceof Error ? error.message : String(error) } }
    }

    if (final !== null) return final
    // 流结束却没有终结帧（服务端中断）：按失败处理，避免界面永远转圈
    return { ok: false, error: { code: 'internal', message: 'stream ended without a result' } }
  }

  push(path: string) {
    return post<OpResult>('/git-panel/push', { path })
  }

  sync(path: string) {
    return post<OpResult>('/git-panel/sync', { path })
  }

  setCredential(path: string, host: string, username: string, password: string) {
    return post<OpResult>('/git-panel/set-credential', { path, host, username, password })
  }

  stashList(path: string) {
    return post<OpResult>('/git-panel/stash-list', { path })
  }

  /** 抽屉概览：条目数与其中的文件总数。 */
  stashSummary(path: string) {
    return post<{ entries: number; files: number }>('/git-panel/stash-summary', { path })
  }

  stashPush(path: string, message?: string) {
    return post<OpResult>('/git-panel/stash-push', { path, message: message ?? '' })
  }

  stashPop(path: string) {
    return post<OpResult>('/git-panel/stash-pop', { path })
  }

  commitDetail(path: string, sha: string) {
    return post<CommitDetail>('/git-panel/commit-detail', { path, sha })
  }

  commitFileDiff(path: string, sha: string, file: string, oldPath?: string) {
    return post<CommitFileDiffResult>('/git-panel/commit-file-diff', { path, sha, file, oldPath })
  }
}
