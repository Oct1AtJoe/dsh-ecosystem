import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './ScheduleEntryRow.module.css';
/**
 * 渲染自动化任务入口显隐偏好行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function ScheduleEntryRow({ t, setScheduleEntryVisible, useStore }) {
    const visible = useStore(s => s.visible);
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('schedule-entry.title') }), _jsx("div", { className: css.desc, children: t('schedule-entry.description') })] }), _jsx("div", { className: css.control, children: _jsx("button", { type: "button", role: "switch", "aria-checked": visible, "aria-label": t('schedule-entry.title'), className: css.switch, onClick: () => { setScheduleEntryVisible(!visible); }, children: _jsx("span", { className: css.thumb }) }) })] }));
}
//# sourceMappingURL=ScheduleEntryRow.js.map