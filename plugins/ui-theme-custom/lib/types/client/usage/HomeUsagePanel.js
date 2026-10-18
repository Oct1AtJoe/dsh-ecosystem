import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { HOME_RANGES, homePanelData, } from "./data.js";
import { ModelsView } from "./models.js";
import { OverviewView } from "./overview.js";
function checkHeroPhase() {
    if (typeof document === 'undefined')
        return false;
    // Same authoritative signals as the host-side probe. A `[class*="_headline"]`
    // fallback must NOT be used here: the context-usage popover renders its own
    // `<span class="…_headline">`, which falsely reported hero on a normal
    // conversation and let this panel render behind that popover.
    return document.querySelector('[data-phase="hero"]') !== null
        || document.querySelector('[class*="_composerHero"]') !== null
        || document.querySelector('[class*="composerHero"]') !== null;
}
function checkLayout() {
    try {
        return localStorage.getItem('dsh-home-layout') || 'studio';
    }
    catch {
        return 'studio';
    }
}
export function HomeUsagePanel({ usage, bookPick = 0.5, isHero, layout, }) {
    const [, bump] = React.useState(0);
    const [tab, setTab] = React.useState('overview');
    const [range, setRange] = React.useState('today');
    React.useEffect(() => {
        return usage.subscribe(() => {
            bump(c => c + 1);
        });
    }, [usage]);
    const effectiveLayout = layout ?? checkLayout();
    const effectiveHero = isHero ?? checkHeroPhase();
    if (effectiveLayout !== 'studio' || !effectiveHero) {
        return null;
    }
    const state = usage.state();
    const data = homePanelData(state, usage.list(), range, bookPick);
    return (_jsxs("section", { className: "dsh-theme-home-panel", "data-computing": state.computing ? '' : undefined, "aria-busy": state.computing || !data.known ? 'true' : 'false', children: [_jsxs("div", { className: "dsh-theme-home-panel-head", children: [_jsxs("div", { className: "dsh-theme-home-tabs", children: [_jsx("button", { type: "button", className: "dsh-theme-home-tab", "data-active": tab === 'overview' ? '' : undefined, "aria-pressed": tab === 'overview', onClick: () => setTab('overview'), children: "\u6982\u89C8" }), _jsx("button", { type: "button", className: "dsh-theme-home-tab", "data-active": tab === 'models' ? '' : undefined, "aria-pressed": tab === 'models', onClick: () => setTab('models'), children: "\u6A21\u578B" })] }), _jsx("div", { className: "dsh-theme-home-panel-side", children: _jsx("div", { className: "dsh-theme-home-ranges", children: HOME_RANGES.map(item => (_jsx("button", { type: "button", className: "dsh-theme-home-range", "data-active": range === item.id ? '' : undefined, "aria-pressed": range === item.id, onClick: () => setRange(item.id), children: item.label }, item.id))) }) })] }), tab === 'models' ? (_jsx(ModelsView, { data: data })) : (_jsx(OverviewView, { data: data }))] }));
}
//# sourceMappingURL=HomeUsagePanel.js.map