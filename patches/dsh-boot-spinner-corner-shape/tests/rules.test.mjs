/**
 * Rules self-test for dsh-boot-spinner-corner-shape.
 * Run: node --test tests/rules.test.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MARKER, applyRules, revertRules, resolveTarget } from '../lib/rules.mjs'

/** 官方 boot ::after 规则的原样（类名哈希任意）。 */
const BOOT_RULE = '._spinner_u7vgf_45{position:relative;width:20px;height:20px;border-radius:50%;corner-shape:round;border:2px solid var(--dsw-alias-border-l2, var(--dsh-boot-border));animation:_spin_u7vgf_45 .8s linear infinite}._spinner_u7vgf_45:after{content:"";position:absolute;inset:-2px;border-radius:inherit;background:conic-gradient(var(--dsw-alias-brand-primary, var(--dsh-boot-brand)) var(--dsh-boot-arc, 72deg),transparent 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 0);mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 0)}'

/** 一个不该被碰的同类规则（菜单材质，也有 border-radius:inherit）。 */
const MENU_RULE = '._material_ri079_21{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--dsw-menu-surface-fill);pointer-events:none}'

describe('applyRules', () => {
  it('injects corner-shape:round into the boot ::after rule only', () => {
    const out = applyRules(BOOT_RULE + MENU_RULE)
    assert.equal(out.split(MARKER).length - 1, 1)
    assert.ok(out.includes('inset:-2px;border-radius:inherit;corner-shape:round;background:conic-gradient('))
    // 菜单材质那条一字未动
    assert.ok(out.includes(MENU_RULE))
  })

  it('is idempotent', () => {
    const once = applyRules(BOOT_RULE)
    assert.equal(applyRules(once), once)
  })

  it('throws when the anchor is missing instead of writing a half patch', () => {
    assert.throws(() => applyRules('._other_abc_1{color:red}'), /anchor matched 0 times/u)
  })

  it('throws when the anchor matches twice', () => {
    assert.throws(() => applyRules(BOOT_RULE + BOOT_RULE), /anchor matched 2 times/u)
  })
})

describe('revertRules', () => {
  it('restores the official bytes exactly', () => {
    const out = applyRules(BOOT_RULE + MENU_RULE)
    assert.equal(revertRules(out), BOOT_RULE + MENU_RULE)
  })

  it('is a no-op on an unpatched sheet', () => {
    assert.equal(revertRules(BOOT_RULE), BOOT_RULE)
  })
})

describe('resolveTarget', () => {
  it('picks the single index-*.css', () => {
    assert.equal(
      resolveTarget(['index-BNyAYEM7.css', 'vendor-DV2921Zo.css', 'fonts']),
      'dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BNyAYEM7.css',
    )
  })

  it('rejects an ambiguous or empty match', () => {
    assert.throws(() => resolveTarget(['index-a.css', 'index-b.css']), /found 2/u)
    assert.throws(() => resolveTarget(['vendor-x.css']), /found 0/u)
  })
})
