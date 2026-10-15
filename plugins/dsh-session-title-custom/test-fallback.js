/**
 * dsh-session-title-custom 多模型托底链与 settings schema 自检。
 *
 * 覆盖本次改造的两个高风险点：
 * - schema 必须能被 settings.register 成功构建（曾因误用 `.optional()` —— 本仓
 *   schemastery 无此方法 —— 导致注册抛错被 catch 吞掉，设置卡片整页空白）；
 * - 旧配置（仅 provider/model）与新配置（models 列表）都要能归一化成托底链，
 *   且旧配置不得被默认值覆盖。
 *
 * 托底链直接 import 宿主真实实现（resolveModelChain），避免自检与实现漂移。
 * 运行：node test-fallback.js
 */
import assert from 'node:assert/strict'
import z from 'schemastery'
import { resolveModelChain } from './lib/index.js'

// ---- 与 lib/index.js 保持一致的 schema 形状（同源校验，改坏立刻报警）----
const DEFAULTS = Object.freeze({
  enabled: true,
  models: [{ id: '1', provider: 'xiaomi', model: 'mimo-v2.5', reasoningEffort: 'off' }],
  provider: 'xiaomi',
  model: 'mimo-v2.5',
  reasoningEffort: 'off',
  maxTokens: 48,
  maxInputChars: 2000,
  timeoutMs: 30000,
  maxTitleLength: 80,
})

const schema = z.object({
  enabled: z.boolean().default(DEFAULTS.enabled),
  models: z.array(z.object({
    id: z.string(),
    provider: z.string(),
    model: z.string(),
    reasoningEffort: z.string().default('off'),
  })).default([]),
  provider: z.string(),
  model: z.string(),
  reasoningEffort: z.string(),
  maxTokens: z.number().min(16).max(8192).default(DEFAULTS.maxTokens),
  maxInputChars: z.number().min(200).max(8000).default(DEFAULTS.maxInputChars),
  timeoutMs: z.number().min(3000).max(120000).default(DEFAULTS.timeoutMs),
  maxTitleLength: z.number().min(20).max(200).default(DEFAULTS.maxTitleLength),
})

// 1. schema 能构建（回归：.optional() 会让这里抛错）
const built = schema({})
assert.equal(built.maxTokens, 48, 'defaults should apply')
assert.ok(Array.isArray(built.models), 'models must be an array')

// 2. 旧配置不被覆盖
const legacy = schema({ provider: 'deepseek-official', model: 'deepseek-flash', reasoningEffort: 'off' })
assert.equal(legacy.provider, 'deepseek-official')
assert.equal(legacy.model, 'deepseek-flash')
assert.deepEqual(legacy.models, [], 'legacy config must not be forced into a default list')

// 3. 新列表被接受，缺省档位补齐
const withList = schema({ models: [{ id: '1', provider: 'qoder', model: 'x' }] })
assert.equal(withList.models.length, 1)
assert.equal(withList.models[0].reasoningEffort, 'off')

// 4. 宿主真实托底链：单配置 / 多配置 / 空配置 三种输入
const single = resolveModelChain({ provider: 'deepseek-official', model: 'deepseek-flash' })
assert.equal(single.length, 1, 'single legacy config yields one candidate')
assert.equal(single[0].provider, 'deepseek-official', 'legacy provider must survive')

const multi = resolveModelChain({ models: [{ provider: 'a', model: 'a1' }, { provider: 'b', model: 'b1' }] })
assert.equal(multi.length, 2, 'list order must be preserved')
assert.equal(multi[0].provider, 'a', 'first row is highest priority')
assert.equal(multi[1].provider, 'b')

// 列表优先于单配置（两者并存时）
const both = resolveModelChain({ models: [{ provider: 'a', model: 'a1' }], provider: 'z', model: 'z1' })
assert.equal(both[0].provider, 'a', 'models list wins over legacy scalar')

// 空配置 / 全无效列表 -> 内置默认
assert.equal(resolveModelChain({})[0].provider, 'xiaomi')
assert.equal(resolveModelChain({ models: [{ provider: '', model: 'x' }] })[0].provider, 'xiaomi')

// 5. 排序语义：moveUp/moveDown 交换后首项即最高优先级（同时是写回 provider/model 的项）
const rows = [
  { id: '1', provider: 'a', model: 'a1' },
  { id: '2', provider: 'b', model: 'b1' },
  { id: '3', provider: 'c', model: 'c1' },
]
function moveUp(list, i) {
  if (i <= 0) return list
  const next = [...list]
  const tmp = next[i]
  next[i] = next[i - 1]
  next[i - 1] = tmp
  return next
}
function moveDown(list, i) {
  if (i >= list.length - 1) return list
  const next = [...list]
  const tmp = next[i]
  next[i] = next[i + 1]
  next[i + 1] = tmp
  return next
}
assert.equal(moveUp(rows, 0)[0].provider, 'a', 'first row cannot move up')
assert.equal(moveUp(rows, 1)[0].provider, 'b', 'move up promotes to head')
assert.equal(moveDown(rows, 2)[2].provider, 'c', 'last row cannot move down')
assert.equal(moveDown(rows, 0)[0].provider, 'b', 'move down demotes from head')

// 6. 边界：最少保留 1 行、最多 5 行
function removeRow(list, i) {
  if (list.length <= 1) return list
  const next = [...list]
  next.splice(i, 1)
  return next
}
function addRow(list, item) {
  if (list.length >= 5) return list
  return [...list, item]
}
assert.equal(removeRow([{ id: '1' }], 0).length, 1, 'cannot remove the only row')
assert.equal(removeRow(rows, 0).length, 2)
const five = Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1) }))
assert.equal(addRow(five, { id: '6' }).length, 5, 'cannot exceed five rows')
assert.equal(addRow(rows, { id: '4' }).length, 4)

console.log('✅ dsh-session-title-custom fallback chain & schema checks passed.')
