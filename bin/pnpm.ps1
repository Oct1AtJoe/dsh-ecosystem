$ErrorActionPreference = 'Stop'
# pnpm shim: resolution and execution live in pnpm-shim.mjs (see its header).
# No machine-specific paths here; survives moving the repo to another machine.
#
# Arguments are assembled into one array before invocation so that pnpm's own
# flags (--version, --filter, ...) can never be mistaken for node.exe flags:
# `& node $shim @args` lets PowerShell bind a leading --version to node itself,
# which silently prints node's version instead of pnpm's.
$shim = Join-Path $PSScriptRoot 'pnpm-shim.mjs'
$nodeArgs = @($shim) + $args
& node @nodeArgs
exit $LASTEXITCODE
