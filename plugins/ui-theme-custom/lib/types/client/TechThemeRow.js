import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Tech-theme preference row registered into the General section item slot
 * beside the official Appearance row (id `appearance-custom`, after it).
 * Two cubes — aurora and nebula — rendered only when this plugin mounts, so
 * the official ui-theme package never references the custom theme ids.
 * Selection follows the persisted preference, never the resolved active
 * theme; the ids persist through the official settings scope because
 * `THEME_PREFERENCES` includes them.
 */
import clsx from 'clsx';
import { IconSparkle16, IconThinkOutline16, IconAgentPresetOutline16, IconBrowseOutline16, IconGoalOutline16, IconEnhanceOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TechThemeRow.module.css';
/** Locale namespace registered by this plugin (see src/client/index.ts). */
export const SETTINGS_NS = 'settings.theme.custom';
/** Cube order and icons. Id must match a registered theme id. */
const CUBES = [
    { id: 'aurora', labelKey: 'tech-theme.aurora', Icon: IconSparkle16 },
    { id: 'nebula', labelKey: 'tech-theme.nebula', Icon: IconThinkOutline16 },
    { id: 'void', labelKey: 'tech-theme.void', Icon: IconAgentPresetOutline16 },
    { id: 'jade', labelKey: 'tech-theme.jade', Icon: IconBrowseOutline16 },
    { id: 'solar', labelKey: 'tech-theme.solar', Icon: IconGoalOutline16 },
    { id: 'glacial', labelKey: 'tech-theme.glacial', Icon: IconEnhanceOutline16 },
];
/**
 * Render the tech-theme row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function TechThemeRow({ t, setTheme, useStore }) {
    const preference = useStore(s => s.preference);
    return (_jsxs("div", { className: css.group, children: [_jsx("div", { className: css.title, children: t('tech-theme.title') }), _jsx("div", { className: css.cubeRow, children: CUBES.map(({ id, labelKey, Icon }) => (_jsxs("button", { type: "button", className: clsx(css.themeCube, preference === id && css.selected), "aria-pressed": preference === id, onClick: () => { setTheme(id); }, children: [_jsx(Icon, {}), t(labelKey)] }, id))) })] }));
}
//# sourceMappingURL=TechThemeRow.js.map