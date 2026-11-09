/**
 * 提交信息托底链解析自检。
 *
 * 背景（真实故障）：托底链曾无条件追加 `agentDefaultModel` 作为「最终备选」。
 * 用户把表格配成 `antigravity/gemini-4-argon-high`（reasoningEffort: off），
 * 该组合调用报错；而全局默认模型恰是同 provider/model 但 effort=high，能跑通，
 * 且去重只比 provider+model（不比 effort）→ 隐形兜底静默救活，用户配的链明明
 * 全挂了却照样生成出提交信息，无从判断配置是否生效。
 *
 * 现状（合并插件后）：
 * - 第 1 级读 `dsh-session-folders`（含原 title-gen）设置条目 `dsh-session-folders-custom`
 *   的 `models[]` / 单个 provider+model（通过 `settings.describe()` 读取）；
 * - 第 1 级「无该条目 / 无有效模型 / enabled=false」时，才兜底 `agentDefaultModel`；
 * - 仍无才用内置默认。
 *
 * 本自检锁定的不变量：
 * - 有 title 表格时，托底链**只**由用户配置构成，绝不追加任何隐形模型（含 agentDefaultModel）；
 * - 无 title 条目时才用「对话框默认模型」；两者皆无才内置默认；
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

/**
 * 最小 Context 假体：
 * - settings.describe() 返回 descriptor 列表（合并插件条目 ns=dsh-session-folders-custom）；
 * - agentDefaultModel.currentSelection() 返回对话框默认模型。
 */
function fakeCtx(opts: {
  title?: Record<string, unknown> | null
  descriptorsExtra?: Array<{ ns: string; value: unknown }>
  defaultModel?: { provider: string; model: string; reasoningEffort?: string }
  noSettings?: boolean
} = {}): any {
  return {
    get: (name: string) => {
      if (name === 'settings') {
        if (opts.noSettings === true) return undefined
        const list: Array<{ ns: string; value: unknown }> = []
        if (opts.title !== undefined && opts.title !== null) {
          list.push({ ns: 'dsh-session-folders-custom', value: opts.title })
        }
        if (opts.descriptorsExtra !== undefined) list.push(...opts.descriptorsExtra)
        return { describe: () => list }
      }
      if (name === 'agentDefaultModel') {
        return opts.defaultModel === undefined ? undefined : { currentSelection: () => opts.defaultModel }
      }
      return undefined
    },
  }
}

// ---- 1. 表格优先，且链长度与表格行数一致；有表格时绝不追加默认模型 ----
const table = resolveCommitModelChain(fakeCtx({
  title: {
    enabled: true,
    models: [
      { provider: 'antigravity', model: 'gemini-4-argon-high', reasoningEffort: 'off' },
      { provider: 'deepseek-official', model: 'deepseek-flash', reasoningEffort: 'off' },
    ],
  },
  defaultModel: { provider: 'ghost', model: 'ghost-model' },
}))
check('表格优先', table[0]!.provider === 'antigravity', JSON.stringify(table))
check('链长度等于表格行数（无多余追加）', table.length === 2, `len=${table.length}`)
check('第二级顺序保留', table[1]!.model === 'deepseek-flash')

// ---- 2. 核心回归：有表格时不得追加 agentDefaultModel ----
const withDefault = resolveCommitModelChain(fakeCtx({
  title: { enabled: true, models: [{ provider: 'a', model: 'a1' }] },
  defaultModel: { provider: 'ghost', model: 'ghost-model' },
}))
check('绝不追加 agentDefaultModel 隐形兜底', !withDefault.some((c) => c.provider === 'ghost'), JSON.stringify(withDefault))
check('此时链长度仍为 1', withDefault.length === 1, `len=${withDefault.length}`)

// ---- 3. 同名不同 reasoningEffort 不得被当重复丢弃 ----
const sameName = resolveCommitModelChain(fakeCtx({
  title: { enabled: true, models: [{ provider: 'x', model: 'y', reasoningEffort: 'off' }] },
  defaultModel: { provider: 'x', model: 'y' },
}))
check('同名不同档不产生重复级', sameName.length === 1, `len=${sameName.length}`)
check('保留用户配置的 reasoningEffort', sameName[0]!.reasoningEffort === 'off', String(sameName[0]!.reasoningEffort))

// ---- 4. 无 title 条目 → 回退「对话框当前的默认模型」 ----
const fallback = resolveCommitModelChain(fakeCtx({
  defaultModel: { provider: 'magpie', model: 'group/cheap-first', reasoningEffort: 'high' },
}))
check('无 title 条目时回退 agentDefaultModel', fallback.length === 1 && fallback[0]!.provider === 'magpie', JSON.stringify(fallback))
check('默认模型 model 正确', fallback[0]!.model === 'group/cheap-first', String(fallback[0]!.model))
check('默认模型 reasoningEffort 保留', fallback[0]!.reasoningEffort === 'high', String(fallback[0]!.reasoningEffort))

// ---- 5. 两者皆无 → 内置默认 ----
const builtin = resolveCommitModelChain(fakeCtx({}))
check('空配置回退内置默认', builtin.length === 1 && builtin[0]!.provider === 'deepseek-official', JSON.stringify(builtin))

// ---- 6. enabled=false 时忽略表格（回退默认模型）----
const disabled = resolveCommitModelChain(fakeCtx({
  title: { enabled: false, models: [{ provider: 'ignored', model: 'ignored' }] },
  defaultModel: { provider: 'chat', model: 'chat-m' },
}))
check('enabled=false 时忽略表格', disabled[0]!.provider === 'chat', JSON.stringify(disabled))

// ---- 7. 表格含无效行时被过滤 ----
const partial = resolveCommitModelChain(fakeCtx({
  title: {
    enabled: true,
    models: [
      { provider: '', model: 'no-provider' },
      { provider: 'ok', model: '' },
      { provider: 'good', model: 'good-model' },
    ],
  },
}))
check('过滤 provider/model 为空的行', partial.length === 1 && partial[0]!.provider === 'good', JSON.stringify(partial))

// ---- 8. settings 服务缺失不得抛错 ----
const noSettings = resolveCommitModelChain(fakeCtx({ noSettings: true }))
check('settings 缺席时安全回退内置默认', noSettings.length === 1, JSON.stringify(noSettings))

// ---- 8b. settings 存在但无 describe() → 安全回退 ----
const noDescribe: any = { get: (n: string) => (n === 'settings' ? {} : undefined) }
const noDescribeChain = resolveCommitModelChain(noDescribe)
check('settings 无 describe() 时安全回退内置默认', noDescribeChain.length === 1, JSON.stringify(noDescribeChain))

// ---- 8c. 非固定 ns 的合并插件条目也能按形状识别 ----
const shape = resolveCommitModelChain(fakeCtx({
  descriptorsExtra: [{ ns: 'some-custom-id', value: { models: [{ provider: 's', model: 'sm' }], maxTitleLength: 50 } }],
}))
check('按形状识别 title 条目', shape[0]!.provider === 's', JSON.stringify(shape))

// ---- 9. 思考档位被拒时的判定规则（直接 import 真实实现，避免自检漂移） ----
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
