/**
 * 右侧边栏初始百分比宽度偏好：独立于官方硬编码的 24% 比例。
 *
 * 持久化至 localStorage，在右侧边栏展开时计算视口比例宽度。
 */
const KEY = 'dsh-rightbar-width-ratio';
/** 默认右侧边栏初始百分比宽度（%）。 */
export const DEFAULT_RIGHTBAR_RATIO = 24;
/** 最小可设百分比（%）。低于 15% 在多数视口下小于 300px 会被截断。 */
export const RIGHTBAR_RATIO_MIN = 15;
/** 最大可设百分比（%）。避免超出 60% 挤占主内容区。 */
export const RIGHTBAR_RATIO_MAX = 60;
/**
 * 夹取百分比数值到合法区间 [15, 60]。
 * @param value - 原始输入值。
 * @returns 夹取后的整数百分比。
 */
export function normalizeRightbarRatio(value) {
    const num = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
    if (Number.isNaN(num))
        return DEFAULT_RIGHTBAR_RATIO;
    return Math.min(RIGHTBAR_RATIO_MAX, Math.max(RIGHTBAR_RATIO_MIN, Math.round(num)));
}
/** 读取已保存的右侧边栏初始百分比宽度（无记录或不可用时回退默认）。 */
export function readRightbarRatio() {
    if (typeof localStorage === 'undefined')
        return DEFAULT_RIGHTBAR_RATIO;
    try {
        const raw = localStorage.getItem(KEY);
        if (raw === null || raw === '')
            return DEFAULT_RIGHTBAR_RATIO;
        return normalizeRightbarRatio(raw);
    }
    catch {
        return DEFAULT_RIGHTBAR_RATIO;
    }
}
/** 持久化右侧边栏初始百分比宽度。 */
export function writeRightbarRatio(ratio) {
    if (typeof localStorage === 'undefined')
        return;
    try {
        localStorage.setItem(KEY, String(normalizeRightbarRatio(ratio)));
    }
    catch {
        /* 隐私模式等异常静默处理 */
    }
}
//# sourceMappingURL=rightbar-width.js.map