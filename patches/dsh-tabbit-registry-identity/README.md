# dsh-tabbit 安装探测：按卸载表子键名识别

## 症状

Tabbit 明明装了、开着了，`tabbit_browser_install` 仍返回：

```
Environment check failed: No stable Tabbit edition is installed.
```

`tabbit-cli diagnose` 却是正常的（`{"ok":true,"controller":"running"}`）。

## 根因

`lib/installer/detect.js` 的 `parseWindowsUninstallRegistry` 只按卸载表的
**DisplayName** 认安装：

```js
const identity = WINDOWS_DISPLAY_NAMES.get(record.DisplayName ?? '')
// 白名单只有 'Tabbit' / 'Tabbit Browser'
```

DisplayName 由安装器按**系统语言**写入。中文 Windows 写的是 `Tabbit浏览器`，
不在白名单 → 记录被丢弃 → `installations: []` → 判「未安装」。

实测（本机）：

```
HKCU\...\Uninstall\Tabbit Browser        ← 子键名恒英文
    DisplayName    REG_SZ    Tabbit浏览器    ← 中文，白名单外
    DisplayVersion REG_SZ    1.18.21.0
    DisplayIcon    REG_SZ    D:\soft\Tabbit Browser\Application\Tabbit Browser.exe,0
```

**任何非英文 Windows 都会中招**，不只中文。

## 修法

卸载表的**子键名**恒为 `Tabbit` / `Tabbit Browser`（安装器写死，不随语言变）。
`record.registryKey` 已经存了完整键路径，取末段比对即可。

补丁改 `commit()` 的身份判定：先按子键名，再回退 DisplayName。上游 PR #30 /
commit `abb5b2ce` 是同一思路，但**没发版**（npm latest 仍是 0.4.0）。

## ⚠ 硬链接

`detect.js` 是 pnpm store 的**硬链接**：

```
...\node_modules\dsh-tabbit\lib\installer\detect.js
...\AppData\Local\pnpm\store\v11\files\6d\b2fed648...   ← 同一 inode
```

直接原地改会污染全局 pnpm store。补丁**先断链**（复制成独立文件再替换），
改的只是 profile 里的那一份。`--revert` 同样断链还原。

## 用法

```powershell
node C:\dsh-ecosystem\patches\dsh-tabbit-registry-identity\patch.mjs --check
node C:\dsh-ecosystem\patches\dsh-tabbit-registry-identity\patch.mjs
node C:\dsh-ecosystem\patches\dsh-tabbit-registry-identity\verify.mjs
node C:\dsh-ecosystem\patches\dsh-tabbit-registry-identity\patch.mjs --revert
```

其它 profile：

```powershell
$env:DSH_PROFILE_DIR = 'C:\Users\Administrator\.dsh\profiles\web'
```

打完**必须重启 DSH 宿主**——插件在启动时 require 并缓存模块，光刷新页面无效。

## 判据

verify 用补丁**独有符号** `windowsIdentityOf`，不用 locale 文案键（会撞车复用字典），
并真跑一次 `detectTabbitInstallations()` 断言 `installations` 非空。

## 升级注意

`dsh-tabbit` 升到带修复的版本后，这个补丁应删除。判定：

```powershell
Select-String -Path "<profile>\node_modules\dsh-tabbit\lib\installer\detect.js" -Pattern "registryKey\?\.split"
```

零命中 = 仍是坏版本；命中 = 上游已修，跑 `--revert` 后卸载补丁。
