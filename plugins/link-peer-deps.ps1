#Requires -Version 5.1
<#
.SYNOPSIS
  Link missing @deepseek-ai peer deps of local plugins from the dsh web profile.

.DESCRIPTION
  Local plugins under C:\dsh-ecosystem\plugins are consumed by the dsh profile
  via `link:` deps. pnpm does NOT install peerDependencies of `link:` deps
  (profile .npmrc sets autoInstallPeers=false), and Node ESM resolves modules by
  REAL path -- so a plugin at C:\dsh-ecosystem\plugins\<name>\lib\index.js only
  ever looks up C:\dsh-ecosystem\plugins\node_modules. Anything missing there
  surfaces at runtime as ERR_MODULE_NOT_FOUND / "plugin tree failed to load".

  This script junctions the missing packages from the profile's node_modules.

  WHY JUNCTION INSTEAD OF `pnpm add`:
  The profile uses nodeLinker=hoisted, so
    <profile>\node_modules\@deepseek-ai\dsh-storage-domain
  is a REAL directory. A junction makes the plugin resolve to that exact
  directory, so Node's ESM cache hands out the SAME module instance the rest of
  the profile already loaded -- no duplicated cordis service registration.
  Installing the package into C:\dsh-ecosystem\plugins\node_modules instead
  would produce a second physical copy and a second module instance.

  WARNING: never add these packages to C:\dsh-ecosystem\plugins\package.json.
  pnpm will try to overwrite the junction, fail midway, and leave node_modules
  half-broken. Remove the junctions first if you switch to that approach.

.PARAMETER Check
  Report only; create nothing.

.PARAMETER IncludeDeclared
  Also link packages that appear only in a plugin's peerDependencies and are
  never statically imported. Most of these are client-side (bundled into the
  web frontend, resolved through the profile's client build, not through
  plugins\node_modules), so they are reported but NOT linked by default.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File link-peer-deps.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File link-peer-deps.ps1 -Check
#>
[CmdletBinding()]
param(
  [switch]$Check,
  [switch]$IncludeDeclared
)

$ErrorActionPreference = 'Stop'

$PluginsRoot = 'C:\dsh-ecosystem\plugins'
$ProfileScope = Join-Path $env:USERPROFILE '.dsh\profiles\web\node_modules\@deepseek-ai'
$LocalScope = Join-Path $PluginsRoot 'node_modules\@deepseek-ai'

if (-not (Test-Path $LocalScope)) {
  New-Item -ItemType Directory -Force -Path $LocalScope | Out-Null
}
if (-not (Test-Path $ProfileScope)) {
  Write-Host "FATAL: profile scope not found: $ProfileScope" -ForegroundColor Red
  exit 1
}

# --- collect @deepseek-ai imports from the Node half of every local plugin ----
$re = [regex]'(?:from|import)\s*[''"]@deepseek-ai/([^''"/]+)'
$wanted = @{}        # statically imported by a Node half -> link these
$declared = @{}      # peerDependencies only -> report these

function Add-Wanted([hashtable]$Map, [string]$Name, [string]$Owner) {
  if (-not $Map.ContainsKey($Name)) { $Map[$Name] = @() }
  $Map[$Name] += $Owner
}

Get-ChildItem -Path $PluginsRoot -Directory |
  Where-Object { $_.Name -ne 'node_modules' } |
  ForEach-Object {
    $owner = $_.Name

    # 1) static imports in the Node half (lib/*.js, excluding *.client.*)
    $lib = Join-Path $_.FullName 'lib'
    if (Test-Path $lib) {
      Get-ChildItem -Path $lib -Filter '*.js' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike '*.client.*' } |
        ForEach-Object {
          foreach ($m in $re.Matches((Get-Content $_.FullName -Raw))) {
            Add-Wanted $wanted $m.Groups[1].Value $owner
          }
        }
    }

    # 2) declared peerDependencies, for visibility
    $pkgJson = Join-Path $_.FullName 'package.json'
    if (Test-Path $pkgJson) {
      try {
        $pkg = Get-Content $pkgJson -Raw | ConvertFrom-Json
        $peers = $pkg.peerDependencies
        if ($peers) {
          foreach ($prop in $peers.PSObject.Properties) {
            if ($prop.Name -like '@deepseek-ai/*') {
              $name = $prop.Name.Substring('@deepseek-ai/'.Length)
              if (-not $wanted.ContainsKey($name)) {
                Add-Wanted $declared $name $owner
              }
            }
          }
        }
      } catch { }
    }
  }

