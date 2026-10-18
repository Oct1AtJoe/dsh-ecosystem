const fs = require('fs');
const c = fs.readFileSync('C:/dsh-ecosystem/plugins/ui-queue-recall/lib/client.js', 'utf8');
const marker = 'const css = "';
const start = c.indexOf(marker);
if (start < 0) { console.log('marker not found'); process.exit(1); }
let i = start + marker.length;
let out = '';
while (i < c.length) {
  const ch = c[i];
  if (ch === '\\') {
    const nx = c[i + 1];
    if (nx === 'n') { out += '\\n'; i += 2; continue; }
    if (nx === 't') { out += '\\t'; i += 2; continue; }
    if (nx === '"') { out += '"'; i += 2; continue; }
    if (nx === '\\') { out += '\\\\'; i += 2; continue; }
    i += 1; continue;
  }
  if (ch === '"') break;
  out += ch;
  i += 1;
}
// unescape JSON-style
const css = out.replace(/\\n/g, '\n').replace(/\\"/g, '"');
fs.writeFileSync('C:/dsh-ecosystem/tmp-queue-full.css', css);
console.log('bytes', css.length, 'has panel::after', css.includes('_panel:after'));
