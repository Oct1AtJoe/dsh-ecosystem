import { MOCHA_TOKENS } from "./client/mocha.js";
import { NEBULA_TOKENS } from "./client/nebula.js";
import { VOID_TOKENS } from "./client/void.js";
import { JADE_TOKENS } from "./client/jade.js";
import { SOLAR_TOKENS } from "./client/solar.js";
import { PARCHMENT_TOKENS } from "./client/parchment.js";
/** Custom theme id → serialized token overrides for the pre-paint boot application. */
const CUSTOM_TOKENS = {
    mocha: MOCHA_TOKENS,
    nebula: NEBULA_TOKENS,
    void: VOID_TOKENS,
    jade: JADE_TOKENS,
    solar: SOLAR_TOKENS,
    parchment: PARCHMENT_TOKENS,
};
/** Custom theme id → color scheme. */
const CUSTOM_SCHEME = {
    mocha: 'dark',
    nebula: 'dark',
    void: 'dark',
    jade: 'light',
    solar: 'dark',
    parchment: 'light',
};
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
})()`;
/**
 * Inject the boot script after the official ui-theme boot script so it
 * overrides the host-persisted preference when a custom theme was saved.
 * @param ctx - Host context.
 */
export function apply(ctx) {
    ctx.on('webserver/index-inject', (table) => {
        table.push({ kind: 'script', placement: 'body', text: BOOT_SCRIPT });
    });
}
//# sourceMappingURL=index.js.map