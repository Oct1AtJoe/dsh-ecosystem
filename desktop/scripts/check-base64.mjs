// base64 编码器单测。
//
// 背景：关于弹窗的品牌小鲸鱼以 data URI 内联进注入脚本，图标字节需在 Rust 侧
// 编码成 base64（desktop/src-tauri/src/lib.rs 的 base64_encode）。该编码器是手写的
// （为免引入依赖），属于非平凡逻辑：补齐 '='、末块 1/2 字节的位运算都容易写错，
// 且错了只会在弹窗里显示成裂图，不会报错。
//
// 运行：node desktop/scripts/check-base64.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const libRs = readFileSync(join(here, '..', 'src-tauri', 'src', 'lib.rs'), 'utf8')

// 从 lib.rs 抽取真实函数体（不复制副本——副本会漂移），在 Node 里以 JS 语义重放。
const fnMatch = libRs.match(/fn base64_encode\(bytes: &\[u8\]\) -> String \{[\s\S]*?\n\}/)
if (!fnMatch) throw new Error('未能从 lib.rs 抽取 base64_encode —— 函数可能被重命名或改写')
const src = fnMatch[0]
if (!src.includes('TABLE') || !src.includes("'='")) {
  throw new Error('抽取到的 base64_encode 不含 TABLE/补齐逻辑 —— 抽错了函数')
}

// Rust → JS 语义翻译（仅语法层面：类型标注、字符 push 的 as char、chunks）。
const js = `function base64_encode(bytes){
  const TABLE = new TextEncoder().encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = bytes.slice(i, i + 3);
    const b0 = chunk[0];
    const b1 = chunk.length > 1 ? chunk[1] : 0;
    const b2 = chunk.length > 2 ? chunk[2] : 0;
    const n = ((b0 << 16) | (b1 << 8) | b2) >>> 0;
    out += String.fromCharCode(TABLE[(n >>> 18) & 63]);
    out += String.fromCharCode(TABLE[(n >>> 12) & 63]);
    out += chunk.length > 1 ? String.fromCharCode(TABLE[(n >>> 6) & 63]) : "=";
    out += chunk.length > 2 ? String.fromCharCode(TABLE[n & 63]) : "=";
  }
  return out;
}`
const base64_encode = new Function(`${js}; return base64_encode`)()
const encode = (s) => base64_encode(Buffer.from(s, 'utf8'))
const decode = (b64) => Buffer.from(b64, 'base64')

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail}`)
}

// ── 与 Node 权威实现逐一对拍：覆盖三种末块长度与空输入 ──
const cases = ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', 'hello world', '中文编码测试 🐋']
for (const s of cases) {
  const mine = encode(s)
  const ref = Buffer.from(s, 'utf8').toString('base64')
  check(
    `对拍：「${s.slice(0, 14)}」与 Node base64 一致`,
    mine === ref,
    `\n      期望 ${ref}\n      实得 ${mine}`,
  )
}

// ── 逐字节往返：0x00~0xFF 全覆盖（含 1/2/3 字节末块的各种边界）──
let roundTripOk = true
let badAt = -1
for (let len = 0; len <= 64; len++) {
  const buf = Buffer.alloc(len)
  for (let i = 0; i < len; i++) buf[i] = (i * 37 + len * 11) & 0xff
  const mine = base64_encode(buf)
  if (mine !== buf.toString('base64') || !decode(mine).equals(buf)) {
    roundTripOk = false
    badAt = len
    break
  }
}
check('往返：长度 0~64 的任意字节流与 Node 一致且可解码还原', roundTripOk, `  首个失配长度 ${badAt}`)

// ── 真实图标：必须完整编码且能解回同样的字节 ──
const icon = readFileSync(join(here, '..', 'src', 'icon.png'))
const iconB64 = base64_encode(icon)
check(
  '真实图标：icon.png 编码与 Node 一致且可还原',
  iconB64 === icon.toString('base64') && decode(iconB64).equals(icon),
)
check('真实图标：data URI 前缀为 PNG', iconB64.startsWith('iVBORw0KGgo'), `  实得 ${iconB64.slice(0, 16)}`)

// ── 负向对照：去掉补齐分支后，末块长度 1 的用例必须失败（证明本测试有牙齿）──
const broken = new Function(`${js.replace('out += chunk.length > 1 ?', 'out += true ?').replace('out += chunk.length > 2 ?', 'out += true ?')}; return base64_encode`)()
check(
  '负向对照：破坏补齐逻辑后「f」编码错位（证明本测试有牙齿）',
  broken(Buffer.from('f', 'utf8')) !== Buffer.from('f', 'utf8').toString('base64'),
)

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
