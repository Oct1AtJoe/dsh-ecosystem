/**
 * 一次性维护脚本:清空 dsh-cost-meter 账本的全部历史数据。
 *
 * 语义与插件自身的「清空全部历史」一致(store.js resetHistory + index.js RPC):
 *   days / planSamples / planHourBuckets / balanceRef 全部清空,
 *   并写入新的 historyReset 标记,让并发宿主的三方合并也能服从本次重置。
 *
 * 保留(不属"历史会话数据"):config(含价格表、汇率、预算、网关配额等全部设置)、
 * pricingHistory(价格版本时间线)、migrations、openrouterPriceHashes、
 * providerPriceHashes、usageCursors。
 *
 * 写盘路径复用插件自己的 withLedgerLock + writeLedger:同一把跨进程锁、同一
 * 原子写(临时文件 + rename),不引入第二套写入逻辑。
 *
 * 用法(退出 DSH 后执行):
 *   node scripts/reset-cost-meter-ledger.mjs
 */
import { readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { withLedgerLock, readLedger, writeLedger } from '../external-repos/dsh-cost-meter/lib/ledger-persistence.js'
import { normalizePricingHistory } from '../external-repos/dsh-cost-meter/lib/billing-history.js'
import { sanitizeConfig } from '../external-repos/dsh-cost-meter/lib/store.js'
import { cleanUsageCursors } from '../external-repos/dsh-cost-meter/lib/ledger-persistence.js'

const home = process.env.DSH_HOME || join(homedir(), '.dsh')
const path = join(home, 'storages', 'cost-meter', 'ledger.json')

const raw = readLedger(path)
if (raw === null) {
  console.log(`账本不存在,无需清空: ${path}`)
  process.exit(0)
}
if (raw.version !== 1) {
  console.error(`账本版本 ${String(raw.version)} 不受支持,请用插件自身的重置入口处理: ${path}`)
  process.exit(1)
}

const config = sanitizeConfig(raw.config)
const before = {
  days: Object.keys(raw.days ?? {}).length,
  sessions: Object.values(raw.days ?? {}).reduce((sum, day) => sum + (day?.sessions?.length ?? 0), 0),
  planSamples: Object.keys(raw.planSamples ?? {}).length,
  planHourBuckets: Object.keys(raw.planHourBuckets ?? {}).length,
}

withLedgerLock(path, () => {
  const disk = readLedger(path) ?? raw
  // 备份带时间戳,不覆盖插件自己生成的任何备份。
  renameSync(path, `${path}.before-clear-${Date.now()}`)
  const state = {
    version: 1,
    config,
    days: {},
    balanceRef: null,
    migrations: Array.isArray(disk.migrations) ? disk.migrations.filter(m => typeof m === 'string') : [],
    planSamples: {},
    planHourBuckets: {},
    openrouterPriceHashes: disk.openrouterPriceHashes ?? {},
    providerPriceHashes: disk.providerPriceHashes ?? {},
    historyReset: { id: randomUUID(), at: Date.now() },
    usageCursors: cleanUsageCursors(disk.usageCursors),
    pricingHistory: normalizePricingHistory(disk.pricingHistory, config),
  }
  writeLedger(path, state)
  console.log('已清空并写回:')
  console.log(`  days           ${before.days} -> ${Object.keys(state.days).length}`)
  console.log(`  sessions       ${before.sessions} -> 0`)
  console.log(`  planSamples    ${before.planSamples} -> ${Object.keys(state.planSamples).length}`)
  console.log(`  planHourBuckets ${before.planHourBuckets} -> ${Object.keys(state.planHourBuckets).length}`)
  console.log(`  备份: ${path}.before-clear-*`)
})

// 旁挂缓存是账本历史的派生数据,留着会让统计页继续显示旧数字。
const cache = join(home, 'storages', 'cost-meter', 'ledger.json.details-cache')
const { rm } = await import('node:fs/promises')
await rm(cache, { recursive: true, force: true })
console.log(`已删除派生缓存: ${cache}`)
