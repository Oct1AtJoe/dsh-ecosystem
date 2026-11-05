# dsh-trash-guard

Delete guard for DeepSeek Harness (DSH): intercepts explicit delete commands
(`rm` / `Remove-Item`) and moves targets into a restorable trash instead of
removing them permanently. Entries auto-expire after 7 days.

中文文档见 [README.zh.md](./README.zh.md)。

## Why

DSH's `ctx.fs` contract has **no delete primitive** (only resolve / stat / read /
list / watch / write / edit), so deletion can only happen inside shell commands.
This plugin hooks `tools/pre-execute` and inspects the `command` string of `bash`
and `pwsh` calls. On a hit it **denies the call and steers the model to
`trash_move`**, which relocates the target into a trash directory.

Hard deny rather than rewriting the command: rewriting a compound command
(`rm -rf x && npm run build`) cannot preserve its semantics, so a round trip is
the cheaper trade.

## Layout

```
D:\dsh-trash\
  index.json                              # entry metadata
  E-vibeCoding-chat\                      # project slug, derived from session cwd
    20261105101839__d926440e__a2a_db.py
  _no-project\
```

File names are `<timestamp>__<short-id>__<original-name>`, so same-named files
never overwrite each other.

## Tools

| Tool | Purpose |
|---|---|
| `trash_move` | Move into trash; directories need `recursive: true` |
| `trash_list` | List entries, `*` / `?` glob supported |
| `trash_restore` | Restore; `onConflict`: `rename` (default) / `skip` / `overwrite` |
| `trash_purge` | Permanent removal (`ids` or `all`) |

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `trashRoot` | `D:\dsh-trash` | Trash root directory |
| `retentionDays` | `7` | Days to keep |
| `maxBytes` | `53687091200` (50 GiB) | Capacity cap; new deletions are refused above it |
| `checkIntervalMinutes` | `60` | Expiry sweep interval |
| `blockShellDelete` | `true` | Intercept shell delete commands |

## Intercepted

`rm` `unlink` `srm` `del` `erase` `rd` `rmdir` `Remove-Item`,
`find -delete` / `-exec rm`, `git clean -xfd`,
`os.remove` / `os.unlink` / `shutil.rmtree` / `fs.rm` / `fs.rmSync`.

Not intercepted: overwrite paths (`>`, `write`, `edit`), `git checkout` /
`git reset`, or deletes assembled through variable expansion.

## Escape hatch

Include `DSH_FORCE_DELETE` in the command to bypass:

```bash
DSH_FORCE_DELETE=1 rm -rf node_modules
```

```powershell
$env:DSH_FORCE_DELETE=1; Remove-Item -Recurse -Force node_modules
```

## Known limits

String matching cannot catch every form. `xargs rm`, `bash script.sh` (deletes
inside the script), or base64-decoded commands all get through. **This is a
safety net, not an enforced isolation boundary.**

## Build

```powershell
cd C:\dsh-ecosystem\plugins\dsh-trash-guard
C:\dsh-ecosystem\plugins\node_modules\.bin\tsdown.cmd
```

The artifact `lib/index.js` has zero runtime dependencies and does not import
any `@deepseek-ai/*` package, because the profile's `node_modules` does not
contain them.
