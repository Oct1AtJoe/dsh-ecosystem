import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './HomeLayoutRow.module.css';
export function HomeLayoutRow({ t, setLayout, useStore }) {
    const current = useStore(s => s.layout);
    return (_jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: t('home-layout.title') }), _jsx("div", { className: css.desc, children: t('home-layout.description') })] }), _jsxs("div", { className: css.segmented, children: [_jsx("button", { type: "button", className: css.segmentItem, "data-active": current === 'classic' ? '' : undefined, "aria-pressed": current === 'classic', onClick: () => setLayout('classic'), children: t('home-layout.classic') }), _jsx("button", { type: "button", className: css.segmentItem, "data-active": current === 'studio' ? '' : undefined, "aria-pressed": current === 'studio', onClick: () => setLayout('studio'), children: t('home-layout.studio') })] })] }));
}
//# sourceMappingURL=HomeLayoutRow.js.map