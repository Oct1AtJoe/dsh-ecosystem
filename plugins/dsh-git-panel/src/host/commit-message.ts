/**
 * 「自动生成提交信息」：读取暂存区（staged）的变更内容，连同仓库最近若干条
 * 提交的主题一起交给模型，生成一条可直接提交的信息。
 *
 * 模型来源为设置页「会话标题与git提交」Tab 中的多模型优先级托底链
 * （`session-title` 命名空间）：自上而下依次尝试，任一级失败即顺延下一级，
 * 全部失败才报错。用户配的表就是唯一真相——刻意不追加任何隐形兜底模型，
 * 否则用户无法判断自己配的链到底有没有生效。
 *
 * 未配置表格时回退旧的 `git-panel` 单模型配置，再兜底内置 deepseek-flash。
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

/** 托底链上的一级候选模型。 */
export interface CandidateModel {
  provider: string
  model: string
  reasoningEffort?: string
}

/** 解析按优先级排序的多模型托底链（优先读 session-title 设置中的 models 列表） */
export function resolveCommitModelChain(ctx: Context): CandidateModel[] {
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

    // 向后兼容：表格式配置尚未写入时的旧 `git-panel` 单模型配置
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

  // 刻意不追加 agentDefaultModel 兜底：那会让用户在设置里配的模型失败时被一个
  // 看不见、也关不掉的模型静默接管，用户无从判断自己配的链到底有没有生效（已踩坑）。
  // 托底链的唯一真相就是用户配置本身。
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
  text = text.replace(/^["'“”‘’`]+/u, '').replace(/["'“”‘’`]+$/u, '')
  return text.slice(0, MESSAGE_CAP_CHARS).trim()
}

/** 提炼后原因的长度上限（界面一行内可读）。 */
const REASON_CAP_CHARS = 160

/**
 * 该失败是否明确因为思考档位不被模型支持（此时丢弃档位重试是安全的）。
 *
 * 刻意收窄：只认「思考档位 + 不支持/非法」同时出现的报错。欠费、超时、鉴权
 * 失败一律不匹配 —— 那些丢弃档位也救不回来，绝不能靠丢参数掩盖真问题。
 * @param message - provider 原始报错文本。
 * @returns 匹配时为 true。
 */
export function isEffortRejection(message: string): boolean {
  return /reasoning effort|reasoning_effort|thinking level/i.test(message)
    && /not support|unsupported|invalid/i.test(message)
}

/**
 * 从 provider 原始报错里提炼人可读原因。
 *
 * 上游把错误塞成整串 JSON（含 requestId / StatusCode / 嵌套 extError），实测一条
 * 626 字符 —— 直接铺到界面就是大半屏噪音，而真正有用的只有其中一句
 * "Reasoning effort not supported."。这里逐层剥前缀、解 JSON、优先取语义字段。
 *
 * 提不出结构时原样返回截断结果，绝不丢弃错误信息本身。
 * @param raw - provider 给出的原始报错文本。
 * @returns 精简后的原因（上限 REASON_CAP_CHARS）。
 */
export function summarizeFailure(raw: unknown): string {
  const text = String(raw ?? '').trim()
  if (text === '') return 'unknown error'

  const walk = (input: string, depth: number): string => {
    if (depth > 6) return input
    let current = input.trim()

    // 剥掉 "400: " / "http 400: " 之类状态码前缀
    const prefix = current.match(/^(?:https?:\/\/\S+\s*)?(?:[A-Za-z ]*?\b\d{3}\b[:：]\s*)/)
    if (prefix !== null && prefix[0].length < current.length) {
      current = current.slice(prefix[0].length).trim()
    }

    if (current.startsWith('{') || current.startsWith('[')) {
      try {
        const parsed = JSON.parse(current) as Record<string, unknown>
        const display = parsed['displayMsg'] as Record<string, unknown> | undefined
        const ext = parsed['extError'] as Record<string, unknown> | undefined
        const nested = parsed['error'] as Record<string, unknown> | undefined
        const candidate = display?.['en'] ?? display?.['zh']
          ?? parsed['msg'] ?? parsed['message']
          ?? nested?.['message'] ?? ext?.['message']
        if (typeof candidate === 'string' && candidate.trim() !== '') {
          return walk(candidate, depth + 1)
        }
        return current
      } catch {
        /* 不是完整 JSON，继续走下面的文本处理 */
      }
    }

    // JSON 嵌在普通文本中（"workbuddy upstream client (http 400): {...}"）
    const brace = current.indexOf('{')
    if (brace > 0) {
      const head = current.slice(0, brace).trim()
      const inner = walk(current.slice(brace), depth + 1)
      return head === '' ? inner : inner
    }
    return current
  }

  const summary = walk(text, 0).replace(/\s+/g, ' ').trim()
  if (summary === '') return 'unknown error'
  return summary.length > REASON_CAP_CHARS ? `${summary.slice(0, REASON_CAP_CHARS)}…` : summary
}

/**
 * 托底链执行过程中的实时事件。
 *
 * 为什么要回流：用户配的链里某一级报错时，必须让他**在切换下一个模型之前**
 * 就看到原因，否则只表现为「转了很久终于出了结果」，完全不知道发生过降级。
 */
export type GenerateEvent =
  /** 即将尝试第 index 级（1-based）。 */
  | { type: 'attempt'; index: number; total: number; provider: string; model: string; reasoningEffort?: string }
  /** 第 index 级失败，即将改为尝试下一级。 */
  | { type: 'fallback'; index: number; total: number; provider: string; model: string; reason: string; detail?: string; nextProvider?: string; nextModel?: string }
  /** 档位不被支持，已丢弃档位在本级重试。 */
  | { type: 'effort-retry'; index: number; provider: string; model: string; droppedEffort: string }
  /** 终结帧：成功或最终失败。 */
  | { type: 'result'; ok: boolean; message?: string; error?: GitError }

/** 事件回调；返回 Promise 时会被 await（允许调用方做背压）。 */
export type GenerateEventListener = (event: GenerateEvent) => void | Promise<void>

/**
 * 依据暂存区变更生成一条提交信息（支持多模型优先级托底）。
 * @param ctx - 宿主上下文，用于按需获取 `llm` 与配置。
 * @param service - git 服务，提供暂存区 diff 与最近提交主题。
 * @param root - 目标工作区路径（由服务层做工作区门禁）。
 * @param onEvent - 可选的实时事件回调（流式路由用它把降级过程推给浏览器）。
 * @returns 生成的提交信息，或带稳定错误码的失败。
 */
export async function generateCommitMessage(
  ctx: Context,
  service: GitService,
  root: string,
  onEvent?: GenerateEventListener,
): Promise<GenerateCommitMessageResult> {
  const emit = async (event: GenerateEvent): Promise<void> => {
    if (onEvent === undefined) return
    try {
      await onEvent(event)
    } catch {
      // 事件回流失败（如浏览器已断开）绝不能影响生成本身
    }
  }

  const llm = ctx.get('llm') as LlmLike | undefined
  if (llm === undefined || typeof llm.stream !== 'function') {
    const error = { code: 'no-model', message: 'LLM service is unavailable' }
    await emit({ type: 'result', ok: false, error })
    return { ok: false, error }
  }

  const chain = resolveCommitModelChain(ctx)
  if (chain.length === 0) {
    const error = { code: 'no-model', message: 'no model selection' }
    await emit({ type: 'result', ok: false, error })
    return { ok: false, error }
  }

  const staged = await service.stagedContext(root)
  if (!staged.ok) {
    await emit({ type: 'result', ok: false, error: staged.error })
    return { ok: false, error: staged.error }
  }
  // 暂存区为空：不触发生成。由调用方把 empty-stage 呈现为明确提示。
  if (staged.diff.trim() === '') {
    const error = { code: 'empty-stage', message: 'nothing is staged' }
    await emit({ type: 'result', ok: false, error })
    return { ok: false, error }
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

  // 逐级失败记录：全部失败时回报「试了哪些模型、各为什么失败」，
  // 否则用户只看到一句 "generate-failed"，无从判断是不是配置没生效。
  const attempts: string[] = []

  /** 单次调用：返回文本，或失败原因。 */
  const callOnce = async (candidate: CandidateModel, effort: string | undefined): Promise<{ text: string; failure: string | null }> => {
    let text = ''
    let failure: string | null = null
    try {
      const stream = llm.stream({
        provider: candidate.provider,
        model: candidate.model,
        ...(effort !== undefined ? { reasoningEffort: effort } : {}),
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
    return { text, failure }
  }

  // 依次遍历多模型优先级托底链
  for (let i = 0; i < chain.length; i++) {
    const candidate = chain[i]!
    const next = i + 1 < chain.length ? chain[i + 1]! : undefined

    // 「即将尝试」先于任何调用发出：前端据此显示正在用哪个模型
    await emit({
      type: 'attempt',
      index: i + 1,
      total: chain.length,
      provider: candidate.provider,
      model: candidate.model,
      ...(candidate.reasoningEffort !== undefined ? { reasoningEffort: candidate.reasoningEffort } : {}),
    })

    let { text, failure } = await callOnce(candidate, candidate.reasoningEffort)

    // 档位不被该模型支持时，丢弃档位（= 跟随模型默认）重试一次。
    // 这不是隐形兜底：模型仍是用户配的那个，只是剔除一个明显无效的参数；
    // 设置页也会把这种非法档位标红提示用户去改。
    if (failure !== null && candidate.reasoningEffort !== undefined && isEffortRejection(failure)) {
      await emit({
        type: 'effort-retry',
        index: i + 1,
        provider: candidate.provider,
        model: candidate.model,
        droppedEffort: candidate.reasoningEffort,
      })
      const retry = await callOnce(candidate, undefined)
      if (retry.failure === null) {
        text = retry.text
        failure = null
      } else {
        const raw = retry.failure
        const reason = summarizeFailure(raw)
        attempts.push(`${candidate.provider}/${candidate.model}: ${reason}`)
        // 切换下一个模型之前先把本次失败报出去
        await emit({
          type: 'fallback',
          index: i + 1,
          total: chain.length,
          provider: candidate.provider,
          model: candidate.model,
          reason,
          detail: raw,
          ...(next !== undefined ? { nextProvider: next.provider, nextModel: next.model } : {}),
        })
        continue
      }
    }

    if (failure !== null) {
      const raw = failure
      const reason = summarizeFailure(raw)
      attempts.push(`${candidate.provider}/${candidate.model}: ${reason}`)
      // 切换下一个模型之前先把本次失败报出去
      await emit({
        type: 'fallback',
        index: i + 1,
        total: chain.length,
        provider: candidate.provider,
        model: candidate.model,
        reason,
        detail: raw,
        ...(next !== undefined ? { nextProvider: next.provider, nextModel: next.model } : {}),
      })
      continue
    }

    const message = cleanMessage(text)
    if (message !== '') {
      await emit({ type: 'result', ok: true, message })
      return { ok: true, message }
    }
    const reason = 'the model returned an empty message'
    attempts.push(`${candidate.provider}/${candidate.model}: ${reason}`)
    await emit({
      type: 'fallback',
      index: i + 1,
      total: chain.length,
      provider: candidate.provider,
      model: candidate.model,
      reason,
      ...(next !== undefined ? { nextProvider: next.provider, nextModel: next.model } : {}),
    })
  }

  // 终结错误信息按消费方分叉：
  // - 流式路径（有 onEvent）：每级失败已作为 fallback 帧逐条推给界面（黄字记录），
  //   若这里再拼一遍完整明细，红字总结会与黄字 100% 重复、界面噪音翻倍。
  // - 非流式路径（无 onEvent，如脚本/测试调用）：这里就是唯一出口，必须带明细。
  const error: GitError = {
    code: 'generate-failed',
    message: attempts.length === 0
      ? 'all fallback models failed'
      : onEvent !== undefined
        ? `所有托底模型均失败（共 ${attempts.length} 个，详见上方逐条记录）`
        : `所有托底模型均失败 → ${attempts.join(' | ')}`,
  }
  await emit({ type: 'result', ok: false, error })
  return { ok: false, error }
}
