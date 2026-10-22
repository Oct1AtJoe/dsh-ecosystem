/**
 * 左侧边栏自动化任务入口显隐控制与持久化。
 */
export const SCHEDULE_ENTRY_STORAGE_KEY = 'dsh-show-schedule-entry';
/**
 * 从 localStorage 读取自动化任务入口是否显示。
 * 默认开启（true）。
 */
export function readScheduleEntryVisible() {
    if (typeof localStorage === 'undefined')
        return true;
    try {
        const val = localStorage.getItem(SCHEDULE_ENTRY_STORAGE_KEY);
        if (val === 'false')
            return false;
    }
    catch { }
    return true;
}
/**
 * 持久化自动化任务入口显隐状态。
 */
export function writeScheduleEntryVisible(visible) {
    if (typeof localStorage === 'undefined')
        return;
    try {
        localStorage.setItem(SCHEDULE_ENTRY_STORAGE_KEY, visible ? 'true' : 'false');
    }
    catch { }
}
/**
 * 将显隐标记应用至 DOM（html 与 body 双写，防止层叠与加载时序问题）。
 */
export function applyScheduleEntryVisible(visible) {
    if (typeof document === 'undefined')
        return;
    const targets = [document.documentElement, document.body];
    for (const el of targets) {
        if (!el)
            continue;
        if (visible) {
            el.removeAttribute('data-dsh-hide-schedule');
        }
        else {
            el.setAttribute('data-dsh-hide-schedule', 'true');
        }
    }
}
//# sourceMappingURL=schedule-entry.js.map