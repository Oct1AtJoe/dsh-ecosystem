/**
 * 桌宠（kanye-pet）Electron 壳补丁的注入规则：patch / verify / revert 共用的真值来源。
 *
 * 前置事实（实测，勿凭猜测改）：
 * - `lib/main.js` 已被 `patches/desktop-menu` 标为 unpacked，正文位于
 *   `resources/app.asar.unpacked/lib/main.js`，**本补丁只改这个磁盘文件**，不碰 asar 头。
 *   因此 desktop-menu 必须先打过；否则本补丁会明确报错而不是盲改。
 * - 官方 `createWindow` 的 `setWindowOpenHandler` 一律 deny，页面无法自建窗口，
 *   透明置顶宠物窗只能由主进程创建 —— 这是补丁存在的唯一原因。
 * - Host 端口每次启动随机，且鉴权 cookie 由主进程注入；宠物页因此由插件 Host 的
 *   `/kanye-pet/window` 提供，壳以 `dsh-app://app/kanye-pet/window` 加载（同源、免 CORS）。
 */

/** 补丁标识：写在文件首行（在既有标记之后），用于幂等判断与版本追溯。 */
export const PATCH_MARK = '/* dsh-ecosystem:kanye-pet-electron v1 */'

/** 宠物窗口页（Host 路由，见插件 src/routes.mjs 的 WINDOW_PATH）。 */
const PET_URL = 'dsh-app://app/kanye-pet/window'

/** 默认窗口尺寸：与 Tauri 版一致（精灵帧裁剪后 122×207）。 */
const PET_W = 150
const PET_H = 255

/**
 * 注入的窗口实现。插在模块作用域（`//#endregion` 之前），
 * 由 `main()` 内的安装点调用 —— 那样才能拿到 `mainWindow` 闭包。
 */
