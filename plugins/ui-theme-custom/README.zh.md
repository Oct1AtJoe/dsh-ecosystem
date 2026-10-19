# @deepseek-ai/dsh-client-ui-theme-custom

[English](README.md) | 中文

DSH Web GUI 的**科技主题与外观定制**插件，注册到官方 [`dsh-client-ui-theme`](../ui-theme/README.md) 主题注册表与设置系统。

本插件为 DeepSeek Harness 提供了 6 套高质感定制主题、拟真毛玻璃与顶栏无边框融合视觉，以及侧边栏字号、右栏宽度、输入框挂件与工作室版面等一系列深度界面定制能力。

---

## 核心特性

### 1. 六套高质感科技主题（Tech Themes）

在设置页「外观」下方注册独立的「科技主题」设置行（`appearance-custom`），包含：

- **液态 (Sequoia)**：macOS Sequoia 风格液态透光浅色版（Liquid Frost Light）。纯净实色底 `rgb(245,245,247)`，搭配 `blur(92px) saturate(180%)` 深度毛玻璃与镜面发丝高光，与桌面壳顶栏逐字节无边框融合。
- **曜黑 (Sonoma)**：macOS Sonoma 风格深空曜黑暗色版（Dark Obsidian Pro）。深空黑曜石沉浸质感 `rgb(22,24,30)`，采用暗色系独立透光毛玻璃参数。
- **冥夜 (Void)**：火山灰微光毛玻璃暖黑版（Warm Charcoal）。极简深沉灰黑底色 `rgb(13,13,16)`，沉浸极客编码氛围。
- **银曜 (Jade / Argent)**：精致磨砂液态银灰浅色版（Refined Frosted Liquid Silver）。底色 `rgb(226,228,233)`，银灰铝合金切削质感。
- **灼日 (Solar)**：琥珀暖光磨砂玻璃暗色版（Amber Glowing）。底色 `rgb(18,14,16)`，温润暗调琥珀光晕。
- **缃素 (Parchment)**：温润暖茶宣纸与松烟墨极简浅色版（Warm Rice Paper & Pine Soot Ink）。底色 `rgb(230,224,212)`，仿古宣纸纯净无光斑护眼设计。

### 2. 拟真毛玻璃与顶栏无缝融合视觉

- **真实毛玻璃质感**：基于 `backdrop-filter: blur(92px) saturate(180%)` 与黄金透明度（`.38`），化开底层内容而不失通透感。输入坞、AI 回复卡片、侧边栏均享有专属毛玻璃材质。
- **顶栏无缝融合（方案 C）**：通过通知桥向桌面外壳同步主题色，顶栏与页面画布色值逐字节对齐，彻底消除窗口接缝色差与多余线条。

### 3. 界面个性化配置项

在设置页「外观与常规」中提供原生体验的定制设置项：

- **侧边栏字号独立调节 (Sidebar Font Size)**：导航 chrome 与对话区正文字号解耦，默认 13px，避免导航文字与对话内容争抢视觉权重。
- **右侧边栏初始百分比宽度 (Right Sidebar Width)**：自定义右侧栏展开时占据窗口宽度的默认百分比。
- **输入框挂件 (Composer Pet / Mascot)**：在输入框工具栏上方展示灵动像素小伙伴挂件。
- **新会话版面切换 (Home Layout)**：支持经典居中版面与工作室版面（Studio Layout，中央展示模型用量统计面板、输入框自动贴底）。

---

## 模型体验

无任何模型侧请求：本插件仅向浏览器端注册主题 CSS Token 与界面组件，不发起提示词、工具、消息或 provider 请求，也不触碰会话日志。

#### KV 缓存影响

无 —— 不组装任何模型输入。

---

## 构建与测试

```powershell
cd plugins/ui-theme-custom
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
node tests\badge-token-check.mjs
node tests\font-size-check.mjs
```
