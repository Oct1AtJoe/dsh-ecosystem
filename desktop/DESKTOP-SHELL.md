# DeepSeek Harness 桌面壳（C:\dsh-ecosystem\desktop）架构与注意项

> 本文档是桌面壳开发/修复的总参考。改动前先读本文，尤其是「踩坑记录」一节。

## 1. 技术栈与整体形态

- **栈**：Tauri 2.11.5 + wry + tao 0.35.3 + WebView2（Windows），Rust 后端 + 本地 HTML 前端。
- **窗口形态**：**单窗口双 WebView（本地壳 + 内容区）**。
  - `main` 窗口内嵌 `shell.html` 自绘标题栏（36px，永不导航，随窗口驻留）。
  - DSH 页面运行在 `CONTENT_LABEL = "content"` 的子 WebView 里（`index.html` 启动页，服务就绪后导航到实际 Web UI）。
- **无边框**（`decorations(false)` + `shadow(false)`），Win32 层摘除 `WS_CAPTION`，保留 `WS_THICKFRAME` 供边缘缩放。
- 依赖 Tauri `unstable` feature 才可使用 `Window::add_child` 挂子 WebView。

## 2. 关键路径与常量

- `TITLEBAR_HEIGHT = 36.0`（逻辑像素）：壳标题栏高度，也是内容子 WebView 的纵向偏移基准。
- `CONTENT_LABEL = "content"`：内容子 WebView 标签。
- 窗口几何持久化：`%APPDATA%\ai.deepseek.harness.desktop\window-geometry.json`（关闭/缩放时记录，启动时恢复）。

## 3. 窗口与 WebView 布局

- `main_window(app) -> Option<Window>`：取主窗口。**必须用 `app.get_window("main")`**，不能用 `get_webview_window("main")`。
- `shell_webview(app)` / `page_webview(app)`：分别取壳 WebView（`main`）与内容 WebView（`content`）。
- `layout_webviews(app)`：唯一的重排入口，修正：
  - 壳 WebView：位置 `(0,0)`，尺寸 = 窗口物理宽 × `titlebar_px`。
  - 内容 WebView：位置 `(0,titlebar_px)`，尺寸 = 窗口物理宽 ×（窗口高 − titlebar_px）。
  - **所有尺寸用 `PhysicalPosition`/`PhysicalSize`，精确到物理像素，杜绝 DPI 换算舍入。**
- 触发时机：窗口 `Resized`、`ScaleFactorChanged`、挂载子 WebView 后、显示后延迟 150ms/350ms 各补一次。

## 4. 生命周期顺序（防闪屏硬约束）

窗口创建序（`run()` 的 setup 中）：

1. `WebviewWindowBuilder` 创建主窗口（隐藏 `visible(false)`），`inner_size` 用**恢复的历史几何**（否则首帧出现半宽顶栏闪烁）。
2. 取 `main` 窗句柄：`set_shadow(false)` → `strip_caption_hwnd` → `hide_dwm_border` → `SetWindowSubclass(window_subclass_proc)`。**子类化必须在 show 之前挂**（否则启动/重启瞬间会闪出 Windows 原生标题栏按钮）。
3. `apply_saved_geometry` → `force_borderless_window`。
4. `add_child(content webview)` → `layout_webviews`。
5. `force_borderless_window` + `start_borderless_guard`。
6. `show()` + `set_focus()` — **最后才亮相**。

## 5. Win32 无边框机制（window_subclass_proc）

主窗口子类化依次处理：

- `WM_STYLECHANGING`（GWL_STYLE）：剥掉 `WS_CAPTION`，从源头杜绝 tao 在 show/focus/maximize 时写回原生标题栏（原生按钮闪现的根治）。
- `WM_NCACTIVATE`：返回 1，阻止系统绘制非客户区标题栏按钮。
- `WM_NCCALCSIZE`：普通状态返回 0（客户区铺满物理窗口，消除左右 8px 白边）；最大化时把 `rgrc[0]` 钳制到当前显示器 `rcWork`（不遮任务栏）。
- `WM_NCPAINT`：返回 0，不画非客户区。
- `WM_GETMINMAXINFO`：最大化尺寸/原点钳制到 `rcWork`。
- `WM_NCHITTEST`：未最大化时按 8px 边缘返回 `HTLEFT/HTRIGHT/HTBOTTOM/四角`，支持无白边拖拽缩放。
- `WM_SIZE`：同步 `border_resizing` 辅助窗口。

