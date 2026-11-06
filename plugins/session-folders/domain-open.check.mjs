// 回归检查：fiber 重载时旧 domain 仍占名（cordis `_reload` 先跑新 apply、后卸旧 fiber），
// apply 必须先把残留 handle 关掉，而不是抛 already-open 让宿主 fatal。
import assert from 'node:assert/strict'
import { apply } from './lib/index.js'

const NAME = 'dsh_session_folders_custom'
const reserved = new Set()
const opened = []
let closed = 0

const storageDomain = {
	domains: new Map(),
	get: name => storageDomain.domains.get(name),
	async open(spec) {
		if (reserved.has(spec.name)) throw Object.assign(new Error(`domain '${spec.name}' is already open`), { code: 'already-open' })
		reserved.add(spec.name)
		const domain = {
			global: { get: () => ({ folders: [], workspaceOrder: [], pinnedLooseByWorkspace: {} }), set: () => {} },
			close: async () => { closed += 1; if (storageDomain.domains.get(spec.name) === domain) storageDomain.domains.delete(spec.name); reserved.delete(spec.name) },
		}
		opened.push(domain)
		storageDomain.domains.set(spec.name, domain)
		return domain
	},
}

const ctx = {
	storageDomain,
	webServer: { register: () => {} },
	logger: { info: () => {}, warn: () => {}, error: () => {} },
	sessions: undefined,
	sessionTitle: undefined,
	sessionPersistence: undefined,
	workspaceRegistry: { list: () => [] },
}

// 第一次加载
const disposeFirst = await apply(ctx)
assert.equal(typeof disposeFirst, 'function', 'apply 必须返回 disposer')
assert.equal(reserved.has(NAME), true, '第一次 open 应占名')

// 模拟 cordis reload：旧 fiber 还没 dispose，新 apply 就跑了
const disposeSecond = await apply(ctx)
assert.equal(closed, 1, '重载时应当先关掉残留 domain')
assert.equal(opened.length, 2, '重载应拿到新的 handle')
assert.notEqual(opened[0], opened[1])
assert.equal(reserved.has(NAME), true)

// 两次 disposer 都要能安全执行（close 幂等）
await disposeFirst()
await disposeSecond()
assert.equal(reserved.has(NAME), false, '全部 dispose 后应释放名字')

console.log('domain-open.check: ok')
