/**
 * 「自动生成提交信息」：读取暂存区（staged）的变更内容，连同仓库最近若干条
 * 提交的主题一起交给指定模型，生成一条可直接提交的信息。
 *
 * 默认使用 deepseek 官方的 DeepSeek-V41-Flash（deepseek-official / deepseek-flash），
 * 并关闭思考程度（reasoningEffort: 'off'），确保秒级生成且不消耗深度推理额度。
 * 亦可通过 settings.yaml 中的 `git-panel` 字段按需覆盖。
 * @module dsh-git-panel/host/commit-message
 */

import type { Context } from '@deepseek-ai/cordis'
import type { GitError } from '../core/types.ts'
import type { GitService } from './git-service.ts'

/** 送入模型的 diff 字符上限；超出部分截断，避免一次提交撑爆上下文。 */
const DIFF_CAP_CHARS = 24000

/** 生成结果的字符上限（防御性，正常远小于此）。 */
const MESSAGE_CAP_CHARS = 2000

/** 单次生成的整体超时。 */
const TIMEOUT_MS = 60000

/** 默认模型配置：deepseek 官方 + DeepSeek-V41-Flash + 关闭思考。 */
const DEFAULT_PROVIDER = 'deepseek-official'
const DEFAULT_MODEL = 'deepseek-flash'
const DEFAULT_REASONING_EFFORT = 'off'

/** 本模块需要的 `llm` 服务最小面孔。 */
interface LlmLike {
  stream(options: Record<string, unknown>): AsyncIterable<unknown>
}

/** 模型选择信息最小面孔。 */
interface ModelSelectionLike {
  provider?: unknown
  model?: unknown
  reasoningEffort?: unknown
}

interface CandidateModel {
  provider: string
  model: string
  reasoningEffort?: string
}

/** 解析按优先级排序的多模型托底链（优先读 session-title 设置中的 models 列表） */
function resolveCommitModelChain(ctx: Context): CandidateModel[] {
  const candidates: CandidateModel[] = []

  try {
    const settings = ctx.get('settings') as { get?: (ns: string) => unknown } | undefined
    const titleCfg = settings?.get?.('session-title') as {
      enabled?: boolean
      models?: Array<{ provider?: string; model?: string; reasoningEffort?: string }>
      provider?: string
      model?: string
      reasoningEffort?: string
    } | undefined

    if (titleCfg && titleCfg.enabled !== false) {
      if (Array.isArray(titleCfg.models) && titleCfg.models.length > 0) {
        for (const m of titleCfg.models) {
          if (typeof m.provider === 'string' && m.provider && typeof m.model === 'string' && m.model) {
            candidates.push({
              provider: m.provider,
              model: m.model,
              reasoningEffort: typeof m.reasoningEffort === 'string' && m.reasoningEffort !== '' ? m.reasoningEffort : undefined,
            })
          }
        }
      }
      if (candidates.length === 0 && typeof titleCfg.provider === 'string' && titleCfg.provider && typeof titleCfg.model === 'string' && titleCfg.model) {
        candidates.push({
          provider: titleCfg.provider,
          model: titleCfg.model,
          reasoningEffort: typeof titleCfg.reasoningEffort === 'string' && titleCfg.reasoningEffort !== '' ? titleCfg.reasoningEffort : undefined,
        })
      }
    }

    // 尝试读取 git-panel 独立配置
    if (candidates.length === 0) {
      const cfg = settings?.get?.('git-panel') as ModelSelectionLike | undefined
      if (cfg && typeof cfg.provider === 'string' && cfg.provider && typeof cfg.model === 'string' && cfg.model) {
        candidates.push({
          provider: cfg.provider,
          model: cfg.model,
          reasoningEffort: typeof cfg.reasoningEffort === 'string' && cfg.reasoningEffort !== '' ? cfg.reasoningEffort : undefined,
        })
      }
    }
  } catch {}

  // 兜底内置默认模型
  if (candidates.length === 0) {
    candidates.push({
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      reasoningEffort: DEFAULT_REASONING_EFFORT,
    })
  }

  // 追加全局默认模型作为最终备选（防单一供应商欠费宕机）
  try {
    const selection = ctx.get('agentDefaultModel')?.currentSelection?.() as ModelSelectionLike | undefined
    if (typeof selection?.provider === 'string' && typeof selection?.model === 'string' && selection.provider && selection.model) {
      if (!candidates.some(c => c.provider === selection.provider && c.model === selection.model)) {
        candidates.push({
          provider: selection.provider,
          model: selection.model,
        })
      }
    }
  } catch {}

  return candidates
}

