/**
 * 左侧边栏入口显隐控制与持久化。
 *
 * 目前管两个独立入口：
 * - 自动化任务面板行（`PanelRow`，`aria-label` 为「自动化任务」）
 * - 面板列表的「更多」菜单（`PanelMoreMenu`，`aria-haspopup="menu"`）
 *
 * 两者都是官方 ui-sidebar 渲染的，插件只能在 DOM 上打标记后由 CSS 隐藏。
 * 标记统一写 html + body 双写：浅色兜底调色板挂在 body 上，只写 html 会被层叠覆盖。
 */
/** 自动化任务入口的 localStorage 键。 */
export const SCHEDULE_ENTRY_STORAGE_KEY = 'dsh-show-schedule-entry';
/** 「更多」入口的 localStorage 键。 */
export const MORE_ENTRY_STORAGE_KEY = 'dsh-show-more-entry';
/** 自动化任务入口的隐藏标记属性名。 */
const SCHEDULE_HIDE_ATTR = 'data-dsh-hide-schedule';
/** 「更多」入口的隐藏标记属性名。 */
const MORE_HIDE_ATTR = 'data-dsh-hide-more';
/**
 * 读取一个布尔偏好：只有显式存成 'false' 才算关闭，其余（含未设置）都算开启。
 * @param key - localStorage 键。
 * @returns 是否显示。
 */
function readVisible(key) {
    if (typeof localStorage === 'undefined')
        return true;
    try {
        if (localStorage.getItem(key) === 'false')
            return false;
    }
    catch { }
    return true;
}
/**
 * 持久化一个布尔偏好。
 * @param key - localStorage 键。
 * @param visible - 是否显示。
 */
function writeVisible(key, visible) {
    if (typeof localStorage === 'undefined')
        return;
    try {
        localStorage.setItem(key, visible ? 'true' : 'false');
    }
    catch { }
}
/**
 * 把隐藏标记落到 DOM：隐藏时设属性为 'true'，显示时移除属性。
 * html 与 body 双写，避免层叠与加载时序问题。
 * @param attr - 标记属性名。
 * @param visible - 是否显示。
 */
function applyHideAttr(attr, visible) {
    if (typeof document === 'undefined')
        return;
    const targets = [document.documentElement, document.body];
    for (const el of targets) {
        if (!el)
            continue;
        if (visible)
            el.removeAttribute(attr);
        else
            el.setAttribute(attr, 'true');
    }
}
/**
 * 从 localStorage 读取自动化任务入口是否显示。
 * @returns 默认开启（true）。
 */
export function readScheduleEntryVisible() {
    return readVisible(SCHEDULE_ENTRY_STORAGE_KEY);
}
/**
 * 持久化自动化任务入口显隐状态。
 * @param visible - 是否显示。
 */
export function writeScheduleEntryVisible(visible) {
    writeVisible(SCHEDULE_ENTRY_STORAGE_KEY, visible);
}
/**
 * 将自动化任务入口显隐标记应用至 DOM。
 * @param visible - 是否显示。
 */
export function applyScheduleEntryVisible(visible) {
    applyHideAttr(SCHEDULE_HIDE_ATTR, visible);
}
/**
 * 从 localStorage 读取「更多」入口是否显示。
 * @returns 默认开启（true）。
 */
export function readMoreEntryVisible() {
    return readVisible(MORE_ENTRY_STORAGE_KEY);
}
/**
 * 持久化「更多」入口显隐状态。
 * @param visible - 是否显示。
 */
export function writeMoreEntryVisible(visible) {
    writeVisible(MORE_ENTRY_STORAGE_KEY, visible);
}
/**
 * 将「更多」入口显隐标记应用至 DOM。
 * @param visible - 是否显示。
 */
export function applyMoreEntryVisible(visible) {
    applyHideAttr(MORE_HIDE_ATTR, visible);
}
//# sourceMappingURL=schedule-entry.js.map