param(
  [string]$Version  = 'dsh-v0.2.2-rc.5',
  [string]$Harness  = 'E:\vibeCoding\deepseek-harness',
  [string]$WorkTree = 'E:\vibeCoding\deepseek-harness-rc5'
)
# 在“隔离 git worktree”里按指定 tag 重建 ui-chat 固化包，避免搅动主工作树。
#
# 注意：
#  1. 本文件必须带 UTF-8 BOM。Windows PowerShell 5.1 对无 BOM 脚本按 GBK 解析，
#     中文会吃掉引号并直接语法报错。
#  2. ui-chat 的 client bundle 会把 brand / values / crypto / cosmokit 内联进产物。
#     全新 worktree 没有这些包的 lib/index.js 时，rolldown 把它们当 external，
#     产物首行 require() 宿主模块表里没有的行，启动即
#     "web boot: 1 required entry did not activate ... import failed"。
#  3. chat-virtual-rows/apply.mjs 默认写主 checkout，必须用 DSH_CHECKOUT 指向 worktree。
$ErrorActionPreference = 'Stop'

$repo   = 'C:\dsh-ecosystem'
$dst    = Join-Path $repo 'packages\ui-chat-patched'
$libCfg = Join-Path $repo 'scripts\tsdown-lib.config.mjs'
$tsdown = Join-Path $WorkTree 'node_modules\tsdown\dist\run.mjs'
$deps   = @(
    'packages\util\brand',
    'packages\util\values',
    'packages\util\crypto',
    'vendor\cosmokit'
)

Push-Location $Harness
try {
    git fetch upstream --tags
    git rev-parse --verify --quiet "refs/tags/$Version" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "找不到 tag $Version（请先 git fetch upstream --tags）" }
} finally { Pop-Location }

if (-not (Test-Path $WorkTree)) {
    git -C $Harness worktree add $WorkTree $Version
    if ($LASTEXITCODE -ne 0) { throw 'worktree add 失败' }
} else {
    Write-Host "复用已存在 worktree：$WorkTree"
}
Write-Host ("worktree HEAD: " + (git -C $WorkTree rev-parse --short HEAD))

Push-Location $WorkTree
$oldCheckout = $env:DSH_CHECKOUT
try {
    pnpm install --no-frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'pnpm install 失败' }

    node --import tsx/esm scripts/generate-typert.ts
    if ($LASTEXITCODE -ne 0) { throw 'generate-typert 失败' }

    # 复用 worktree 时补丁可能已应用；先探测，避免重复 apply 失败。
    git apply --check --reverse "$dst\local-changes.patch" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'local-changes.patch 已应用，跳过'
    } else {
        git apply -3 "$dst\local-changes.patch"
        if ($LASTEXITCODE -ne 0) { throw 'local-changes.patch 应用失败（若冲突请手工解决后继续）' }
    }

    $env:DSH_CHECKOUT = $WorkTree
    node "$repo\patches\chat-virtual-rows\apply.mjs"
    if ($LASTEXITCODE -ne 0) { throw 'chat-virtual-rows 应用失败' }

    # 先构建客户端 bundle 要内联的 workspace 依赖，否则它们会被当成外部模块。
    foreach ($rel in $deps) {
        Push-Location (Join-Path $WorkTree $rel)
        try {
            node $tsdown "$PWD\lib\types\index.js" -c $libCfg -d "$PWD\lib" --no-clean
            if ($LASTEXITCODE -ne 0) { throw "依赖构建失败：$rel" }
        } finally { Pop-Location }
    }

    Push-Location 'packages\client\ui-chat'
    try {
        node ..\..\..\node_modules\typescript\bin\tsc -b tsconfig.json
        if ($LASTEXITCODE -ne 0) { throw 'tsc 构建失败（必须 exit 0，不许有报错但 emit）' }
        node ..\..\..\node_modules\tsdown\dist\run.mjs --config tsdown.config.ts
        if ($LASTEXITCODE -ne 0) { throw 'tsdown 打包失败' }
    } finally { Pop-Location }

    # 门禁 1：只能 require 宿主模块表提供的平台模块。
    $allowed = @(
        '@deepseek-ai/dsh-client-store',
        '@deepseek-ai/dsh-client-ui-primitives',
        '@tanstack/react-virtual',
        'react',
        'react-dom',
        'react/jsx-runtime'
    )
    $clientJs = Join-Path $WorkTree 'packages\client\ui-chat\lib\client.js'
    $requires = [regex]::Matches((Get-Content -Raw -Encoding UTF8 $clientJs), 'require\("([^"]+)"\)') |
        ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
    $extra = @($requires | Where-Object { $allowed -notcontains $_ })
    if ($requires.Count -eq 0) { throw '未能从 client.js 解析出任何 require，门禁失效，拒绝继续' }
    if ($extra.Count -gt 0) {
        throw ("client.js 出现宿主模块表之外的 require：" + ($extra -join ', '))
    }
    Write-Host ("require 门禁通过：" + ($requires -join ', '))

    New-Item -ItemType Directory -Force -Path "$dst\lib\assets" | Out-Null
    Copy-Item 'packages\client\ui-chat\lib\index.js','packages\client\ui-chat\lib\client.js' "$dst\lib\" -Force
    if (Test-Path 'packages\client\ui-chat\lib\assets') {
        Copy-Item 'packages\client\ui-chat\lib\assets\*' "$dst\lib\assets\" -Recurse -Force
    }
    robocopy 'packages\client\ui-chat\lib\types' "$dst\lib\types" *.d.ts /S /NFL /NDL /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy 失败：$LASTEXITCODE" }
    Copy-Item 'packages\client\ui-chat\locale\*.json' "$dst\locale\" -Force

    # 门禁 2：固化包必须带齐本地补丁的验收符号。
    $patched = Get-Content -Raw -Encoding UTF8 (Join-Path $dst 'lib\client.js')
    foreach ($sym in 'deriveTurnMetrics', 'turnUsage.ttft', 'content-visibility') {
        if ($patched -notmatch [regex]::Escape($sym)) { throw "固化包缺少验收符号：$sym" }
    }
    Write-Host '验收符号门禁通过'

    $semver = $Version -replace '^dsh-v',''
    Write-Host "已拷回 $dst"
    Write-Host "还需手改 $dst 的 package.json：version=$semver；peerDependencies cordis 用 ~4.0.5；删 dependencies/devDependencies"
    Write-Host '然后更新 packages\ui-chat-patched\VENDORED-FROM.md，并完整重启 DSH。'
} finally {
    $env:DSH_CHECKOUT = $oldCheckout
    Pop-Location
}
