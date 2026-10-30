# Vendored: dsh-tabbit

来源：`C:\Users\Administrator\.dsh\profiles\desktop\node_modules\dsh-tabbit`
上游：https://github.com/Tabbit-Browser/dsh-tabbit
版本：**0.4.0**（npm latest，2026-10-12）

补丁来源：上游 PR #30 / commit `abb5b2ce`（2026-10-13），**尚未发版**。

## 为什么固化

`dsh-tabbit` 0.4.0 的 `lib/installer/detect.js` 只按卸载表 `DisplayName` 认安装：

```js
const identity = WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '');
// 白名单只有 'Tabbit' / 'Tabbit Browser'
```

但 `DisplayName` 由安装器按**系统语言**写入。本机中文 Windows 写的是
`Tabbit浏览器`（实测注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Tabbit Browser`，
`DisplayName='Tabbit浏览器'`, `DisplayVersion='1.19.25.0'`），不在白名单 → 记录被丢弃
→ `installations: []` → `tabbit_browser_install` 误报「未安装」。
**任何非英文 Windows 都会中招。**

## 补丁内容（相对 0.4.0）

只改 `lib/installer/detect.js` 的 `parseWindowsUninstallRegistry().commit()` 一处，
等价移植上游 `abb5b2ce`：

```js
// 0.4.0（坏）
const identity = WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '');

// patched（好）
const identity = WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '')
    ?? WINDOWS_DISPLAY_NAMES.get(record.registryKey?.split('\\').pop() ?? '');
```

回退按**卸载子键名**（`...\Uninstall\Tabbit Browser`，安装器恒写英文）识别。
DisplayName 仍优先：递归兜底分支会扫到任意键名（如 `{generated}`），
那些记录只能靠 DisplayName 认出来。

## 判据（不要看版本号，跑真实探测）

```powershell
node --input-type=module -e "import('file:///C:/dsh-ecosystem/packages/dsh-tabbit-patched/lib/installer/detect.js').then(async m=>console.log(JSON.stringify(await m.detectTabbitInstallations())))"
```

`installations` 非空且含 `edition: "domestic"` = 补丁生效。

## ⚠️ 依赖解析（重建时必须一并做）

本包由 profile 以 `link:` 引用后，`@deepseek-ai/*` 与 `yaml` 的解析链会变。
两份依赖是**手工补齐**的，重装 profile 或换机器后必须重建：

```powershell
$dest = "C:\dsh-ecosystem\packages\dsh-tabbit-patched\node_modules\@deepseek-ai"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$h = "E:\vibeCoding\deepseek-harness"
$map = @{
  'cordis'             = 'vendor/cordis'
  'dsh-tools'          = 'packages/core/tools'
  'dsh-web'            = 'packages/web/web'
  'dsh-settings'       = 'packages/settings/settings'
  'dsh-skill'          = 'packages/skill/skill'
  'dsh-agent'          = 'packages/core/agent'
  'dsh-jobs'           = 'packages/jobs/jobs'
  'dsh-session'        = 'packages/core/session'
  'dsh-attachment'     = 'packages/attachment/attachment'
  'dsh-commands'       = 'packages/interaction/commands'
  'dsh-host-webserver' = 'packages/host/webserver'
  'dsh-user-approval'  = 'packages/interaction/user-approval'
  'dsh-util-values'    = 'packages/util/values'
  'dsh-llm'            = 'packages/llm/llm'
  'dsh-system-prompt'  = 'packages/core/system-prompt'
  'schemastery'        = 'vendor/schemastery'
}
foreach ($k in $map.Keys) {
  $link = Join-Path $dest $k
  if (Test-Path $link) { cmd /c rmdir "$link" 2>$null }
  cmd /c mklink /J "$link" (Join-Path $h ($map[$k] -replace '/','\')) | Out-Null
}
```

`yaml` 是真实目录（已拷入 `node_modules/yaml`，670 KB），不是 junction。

验证：`node --input-type=module -e "import('file:///C:/dsh-ecosystem/packages/dsh-tabbit-patched/lib/installer/index.js').then(m=>console.log(Object.keys(m).join(',')))"`
能打印出 `apply,inject,name,...` = 解析链通。

## 升级上游发版后的做法

上游 release 若已带 `abb5b2ce`（npm 版本 > 0.4.0），**直接删本目录、profile 回官方版**
——判据是跑上面那条真实探测，不是看版本号。

回滚：

```jsonc
// ~/.dsh/profiles/desktop/package.json
"dsh-tabbit": "0.4.0",
```
```powershell
cd C:\Users\Administrator\.dsh\profiles\desktop
node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
```
