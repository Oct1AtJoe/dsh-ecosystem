# 桌面端升级后重打 asar 补丁（需先“完全退出” DeepSeek Harness）
# 用法：托盘右键退出桌面端 -> 普通 PowerShell 运行本脚本 -> 完成后重启桌面端。
# 注意：本文件必须带 UTF-8 BOM，否则 Windows PowerShell 5.1 按 GBK 解析中文会语法报错。
# 生成：2026-11-19，适配 DSH 桌面端 0.2.2-rc.5
$ErrorActionPreference = 'Stop'
if (Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue) {
    throw '检测到 DeepSeek Harness 仍在运行。请先从托盘完全退出，再重跑本脚本。'
}
$root = 'C:\dsh-ecosystem'
$steps = @(
    'patches\desktop-menu',
    'patches\kanye-pet-electron',
    'patches\dsh-desktop-net-fetch',
    'patches\dsh-desktop-window-state',
    'patches\dsh-host-profile-bom',
    'patches\dsh-gateway-heartbeat'
)
foreach ($rel in $steps) {
    $dir = Join-Path $root $rel
    Push-Location $dir
    try {
        Write-Host "=== $rel : patch ==="
        node patch.mjs
        if ($LASTEXITCODE -ne 0) { throw "patch 失败：$rel" }
        Write-Host "=== $rel : verify ==="
        node verify.mjs
        if ($LASTEXITCODE -ne 0) { throw "verify 失败：$rel" }
        Write-Host "OK  $rel"
    } finally { Pop-Location }
}
Write-Host '全部 asar 补丁已重打且 verify 通过。请重新启动 DeepSeek Harness。'