配套函数：

- `strip_caption_hwnd` / `hide_dwm_border`（DWMWA_BORDER_COLOR=0xFFFFFFFE）/ `force_borderless_window`：保证无边框。
- `start_borderless_guard`：150ms 巡检，防 tao 任何 `apply_diff` 写回 `WS_CAPTION`。
- `do_toggle_maximize`：最大化/还原切换，还原时回读到历史几何（修 Windows 无边框还原只缩几个像素的缺陷）。

## 6. 边缘拖拽缩放（border_resizing 模块）

**背景**：WebView2 渲染层跑在独立的 `msedgewebview2.exe` 进程，同进程 `SetWindowSubclass` 无法拦截/穿透其 `WM_NCHITTEST`；且多 WebView 下 Tauri 内置 `undecorated_resizing` 被跳过。单纯在父窗口拦 `WM_NCHITTEST` 无效 —— 鼠标事件被 Edge 独立进程吞噬。

**方案**：主窗口最顶层（`HWND_TOP`）创建一个透明子窗口，用 GDI `SetWindowRgn` + `RGN_DIFF` 把中间掏空，只留外围 8px 边框：

- 中间镂空：鼠标 100% 穿透到 WebView2，零遮挡零开销。
- 外围 8px：`border_window_proc` 在 `WM_NCHITTEST` 返回对应 `HT*` 代码；左键按下时 `PostMessage(parent, WM_NCLBUTTONDOWN, ...)`，交给 Windows 原生拖拽缩放模态循环。
- 最大化时辅助窗口收起；普通状态随主窗口尺寸变化同步（`WM_SIZE` + `layout_webviews` 均调用 `update_resize_border_window`）。

## 7. 标题栏交互（shell.html）

- 动作走 **Tauri IPC**：`window.__TAURI__`（`startDragging` / `toggleMaximize` / `minimize` / `close` / `show_shell_menu`），权限在 `capabilities/default.json` 声明（`main`、`pet`、`content`）。
- ☰ 菜单用原生弹出菜单：`invoke("show_shell_menu")` → `popup_shell_menu`，5 项：重新加载页面 / 重启服务与客户端 / 开发者工具 (DevTools) / 关于 DSH 宿主版本 / 退出应用。
- 托盘右键菜单与顶栏菜单**必须保持 5 项对齐**（同一套 id 语义）。
- **双击顶栏最大化**：必须在 `mousedown` 里判 `e.detail === 2` 调 `toggleMaximize()`。不能依赖 `dblclick` 事件 —— 第一次单击的 `startDragging()` 会进入系统拖拽模态循环，吞掉后续双击事件。
- 主题同步：`__dshSetTheme(isDark)` 由 Rust eval 进来切换 `dark`/`light` class。

## 8. 内容 WebView 初始化脚本（三条独立注入）

DSH 页面在导航前注入 3 条独立 `initialization_script`，**绝不拼接**：

- `bridge_init_script(port, token)`：Notification shim + 通知桥 + 主题 `MutationObserver`（监听 `data-ds-dark-theme`）。
- `BOOT_FAILURE_SCRIPT`：启动失败提示。
- `brand_overlay_script()`：品牌文字覆盖。

> **教训**：曾把多段拼成一段，其中 `observe(document.documentElement)` 在 `document` 创建早期抛错，静默带走后面所有脚本，表现为刷新后明显延迟。必须各自独立注入；WebView2 对每条单独 `AddScriptToExecuteOnDocumentCreated`，单条异常只中断它自己。

## 9. 服务与重启语义

