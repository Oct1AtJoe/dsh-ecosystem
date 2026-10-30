# dsh-desktop-window-state

给官方 Electron 壳加「主窗口位置 / 大小 / 最大化状态跨重启记忆」。

## 作用

- 启动时从状态文件恢复窗口 bounds 与 `maximized` 状态；
- 移动 / 缩放 / 最大化时节流保存，关闭前再 flush 一次；
- 恢复前做离屏守卫：记录的位置若已不在任何显示器可见范围内，退回默认位置。

## 目标文件

`E:\dshDesktop\resources\app.asar.unpacked\lib\main.js`

这个文件只因为 `desktop-menu` 补丁把它标为 `unpacked` 才会落盘。
**本补丁不重写 asar 头，必须先打 `desktop-menu`。**

## 状态文件

```
%APPDATA%\@deepseek-ai\dsh-desktop\desktop\window-state.json
```

即 `join(app.getPath("userData"), "desktop", "window-state.json")`。

## 用法

```powershell
cd C:\dsh-ecosystem\patches\dsh-desktop-window-state
node patch.mjs --check     # {"applied":false,"canApply":true,...}
node patch.mjs             # 应用（幂等：已应用时 changed:false）
node verify.mjs            # {"ok":true,"checks":{6 项全 true},"syntaxOk":true}
```

`DSH_MAIN_JS` 环境变量可覆盖目标路径（非默认安装位置时用）。

## 补丁独有符号

`persistWindowState(window)`（`lib/rules.mjs` 的 `MARKER`）。
`verify.mjs` 的 6 项判据：`helpersInjected` / `boundsRestored` / `maximizedRestored` /
`saveWired` / `closeFlushed` / `offScreenGuard`。

## 回滚

```powershell
node patch.mjs --revert
```

`--revert` 从**当前 live 文件**的文本反向变换，只撤本补丁，不影响兄弟补丁。

同目录的 `main.js.pre-window-state` 是应用前的快照，**只是最后手段**：
它已带 `desktop-menu` / `kanye-pet` / 网关等兄弟补丁的改动，拿它整份覆盖会把
**那之后**打的所有补丁一起回退。正常情况下不要用它。

## 升级桌面端后

`app.asar` 被整体替换 → `unpacked` 标记丢失 → 按顺序重打：
`desktop-menu` → `kanye-pet-electron` → 本补丁（`--check` 应 `canApply:true`）。
