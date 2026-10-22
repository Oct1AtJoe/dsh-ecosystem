# 桌宠窗口补丁（kanye-pet-electron）

给 **DSH 官方 Electron 桌面端**加一个透明置顶的桌面宠物窗口，作为 `kanye-pet` 插件的前端宿主。

> ⚠️ 本补丁作用于 `E:\dshDesktop`（官方 Electron 桌面端），**不是** `C:\dsh-ecosystem\desktop` 那套自研 Tauri 壳
> ——后者自带 pet 窗口实现，不需要本补丁。

---

## 为什么需要它（关键事实，改前必读）

1. **官方壳明确禁止页面自建窗口**：`createWindow` 里 `setWindowOpenHandler` 一律返回
   `{ action: "deny" }`，只把 http(s) 链接丢给系统浏览器。透明置顶宠物窗**只能由主进程创建**。
2. **这就是"从 Tauri 换到 Electron"要补的唯一缺口**：Tauri 版的 `pet_open_session` /
   `pet_show_main` / `set_position` / `set_size` / `ShimNotification` 全在
   `desktop-tauri/src-tauri/src/lib.rs` 里，Electron 侧没有任何对应物。
3. **Host 端口每次启动随机**，且鉴权 cookie 由主进程注入。所以宠物页不能像 Tauri 版那样
   硬编码 `http://127.0.0.1:3080` —— 页面由**插件 Host** 的 `GET /kanye-pet/window` 提供，
   壳以 `dsh-app://app/kanye-pet/window` 加载。经 `protocol.handle` 的 `forwardWebRequest`
   转发到 Host，因此**同源、免 CORS、免 cookie 管理**。
4. **前端随插件版本走**：改 `pet.js` 只需重启 Host，不必重打本补丁。这是与 Tauri 版最大的
   维护性改善（那边每改一次前端都要 `cargo build`）。

---

## 前置依赖

**必须先打 `patches/desktop-menu`**。它把 `lib/main.js` 标为 `unpacked`，正文落到
`resources/app.asar.unpacked/lib/main.js`。本补丁只改那个**已展开的磁盘文件**，
**不重写 asar 头**，因此风险面远小于 desktop-menu。未打前置时本补丁会明确报错而不是盲改。

```powershell
cd C:\dsh-ecosystem\patches\desktop-menu
node patch.mjs
node verify.mjs

cd ..\kanye-pet-electron
node patch.mjs
node verify.mjs
```

---

## 用法

> **必须先完全退出 DSH 桌面端**（托盘退出，不是关窗口）：`main.js` 在运行期间被映射进进程。
> 同时 **kanye-pet 插件必须已挂载到当前 profile**，否则宠物窗口会加载失败并每 2s 重试。

```powershell
cd C:\dsh-ecosystem\patches\kanye-pet-electron

# 预演（不写文件，只报锚点命中与字节变化）
node patch.mjs --dry-run

# 打补丁（自动备份 main.js.orig-<版本>）
node patch.mjs

# 校验（17 项，含负向对照）
node verify.mjs

# 回滚（从备份还原 + 删除 preload-pet.cjs）
node revert.mjs
```

默认目标 `E:\dshDesktop`，可用 `--app-dir D:\other\path` 指定别处安装。

---

## 补丁做了什么

| 锚点 | 改动 |
|---|---|
| `import { ... } from "electron"` | 导入列表补 `screen`（落点校验要 `getAllDisplays()`） |
| `installDesktopDirectoryPicker(() => mainWindow);` | 其后接一行 `installKanyePetWindow(() => mainWindow);` |
| `//#endregion\nexport {};` | 其前插入整个窗口实现（约 10KB） |

窗口实现要点：

