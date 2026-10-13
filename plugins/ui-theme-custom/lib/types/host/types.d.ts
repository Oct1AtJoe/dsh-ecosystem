export interface UsageBuckets {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    calls: number;
    total?: number;
    hours?: number[] | undefined;
    models?: Map<string, UsageBuckets> | undefined;
    sessions?: number | Set<string> | undefined;
    sessionIds?: string[] | undefined;
}
export interface StoredSession {
    size: number;
    mtimeMs: number;
    days: Map<string, UsageBuckets>;
    hours: number[];
}
export interface UsageDayModelDetail {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    tokens: number;
}
export interface UsageDaySummary {
    date: string;
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    calls: number;
    sessions: number;
    sessionIds: string[];
    models?: Record<string, number> | undefined;
    modelDetails?: Record<string, UsageDayModelDetail> | undefined;
    hours?: number[] | undefined;
}
export interface UsageModelSummary {
    id: string;
    tokens: number;
    input?: number | undefined;
    output?: number | undefined;
    cacheRead?: number | undefined;
    cacheWrite?: number | undefined;
    sessions?: number | undefined;
    lastAt?: number | undefined;
}
export interface UsageReport {
    source: string;
    computedAt: number;
    days: UsageDaySummary[];
    models: UsageModelSummary[];
    firstDay: string | null;
    lastDay: string | null;
    model?: string | undefined;
    hours?: number[] | undefined;
    totals: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
        calls: number;
        sessions: number;
        activeDays: number;
    };
    read?: number | undefined;
    failed?: number | undefined;
    unavailable?: boolean | undefined;
    reason?: string | undefined;
}
//# sourceMappingURL=types.d.ts.map