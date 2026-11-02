# [Bug] Desktop boot page: loading ring renders as a rounded **square** — `corner-shape: superellipse(1.5)` lands on `.spinner::after` because `border-radius: inherit` slips past the pairing gate

## 现象 / Symptom

DSH 启动页的「Loading plugins」进度环渲染成**圆角方形（squircle）**，不是正圆。转圈时四角明显被削平。

The boot-page progress ring renders as a **rounded square** instead of a circle. The four corners are visibly flattened while it spins.

| 项 | 值 |
|---|---|
| DSH Desktop | `0.2.1-rc.5` |
| Electron | `44.7.0` (Chromium 155) |
| OS | Windows 11 |
| 首次出现 | `7020c7e12` (2026-09-01)，至少 `0.1.7-rc.2` 起所有版本 |
| 至 master 仍未修 | 是 |

> 需要支持 `corner-shape` 的引擎（Chromium 155+）。老引擎看不到，因为整个 `corner-shape.css` 包在 `@supports` 里。

## 根因 / Root cause

两件事叠加。

### 1. `ui-theme` 的通配规则刷到了伪元素上

`packages/client/ui-theme/src/styles/corner-shape.css`：

```css
@supports (corner-shape: superellipse(1.5)) {
  :root { --dsw-corner-shape: superellipse(1.5); }

  *,
  *::before,
  *::after {
    corner-shape: var(--dsw-corner-shape);
  }
}
```

`corner-shape` **不继承**，所以作者用通配 + 显式列出 `::before`/`::after` 覆盖全部表面。文件头注释写明了配对契约：

> a superellipse deforms a circle into a squircle and squares off capsule ends, so **every effectively uncapped radius (50%, 100%, or a pill radius far above the box size) pairs `corner-shape: round` with its `border-radius` in the owning component sheet.**

### 2. `boot-page.module.css` 只给父元素配了 `round`，漏了 `::after`

`packages/client/web/src/boot-page.module.css`：

```css
.spinner {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  corner-shape: round;        /* 有 */
  border: 2px solid var(--dsw-alias-border-l2, var(--dsh-boot-border));
  animation: spin 0.8s linear infinite;
}

.spinner::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;     /* 继承了 50% —— 几何是对的 */
                              /* 但缺 corner-shape: round */
  background: conic-gradient(
    var(--dsw-alias-brand-primary, var(--dsh-boot-brand)) var(--dsh-boot-arc, 72deg),
    transparent 0
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0);
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0);
}
```

关键点：**`border-radius` 可以继承（这里用 `inherit` 显式拿 50%），`corner-shape` 不会。**

- `::after` 的 `border-radius` = `50%` → 圆的**几何**对；
- `::after` 的 `corner-shape` = `superellipse(1.5)`（来自通配）→ 圆的**形状**被压成 squircle。

两者不一致，就是方框的成因。`.spinner` 自身因为写了 `corner-shape: round`，所以它的边框圈是对的——这也解释了为什么看到的是「方形彩色弧 + 圆形灰底」这种错位。

注意 `7020c7e12` 的 diff 只给 `.spinner` 加了那一行，`.spinner::after` 从未被碰过。

## 为什么门禁测试没抓到 / Why the gate missed it

`packages/client/ui-theme/tests/corner-shape-styles.client.spec.ts` 的判定是纯字面量匹配：

```ts
function isFullRound(value: string): boolean {
  return value.split(/\s+/).some(part =>
    part === "50%" || part === "100%" || (part.endsWith("px") && Number.parseFloat(part) >= 99))
}
```

`border-radius: inherit` 三段都不匹配 → 整条规则被跳过 → `.spinner::after` 从未被审视。

全仓共 **15 处** `border-radius: inherit`。我逐处查了父级半径，只有 `.spinner::after` 的继承链落点是 `50%`（满圆）；其余落点是 `var(--dsw-radius-sm|md|lg)` 这类有限半径，superellipse 对有限半径只是更平滑，不会变成方形。所以视觉上只炸这一处。

**换句话说：这不是笔误孤例，而是一类漏网形态——「`inherit` 传递了满圆半径，但门禁只认字面量」。** 下一个在满圆元素上写 `border-radius: inherit` 的伪元素会以同样方式静默回归。

## 复现 / Reproduce

boot 页存活约 0.9 秒，建议先在那行 `animation` 上打断点，或在 devtools 里选中后立刻求值：

```js
const el = document.querySelector("[data-dsh-boot-spinner]")
getComputedStyle(el).cornerShape              // "superellipse(1)"   ← 正常
getComputedStyle(el, "::after").cornerShape   // "superellipse(1.5)" ← 罪魁
getComputedStyle(el, "::after").borderRadius  // "50%"               ← 圆角是对的
```

把 `--dsw-corner-shape` 临时改成 `round` 即可看到圆环恢复正圆，可直接确认因果。

## 修复 / Fix

```diff
 .spinner::after {
   content: "";
   position: absolute;
   inset: -2px;
   border-radius: inherit;
+  corner-shape: round;
   background: conic-gradient(
```

一行，无副作用。我已在本地对打包后的 `dsh-web-frontend/dist/assets/index-*.css` 实测：`::after` 的 computed `corner-shape` 从 `superellipse(1.5)` 变为 `superellipse(1)`，圆环恢复正圆，两端不再削平。

## 建议：把门禁改成结构性判定

`isFullRound()` 应至少额外识别两种「间接满圆」：

1. `border-radius: inherit`，且同文件父选择器的 `border-radius` 是满圆；
2. `border-radius: var(--token)`，且该 token 在令牌表里是满圆值。

退一步的最小改动：**凡是 `::before`/`::after` 上的 `border-radius: inherit`，一律要求显式 `corner-shape`**——因为伪元素的 `corner-shape` 永远拿不到父元素的形状，这个组合本质上是不安全的。

如果维护者觉得可以，我可以直接开一个 PR，把这一行 CSS + 对应门禁用例（含一个 `inherit` 的回归测试）一起提。
