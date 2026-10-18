const COOKIE = process.env.DSH_COOKIE_3080
const base = 'http://127.0.0.1:3080'

const html = await fetch(`${base}/`, { headers: { Cookie: COOKIE } })
console.log('html status', html.status)
const text = await html.text()
const urls = [...text.matchAll(/\/plugins\/[^"'<> ]*client\.js[^"'<> ]*/g)].map(m => m[0])
  .filter(u => u.includes('session-controller'))
console.log('controller urls', urls.slice(0, 3))

for (const u of urls.slice(0, 1)) {
  const res = await fetch(base + u, { headers: { Cookie: COOKIE } })
  const body = await res.text()
  const i = body.indexOf('HISTORY_PAGE_OPTIONS')
  console.log(JSON.stringify({
    url: u,
    status: res.status,
    bytes: body.length,
    has30: body.includes('maxMessages: 30'),
    snippet: i >= 0 ? body.slice(i, i + 180) : null,
  }, null, 1))
}