- `spawn_dsh`：拉起 DSH Web 服务子进程。所有分支统一走「矿本身即 UI」。**不要传已被 CLI 移除的 `--no-open`**（`0.1.5-rc.2` 起该 flag 被删；违反会报错或开浏览器）。
- `restart_app`：完整重启（壳 + 服务）；`restart_backend`：只重启后端（安全模式切换用）。两者行为必须保持对齐。`restart_app` 需先置 `quitting=true` 再调 `app.restart()`，否则被 `ExitRequested` 守卫吃掉。

## 10. 通知桥

- `start_notify_server` 起本地 TCP 通知服务器，端口/token 经 `bridge_init_script` 注入页面。
- 通知点击跳会话、主题变化上报等均走该桥；任务完成提醒由 `inject_task_notifier` 轮询空闲翻转实现。

## 11. 部署流程（硬规则）

1. 编译：`cargo build --release --manifest-path C:\dsh-ecosystem\desktop\src-tauri\Cargo.toml`
2. **绝不自动杀死运行中的 `DeepSeekHarness.exe`**。
3. 部署：**运行中的 exe 可以改名**，无需先关进程。Windows 只锁「覆盖写」，同卷改名是元数据操作，句柄跟随 inode 不跟随文件名。所以：

   ```powershell
   cd C:\dsh-ecosystem\desktop\dist
   $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
   Rename-Item -Path DeepSeekHarness.exe -NewName "DeepSeekHarness.$stamp.bak.exe"
   Copy-Item ..\src-tauri\target\release\deepseek-harness-desktop.exe -Destination DeepSeekHarness.exe
   ```

   - `Rename-Item -NewName` **只接受裸文件名**，传 `dist\xxx.bak.exe` 会报 `Cannot rename the specified target, because it represents a path or device name.`（路径里的反斜杠被当成设备名）。先 `cd` 到 `dist` 再执行。
   - `Copy-Item` 直接覆盖原名会失败（`being used by another process`）；必须先改名腾出名字。顺序不能颠倒。
   - 旧进程继续跑它已打开的旧文件，新 exe 落在原名上，用户重启即生效，全程无感。
4. 告知用户：重启 exe 验证（无需先手动退出，但旧进程要退出才会加载新版本）。
5. `git add/commit/push` 到 `origin main`（`github.com/Oct1AtJoe/dsh-ecosystem`）。

## 12. 踩坑记录（改前必读）

