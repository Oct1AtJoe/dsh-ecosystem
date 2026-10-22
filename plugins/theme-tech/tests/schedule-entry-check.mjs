/**
 * 自动化任务入口显隐开关门禁测试。
 * 验证：状态读写默认值、DOM 标记应用、设置行注册 order、国际化字典完备性与产物包含性。
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function test(name, fn) {
  try {
    fn()
    console.log(`PASS  ${name}`)
  } catch (err) {
    console.error(`FAIL  ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

// 1. 模块存在性
test('模块存在：schedule-entry.ts 存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'src/client/schedule-entry.ts')))
})

test('模块存在：ScheduleEntryRow.tsx 及样式存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'src/client/ScheduleEntryRow.tsx')))
  assert.ok(fs.existsSync(path.join(root, 'src/client/ScheduleEntryRow.module.css')))
})

// 2. 状态与默认值
test('默认值规范：默认显示为 true', async () => {
  const content = fs.readFileSync(path.join(root, 'src/client/schedule-entry.ts'), 'utf-8')
  assert.ok(content.includes("SCHEDULE_ENTRY_STORAGE_KEY = 'dsh-show-schedule-entry'"))
  assert.ok(content.includes('return true'))
})

test('DOM 标记：html 与 body 双写 data-dsh-hide-schedule', () => {
  const content = fs.readFileSync(path.join(root, 'src/client/schedule-entry.ts'), 'utf-8')
  assert.ok(content.includes('data-dsh-hide-schedule'))
  assert.ok(content.includes('[document.documentElement, document.body]'))
})

// 3. 国际化字典
test('国际化字典：中英双语齐备', () => {
  const locales = fs.readFileSync(path.join(root, 'src/client/locales.ts'), 'utf-8')
  assert.ok(locales.includes("'schedule-entry.title': '自动化任务入口'"))
  assert.ok(locales.includes("'schedule-entry.description': '在左侧边栏工作区上方显示或隐藏自动化任务面板入口'"))
  assert.ok(locales.includes("'schedule-entry.title': 'Automation Tasks Entry'"))
  assert.ok(locales.includes("'schedule-entry.description': 'Show or hide the automation tasks entry above workspaces in the left sidebar'"))
})

// 4. 设置行注册
test('槽位注册：order 设为 10.85 位于右侧栏宽度之后、字号之前', () => {
  const index = fs.readFileSync(path.join(root, 'src/client/index.ts'), 'utf-8')
  assert.ok(index.includes("id: 'schedule-entry-custom'"))
  assert.ok(index.includes('order: 10.85'))
})

// 5. CSS 规则守卫
test('CSS 规则：包含精准选择器与外边距清空规则', () => {
  const index = fs.readFileSync(path.join(root, 'src/client/index.ts'), 'utf-8')
  assert.ok(index.includes('html[data-dsh-hide-schedule="true"] [class*="panelRow"][aria-label="自动化任务"]'))
  assert.ok(index.includes('body[data-dsh-hide-schedule="true"] [class*="panelRow"][aria-label="自动化任务"]'))
  assert.ok(index.includes('nav[class*="panelList"]:has(> [class*="panelRow"]:only-child'))
})

// 6. 构建产物
test('构建产物：lib/client.js 包含新行与标记', () => {
  const client = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf-8')
  assert.ok(client.includes('schedule-entry-custom'))
  assert.ok(client.includes('data-dsh-hide-schedule'))
  assert.ok(client.includes('dsh-show-schedule-entry'))
})

if (process.exitCode) {
  console.error('\n门禁检查失败')
  process.exit(1)
} else {
  console.log('\n全部通过')
}
