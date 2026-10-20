// 桌面宠物窗口页回归测试：Electron 壳依赖 /kanye-pet/window 提供前端，且前端必须
// 已完全脱离 Tauri 桥（改走 window.petDesktop），否则壳补丁再对也不动。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'kanye-pet-window-test-'))
const { apply } = await import('../lib/index.mjs')
const { WINDOW_PATH, ASSETS_PATH, CONFIG_PATH } = await import('../lib/src/routes.mjs')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** 宿主替身：只捕获路由，够本测试用。 */
function harness() {
  const routes = []
  // 不提供 ctx.inject：apply 里用可选链 ctx.inject?.(...)，与真实 headless 宿主一致。
  const ctx = {
    effect: (fn) => {
      if (typeof fn === 'function') fn()
    },
    on: () => {},
    get: (name) => (name === 'webServer'
      ? { register: (route) => { routes.push(route); return () => {} } }
      : undefined),
    provide: () => {},
    fiber: {},
  }
  apply(ctx, { get: () => ({}) })
  return routes
}

/** 触发一次路由处理器，收集写出的状态与正文。 */
async function hit(route, { method = 'GET', url = route.path } = {}) {
  return new Promise((resolve) => {
    const res = {
      status: 0,
      headers: {},
      body: undefined,
      writeHead(status, headers = {}) { this.status = status; this.headers = headers },
      end(body) { this.body = body; resolve(this) },
      write() {},
      on() {},
      flushHeaders() {},
    }
    route.handler({ method, url, headers: {} }, res)
  })
}

const routes = harness()
const find = (path) => routes.find((r) => r.path === path)

test('窗口页路由已注册且为 exact', () => {
  const route = find(WINDOW_PATH)
  assert.ok(route, `缺少 ${WINDOW_PATH} 路由`)
  assert.equal(route.kind, 'exact')
})

test('窗口页返回 200 + HTML + no-store', async () => {
  const res = await hit(find(WINDOW_PATH))
  assert.equal(res.status, 200)
  assert.match(res.headers['content-type'], /text\/html/)
  // no-store 是契约：改完 pet.js 重启 Host 必须立刻生效
  assert.match(res.headers['cache-control'], /no-store/)
  assert.match(String(res.body), /<div id="pet">/)
})

test('窗口页的脚本指向 assets 路由（不是相对路径）', async () => {
  const res = await hit(find(WINDOW_PATH))
  const html = String(res.body)
  // 相对 src="pet.js" 会解析到 /kanye-pet/pet.js，而 assets 挂在 /kanye-pet/assets
  assert.ok(html.includes(`${ASSETS_PATH}/pet/pet.js`), 'script src 未指向 assets 路由')
  assert.ok(!/<script src="pet\.js"/.test(html), '仍残留相对 script src')
})

test('窗口页拒绝非 GET/HEAD', async () => {
  const res = await hit(find(WINDOW_PATH), { method: 'POST' })
  assert.equal(res.status, 405)
})

test('pet.js 已脱离 Tauri 桥', () => {
  const source = readFileSync(join(ROOT, 'lib/assets/pet/pet.js'), 'utf8')
  assert.ok(!source.includes('__TAURI_INTERNALS__'), 'pet.js 仍调用 Tauri')
  assert.ok(!source.includes('plugin:window|'), 'pet.js 仍用 Tauri window 插件')
  assert.ok(!source.includes('pet_show_main'), 'pet.js 仍调 Tauri 命令')
})

test('pet.js 走 window.petDesktop 五个动作', () => {
  const source = readFileSync(join(ROOT, 'lib/assets/pet/pet.js'), 'utf8')
  for (const api of ['setPosition', 'setSize', 'setVisible', 'showMain', 'openSession']) {
    assert.ok(source.includes(`petDesktop?.${api}`) || source.includes(`petDesktop.${api}`), `缺少 ${api} 调用`)
  }
})

test('pet.js 不再硬编码 Host 端口', () => {
  const source = readFileSync(join(ROOT, 'lib/assets/pet/pet.js'), 'utf8')
  // Electron 桌面端 Host 端口随机：任何 3080 硬编码都会打空
  assert.ok(!source.includes('127.0.0.1:3080'), 'pet.js 仍硬编码 127.0.0.1:3080')
  assert.ok(!source.includes('tauri.localhost'), 'pet.js 仍带 tauri.localhost 假设')
})

test('pet/ 资产走 no-cache（否则改前端被强缓存吞掉）', async () => {
  const { cacheControlFor } = await import('../lib/src/assets.mjs')
  assert.match(cacheControlFor('pet/pet.js'), /no-cache/)
  assert.match(cacheControlFor('pet/pet.html'), /no-cache/)
  // 负向对照：角色素材仍应 immutable
  assert.match(cacheControlFor('characters/kanye/idle.v3.png'), /immutable/)
})

test('配置端点与窗口页同源可达（相对路径前提）', () => {
  // pet.js 用相对 '/kanye-pet/config'：路由必须真实存在于同一 webServer
  assert.ok(find(CONFIG_PATH), `缺少 ${CONFIG_PATH}`)
})
