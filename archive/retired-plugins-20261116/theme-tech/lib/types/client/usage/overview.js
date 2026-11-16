import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { formatCompactTokens, formatHomeCount, homeShortDate, } from "./data.js";
const HOME_TIP_EDGE = 3;
function statCell(key, label, text, skeleton) {
    return (_jsxs("div", { className: "dsh-theme-home-stat", "data-stat": key, "data-skeleton": skeleton ? '' : undefined, children: [_jsx("span", { className: "dsh-theme-home-stat-label", children: label }), _jsx("span", { className: "dsh-theme-home-stat-value", title: skeleton ? undefined : text, children: skeleton ? '' : text })] }, key));
}
function heatTip(cell) {
    const date = homeShortDate(cell.date);
    if (cell.messages !== null)
        return `${date} — ${formatHomeCount(cell.messages)} 消息`;
    return `${date} — ${formatCompactTokens(cell.tokens)} tokens`;
}
export function OverviewView({ data }) {
    const skeleton = !data.known;
    const columns = Math.ceil(data.grid.cells.length / 7);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "dsh-theme-home-stats", children: [statCell('sessions', '会话数', data.sessions === null ? '—' : formatHomeCount(data.sessions), skeleton), statCell('calls', '消息数', data.calls === null ? '—' : formatHomeCount(data.calls), skeleton), statCell('tokens', '总 Tokens', formatCompactTokens(data.tokens), skeleton), statCell('days', '活跃天数', data.activeDays === null ? '—' : formatHomeCount(data.activeDays), skeleton), statCell('peak', '高峰时段', data.peakHour === null ? '—' : data.peakHour, skeleton), statCell('model', '最常用模型', data.model === null ? '—' : data.model, skeleton)] }), _jsx("div", { className: "dsh-theme-home-heat", "data-skeleton": data.known ? undefined : '', children: data.grid.cells.map((cell, index) => {
                    const tip = skeleton ? undefined : heatTip(cell);
                    const column = Math.floor(index / 7);
                    const edge = column < HOME_TIP_EDGE ? 'start' : column >= columns - HOME_TIP_EDGE ? 'end' : undefined;
                    return (_jsx("span", { className: "dsh-theme-home-heat-cell", "data-level": cell.level, "data-tip": tip, "data-edge": edge, "aria-label": tip }, cell.date));
                }) }), data.fun === null ? null : (_jsx("span", { className: "dsh-theme-home-fun", children: data.fun }))] }));
}
//# sourceMappingURL=overview.js.map