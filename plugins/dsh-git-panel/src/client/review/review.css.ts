/**
 * 提交审查高保真样式系统：对齐 dsh-git-review 视觉表现与主题令牌。
 * @module dsh-git-panel/client/review/review.css
 */

export const REVIEW_STYLE = `
/* 1. 宿主联动：只要审查视图挂载，立即彻底隐藏底部输入框与桌宠，消除底部预留高度 */
:is([data-conversation-scroll], [class*="scrollBody"]):has([data-conversation-composer-overlay]) {
  --dsh-composer-height: 0px !important;
}
:is([data-conversation-scroll], [class*="scrollBody"]):has([data-conversation-composer-overlay]) > :is([data-composer-seat], [class*="composerSeat"]) {
  display: none !important;
}
:is([data-conversation-scroll], [class*="scrollBody"]):has([data-conversation-composer-overlay]) .dsh-composer-pet {
  display: none !important;
}

/* 2. 审查主视图容器与设计令牌 */
.dsh-review-root {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary, var(--fg, #1f2328));
  background: var(--dsw-alias-bg-layer-1, var(--bg, #ffffff));
  --review-border: var(--dsw-alias-border-l2, rgba(128,128,128,0.18));
  --review-hover: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.06));
  --review-active: var(--dsw-alias-interactive-bg-active, rgba(128,128,128,0.12));
  --review-muted: var(--dsw-alias-label-tertiary, var(--muted, #656d76));
  --review-secondary: var(--dsw-alias-label-secondary, #57606a);
  --review-add-color: var(--dsw-alias-state-success-primary, #1a7f37);
  --review-del-color: var(--dsw-alias-state-error-primary, #cf222e);
  --review-biz-color: var(--dsw-alias-state-business-primary, #9a6700);
  --review-add-bg: color-mix(in srgb, var(--review-add-color) 14%, transparent);
  --review-del-bg: color-mix(in srgb, var(--review-del-color) 14%, transparent);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

[data-ds-dark-theme] .dsh-review-root {
  --review-add-color: #3fb950;
  --review-del-color: #f85149;
  --review-biz-color: #e3b341;
  --review-muted: #8b949e;
  --review-secondary: #8b949e;
}

/* 3. 顶部 CommitHeader */
.dsh-review-header {
  border-bottom: 1px solid var(--review-border);
  flex-direction: column;
  flex: none;
  gap: 6px;
  padding: 8px 12px;
  display: flex;
  background: var(--dsw-alias-bg-layer-1, var(--bg));
}
.dsh-review-header-top {
  align-items: center;
  gap: 8px;
  display: flex;
  min-width: 0;
}
.dsh-review-toggle {
  width: 20px;
  height: 20px;
  color: var(--review-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  flex: none;
  justify-content: center;
  align-items: center;
  padding: 0;
  display: inline-flex;
}
.dsh-review-toggle:hover {
  background: var(--review-hover);
  color: var(--dsw-alias-label-primary, var(--fg));
}
.dsh-review-toggle-icon {
  transition: transform .12s ease;
  display: inline-flex;
}
.dsh-review-toggle-open {
  transform: rotate(90deg);
}
.dsh-review-label {
  color: var(--review-muted);
  font-size: 12px;
  flex: none;
  font-weight: 500;
}
.dsh-review-subject {
  color: var(--dsw-alias-label-primary, var(--fg));
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.dsh-review-stats {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex: none;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  display: inline-flex;
  font-family: inherit;
}
.dsh-review-stat-add {
  color: var(--review-add-color);
  font-weight: 600;
}
.dsh-review-stat-del {
  color: var(--review-del-color);
  font-weight: 600;
}
.dsh-review-stat-count {
  color: var(--review-muted);
}
.dsh-review-info-grid {
  margin-top: 4px;
  padding: 8px 12px;
  background: var(--review-hover);
  border: 1px solid var(--review-border);
  border-radius: 6px;
  font-size: 12px;
  display: grid;
  grid-template-columns: 60px 1fr;
  row-gap: 5px;
  column-gap: 8px;
  align-items: center;
}

/* 4. 左侧文件树 CommitFileTree */
.dsh-review-tree {
  border-right: 1px solid var(--review-border);
  flex-direction: column;
  flex: none;
  min-height: 0;
  display: flex;
  background: var(--dsw-alias-bg-layer-1, var(--bg));
}
.dsh-review-tree-search {
  padding: 7px 10px;
  border-bottom: 1px solid var(--review-border);
}
.dsh-review-tree-input {
  width: 100%;
  height: 26px;
  box-sizing: border-box;
  padding: 0 8px 0 24px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--review-border);
  background: var(--review-hover);
  color: inherit;
  outline: none;
}
.dsh-review-tree-input:focus {
  border-color: var(--review-biz-color);
}
.dsh-review-tree-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
}
.dsh-review-dir-row {
  width: 100%;
  height: 26px;
  box-sizing: border-box;
  color: var(--dsw-alias-label-primary, var(--fg));
  cursor: pointer;
  background: transparent;
  border: none;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  font-size: 12.5px;
  display: flex;
  user-select: none;
  text-align: left;
}
.dsh-review-dir-row:hover {
  background: var(--review-hover);
}
.dsh-review-file-row {
  width: 100%;
  height: 26px;
  box-sizing: border-box;
  color: var(--dsw-alias-label-primary, var(--fg));
  cursor: pointer;
  background: transparent;
  border: none;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  font-size: 12.5px;
  display: flex;
  user-select: none;
  transition: background .1s;
  text-align: left;
}
.dsh-review-file-row:hover {
  background: var(--review-hover);
}
.dsh-review-file-row.active {
  background: var(--review-active);
}
.dsh-review-badge {
  border-radius: 3px;
  flex: none;
  justify-content: center;
  align-items: center;
  width: 14px;
  height: 14px;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
}
.dsh-review-badge-m { color: #fff; background: var(--review-biz-color); }
.dsh-review-badge-a { color: #fff; background: var(--review-add-color); }
.dsh-review-badge-d { color: #fff; background: var(--review-del-color); }
.dsh-review-badge-r { color: #fff; background: #8250df; }

/* 5. 右侧 Diff 面板 CommitDiffPanel */
.dsh-review-diff-pane {
  flex-direction: column;
  flex: 1;
  min-height: 0;
  display: flex;
  background: var(--dsw-alias-bg-layer-1, var(--bg));
}
.dsh-review-diff-header {
  border-bottom: 1px solid var(--review-border);
  flex-flow: wrap;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  display: flex;
  font-size: 12px;
}
.dsh-review-diff-btn {
  border: 1px solid var(--review-border);
  color: var(--review-secondary);
  cursor: pointer;
  white-space: nowrap;
  background: transparent;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  line-height: 1.4;
  transition: all .12s;
}
.dsh-review-diff-btn:hover {
  background: var(--review-hover);
  color: var(--dsw-alias-label-primary, var(--fg));
}
.dsh-review-diff-btn.active {
  background: var(--review-active);
  color: var(--review-biz-color);
  font-weight: 600;
}
.dsh-review-diff-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 1.55;
  background: var(--dsw-alias-bg-layer-1, var(--bg));
}

/* 经典 4 栏双列 Grid (Split) - 严格 50% / 50% 对等分栏，确保右侧新代码默认完整可见 */
.dsh-review-table {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.dsh-review-row {
  grid-template-columns: 44px minmax(0, 1fr) 44px minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: grid;
  position: relative;
}
.dsh-review-cell-no {
  color: var(--review-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
  user-select: none;
  padding: 0 6px;
  box-sizing: border-box;
}
.dsh-review-cell-no:first-child {
  border-right: 1px solid var(--review-border);
}
.dsh-review-cell-txt {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  min-width: 0;
  padding: 0 8px;
  box-sizing: border-box;
}
.dsh-review-cell-txt:nth-child(4) {
  border-left: 1px solid var(--review-border);
}

/* 斜线遮罩 hatched */
.dsh-review-hatched {
  background-image: repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in srgb, var(--review-border) 55%, transparent) 4px 5px);
}

/* 新增行 */
.dsh-review-row-add > .dsh-review-cell-no:nth-child(3) {
  color: var(--review-add-color);
  background: var(--review-add-bg);
  box-shadow: inset -3px 0 0 0 var(--review-add-color);
}
.dsh-review-row-add > .dsh-review-cell-txt:nth-child(4) {
  color: color-mix(in srgb, var(--review-add-color) 82%, var(--dsw-alias-label-primary, var(--fg)));
  background: var(--review-add-bg);
}

/* 删除行 */
.dsh-review-row-del > .dsh-review-cell-no:first-child {
  color: var(--review-del-color);
  background: var(--review-del-bg);
  box-shadow: inset -3px 0 0 0 var(--review-del-color);
}
.dsh-review-row-del > .dsh-review-cell-txt:nth-child(2) {
  color: color-mix(in srgb, var(--review-del-color) 88%, var(--dsw-alias-label-primary, var(--fg)));
  background: var(--review-del-bg);
}

/* 修改行 Pair */
.dsh-review-row-pair > .dsh-review-cell-no:first-child {
  color: var(--review-del-color);
  background: var(--review-del-bg);
  box-shadow: inset -3px 0 0 0 var(--review-del-color);
}
.dsh-review-row-pair > .dsh-review-cell-txt:nth-child(2) {
  color: color-mix(in srgb, var(--review-del-color) 88%, var(--dsw-alias-label-primary, var(--fg)));
  background: var(--review-del-bg);
}
.dsh-review-row-pair > .dsh-review-cell-no:nth-child(3) {
  color: var(--review-add-color);
  background: var(--review-add-bg);
  box-shadow: inset -3px 0 0 0 var(--review-add-color);
}
.dsh-review-row-pair > .dsh-review-cell-txt:nth-child(4) {
  color: color-mix(in srgb, var(--review-add-color) 82%, var(--dsw-alias-label-primary, var(--fg)));
  background: var(--review-add-bg);
}

/* 单列模式 Grid (Unified) */
.dsh-review-row-u {
  grid-template-columns: 52px minmax(0, 1fr);
  min-width: 0;
  display: grid;
  position: relative;
}
.dsh-review-cell-no-u {
  color: var(--review-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
  user-select: none;
  border-right: 1px solid var(--review-border);
  padding: 0 6px;
}
.dsh-review-row-u-add > .dsh-review-cell-no-u {
  color: var(--review-add-color);
  background: var(--review-add-bg);
  box-shadow: inset -3px 0 0 0 var(--review-add-color);
}
.dsh-review-row-u-add > .dsh-review-cell-txt {
  color: color-mix(in srgb, var(--review-add-color) 82%, var(--dsw-alias-label-primary, var(--fg)));
  background: var(--review-add-bg);
}
.dsh-review-row-u-del > .dsh-review-cell-no-u {
  color: var(--review-del-color);
  background: var(--review-del-bg);
  box-shadow: inset -3px 0 0 0 var(--review-del-color);
}
.dsh-review-row-u-del > .dsh-review-cell-txt {
  color: color-mix(in srgb, var(--review-del-color) 88%, var(--dsw-alias-label-primary, var(--fg)));
  background: var(--review-del-bg);
}

/* 折叠条 gapBar */
.dsh-review-gap-bar {
  width: 100%;
  color: var(--review-muted);
  text-align: center;
  cursor: pointer;
  user-select: none;
  background: transparent;
  border: none;
  padding: 4px 12px;
  font-family: inherit;
  font-size: 11.5px;
  font-style: italic;
  display: block;
}
.dsh-review-gap-bar:hover {
  background: var(--review-hover);
  color: var(--review-secondary);
}
`

let styleInjected = false
export function ensureReviewStyle(): void {
  if (styleInjected || typeof document === 'undefined') return
  styleInjected = true
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-git-panel-review'
  tag.textContent = REVIEW_STYLE
  document.head.appendChild(tag)
}