export const IMPL = `
//#region dsh-ecosystem kanye-pet window
/** 桌宠窗口 IPC 通道；preload-pet.cjs 使用同一组字符串。 */
const KANYE_PET_IPC = {
	setPosition: "dsh-pet:set-position",
	setSize: "dsh-pet:set-size",
	setVisible: "dsh-pet:set-visible",
	showMain: "dsh-pet:show-main",
	openSession: "dsh-pet:open-session"
};
/**
 * 创建桌面宠物透明置顶窗口，并安装其 IPC。
 *
 * 显隐语义刻意用 hide()/show() 而非 Tauri 版的 set_size(0,0)：建窗时已关
 * backgroundThrottling，隐藏期间窗口内 2s 轮询照常跑，重新开启时下一周期自愈。
 * @param getMainWindow - 取当前主窗口；宠物点击要把应用唤到前台。
 */
function installKanyePetWindow(getMainWindow) {
	/** 宠物窗口页（插件 Host 路由）。同源加载 → 页内相对路径请求自动带到 Host。 */
	const PET_URL = ${JSON.stringify(PET_URL)};
	const PET_WIDTH = ${PET_W};
	const PET_HEIGHT = ${PET_H};
	const petStatePath = join(app.getPath("userData"), "pet-window.json");
	// preload 路径必须显式指向 app.asar.unpacked：main.js 的 import.meta.url 是 asar
	// 虚拟路径，而 preload-pet.cjs **不在 asar 头里**，asar 层不会把读取重定向到
	// .unpacked —— 用 import.meta.url 拼出来的路径取不到文件，preload 静默不执行，
	// window.petDesktop 永远缺席（页面又全是可选链，所以零报错）。
	const preloadPath = existsSync(join(process.resourcesPath, "app.asar.unpacked", "lib", "preload-pet.cjs"))
		? join(process.resourcesPath, "app.asar.unpacked", "lib", "preload-pet.cjs")
		: join(dirname(fileURLToPath(import.meta.url)), "preload-pet.cjs");
	const debugLogPath = join(app.getPath("userData"), "pet-debug.log");
	/** 诊断日志：宠物窗这条链路全是可选链，出错不会抛，只能靠它取证。 */
	const petLog = (message) => {
		try {
			appendFileSync(debugLogPath, \`[\${new Date().toISOString()}] \${message}\\n\`);
		} catch {}
	};
	petLog(\`install: preload=\${preloadPath} exists=\${existsSync(preloadPath)}\`);
	let petWindow;
	/**
	 * 期望尺寸（物理像素）。拖动时高频回写，用来把窗口从任何意外撑大中拉回。
	 * 声明必须在 createPetWindow 之前：resize/will-resize 处理器会引用它。
	 */
	let desiredSize = { width: PET_WIDTH, height: PET_HEIGHT };
	/** 读上次拖拽落点；缺失/损坏返回 undefined（用默认右下角）。 */
	const readPetPosition = () => {
		try {
			const saved = JSON.parse(readFileSync(petStatePath, "utf8"));
			if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return { x: Math.round(saved.x), y: Math.round(saved.y) };
		} catch {}
		return void 0;
	};
	const savePetPosition = (x, y) => {
		try {
			writeFileSync(petStatePath, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
		} catch (error) {
			console.warn("kanye-pet: could not save window position", error);
		}
	};
	/**
	 * 落点校验：完全落在所有显示器之外时回到主屏右下角。
	 * 拔掉副屏后位置记忆会让窗口飞到屏幕外，这是唯一必须校验的边界。
	 */
	const clampPetPosition = (x, y, width, height) => {
		const visible = screen.getAllDisplays().some((display) => {
			const area = display.workArea;
			return x < area.x + area.width && x + width > area.x && y < area.y + area.height && y + height > area.y;
		});
		if (visible) return { x, y };
		const area = screen.getPrimaryDisplay().workArea;
		return { x: Math.round(area.x + area.width - width - 24), y: Math.round(area.y + area.height - height - 24) };
	};
	const defaultPetPosition = () => {
		const area = screen.getPrimaryDisplay().workArea;
		return { x: Math.round(area.x + area.width - PET_WIDTH - 24), y: Math.round(area.y + area.height - PET_HEIGHT - 24) };
	};
	const loadPetPage = () => {
		if (petWindow === void 0 || petWindow.isDestroyed()) return;
		// 重试判定不能只看 Promise / did-fail-load：Host 未就绪时
		// dsh-app://app 转发的是 **503 空响应**，那是一次「正常完成」的导航
		// （loadURL resolve、did-fail-load 不触发），页面里根本没有 pet.js。
		// 唯一可靠的判据是「加载完的文档里有没有宠物根节点」。
		petWindow.loadURL(PET_URL).then(() => {
			if (petWindow === void 0 || petWindow.isDestroyed()) return;
			petWindow.webContents
				.executeJavaScript("!!document.getElementById('pet')")
				.then((ok) => {
					if (ok === true) return;
					if (petWindow === void 0 || petWindow.isDestroyed()) return;
					setTimeout(loadPetPage, 1000);
				})
				.catch(() => {
					if (petWindow === void 0 || petWindow.isDestroyed()) return;
					setTimeout(loadPetPage, 1000);
				});
		}, () => {
			if (petWindow === void 0 || petWindow.isDestroyed()) return;
			setTimeout(loadPetPage, 1000);
		});
	};
	const createPetWindow = () => {
		if (petWindow !== void 0 && !petWindow.isDestroyed()) return petWindow;
		const saved = readPetPosition() ?? defaultPetPosition();
		const position = clampPetPosition(saved.x, saved.y, PET_WIDTH, PET_HEIGHT);
		petWindow = new BrowserWindow({
			...position,
			width: PET_WIDTH,
			height: PET_HEIGHT,
			show: false,
			frame: false,
			transparent: true,
			hasShadow: false,
			alwaysOnTop: true,
			skipTaskbar: true,
			// 必须 true：resizable:false 会让程序化 setSize() 静默失效
			// （日志实证：req=150x255 而 after 恒为旧值）。见 AGENTS.md §七 #6。
			// 用户拖拽缩放另由 setResizable 在真机上不可达（无边框窗无缩放热区），
			// 所以这里开闸只服务于「设置里的尺寸」。
			resizable: true,
			minimizable: false,
			maximizable: false,
			fullscreenable: false,
			title: "Kanye Pet",
			webPreferences: {
				preload: preloadPath,
				contextIsolation: true,
				nodeIntegration: false,
				sandbox: true,
				// 关键：隐藏期间不节流，否则 2s 的配置轮询停摆，桌宠开关再也回不来。
				backgroundThrottling: false
			}
		});
		petWindow.setAlwaysOnTop(true, "floating");
		petLog(\`create: asked=\${PET_WIDTH}x\${PET_HEIGHT} bounds=\${JSON.stringify(petWindow.getBounds())} scale=\${screen.getDisplayMatching(petWindow.getBounds()).scaleFactor}\`);
		// 尺寸守卫：resizable:true（setSize 需要它）会顺带把 Windows 的窗口缩放路径打开，
		// 而无边框透明窗没有缩放热区，拖动时 DWM 会按内容/光标重算框架，把窗口撑到
		// 200~350px，随后被下一次 setSize 拉回 —— 表现为「按住拖动变大、松手恢复」。
		// 这里用 will-resize 直接拒绝一切用户发起的缩放，只保留程序化 setSize。
		petWindow.on("will-resize", (event) => {
			event.preventDefault();
			petLog("will-resize blocked");
		});
		// resize 兜底：拖动/Snap/DPI 切换都可能让窗口管理器改尺寸。
		// will-resize 只拦「用户发起」的缩放，拦不住系统侧调整，所以这里兜最后一层。
		petWindow.on("resize", () => {
			if (petWindow === void 0 || petWindow.isDestroyed()) return;
			const current = petWindow.getBounds();
			if (current.width === desiredSize.width && current.height === desiredSize.height) return;
			petLog(\`resize event \${current.width}x\${current.height} -> restore \${desiredSize.width}x\${desiredSize.height}\`);
			petWindow.setSize(desiredSize.width, desiredSize.height);
		});
		// 页面加载失败几乎总是 Host 尚未就绪（dsh-app://app 转发返回 503）。
		// 自愈重试而不是让宠物永久空白。
		petWindow.webContents.on("did-fail-load", (_event, code) => {
			if (code === -3) return;
			setTimeout(loadPetPage, 2000);
		});
		petWindow.on("closed", () => {
			petWindow = void 0;
		});
		// 刻意不在 did-finish-load 里 show：503 也是「正常完成」的响应，那时显示等于
		// 闪一个空白窗。显隐的唯一权威是页面自己的配置轮询（pet.js → setVisible）。
		loadPetPage();
		return petWindow;
	};
	/** 只接受宠物窗口自身的 IPC，其他渲染器一律拒绝。 */
	const fromPet = (event) => petWindow !== void 0 && !petWindow.isDestroyed() && event.sender === petWindow.webContents;
	/**
	 * 尺寸纠偏：窗口被外部因素改大时立刻拉回期望值。
	 * 无边框透明窗在拖动时会被 DWM/内容撑开（实测 150→350），只在 3s 轮询里纠偏
	 * 会让用户看到「按住变大、松手恢复」。这里在每次移动时都校一次。
	 */
	const enforcePetSize = () => {
		if (petWindow === void 0 || petWindow.isDestroyed()) return;
		const current = petWindow.getBounds();
		if (current.width === desiredSize.width && current.height === desiredSize.height) return;
		petLog(\`size drift \${current.width}x\${current.height} -> \${desiredSize.width}x\${desiredSize.height}\`);
		petWindow.setSize(desiredSize.width, desiredSize.height);
	};
	ipcMain.handle(KANYE_PET_IPC.setPosition, (event, x, y) => {
		if (!fromPet(event)) throw new Error("kanye-pet: rejected IPC from an unowned renderer");
		if (!Number.isFinite(x) || !Number.isFinite(y) || petWindow.isDestroyed()) return;
		// 先纠尺寸再定位：撑大的窗口会让 clamp 算出错误的可用区域。
		enforcePetSize();
		const bounds = petWindow.getBounds();
		const position = clampPetPosition(Math.round(x), Math.round(y), bounds.width, bounds.height);
		petWindow.setPosition(position.x, position.y);
		savePetPosition(position.x, position.y);
	});
	ipcMain.handle(KANYE_PET_IPC.setSize, (event, width, height) => {
		if (!fromPet(event)) throw new Error("kanye-pet: rejected IPC from an unowned renderer");
		if (!Number.isFinite(width) || !Number.isFinite(height) || petWindow.isDestroyed()) return;
		if (width <= 0 || height <= 0) return;
		const before = petWindow.getBounds();
		petWindow.setSize(Math.round(width), Math.round(height));
		const after = petWindow.getBounds();
		// 以「设完之后真实生效的尺寸」为准：DPI 缩放下 Electron 会做一次换算。
		desiredSize = { width: after.width, height: after.height };
		petLog(\`setSize req=\${width}x\${height} before=\${before.width}x\${before.height} after=\${after.width}x\${after.height} dpi=\${screen.getDisplayMatching(after).scaleFactor}\`);
	});
	ipcMain.handle(KANYE_PET_IPC.setVisible, (event, visible) => {
		if (!fromPet(event)) throw new Error("kanye-pet: rejected IPC from an unowned renderer");
		if (petWindow.isDestroyed()) return;
		if (visible) {
			// showInactive：不抢主窗口焦点，点宠物时才主动唤起。
			petWindow.showInactive();
		} else petWindow.hide();
	});
	ipcMain.handle(KANYE_PET_IPC.showMain, (event) => {
		if (!fromPet(event)) throw new Error("kanye-pet: rejected IPC from an unowned renderer");
		const window = getMainWindow();
		if (window === void 0 || window.isDestroyed()) return;
		if (window.isMinimized()) window.restore();
		window.show();
		window.focus();
	});
	ipcMain.handle(KANYE_PET_IPC.openSession, (event, sessionId) => {
		if (!fromPet(event)) throw new Error("kanye-pet: rejected IPC from an unowned renderer");
		if (typeof sessionId !== "string" || sessionId === "") return;
		const window = getMainWindow();
		if (window === void 0 || window.isDestroyed()) return;
		if (window.isMinimized()) window.restore();
		window.show();
		window.focus();
		// 导航归 ui-workspace 的 view owner：ui-kanye-pet 监听该事件并调 openSession。
		window.webContents.executeJavaScript(
			\`window.dispatchEvent(new CustomEvent('dsh:open-session', { detail: { sessionId: \${JSON.stringify(sessionId)} } }));\`
		).catch((error) => {
			console.warn("kanye-pet: open session event failed", error);
		});
	});
	createPetWindow();
	app.on("will-quit", () => {
		if (petWindow !== void 0 && !petWindow.isDestroyed()) petWindow.destroy();
	});
}
//#endregion
`

