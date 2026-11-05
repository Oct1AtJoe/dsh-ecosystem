# dsh-trash-guard

DSH 删除守卫：拦截 `rm` / `Remove-Item` 等显式删除命令，改为移进可恢复回收站；7 天后自动过期清除。

## 为什么需要它

DSH 的 `ctx.fs` 契约里**没有删除原语**（只有 resolve / stat / read / list / watch / write / edit），
删除只可能发生在 shell 命令里。本插件挂在 `tools/pre-execute` 瀑布上检查 `bash` 与 `pwsh` 的
`command` 字符串，命中就 **拒绝并引导模型改用 `trash_move`**。

选硬拒绝而不是改写命令：复合命令（`rm -rf x && npm run build`）改写的语义无法保证，
宁可多一轮往返。

## 装在哪

- 代码：`C:\dsh-ecosystem\plugins\dsh-trash-guard`
- 回收站：`D:\dsh-trash\`（按项目分子目录，`index.json` 存元数据）
- 注册：`~/.dsh/profiles/desktop/cordis.patch.yml` 的 `trash-guard` 条目

## 布局

```
D:\dsh-trash\
  index.json                                     # 条目元数据
  E-vibeCoding-chat\                             # 项目 slug（由会话 cwd 推导）
    20261105101839__d926440e__a2a_db.py
  _no-project\
```

文件名形如 `<时间戳>__<短id>__<原名>`，防同名覆盖。

## 工具

| 工具 | 作用 |
|---|---|
| `trash_move` | 移进回收站；目录要 `recursive: true` |
| `trash_list` | 列出条目，支持 `*` / `?` 通配 |
| `trash_restore` | 还原；`onConflict`: `rename`（默认）/ `skip` / `overwrite` |
| `trash_purge` | 永久删除（`ids` 或 `all`） |

## 配置

| 键 | 默认 | 含义 |
|---|---|---|
| `trashRoot` | `D:\dsh-trash` | 回收站根目录 |
| `retentionDays` | `7` | 保留天数 |
| `maxBytes` | `53687091200`（50 GiB） | 容量上限，超了拒绝新删除 |
| `checkIntervalMinutes` | `60` | 过期扫描间隔 |
| `blockShellDelete` | `true` | 是否拦截 shell 删除命令 |

## 拦截范围

会拦：`rm` `unlink` `srm` `del` `erase` `rd` `rmdir` `Remove-Item`、
`find -delete` / `-exec rm`、`git clean -xfd`、
`os.remove` / `os.unlink` / `shutil.rmtree` / `fs.rm` / `fs.rmSync` 等。

不拦：覆盖写（`>`、`write`、`edit`）、`git checkout` / `git reset`、变量展开生成的删除。

## 逃生阀

命令里显式带上 `DSH_FORCE_DELETE` 就放行：

```bash
DSH_FORCE_DELETE=1 rm -rf node_modules
```

```powershell
$env:DSH_FORCE_DELETE=1; Remove-Item -Recurse -Force node_modules
```

## 已知边界

字符串匹配拦不住所有写法：`xargs rm`、`bash script.sh`（脚本内部删）、
`$(echo cm0= | base64 -d)` 之类都能绕。**这是兜底，不是强制隔离。**

## 构建

```powershell
cd C:\dsh-ecosystem\plugins\dsh-trash-guard
C:\dsh-ecosystem\plugins\node_modules\.bin\tsdown.cmd
```

产物 `lib/index.js`（零运行时依赖，不 import 任何 `@deepseek-ai/*`，
因为 profile 的 node_modules 里没有那些包）。
