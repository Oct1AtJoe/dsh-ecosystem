# 桌面端菜单补丁（desktop-menu）

给 **DSH 官方 Electron 桌面端**的「应用」菜单与托盘右键菜单各加两项：

| 菜单项 | 行为 |
|---|---|
| 刷新页面 | `webContents.reloadIgnoringCache()` —— 等价浏览器 **Ctrl+F5**（绕过 HTTP 缓存重载，不清 Service Worker） |
| 重启应用 | `app.relaunch()` + `quitWithoutConfirmation()` —— 壳与 Host 子进程一起重启 |

> ⚠️ 本补丁作用于 `E:\dshDesktop\resources\app.asar`（官方 Electron 桌面端 0.2.1-rc.2），
> **不是** `C:\dsh-ecosystem\desktop` 那套自研 Tauri 壳。后者菜单文案是
> 「关于 DSH / 重新加载页面 / 重启服务与客户端」，与截图不符。

---

## 为什么这么做（关键事实，改前必读）

1. **官方代码里本来就有这两项，但被 `...development ? [...] : []` 包着** —— 只有
   `!app.isPackaged`（开发态）才显示，发布版被隐藏。补丁只是解除这个条件。
2. 原「刷新页面」用的是 `role: 'reload'`（Ctrl+R 走缓存），**不是** Ctrl+F5。补丁换成
   `reloadIgnoringCache()`。
3. `lib/main.js` 在 asar 数据区里**紧贴** `lib/preload-app.cjs`，间隙为 **0 字节**，
   所以**无法原地扩展**。补丁改为把该条目标为 `unpacked: true`，正文写到
   `app.asar.unpacked/lib/main.js`，asar 内其余条目 offset 全部不变。
4. Electron fuse `EnableEmbeddedAsarIntegrityValidation` 实测为 **0（关闭）**，
   改 asar 不会触发完整性校验失败。
5. 托盘 `DesktopTray` 在模块顶层，拿不到 `mainWindow`，因此补丁在 `main()` 内
   通过 `options.reload` / `options.restart` 注入两个动作。

---

## 用法

> **必须先退出 DSH 桌面端**：`app.asar` 在运行期间被独占锁定（`EBUSY`）。

```powershell
cd C:\dsh-ecosystem\patches\desktop-menu

# 预演（不写任何文件，只看会改什么、字节数、哈希）
node patch.mjs --dry-run

# 打补丁（自动备份 app.asar.orig-<版本>）
node patch.mjs

# 校验（17 项，含负向对照）
node verify.mjs

# 回滚（从备份整体还原，逐字节一致）
node revert.mjs
```

默认目标 `E:\dshDesktop`，可用 `--app-dir D:\other\path` 指定别处安装。

---

## 补丁做了什么

| 锚点 | 改动 |
|---|---|
| `applicationItems()` 的开发态块 | 解除 `development` 条件，两项提为常驻；刷新改 `reloadIgnoringCache()` |
| `DesktopTray.relabel()` 菜单模板 | 「打开」与「退出」之间插入刷新、重启两项 |
| `main()` 里的 `new DesktopTray({...})` | 注入 `reload` / `restart` 两个回调 |
| `locale.ts` 的 `restartAppHostMenu`（en / zh） | 「重启应用与 Host」→「重启应用」 |

每个锚点都**强制断言唯一命中**，命中数不等于 1 就整体拒绝写入 —— 官方版本漂移时
不会盲改，只会报错。

---

## 官方更新后怎么办

官方「检查更新」会整包覆盖 `app.asar`，**补丁随之丢失**（菜单项静默消失）。

更新后重跑一次即可：

```powershell
cd C:\dsh-ecosystem\patches\desktop-menu
node patch.mjs --dry-run   # 先看锚点是否还命中
node patch.mjs
node verify.mjs
```

- 脚本幂等：已打补丁则直接跳过。
- 若 `--dry-run` 报「锚点命中 0 次」，说明官方改了这段代码，需要按新代码更新
  `lib/rules.mjs` 里的 `find` / `replace`。
- 备份按版本号命名，升级后不会覆盖旧备份。

---

## 文件

```
patches/desktop-menu/
├── patch.mjs          打补丁（幂等，带语法自检与备份）
├── verify.mjs         产物级校验（17 项）
├── revert.mjs         从备份还原
├── lib/asar.mjs       最小 asar 读写（读头、读条目、等长写头）
├── lib/rules.mjs      注入规则唯一真值来源
└── README.md          本文件
```

---

## 已验证

在真实 asar 的沙盒副本上做过完整演练：

- 打补丁 → `verify.mjs` **17/17 通过**
- 重复打补丁 → 正确跳过（幂等）
- `revert.mjs` → 还原后 asar 与原文件 **SHA256 逐字节一致**
