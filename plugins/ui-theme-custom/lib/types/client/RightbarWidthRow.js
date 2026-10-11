import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 右侧边栏初始百分比宽度偏好行：注册进 General 区的 item 槽，紧随「输入框挂件」行之后。
 *
 * 交互：数字输入框（直接键入）+ 上下步进微调（±1%）。键入非法值在 blur 时夹取回合法值。
 */
import { useState } from 'react';
import { IconChevronDownOutline14, IconChevronUpOutline14, } from '@deepseek-ai/dsh-client-ui-primitives';
import { RIGHTBAR_RATIO_MAX, RIGHTBAR_RATIO_MIN, normalizeRightbarRatio } from "./rightbar-width.js";
import css from './RightbarWidthRow.module.css';
/**
 * 渲染右侧边栏初始百分比宽度行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function RightbarWidthRow({ t, setRightbarRatio, useStore }) {
    const ratio = useStore(s => s.ratio);
    const [draft, setDraft] = useState(null);
    const commit = (next) => {
        const clamped = normalizeRightbarRatio(next);
        setRightbarRatio(clamped);
        setDraft(null);
    };
    const onInput = (e) => {
        const v = e.target.value.replace(/[^\d]/g, '').slice(0, 2);
        setDraft(v);
        if (v.length === 2) {
            const num = Number.parseInt(v, 10);
            if (!Number.isNaN(num) && num >= RIGHTBAR_RATIO_MIN && num <= RIGHTBAR_RATIO_MAX) {
                setRightbarRatio(num);
            }
        }
    };
    const onBlur = () => {
        if (draft === null)
            return;
        if (draft === '') {
            setDraft(null);
            return;
        }
        commit(Number.parseInt(draft, 10));
    };
    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const v = draft ?? String(ratio);
            commit(v === '' ? ratio : Number.parseInt(v, 10));
        }
    };
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('rightbar-width.title') }), _jsx("div", { className: css.desc, children: t('rightbar-width.description') })] }), _jsxs("div", { className: css.control, children: [_jsxs("div", { className: css.stepper, children: [_jsx("input", { className: css.value, type: "text", inputMode: "numeric", "aria-label": t('rightbar-width.title'), value: draft ?? String(ratio), onChange: onInput, onBlur: onBlur, onKeyDown: onKeyDown }), _jsxs("span", { className: css.arrows, children: [_jsx("button", { type: "button", className: css.arrow, "aria-label": t('rightbar-width.increase'), disabled: ratio >= RIGHTBAR_RATIO_MAX, onClick: () => { commit(ratio + 1); }, children: _jsx(IconChevronUpOutline14, { size: 9 }) }), _jsx("button", { type: "button", className: css.arrow, "aria-label": t('rightbar-width.decrease'), disabled: ratio <= RIGHTBAR_RATIO_MIN, onClick: () => { commit(ratio - 1); }, children: _jsx(IconChevronDownOutline14, { size: 9 }) })] })] }), _jsx("span", { className: css.unit, children: t('rightbar-width.unit') })] })] }));
}
//# sourceMappingURL=RightbarWidthRow.js.map