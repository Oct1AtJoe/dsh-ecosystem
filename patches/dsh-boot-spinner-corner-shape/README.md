# dsh-boot-spinner-corner-shape

修桌面端启动页「Loading plugins…」转圈：圆环被压成圆角方框在转。

## 症状

桌面端冷启那 0.5–1 秒的 boot 页上，进度环不是正圆，而是**四角被削平的 squircle**
在旋转。灰底环也跟着变形。

复现范围只取决于渲染引擎：Chromium **>= 155** 支持 `corner-shape`，`@supports` 命中，
因此桌面端（Electron 44 / Chromium 155）与同版本 Chromium 的浏览器打开 `dsh web` 地址
**都会复现**；老引擎整块丢弃那条通配规则，圆的才是对的。

## 根因

官方 bug，与任何插件无关。

boot 页圆环由 `dsh-web-frontend` 产物里两条规则合成：

```css
._spinner_<hash>      { width:20px; height:20px; border-radius:50%; corner-shape:round; border:2px solid … }
._spinner_<hash>:after{ content:""; position:absolute; inset:-2px; border-radius:inherit;
                        background:conic-gradient(… var(--dsh-boot-arc, 72deg), transparent 0) }
```

父元素自己写了 `corner-shape:round`，**但画彩色进度弧的是 `::after`**，它只写了
`border-radius:inherit`。

而 `ui-theme` 的 `corner-shape.css` 在 `@supports` 命中后用通配覆盖全站：

```css
@supports (corner-shape: superellipse(1.5)) {
  :root { --dsw-corner-shape: superellipse(1.5); }
  *, *::before, *::after { corner-shape: var(--dsw-corner-shape); }
}
```

关键：**`corner-shape` 不继承**。`border-radius: inherit` 只把 `50%` 传下去，
传不了形状。于是 `::after` 落到通配规则的 `superellipse(1.5)`，正圆被压成 squircle。

### 为什么只在支持 `corner-shape` 的引擎上复现

Electron 44 带 Chromium 155，**支持** `corner-shape`，`@supports` 命中。
不支持的引擎整块丢弃那条通配规则，所以圆的是对的——这解释了为什么在
Chrome 150 及更早、或 Firefox / Safari 里看 `dsh web` 一切正常。

### 为什么官方门禁没拦住

`ui-theme/tests/corner-shape-styles.client.spec.ts` 只扫**字面量**
`border-radius: 50% | 100% | >=99px` 有没有配 `corner-shape: round`。
`::after` 用的 `border-radius: inherit` 绕过了扫描，且没有 jsdom 测试会渲染形状。

本机实测：页面上 `[data-dsh-boot-spinner]` 自身的 computed `corner-shape` 是
`superellipse(1)`（来自自己的 `round`），而它的 `::after` 是 `superellipse(1.5)`。

## 修法

给 `::after` 补一句 `corner-shape: round`，与 `corner-shape.css` 自述的配对契约一致：

```diff
 ._spinner_<hash>:after {
   content: "";
   position: absolute;
   inset: -2px;
   border-radius: inherit;
+  corner-shape: round;
   background: conic-gradient(…);
```

## 为什么是 asar 补丁，不是 §6 的固化包

`apps/desktop/src/main.ts:704` **硬编码**了这个目录：

```ts
return serveWebDocument(request, join(resources.dsh, 'node_modules', '@deepseek-ai', 'dsh-web-frontend', 'dist'))
```

它不走 `client-modules` 的 profile 解析，所以在 `packages/` 放同名固化包并
`link:` 进 profile **完全无效** —— 那是给 `dsh.client` 插件用的机制。
asar 内也没有独立的 `dsh-client-web` 包（boot 页 CSS 只存在于 `dsh-web-frontend` 的 dist 产物）。

另外也不能靠插件 CSS 兜底：实测 boot 页存在期约 0–876ms，而插件 CSS 到 569ms 才注入，
前 569ms 救不了；而且这本来就不该让第三方皮肤插件背锅。

## 打法

> 🚨 **必须先完全退出 DSH 桌面端**（托盘右键退出，不是关窗口）。

```powershell
cd C:\dsh-ecosystem\patches\dsh-boot-spinner-corner-shape
node --test tests\rules.test.mjs   # 8/8
node patch.mjs --check             # canApply: true
node patch.mjs --dry-run           # 期望 patchedBytes = originalBytes + 19
node patch.mjs
node verify.mjs                    # 期望 "ok": true
```

手法与 `dsh-host-profile-bom` / `dsh-gateway-heartbeat` 一致：把目标文件标为 asar
`unpacked`，正文写到 `app.asar.unpacked/` 下的磁盘文件，只重写 asar 头部 JSON
（等长填充），数据区一个字节都不移动。**与其它 asar 补丁互不为前置。**

## 判据

`verify.mjs` 四层，缺一不可：

| 判据 | 含义 |
|---|---|
| `headerUnpacked` | asar 头里该条目已标 `unpacked` |
| `symbolHits === 1` | 补丁独有符号 `inset:-2px;border-radius:inherit;corner-shape:round;background:conic-gradient(` 恰好出现一次 |
| `reversible` | 逆变换后再正向施加，能逐字节回到现状（证明补丁只做了这一件事） |
| `anchorLeft === 1` | 逆向形态下锚点仍唯一命中（定位规则没漂） |

> 🚨 **不要用类名当判据**。`_spinner_u7vgf_45` 里的哈希随版本变，升级即失效。

## 验证是否真的修好

`verify.mjs` 只证明文件被改了。真正判据是**肉眼看启动瞬间的圆环是圆的**：

重启桌面端，冷启时「Loading plugins…」上方那个环必须是正圆，
弧线两端不能有被削平的直角。

## 升级桌面端后

`app.asar` 被整体替换 → 本补丁丢失，需重打 (`patches/` 全部补丁都这样)。

重打前先 `node patch.mjs --dry-run`：

- `markerHits: 1` 且 `patchedBytes = originalBytes + 19` → 锚点仍然对准，继续。
- 报 `anchor matched 0 times` → 官方改了 boot spinner 规则，
  先人工看一眼新的 CSS 再改 `lib/rules.mjs` 的 `ANCHOR`。

> 若官方某版本已自带修复（判据：`._spinner_*:after` 规则里已有 `corner-shape`），
> 则删掉本补丁目录并 `--revert`，回官方版。

## 回滚

```powershell
node patch.mjs --revert     # 从 live 磁盘文件做逆变换，只撤本补丁
```

`--revert` 只把 `inset:-2px;border-radius:inherit;corner-shape:round;background:conic-gradient(`
还原成 `inset:-2px;border-radius:inherit;background:conic-gradient(`，逐字节可逆。

彻底回官方版则用备份 `E:\dshDesktop\resources\app.asar.orig-<版本>`。
