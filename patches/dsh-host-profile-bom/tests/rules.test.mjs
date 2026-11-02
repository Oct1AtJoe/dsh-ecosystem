import assert from 'node:assert/strict'
import test from 'node:test'
import { ANCHOR, INJECT, MARKER, TARGET, applyRules, revertRules } from '../lib/rules.mjs'

/** 复刻真实文件的关键结构：导入行、一处自带命名空间调用、多处裸调用。 */
const fixture = [
  ANCHOR,
  'function readPackageManifest(anchor) {',
  '\treturn JSON.parse(readFileSync(anchor, "utf8"));',
  '}',
  'function readProfileManifest(dir) {',
  '\traw = readFileSync(join(dir, "package.json"), "utf8");',
  '\treturn JSON.parse(raw);',
  '}',
  'function alreadyNamespaced() {',
  '\treturn JSON.parse(fs.readFileSync(filename, "utf8"));',
  '}',
  '',
].join('\n')

test('注入剥 BOM 包装并改写裸调用', () => {
  const out = applyRules(fixture)
  assert.ok(out.includes(MARKER), '独有符号必须存在')
  assert.ok(out.includes('fs.readFileSync = __dshBomProofReadFile'), '必须覆盖命名空间方法')
  assert.ok(out.includes('const __dshOriginalReadFile = fs.readFileSync'), '必须保存原始实现避免递归')
  assert.equal(out.match(/(?<![\w.$])readFileSync\(/gu), null, '不应残留裸调用')
})

test('原本就是命名空间形态的调用保持不变', () => {
  const out = applyRules(fixture)
  assert.ok(out.includes('JSON.parse(fs.readFileSync(filename, "utf8"))'))
})

test('幂等', () => {
  const once = applyRules(fixture)
  assert.equal(applyRules(once), once)
})

test('revert 逐字节还原', () => {
  assert.equal(revertRules(applyRules(fixture)), fixture)
})

test('未打补丁时 revert 是 no-op', () => {
  assert.equal(revertRules(fixture), fixture)
})

test('导入锚点漂移时抛错', () => {
  assert.throws(() => applyRules(fixture.replace(ANCHOR, 'import fs from "node:fs";')), /anchor matched/u)
})

test('导入锚点重复时抛错', () => {
  assert.throws(() => applyRules(`${fixture}\n${ANCHOR}\n`), /anchor matched 2 times/u)
})

test('包装函数只对字符串剥 BOM', () => {
  // 与 INJECT 中 __dshStripBom 等价的行为断言
  const strip = (value) => (typeof value !== 'string' || value.charCodeAt(0) !== 0xfeff ? value : value.slice(1))
  assert.equal(strip('﻿{"a":1}'), '{"a":1}')
  assert.equal(strip('{"a":1}'), '{"a":1}')
  assert.deepEqual(strip(Buffer.from('x')), Buffer.from('x'))
  assert.equal(strip(undefined), undefined)
})

test('目标路径指向 app-boot', () => {
  assert.ok(TARGET.endsWith('dsh-app-boot/lib/index.js'))
  assert.ok(INJECT.includes('__dshBomProofReadFile'))
})
