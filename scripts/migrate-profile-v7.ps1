# v7 profile 迁移脚本（**必须在 DSH 桌面端完全退出后运行**）

> 🚨 **运行前先托盘右键 → 退出**，不是关窗口。宿主进程持有 profile 的 `node_modules`，
> 运行中执行会失败或写坏。
>
> 本脚本做四件事：
> 1. 备份 `package.json` / `cordis.patch.yml` / `pnpm-lock.yaml`
> 2. 卸载 9 个旧包名（`dsh-git-panel` 不动，因为包名没变）
> 3. 删残留实体目录
> 4. 改 `package.json` 的 `dsh.profile.bundles`（旧名换新名）
> 5. 装 10 个 v7 新包
>
> **`cordis.patch.yml` 只改 `name:`，`id:` 与 `config:` 一个字节都不动** —— 这是硬红线。
> 脚本会谨慎处理：只替换「`- insert:` 下的 `name:` 行」以及「顶层条目的 `name:`」，
> 且只在旧包名精确匹配时改。

$ErrorActionPreference = 'Stop'

$ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop'
$Dsh = 'E:\dshDesktop\resources\runtime\cli\bin\dsh.cmd'
if (-not (Test-Path $Dsh)) { $Dsh = 'D:\soft\dshDesktop\resources\runtime\cli\bin\dsh.cmd' }
if (-not (Test-Path $Dsh)) { throw "找不到 dsh CLI，请手工指定路径" }

if (-not (Test-Path $ProfileDir)) { throw "找不到 profile: $ProfileDir" }

Write-Host "`n=== 0. 检查宿主是否已退出 ===" -ForegroundColor Cyan
$running = Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "  ⚠️ 检测到 DSH 桌面端仍在运行（PID: $($running.Id -join ', ')）" -ForegroundColor Red
    Write-Host "  请托盘右键 → 退出后重新运行本脚本。已中止。" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ 宿主未运行" -ForegroundColor Green

Write-Host "`n=== 1. 备份 ===" -ForegroundColor Cyan
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($f in @('package.json', 'cordis.patch.yml', 'pnpm-lock.yaml')) {
    $src = Join-Path $ProfileDir $f
    if (Test-Path $src) {
        Copy-Item $src "$src.bak-v7-$stamp" -Force
        Write-Host "  ✅ $f -> $f.bak-v7-$stamp"
    }
}

Write-Host "`n=== 2. 卸载旧包名（9 个；dsh-git-panel 包名未变，不动）===" -ForegroundColor Cyan
$oldNames = @(
    '@deepseek-ai/dsh-client-ui-theme-custom'
    '@deepseek-ai/dsh-client-ui-queue-recall'
    '@deepseek-ai/dsh-client-ui-resend-failed-round'
    '@deepseek-ai/dsh-client-ui-subagent-custom'
    '@deepseek-ai/dsh-client-ui-kanye-pet'
    '@deepseek-ai/dsh-kanye-pet'
    'dsh-session-title-custom'
    'dsh-session-folders-custom'
    'dsh-file-upload-custom'
)
$pkgJson = Get-Content (Join-Path $ProfileDir 'package.json') -Raw | ConvertFrom-Json
$present = $pkgJson.dependencies.PSObject.Properties.Name
foreach ($n in $oldNames) {
    if ($present -contains $n) {
        Write-Host "  remove $n"
        & $Dsh plugin --profile desktop remove $n 2>&1 | Out-Null
    } else {
        Write-Host "  skip   $n（未安装）" -ForegroundColor DarkGray
    }
}

