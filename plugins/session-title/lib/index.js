import { createUserMessage, BlockAssembler } from '@deepseek-ai/dsh-llm'
import { normalizeSessionTitle } from '@deepseek-ai/dsh-session-title'
import z from '@deepseek-ai/schemastery'

const name = 'dsh-session-title-gen'
const inject = ['sessionTitle', 'llm', 'sessions']

/**
 * Defaults are the single source of truth: the schema below restates them so a
 * missing settings service still runs the plugin on exactly these values.
 */
const DEFAULT_MODEL_ITEM = Object.freeze({
  id: '1',
  provider: 'xiaomi',
  model: 'mimo-v2.5',
  reasoningEffort: 'off',
})

const DEFAULTS = Object.freeze({
  enabled: true,
  models: [DEFAULT_MODEL_ITEM],
  provider: 'xiaomi',
  model: 'mimo-v2.5',
  /** '' = follow the model's own default effort; 'off' disables thinking. */
  reasoningEffort: 'off',
  /**
   * 预算只需容纳「一行标题」的正文，因为本插件默认 reasoningEffort=off
   * （适配器会映射成 thinking:{type:'disabled'}，不产生 reasoning token）。
   * 实测关闭思考时一次标题只花 4–6 tokens，96 足够有余。
   *
   * ⚠️ 只有当输出预算被 reasoning 吃光时才会失败：此时 finish_reason=length
   * 且 content 为空串 → 插件抛 `empty output from model` → 整条托底链全灭
   * → 宿主静默退回 fallback 标题（表现为「自动命名操作失败」）。
   * 因此若把 reasoningEffort 改成 low/high/max 开启思考，务必同步调高此值。
   */
  maxTokens: 96,
  maxInputChars: 2000,
  timeoutMs: 30000,
  maxTitleLength: 80,
})

/** Settings schema served to the 会话标题 tab; ranges mirror its client-side validation. */
function buildSchema() {
  // 注意：本仓 schemastery 版本的裸 z.string() 即为可选（必填要 .required()），
  // 且不存在 .optional() 方法——误用会让 schema 解析抛错，进而让设置卡片整页空白（已踩坑）。
  // 0.2.1 起宿主不再有 settings.register：设置页由「loader 条目 id + 本插件导出的
  // Config」直接投影（SettingsForms.describe），只有 .volatile() 字段会出现在表单里，
  // 且 volatile 不能落在数组/联合的元素内部（只放在字段本身上）。
  return z.object({
    enabled: z.boolean().default(DEFAULTS.enabled).volatile(),
    models: z.array(z.object({
      id: z.string(),
      provider: z.string(),
      model: z.string(),
      reasoningEffort: z.string().default('off'),
    })).default([]).volatile(),
    provider: z.string().volatile(),
    model: z.string().volatile(),
    reasoningEffort: z.string().volatile(),
    maxTokens: z.number().min(32).max(8192).default(DEFAULTS.maxTokens).volatile(),
    maxInputChars: z.number().min(200).max(8000).default(DEFAULTS.maxInputChars).volatile(),
    timeoutMs: z.number().min(3000).max(120000).default(DEFAULTS.timeoutMs).volatile(),
    maxTitleLength: z.number().min(20).max(200).default(DEFAULTS.maxTitleLength).volatile(),
  })
}

/** 宿主 loader 读取的插件 Config（导出名固定为 `Config`）。 */
export const Config = buildSchema()

/** 归一化获取多模型托底链（优先读 models 数组，回退单个 provider/model） */
export function resolveModelChain(config) {
  if (Array.isArray(config.models) && config.models.length > 0) {
    const valid = config.models
      .filter(item => item && typeof item.provider === 'string' && typeof item.model === 'string' && item.provider && item.model)
      .map(item => ({
        provider: item.provider,
        model: item.model,
        reasoningEffort: typeof item.reasoningEffort === 'string' ? item.reasoningEffort : '',
      }))
    if (valid.length > 0) return valid
  }
  if (config.provider && config.model) {
    return [{
      provider: config.provider,
      model: config.model,
      reasoningEffort: typeof config.reasoningEffort === 'string' ? config.reasoningEffort : '',
    }]
  }
  return [{
    provider: DEFAULTS.provider,
    model: DEFAULTS.model,
    reasoningEffort: DEFAULTS.reasoningEffort,
  }]
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

  throw new Error(`dsh-session-title-gen: cannot parse title from "${raw}"`)
}

/** loader 交给 apply 的 Config 是 volatile 包装（取值要 `.get()`）；展开成普通对象。 */
function unwrapConfig(value) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    return unwrapConfig(value.get())
  }
  if (Array.isArray(value)) return value.map(unwrapConfig)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, unwrapConfig(child)]))
  }
  return value
}

