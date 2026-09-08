import { createUserMessage, BlockAssembler } from '@deepseek-ai/dsh-llm'
import { normalizeSessionTitle } from '@deepseek-ai/dsh-session-title'

const name = 'dsh-session-title-custom'
const inject = ['sessionTitle', 'llm', 'sessions']

const TYPES = ['功能', '设计', '修复', '优化', '发布', '探索', '文档', '研究']

const SYSTEM_PROMPT = [
  '你是会话标题生成助手。根据用户的第一条消息，判断对话类型并生成简短主题。',
  '',
  '规则：',
  `- 类型只能是以下之一：${TYPES.join('、')}`,
  '- 主题用 2-8 个字概括消息内容',
  '- 主题不要出现类型名称',
  '- 输出格式为一行：类型|主题',
  '- 不要输出其他文字，不要引号，不要解释',
  '',
  '示例：',
  '消息：优化批次文字显示',
  '输出：优化|批次文字显示',
  '',
  '消息：整合快捷键提示页面',
  '输出：功能|整合快捷键提示页',
  '',
  '消息：提交代码到 GitHub',
  '输出：发布|提交代码到GitHub',
  '',
  '消息：讨论新版会话界面的设计方案',
  '输出：设计|会话界面方案',
  '',
  '消息：排查网络请求超时的原因',
  '输出：修复|网络请求超时',
].join('\n')

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

function apply(ctx) {
  ctx.sessionTitle.register({
    id: 'dsh-session-title-custom', // 必填：未传会导致 validateProvider 抛错
    automatic: 'first-prompt',
    async generate(request) {
      const { session, messages, signal } = request
      const first = messages[0]
      if (first === undefined) throw new Error('dsh-session-title-custom: no messages')

      // ① 日期：计算 Asia/Shanghai (UTC+8) 的 MMDD，无 locale 差异
      const ts = session.header.createdAt
      const d = new Date(ts + 8 * 3600 * 1000)
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const mmdd = `${mm}${dd}`

      // ② 首条消息文本（防御超长输入）
      const msgText = first.text.slice(0, 2000)

      // ③ 模型路由决策
      const route = request.route ?? {
        provider: 'deepseek-official',
        model: 'deepseek-v4-flash',
      }

      // ④ 调 LLM（不传 reasoningEffort，避免非 DeepSeek 模型如 Gemini 抛出 UNSUPPORTED_REASONING_EFFORT）
      const assembler = new BlockAssembler()
      for await (const chunk of ctx.llm.stream({
        provider: route.provider,
        model: route.model,
        system: SYSTEM_PROMPT,
        messages: [createUserMessage({
          content: [{ type: 'text', text: JSON.stringify({ message: msgText }) }],
          source: { kind: 'plugin', plugin: 'dsh-session-title-custom' },
        })],
        maxTokens: 512,
        purpose: 'session-title',
        signal,
      })) {
        assembler.push(chunk)
      }
      signal?.throwIfAborted()
      if (assembler.finish.kind === 'error' || assembler.finish.kind === 'aborted') {
        throw (assembler.finish.failure instanceof Error
          ? assembler.finish.failure
          : new Error(assembler.finish.failure?.message ?? 'stream failure'))
      }

      // ⑤ 提取 LLM 输出并解析
      const raw = assembler.blocks()
        .filter(b => b.type === 'text')
        .map(b => b.text).join(' ')
        .trim()

      const { type, topic } = parseLlmOutput(raw)

      // ⑥ 组装最终标题：全角统一 MMDD｜类型｜主题
      const finalTitle = `${mmdd}｜${type}｜${topic}`

      // 安全清洗与截断
      const title = normalizeSessionTitle(finalTitle, 80)
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
