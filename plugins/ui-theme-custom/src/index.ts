/**
 * Aurora, nebula, and custom tech themes, node half. Injects a boot script
 * that reads the user's localStorage preference and applies the saved
 * custom theme's full token set inline before the first paint, so the page
 * never flashes the default built-in palette. A requestAnimationFrame
 * re-assert loop holds the tokens against the official ThemePresenter's
 * boot-time adopt() until the browser half (./client) signals
 * `window.__dshCustomThemeLive` and takes over subsequent switches.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { IndexInjection } from '@deepseek-ai/dsh-host-webserver'
import { AURORA_TOKENS } from './client/aurora.ts'
import { NEBULA_TOKENS } from './client/nebula.ts'
import { VOID_TOKENS } from './client/void.ts'
import { JADE_TOKENS } from './client/jade.ts'
import { SOLAR_TOKENS } from './client/solar.ts'
import { GLACIAL_TOKENS } from './client/glacial.ts'

/** Custom theme id → serialized token overrides for the pre-paint boot application. */
const CUSTOM_TOKENS: Record<string, Record<string, string>> = {
  aurora: AURORA_TOKENS,
  nebula: NEBULA_TOKENS,
  void: VOID_TOKENS,
  jade: JADE_TOKENS,
  solar: SOLAR_TOKENS,
  glacial: GLACIAL_TOKENS,
}

/** Custom theme id → color scheme. */
const CUSTOM_SCHEME: Record<string, 'light' | 'dark'> = {
  aurora: 'dark',
  nebula: 'dark',
  void: 'dark',
  jade: 'light',
  solar: 'dark',
  glacial: 'dark',
}

const BOOT_SCRIPT = `(function(){
try {
  var s = typeof localStorage !== 'undefined' && localStorage.getItem('dsh-theme-preference');
  if (!s || s === 'light' || s === 'dark' || s === 'system') return;
  var id = s.split('|')[0];
  var tokens = ${JSON.stringify(CUSTOM_TOKENS)}[id];
  if (!tokens) return;
  var scheme = ${JSON.stringify(CUSTOM_SCHEME)}[id] || 'dark';
  var apply = function () {
    document.documentElement.style.colorScheme = scheme;
    document.body.toggleAttribute('data-ds-dark-theme', scheme === 'dark');
    var html = document.documentElement;
    var body = document.body;
    for (var k in tokens) {
      html.style.setProperty(k, tokens[k]);
      body.style.setProperty(k, tokens[k]);
    }
  };
  apply();
  // Re-assert every frame until the browser half signals live, so the
  // ThemePresenter's boot-time built-in adopt cannot repaint the page
  // with the default palette before the plugin bundle loads.
  var n = 0;
  var tick = function () {
    if (window.__dshCustomThemeLive) return;
    apply();
    if (++n < 600) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} catch (e) {}
})()`

/**
 * Inject the boot script after the official ui-theme boot script so it
 * overrides the host-persisted preference when a custom theme was saved.
 * @param ctx - Host context.
 */
export function apply(ctx: Context): void {
  ctx.on('webserver/index-inject', (table: IndexInjection[]) => {
    table.push({ kind: 'script', placement: 'body', text: BOOT_SCRIPT })
  })
}
