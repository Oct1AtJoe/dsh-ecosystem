import type { UsageBuckets } from './types.ts';
export declare const BUCKET_KEYS: (keyof Pick<UsageBuckets, 'input' | 'output' | 'cacheRead' | 'cacheWrite'>)[];
export declare function emptyBuckets(): UsageBuckets;
export declare function addBuckets(target: UsageBuckets, buckets: Partial<UsageBuckets> | null | undefined, sign: number): void;
export declare function dayKey(time: number): string | null;
export declare function foldSession(events: any[]): {
    days: Map<string, UsageBuckets>;
    hours: number[];
};
export declare function listSessionLogs(root: string): {
    id: string;
    path: string;
    size: number;
    mtimeMs: number;
}[];
export declare function readEvents(ctx: any, sessionId: string, logPath?: string): Promise<any[] | null>;
//# sourceMappingURL=usage-fold.d.ts.map