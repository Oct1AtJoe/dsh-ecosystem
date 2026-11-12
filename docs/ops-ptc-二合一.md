# OPS-PTC 二合一 配置说明（flash 省 token + ops 被采用）

> 本地定制。改的是 dsh-ops 包内文件，升级/重装会被覆盖 —— 用本文档的重打脚本恢复。

## 背景与目标
- 目标：模型既走 flash 精简省 token（≤20 轮、批量、省 output、更早压缩），又真正采用 dsh-ops 的 `ops_*` 文件工具。
- 关键结论：ops 的「强制采用」（隐藏官方工具）只在内置预设 `ops-ptc` 上生效；flash 的「精简·PTC v3」是自定义预设，dsh-ops 只给它 `replaceOfficial`（0.5 不保证隐藏官方），实测 ops 0 采用。所以二合一必须长在 `ops-ptc` 上，把 flash 的省 token 设定注入进去。

## 三个预设现状
| 预设 | 工具面 | ops 会被用吗 |
|---|---|---|
| OPS (PTC) `ops-ptc`（默认，二合一） | hideOfficialTools 隐藏官方 + ops 常驻/动态 + batchingGuidance + 注入的 flash 规则 + 0.25 压缩 | 是 |
| 精简·PTC v3 `flash-lean-ptc-v3` | 纯 flash lean（13 条规则，官方工具在） | 否（走官方） |
| 精简·PTC v3 balance `flash-lean-ptc-v3-balance` | 纯 flash balance | 否 |

## 二合一原理（关键点）
1. 只有内置 mode section（`ops-ptc`）带 `hideOfficialTools`：官方 `read/glob/grep` 在 OPS 对应工具 admitted 时让位（#787），`hidePwsh` 藏 pwsh。
2. ops 的 PTC 文件工具是动态的：需先 `ops_load_sdk` 加载才 admitted，此时官方对应工具被隐藏。
3. flash 规则第 5 条原文『Inspect files with read/glob/grep』会指挥模型走官方、和 ops 打架 —— 已改成『用 ops_glob/ops_grep/ops_read_files（先 ops_load_sdk）』。
4. 省 token：flash 的 13 条行为规则（persona suffix）+ `compaction-basic.thresholdRatio: 0.25`（更早压缩）。pruner 8192/4096/1024 与 flash 相同，无需改。

## 实际改动
- 文件：`<profile>/node_modules/dsh-ops/presets/ops-ptc.patch.yml`
  - `persona`：保留 `prefix`，追加 `suffix` = flash 44 行规则（第 5 条已改 ops 版）。
  - `compaction-basic`：加 `config: { thresholdRatio: 0.25, compactionRetries: 1 }`。
- 备份：同目录 `ops-ptc.patch.yml.orig-opsflash`（首次运行脚本时生成，为原始无 flash 版）。
- 重打脚本：`C:/dsh-ecosystem/scripts/apply-ops-flash-preset.mjs`。

## 重打脚本做什么（幂等）
- 从 `.orig-opsflash`（不存在则取当前文件并备份）读原始 ops-ptc。
- 从 `dsh-flash-presets` 的 lean 预设提取 persona `suffix` 规则，并把第 5 条 read/glob/grep 替换为 ops 版。
- 注入 ops-ptc 的 persona（suffix）与 compaction-basic（0.25），写回。
- 重复运行结果一致（始终基于原始备份重建）。

## 升级 dsh-ops 后（必做）
```powershell
node C:/dsh-ecosystem/scripts/apply-ops-flash-preset.mjs
```
然后：托盘右键 ->「重启服务与客户端」。

## 验证方法
- 新建会话（默认 OPS (PTC)）跑文件任务，轨迹（轨迹标签）应为：`run_code` -> `ops_load_sdk` -> `ops_glob`/`ops_read_files`，官方 `glob/read/pwsh` 不出现。
- 若出现官方工具：说明注入了旧规则（第 5 条未改）或脚本未跑，重跑脚本并重启。

## 回滚
```powershell
Copy-Item "<profile>/node_modules/dsh-ops/presets/ops-ptc.patch.yml.orig-opsflash" "<profile>/node_modules/dsh-ops/presets/ops-ptc.patch.yml" -Force
```
然后重启。

## 注意 / 限制
- 改的是 dsh-ops 包内文件，pnpm 重装或升级会覆盖 -> 跑一次脚本重打。
- 脚本按锚点（persona prefix、compaction-basic name）注入；若 dsh-ops 重构 ops-ptc fragment 结构导致 `anchor not found`，需更新脚本锚点/缩进。
- 规则文本从当前 dsh-flash-presets 动态提取，flash 升级改规则会自动跟随；但第 5 条替换靠固定英文串匹配，flash 若改这句需同步脚本。

## 相关
- issue #839（已关闭）：https://github.com/T-Auto/dsh-ops/issues/839
- 预设机制文档：`node_modules/dsh-ops/docs/presets.md`、`node_modules/dsh-ops/docs/configuration-reference.md`
