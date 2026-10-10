import type { Context } from '@deepseek-ai/cordis';
export declare const MASCOT_STORAGE_KEY = "dsh-claude-mascot-enabled";
/** 读取挂件启用状态（默认开启）。 */
export declare function readMascotEnabled(): boolean;
/** 写入挂件启用状态。 */
export declare function writeMascotEnabled(value: boolean): void;
/** 通知挂件开关变化。 */
export declare function notifyMascotChange(enabled: boolean): void;
export declare function initMascot(ctx: Context): () => void;
//# sourceMappingURL=mascot.d.ts.map