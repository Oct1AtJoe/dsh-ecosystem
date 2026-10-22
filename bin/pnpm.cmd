@ECHO off
REM pnpm shim: resolution and execution live in pnpm-shim.mjs (see its header).
REM No machine-specific paths here; survives moving the repo to another machine.
node "%~dp0pnpm-shim.mjs" %*
