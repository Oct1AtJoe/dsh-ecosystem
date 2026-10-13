import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { HOME_MODEL_ROWS, formatCompactTokens, formatHomeCount, homeShortDate, } from "./data.js";
const RANK_LAST = 7;
function share(part, whole) {
    return whole > 0 ? `${((Math.round((part / whole) * 1000) / 10)).toFixed(1)}%` : '—';
}
function axisMax(peak) {
    if (!(peak > 0))
        return 0;
    const magnitude = Math.pow(10, Math.floor(Math.log(peak) / Math.LN10));
    const scaled = peak / magnitude;
    const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
    return step * magnitude;
}
function sides(entry) {
    return {
        input: (entry.input || 0) + (entry.cacheRead || 0) + (entry.cacheWrite || 0),
        output: entry.output || 0,
    };
}
function hasSplit(entry) {
    return entry.input !== undefined || entry.output !== undefined
        || entry.cacheRead !== undefined || entry.cacheWrite !== undefined;
}
export function ModelChart({ columns, rankOf, skeleton, }) {
    let peak = 0;
    const list = columns || [];
    for (let c = 0; c < list.length; c++) {
        const col = list[c];
        if (!col)
            continue;
        let total = 0;
        const models = col.models;
        for (const id in models)
            total += models[id] ?? 0;
        if (total > peak)
            peak = total;
    }
    const top = axisMax(peak);
    const ticks = [1, 0.75, 0.5, 0.25, 0];
    const isSingle = list.length === 1;
    return (_jsxs("div", { className: "dsh-theme-home-chart", "data-skeleton": skeleton ? '' : undefined, "data-single": isSingle ? '' : undefined, children: [_jsxs("div", { className: "dsh-theme-home-chart-plot", children: [ticks.map(at => (_jsx("span", { className: "dsh-theme-home-chart-tick", style: { bottom: `${at * 100}%` }, children: skeleton || top === 0 ? '' : formatCompactTokens(top * at) }, at))), _jsx("div", { className: "dsh-theme-home-chart-bars", children: list.map(column => {
                            if (!column)
                                return null;
                            let dayTotal = 0;
                            const stack = [];
                            const models = column.models;
                            for (const id in models) {
                                const tokens = models[id] ?? 0;
                                dayTotal += tokens;
                                const rank = rankOf[id];
                                stack.push({ id, tokens, rank: rank === undefined ? Number.MAX_VALUE : rank });
                            }
                            stack.sort((a, b) => a.rank - b.rank);
                            return (_jsx("span", { className: "dsh-theme-home-chart-col", title: isSingle
                                    ? `今日用量 · ${formatCompactTokens(dayTotal)}`
                                    : `${homeShortDate(column.date)} · ${formatCompactTokens(dayTotal)}`, style: { height: `${top > 0 ? (dayTotal / top) * 100 : 0}%` }, children: stack.map(slice => (_jsx("span", { className: "dsh-theme-home-chart-seg", "data-rank": Math.min(slice.rank, RANK_LAST), style: { height: `${dayTotal > 0 ? (slice.tokens / dayTotal) * 100 : 0}%` } }, slice.id))) }, column.date));
                        }) })] }), _jsx("div", { className: "dsh-theme-home-chart-axis", children: list.map((column, index) => {
                    if (!column)
                        return null;
                    const text = isSingle
                        ? `今日 (${homeShortDate(column.date)})`
                        : (list.length <= 7 || index % 3 === 0 ? homeShortDate(column.date) : '');
                    return (_jsx("span", { className: "dsh-theme-home-chart-label", children: text }, column.date));
                }) })] }));
}
export function ModelsView({ data }) {
    const [expanded, setExpanded] = React.useState(false);
    const models = data.models;
    const columns = data.modelDays;
    const skeleton = !data.known;
    if (!models || models.length === 0) {
        if (data.listed !== null || !skeleton) {
            return _jsx("div", { className: "dsh-theme-home-models-empty", children: "\u6682\u65E0\u6A21\u578B\u7528\u91CF\u6570\u636E" });
        }
        return (_jsxs(_Fragment, { children: [_jsx(ModelChart, { columns: null, rankOf: {}, skeleton: true }), _jsx("div", { className: "dsh-theme-home-models", "data-skeleton": "", children: [0, 1, 2].map(index => (_jsxs("div", { className: "dsh-theme-home-model", children: [_jsx("span", { className: "dsh-theme-home-model-swatch" }), _jsx("span", { className: "dsh-theme-home-model-name" }), _jsx("span", { className: "dsh-theme-home-model-split" }), _jsx("span", { className: "dsh-theme-home-model-share" })] }, index))) })] }));
    }
    let total = 0;
    const rankOf = {};
    for (let i = 0; i < models.length; i++) {
        const item = models[i];
        if (!item)
            continue;
        total += item.tokens;
        rankOf[item.id] = i;
    }
    const shown = expanded ? models : models.slice(0, HOME_MODEL_ROWS);
    const hidden = models.length - shown.length;
    return (_jsxs(_Fragment, { children: [columns === null && !skeleton ? null : (_jsx(ModelChart, { columns: columns, rankOf: rankOf, skeleton: skeleton })), _jsxs("div", { className: "dsh-theme-home-models", children: [_jsx("div", { className: "dsh-theme-home-models-list", "data-expanded": expanded ? '' : undefined, children: shown.map((entry, rank) => {
                            if (!entry)
                                return null;
                            const parts = sides(entry);
                            return (_jsxs("div", { className: "dsh-theme-home-model", title: entry.sessions === undefined
                                    ? entry.id
                                    : `${entry.id} · ${formatHomeCount(entry.sessions)} 会话`, children: [_jsx("span", { className: "dsh-theme-home-model-swatch", "data-rank": Math.min(rank, RANK_LAST) }), _jsx("span", { className: "dsh-theme-home-model-name", children: entry.id }), _jsx("span", { className: "dsh-theme-home-model-split", children: hasSplit(entry)
                                            ? `${formatCompactTokens(parts.input)} 入 · ${formatCompactTokens(parts.output)} 出`
                                            : formatCompactTokens(entry.tokens) }), _jsx("span", { className: "dsh-theme-home-model-share", children: share(entry.tokens, total) })] }, entry.id));
                        }) }), models.length <= HOME_MODEL_ROWS ? null : (_jsx("button", { type: "button", className: "dsh-theme-home-models-more", "aria-expanded": expanded, onClick: () => setExpanded(!expanded), children: expanded ? '收起' : `展开更多 ${hidden} 个模型` }))] })] }));
}
//# sourceMappingURL=models.js.map