/** 生成结果。 */
export type GenerateCommitMessageResult =
  | { ok: true; message: string }
  | { ok: false; error: GitError }

const SYSTEM = [
  'You write one git commit message for a staged change set.',
  'Match the repository: use the same language, the same prefix convention (e.g. feat/fix/docs/refactor) and the same tone as the recent commit subjects you are given.',
  'Describe what the change actually does, not that files were edited. Never invent work that the diff does not show.',
  'Return ONLY the commit message as plain text: no quotes, no Markdown code fences, no explanation, no trailing commentary.',
  'Use a single line unless the change genuinely needs a body; if it does, separate the subject from the body with one blank line.',
].join('\n')

/** 清理模型输出：剥掉代码围栏与首尾引号，只留纯文本。 */
function cleanMessage(raw: string): string {
  let text = raw.trim()
  const fence = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text)
  if (fence !== null) text = fence[1].trim()
  text = text.replace(/^["'“”‘’`]+/u, '').replace(/["'“”‘’`]+$/u, '').trim()
  return text.slice(0, MESSAGE_CAP_CHARS).trim()
}

/**
 * 依据暂存区变更生成一条提交信息（支持多模型优先级托底）。
 * @param ctx - 宿主上下文，用于按需获取 `llm` 与配置。
 * @param service - git 服务，提供暂存区 diff 与最近提交主题。
 * @param root - 目标工作区路径（由服务层做工作区门禁）。
 * @returns 生成的提交信息，或带稳定错误码的失败。
 */
export async function generateCommitMessage(
  ctx: Context,
  service: GitService,
  root: string,
): Promise<GenerateCommitMessageResult> {
  const llm = ctx.get('llm') as LlmLike | undefined
  if (llm === undefined || typeof llm.stream !== 'function') {
    return { ok: false, error: { code: 'no-model', message: 'LLM service is unavailable' } }
  }

  const chain = resolveCommitModelChain(ctx)
  if (chain.length === 0) {
    return { ok: false, error: { code: 'no-model', message: 'no model selection' } }
  }

  const staged = await service.stagedContext(root)
  if (!staged.ok) return { ok: false, error: staged.error }
  // 暂存区为空：不触发生成。由调用方把 empty-stage 呈现为明确提示。
  if (staged.diff.trim() === '') {
    return { ok: false, error: { code: 'empty-stage', message: 'nothing is staged' } }
  }

  const diff = staged.diff.length > DIFF_CAP_CHARS
    ? `${staged.diff.slice(0, DIFF_CAP_CHARS)}\n... (diff truncated)`
    : staged.diff
  const input = [
    staged.subjects.length > 0
      ? `Recent commit subjects in this repository (imitate their language, prefix and tone):\n${staged.subjects.map((subject) => `- ${subject}`).join('\n')}`
      : 'This repository has no earlier commits to imitate.',
    '',
    'Staged changes (git diff --cached):',
    diff,
  ].join('\n')

  let lastFailure: string | null = null

  // 依次遍历多模型优先级托底链
  for (let i = 0; i < chain.length; i++) {
    const candidate = chain[i]!
    let text = ''
    let failure: string | null = null

    try {
      const stream = llm.stream({
        provider: candidate.provider,
        model: candidate.model,
        ...(candidate.reasoningEffort !== undefined ? { reasoningEffort: candidate.reasoningEffort } : {}),
        system: SYSTEM,
        messages: [{
          id: 'dsh-git-panel-commit-message',
          role: 'user',
          content: [{ type: 'text', text: input }],
          source: { kind: 'user' },
        }],
        temperature: 0.2,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      for await (const chunk of stream) {
        const part = chunk as {
          type?: unknown
          text?: unknown
          reason?: { kind?: unknown; failure?: { message?: unknown } }
        }
        if (part.type === 'text-delta' && typeof part.text === 'string') {
          text += part.text
          continue
        }
        if (part.type === 'finish' && part.reason?.kind !== undefined && part.reason.kind !== 'stop') {
          failure = typeof part.reason.failure?.message === 'string'
            ? part.reason.failure.message
            : String(part.reason.kind)
        }
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error)
    }

    if (failure !== null) {
      lastFailure = failure
      continue
    }

    const message = cleanMessage(text)
    if (message !== '') {
      return { ok: true, message }
    }
    lastFailure = 'the model returned an empty message'
  }

  return { ok: false, error: { code: 'generate-failed', message: lastFailure ?? 'all fallback models failed' } }
}
