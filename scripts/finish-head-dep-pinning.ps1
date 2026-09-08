# finish-head-dep-pinning.ps1
#
# Purpose : finish pinning the two GitHub "tar.gz/HEAD" deps in the dsh web profile
#           to immutable commit SHAs, then verify the result.
#
# WHEN TO RUN: ONLY while dsh is fully stopped (DeepSeekHarness.exe and all dsh
#              backend node.exe processes). Re-linking node_modules while the
#              backend is running would let it read a half-written tree.
#
# Usage   : powershell -ExecutionPolicy Bypass -File C:\dsh-ecosystem\finish-head-dep-pinning.ps1
#           Add -WhatIfInstall to print the command without running it.
#
# ASCII-only content on purpose (avoids encoding issues with non-UTF8 consoles).

param([switch]$WhatIfInstall)

$ErrorActionPreference = 'Stop'

$ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\web'
$PluginsDir = 'C:\dsh-ecosystem\plugins'

# Pinned targets (commit SHAs, immutable)
$Pinned = @{
  'dsh-prompt-enhancer'         = '3.3.3'
  '@dsh-external/dsh-automation' = $null   # version not asserted, just presence
}

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "`nFAILED: $msg" -ForegroundColor Red; exit 1 }

# --- guard: is dsh running? -------------------------------------------------
$procs = @(Get-Process -Name 'DeepSeekHarness' -ErrorAction SilentlyContinue)
if ($procs.Count -gt 0) {
  Write-Host "DeepSeekHarness.exe is still running (PID: $($procs.Id -join ', '))." -ForegroundColor Yellow
  Write-Host "Stop dsh first, then re-run this script." -ForegroundColor Yellow
  exit 2
}

if (-not (Test-Path $ProfileDir)) { Fail "profile dir not found: $ProfileDir" }

# --- 1. install ------------------------------------------------------------
Write-Step '1/4  pnpm install (re-link node_modules with pinned URLs)'
Set-Location $ProfileDir
if ($WhatIfInstall) {
  Write-Host "would run: pnpm install   (in $ProfileDir)"
} else {
  pnpm install
  if ($LASTEXITCODE -ne 0) { Fail "pnpm install exited with $LASTEXITCODE" }
}

# --- 2. pinned deps have integrity in lockfile -----------------------------
Write-Step '2/4  lockfile integrity check'
$lock = Get-Content (Join-Path $ProfileDir 'pnpm-lock.yaml') -Raw
$headLeft = ([regex]::Matches($lock, 'codeload\.github\.com/[^/\s]+/[^/\s]+/tar\.gz/HEAD')).Count
if ($headLeft -gt 0) {
  Write-Host "WARN: $headLeft floating tar.gz/HEAD reference(s) still in lockfile:" -ForegroundColor Yellow
  [regex]::Matches($lock, 'codeload\.github\.com/[^/\s]+/[^/\s]+/tar\.gz/HEAD') |
    ForEach-Object { Write-Host "   $($_.Value)" -ForegroundColor Yellow }
} else {
  Write-Host 'OK: no floating tar.gz/HEAD refs left' -ForegroundColor Green
}

# --- 3. installed versions -------------------------------------------------
Write-Step '3/4  installed versions'
foreach ($k in $Pinned.Keys) {
  $pj = Join-Path $ProfileDir "node_modules\$k\package.json"
  if (-not (Test-Path $pj)) { Fail "$k missing after install" }
  $v = (Get-Content $pj -Raw | ConvertFrom-Json).version
  $expect = $Pinned[$k]
  if ($expect -and ($v -ne $expect)) {
    Write-Host "WARN: $k is $v, expected $expect" -ForegroundColor Yellow
  } else {
    Write-Host "OK: $k = $v" -ForegroundColor Green
  }
}

# --- 4. local-plugin junctions + declared deps -----------------------------
Write-Step '4/4  local plugin junctions + declared dependency scan'
$scope = Join-Path $PluginsDir 'node_modules\@deepseek-ai'
foreach ($name in @('dsh-storage-domain', 'dsh-workspace', 'dsh-llm')) {
  $p = Join-Path $scope $name
  if (Test-Path $p) { Write-Host "OK: junction $name present" -ForegroundColor Green }
  else { Write-Host "MISSING: junction $name -> re-run plugins\link-peer-deps.ps1" -ForegroundColor Yellow }
}

$scan = 'C:\Users\Administrator\AppData\Local\Temp\dshdbg\scan-broken.mjs'
if (Test-Path $scan) {
  & 'C:\Users\Administrator\.local\bin\nodejs24\node.exe' $scan
}

Write-Host "`nDone. Restart dsh and confirm the web boots clean." -ForegroundColor Cyan
