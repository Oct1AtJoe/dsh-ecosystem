// 子代理会话不通知回归测试（§5.1「子代理不触发」/ §七 #37）。
// 直接驱动 Host half 的三条检测路径（session/event 事件路径 + /state 轮询兜底），
// 断言：主会话 turn/end 出通知，子代理子会话（header.origin === 'subagent'）不出。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 隔离状态文件：DSH_HOME 必须在模块加载前设好（模块顶层读它算 STATE_FILE），
// 否则测试会读写真宠物账本。用动态 import 保证顺序。
process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'kanye-pet-test-'))
const { apply } = await import('../lib/index.mjs')
const { STATE_PATH } = await import('../lib/src/routes.mjs')

const MAIN_HEADER = { version: 0, id: 'x', createdAt: 1 }
/** 实证自真实会话日志 header：{"parentSession":"session-…","origin":"subagent","delegationDepth":1} */
const SUBAGENT_HEADER = { version: 0, id: 'x', createdAt: 1, parentSession: 'session-main', origin: 'subagent', delegationDepth: 1 }

function session(id, header) {
  const events = []
  return { id, header, snapshotEvents: () => events, push: (e) => events.push(e) }
}

const turnEnd = (seq, turn, kind = 'completed') => ({ type: 'turn/end', seq, time: Date.now(), data: { turn, reason: { kind } } })
const toolCall = (seq, name = 'glob') => ({ type: 'tool/call', seq, time: Date.now(), data: { name } })

// notify 日志拦截常驻（吞掉插件 DEBUG 噪音，只留 notify 行供断言）；测试文件串行执行，
// 每个 harness 换一个 sink，测试之间互不串味。
let logs = []
console.log = (...args) => { if (String(args[0]).includes('[kanye-pet] notify')) logs.push(String(args[0])) }

/** 单次 apply() 的宿主替身：捕获事件处理器、路由处理器、job 终态回调与 notify 日志。 */
function harness() {
  const handlers = new Map()
  const routes = new Map()
  logs = []
  const sessions = []
  const jobList = []
  let onJobDone = () => {}
  const ctx = {
    get: (name) => {
      if (name === 'sessions') return { list: () => sessions }
      if (name === 'webServer') return { register: (entry) => { routes.set(entry.path, entry.handler) } }
      return undefined
    },
    on: (event, handler) => { handlers.set(event, handler) },
    effect: (fn) => { fn() },
    provide: () => {},
    jobs: { list: () => jobList, onJobDone: (cb) => { onJobDone = cb } },
    agents: { list: () => [{ id: 'agent-1' }] },
  }
  apply(ctx)
  const fire = (s, event) => handlers.get('session/event')(s, event)
  const state = async () => {
    let body = null
    await routes.get(STATE_PATH)(
      { method: 'GET', url: STATE_PATH, headers: { host: '127.0.0.1:3080' } },
      { writeHead: () => {}, end: (payload) => { body = JSON.parse(payload) } },
    )
    return body
  }
  return { sessions, jobList, fire, state, endJob: (snapshot) => onJobDone(snapshot), get logs() { return logs } }
}

/** 首见会话只记去重基线不通知——为后续回合铺路。 */
function seed(fire, s) {
  s.push(turnEnd(2, 1))
  fire(s, toolCall(3))
}

test('主会话 turn/end 出气泡，子代理会话不出', () => {
  const h = harness()
  const main = session('session-main', MAIN_HEADER)
  const sub = session('sub-event', SUBAGENT_HEADER)
  h.sessions.push(main, sub)
  seed(h.fire, main)
  seed(h.fire, sub)

  sub.push(turnEnd(5, 2))
  h.fire(sub, toolCall(6))
  assert.deepEqual(h.logs, [], '子代理回合完成不得发通知')

  main.push(turnEnd(5, 2))
  h.fire(main, toolCall(6))
  assert.equal(h.logs.length, 1, '主会话回合完成必须发通知')
  assert.match(h.logs[0], /session-main: "任务完成"/)
})

test('子代理的审批/提问快速路径不发通知', () => {
  const h = harness()
  const sub = session('sub-pending', SUBAGENT_HEADER)
  h.sessions.push(sub)
  seed(h.fire, sub)

  h.fire(sub, { type: 'approval/asked', seq: 4, time: Date.now(), data: {} })
  h.fire(sub, toolCall(5, 'ask_user_question'))
  h.fire(sub, toolCall(6, 'exit_plan_mode'))
  assert.deepEqual(h.logs, [])
})

