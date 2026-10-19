# @deepseek-ai/dsh-client-ui-theme-custom

English | [中文](README.zh.md)

**Tech Themes & Customization** plugin for DeepSeek Harness Web GUI, registered onto the official [`dsh-client-ui-theme`](../ui-theme/README.md) theme registry and settings system.

This plugin delivers six premium crafted tech themes, frosted glass and titlebar fusion aesthetics, and comprehensive UI customization features including independent sidebar font scaling, right sidebar width ratio, composer mascot, and Studio layout.

---

## Core Features

### 1. Six Premium Tech Themes

Registers a dedicated "Tech themes" row (`appearance-custom`) right below the official Appearance row in Settings:

- **Liquid (Sequoia)**: macOS Sequoia-inspired Liquid Frost Light theme. Seamless background `rgb(245,245,247)`, deep frosted glass with `blur(92px) saturate(180%)`, specular hairline highlights, and byte-exact fusion with desktop titlebar.
- **Obsidian (Sonoma)**: macOS Sonoma-inspired Dark Obsidian Pro theme. Deep space dark background `rgb(22,24,30)` with tuned dark glass translucency.
- **Void**: Warm charcoal dark theme `rgb(13,13,16)` for an immersive developer coding environment.
- **Argent (Jade)**: Refined frosted liquid silver light theme `rgb(226,228,233)` with CNC aluminum finish aesthetic.
- **Solar**: Amber glowing frosted glass dark theme `rgb(18,14,16)` with warm eye-friendly amber hues.
- **Parchment**: Warm rice paper & pine soot ink light theme `rgb(230,224,212)` with clean, glare-free reading comfort.

### 2. Frosted Glass & Borderless Titlebar Fusion

- **True Frosted Glass Material**: Powered by `backdrop-filter: blur(92px) saturate(180%)` and optimal opacity (`.38`), gently diffusing background contents while preserving visual hierarchy across composer dock, AI cards, and sidebars.
- **Borderless Titlebar Fusion (Plan C)**: Syncs theme color with desktop shell via notification bridge, aligning canvas and titlebar colors byte-for-byte to eliminate color discrepancies and seams.

### 3. UI Personalization Settings

Seamless native settings integrated into General Settings:

- **Sidebar Font Size**: Decouples sidebar navigation font size from conversation content (default 13px) to prevent navigation from competing visually with reading content.
- **Right Sidebar Initial Width Ratio**: Customizes the default percentage of window width occupied by the right sidebar upon expansion.
- **Composer Pet (Mascot)**: Animated pixel companion displayed above the composer dock.
- **New Conversation Layout**: Toggle between Classic centered layout and Studio layout (centered home model usage panel with docked composer).

---

## Model Experience

No model-facing requests: this plugin only registers CSS token sets and client components into the browser container. It performs no prompt, tool, message, or provider operations and touches no session logs.

#### KV Cache Impact

None — no model inputs are assembled.

---

## Build & Test

```powershell
cd plugins/ui-theme-custom
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
node tests\badge-token-check.mjs
node tests\font-size-check.mjs
```
