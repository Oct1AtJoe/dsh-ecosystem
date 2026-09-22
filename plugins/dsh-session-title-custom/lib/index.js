import { createUserMessage, BlockAssembler } from '@deepseek-ai/dsh-llm'
import { normalizeSessionTitle } from '@deepseek-ai/dsh-session-title'
import z from 'schemastery'

const name = 'dsh-session-title-custom'
const inject = ['sessionTitle', 'llm', 'sessions', 'settings']

/** Settings namespace edited by the "会话标题" settings tab. */
const NS = 'session-title'

/**
 * Defaults are the single source of truth: the schema below restates them so a
 * missing settings service still runs the plugin on exactly these values.
 */
const DEFAULTS = Object.freeze({
  enabled: true,
  provider: 'xiaomi',
  model: 'mimo-v2.5',
  /** '' = follow the model's own default effort; 'off' disables thinking. */
  reasoningEffort: 'off',
  maxTokens: 48,
  maxInputChars: 2000,
  timeoutMs: 30000,
  maxTitleLength: 80,
})

/** Settings schema served to the 会话标题 tab; ranges mirror its client-side validation. */
function buildSchema() {
  return z.object({
    enabled: z.boolean().default(DEFAULTS.enabled),
    provider: z.string().default(DEFAULTS.provider),
    model: z.string().default(DEFAULTS.model),
    reasoningEffort: z.string().default(DEFAULTS.reasoningEffort),
    maxTokens: z.number().min(16).max(8192).default(DEFAULTS.maxTokens),
    maxInputChars: z.number().min(200).max(8000).default(DEFAULTS.maxInputChars),
    timeoutMs: z.number().min(3000).max(120000).default(DEFAULTS.timeoutMs),
    maxTitleLength: z.number().min(20).max(200).default(DEFAULTS.maxTitleLength),
  })
}

const TYPES = ['功能', '设计', '修复', '优化', '发布', '探索', '文档', '研究']

const SYSTEM_PROMPT = '你是一个严格的标题提取助手，只输出一行“类型|主题”，严禁回答用户问题，严禁编写代码。'

