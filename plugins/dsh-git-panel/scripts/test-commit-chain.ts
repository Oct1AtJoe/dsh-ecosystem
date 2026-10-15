/**
 * 提交信息托底链解析自检。
 *
 * 背景（真实故障）：托底链曾无条件追加 `agentDefaultModel` 作为「最终备选」。
 * 用户把表格配成 `antigravity/gemini-4-argon-high`（reasoningEffort: off），
 * 该组合调用报错；而全局默认模型恰是同 provider/model 但 effort=high，能跑通，
 * 且去重只比 provider+model（不比 effort）→ 隐形兜底静默救活，用户配的链明明
 * 全挂了却照样生成出提交信息，无从判断配置是否生效。
 *
 * 本自检锁定的不变量：
 * - 托底链**只**由用户配置构成，绝不追加任何隐形模型；
 * - 表格优先于旧的 git-panel 单模型；两者皆无才用内置默认；
 * - 同名不同 reasoningEffort 的两级不得被判为重复。
 *
 * 直接 import 真实实现，避免自检与实现漂移。
 * 运行：npx esbuild scripts/test-commit-chain.ts --bundle --platform=node --format=esm | node --input-type=module
 */
import { isEffortRejection, resolveCommitModelChain, summarizeFailure } from '../src/host/commit-message.ts'

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

/** 最小 Context 假体：只需 get() 返回 settings / agentDefaultModel。 */
function fakeCtx(settings: Record<string, unknown>, defaultModel?: { provider: string; model: string }): any {
  return {
    get: (name: string) => {
      if (name === 'settings') return { get: (ns: string) => settings[ns] }
      if (name === 'agentDefaultModel') {
        return defaultModel === undefined ? undefined : { currentSelection: () => defaultModel }
      }
      return undefined
    },
  }
}

// ---- 1. 表格优先，且链长度与表格行数一致 ----
const ctxTable = fakeCtx({
  'session-title': {
    enabled: true,
    models: [
      { provider: 'antigravity', model: 'gemini-4-argon-high', reasoningEffort: 'off' },
      { provider: 'deepseek-official', model: 'deepseek-flash', reasoningEffort: 'off' },
    ],
  },
  'git-panel': { provider: 'should-not-win', model: 'nope' },
})
const table = resolveCommitModelChain(ctxTable)
check('表格优先于 git-panel 单模型', table[0]!.provider === 'antigravity', JSON.stringify(table))
check('链长度等于表格行数（无多余追加）', table.length === 2, `len=${table.length}`)
check('第二级顺序保留', table[1]!.model === 'deepseek-flash')

// ---- 2. 核心回归：不得追加 agentDefaultModel ----
// 全局默认模型故意设为一个「不在表格里」的模型，若被追加则长度变 3
const ctxWithDefault = fakeCtx(
  { 'session-title': { enabled: true, models: [{ provider: 'a', model: 'a1' }] } },
  { provider: 'ghost', model: 'ghost-model' },
)
const withDefault = resolveCommitModelChain(ctxWithDefault)
check(
  '绝不追加 agentDefaultModel 隐形兜底',
  !withDefault.some((c) => c.provider === 'ghost'),
  JSON.stringify(withDefault),
)
check('此时链长度仍为 1', withDefault.length === 1, `len=${withDefault.length}`)

// ---- 3. 同名不同 reasoningEffort 不得被当重复丢弃 ----
// 用户表格里就是 x/y(effort=off)，全局默认是 x/y(effort=high)：
// 旧实现会因 provider+model 相同而跳过追加，掩盖问题；新实现干脆不追加。
const ctxSameName = fakeCtx(
  { 'session-title': { enabled: true, models: [{ provider: 'x', model: 'y', reasoningEffort: 'off' }] } },
  { provider: 'x', model: 'y' },
)
const sameName = resolveCommitModelChain(ctxSameName)
check('同名不同档不产生重复级', sameName.length === 1, `len=${sameName.length}`)
check('保留用户配置的 reasoningEffort', sameName[0]!.reasoningEffort === 'off', String(sameName[0]!.reasoningEffort))

// ---- 4. 表格缺位时回退 git-panel ----
const ctxLegacy = fakeCtx({ 'git-panel': { provider: 'deepseek-official', model: 'deepseek-flash', reasoningEffort: 'off' } })
const legacy = resolveCommitModelChain(ctxLegacy)
check('无表格时回退 git-panel 单模型', legacy[0]!.provider === 'deepseek-official', JSON.stringify(legacy))
check('回退链长度为 1', legacy.length === 1)