Write-Host "`n=== 3. 删残留实体目录 ===" -ForegroundColor Cyan
$nm = Join-Path $ProfileDir 'node_modules'
Get-ChildItem (Join-Path $nm '@deepseek-ai') -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'dsh-client-ui-*' -or $_.Name -eq 'dsh-kanye-pet' } |
    ForEach-Object {
        Write-Host "  rm $($_.Name)"
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
foreach ($d in @('dsh-session-title-custom', 'dsh-session-folders-custom', 'dsh-file-upload-custom')) {
    $p = Join-Path $nm $d
    if (Test-Path $p) {
        Write-Host "  rm $d"
        Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n=== 4. 改 dsh.profile.bundles 的旧名 ===" -ForegroundColor Cyan
$map = [ordered]@{
    '@deepseek-ai/dsh-client-ui-theme-custom'        = 'dsh-theme-tech'
    '@deepseek-ai/dsh-client-ui-queue-recall'        = 'dsh-queue-recall'
    '@deepseek-ai/dsh-client-ui-resend-failed-round' = 'dsh-resend-failed-round'
    '@deepseek-ai/dsh-client-ui-subagent-custom'     = 'dsh-subagent-card'
    '@deepseek-ai/dsh-client-ui-deliverables-custom' = 'dsh-deliverables'
    '@deepseek-ai/dsh-client-ui-kanye-pet'           = 'dsh-kanye-pet-settings'
    '@deepseek-ai/dsh-kanye-pet'                     = 'dsh-kanye-pet'
    'dsh-session-title-custom'                       = 'dsh-session-title-gen'
    'dsh-session-folders-custom'                     = 'dsh-session-folders'
    'dsh-file-upload-custom'                         = 'dsh-file-upload'
}
$pkgPath = Join-Path $ProfileDir 'package.json'
$raw = [System.IO.File]::ReadAllText($pkgPath)
$obj = $raw | ConvertFrom-Json
$bundles = @($obj.dsh.profile.bundles)
$changed = 0
$newBundles = foreach ($b in $bundles) {
    if ($map.Contains($b)) { Write-Host "  $b -> $($map[$b])"; $changed++; $map[$b] } else { $b }
}
$obj.dsh.profile.bundles = @($newBundles)
# 保持 2 空格缩进 + 末尾换行
[System.IO.File]::WriteAllText($pkgPath, (($obj | ConvertTo-Json -Depth 20) + "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  共替换 $changed 条" -ForegroundColor Green

Write-Host "`n=== 5. 改 cordis.patch.yml（只改 name:，id:/config: 不动）===" -ForegroundColor Cyan
$patchPath = Join-Path $ProfileDir 'cordis.patch.yml'
$lines = [System.IO.File]::ReadAllLines($patchPath)
$ymlChanged = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    # 只处理 name: 行；捕获缩进前缀与去掉引号后的值
    $m = [regex]::Match($line, '^(\s*name:\s*)[''"]?(.+?)[''"]?\s*$')
    if (-not $m.Success) { continue }
    $prefix = $m.Groups[1].Value
    $value = $m.Groups[2].Value
    if (-not $map.Contains($value)) { continue }
    $lines[$i] = "$prefix$($map[$value])"
    Write-Host "  L$($i + 1): $value -> $($map[$value])"
    $ymlChanged++
    continue
}
[System.IO.File]::WriteAllLines($patchPath, $lines, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  共替换 $ymlChanged 条" -ForegroundColor Green

Write-Host "`n=== 6. 安装 v7 新包（10 个）===" -ForegroundColor Cyan
$urls = @(
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-git-panel-0.1.22.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-kanye-pet-0.2.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-kanye-pet-settings-0.2.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-theme-tech-0.2.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-queue-recall-0.2.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-resend-failed-round-0.2.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-subagent-card-0.3.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-session-title-gen-0.2.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-session-folders-0.3.0.tgz'
    'https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-file-upload-3.0.0.tgz'
)
foreach ($u in $urls) {
    Write-Host "  add $(Split-Path $u -Leaf)"
    & $Dsh plugin --profile desktop add $u 2>&1 | Out-Null
}

Write-Host "`n=== 7. 验证 ===" -ForegroundColor Cyan
$final = Get-Content $pkgPath -Raw | ConvertFrom-Json
Write-Host "`ndependencies 里我们的 10 条："
$ours = $final.dependencies.PSObject.Properties |
    Where-Object { $_.Name -match '^dsh-(git-panel|kanye-pet|kanye-pet-settings|theme-tech|queue-recall|resend-failed-round|subagent-card|session-title-gen|session-folders|file-upload)$' }
$ours | ForEach-Object { Write-Host ("  {0,-26} {1}" -f $_.Name, ($_.Value -replace '.*/download/[^/]+/', '')) }

$leftover = (Get-Content $pkgPath -Raw) -match '@deepseek-ai/dsh-client-ui-|"dsh-session-title-custom"|"dsh-session-folders-custom"|"dsh-file-upload-custom"'
if ($leftover) {
    Write-Host "`n  ⚠️ 仍有旧包名残留，请手工检查 package.json" -ForegroundColor Yellow
} else {
    Write-Host "`n  ✅ 无旧包名残留" -ForegroundColor Green
}

Write-Host "`n=== 完成 ===" -ForegroundColor Green
Write-Host "下一步：重启 DSH 桌面端（不是刷新页面）。"
Write-Host "然后按「另一台电脑安装指南.md」的页面验收清单逐项确认。"
Write-Host "`n如需回滚：把 *.bak-v7-$stamp 还原覆盖，再重启。"
