/**
 * 「自动生成提交信息」的端到端自检：用一个 stub 的 llm 服务跑通
 * 暂存区读取、空暂存区 / 无模型 / 成功三条路径，断言失败路径不改动输入。
 * 与 test-host.ts 同一套路——用 esbuild 打包后由 node 运行，无需 DSH 运行时。
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { GitService, type GitRunner } from '../src/host/git-service.ts'
import { generateCommitMessage } from '../src/host/commit-message.ts'

const runner: GitRunner = {
  run(argv, cwd) {
    return new Promise((resolve) => {
      const child = spawn('git', [...argv], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = ''; let stderr = ''
      child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
      child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }))
    })
  },
}

const service = new GitService(runner, async (p) => ({ ok: true, canonical: p }))

function check(name: string, ok: boolean, extra = ''): void {
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!ok) process.exitCode = 1
}

/** 构造一个只暴露 llm / settings 的 Context 替身。 */
function fakeContext(options: {
  provider?: string
  model?: string
  reasoningEffort?: string
  reply?: string
  fail?: string
  noLlm?: boolean
  captured?: Record<string, unknown>
}): Context {
  const llm = options.noLlm ? undefined : {
    stream(streamOpts: Record<string, unknown>) {
      if (options.captured) {
        Object.assign(options.captured, streamOpts)
      }
      const chunks: unknown[] = options.fail === undefined
        ? [{ type: 'text-delta', index: 0, text: options.reply ?? '' }, { type: 'finish', reason: { kind: 'stop' } }]
        : [{ type: 'finish', reason: { kind: 'error', failure: { message: options.fail, code: 'X' } } }]
      return {
        async *[Symbol.asyncIterator]() { for (const chunk of chunks) yield chunk },
      }
    },
  }
  const stub: Record<string, unknown> = {
    llm,
    settings: {
      get: (ns: string) => {
        if (ns === 'git-panel' && (options.provider !== undefined || options.model !== undefined || options.reasoningEffort !== undefined)) {
          return { provider: options.provider, model: options.model, reasoningEffort: options.reasoningEffort }
        }
        return undefined
      },
    },
  }
  return { get: (name: string) => stub[name] } as unknown as Context
}

async function git(cwd: string, argv: string[]): Promise<void> {
  const run = await runner.run(argv, cwd)
  if (run.exitCode !== 0) throw new Error(`git ${argv.join(' ')}: ${run.stderr}`)
}

