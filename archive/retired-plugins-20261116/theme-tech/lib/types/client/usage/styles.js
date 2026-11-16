export const HOME_USAGE_STYLE_ATTR = 'data-dsh-home-usage-style';
export const HOME_USAGE_CSS = `
/* ui-theme-custom Home Usage Panel Styles */

.dsh-theme-home-seat {
  display: contents;
}

.dsh-theme-home-panel {
  display: none;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  background: var(--dsh-frost-noise, none), var(--dsw-alias-bg-layer-1, rgba(255, 255, 255, 0.88));
  background-repeat: repeat, no-repeat;
  backdrop-filter: var(--dsw-alias-glass-blur, blur(40px));
  -webkit-backdrop-filter: var(--dsw-alias-glass-blur, blur(40px));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: opacity 0.2s ease;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] .dsh-theme-home-panel {
  display: flex;
}

.dsh-theme-home-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dsh-theme-home-tabs,
.dsh-theme-home-ranges {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--dsw-alias-bg-module-platform, rgba(0, 0, 0, 0.04));
  padding: 2px;
  border-radius: 8px;
}

.dsh-theme-home-tab,
.dsh-theme-home-range {
  appearance: none;
  margin: 0;
  padding: 3px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dsh-theme-home-tab:hover:not([data-active]),
.dsh-theme-home-range:hover:not([data-active]) {
  color: var(--dsw-alias-label-primary, #1d1d1f);
}

.dsh-theme-home-tab[data-active],
.dsh-theme-home-range[data-active] {
  background: var(--dsw-alias-bg-layer-2, #ffffff);
  color: var(--dsw-alias-label-primary, #1d1d1f);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.dsh-theme-home-panel-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Stat cells */
.dsh-theme-home-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

@media (max-width: 600px) {
  .dsh-theme-home-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.dsh-theme-home-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-sizing: border-box;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, rgba(0, 0, 0, 0.03));
  border: 1px solid var(--dsw-alias-border-l1, transparent);
}

.dsh-theme-home-stat-label {
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-size: 11px;
  line-height: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dsh-theme-home-stat-value {
  color: var(--dsw-alias-label-primary, #1d1d1f);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

.dsh-theme-home-stat[data-stat="model"] .dsh-theme-home-stat-value {
  font-size: 13px;
  font-weight: 500;
}

/* Heat Grid */
.dsh-theme-home-heat {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-columns: 1fr;
  gap: 3px;
  align-content: start;
  padding: 4px 0;
}

.dsh-theme-home-heat-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.06));
}

.dsh-theme-home-heat-cell[data-tip]:hover:after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  z-index: 10;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--dsw-alias-label-primary, #1d1d1f);
  color: var(--dsw-alias-bg-base, #ffffff);
  font-size: 11px;
  font-weight: 500;
  line-height: 15px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.dsh-theme-home-heat-cell[data-tip][data-edge="start"]:hover:after {
  left: 0;
  transform: none;
}

.dsh-theme-home-heat-cell[data-tip][data-edge="end"]:hover:after {
  left: auto;
  right: 0;
  transform: none;
}

.dsh-theme-home-heat-cell[data-level="1"] {
  background: var(--dsh-heat-step-1, rgba(20, 124, 229, 0.20));
}
.dsh-theme-home-heat-cell[data-level="2"] {
  background: var(--dsh-heat-step-2, rgba(20, 124, 229, 0.45));
}
.dsh-theme-home-heat-cell[data-level="3"] {
  background: var(--dsh-heat-step-3, rgba(20, 124, 229, 0.70));
}
.dsh-theme-home-heat-cell[data-level="4"] {
  background: var(--dsh-heat-step-4, rgba(20, 124, 229, 0.95));
}

.dsh-theme-home-fun {
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-size: 12px;
  line-height: 16px;
  text-align: right;
  padding-top: 2px;
}

/* Chart */
.dsh-theme-home-chart {
  --dsh-home-axis: 38px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.dsh-theme-home-chart-plot {
  position: relative;
  height: 140px;
  margin-left: var(--dsh-home-axis);
}

.dsh-theme-home-chart-tick {
  position: absolute;
  left: calc(-1 * var(--dsh-home-axis));
  width: calc(var(--dsh-home-axis) - 6px);
  transform: translateY(50%);
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-size: 10px;
  line-height: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.dsh-theme-home-chart-bars {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.08));
}

.dsh-theme-home-chart-col {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
  border-radius: 2px 2px 0 0;
  overflow: hidden;
  transition: opacity 0.15s ease;
}

.dsh-theme-home-chart-col:hover {
  opacity: 0.85;
}

.dsh-theme-home-chart-seg {
  display: block;
  width: 100%;
}

.dsh-theme-home-chart-axis {
  display: flex;
  gap: 3px;
  margin-left: var(--dsh-home-axis);
}

.dsh-theme-home-chart-label {
  flex: 1 1 0;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-size: 10px;
  line-height: 14px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Single Day Bar (Today) */
.dsh-theme-home-chart[data-single] .dsh-theme-home-chart-bars,
.dsh-theme-home-chart[data-single] .dsh-theme-home-chart-axis {
  justify-content: center;
}

.dsh-theme-home-chart[data-single] .dsh-theme-home-chart-col {
  flex: 0 0 54px;
  max-width: 54px;
}

.dsh-theme-home-chart[data-single] .dsh-theme-home-chart-label {
  flex: none;
  width: auto;
  text-align: center;
  font-weight: 500;
  font-size: 11px;
}

/* Rank Swatches & Segments */
.dsh-theme-home-chart-seg[data-rank="0"],
.dsh-theme-home-model-swatch[data-rank="0"] { background: var(--dsh-chart-rank-0, #147ce5); }
.dsh-theme-home-chart-seg[data-rank="1"],
.dsh-theme-home-model-swatch[data-rank="1"] { background: var(--dsh-chart-rank-1, #2b8cf0); }
.dsh-theme-home-chart-seg[data-rank="2"],
.dsh-theme-home-model-swatch[data-rank="2"] { background: var(--dsh-chart-rank-2, #4fa2f6); }
.dsh-theme-home-chart-seg[data-rank="3"],
.dsh-theme-home-model-swatch[data-rank="3"] { background: var(--dsh-chart-rank-3, #73b6f8); }
.dsh-theme-home-chart-seg[data-rank="4"],
.dsh-theme-home-model-swatch[data-rank="4"] { background: var(--dsh-chart-rank-4, #98c9fa); }
.dsh-theme-home-chart-seg[data-rank="5"],
.dsh-theme-home-model-swatch[data-rank="5"] { background: var(--dsh-chart-rank-5, #bddcfc); }
.dsh-theme-home-chart-seg[data-rank="6"],
.dsh-theme-home-model-swatch[data-rank="6"] { background: var(--dsh-chart-rank-6, #d5e9fd); }
.dsh-theme-home-chart-seg[data-rank="7"],
.dsh-theme-home-model-swatch[data-rank="7"] { background: var(--dsh-chart-rank-7, #e7f2fe); }

/* Models List */
.dsh-theme-home-models {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.dsh-theme-home-models-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsh-theme-home-models-list[data-expanded] {
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.2)) transparent;
}

.dsh-theme-home-models-list[data-expanded]::-webkit-scrollbar {
  width: 4px;
}

.dsh-theme-home-models-list[data-expanded]::-webkit-scrollbar-track {
  background: transparent;
}

.dsh-theme-home-models-list[data-expanded]::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
}

.dsh-theme-home-model {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 16px;
  transition: background 0.15s ease;
}

.dsh-theme-home-model:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
}

.dsh-theme-home-model-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.dsh-theme-home-model-name {
  flex: 1 1 auto;
  color: var(--dsw-alias-label-primary, #1d1d1f);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-theme-home-model-split {
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}

.dsh-theme-home-model-share {
  color: var(--dsw-alias-label-primary, #1d1d1f);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  width: 44px;
  text-align: right;
}

.dsh-theme-home-models-more {
  appearance: none;
  background: transparent;
  border: 0;
  padding: 6px 8px;
  color: var(--dsw-alias-brand-primary, #147ce5);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.dsh-theme-home-models-more:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
}

.dsh-theme-home-models-empty {
  color: var(--dsw-alias-label-tertiary, #8f8a7e);
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
}

/* Studio Layout Overrides - 优雅纵向居中布局 */
body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_scrollBody"] {
  justify-content: center !important;
  overflow-y: auto !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_composerSeat"] {
  flex: 0 0 auto !important;
  min-height: 0 !important;
  margin: auto 0 !important;
  width: 100% !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_composerStack"][class*="_composerHero"] {
  flex: 0 0 auto !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 720px !important;
  height: auto !important;
  min-height: 0 !important;
  margin: auto !important;
  gap: 12px !important;
  padding: 24px 0 32px !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_composerHero"] > :has([class*="_headline"]) {
  order: 0 !important;
  height: auto !important;
  justify-content: flex-start !important;
  padding: 0 !important;
  margin-bottom: 8px !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"],
body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="titleGroup"] {
  justify-content: flex-start !important;
  align-items: center !important;
}

/* 隐藏官方预览版 Badge */
body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="previewBadge"] {
  display: none !important;
}

/* 标题文本重写为 Better Call Saul */
body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="titleGroup"] > span:not([class*="previewBadge"]) {
  font-size: 0 !important;
  line-height: 0 !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="titleGroup"] > span:not([class*="previewBadge"])::after {
  content: "Better Call Saul";
  font-size: 24px !important;
  font-weight: 700 !important;
  line-height: 30px !important;
  letter-spacing: -0.02em !important;
  color: var(--dsw-alias-label-primary, #1d1d1f) !important;
}

/* Better Call Saul 指弹图标微动 */
body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="fishHitbox"] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 36px !important;
  height: 36px !important;
  cursor: pointer !important;
  color: var(--dsw-alias-brand-primary, #147ce5) !important;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="fishHitbox"]:hover {
  transform: scale(1.08) rotate(-4deg);
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_headline"] [class*="fishHitbox"]:hover .dsh-saul-sparkle {
  transform: scale(1.3) rotate(15deg);
  transform-origin: 29px 13px;
  transition: transform 0.25s ease-out;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_composerHero"] > :is([data-slot="conversation.input.dock"], .dsh-theme-home-seat) > * {
  order: 1 !important;
  flex: 0 1 auto !important;
  min-height: 0 !important;
  width: 100% !important;
  max-width: 720px !important;
  margin: 0 auto !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_composerHero"] > [class*="_heroWorkspaceRow"] {
  order: 2 !important;
  margin-top: 84px !important;
  gap: 8px !important;
}

body[data-dsh-home-layout="studio"][data-dsh-home-hero] [class*="_composerHero"] > [data-slot="conversation.composer.bar"] > * {
  order: 3 !important;
}
`;
export function injectHomeUsageStyles() {
    if (typeof document === 'undefined')
        return () => { };
    if (document.head.querySelector(`style[${HOME_USAGE_STYLE_ATTR}]`) !== null)
        return () => { };
    const tag = document.createElement('style');
    tag.setAttribute(HOME_USAGE_STYLE_ATTR, '');
    tag.textContent = HOME_USAGE_CSS;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
}
//# sourceMappingURL=styles.js.map