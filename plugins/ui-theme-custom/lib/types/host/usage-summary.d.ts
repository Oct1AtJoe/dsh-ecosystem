import type { StoredSession, UsageBuckets, UsageReport } from './types.ts';
export declare function mergeSessions(sessions: Map<string, StoredSession>): {
    days: Map<string, UsageBuckets>;
    sessionCount: number;
    hours: number[];
};
export declare function summarize(days: Map<string, UsageBuckets>, sessionCount: number, source: string, hours?: number[], extra?: {
    sessionIds?: Set<string>;
}): UsageReport;
//# sourceMappingURL=usage-summary.d.ts.map