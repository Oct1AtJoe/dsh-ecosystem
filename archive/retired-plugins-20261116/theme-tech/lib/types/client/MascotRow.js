import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './MascotRow.module.css';
/**
 * 渲染输入框挂件偏好行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function MascotRow({ t, setMascotEnabled, useStore }) {
    const enabled = useStore(s => s.enabled);
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('mascot.title') }), _jsx("div", { className: css.desc, children: t('mascot.description') })] }), _jsx("div", { className: css.control, children: _jsx("button", { type: "button", role: "switch", "aria-checked": enabled, "aria-label": t('mascot.title'), className: css.switch, onClick: () => { setMascotEnabled(!enabled); }, children: _jsx("span", { className: css.thumb }) }) })] }));
}
//# sourceMappingURL=MascotRow.js.map