| 项 | 取值 / 行为 | 理由 |
|---|---|---|
| 窗口属性 | `frame:false` / `transparent:true` / `hasShadow:false` / `alwaysOnTop:true` / `skipTaskbar:true` / `resizable:false` | 透明悬浮窗；无边框无阴影避免透明区域出现灰边 |
| `backgroundThrottling` | **`false`** | **关键**：隐藏期间不节流，2s 配置轮询照常跑 |
| 显隐 | `hide()` / `showInactive()` | 不沿用 Tauri 的 `set_size(0,0)` —— 那是绕开 Tauri 背景节流的 workaround，Electron 直接关节流即可；`showInactive` 不抢主窗口焦点 |
| 位置 | `userData/pet-window.json`，拖拽结束即写 | 重启记住落点 |
| 落点校验 | 完全落在所有显示器外 → 回主屏右下角 | 拔掉副屏后不飞到屏幕外 |
| 加载失败 | `loadURL().catch` → 2s 后重试 | **503 是正常完成的 HTTP 响应，`did-fail-load` 不触发**；只挂后者会让窗口永久空白 |
| 显隐 | 唯一权威是页面的配置轮询（`pet.js → setVisible`） | 不在 `did-finish-load` 里 show：503 也算「加载完成」，那时显示会闪一个空白窗 |
| IPC 校验 | 每个 handler 首行 `event.sender === petWindow.webContents` | 只信宠物窗自己 |

### IPC 契约

| 通道 | 参数 | 行为 |
|---|---|---|
| `dsh-pet:set-position` | `x, y` | 移窗 + 落点校验 + 写盘 |
| `dsh-pet:set-size` | `width, height` | 改窗尺寸（≤0 直接忽略） |
| `dsh-pet:set-visible` | `visible` | `showInactive()` / `hide()` |
| `dsh-pet:show-main` | — | 还原 + 显示 + 聚焦主窗口 |
| `dsh-pet:open-session` | `sessionId` | 显示主窗 + `executeJavaScript` 派发 `dsh:open-session` CustomEvent |

`preload-pet.cjs` 把它们包成 `window.petDesktop.{setPosition,setSize,setVisible,showMain,openSession}`，
这是宠物页唯一的桥。`pet.js` 里**不得出现任何 `__TAURI_INTERNALS__`**。

---

## 官方更新后怎么办

官方「检查更新」会整包覆盖 `app.asar` 与 `app.asar.unpacked`，**两个补丁一起丢失**（宠物消失、菜单项消失）。

更新后按依赖顺序重跑：

```powershell
cd C:\dsh-ecosystem\patches\desktop-menu
node patch.mjs --dry-run   # 先看锚点是否还命中
node patch.mjs
node verify.mjs

cd ..\kanye-pet-electron
node patch.mjs --dry-run
node patch.mjs
node verify.mjs
```

- 两个脚本都幂等：已打则跳过。
- 若 `--dry-run` 报「锚点命中 0 次」或「命中 N 次」，说明官方改了这段代码，
  按新代码更新对应 `lib/rules.mjs` 的 `find` / `replace`，**不要**删掉唯一命中断言。
- 备份按版本命名（`main.js.orig-<版本>`），升级后不会覆盖旧备份。

---

## 文件

```
patches/kanye-pet-electron/
├── patch.mjs          打补丁（幂等，带语法自检与备份）
├── verify.mjs         产物级校验（15 项）
├── revert.mjs         从备份还原 + 清理 preload
├── lib/asar.mjs       最小 asar 读工具（仅用于定位与前置检查）
├── lib/rules.mjs      注入规则 + preload 源码（唯一真值来源）
└── README.md          本文件
```

---

## 排查

| 症状 | 查什么 |
|---|---|
| 宠物窗完全不出现 | ①`node verify.mjs` 是否 15/15；②壳日志有无 `kanye-pet:` 报错；③`curl` 插件 `/kanye-pet/window` 是否 200 |
| 窗口出现但全白/全透明 | Host 未就绪或插件未挂载 → `dsh-app://app/kanye-pet/window` 返 503；补丁会自动每 2s 重试 |
| 拖拽不生效 | `window.petDesktop` 未注入 → `preload-pet.cjs` 是否在 `main.js` 同目录；preload 报错会在壳日志的 `preload-error` 里 |
| 点气泡不跳会话 | 主窗口是否加载了 `dsh-kanye-pet-settings`（它注册 `dsh:open-session` 监听） |
| 关掉桌宠开关后宠物还在 | `desktopPetEnabled` 未写入 profile 的 `cordis.patch.yml` 的 `- id: kanye-pet` 节 |
| 桌宠开着仍弹 Windows Toast | `dsh-kanye-pet-settings` 的 Notification shim 未加载或版本旧，需重建 client bundle |
