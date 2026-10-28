import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const src = readFileSync('E:/dshDesktop/resources/app.asar.unpacked/lib/main.js', 'utf8')
const start = src.indexOf('/** @returns the `desktop/window-state.json` path')
const end = src.indexOf('function createWindow(preload')
if (start === -1 || end === -1) throw new Error('helpers not found in shell entry')

const block = src.slice(start, end)
const make = (files, displays, writes) => new Function(
  'join', 'readFileSync', 'writeFileSync', 'mkdirSync', 'screen', 'app', 'console',
  block + '; return { readWindowState, persistWindowState };',
)(
  (...parts) => parts.join('/'),
  (p) => { if (!(p in files)) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e } return files[p] },
  (p, c) => { files[p] = c; writes.push(c) },
  () => {},
  { getAllDisplays: () => displays },
  { getPath: () => '/u' },
  { warn: () => {} },
)

const FILE = '/u/desktop/window-state.json'
const primary = { workArea: { x: 0, y: 0, width: 1920, height: 1040 } }
const leftScreen = { workArea: { x: -1920, y: 0, width: 1920, height: 1040 } }

const results = {}
const cases = [
  ['missingFile', {}, [primary], (s) => s.readWindowState() === undefined],
  ['normalRestore', { [FILE]: JSON.stringify({ x: 100, y: 120, width: 1000, height: 700, maximized: true }) }, [primary],
    (s) => { const v = s.readWindowState(); return v.bounds.x === 100 && v.bounds.width === 1000 && v.maximized === true }],
  ['offScreenRejected', { [FILE]: JSON.stringify({ x: -32000, y: -32000, width: 160, height: 28, maximized: true }) }, [primary],
    (s) => s.readWindowState() === undefined],
  ['tooSmallRejected', { [FILE]: JSON.stringify({ x: 100, y: 100, width: 200, height: 200 }) }, [primary],
    (s) => s.readWindowState() === undefined],
  ['negativeSecondaryKept', { [FILE]: JSON.stringify({ x: -1800, y: 200, width: 1200, height: 800 }) }, [primary, leftScreen],
    (s) => s.readWindowState()?.bounds.x === -1800],
  ['badJson', { [FILE]: '{oops' }, [primary], (s) => s.readWindowState() === undefined],
]

for (const [name, files, displays, check] of cases) results[name] = check(make(files, displays, []))

// persistWindowState：最大化时写 getNormalBounds + maximized:true
const writes = []
const s = make({}, [primary], writes)
s.persistWindowState({ getNormalBounds: () => ({ x: 50, y: 60, width: 1111, height: 777 }), isMaximized: () => true })
const saved = JSON.parse(writes.at(-1))
results.persistWritesNormalBounds = saved.x === 50 && saved.width === 1111 && saved.maximized === true

// persistWindowState：销毁后尺寸异常时跳过
const writes2 = []
make({}, [primary], writes2).persistWindowState({ getNormalBounds: () => ({ x: 0, y: 0, width: 0, height: 0 }), isMaximized: () => false })
results.persistSkipsDegenerate = writes2.length === 0

console.log(JSON.stringify(results, null, 2))
console.log('ALL PASS =', Object.values(results).every(Boolean))
process.exit(Object.values(results).every(Boolean) ? 0 : 1)
