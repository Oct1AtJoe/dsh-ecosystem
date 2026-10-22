# DSH 插件拟 macOS 双模主题开发设计规范 (macOS Theme Specification)

本文档面向 DSH 客户端插件生态架构规范（基于 `@deepseek-ai/dsh-client-ui-theme` 与 `Cordis` 插件生命周期），定义 **macOS Sequoia（浅色液态透光）** 与 **macOS Sonoma（深空曜黑暗色）** 两套拟真主题的视觉规范与落地指导。

---

## 1. 核心设计哲学 (Design Philosophy)

1. **Material Honesty（材质真实感）**：
   - 彻底摆脱纯色平涂，利用半透明基底与高斯模糊（`backdrop-filter: blur(...)`），使桌面环境壁纸的冷暖流光自然透过视窗；
   - 侧边栏与主会话区拥有符合 macOS 规范的不同透光等级分层。
2. **Hairline Specular Rim（1px 镜面发丝高光倒角）**：
   - 浅色视窗使用 `1px solid rgba(255, 255, 255, 0.65)`，暗色视窗使用 `1px solid rgba(255, 255, 255, 0.14)`；
   - 模拟 Apple 工业设计中精密 CNC 铝合金切削高光与玻璃边缘倒角反光。
3. **Apple Native Typography & Radii（原生排版与曲率）**：
   - 视窗统一采用标准的 **18px 连续圆角（Squircle）**；
   - 按钮与交互控键采用 **14px 药丸/平角圆弧**；
   - 排版优先使用 `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"`。

---

## 2. 方案一：macOS Sequoia 液态透光浅色版 (Liquid Frost Light)

### 2.1 风格定位
专为日间自然光与明亮工作环境打造，还原 macOS Sequoia 标志性的加州红杉林阳光渐变漫反射与透亮亚克力毛玻璃。

### 2.2 DSH 核心 Token 映射表

| Token 名称 | 规范取值 | 视觉用途说明 |
| :--- | :--- | :--- |
| `--dsw-alias-bg-base` | `rgba(255, 255, 255, 0.72)` | 视窗主基底半透亚克力层 |
| `--dsw-alias-bg-layer-1` | `rgba(255, 255, 255, 0.88)` | 抬高卡片/气泡层背景 |
| `--dsw-alias-bg-layer-2` | `rgba(245, 245, 247, 0.92)` | 辅助面板/次级功能槽底衬 |
| `--dsw-specific-sidebar-fill`| `rgba(245, 245, 247, 0.45)` | 左侧 Vibrancy 磨砂侧栏背景 |
| `--dsw-alias-glass-blur` | `blur(48px) saturate(200%)` | 高采样率液态光晕滤镜 |
| `--dsw-alias-brand-primary` | `#0071e3` | 经典 Apple 官方系统蓝色 |
| `--dsw-alias-label-primary` | `#1d1d1f` | 高清晰度深灰黑正文字墨 |
| `--dsw-alias-button-radius` | `14px` | 原生按钮连续倒角 |
| `--dsw-code-bg` | `#f6f8fa` | Xcode 浅色代码块底衬 |

---

## 3. 方案二：macOS Sonoma 深空曜黑暗色版 (Dark Obsidian Pro)

### 3.1 风格定位
专为开发者长时间沉浸敲代码设计的深空灰/黑曜石夜间模式，消解高对比刺眼白光，保留柔和夜间透光微晕。

### 3.2 DSH 核心 Token 映射表

| Token 名称 | 规范取值 | 视觉用途说明 |
| :--- | :--- | :--- |
| `--dsw-alias-bg-base` | `rgba(22, 24, 30, 0.74)` | 黑曜石暗夜半透视窗基底 |
| `--dsw-alias-bg-layer-1` | `rgba(28, 32, 40, 0.78)` | 暗色抬高层气泡背景 |
| `--dsw-alias-bg-layer-2` | `rgba(34, 38, 48, 0.85)` | 暗色输入坞/对话框底衬 |
| `--dsw-specific-sidebar-fill`| `rgba(18, 20, 25, 0.55)` | 暗夜极客深色半透侧栏 |
| `--dsw-alias-glass-blur` | `blur(50px) saturate(180%)` | 暗夜高折射光晕模糊层 |
| `--dsw-alias-brand-primary` | `#2997ff` | macOS 暗黑模式专属亮天蓝 |
| `--dsw-alias-label-primary` | `#f5f5f7` | 柔和白正文字墨（不刺眼） |
| `--dsw-alias-button-radius` | `14px` | 官方一致性圆角 |
| `--dsw-code-bg` | `#14161b` | Xcode 专业极客暗黑代码框 |

---

## 4. 插件工程集成指南 (Plugin Integration)

在现有本地插件目录 `C:\dsh-ecosystem\plugins\ui-theme-custom` 中落地：

1. **放置源码**：
   - 将生成的 `src-client-sequoia.ts` 命名为 `sequoia.ts`，放置于 `src/client/` 下；
   - 将生成的 `src-client-sonoma.ts` 命名为 `sonoma.ts`，放置于 `src/client/` 下。
2. **注册主题定义**（在 `src/client/index.ts` 中注册）：
   ```typescript
   import { SEQUOIA_TOKENS } from './sequoia.ts'
   import { SONOMA_TOKENS } from './sonoma.ts'

   const SEQUOIA: ThemeDefinition = Object.freeze({
     id: 'sequoia',
     colorScheme: 'light' as const,
     tokens: SEQUOIA_TOKENS,
   })

   const SONOMA: ThemeDefinition = Object.freeze({
     id: 'sonoma',
     colorScheme: 'dark' as const,
     tokens: SONOMA_TOKENS,
   })
   ```
3. **挂载首选项行**（在 `src/client/TechThemeRow.tsx` 中将按钮加入 `CUBES` 列表）：
   ```typescript
   { id: 'sequoia', labelKey: 'tech-theme.sequoia', Icon: IconBrowseOutline16 },
   { id: 'sonoma', labelKey: 'tech-theme.sonoma', Icon: IconThinkOutline16 },
   ```
4. **国际化词条补充**（在 `src/client/locales.ts` 中）：
   ```typescript
   zh: {
     'tech-theme.sequoia': '液态透光 (浅色)',
     'tech-theme.sonoma': '深空曜黑 (暗色)',
   }
   ```