test('/state 轮询兜底同样跳过子代理，主会话仍兜底通知', async () => {
  const withSub = harness()
  const sub = session('sub-poll', SUBAGENT_HEADER)
  withSub.sessions.push(sub)
  seed(withSub.fire, sub)
  sub.push(turnEnd(5, 2)) // 只写日志不投事件：只能靠轮询兜底发现
  assert.equal((await withSub.state()).notification, null)

  const withMain = harness()
  const main = session('session-poll', MAIN_HEADER)
  withMain.sessions.push(main)
  seed(withMain.fire, main)
  main.push(turnEnd(5, 2))
  const notification = (await withMain.state()).notification
  assert.equal(notification?.title, '任务完成')
  assert.equal(notification?.sessionId, 'session-poll')
})

test('fork 世系（仅有 parentSession）仍算主会话，照常通知', () => {
  const h = harness()
  const forked = session('session-fork', { version: 0, id: 'x', createdAt: 1, parentSession: 'session-main' })
  h.sessions.push(forked)
  seed(h.fire, forked)
  forked.push(turnEnd(5, 2))
  h.fire(forked, toolCall(6))
  assert.equal(h.logs.length, 1)
})

// ---- 庆祝（activity.turnCompleted / activity.name === 'celebrate'）----
const turnEndEvent = (seq, turn) => ({ type: 'turn/end', seq, time: Date.now(), data: { turn, reason: { kind: 'completed' } } })

test('子代理 turn/end 不开庆祝窗口，主会话开', async () => {
  const h = harness()
  const sub = session('sub-turn', SUBAGENT_HEADER)
  const main = session('session-turn', MAIN_HEADER)
  h.sessions.push(main, sub)

  h.fire(sub, turnEndEvent(4, 1))
  assert.equal((await h.state()).activity.turnCompleted, false, '子代理回合完成不得庆祝')

  h.fire(main, turnEndEvent(4, 1))
  assert.equal((await h.state()).activity.turnCompleted, true, '主会话回合完成必须庆祝')
})

test('子代理自有 job 的轮询翻转不庆祝，主会话自有 job 照常庆祝', async () => {
  const withSub = harness()
  const sub = session('sub-job', SUBAGENT_HEADER)
  withSub.sessions.push(sub)
  withSub.fire(sub, toolCall(3)) // 事件流登记子代理 id
  const subJob = { id: 'job-sub', status: 'running', label: '子任务', ownerSession: 'sub-job' }
  withSub.jobList.push(subJob)
  await withSub.state() // 首次轮询记下 running
  subJob.status = 'completed'
  assert.notEqual((await withSub.state()).activity.name, 'celebrate')

  const withMain = harness()
  const main = session('session-job', MAIN_HEADER)
  withMain.sessions.push(main)
  const mainJob = { id: 'job-main', status: 'running', label: '自己的任务', ownerSession: 'session-job' }
  withMain.jobList.push(mainJob)
  await withMain.state()
  mainJob.status = 'completed'
  assert.equal((await withMain.state()).activity.name, 'celebrate')
})

test('子代理自有 job 的事件终态不庆祝，但 XP 账本照记', async () => {
  const h = harness()
  const sub = session('sub-own', SUBAGENT_HEADER)
  h.sessions.push(sub)
  h.fire(sub, toolCall(3))
  h.jobList.push({ id: 'job-own', status: 'completed', label: '子任务', ownerSession: 'sub-own' })
  h.endJob({ id: 'job-own', status: 'completed', label: '子任务', ownerSession: 'sub-own' })

  const body = await h.state()
  assert.notEqual(body.activity.name, 'celebrate')
  assert.equal(body.pet.xp, 10, '账本 XP 不受庆祝抑制影响')
  assert.equal(body.pet.stats.tasksDone, 1)
})

test('主会话自有 job 的事件终态照常庆祝', async () => {
  const h = harness()
  const main = session('session-own', MAIN_HEADER)
  h.sessions.push(main)
  const snapshot = { id: 'job-mine', status: 'completed', label: '自己的任务', ownerSession: 'session-own' }
  h.jobList.push(snapshot)
  h.endJob(snapshot)
  assert.equal((await h.state()).activity.name, 'celebrate')
})