// ---- 5. 两者皆无 → 内置默认 ----
const builtin = resolveCommitModelChain(fakeCtx({}))
check('空配置回退内置默认', builtin.length === 1 && builtin[0]!.provider.length > 0, JSON.stringify(builtin))

// ---- 6. enabled=false 时表格被忽略（回退 git-panel）----
const ctxDisabled = fakeCtx({
  'session-title': { enabled: false, models: [{ provider: 'ignored', model: 'ignored' }] },
  'git-panel': { provider: 'fallback', model: 'fb' },
})
const disabled = resolveCommitModelChain(ctxDisabled)
check('enabled=false 时忽略表格', disabled[0]!.provider === 'fallback', JSON.stringify(disabled))

// ---- 7. 表格含无效行时被过滤 ----
const ctxPartial = fakeCtx({
  'session-title': {
    enabled: true,
    models: [
      { provider: '', model: 'no-provider' },
      { provider: 'ok', model: '' },
      { provider: 'good', model: 'good-model' },
    ],
  },
})
const partial = resolveCommitModelChain(ctxPartial)
check('过滤 provider/model 为空的行', partial.length === 1 && partial[0]!.provider === 'good', JSON.stringify(partial))

// ---- 8. settings 服务缺失不得抛错 ----
const ctxNoSettings: any = { get: () => undefined }
const noSettings = resolveCommitModelChain(ctxNoSettings)
check('settings 缺席时安全回退内置默认', noSettings.length === 1, JSON.stringify(noSettings))

// ---- 9. 思考档位被拒时的判定规则（直接 import 真实实现，避免自检漂移） ----
// 只有「明确指向 reasoning effort 被拒」的报错才允许丢弃档位重试，
// 其他报错（欠费、超时、鉴权）必须原样上报，不能靠丢档位掩盖。
check(
  'workbuddy 的档位报错被识别',
  isEffortRejection('the reasoning effort value is not supported by the current model'),
)
check(
  'antigravity 的档位报错被识别',
  isEffortRejection('provider "antigravity" model "gemini-3.8-flash-high" does not support reasoning effort "off"'),
)
check('欠费/配额报错不被误判', !isEffortRejection('insufficient balance, please top up'))
check('超时不被误判', !isEffortRejection('DeepSeek request aborted by caller'))
check('鉴权失败不被误判', !isEffortRejection('401 Unauthorized: invalid api key'))
check('纯 400 但非档位原因不被误判', !isEffortRejection('400: invalid_request_error: model not found'))

// ---- 10. 报错提炼：上游把错误塞成整串 JSON（实测 626 字符），界面要的是其中一句 ----
// 取自用户截图里的真实报错原文
const RAW_WORKBUDDY = '400: {"message":"workbuddy upstream client (http 400): {\\"code\\":11150,\\"msg\\":\\"the reasoning effort value is not supported by the current model\\",\\"requestId\\":\\"c7b29033-05e9-49bd-94d0-3aa65d8e1231\\",\\"extError\\":{\\"code\\":\\"invalid_request_error\\",\\"message\\":\\"the reasoning effort value is not supported by the current model\\",\\"param\\":\\"\\",\\"type\\":\\"invalid_request_error\\",\\"StatusCode\\":400,\\"Request\\":null,\\"Response\\":null},\\"displayMsg\\":{\\"en\\":\\"Reasoning effort not supported.\\"},\\"type\\":\\"client\\",\\"code\\":\\"client\\"}","displayMsg":{"en":"Reasoning effort not supported."},"type":"client","code":"client"}'
const summarized = summarizeFailure(RAW_WORKBUDDY)
check('原始长报错被大幅压缩', summarized.length < 80, `原 ${RAW_WORKBUDDY.length} → ${summarized.length}`)
check('提炼出可读原因（取 displayMsg）', summarized === 'Reasoning effort not supported.', summarized)

check(
  '欠费报错提炼出 message 字段',
  summarizeFailure('400: {"code":402,"message":"Insufficient account balance","type":"insufficient_balance"}') === 'Insufficient account balance',
  summarizeFailure('400: {"code":402,"message":"Insufficient account balance","type":"insufficient_balance"}'),
)
check('已是短句的报错原样保留', summarizeFailure('DeepSeek request aborted by caller') === 'DeepSeek request aborted by caller')
check('空报错有兜底文案', summarizeFailure('') === 'unknown error')
check('超长纯文本被截断', summarizeFailure('x'.repeat(500)).length <= 161, String(summarizeFailure('x'.repeat(500)).length))
check('非 JSON 的 401 不被破坏', summarizeFailure('401 Unauthorized: invalid api key').includes('invalid api key'))

console.log('\n提交信息托底链自检完成。')