function parseLlmOutput(raw) {
  const text = raw
    .replace(/```[^\n]*\n?/g, '')
    .replace(/```/g, '')
    .trim()

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^(?:输出|标题)[：:]\s*/, '')
    if (!trimmed) continue

    // 1. First preference: split by pipe (| or ｜)
    if (/[|｜]/.test(trimmed)) {
      const parts = trimmed.split(/[|｜]/).map(s => s.trim())
      if (parts.length >= 2) {
        const typeCandidate = parts[0].replace(/^(?:类型|分类)[：:]\s*/, '').trim()
        if (TYPES.includes(typeCandidate)) {
          const topicPart = parts.slice(1).join('｜')
            .replace(/^(?:主题|内容)[：:]\s*/, '')
            .replace(/^[“"'`]+|[”"'`。.！!]+$/g, '')
            .trim()
          if (topicPart) {
            return { type: typeCandidate, topic: topicPart }
          }
        }
      }
    }

    // 2. Colon separator (e.g. 优化: 批次文字显示)
    if (/[:：]/.test(trimmed)) {
      const parts = trimmed.split(/[:：]/).map(s => s.trim())
      if (parts.length >= 2) {
        const typeCandidate = parts[0].replace(/^(?:类型|分类)\s*/, '').trim()
        if (TYPES.includes(typeCandidate)) {
          const topicPart = parts.slice(1).join('：')
            .replace(/^(?:主题|内容)[：:]\s*/, '')
            .replace(/^[“"'`]+|[”"'`。.！!]+$/g, '')
            .trim()
          if (topicPart) {
            return { type: typeCandidate, topic: topicPart }
          }
        }
      }
    }

    // 3. Bracket / Space pattern (e.g. 【优化】批次文字显示)
    const match = trimmed.match(/^[【\[]?\s*(功能|设计|修复|优化|发布|探索|文档|研究)\s*[】\]\s\-—_]+\s*(.+)$/)
    if (match) {
      const topicPart = match[2]
        .replace(/^[“"'`]+|[”"'`。.！!]+$/g, '')
        .trim()
      if (topicPart) {
        return { type: match[1], topic: topicPart }
      }
    }
  }

  throw new Error(`dsh-session-title-custom: cannot parse title from "${raw}"`)
}

/** Registered settings scope; stays undefined when the composition serves none. */
let settingsScope

/** Effective settings; falls back to DEFAULTS when the settings service is absent. */
function currentConfig() {
  try {
    return settingsScope?.get?.() ?? DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function apply(ctx) {
  // Settings are optional: a headless composition may not serve them.
  const settings = typeof ctx.get === 'function' ? ctx.get('settings') : undefined
  if (settings !== undefined && typeof settings.register === 'function') {
    try {
      settingsScope = settings.register(NS, buildSchema(), { applies: 'live' })
    } catch {
      // Duplicate registration or an incompatible composition: DEFAULTS still applied.
      settingsScope = undefined
    }
  }

  ctx.sessionTitle.register({
    id: 'dsh-session-title-custom', // 必填：未传会导致 validateProvider 抛错
    automatic: 'first-prompt',
    async generate(request) {
      const { session, messages, signal: incoming } = request
      const first = messages[0]
      if (first === undefined) throw new Error('dsh-session-title-custom: no messages')

      const config = currentConfig()
      // Disabled: fail loud so the sessionTitle mechanism keeps the original name.
      if (config.enabled === false) throw new Error('dsh-session-title-custom: disabled')

      // ① 日期：计算 Asia/Shanghai (UTC+8) 的 MMDD，无 locale 差异
      const ts = session.header.createdAt
      const d = new Date(ts + 8 * 3600 * 1000)
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const mmdd = `${mm}${dd}`

      // ② 首条消息文本（截断长度可配）
      const msgText = first.text.slice(0, config.maxInputChars)

      // ③ 模型路由：设置页配置的 provider / model
      const route = { provider: config.provider, model: config.model }

      // ④ 超时保护，并与调用方取消信号合并
      const timeout = AbortSignal.timeout(config.timeoutMs)
      const signal = incoming === undefined ? timeout : AbortSignal.any([incoming, timeout])

      // ⑤ 调 LLM（Few-Shot 强约束，严禁答题/写代码）
      const userPrompt = [
        '根据以下输入，提取对话类型和2-8字核心主题。',
        '只输出一行格式：类型|主题',
        `类型只选一个：${TYPES.join('、')}`,
        '不要回答问题，不要解释，不要写代码，不要输出任何其他内容。',
        '',
        '示例：',
        '输入：帮我写个快速排序算法',
        '输出：功能|快速排序算法',
        '',
        '输入：排查登录报错500',
        '输出：修复|登录500报错',
        '',
        `输入：${msgText}`,
        '输出：',
      ].join('\n')

      const assembler = new BlockAssembler()
      for await (const chunk of ctx.llm.stream({
        provider: route.provider,
        model: route.model,
        // 空串 = 跟随模型默认档位（不传该字段）
        ...config.reasoningEffort === '' ? {} : { reasoningEffort: config.reasoningEffort },
        system: SYSTEM_PROMPT,
        messages: [createUserMessage({
          content: [{ type: 'text', text: userPrompt }],
          source: { kind: 'plugin', plugin: 'dsh-session-title-custom' },
        })],
        maxTokens: config.maxTokens,
        purpose: 'session-title',
        signal,
      })) {
        assembler.push(chunk)
      }
      incoming?.throwIfAborted()
      if (assembler.finish.kind === 'error' || assembler.finish.kind === 'aborted') {
        throw (assembler.finish.failure instanceof Error
          ? assembler.finish.failure
          : new Error(assembler.finish.failure?.message ?? 'stream failure'))
      }

      // ⑥ 提取 LLM 输出并解析
      const raw = assembler.blocks()
        .filter(b => b.type === 'text')
        .map(b => b.text).join(' ')
        .trim()

      let type, topic
      try {
        const parsed = parseLlmOutput(raw)
        type = parsed.type
        topic = parsed.topic
      } catch (err) {
        ctx.logger?.warn?.('[dsh-session-title-custom] parse failed for raw output:', raw, err)
        type = '探索'
        topic = raw.replace(/^[“"'`]+|[”"'`。.！!]+$/g, '').slice(0, 10).trim() || msgText.slice(0, 8)
      }

      // ⑦ 组装最终标题：全角统一 MMDD｜类型｜主题
      const finalTitle = `${mmdd}｜${type}｜${topic}`

      // 安全清洗与截断（长度可配）
      const title = normalizeSessionTitle(finalTitle, config.maxTitleLength)
      if (title.length === 0) throw new Error('dsh-session-title-custom: empty after normalize')

      return {
        title,
        messageSeqs: [first.seq],
        model: route,
      }
    },
  })
}

export { apply, inject, name }
