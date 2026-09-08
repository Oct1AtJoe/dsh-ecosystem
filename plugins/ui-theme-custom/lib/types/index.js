/** Self-executing boot script. */
const BOOT_SCRIPT = `(function(){
try {
  var s = typeof localStorage !== 'undefined' && localStorage.getItem('dsh-theme-preference');
  if (s && s !== 'light' && s !== 'dark' && s !== 'system') {
    document.documentElement.style.colorScheme = 'dark';
    document.body.setAttribute('data-ds-dark-theme', '');
  }
} catch(e){}
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