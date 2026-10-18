const url = process.argv[2]
const res = await fetch(url, { redirect: 'manual' })
const cookies = res.headers.getSetCookie?.() ?? []
console.log(JSON.stringify({ status: res.status, location: res.headers.get('location'), cookies }, null, 1))
