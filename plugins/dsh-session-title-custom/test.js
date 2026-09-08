import assert from 'node:assert/strict'
import { normalizeSessionTitle } from '@deepseek-ai/dsh-session-title'

const TYPES = ['功能', '设计', '修复', '优化', '发布', '探索', '文档', '研究']

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

function formatTitle(ts, raw) {
  const d = new Date(ts + 8 * 3600 * 1000)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mmdd = `${mm}${dd}`

  const { type, topic } = parseLlmOutput(raw)
  const finalTitle = `${mmdd}｜${type}｜${topic}`
  return normalizeSessionTitle(finalTitle, 80)
}

const ts = Date.UTC(2026, 8, 7, 0, 0, 0) // 2026-09-07 08:00:00 (UTC+8)

assert.equal(formatTitle(ts, '优化|批次文字显示'), '0907｜优化｜批次文字显示')
assert.equal(formatTitle(ts, '功能｜整合快捷键提示页'), '0907｜功能｜整合快捷键提示页')
assert.equal(formatTitle(ts, '设计 | “会话界面方案”'), '0907｜设计｜会话界面方案')
assert.equal(formatTitle(ts, '修复|网络请求超时。'), '0907｜修复｜网络请求超时')
assert.equal(formatTitle(ts, '【优化】批次文字显示'), '0907｜优化｜批次文字显示')
assert.equal(formatTitle(ts, '类型：优化 | 主题：批次文字显示'), '0907｜优化｜批次文字显示')
assert.equal(formatTitle(ts, '优化: 批次文字显示'), '0907｜优化｜批次文字显示')
assert.equal(formatTitle(ts, '输出：优化｜批次文字显示'), '0907｜优化｜批次文字显示')

assert.throws(() => formatTitle(ts, '无效类型|测试'), /cannot parse title/)
assert.throws(() => formatTitle(ts, '没有分隔符'), /cannot parse title/)

console.log('All tests passed!')
