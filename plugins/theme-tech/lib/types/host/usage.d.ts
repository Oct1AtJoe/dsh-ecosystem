import type { UsageReport } from './types.ts';
export declare function createUsage(ctx: any): {
    snapshot(): {
        ok: boolean;
        value: null;
        computing: boolean;
        error?: never;
    } | {
        ok: boolean;
        value: UsageReport | null;
        computing: boolean;
        error: string | undefined;
    };
    refresh: () => Promise<UsageReport | null>;
    dispose(): void;
};
//# sourceMappingURL=usage.d.ts.map