/**
 * 每个替换都必须命中且仅命中一次，否则整体拒绝写入。
 * 锚点都取自官方 `lib/main.js`（0.2.1-rc.2 实测唯一命中）。
 */
export const REPLACEMENTS = [
  {
    name: 'import-screen',
    why: '宠物窗口的落点校验需要 screen.getAllDisplays()；官方 import 列表里没有它',
    find: 'import { BrowserWindow, Menu, Notification, Tray, WebContentsView, app, clipboard, dialog, ipcMain, nativeImage, nativeTheme, net, powerMonitor, protocol, session, shell, systemPreferences } from "electron";',
    replace: 'import { BrowserWindow, Menu, Notification, Tray, WebContentsView, app, clipboard, dialog, ipcMain, nativeImage, nativeTheme, net, powerMonitor, protocol, screen, session, shell, systemPreferences } from "electron";',
  },
  {
    name: 'install-window',
    why: '在 main() 内、拿到 mainWindow 闭包的位置安装宠物窗口与 IPC',
    find: '\tinstallDesktopDirectoryPicker(() => mainWindow);',
    replace: '\tinstallDesktopDirectoryPicker(() => mainWindow);\n\tinstallKanyePetWindow(() => mainWindow);',
  },
  {
    name: 'window-implementation',
    why: '插入宠物窗口实现（模块作用域，preload 与 IPC 一组）',
    find: '//#endregion\nexport {};',
    replace: `${IMPL}\n//#endregion\nexport {};`,
  },
]

