# dsh-host-profile-bom

让宿主容忍带 UTF-8 BOM 的 profile 清单，修「启动即弹 Application could not start」。

## 症状

桌面端点开就弹：

```
The application could not start or stopped unexpectedly.
```

对话框里的报错常常只有一句笼统的话（有时还残留成上一次的
`desktop welcome: Web authentication failed`，**会误导排查方向**）。
真话在崩溃日志的 `--- host diagnostic ---` 段：

```
SyntaxError: Unexpected token '﻿', "﻿{ "name"... is not valid JSON
    at readPackageManifest (…/dsh-app-boot/lib/index.js:709)
    at readOptionalProfileManifest (…:843)
    at createRuntimeResolution (…:769)
    at composeProfile (…/dsh/lib/profile-boot-XXXX.js:241)
```

## 根因

`dsh-app-boot` 里有多处：

```js
JSON.parse(readFileSync(path, "utf8"))
```

Node 的 utf8 解码**不剥离 BOM**（U+FEFF 会原样留在字符串开头），
`JSON.parse` 遇到它直接抛 `SyntaxError`。崩点在遍历依赖图的第一站，
Host 进程起不来 → 壳层只报「启动失败」。

该文件里这类裸读取有 **10 处**（709 / 1349 / 1392 / 1412 / 1456 / 2159 / 2252 / 3480 …），
但只要 `package.json` 带 BOM，**709 行第一站就崩**，其余根本走不到。

### BOM 从哪来

Windows PowerShell 5.1 的 `Set-Content -Encoding utf8` **默认写 BOM**。
用脚本改写 profile 的 `package.json` 时极易带上。本机实测触发路径：
2026-11-02 把 `dsh-prompt-history` 从 `link:` 换成发布版 `1.9.0`，
写入的 `package.json` 首三字节变成 `EF BB BF`。

> 宿主自己的写入路径不带 BOM（`writeProfileManifest` 直接 `JSON.stringify`），
> 所以这不是上游 bug，而是**读取端不够健壮**。

## 修法

在 `dsh-app-boot` 模块顶部注入一段，把 `fs.readFileSync` 换成剥 BOM 版本：

```js
function __dshStripBom(value) {
  if (typeof value !== "string" || value.charCodeAt(0) !== 0xfeff) return value;
  return value.slice(1);
}
const __dshOriginalReadFile = fs.readFileSync;
function __dshBomProofReadFile(path, options) {
  return __dshStripBom(__dshOriginalReadFile(path, options));
}
fs.__dshBomRead = __dshBomProofReadFile;
fs.readFileSync = __dshBomProofReadFile;
```

并把文件里每个裸 `readFileSync(` 调用改写成 `fs.__dshBomRead(`。

要点：

| 设计 | 原因 |
|---|---|
| 改读取层，不逐个改 10 处解析点 | 一处覆盖全部；上游日后新增读取点也自动受保护 |
| 解析点走 `fs.__dshBomRead` 这个**独有名字** | revert 能精确识别、逐字节还原，无需启发式猜测 |
| 原始实现先存进 `__dshOriginalReadFile` 闭包 | 否则包装函数会自我递归 |
| `fs.readFileSync` 同时被替换 | 覆盖原文件里本来就写成 `fs.readFileSync(...)` 的那一处（273 行） |
| 只处理字符串；Buffer / fd 原样透传 | 不改变既有语义 |

> 这是让**读取端**接受 Windows 生态里合法存在的文件形态，不是掩盖错误：
> 文件内容本身是好的，只多了三字节签名；npm / pnpm / tsc 都容忍 BOM。

## 打补丁

> 🚨 **必须先完全退出 DSH 桌面端**（托盘右键退出，不是关窗口）。

```powershell
cd C:\dsh-ecosystem\patches\dsh-host-profile-bom
node --test tests\rules.test.mjs   # 9/9
node patch.mjs --dry-run           # 期望 patchedBytes ≈ 204090
node patch.mjs
node verify.mjs                    # 期望 "ok": true
```

本补丁与其它 asar 补丁**互不为前置**：它把 `dsh-app-boot` 自己的条目标为
`unpacked` 并重写 asar 头（等长填充，数据区不移动），不依赖 `desktop-menu`。

`verify.mjs` 的判据：

| 判据 | 含义 |
|---|---|
| `headerUnpacked` | asar 头的该条目已标 `unpacked` |
| `symbolHits > 0` | 注入块在磁盘文件里 |
| `bareCallsLeft === 0` | **没有漏改的裸 `readFileSync(`** |
| `namespacedCalls > 0` | 调用点确实改走了补丁通道 |
| `syntaxOk` | `node --check` 通过 |
| `bomParses` | 带 BOM 的 JSON 经等价逻辑能解析 |

## 验证是否真的修好

最有力的判据不是 `verify.mjs`，而是**让 profile 真的带 BOM 再启动**：

```powershell
# 1. 故意注入 BOM
node -e "const fs=require('fs');const p=process.env.APPDATA+'/../.dsh/profiles/desktop/package.json';fs.writeFileSync(p,'\uFEFF'+fs.readFileSync(p,'utf8'))"

# 2. 启动桌面端 —— 应正常进入界面，日志里没有 "not valid JSON"
& 'E:\dshDesktop\DeepSeek Harness.exe'
```

本机实测：注入 BOM 后仍能正常启动，`dsh web` 就绪、零错误。

## 紧急手救（补丁没打上、又急着用）

BOM 只有三个字节，直接剥掉即可启动：

```powershell
$p = "$env:USERPROFILE\.dsh\profiles\desktop\package.json"
$text = [System.IO.File]::ReadAllText($p)
[System.IO.File]::WriteAllText($p, $text.TrimStart([char]0xFEFF), (New-Object System.Text.UTF8Encoding $false))
```

> `UTF8Encoding $false` 是关键：不传 `$false` 会**再写一个 BOM**，白忙一场。

或直接用 Node（更不容易出错）：

```powershell
node -e "const fs=require('fs');const p=process.env.USERPROFILE+'/.dsh/profiles/desktop/package.json';const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.charCodeAt(0)===0xfeff?s.slice(1):s,'utf8')"
```

## 升级桌面端后

`app.asar` 被整体替换 → 本补丁丢失，需重打。
重打前先 `node patch.mjs --dry-run`：`wouldChange: true` 且不报 `anchor matched` 才继续。
导入行锚点漂移时 `applyRules` 会**抛错而不是写半截文件**。

> 若官方某版本已自带 BOM 容忍（判据：`readProfileManifest` / `readPackageManifest`
> 里出现 `0xfeff` 或 `\uFEFF` 处理），则删掉本补丁目录并 `--revert`，回官方版。

## 回滚

```powershell
node patch.mjs --revert     # 从 live 文件做逆变换，只撤本补丁
```

## 相关

- 同一台机器上另一个「启动失败」是 **cookie 堆积撑爆 16 KiB 请求头**
  （`dsh-auth-*` 攒到约 70 个 → 431），见 `patches/dsh-desktop-cookie-prune/`。
  两者症状相似但根因完全不同：**先看崩溃日志的 `--- host diagnostic ---` 段再动手**。