$targets = @{}
foreach ($k in $wanted.Keys) { $targets[$k] = $wanted[$k] }
if ($IncludeDeclared) {
  foreach ($k in $declared.Keys) { $targets[$k] = $declared[$k] }
}

if ($targets.Count -eq 0) {
  Write-Host 'No @deepseek-ai peer deps found for local plugins.'
  exit 0
}

$missing = @()
$present = @()
$dangling = @()

foreach ($name in ($targets.Keys | Sort-Object)) {
  $local = Join-Path $LocalScope $name
  $src = Join-Path $ProfileScope $name
  if (Test-Path $local) {
    if (-not (Test-Path $src)) { $dangling += $name } else { $present += $name }
    continue
  }
  $missing += $name
}

Write-Host ''
Write-Host '=== runtime deps (statically imported by a Node half) ===' -ForegroundColor Cyan
foreach ($name in $present) {
  Write-Host ("  OK      {0,-28} <- {1}" -f $name, (($targets[$name] | Select-Object -Unique) -join ', '))
}
foreach ($name in $dangling) {
  Write-Host ("  DANGLING {0,-27} junction target gone in profile" -f $name) -ForegroundColor Yellow
}
foreach ($name in $missing) {
  $owners = ($targets[$name] | Select-Object -Unique) -join ', '
  if (-not (Test-Path (Join-Path $ProfileScope $name))) {
    Write-Host ("  MISSING  {0,-27} needed by {1} -- NOT in profile either" -f $name, $owners) -ForegroundColor Red
    continue
  }
  Write-Host ("  MISSING  {0,-27} needed by {1}" -f $name, $owners) -ForegroundColor Yellow
}

# declared-only: reported for visibility, not linked unless -IncludeDeclared
$declaredOnly = @($declared.Keys |
  Where-Object { -not $wanted.ContainsKey($_) -and -not $targets.ContainsKey($_) } |
  Sort-Object)
if ($declaredOnly.Count -gt 0) {
  Write-Host ''
  Write-Host '=== declared-only (client-side / type-only; not linked by default) ===' -ForegroundColor DarkGray
  foreach ($name in $declaredOnly) {
    $owners = ($declared[$name] | Select-Object -Unique) -join ', '
    Write-Host ("  {0,-28} <- {1}" -f $name, $owners) -ForegroundColor DarkGray
  }
  Write-Host '  (pass -IncludeDeclared to link these too)' -ForegroundColor DarkGray
}

if ($dangling.Count -gt 0) {
  Write-Host ''
  Write-Host 'Dangling junctions detected. Remove them manually, then re-run:' -ForegroundColor Yellow
  foreach ($n in $dangling) { Write-Host ("  Remove-Item '{0}'" -f (Join-Path $LocalScope $n)) }
}

if ($missing.Count -eq 0) {
  Write-Host ''
  if ($Check) {
    Write-Host 'Check done: nothing to link.' -ForegroundColor Green
  } else {
    Write-Host 'Nothing to link; all resolved.' -ForegroundColor Green
  }
  exit 0
}

if ($Check) {
  Write-Host ''
  Write-Host ("Check done: {0} package(s) need linking." -f $missing.Count) -ForegroundColor Yellow
  exit 0
}

Write-Host ''
Write-Host '=== linking ===' -ForegroundColor Cyan
foreach ($name in $missing) {
  $src = Join-Path $ProfileScope $name
  $dst = Join-Path $LocalScope $name
  if (-not (Test-Path $src)) { continue }
  New-Item -ItemType Junction -Path $dst -Target $src | Out-Null
  Write-Host ("  LINKED  {0,-28} -> {1}" -f $name, $src) -ForegroundColor Green
}

Write-Host ''
Write-Host 'Done. Restart the dsh backend (start-dsh-web.ps1 or the desktop exe).' -ForegroundColor Green