/** 归档内路径与 unpacked 落盘路径（desktop-menu 已把它标为 unpacked）。 */
export const TARGET = 'lib/main.js'
export const UNPACKED_DIR = 'app.asar.unpacked'

/** preload 目标：与 main.js 同目录，随补丁写入。 */
export const PRELOAD_NAME = 'preload-pet.cjs'

/** 对源码文本应用全部替换；任一锚点不唯一即抛错。 */
export function applyReplacements(source) {
  let out = source
  const applied = []
  for (const rule of REPLACEMENTS) {
    const hits = out.split(rule.find).length - 1
    if (hits !== 1) {
      throw new Error(`锚点「${rule.name}」命中 ${hits} 次（应为 1 次）。官方版本可能已变动，拒绝写入。`)
    }
    const parts = out.split(rule.find)
    out = parts[0] + rule.replace + parts[1]
    applied.push(rule.name)
  }
  return { text: out, applied }
}

/** preload 源码：把窗口操作暴露成 window.petDesktop（页面里唯一的桥）。 */
export const PRELOAD_SOURCE = `// 桌宠窗口的隔离桥：只暴露宠物页需要的五个动作。
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petDesktop", {
	setPosition: (x, y) => ipcRenderer.invoke("dsh-pet:set-position", x, y),
	setSize: (width, height) => ipcRenderer.invoke("dsh-pet:set-size", width, height),
	setVisible: (visible) => ipcRenderer.invoke("dsh-pet:set-visible", visible),
	showMain: () => ipcRenderer.invoke("dsh-pet:show-main"),
	openSession: (sessionId) => ipcRenderer.invoke("dsh-pet:open-session", sessionId)
});
`