async function main(): Promise<void> {
  const repo = mkdtempSync(join(tmpdir(), 'gitpanel-gen-'))
  try {
    await git(repo, ['init', '-q'])
    await git(repo, ['config', 'user.email', 'test@test.com'])
    await git(repo, ['config', 'user.name', 'Tester'])
    writeFileSync(join(repo, 'a.txt'), 'hello\n')
    await git(repo, ['add', 'a.txt'])
    await git(repo, ['commit', '-qm', 'feat: init'])

    // 1) 暂存区为空（有一个未暂存改动）→ stagedContext.diff 为空
    writeFileSync(join(repo, 'a.txt'), 'hello\nworld\n')
    const clean = await service.stagedContext(repo)
    check('stagedContext 返回暂存区为空', clean.ok && clean.diff.trim() === '', clean.ok ? '' : clean.error.message)

    // 2) 空暂存区 → empty-stage，且不产生任何信息
    const empty = await generateCommitMessage(fakeContext({ provider: 'p', model: 'm', reply: 'x' }), service, repo)
    check('空暂存区报 empty-stage', !empty.ok && empty.error.code === 'empty-stage', empty.ok ? empty.message : empty.error.code)

    // 3) 暂存改动 → stagedContext 带出 diff 与历史主题
    await git(repo, ['add', '-A'])
    const staged = await service.stagedContext(repo)
    check('stagedContext 带出 diff', staged.ok && staged.diff.includes('+world'), staged.ok ? '' : staged.error.message)
    check('stagedContext 带出历史主题', staged.ok && staged.subjects[0] === 'feat: init', staged.ok ? String(staged.subjects) : staged.error.message)

    // 4) 无可用模型 / LLM 服务不可用 → no-model
    const noModel = await generateCommitMessage(fakeContext({ noLlm: true }), service, repo)
    check('无 LLM 服务报 no-model', !noModel.ok && noModel.error.code === 'no-model', noModel.ok ? noModel.message : noModel.error.code)
    // 配置为空 = 没配过 → 回退内置默认模型（而非 no-model）。stub 未设 reply 故为空输出。
    const emptyCfgCapture: Record<string, unknown> = {}
    await generateCommitMessage(
      fakeContext({ provider: '', model: '', reply: 'fallback works', captured: emptyCfgCapture }),
      service,
      repo,
    )
    check(
      '配置为空时回退内置默认模型',
      emptyCfgCapture.provider === 'deepseek-official' && emptyCfgCapture.model === 'deepseek-flash',
      `${String(emptyCfgCapture.provider)}/${String(emptyCfgCapture.model)}`,
    )

    // 5) 默认配置生成：验证默认采用 deepseek 官方 + deepseek-flash + 关闭思考
    const captured: Record<string, unknown> = {}
    const ok = await generateCommitMessage(
      fakeContext({ reply: '```\nfeat: add world line\n```', captured }),
      service,
      repo,
    )
    check('默认生成成功', ok.ok && ok.message === 'feat: add world line', ok.ok ? ok.message : ok.error.message)
    check('默认使用 deepseek-official', captured.provider === 'deepseek-official', String(captured.provider))
    check('默认使用 deepseek-flash', captured.model === 'deepseek-flash', String(captured.model))
    check('默认关闭思考 (reasoningEffort: off)', captured.reasoningEffort === 'off', String(captured.reasoningEffort))

    // 6) 模型失败 → generate-failed（客户端据此保留输入框原文）
    const failed = await generateCommitMessage(fakeContext({ provider: 'deepseek', model: 'chat', fail: 'boom' }), service, repo)
    check('模型失败报 generate-failed', !failed.ok && failed.error.code === 'generate-failed', failed.ok ? failed.message : failed.error.code)

    // 7) 模型返回空 → generate-failed，而不是回填空串
    const blank = await generateCommitMessage(fakeContext({ provider: 'deepseek', model: 'chat', reply: '   ' }), service, repo)
    check('空输出报 generate-failed', !blank.ok && blank.error.code === 'generate-failed', blank.ok ? blank.message : blank.error.code)

    // 8) 流式事件：降级必须在「切换到下一个模型之前」发出 fallback 帧
    //    构造两级链：第 1 级必失败，第 2 级成功，检查事件序列与顺序。
    const chainCtx = {
      get: (name: string) => {
        if (name === 'settings') {
          return {
            get: (ns: string) => {
              if (ns === 'session-title') {
                return {
                  enabled: true,
                  models: [
                    { provider: 'p1', model: 'm1', reasoningEffort: '' },
                    { provider: 'p2', model: 'm2', reasoningEffort: '' },
                  ],
                }
              }
              return undefined
            },
          }
        }
        if (name === 'llm') {
          return {
            stream(opts: Record<string, unknown>) {
              const failed = opts.model === 'm1'
              const chunks: unknown[] = failed
                ? [{ type: 'finish', reason: { kind: 'error', failure: { message: 'boom on m1' } } }]
                : [{ type: 'text-delta', index: 0, text: 'feat: ok from m2' }, { type: 'finish', reason: { kind: 'stop' } }]
              return { async *[Symbol.asyncIterator]() { for (const c of chunks) yield c } }
            },
          }
        }
        return undefined
      },
    } as unknown as Context

    const events: string[] = []
    const streamed = await generateCommitMessage(chainCtx, service, repo, (event) => {
      if (event.type === 'attempt') events.push(`attempt:${event.index}/${event.total}:${event.model}`)
      else if (event.type === 'fallback') events.push(`fallback:${event.index}:${event.model}->${event.nextModel ?? 'none'}`)
      else if (event.type === 'effort-retry') events.push(`effort-retry:${event.model}`)
      else if (event.type === 'result') events.push(`result:${event.ok ? 'ok' : 'fail'}`)
    })

    check('两级链最终由第二级成功', streamed.ok && streamed.message === 'feat: ok from m2', streamed.ok ? streamed.message : streamed.error.message)
    check(
      '事件顺序：attempt1 → fallback(→m2) → attempt2 → result',
      events.join(' | ') === 'attempt:1/2:m1 | fallback:1:m1->m2 | attempt:2/2:m2 | result:ok',
      events.join(' | '),
    )
    check('fallback 帧确实指向下一个模型', events.some((e) => e === 'fallback:1:m1->m2'))
    check('终结帧 result 有且仅有一条', events.filter((e) => e.startsWith('result:')).length === 1)

    // 9) 每级失败：终结帧仍只有一条，且带错误
    const allFailEvents: string[] = []
    const allFail = await generateCommitMessage(
      {
        get: (name: string) => {
          if (name === 'settings') {
            return { get: (ns: string) => ns === 'session-title'
              ? { enabled: true, models: [{ provider: 'p1', model: 'm1' }, { provider: 'p2', model: 'm2' }] }
              : undefined }
          }
          if (name === 'llm') {
            return {
              stream() {
                const chunks: unknown[] = [{ type: 'finish', reason: { kind: 'error', failure: { message: 'always boom' } } }]
                return { async *[Symbol.asyncIterator]() { for (const c of chunks) yield c } }
              },
            }
          }
          return undefined
        },
      } as unknown as Context,
      service,
      repo,
      (event) => {
        if (event.type === 'fallback') allFailEvents.push(`fallback:${event.model}->${event.nextModel ?? 'none'}`)
        else if (event.type === 'result') allFailEvents.push(`result:${event.ok ? 'ok' : 'fail'}`)
      },
    )
    check('全部失败返回 generate-failed', !allFail.ok && allFail.error.code === 'generate-failed')
    check('全部失败时终结帧仍只有一条', allFailEvents.filter((e) => e.startsWith('result:')).length === 1, allFailEvents.join(' | '))
    check('最后一级的 fallback 不再指向任何模型', allFailEvents.at(-2) === 'fallback:m2->none', allFailEvents.join(' | '))
    // 流式路径：明细已由 fallback 帧逐条给出，终结错误只报总结，
    // 否则红字会与黄字降级记录 100% 重复（曾导致界面噪音翻倍）。
    check(
      '流式路径的终结错误为精简总结、不重复明细',
      !allFail.ok
        && allFail.error.message.includes('共 2 个')
        && !allFail.error.message.includes('always boom'),
      allFail.ok ? '' : allFail.error.message,
    )

    // 11) 单模型链 + 档位被拒：会产生两条记录（effort-retry + fallback），
    //     但链上只有 1 个模型。客户端曾拿「记录条数」当模型数，把 1 个说成
    //     「全部 2 个模型」。这里锁住事件里的 total 始终等于真实链长。
    const singleEvents: Array<{ type: string; total?: number }> = []
    const single = await generateCommitMessage(
      {
        get: (name: string) => {
          if (name === 'settings') {
            return { get: (ns: string) => ns === 'session-title'
              ? { enabled: true, models: [{ provider: 'p1', model: 'm1', reasoningEffort: 'off' }] }
              : undefined }
          }
          if (name === 'llm') {
            return {
              stream() {
                // 档位被拒：既触发 effort-retry，重试后仍失败再触发 fallback
                const chunks: unknown[] = [{
                  type: 'finish',
                  reason: { kind: 'error', failure: { message: 'the reasoning effort value is not supported by the current model' } },
                }]
                return { async *[Symbol.asyncIterator]() { for (const c of chunks) yield c } }
              },
            }
          }
          return undefined
        },
      } as unknown as Context,
      service,
      repo,
      (event) => {
        if (event.type === 'attempt') singleEvents.push({ type: 'attempt', total: event.total })
        else if (event.type === 'fallback') singleEvents.push({ type: 'fallback', total: event.total })
        else if (event.type === 'effort-retry') singleEvents.push({ type: 'effort-retry' })
      },
    )
    check('单模型链最终失败', !single.ok && single.error.code === 'generate-failed')
    check(
      '单模型链同时产生了 effort-retry 与 fallback 两条记录',
      singleEvents.some((e) => e.type === 'effort-retry') && singleEvents.some((e) => e.type === 'fallback'),
      JSON.stringify(singleEvents),
    )
    check(
      '事件里的 total 始终为 1（记录条数 ≠ 模型数）',
      singleEvents.filter((e) => e.total !== undefined).every((e) => e.total === 1),
      JSON.stringify(singleEvents),
    )
    check(
      '单模型链最后一条 fallback 不再指向任何模型',
      singleEvents.filter((e) => e.type === 'fallback').length === 1,
      JSON.stringify(singleEvents),
    )

    // 12) 不传 onEvent（非流式）：终结错误必须带完整明细，因为它是唯一出口
    const noHookFail = await generateCommitMessage(
      {
        get: (name: string) => {
          if (name === 'settings') {
            return { get: (ns: string) => ns === 'session-title'
              ? { enabled: true, models: [{ provider: 'p1', model: 'm1' }] }
              : undefined }
          }
          if (name === 'llm') {
            return {
              stream() {
                const chunks: unknown[] = [{ type: 'finish', reason: { kind: 'error', failure: { message: 'solo boom' } } }]
                return { async *[Symbol.asyncIterator]() { for (const c of chunks) yield c } }
              },
            }
          }
          return undefined
        },
      } as unknown as Context,
      service,
      repo,
    )
    check(
      '非流式路径的终结错误保留完整明细',
      !noHookFail.ok && noHookFail.error.message.includes('solo boom'),
      noHookFail.ok ? '' : noHookFail.error.message,
    )

    // 11) 不传 onEvent 时行为与旧版一致（向后兼容）
    const noHook = await generateCommitMessage(
      {
        get: (name: string) => {
          if (name === 'settings') {
            return { get: (ns: string) => ns === 'session-title'
              ? { enabled: true, models: [{ provider: 'p1', model: 'm1' }] }
              : undefined }
          }
          if (name === 'llm') {
            return {
              stream() {
                const chunks: unknown[] = [{ type: 'text-delta', index: 0, text: 'feat: no hook' }, { type: 'finish', reason: { kind: 'stop' } }]
                return { async *[Symbol.asyncIterator]() { for (const c of chunks) yield c } }
              },
            }
          }
          return undefined
        },
      } as unknown as Context,
      service,
      repo,
    )
    check('省略 onEvent 仍能正常生成', noHook.ok && noHook.message === 'feat: no hook', noHook.ok ? noHook.message : noHook.error.message)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
}

main().catch((error) => { console.error('测试失败:', error); process.exit(1) })
