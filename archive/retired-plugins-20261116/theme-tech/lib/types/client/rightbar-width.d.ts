/**
 * 右侧边栏初始百分比宽度偏好：独立于官方硬编码的 24% 比例。
 *
 * 持久化至 localStorage，在右侧边栏展开时计算视口比例宽度。
 */
/** 默认右侧边栏初始百分比宽度（%）。 */
export declare const DEFAULT_RIGHTBAR_RATIO = 24;
/** 最小可设百分比（%）。低于 15% 在多数视口下小于 300px 会被截断。 */
export declare const RIGHTBAR_RATIO_MIN = 15;
/** 最大可设百分比（%）。避免超出 60% 挤占主内容区。 */
export declare const RIGHTBAR_RATIO_MAX = 60;
/**
 * 夹取百分比数值到合法区间 [15, 60]。
 * @param value - 原始输入值。
 * @returns 夹取后的整数百分比。
 */
export declare function normalizeRightbarRatio(value: unknown): number;
/** 读取已保存的右侧边栏初始百分比宽度（无记录或不可用时回退默认）。 */
export declare function readRightbarRatio(): number;
/** 持久化右侧边栏初始百分比宽度。 */
export declare function writeRightbarRatio(ratio: number): void;
//# sourceMappingURL=rightbar-width.d.ts.map