| 症状 | 根因 | 修复姿势 |
| --- | --- | --- |
| 刷新后顶栏/品牌延迟 | initialization script 拼接导致级联抛错 | 三条脚本独立注入 |
| 每次开 exe 浏览器多开 WebUI | spawn 分支漏加开浏览器抑制 | 各启动分支统一不开浏览器（flag 移除后天然如此） |
| 菜单重启只删服务壳没重启 | 调错函数 + 延迟重启被 ExitRequested 守卫吃 | `restart_app` 先置 quitting，主线程分发 |
| `get_webview_window("main")` 返回 None | 多 WebView 时 `is_webview_window()` 为 false | 一律 `app.get_window("main")` |
| 内容区没铺满壳 | add_child 用了预显示默认尺寸 + 布局函数拿错窗口句柄 | 恢复几何后按物理像素计算 + `layout_webviews` 全量重排 |
| 顶栏不随主题变色 | 壳页面不重载，缺主题通知 | 桥里 MutationObserver + Rust eval `__dshSetTheme` |
| 最大化后图标还是单框 | `id="max-icon"` 挂错元素 | id 挂 `<svg>`，切换 path/rect 两态 |
| 最大化遮住任务栏 | 无 WS_CAPTION 时系统按 rcMonitor 最大化 | `WM_GETMINMAXINFO` + `WM_NCCALCSIZE` 钳制 rcWork |
| 左右白边 | shadow 默认内缩 8px 非客户区 | `shadow(false)` + `WM_NCCALCSIZE` 返回 0 + `WM_NCPAINT` 吞绘制 |
| 重启瞬间闪原生按钮 | tao 写回 WS_CAPTION，子类化在 show 之后 | `WM_STYLECHANGING` 剥 caption，show 前挂子类化 |
| 刚打开顶栏只有一半宽 | 首帧用了 builder 默认 1440 宽 | inner_size 直接用历史几何 + 全部排布后再 show |
| 边缘拖拽无法缩放 | WebView2 跨进程吞命中测试；多 WebView 跳过内置 resize 助手 | `border_resizing` 透明镂空顶层辅助窗口 + 父窗口 `WM_NCHITTEST` |
| 双击顶栏不最大化 | startDragging 吞掉 dblclick | `mousedown` 里判 `e.detail === 2` |
| 托盘菜单与顶栏菜单不一致 | 两份菜单各自维护 | 统一为 5 项同一语义 |
| 部署时 `Copy-Item` 覆盖 exe 报 `being used by another process` | 进程运行中，Windows 锁覆盖写 | 先 `Rename-Item` 腾出名字再复制；运行中改名可行，别去杀进程 |
| `Rename-Item` 报 `represents a path or device name` | `-NewName` 传了含 `\` 的路径 | `-NewName` 只给裸文件名，先 `cd` 到目标目录 |
| 冷启动标题栏先浅后深闪一下 | 引导页 `index.html` 无主题标记，`syncThemeFromDom` 把「无标记」当浅色上报 | 守卫：无 `data-ds-dark-theme` 且 `colorScheme` 非 `light` 时不上报；壳用 `localStorage` 记忆首帧主题 |
| 窗口四角是直角，不够圆润 | 摘掉 `WS_CAPTION` 后系统按 popup 处理，Win11 的 DWM 圆角只默认给标准窗口 | `DWMWA_WINDOW_CORNER_PREFERENCE`(33) = `DWMWCP_ROUND`(2)，挂进 `apply_borderless_frame` 随守护循环纠偏 |
| 想用 `SetWindowRgn` 裁更大圆角 | 区域裁剪是 1-bit 的，无抗锯齿；半径越大阶梯锯齿越明显 | 放弃。DWM 原生圆角（实测约 5.8px）自带平滑过渡，半径不可自定义是 Win11 平台限制 |

### 12.1 窗口圆角（DWM 原生，约 5.8px）

无边框窗口的四角圆角由 `round_window_corners()` 设置，随 `apply_borderless_frame()` 一起在 150ms 守护循环里纠偏（tao 重写样式会触发 DWM 重算外观，圆角会丢）。

**平台限制与取舍（已实测，勿重复尝试）**：

| 手段 | 结果 |
| :--- | :--- |
| `DWMWA_WINDOW_CORNER_PREFERENCE` = `DWMWCP_ROUND` | ✅ 生效，约 5.8px，**带抗锯齿** |
| 同上 = `DWMWCP_ROUNDSMALL` | 约 4px |
| 自定义任意半径（如 12/16px） | ❌ DWM 只给两档预设，无自定义像素值 |
| `SetWindowRgn` + `CreateRoundRectRgn` | 可任意半径，但**阶梯锯齿**（半径越大越糟），已实测否决 |
| `DWMWA_NCRENDERING_POLICY` / `DwmExtendFrameIntoClientArea` / 加回 `WS_CAPTION` 求更宽阴影 | ❌ 三者均无效 |

- **DPI**：属性值按逻辑像素解释，实际渲染尺寸随 DPI 缩放。实测环境 DPI 96 / 缩放 1.0，得 5.8 物理像素。
- **最大化**：DWM 自动给最大化窗口直角，无需特殊处理，也不会漏出桌面。
- **阴影**：DWM 对无 caption 窗口只给约 8px 硬边灰带（非柔和投影）；macOS 那种大半径柔和阴影在 Windows 上需自绘 layered window，未实施。

## 13. 主要代码位置（lib.rs）

- 窗口创建/子 WebView 挂载：`run()` 的 setup 段。
- 无边框子类化：`window_subclass_proc`（约 L1364）。
- 边缘缩放：`border_resizing`（约 L1510）。
- 布局：`layout_webviews`（约 L1864）。
- 菜单：`popup_shell_menu` / `build_tray` / `on_menu_event`。
- 重启：`restart_app` / `restart_backend`。
- 通知桥：`start_notify_server` / `bridge_init_script`。
- 主题：`update_dwm_titlebar`。
