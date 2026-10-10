import type { Context } from '@deepseek-ai/cordis';
export declare const MASCOT_STORAGE_KEY = "dsh-claude-mascot-enabled";
/** 读取挂件启用状态（默认开启）。 */
export declare function readMascotEnabled(): boolean;
/** 写入挂件启用状态。 */
export declare function writeMascotEnabled(value: boolean): void;
/** 通知挂件开关变化。 */
export declare function notifyMascotChange(enabled: boolean): void;
/**
 * 输入框上方的像素小伙伴挂件。
 *
 * 素材是一组「单行 8 列」雪碧图（见 pet-data.ts）：每个动作一张条带，
 * 每帧固定 PET_CELL_W x PET_CELL_H，逐帧平移窗口即为动画。
 * 播放走 WAAPI steps 关键帧，期间无定时器、无 DOM 变更。
 *
 * 站位：首页站在输入卡片上沿；对话页站在 composerStack 顶端，
 * 因此上方出现排队消息、目标任务或待办卡片时会自动上移到它们之上。
 * 读屏者要求减少动态效果时停在静止帧。
 *
 * @param ctx - 客户端根上下文。
 * @returns 释放函数。
 */
export declare function initMascot(ctx: Context): () => void;
//# sourceMappingURL=mascot.d.ts.map