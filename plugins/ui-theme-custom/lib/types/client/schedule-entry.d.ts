/**
 * 左侧边栏自动化任务入口显隐控制与持久化。
 */
export declare const SCHEDULE_ENTRY_STORAGE_KEY = "dsh-show-schedule-entry";
/**
 * 从 localStorage 读取自动化任务入口是否显示。
 * 默认开启（true）。
 */
export declare function readScheduleEntryVisible(): boolean;
/**
 * 持久化自动化任务入口显隐状态。
 */
export declare function writeScheduleEntryVisible(visible: boolean): void;
/**
 * 将显隐标记应用至 DOM（html 与 body 双写，防止层叠与加载时序问题）。
 */
export declare function applyScheduleEntryVisible(visible: boolean): void;
//# sourceMappingURL=schedule-entry.d.ts.map