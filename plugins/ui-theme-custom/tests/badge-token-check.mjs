/**
 * Guard every registered theme against duplicate-token contrast bugs.
 *
 * QuestionComposer renders its "(Recommended)" badge as
 *   background: var(--dsw-specific-sidebar-nav-item-active-accent)
 *   color:      var(--dsw-alias-button-info-fill)
 * so those two tokens resolving to the SAME value paints an invisible box over
 * the label — the 银曜 regression this file exists to prevent. The same pair
 * also backs the plan-review action row, so the check covers both surfaces.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const bundle = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

/** Registration order in the client bundle: aurora, nebula, void, jade, solar, glacial. */
const THEMES = ['极光 aurora', '星云 nebula', '冥夜 void', '银曜 jade', '灼日 solar', '寒渊 glacial']

/** Collect one token's value per registered theme, in registration order. */
function tokenValues(name) {
  const pattern = new RegExp(`${name.replaceAll('-', '\\-')}": "([^"]+)"`, 'g')
  return [...bundle.matchAll(pattern)].map(match => match[1])
}

/** sRGB relative luminance (WCAG 2.1). */
function luminance(spec) {
  const [r, g, b] = spec.match(/[\d.]+/g).slice(0, 3).map(Number).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const backgrounds = tokenValues('--dsw-specific-sidebar-nav-item-active-accent')
const inks = tokenValues('--dsw-alias-button-info-fill')
assert.equal(backgrounds.length, THEMES.length, 'one badge background per registered theme')
assert.equal(inks.length, THEMES.length, 'one badge ink per registered theme')

const report = []
for (const [index, theme] of THEMES.entries()) {
  const bg = backgrounds[index]
  const ink = inks[index]
  assert.notEqual(bg, ink, `${theme}: badge background and ink must differ (would paint invisible text)`)
  const ratio = (Math.max(luminance(bg), luminance(ink)) + 0.05) / (Math.min(luminance(bg), luminance(ink)) + 0.05)
  assert.ok(ratio >= 4.5, `${theme}: badge contrast ${ratio.toFixed(2)}:1 must clear 4.5:1 (WCAG AA)`)
  report.push(`${theme} ${ratio.toFixed(2)}:1`)
}

console.log(`[ok] badge 配色不变式：${report.join(' · ')}`)
