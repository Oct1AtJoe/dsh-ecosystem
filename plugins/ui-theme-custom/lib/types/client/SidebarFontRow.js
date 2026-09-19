import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 侧边栏字号偏好行：注册进 General 区的 item 槽，紧邻官方「字号大小」行之后。
 *
 * 为什么单独一行而不是改官方那行：官方 FontSizeRow 属 ui-theme 包，且官方源码
 * 零修改是架构铁律（AGENTS.md 铁律 1）。插件经 settings.general.item 槽位新增
 * 自己的行，与官方行共用同一套视觉节奏。
 *
 * 交互：数字输入框（直接键入）+ 上下步进（微调）。键入非法值在 blur 时夹取回合法值，
 * 因此不会出现空值或越界持久化。
 */
import { useState } from 'react';
import { IconChevronDownOutline14, IconChevronUpOutline14, } from '@deepseek-ai/dsh-client-ui-primitives';
import { SIDEBAR_FONT_MAX, SIDEBAR_FONT_MIN, normalizeSidebarFont } from "./sidebar-font.js";
import css from './SidebarFontRow.module.css';
/**
 * 渲染侧边栏字号行。
 * @param props - 槽位组合 props。
 * @returns 该行的元素树。
 */
export function SidebarFontRow({ t, setSidebarFont, useStore }) {
    const size = useStore(s => s.size);
    // 键入中的草稿：为 null 时显示持久化值。这样用户能清空重打，而不会被
    // 受控值强行回填打断输入。
    const [draft, setDraft] = useState(null);
    const commit = (next) => {
        const clamped = normalizeSidebarFont(next);
        setSidebarFont(clamped);
        setDraft(null);
    };
    const onInput = (e) => {
        // 只接受数字字符，避免出现 NaN 草稿
        const v = e.target.value.replace(/[^\d]/g, '').slice(0, 2);
        setDraft(v);
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
            const v = draft ?? String(size);
            commit(v === '' ? size : Number.parseInt(v, 10));
        }
    };
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('sidebar-font.title') }), _jsx("div", { className: css.desc, children: t('sidebar-font.description') })] }), _jsxs("div", { className: css.control, children: [_jsx("input", { className: css.input, type: "text", inputMode: "numeric", "aria-label": t('sidebar-font.title'), value: draft ?? String(size), onChange: onInput, onBlur: onBlur, onKeyDown: onKeyDown }), _jsx("span", { className: css.unit, children: t('sidebar-font.unit') }), _jsxs("span", { className: css.arrows, children: [_jsx("button", { type: "button", className: css.arrow, "aria-label": t('sidebar-font.increase'), disabled: size >= SIDEBAR_FONT_MAX, onClick: () => { commit(size + 1); }, children: _jsx(IconChevronUpOutline14, { size: 9 }) }), _jsx("button", { type: "button", className: css.arrow, "aria-label": t('sidebar-font.decrease'), disabled: size <= SIDEBAR_FONT_MIN, onClick: () => { commit(size - 1); }, children: _jsx(IconChevronDownOutline14, { size: 9 }) })] })] })] }));
}
//# sourceMappingURL=SidebarFontRow.js.map