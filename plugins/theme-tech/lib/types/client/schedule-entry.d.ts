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
export declare const SCHEDULE_ENTRY_STORAGE_KEY = "dsh-show-schedule-entry";
/** 「更多」入口的 localStorage 键。 */
export declare const MORE_ENTRY_STORAGE_KEY = "dsh-show-more-entry";
/**
 * 从 localStorage 读取自动化任务入口是否显示。
 * @returns 默认开启（true）。
 */
export declare function readScheduleEntryVisible(): boolean;
/**
 * 持久化自动化任务入口显隐状态。
 * @param visible - 是否显示。
 */
export declare function writeScheduleEntryVisible(visible: boolean): void;
/**
 * 将自动化任务入口显隐标记应用至 DOM。
 * @param visible - 是否显示。
 */
export declare function applyScheduleEntryVisible(visible: boolean): void;
/**
 * 从 localStorage 读取「更多」入口是否显示。
 * @returns 默认开启（true）。
 */
export declare function readMoreEntryVisible(): boolean;
/**
 * 持久化「更多」入口显隐状态。
 * @param visible - 是否显示。
 */
export declare function writeMoreEntryVisible(visible: boolean): void;
/**
 * 将「更多」入口显隐标记应用至 DOM。
 * @param visible - 是否显示。
 */
export declare function applyMoreEntryVisible(visible: boolean): void;
//# sourceMappingURL=schedule-entry.d.ts.map