function apply(ctx, config) {
  // 0.2.1 起宿主不再有 settings.register：配置由 loader 按本插件导出的 Config 解析后
  // 作为 apply 的第二参数给出（写面落在 profile 的 cordis.patch.yml 的 config 字段）。
  // ⚠️ volatile 字段是**稳定引用**：设置写入只改 ref 的值、不重跑 apply，所以每次取值
  // 都要重新 `.get()`。apply 时快照成普通对象会永远停在启动时的配置（2026-10-18 踩坑）。
  // 未配置的字段回退 DEFAULTS，headless 组合不服务设置页也照常工作。
  const currentConfig = () => ({ ...DEFAULTS, ...unwrapConfig(config) })

  // 设置页已自带自定义卡片：抑制宿主为同一 loader 条目自动生成的通用表单。
  ctx.inject?.(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })

  ctx.sessionTitle.register({
    id: 'dsh-session-title-gen', // 必填：未传会导致 validateProvider 抛错
    automatic: 'first-prompt',
    async generate(request) {
      const { session, messages, signal: incoming } = request
      const first = messages[0]
      if (first === undefined) throw new Error('dsh-session-title-gen: no messages')

      const config = currentConfig()
      // Disabled: fail loud so the sessionTitle mechanism keeps the original name.
      if (config.enabled === false) throw new Error('dsh-session-title-gen: disabled')

      // ① 日期：计算 Asia/Shanghai (UTC+8) 的 MMDD，无 locale 差异
      // 优先取首条消息发送时间，拿不到取当前时间 Date.now()，最后降级 session.header.createdAt
      const firstEventTime = session.eventAt?.(first.seq)?.time
      const ts = typeof firstEventTime === 'number' && Number.isFinite(firstEventTime)
        ? firstEventTime
        : (Date.now?.() ?? session.header?.createdAt ?? 0)
      const d = new Date(ts + 8 * 3600 * 1000)
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const mmdd = `${mm}${dd}`

      // ② 首条消息文本（截断长度可配）
      const msgText = first.text.slice(0, config.maxInputChars)

      // ③ 多模型优先级托底链
      const chain = resolveModelChain(config)

      // ④ 调 LLM（Few-Shot 强约束，严禁答题/写代码）
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

      let lastError = null
      let successResult = null

      for (let i = 0; i < chain.length; i++) {
        const route = chain[i]
        incoming?.throwIfAborted()
        try {
          const timeout = AbortSignal.timeout(config.timeoutMs)
          const signal = incoming === undefined ? timeout : AbortSignal.any([incoming, timeout])

          const assembler = new BlockAssembler()
          for await (const chunk of ctx.llm.stream({
            provider: route.provider,
            model: route.model,
            // 空串 = 跟随模型默认档位（不传该字段）
            ...route.reasoningEffort === '' ? {} : { reasoningEffort: route.reasoningEffort },
            system: SYSTEM_PROMPT,
            messages: [createUserMessage({
              content: [{ type: 'text', text: userPrompt }],
              source: { kind: 'plugin', plugin: 'dsh-session-title-gen' },
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

          // 提取 LLM 输出并解析
          const raw = assembler.blocks()
            .filter(b => b.type === 'text')
            .map(b => b.text).join(' ')
            .trim()
          if (!raw) {
            // 空正文最常见的原因是「输出预算被推理吃光」：此时宿主 finish 为
            // {kind:'max-tokens'} 且没有任何正文块。把这个信号带进错误里，否则
            // 只会看到无信息量的 empty output，排查时完全看不出是预算问题。
            const finishKind = assembler.finish?.kind
            const hint = finishKind === 'max-tokens'
              ? `（finish=max-tokens：${config.maxTokens} tokens 在正文前就耗尽，调高 maxTokens 或设 reasoningEffort=off）`
              : ''
            throw new Error(`empty output from model${hint}`)
          }

          let type, topic
          try {
            const parsed = parseLlmOutput(raw)
            type = parsed.type
            topic = parsed.topic
          } catch (err) {
            ctx.logger?.warn?.('[dsh-session-title-gen] parse failed for raw output:', raw, err)
            type = '探索'
            topic = raw.replace(/^[“"'`]+|[”"'`。.！!]+$/g, '').slice(0, 10).trim() || msgText.slice(0, 8)
          }

          // 组装最终标题：全角统一 MMDD｜类型｜主题
          const finalTitle = `${mmdd}｜${type}｜${topic}`

          // 安全清洗与截断（长度可配）
          const title = normalizeSessionTitle(finalTitle, config.maxTitleLength)
          if (title.length === 0) throw new Error('dsh-session-title-gen: empty after normalize')

          successResult = {
            title,
            messageSeqs: [first.seq],
            model: route,
          }
          if (i > 0) {
            // 成功但发生过降级：明确记下最终用的是哪一级，便于排查
            ctx.logger?.info?.(`[dsh-session-title-gen] 第 ${i + 1}/${chain.length} 级成功：${route.provider}/${route.model}`)
          }
          break // 某级成功即退出托底链
        } catch (err) {
          lastError = err
          // 会话命名是后台静默行为，没有前端流式通道，因此把降级过程落到日志：
          // 明确指出「哪个模型失败 → 正改用哪一个」，否则只会表现为莫名变慢。
          const next = i + 1 < chain.length ? chain[i + 1] : undefined
          const nextLabel = next !== undefined ? ` → 正改用 ${next.provider}/${next.model}` : '（已无后备模型）'
          ctx.logger?.warn?.(
            `[dsh-session-title-gen] 第 ${i + 1}/${chain.length} 级模型 ${route.provider}/${route.model} 报错：${err?.message ?? err}${nextLabel}`,
          )
        }
      }

      if (!successResult) {
        throw (lastError ?? new Error('all fallback models failed'))
      }

      return successResult
    },
  })
}

export { apply, inject, name }
